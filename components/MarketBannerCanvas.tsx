'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import * as fabric from 'fabric';

export interface MarketBannerFields {
  label: string;
  team1: string;
  team2: string;
  team1Abbr: string;
  team2Abbr: string;
  price1: string;
  price2: string;
  color1: string;
  color2: string;
  league: string;
  date: string;
  status: string;
}

export interface MarketBannerCanvasHandle {
  exportImage: (format: 'png' | 'jpeg', quality?: number) => string | null;
  resetFraming: () => void;
  zoomTo: (level: number) => void;
  getPreview: () => string | null;
}

// Native canvas dimensions (from Figma)
const CW = 1080;
const CH = 1368;

// Layout constants (native coords)
const TX = 63;
const MAX_TW = 953;
const LABEL_Y = 67;
const TEAM_SIZE = 138.652;
const VS_SIZE = 64;
const INFO_SIZE = 36;
const DOT_GAP = 16;       // horizontal space each side of the centered dot

// Vertical spacing between stacked text lines (negative = overlap)
const LABEL_TEAM_GAP = -10;   // gap after "NEW MARKET" label before team1
const TEAM_VS_GAP = -35;    // gap between team lines and "vs"
const TEAM2_INFO_GAP = 17;  // gap after team2 before league/date line

// Bottom card
const CARD_Y = 1050;
const CARD_H = 331;
const CARD_PAD = 55;
const ROW_GAP = 25;
const PC_W = 411;
const PC_H = 129;
const PC_R = 19;
const PC_Y = CARD_Y + 68;

// Pred mark pill (from Figma)
const MARK_W = 54.4;
const MARK_H = 48.3;
const PILL_PX = 12;
const PILL_PY = 14.5;
const PRED_PILL_W = MARK_W + PILL_PX * 2;
const PRED_PILL_H = MARK_H + PILL_PY * 2;

// Centered row: [left card] [gap] [pill] [gap] [right card]
const ROW_ITEMS_W = PC_W + ROW_GAP + PRED_PILL_W + ROW_GAP + PC_W;
const ROW_OFFSET = (CW - CARD_PAD * 2 - ROW_ITEMS_W) / 2;
const PC_LX = CARD_PAD + ROW_OFFSET;
const PC_RX = PC_LX + PC_W + ROW_GAP + PRED_PILL_W + ROW_GAP;
const STATUS_Y = PC_Y + PC_H + 28;

// Allow bg to reveal up to this fraction of canvas on each edge
const CLAMP_MARGIN = 0.50;

function clampBg(img: fabric.FabricImage, cw: number, ch: number) {
  const mx = cw * CLAMP_MARGIN;
  const my = ch * CLAMP_MARGIN;
  let left = Math.min(mx, Math.max(cw - img.getScaledWidth() - mx, img.left!));
  let top = Math.min(my, Math.max(ch - img.getScaledHeight() - my, img.top!));
  img.set({ left, top });
}

const MarketBannerCanvas = forwardRef<MarketBannerCanvasHandle, {
  fields: MarketBannerFields;
  imageDataUrl: string | null;
  onZoomChange?: (zoom: number) => void;
  onCanvasUpdate?: () => void;
}>(function MarketBannerCanvas({ fields, imageDataUrl, onZoomChange, onCanvasUpdate }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const dsRef = useRef(1);
  const zoomRef = useRef(1);
  const bgRef = useRef<fabric.FabricImage | null>(null);
  const buildIdRef = useRef(0);

  // Use refs for latest values (avoid stale closures in buildOverlays)
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const imageUrlRef = useRef(imageDataUrl);
  imageUrlRef.current = imageDataUrl;

  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [fontsReady, setFontsReady] = useState(false);

  // Load Eurostile fonts via FontFace API from repaired WOFF2 files.
  // (Original TTF had a corrupt cmap table; we rebuilt it with fonttools.)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [buf1, buf2, buf3] = await Promise.all([
          fetch('/fonts/EurostileExtended-Bold.woff2').then(r => r.arrayBuffer()),
          fetch('/fonts/Eurostile-Regular.woff2').then(r => r.arrayBuffer()),
          fetch('/fonts/Inter-Latin.woff2').then(r => r.arrayBuffer()),
        ]);
        if (cancelled) return;
        const f1 = new FontFace('Eurostile Extended', buf1, { weight: '700' });
        const f2 = new FontFace('Eurostile', buf2, { weight: '400' });
        // Register Inter twice — same variable font buffer, explicit weight entries
        const f3 = new FontFace('Inter', buf3, { weight: '400' });
        const f4 = new FontFace('Inter', buf3.slice(0), { weight: '500' });
        const loaded = await Promise.all([f1.load(), f2.load(), f3.load(), f4.load()]);
        if (cancelled) return;
        loaded.forEach(f => document.fonts.add(f));
      } catch (err) { console.warn('Font load failed:', err); }
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
      backgroundColor: '#131313',
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

  // ── Build all overlay objects ──
  // Removes everything except bg, then recreates all layers.
  // Uses buildId to discard stale async completions.
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

    // Wait until fonts are loaded before building text layers
    // (fonts are loaded by the standalone useEffect above)

    // Helper: add non-interactive object (Fabric v7 defaults to center origin)
    const LT = { originX: 'left' as const, originY: 'top' as const };
    const add = <T extends fabric.Object>(obj: T): T => {
      obj.set({ selectable: false, evented: false, ...LT });
      c.add(obj);
      return obj;
    };
    // For objects that need center-x alignment
    const addCX = <T extends fabric.Object>(obj: T): T => {
      obj.set({ selectable: false, evented: false, originX: 'center', originY: 'top' });
      c.add(obj);
      return obj;
    };

    // 1. Watermark (pre-sized SVG with opacity baked in)
    try {
      const wm = await fabric.FabricImage.fromURL('/logos/mark-overlay.svg');
      if (buildIdRef.current !== id) return; // stale
      add(wm);
      wm.set({ scaleX: ds, scaleY: ds, left: 0, top: 0, globalCompositeOperation: 'soft-light' });
    } catch { /* optional */ }
    if (buildIdRef.current !== id) return;

    // 2. Dark gradient (Figma: left=-24, top=-19, 1132×952, solid black → transparent)
    add(new fabric.Rect({
      width: s(1132), height: s(952),
      left: s(-24), top: s(-19),
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 0, y2: s(952) },
        colorStops: [
          { offset: 0, color: 'rgba(0,0,0,1)' },
          { offset: 0.406, color: 'rgba(0,0,0,1)' },
          { offset: 1, color: 'rgba(0,0,0,0)' },
        ],
      }),
    }));

    // 3. Text layers — dynamic stacking (Figma: flex-col, -15px gap between team/vs)
    let curY = s(LABEL_Y);

    const label = addCX(new fabric.FabricText(f.label, {
      left: s(CW / 2), top: curY,
      fontSize: s(24), fontFamily: 'Inter, sans-serif',
      fontStyle: 'italic', fontWeight: '400', fill: '#fff',
      charSpacing: 60,
    }));
    curY += label.height! + s(LABEL_TEAM_GAP);

    const t1 = addCX(new fabric.FabricText(f.team1, {
      left: s(CW / 2), top: curY,
      fontSize: s(TEAM_SIZE), fontFamily: '"Eurostile Extended", sans-serif',
      fontWeight: '700', fill: '#fff',
    }));
    if (t1.width! > s(MAX_TW)) {
      t1.set({ fontSize: Math.floor(s(TEAM_SIZE) * s(MAX_TW) / t1.width!) });
    }
    curY += t1.height! + s(TEAM_VS_GAP);

    const vs = addCX(new fabric.FabricText('vs', {
      left: s(CW / 2), top: curY,
      fontSize: s(VS_SIZE), fontFamily: '"Eurostile", sans-serif',
      fontWeight: '400', fill: '#fff',
    }));
    curY += vs.height! + s(TEAM_VS_GAP);

    const t2 = addCX(new fabric.FabricText(f.team2, {
      left: s(CW / 2), top: curY,
      fontSize: s(TEAM_SIZE), fontFamily: '"Eurostile Extended", sans-serif',
      fontWeight: '700', fill: '#fff',
    }));
    if (t2.width! > s(MAX_TW)) {
      t2.set({ fontSize: Math.floor(s(TEAM_SIZE) * s(MAX_TW) / t2.width!) });
    }
    curY += t2.height! + s(TEAM2_INFO_GAP);

    // League • Date — dot is always at canvas center, text aligns toward it
    const centerX = s(CW / 2);
    const infoStyle = {
      fontSize: s(INFO_SIZE), fontFamily: 'Inter, sans-serif',
      fontWeight: '300' as const, fill: '#d3d0d0', charSpacing: -40,
    };
    const dotObj = addCX(new fabric.FabricText('\u2022', {
      left: centerX, top: curY, ...infoStyle,
    }));
    // League text: right edge sits DOT_GAP left of the dot center
    add(new fabric.FabricText(f.league, {
      left: centerX - s(DOT_GAP) - dotObj.width! / 2, top: curY, ...infoStyle,
    })).set({ originX: 'right' });
    // Date text: left edge sits DOT_GAP right of the dot center
    add(new fabric.FabricText(f.date, {
      left: centerX + s(DOT_GAP) + dotObj.width! / 2, top: curY, ...infoStyle,
    }));

    // 4. Bottom card (1px bleed on sides to prevent sub-pixel gaps)
    add(new fabric.Rect({
      left: -1, top: s(CARD_Y),
      width: s(CW) + 2, height: s(CARD_H + 24),
      rx: s(24), ry: s(24),
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 0, y2: s(CARD_H) },
        colorStops: [
          { offset: 0.01, color: '#262626' },
          { offset: 0.99, color: 'rgba(0,0,0,0.79)' },
        ],
      }),
    }));

    // 5. Price cards
    add(new fabric.Rect({
      left: s(PC_LX), top: s(PC_Y),
      width: s(PC_W), height: s(PC_H),
      rx: s(PC_R), ry: s(PC_R), fill: f.color1,
    }));
    add(new fabric.Rect({
      left: s(PC_RX), top: s(PC_Y),
      width: s(PC_W), height: s(PC_H),
      rx: s(PC_R), ry: s(PC_R), fill: f.color2,
    }));

    // Price card text (centered group layout per Figma: abbreviation + gap + price)
    const cardFontSize = 50;
    const cardTextY = PC_Y + (PC_H - cardFontSize) / 2;
    const cardGap = 19;

    const layoutCardText = (cardX: number, abbr: string, price: string) => {
      const abbrObj = new fabric.FabricText(abbr, {
        fontSize: s(cardFontSize), fontFamily: 'Inter, sans-serif',
        fontWeight: '300', fill: 'rgba(255,255,255,0.7)', charSpacing: -40,
      });
      const priceObj = new fabric.FabricText(price, {
        fontSize: s(cardFontSize), fontFamily: 'Inter, sans-serif',
        fontWeight: '300', fill: '#fff', charSpacing: -40,
      });
      const totalW = abbrObj.width! + s(cardGap) + priceObj.width!;
      const startX = s(cardX + PC_W / 2) - totalW / 2;
      add(abbrObj).set({ left: startX, top: s(cardTextY) });
      add(priceObj).set({ left: startX + abbrObj.width! + s(cardGap), top: s(cardTextY) });
    };
    layoutCardText(PC_LX, f.team1Abbr, f.price1);
    layoutCardText(PC_RX, f.team2Abbr, f.price2);

    // 6. Pred mark pill (yellow, centered between price cards)
    const pillX = CW / 2 - PRED_PILL_W / 2;
    const pillY = PC_Y + (PC_H - PRED_PILL_H) / 2;
    add(new fabric.Rect({
      left: s(pillX), top: s(pillY),
      width: s(PRED_PILL_W), height: s(PRED_PILL_H),
      rx: s(14.475), ry: s(14.475), fill: '#F8FB37',
    }));

    // Load pred mark into pill
    try {
      const mk = await fabric.FabricImage.fromURL('/logos/mark-black.svg');
      if (buildIdRef.current !== id) return;
      const mkS = MARK_W / mk.width!;
      add(mk);
      mk.set({
        scaleX: mkS * ds, scaleY: mkS * ds,
        left: s(pillX + PILL_PX),
        top: s(pillY + PILL_PY),
      });
    } catch { /* optional */ }
    if (buildIdRef.current !== id) return;

    // 7. Status pill (dynamic width based on text)
    const spH = 52;
    const spPadL = 58; // left padding (room for dot + gap)
    const spPadR = 24; // right padding
    // Measure text first to size the pill
    const statusText = new fabric.FabricText(f.status, {
      fontSize: s(34), fontFamily: 'Inter, sans-serif',
      fontWeight: '400', fill: '#30DB5B',
    });
    const spW = spPadL + (statusText.width! / dsRef.current) + spPadR;
    const spX = (CW - spW) / 2;
    add(new fabric.Rect({
      left: s(spX), top: s(STATUS_Y),
      width: s(spW), height: s(spH),
      rx: s(6), ry: s(6), fill: 'rgba(255,255,255,0.12)',
    }));
    // Green dot with glow ring (per Figma)
    const dotCX = spX + 30;
    const dotCY = STATUS_Y + spH / 2;
    const glowR = 11.4;
    const dotR = 8.5;
    const glowStroke = 5.7;
    // Fabric Circle positions from top-left; offset by radius + half stroke for glow
    add(new fabric.Circle({
      left: s(dotCX) - s(glowR) - s(glowStroke) / 2,
      top: s(dotCY) - s(glowR) - s(glowStroke) / 2,
      radius: s(glowR), fill: '', stroke: '#30DB5B',
      strokeWidth: s(glowStroke), opacity: 0.2,
    }));
    add(new fabric.Circle({
      left: s(dotCX) - s(dotR),
      top: s(dotCY) - s(dotR),
      radius: s(dotR), fill: '#30DB5B',
    }));
    add(statusText).set({
      left: s(spX + spPadL), top: s(STATUS_Y + 9),
      selectable: false, evented: false, originX: 'left', originY: 'top',
    });

    c.requestRenderAll();
  }, []); // stable — reads from refs

  // ── Load background image ──
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    let cancelled = false;

    (async () => {
      // Remove old bg
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

      // Add at bottom
      c.insertAt(0, img);
      bgRef.current = img;

      if (fontsReady) buildOverlays();
      onZoomChange?.(1);
    })();

    return () => { cancelled = true; };
  }, [imageDataUrl, fontsReady, buildOverlays]);

  // ── Rebuild overlays on field change or when fonts become ready ──
  useEffect(() => {
    if (!fabricRef.current || !fontsReady) return;
    buildOverlays();
  }, [fields, fontsReady, buildOverlays]);

  // ── Resize canvas + rebuild ──
  useEffect(() => {
    const c = fabricRef.current;
    if (!c || !containerSize.w) return;

    const pad = 32;
    const ds = Math.min((containerSize.w - pad * 2) / CW, (containerSize.h - pad * 2) / CH, 1);
    dsRef.current = ds;
    const dw = Math.round(CW * ds), dh = Math.round(CH * ds);
    c.setDimensions({ width: dw, height: dh });

    // Reposition bg
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

  // ── Imperative handle ──
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

export default MarketBannerCanvas;
