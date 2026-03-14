'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import * as fabric from 'fabric';
import { getTeamById } from '@/lib/templates/soccer-fixtures/teams';
import { getLeagueById } from '@/lib/templates/halftime-score/leagues';
import { applyBgBlur } from '@/lib/fabricUtils';

export interface HalftimeScoreFields {
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  homeOdds: string;
  awayOdds: string;
  status: string;
  league: string;
}

export interface HalftimeScoreCanvasHandle {
  exportImage: (format: 'png' | 'jpeg', quality?: number) => string | null;
  resetFraming: () => void;
  zoomTo: (level: number) => void;
  getPreview: () => string | null;
}

// Native canvas dimensions
const CW = 1080;
const CH = 1080;

// Layout constants (native coords) — from Paper design
const LOCKUP_X = 45;
const LOCKUP_Y = 23;
const LOCKUP_W = 188;

const STATUS_FONT_SIZE = 47;

const SCORE_FONT_SIZE = 200;

// (Column positions are computed as absolute values in buildOverlays)

const LEAGUE_LOGO_W = 202;
const LEAGUE_LOGO_H = 206;

const PILL_W = 286;
const PILL_H = 138;
const PILL_R = 35;
const PILL_BORDER_H = 10;
const PILL_FONT_SIZE = 45;

const PRED_ICON_W = 133;
const PRED_ICON_H = 131;
const PRED_ICON_R = 26;
const PRED_ICON_BORDER_H = 9;

const CLAMP_MARGIN = 0.50;

// Badge cache
const badgeCache = new Map<string, HTMLImageElement>();

async function loadImageCached(url: string): Promise<fabric.FabricImage | null> {
  const cached = badgeCache.get(url);
  if (cached) {
    return new fabric.FabricImage(cached);
  }
  try {
    const img = await fabric.FabricImage.fromURL(url);
    badgeCache.set(url, img.getElement() as HTMLImageElement);
    return img;
  } catch {
    return null;
  }
}

function clampBg(img: fabric.FabricImage, cw: number, ch: number) {
  const mx = cw * CLAMP_MARGIN;
  const my = ch * CLAMP_MARGIN;
  const left = Math.min(mx, Math.max(cw - img.getScaledWidth() - mx, img.left!));
  const top = Math.min(my, Math.max(ch - img.getScaledHeight() - my, img.top!));
  img.set({ left, top });
}

function getTeamAbbr(teamId: string, teamName: string): string {
  // Common abbreviations map
  const abbrMap: Record<string, string> = {
    'mancity': 'MCI', 'manutd': 'MUN', 'arsenal': 'ARS', 'chelsea': 'CHE',
    'liverpool': 'LIV', 'tottenham': 'TOT', 'newcastle': 'NEW', 'brighton': 'BHA',
    'astonvilla': 'AVL', 'westham': 'WHU', 'crystalpalace': 'CRY', 'nottmforest': 'NFO',
    'bournemouth': 'BOU', 'fulham': 'FUL', 'wolves': 'WOL', 'brentford': 'BRE',
    'everton': 'EVE', 'leicester': 'LEI', 'southampton': 'SOU', 'ipswich': 'IPS',
    'barcelona': 'BAR', 'realmadrid': 'RMA', 'atletico': 'ATM', 'betis': 'BET',
    'villarreal': 'VIL', 'realsociedad': 'RSO', 'sevilla': 'SEV', 'athletic': 'ATH',
    'athleticbilbao': 'ATH', 'valencia': 'VAL', 'celtavigo': 'CEL',
    'bayernmunich': 'BAY', 'dortmund': 'BVB', 'leverkusen': 'LEV', 'rbleipzig': 'RBL',
    'psg': 'PSG', 'marseille': 'MAR', 'lyon': 'LYO', 'monaco': 'MON',
    'juventus': 'JUV', 'acmilan': 'MIL', 'intermilan': 'INT', 'napoli': 'NAP', 'roma': 'ROM',
    'benfica': 'BEN', 'porto': 'POR', 'sportingcp': 'SCP',
    'galatasaray': 'GAL', 'fenerbahce': 'FEN', 'besiktas': 'BJK',
    'ajax': 'AJA', 'psv': 'PSV', 'feyenoord': 'FEY',
    'celtic': 'CEL', 'rangers': 'RAN',
  };
  return abbrMap[teamId] || teamName.slice(0, 3).toUpperCase();
}

const HalftimeScoreCanvas = forwardRef<HalftimeScoreCanvasHandle, {
  fields: HalftimeScoreFields;
  imageDataUrl: string | null;
  bgBlur?: number;
  onZoomChange?: (zoom: number) => void;
  onCanvasUpdate?: () => void;
}>(function HalftimeScoreCanvas({ fields, imageDataUrl, bgBlur = 0, onZoomChange, onCanvasUpdate }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const dsRef = useRef(1);
  const zoomRef = useRef(1);
  const bgRef = useRef<fabric.FabricImage | null>(null);
  const buildIdRef = useRef(0);

  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const imageUrlRef = useRef(imageDataUrl);
  imageUrlRef.current = imageDataUrl;

  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [fontsReady, setFontsReady] = useState(false);

  // Load fonts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fontLoads: Promise<ArrayBuffer>[] = [
          fetch('/fonts/Geist-SemiBold.woff2').then(r => r.arrayBuffer()),
          fetch('/fonts/Geist-Bold.woff2').then(r => r.arrayBuffer()),
          fetch('/fonts/Geist-Black.woff2').then(r => r.arrayBuffer()),
        ];
        const [bufSemiBold, bufBold, bufBlack] = await Promise.all(fontLoads);
        if (cancelled) return;

        const geistFonts = [
          new FontFace('Geist', bufSemiBold, { weight: '600' }),
          new FontFace('Geist', bufBold, { weight: '700' }),
          new FontFace('Geist', bufBlack, { weight: '800' }), // Geist-Black is weight class 800
        ];

        // Barlow Condensed Black Italic
        const barlowFont = new FontFace(
          'Barlow Condensed',
          'url(https://fonts.gstatic.com/s/barlowcondensed/v13/HTxyL3I-JCGChYJ8VI-L6OO_au7B6xTrW3bmu4kG.woff2)',
          { weight: '900', style: 'italic' }
        );

        const loaded = await Promise.all([...geistFonts.map(f => f.load()), barlowFont.load()]);
        if (cancelled) return;
        loaded.forEach(f => document.fonts.add(f));
      } catch (err) {
        console.warn('Font load failed:', err);
      }
      if (!cancelled) setFontsReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Init Fabric canvas
  useEffect(() => {
    if (!canvasElRef.current || fabricRef.current) return;
    const c = new fabric.Canvas(canvasElRef.current, {
      backgroundColor: '#0D0D0D',
      selection: false,
    });
    fabricRef.current = c;
    c.on('object:moving', (e) => {
      if (e.target === bgRef.current) clampBg(e.target as fabric.FabricImage, c.getWidth(), c.getHeight());
    });
    c.on('mouse:up', () => onCanvasUpdate?.());
    return () => { c.dispose(); fabricRef.current = null; };
  }, []);

  // Scroll-to-zoom
  useEffect(() => {
    const el = canvasElRef.current?.parentElement;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const c = fabricRef.current;
      const bg = bgRef.current;
      if (!c || !bg) return;
      const cur = zoomRef.current;
      const nz = Math.min(5, Math.max(1, cur * (1 - e.deltaY * 0.001)));
      if (nz === cur) return;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const os = dsRef.current * cur, ns = dsRef.current * nz;
      const coverBase = Math.max(CW / bg.width!, CH / bg.height!);
      zoomRef.current = nz;
      bg.set({
        scaleX: coverBase * ns, scaleY: coverBase * ns,
        left: mx - (mx - bg.left!) * (ns / os),
        top: my - (my - bg.top!) * (ns / os),
      });
      clampBg(bg, c.getWidth(), c.getHeight());
      c.requestRenderAll();
      onZoomChange?.(nz);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Build all overlay objects
  const buildOverlays = useCallback(async () => {
    const c = fabricRef.current;
    if (!c || !dsRef.current) return;

    const id = ++buildIdRef.current;
    const f = fieldsRef.current;
    const ds = dsRef.current;
    const s = (v: number) => Math.round(v * ds * 100) / 100;

    // Remove all non-bg objects
    const bg = bgRef.current;
    for (const obj of c.getObjects().slice()) {
      if (obj !== bg) c.remove(obj);
    }

    const LT = { originX: 'left' as const, originY: 'top' as const };
    const add = <T extends fabric.Object>(obj: T): T => {
      obj.set({ selectable: false, evented: false, ...LT });
      c.add(obj);
      return obj;
    };
    const addCX = <T extends fabric.Object>(obj: T): T => {
      obj.set({ selectable: false, evented: false, originX: 'center', originY: 'top' });
      c.add(obj);
      return obj;
    };

    // Resolve team data
    const homeTeam = getTeamById(f.homeTeam);
    const awayTeam = getTeamById(f.awayTeam);
    const league = getLeagueById(f.league);

    // 1. Gradient overlay (from Paper: black/37% top → transparent → black/50% → solid black at bottom)
    // Fabric doesn't support multi-stop gradients with alpha easily, so we stack two rects
    // Top fade — use -1/+2 to prevent subpixel gaps at edges
    add(new fabric.Rect({
      left: -1, top: -1,
      width: s(CW) + 2, height: s(CH * 0.35) + 1,
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 0, y2: s(CH * 0.35) },
        colorStops: [
          { offset: 0, color: 'rgba(0,0,0,0.37)' },
          { offset: 1, color: 'rgba(0,0,0,0)' },
        ],
      }),
    }));
    // Bottom fade (covers lower ~65% of canvas) — use -1/+2 to prevent subpixel gaps
    add(new fabric.Rect({
      left: -1, top: s(CH * 0.35),
      width: s(CW) + 2, height: s(CH * 0.65) + 1,
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 0, y2: s(CH * 0.65) },
        colorStops: [
          { offset: 0, color: 'rgba(0,0,0,0)' },
          { offset: 0.43, color: 'rgba(0,0,0,0.50)' },  // ~62.9% of canvas
          { offset: 0.74, color: 'rgba(0,0,0,1)' },      // ~83.3% of canvas
          { offset: 1, color: 'rgba(0,0,0,1)' },
        ],
      }),
    }));

    // 2. Pred lockup — top-left (top=23, left=45)
    try {
      const lockup = await fabric.FabricImage.fromURL('/logos/lockup-white.svg');
      if (buildIdRef.current !== id) return;
      const lockupScale = (LOCKUP_W / lockup.width!) * ds;
      lockup.set({
        scaleX: lockupScale, scaleY: lockupScale,
        left: s(LOCKUP_X), top: s(LOCKUP_Y),
      });
      add(lockup);
    } catch { /* optional */ }
    if (buildIdRef.current !== id) return;

    // 3. Status tag — top-right (top=23, right=45, Barlow Condensed 900 italic 47px, #EBF132)
    const statusText = add(new fabric.FabricText(f.status, {
      fontSize: s(STATUS_FONT_SIZE),
      lineHeight: 58 / STATUS_FONT_SIZE,
      fontFamily: '"Barlow Condensed", sans-serif',
      fontWeight: '900',
      fontStyle: 'italic',
      fill: '#EBF132',
      letterSpacing: s(STATUS_FONT_SIZE * 0.02),
      left: s(CW - LOCKUP_X),
      top: s(LOCKUP_Y),
    }));
    statusText.set({ originX: 'right' });

    // ── Score + Odds layout — absolute pixel positions from Paper JSX ──
    // Paper frame: position:absolute, bottom:36, left:80, right:80
    // display:flex, align-items:flex-end, justify-content:center, gap:14px
    // Content = 286 + 14 + 202 + 14 + 286 = 802px, centered in 920px frame
    // offset = (920 - 802) / 2 = 59px from frame left
    //
    // Home column (286×350): score(200) + gap(12) + pill(138)
    // Center column (202×363+6pad): logo(206) + gap(26) + icon(131) + pad(6)
    // Away column (286×350): score(200) + gap(12) + pill(138)
    //
    // Absolute Y positions (from top, bottom of frame = 1080-36 = 1044):
    //   Pill top:       1044 - 138 = 906
    //   Score top:      906 - 12 - 200 = 694
    //   Pred icon top:  1044 - 6(pad) - 131 = 907
    //   League logo top: 907 - 26 - 206 = 675
    //
    // Absolute X positions (column centers):
    //   Home:   80 + 59 + 143 = 282
    //   Center: 80 + 59 + 286 + 14 + 101 = 540
    //   Away:   80 + 59 + 286 + 14 + 202 + 14 + 143 = 798

    const homeColCX = 282;
    const centerColCX = 540;
    const awayColCX = 798;

    const scoreTop = 694;
    const pillTop = 906;
    const leagueLogoTop = 675;
    const predIconTop = 907;

    // 4. Score numbers — Geist Black
    addCX(new fabric.FabricText(f.homeScore, {
      left: s(homeColCX),
      top: s(scoreTop),
      fontSize: s(SCORE_FONT_SIZE),
      fontFamily: 'Geist', fontWeight: '800',
      fill: '#FFFFFF',
    }));
    addCX(new fabric.FabricText(f.awayScore, {
      left: s(awayColCX),
      top: s(scoreTop),
      fontSize: s(SCORE_FONT_SIZE),
      fontFamily: 'Geist', fontWeight: '800',
      fill: '#FFFFFF',
    }));

    // 5. League logo — center column, full opacity, 202×206
    if (league) {
      const leagueBadge = await loadImageCached('/badges/' + league.logo);
      if (buildIdRef.current !== id) return;
      if (leagueBadge) {
        const scaleW = (LEAGUE_LOGO_W / leagueBadge.width!) * ds;
        const scaleH = (LEAGUE_LOGO_H / leagueBadge.height!) * ds;
        const badgeScale = Math.min(scaleW, scaleH);
        const scaledW = leagueBadge.width! * badgeScale;
        const scaledH = leagueBadge.height! * badgeScale;
        // Tint league logo white (some source files are colored)
        leagueBadge.filters = [
          new fabric.filters.BlendColor({ color: 'white', mode: 'tint', alpha: 1 }),
        ];
        leagueBadge.applyFilters();
        leagueBadge.set({
          scaleX: badgeScale, scaleY: badgeScale,
          left: s(centerColCX) - scaledW / 2,
          top: s(leagueLogoTop) + (s(LEAGUE_LOGO_H) - scaledH) / 2,
        });
        add(leagueBadge);
      }
    }

    // 6. Team pills — each rendered as individual canvas objects clipped by a shared absolutePositioned clipPath
    // Using absolutePositioned clipPath avoids the Fabric.js group center shift bug caused by
    // badge watermarks extending outside pill bounds (e.g. top=-66)
    const buildPill = async (
      teamId: string,
      teamName: string,
      odds: string,
      colCenterX: number,
      isHome: boolean,
    ) => {
      const team = isHome ? homeTeam : awayTeam;
      if (!team) return;

      const abbr = getTeamAbbr(teamId, teamName);
      const pLeft = colCenterX - PILL_W / 2;
      const pTop = pillTop;

      // Clip path in absolute canvas coords
      const makeClip = () => new fabric.Rect({
        left: s(pLeft), top: s(pTop),
        width: s(PILL_W), height: s(PILL_H),
        rx: s(PILL_R), ry: s(PILL_R),
        originX: 'left', originY: 'top',
        absolutePositioned: true,
      });

      // Bottom layer: full pill in BORDER color (peeks through at bottom as the border)
      add(new fabric.Rect({
        left: s(pLeft), top: s(pTop),
        width: s(PILL_W), height: s(PILL_H),
        rx: s(PILL_R), ry: s(PILL_R),
        fill: team.borderColor + 'E6',
      }));

      // Top layer: slightly shorter pill in MAIN color, same rounded corners
      add(new fabric.Rect({
        left: s(pLeft), top: s(pTop),
        width: s(PILL_W), height: s(PILL_H - PILL_BORDER_H),
        rx: s(PILL_R), ry: s(PILL_R),
        fill: team.primaryColor + 'EB',
      }));

      // Team badge as watermark inside pill (clipped to pill shape)
      const badgeImg = await loadImageCached('/badges/' + team.badge);
      if (buildIdRef.current !== id) return;

      if (badgeImg) {
        // Center badge in pill content area (above border), scaled to ~2x for watermark effect
        const contentH = PILL_H - PILL_BORDER_H;
        const badgeTargetH = contentH * 2;
        const badgeScale = (badgeTargetH / badgeImg.height!) * ds;
        const scaledW = badgeImg.width! * badgeScale;
        const scaledH = badgeImg.height! * badgeScale;
        // Clip to content area only (excludes border)
        const contentClip = new fabric.Rect({
          left: s(pLeft), top: s(pTop),
          width: s(PILL_W), height: s(contentH),
          rx: s(PILL_R), ry: s(PILL_R),
          originX: 'left', originY: 'top',
          absolutePositioned: true,
        });
        badgeImg.set({
          scaleX: badgeScale, scaleY: badgeScale,
          left: s(pLeft + PILL_W / 2) - scaledW / 2,
          top: s(pTop + contentH / 2) - scaledH / 2,
          opacity: 0.15,
          clipPath: contentClip,
        });
        add(badgeImg);
      }

      // Pill text centered in pill, clipped
      const pillText = new fabric.FabricText(`${abbr} ${odds}%`, {
        fontSize: s(PILL_FONT_SIZE),
        fontFamily: 'Geist', fontWeight: '600',
        fill: '#FFFFFF',
        originX: 'center', originY: 'center',
        left: s(pLeft + PILL_W / 2),
        top: s(pTop + PILL_H / 2),
        clipPath: makeClip(),
        selectable: false, evented: false,
      });
      c.add(pillText);
    };

    await buildPill(f.homeTeam, homeTeam?.name || f.homeTeam, f.homeOdds, homeColCX, true);
    if (buildIdRef.current !== id) return;
    await buildPill(f.awayTeam, awayTeam?.name || f.awayTeam, f.awayOdds, awayColCX, false);
    if (buildIdRef.current !== id) return;

    // 7. Pred icon — center column, rendered as clipped group (like pills)
    {
      const piLeft = centerColCX - PRED_ICON_W / 2;
      const piTop = predIconTop;

      // Bottom layer: full rounded rect in YELLOW (border color), inset ~1% so it hides behind dark rect
      const inset = PRED_ICON_W * 0.01;
      add(new fabric.Rect({
        left: s(piLeft + inset), top: s(piTop + 2),
        width: s(PRED_ICON_W - inset * 2), height: s(PRED_ICON_H - 2),
        rx: s(PRED_ICON_R), ry: s(PRED_ICON_R),
        fill: '#EBF132',
      }));

      // Top layer: shorter dark rect, border color visible at bottom
      add(new fabric.Rect({
        left: s(piLeft), top: s(piTop),
        width: s(PRED_ICON_W), height: s(PRED_ICON_H - PRED_ICON_BORDER_H),
        rx: s(PRED_ICON_R), ry: s(PRED_ICON_R),
        fill: '#1D1D1D',
      }));

      // Pred mark inside (centered in the dark area)
      try {
        const mark = await fabric.FabricImage.fromURL('/logos/mark-white.svg');
        if (buildIdRef.current !== id) return;
        const markTargetW = 84;
        const markScale = (markTargetW / mark.width!) * ds;
        const iconContentH = PRED_ICON_H - PRED_ICON_BORDER_H;
        mark.set({
          scaleX: markScale, scaleY: markScale,
          left: s(piLeft + PRED_ICON_W / 2) - (mark.width! * markScale) / 2,
          top: s(piTop + iconContentH / 2) - (mark.height! * markScale) / 2,
        });
        add(mark);
      } catch { /* optional */ }
    }

    c.requestRenderAll();
  }, []);

  // Load background image
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    let cancelled = false;

    (async () => {
      if (bgRef.current) { c.remove(bgRef.current); bgRef.current = null; }

      const url = imageDataUrl || '/images/halftime-default-bg.jpg';

      zoomRef.current = 1;
      let img: fabric.FabricImage;
      try {
        img = await fabric.FabricImage.fromURL(url);
      } catch {
        // If default mock doesn't exist, just build overlays on black bg
        if (fontsReady) buildOverlays();
        return;
      }
      if (cancelled) return;

      const ds = dsRef.current;
      const coverScale = Math.max(CW / img.width!, CH / img.height!) * ds;
      img.set({
        selectable: true, evented: true, hasControls: false, hasBorders: false,
        lockRotation: true, hoverCursor: 'grab', moveCursor: 'grabbing',
        originX: 'left', originY: 'top',
        scaleX: coverScale, scaleY: coverScale,
      });
      const dw = c.getWidth(), dh = c.getHeight();
      img.set({
        left: (dw - img.width! * coverScale) / 2,
        top: (dh - img.height! * coverScale) / 2,
      });
      clampBg(img, dw, dh);

      c.insertAt(0, img);
      bgRef.current = img;
      applyBgBlur(img, c, bgBlur);

      if (fontsReady) buildOverlays();
      onZoomChange?.(1);
    })();

    return () => { cancelled = true; };
  }, [imageDataUrl, fontsReady, buildOverlays]);

  // Rebuild overlays on field change or fonts ready
  useEffect(() => {
    if (!fabricRef.current || !fontsReady) return;
    buildOverlays();
  }, [fields, fontsReady, buildOverlays]);

  // Apply blur filter to background image (debounced to avoid full-res filter on every slider tick)
  useEffect(() => {
    const timer = setTimeout(() => {
      applyBgBlur(bgRef.current, fabricRef.current, bgBlur);
    }, 30);
    return () => clearTimeout(timer);
  }, [bgBlur]);

  // Resize canvas + rebuild
  useEffect(() => {
    const c = fabricRef.current;
    if (!c || !containerSize.w) return;

    const pad = 32;
    const ds = Math.min((containerSize.w - pad * 2) / CW, (containerSize.h - pad * 2) / CH, 1);
    dsRef.current = ds;
    const dw = Math.round(CW * ds), dh = Math.round(CH * ds);
    c.setDimensions({ width: dw, height: dh });

    const bg = bgRef.current;
    if (bg) {
      const cs = Math.max(CW / bg.width!, CH / bg.height!) * ds * zoomRef.current;
      bg.set({ scaleX: cs, scaleY: cs });
      bg.set({
        left: (dw - bg.width! * cs) / 2,
        top: (dh - bg.height! * cs) / 2,
      });
      clampBg(bg, dw, dh);
    }

    if (fontsReady) buildOverlays();
  }, [containerSize, fontsReady, buildOverlays]);

  // Imperative handle
  useImperativeHandle(ref, () => ({
    exportImage: (format: 'png' | 'jpeg', quality?: number) => {
      const c = fabricRef.current;
      if (!c) return null;
      return c.toDataURL({
        format, quality: quality ?? 1,
        multiplier: 2 / dsRef.current,
        width: c.getWidth(), height: c.getHeight(),
      });
    },
    resetFraming: () => {
      const c = fabricRef.current, bg = bgRef.current;
      if (!c || !bg) return;
      zoomRef.current = 1;
      const ds = dsRef.current;
      const cs = Math.max(CW / bg.width!, CH / bg.height!) * ds;
      const dw = c.getWidth(), dh = c.getHeight();
      bg.set({
        scaleX: cs, scaleY: cs,
        left: (dw - bg.width! * cs) / 2,
        top: (dh - bg.height! * cs) / 2,
      });
      clampBg(bg, dw, dh);
      c.requestRenderAll();
      onZoomChange?.(1);
    },
    zoomTo: (level: number) => {
      const c = fabricRef.current, bg = bgRef.current;
      if (!c || !bg) return;
      const clamped = Math.min(5, Math.max(1, level));
      if (clamped === zoomRef.current) return;
      const ds = dsRef.current;
      const base = Math.max(CW / bg.width!, CH / bg.height!) * ds;
      const os = base * zoomRef.current, ns = base * clamped;
      const cx = c.getWidth() / 2, cy = c.getHeight() / 2;
      zoomRef.current = clamped;
      bg.set({
        scaleX: ns, scaleY: ns,
        left: cx - (cx - bg.left!) * (ns / os),
        top: cy - (cy - bg.top!) * (ns / os),
      });
      clampBg(bg, c.getWidth(), c.getHeight());
      c.requestRenderAll();
      onZoomChange?.(clamped);
    },
    getPreview: () => {
      const c = fabricRef.current;
      if (!c) return null;
      return c.toDataURL({ format: 'png', multiplier: 1, width: c.getWidth(), height: c.getHeight() });
    },
  }), [onZoomChange]);

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-[#111111] overflow-hidden rounded-lg relative">
      <canvas ref={canvasElRef} />
    </div>
  );
});

export default HalftimeScoreCanvas;
