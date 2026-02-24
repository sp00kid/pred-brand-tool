# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Next.js client-side tool for creating brand-locked marketing assets. Users upload images, overlay Pred brand logos with constrained positioning, crop to social media aspect ratios, and export as PNG/JPEG. Includes a pixel-accurate Twitter/X "Lights Out" dark mode preview. No backend — everything runs in the browser using Fabric.js for canvas manipulation.

## Commands

- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npm run lint` — ESLint checks
- No test suite exists

## Architecture

**Rendering:** The app uses Next.js App Router with SSR disabled (`dynamic(..., { ssr: false })` in `app/page.tsx`) because Fabric.js requires browser APIs.

**State lives in Editor.tsx.** It's the sole orchestrator — all component state (image data, logo variant, constraints, crop ratio, zoom, export format, tab selection) is managed here via React hooks and passed down as props.

**Component flow:**
- `Editor` → `ImageUpload` (before image loaded) or canvas UI (after)
- `LogoCanvas` wraps Fabric.js — handles canvas lifecycle, image/logo rendering, zoom/pan, export via `useEffect` chains and `ResizeObserver`
- `TwitterPreview` captures canvas output on-demand for the preview tab

**Canvas scaling model (LogoCanvas.tsx):** Three scale factors matter:
- `displayScale` — shrinks original image to fit the viewport
- `userZoom` — 1-5x zoom controlled by scroll wheel
- `combinedScale` = displayScale × userZoom
- Export inverts display scale (`multiplier: 1/displayScale`) to produce original-resolution output

**Logo positioning (lib/constraints.ts):** Logos are placed relative to the *cropped* dimensions, not the original image. Gap and size are fractions of image width. Each logo variant has optical insets that compensate for visual whitespace in SVG bounding boxes — marks use 0.06, lockups use 0.22 (top/bottom only).

**Crop system (lib/crop.ts):** Presets are Original, 1:1, 4:3, 3:4, 16:9. Crop maximizes one dimension of the source image while maintaining the target ratio.

**Brand constants (lib/brand.ts):** Pred color palette — pred-yellow (#F4FB37), pred-black (#0D0D0D), etc. Tailwind theme in `globals.css` mirrors these as CSS custom properties.

## Key Technical Details

- **Next.js 16** with React 19, TypeScript strict mode, Tailwind CSS 4
- **Fabric.js 7** for all canvas operations
- Path alias: `@/*` maps to project root
- Logo SVGs live in `public/logos/` — 6 variants (mark/lockup × yellow/white/black)
- ESLint 9 flat config extends Next.js core-web-vitals + TypeScript
- Export formats: PNG (lossless, quality=1) and JPEG (quality=0.85), plus copy-to-clipboard via Clipboard API
