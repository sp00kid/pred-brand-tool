'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import * as fabric from 'fabric';
import { getTeamById } from '@/lib/templates/soccer-fixtures/teams';
import { getLeagueById } from '@/lib/templates/halftime-score/leagues';

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

// Layout constants (native coords)
const LOCKUP_X = 45;
const LOCKUP_Y = 45;
const LOCKUP_W = 188;

const STATUS_MARGIN_RIGHT = 45;

const SCORE_FONT_SIZE = 200;
const SCORE_INSET = 180; // distance from edge for score numbers

const LEAGUE_LOGO_SIZE = 202;

const PILL_W = 286;
const PILL_H = 128;
const PILL_R = 35;
const PILL_BORDER_H = 10;
const PILL_FONT_SIZE = 54;

const PRED_ICON_W = 133;
const PRED_ICON_H = 131;
const PRED_ICON_R = 24;

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
    'barcelona': 'BAR', 'real-madrid': 'RMA', 'atletico': 'ATM', 'betis': 'BET',
    'villarreal': 'VIL', 'realsociedad': 'RSO', 'sevilla': 'SEV', 'athletic': 'ATH',
    'athleticbilbao': 'ATH', 'valencia': 'VAL', 'celtavigo': 'CEL',
    'bayern': 'BAY', 'dortmund': 'BVB', 'leverkusen': 'LEV', 'leipzig': 'RBL',
    'psg': 'PSG', 'marseille': 'MAR', 'lyon': 'LYO', 'monaco': 'MON',
    'juventus': 'JUV', 'acmilan': 'MIL', 'inter': 'INT', 'napoli': 'NAP', 'roma': 'ROM',
    'benfica': 'BEN', 'porto': 'POR', 'sporting': 'SCP',
    'galatasaray': 'GAL', 'fenerbahce': 'FEN', 'besiktas': 'BJK',
    'ajax': 'AJA', 'psv': 'PSV', 'feyenoord': 'FEY',
    'celtic': 'CEL', 'rangers': 'RAN',
  };
  return abbrMap[teamId] || teamName.slice(0, 3).toUpperCase();
}

const HalftimeScoreCanvas = forwardRef<HalftimeScoreCanvasHandle, {
  fields: HalftimeScoreFields;
  imageDataUrl: string | null;
  onZoomChange?: (zoom: number) => void;
  onCanvasUpdate?: () => void;
}>(function HalftimeScoreCanvas({ fields, imageDataUrl, onZoomChange, onCanvasUpdate }, ref) {
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
          fetch('/fonts/Geist-ExtraBoldItalic.woff2').then(r => r.arrayBuffer()),
        ];
        const [bufSemiBold, bufBold, bufExtraBold] = await Promise.all(fontLoads);
        if (cancelled) return;

        const geistFonts = [
          new FontFace('Geist', bufSemiBold, { weight: '600' }),
          new FontFace('Geist', bufBold, { weight: '700' }),
          new FontFace('Geist', bufExtraBold, { weight: '800' }),
        ];

        // Barlow Condensed Black Italic
        const barlowFont = new FontFace(
          'Barlow Condensed',
          'url(https://fonts.gstatic.com/s/barlowcondensed/v12/HTxxL3I-JCGChYJ8VI-L6OO_au7B46r_04MvKQ.woff2)',
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

    // 1. Dark overlay
    add(new fabric.Rect({
      left: 0, top: 0,
      width: s(CW), height: s(CH),
      fill: 'rgba(0,0,0,0.55)',
    }));

    // 2. Pred lockup — top-left
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

    // 3. Status tag — top-right
    const statusText = add(new fabric.FabricText(f.status, {
      fontSize: s(58),
      fontFamily: '"Barlow Condensed", sans-serif',
      fontWeight: '900',
      fontStyle: 'italic',
      fill: '#22C55E',
      left: s(CW - STATUS_MARGIN_RIGHT),
      top: s(50),
    }));
    statusText.set({ originX: 'right' });

    // 4. Score numbers — vertically centered area
    const scoreCenterY = CH / 2 - 40; // nudge up to leave room for pills below

    // Home score — left column
    addCX(new fabric.FabricText(f.homeScore, {
      left: s(SCORE_INSET + 90),
      top: s(scoreCenterY - SCORE_FONT_SIZE / 2),
      fontSize: s(SCORE_FONT_SIZE),
      fontFamily: 'Geist, sans-serif',
      fontWeight: '800',
      fill: '#FFFFFF',
    }));

    // Away score — right column
    addCX(new fabric.FabricText(f.awayScore, {
      left: s(CW - SCORE_INSET - 90),
      top: s(scoreCenterY - SCORE_FONT_SIZE / 2),
      fontSize: s(SCORE_FONT_SIZE),
      fontFamily: 'Geist, sans-serif',
      fontWeight: '800',
      fill: '#FFFFFF',
    }));

    // 5. League logo — center between scores, low opacity
    if (league) {
      const leagueBadge = await loadImageCached('/badges/' + league.logo);
      if (buildIdRef.current !== id) return;
      if (leagueBadge) {
        const targetSize = LEAGUE_LOGO_SIZE;
        const badgeScale = (targetSize / Math.max(leagueBadge.width!, leagueBadge.height!)) * ds;
        leagueBadge.set({
          scaleX: badgeScale, scaleY: badgeScale,
          left: s(CW / 2) - (leagueBadge.width! * badgeScale) / 2,
          top: s(scoreCenterY) - (leagueBadge.height! * badgeScale) / 2,
          opacity: 0.15,
        });
        add(leagueBadge);
      }
    }

    // 6. Team pills
    const pillY = scoreCenterY + SCORE_FONT_SIZE / 2 + 30;
    const homeColCenterX = SCORE_INSET + 90;
    const awayColCenterX = CW - SCORE_INSET - 90;

    const buildPill = async (
      teamId: string,
      teamName: string,
      odds: string,
      centerX: number,
      isHome: boolean,
    ) => {
      const team = isHome ? homeTeam : awayTeam;
      if (!team) return;

      const abbr = getTeamAbbr(teamId, teamName);
      const pillLeft = centerX - PILL_W / 2;
      const pillTop = pillY;

      // Clip path for the pill group
      const clipRect = new fabric.Rect({
        width: PILL_W * ds,
        height: (PILL_H + PILL_BORDER_H) * ds,
        rx: PILL_R * ds,
        ry: PILL_R * ds,
        originX: 'center',
        originY: 'center',
      });

      // Pill background
      const pillBg = new fabric.Rect({
        left: 0, top: 0,
        width: s(PILL_W), height: s(PILL_H),
        rx: s(PILL_R), ry: s(PILL_R),
        fill: team.primaryColor + 'EB',
        originX: 'left', originY: 'top',
      });

      // Border extrude at bottom
      const borderRect = new fabric.Rect({
        left: 0, top: s(PILL_H),
        width: s(PILL_W), height: s(PILL_BORDER_H),
        fill: team.borderColor + 'E6',
        originX: 'left', originY: 'top',
      });

      // Team badge as watermark inside pill
      const badgeImg = await loadImageCached('/badges/' + team.badge);
      if (buildIdRef.current !== id) return;

      const groupObjects: fabric.Object[] = [pillBg, borderRect];

      if (badgeImg) {
        const badgeTargetW = isHome ? 358 : 272;
        const badgeScale = (badgeTargetW / Math.max(badgeImg.width!, badgeImg.height!)) * ds;
        badgeImg.set({
          scaleX: badgeScale, scaleY: badgeScale,
          left: s(PILL_W / 2) - (badgeImg.width! * badgeScale) / 2,
          top: s((PILL_H + PILL_BORDER_H) / 2) - (badgeImg.height! * badgeScale) / 2,
          opacity: 0.15,
          originX: 'left', originY: 'top',
        });
        groupObjects.push(badgeImg);
      }

      // Text: "ABR 52%"
      const pillText = new fabric.FabricText(`${abbr}  ${odds}%`, {
        fontSize: s(PILL_FONT_SIZE),
        fontFamily: 'Geist, sans-serif',
        fontWeight: '600',
        fill: '#FFFFFF',
        originX: 'center', originY: 'center',
        left: s(PILL_W / 2),
        top: s((PILL_H) / 2),
      });
      groupObjects.push(pillText);

      const group = new fabric.Group(groupObjects, {
        left: s(pillLeft),
        top: s(pillTop),
        clipPath: clipRect,
        selectable: false,
        evented: false,
        originX: 'left',
        originY: 'top',
      });
      c.add(group);
    };

    await buildPill(f.homeTeam, homeTeam?.name || f.homeTeam, f.homeOdds, homeColCenterX, true);
    if (buildIdRef.current !== id) return;
    await buildPill(f.awayTeam, awayTeam?.name || f.awayTeam, f.awayOdds, awayColCenterX, false);
    if (buildIdRef.current !== id) return;

    // 7. Pred icon — center bottom
    const predIconX = CW / 2 - PRED_ICON_W / 2;
    const predIconY = CH - PRED_ICON_H - 50;

    // Dark rounded square background
    add(new fabric.Rect({
      left: s(predIconX), top: s(predIconY),
      width: s(PRED_ICON_W), height: s(PRED_ICON_H),
      rx: s(PRED_ICON_R), ry: s(PRED_ICON_R),
      fill: 'rgba(13,13,13,0.85)',
    }));

    // Pred mark inside
    try {
      const mark = await fabric.FabricImage.fromURL('/logos/mark-white.svg');
      if (buildIdRef.current !== id) return;
      const markPad = 28;
      const markTargetW = PRED_ICON_W - markPad * 2;
      const markScale = (markTargetW / mark.width!) * ds;
      mark.set({
        scaleX: markScale, scaleY: markScale,
        left: s(predIconX + markPad),
        top: s(predIconY + (PRED_ICON_H - mark.height! * (markTargetW / mark.width!)) / 2),
      });
      add(mark);
    } catch { /* optional */ }

    c.requestRenderAll();
  }, []);

  // Load background image
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    let cancelled = false;

    (async () => {
      if (bgRef.current) { c.remove(bgRef.current); bgRef.current = null; }

      const url = imageDataUrl || '/mock/halftime-default.jpg';

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
