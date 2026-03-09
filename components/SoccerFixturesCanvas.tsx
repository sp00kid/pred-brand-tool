'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import * as fabric from 'fabric';
import { getTeamById } from '@/lib/templates/soccer-fixtures/teams';

export interface MatchEntry {
  homeTeam: string;
  awayTeam: string;
  time: string;
}

export interface SoccerFixturesFields {
  title: string;
  date: string;
  timezone: string;
  matches: MatchEntry[];
}

export interface SoccerFixturesCanvasHandle {
  exportImage: (format: 'png' | 'jpeg', quality?: number) => string | null;
  resetFraming: () => void;
  zoomTo: (level: number) => void;
  getPreview: () => string | null;
}

// Native canvas dimensions
const CW = 1280;
const CH = 720;

// Grid positioning
const GRID_LEFT = 44;
const GRID_WIDTH = 1192;
const COL_GAP = 20;
const ROW_GAP = 12;

// Footer
const FOOTER_H = 56;
const FOOTER_Y = CH - FOOTER_H; // 664

// Header layout (from Paper: title top=32, accent top=102, date top=125)
const HEADER_TITLE_Y = 32;
const ACCENT_LINE_W = 80;
const ACCENT_LINE_H = 3;


// Scaling rules per match-count tier
function getScaleConfig(matchCount: number) {
  if (matchCount <= 2) {
    return { cardH: 200, badgeSize: 130, timeFontSize: 36, tzFontSize: 16, badgeContainerSize: 200 };
  }
  return { cardH: 140, badgeSize: 100, timeFontSize: 28, tzFontSize: 14, badgeContainerSize: 140 };
}

// Colors
const OVERLAY_COLOR = '#00000054';
const CARD_BG = '#00000080';
const CARD_BORDER = '#FFFFFF26';
const TITLE_COLOR = '#F3FB36';
const TIME_COLOR = '#FFFFFF';
const TZ_COLOR = '#FFFFFFB3';
const DATE_COLOR = '#FFFFFFCC';
const FOOTER_BORDER = '#FFFFFF1A';
const FOOTER_TEXT = '#FFFFFFE6';
const FOOTER_DIVIDER = '#FFFFFF4D';
const ACCENT_LINE_COLOR = '#F4FB37';

const CLAMP_MARGIN = 0.50;

// Badge cache
const badgeCache = new Map<string, HTMLImageElement>();

async function loadBadgeImage(teamId: string): Promise<fabric.FabricImage | null> {
  const team = getTeamById(teamId);
  if (!team) return null;

  const cached = badgeCache.get(team.badge);
  if (cached) {
    // Clone from cached element
    const img = new fabric.FabricImage(cached);
    return img;
  }

  try {
    const img = await fabric.FabricImage.fromURL('/badges/' + team.badge);
    // Cache the underlying element
    badgeCache.set(team.badge, img.getElement() as HTMLImageElement);
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

const SoccerFixturesCanvas = forwardRef<SoccerFixturesCanvasHandle, {
  fields: SoccerFixturesFields;
  imageDataUrl: string | null;
  onZoomChange?: (zoom: number) => void;
  onCanvasUpdate?: () => void;
}>(function SoccerFixturesCanvas({ fields, imageDataUrl, onZoomChange, onCanvasUpdate }, ref) {
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

  // Load Geist fonts via FontFace API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bufMedium, bufSemiBold, bufBold, bufExtraBoldItalic] = await Promise.all([
          fetch('/fonts/Geist-Medium.woff2').then(r => r.arrayBuffer()),
          fetch('/fonts/Geist-SemiBold.woff2').then(r => r.arrayBuffer()),
          fetch('/fonts/Geist-Bold.woff2').then(r => r.arrayBuffer()),
          fetch('/fonts/Geist-ExtraBoldItalic.woff2').then(r => r.arrayBuffer()),
        ]);
        if (cancelled) return;
        const fonts = [
          new FontFace('Geist', bufMedium, { weight: '500' }),
          new FontFace('Geist', bufSemiBold, { weight: '600' }),
          new FontFace('Geist', bufBold, { weight: '700' }),
          new FontFace('Geist', bufExtraBoldItalic, { weight: '800', style: 'italic' }),
        ];
        const loaded = await Promise.all(fonts.map(f => f.load()));
        if (cancelled) return;
        loaded.forEach(f => document.fonts.add(f));
      } catch (err) { console.warn('Geist font load failed:', err); }
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

    // 1. Dark overlay
    add(new fabric.Rect({
      left: 0, top: 0,
      width: s(CW), height: s(CH),
      fill: OVERLAY_COLOR,
    }));

    // 2. Title (Paper: top=32, centered)
    const titleText = addCX(new fabric.FabricText(f.title.toUpperCase(), {
      left: s(CW / 2), top: s(HEADER_TITLE_Y),
      fontSize: s(64), fontFamily: 'Geist, sans-serif',
      fontWeight: '800', fontStyle: 'italic',
      fill: TITLE_COLOR,
      charSpacing: -20,
    }));

    // 3. Accent line (Paper: top=102, centered)
    const accentY = s(102);
    add(new fabric.Rect({
      left: s(CW / 2 - ACCENT_LINE_W / 2), top: accentY,
      width: s(ACCENT_LINE_W), height: s(ACCENT_LINE_H),
      rx: s(2), ry: s(2),
      fill: ACCENT_LINE_COLOR,
    }));

    // 4. Date subtitle (Paper: top=125, centered)
    const dateY = s(125);
    const dateText = addCX(new fabric.FabricText(f.date.toUpperCase(), {
      left: s(CW / 2), top: dateY,
      fontSize: s(23), fontFamily: 'Geist, sans-serif',
      fontWeight: '500', fill: DATE_COLOR,
      charSpacing: 60,
    }));

    // Header bottom = date bottom + padding
    const headerBottom = 125 + (dateText.height! / ds) + 12;

    // 5. Match grid — 3 separate cells per card (badge | time | badge)
    const matches = f.matches;
    const matchCount = matches.length;
    const cfg = getScaleConfig(matchCount);
    const rows = Math.ceil(matchCount / 2);
    const gridH = rows * cfg.cardH + (rows - 1) * ROW_GAP;
    const availableH = FOOTER_Y - headerBottom;
    const gridTop = headerBottom + (availableH - gridH) / 2;

    const colW = (GRID_WIDTH - COL_GAP) / 2;
    const oddLastCard = matchCount % 2 === 1;

    for (let i = 0; i < matchCount; i++) {
      const match = matches[i];
      const row = Math.floor(i / 2);
      const col = i % 2;
      const isLastOdd = oddLastCard && i === matchCount - 1;

      let cardX: number;
      let cardW: number;

      if (isLastOdd) {
        cardW = 586;
        cardX = GRID_LEFT + (GRID_WIDTH - cardW) / 2;
      } else {
        cardW = colW;
        cardX = GRID_LEFT + col * (colW + COL_GAP);
      }

      const cardY = gridTop + row * (cfg.cardH + ROW_GAP);
      const bcSize = cfg.badgeContainerSize;
      const timeCellW = cardW - bcSize * 2;

      // Home badge cell (left) — own bg + border
      add(new fabric.Rect({
        left: s(cardX), top: s(cardY),
        width: s(bcSize), height: s(cfg.cardH),
        fill: CARD_BG,
        stroke: CARD_BORDER, strokeWidth: s(1),
      }));

      // Time cell (center) — own bg + border
      add(new fabric.Rect({
        left: s(cardX + bcSize), top: s(cardY),
        width: s(timeCellW), height: s(cfg.cardH),
        fill: CARD_BG,
        stroke: CARD_BORDER, strokeWidth: s(1),
      }));

      // Away badge cell (right) — own bg + border
      add(new fabric.Rect({
        left: s(cardX + cardW - bcSize), top: s(cardY),
        width: s(bcSize), height: s(cfg.cardH),
        fill: CARD_BG,
        stroke: CARD_BORDER, strokeWidth: s(1),
      }));

      // Time text (centered in time cell)
      const timeCellX = cardX + bcSize;
      addCX(new fabric.FabricText(match.time, {
        left: s(timeCellX + timeCellW / 2),
        top: s(cardY + cfg.cardH / 2 - cfg.timeFontSize / 2 - 6),
        fontSize: s(cfg.timeFontSize), fontFamily: 'Geist, sans-serif',
        fontWeight: '700', fill: TIME_COLOR,
        charSpacing: -10,
      }));

      // Timezone text (below time, gap: 2px per Paper)
      addCX(new fabric.FabricText(f.timezone, {
        left: s(timeCellX + timeCellW / 2),
        top: s(cardY + cfg.cardH / 2 + cfg.timeFontSize / 2 - 4),
        fontSize: s(cfg.tzFontSize), fontFamily: 'Geist, sans-serif',
        fontWeight: '600', fill: TZ_COLOR,
        charSpacing: 80,
      }));

      // Load and render badges
      if (buildIdRef.current !== id) return;

      const homeBadge = await loadBadgeImage(match.homeTeam);
      if (buildIdRef.current !== id) return;
      if (homeBadge) {
        const badgeScale = (cfg.badgeSize / Math.max(homeBadge.width!, homeBadge.height!)) * ds;
        homeBadge.set({
          scaleX: badgeScale, scaleY: badgeScale,
          left: s(cardX + bcSize / 2) - (homeBadge.width! * badgeScale) / 2,
          top: s(cardY + cfg.cardH / 2) - (homeBadge.height! * badgeScale) / 2,
        });
        add(homeBadge);
      }

      const awayBadge = await loadBadgeImage(match.awayTeam);
      if (buildIdRef.current !== id) return;
      if (awayBadge) {
        const badgeScale = (cfg.badgeSize / Math.max(awayBadge.width!, awayBadge.height!)) * ds;
        awayBadge.set({
          scaleX: badgeScale, scaleY: badgeScale,
          left: s(cardX + cardW - bcSize / 2) - (awayBadge.width! * badgeScale) / 2,
          top: s(cardY + cfg.cardH / 2) - (awayBadge.height! * badgeScale) / 2,
        });
        add(awayBadge);
      }
    }

    if (buildIdRef.current !== id) return;

    // 6. Footer — full-width top border, centered logo + divider + text (gap: 16px)
    const footerCenterY = FOOTER_Y + FOOTER_H / 2;

    // Footer border line (full width)
    add(new fabric.Rect({
      left: 0, top: s(FOOTER_Y),
      width: s(CW), height: s(1),
      fill: FOOTER_BORDER,
    }));

    // Load Pred lockup (bolt mark + "PRED" text, white)
    try {
      const lockup = await fabric.FabricImage.fromURL('/logos/lockup-white.svg');
      if (buildIdRef.current !== id) return;

      // Scale to 30px height (Paper: 110x30)
      const lockupH = 30;
      const lockupScale = (lockupH / lockup.height!) * ds;
      const lockupW = lockup.width! * lockupScale;

      // Divider and text measurements
      const dividerW = s(1);
      const gap = s(16);

      // Measure "pred.app" text
      const footerText = new fabric.FabricText('pred.app', {
        fontSize: s(14), fontFamily: 'Geist, sans-serif',
        fontWeight: '500', fill: FOOTER_TEXT,
      });
      const textW = footerText.width!;

      // Total group width: lockup + gap + divider + gap + text
      const groupW = lockupW + gap + dividerW + gap + textW;
      const groupLeft = (s(CW) - groupW) / 2;

      // Place lockup
      lockup.set({
        scaleX: lockupScale, scaleY: lockupScale,
        left: groupLeft,
        top: s(footerCenterY) - (lockup.height! * lockupScale) / 2,
      });
      add(lockup);

      // Place divider
      add(new fabric.Rect({
        left: groupLeft + lockupW + gap,
        top: s(footerCenterY - 8),
        width: dividerW, height: s(16),
        fill: FOOTER_DIVIDER,
      }));

      // Place text
      add(footerText).set({
        left: groupLeft + lockupW + gap + dividerW + gap,
        top: s(footerCenterY) - footerText.height! / 2,
      });
    } catch { /* footer logo optional */ }

    c.requestRenderAll();
  }, []);

  // Load background image
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    let cancelled = false;

    (async () => {
      if (bgRef.current) { c.remove(bgRef.current); bgRef.current = null; }

      if (!imageDataUrl) {
        if (fontsReady) buildOverlays();
        return;
      }

      zoomRef.current = 1;
      const img = await fabric.FabricImage.fromURL(imageDataUrl);
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
        multiplier: 1 / dsRef.current,
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

export default SoccerFixturesCanvas;
