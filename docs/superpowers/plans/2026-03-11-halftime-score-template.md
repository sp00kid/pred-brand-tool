# Halftime Score Template Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4th template to the Pred Template Tool that generates 1080x1080 Instagram match score graphics with team pills, odds, league branding, and status tags, exporting at 2160x2160.

**Architecture:** Follows Market Banner pattern — new canvas component + sidebar + template definition. Reuses existing team data from Soccer Fixtures with added color fields. Fabric.js renders all layers (background image, overlay, typography, pills) with 2x export multiplier.

**Tech Stack:** Next.js 16, React 19, TypeScript, Fabric.js 7, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-03-11-halftime-score-template-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `lib/templates/halftime-score/index.ts` | Template definition, field schema, defaults |
| Create | `lib/templates/halftime-score/Sidebar.tsx` | Form inputs for all editable fields |
| Create | `lib/templates/halftime-score/leagues.ts` | League definitions with white logo paths |
| Create | `components/HalftimeScoreCanvas.tsx` | Fabric.js canvas rendering + 2x export |
| Create | `public/mock/halftime-default.jpg` | Default background image for mock data |
| Modify | `lib/templates/soccer-fixtures/teams.ts` | Add `primaryColor` and `borderColor` per team |
| Modify | `lib/templates/index.ts` | Register new template |
| Modify | `components/Editor.tsx` | Add template to switcher, refs, conditional rendering |

---

## Chunk 1: Data Layer

### Task 1: Add team colors to existing team data

**Files:**
- Modify: `lib/templates/soccer-fixtures/teams.ts`

- [ ] **Step 1: Add color fields to Team interface**

```typescript
export interface Team {
  id: string;
  name: string;
  badge: string;
  primaryColor: string;   // pill background hex
  borderColor: string;    // darker extrude hex
}
```

- [ ] **Step 2: Add colors to every team in the leagues array**

Add `primaryColor` and `borderColor` to each team object. Examples:

```typescript
{ id: 'arsenal', name: 'Arsenal', badge: 'arsenal.png', primaryColor: '#EF0107', borderColor: '#7A0004' },
{ id: 'chelsea', name: 'Chelsea', badge: 'chelsea.png', primaryColor: '#034694', borderColor: '#011B45' },
{ id: 'liverpool', name: 'Liverpool', badge: 'liverpool.png', primaryColor: '#C8102E', borderColor: '#6B0A1A' },
{ id: 'real-madrid', name: 'Real Madrid', badge: 'realmadrid.png', primaryColor: '#FEBE10', borderColor: '#8A6A08' },
{ id: 'barcelona', name: 'Barcelona', badge: 'barcelona.png', primaryColor: '#A50044', borderColor: '#4D0020' },
{ id: 'galatasaray', name: 'Galatasaray', badge: 'galatasaray.png', primaryColor: '#DA9B14', borderColor: '#A06E0A' },
// ... all 84 teams need colors
```

Use each club's official primary color. Border color is the same hue darkened significantly.

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors (existing code already uses Team interface, new fields are additions)

- [ ] **Step 4: Commit**

```bash
git add lib/templates/soccer-fixtures/teams.ts
git commit -m "feat: add primaryColor and borderColor to team definitions"
```

### Task 2: Create league definitions

**Files:**
- Create: `lib/templates/halftime-score/leagues.ts`

- [ ] **Step 1: Create league data file**

```typescript
export interface LeagueDef {
  id: string;
  name: string;
  logo: string; // path relative to /badges/
}

export const leagueOptions: LeagueDef[] = [
  { id: 'ucl', name: 'Champions League', logo: 'ucl.png' },
  { id: 'premier-league', name: 'Premier League', logo: 'premierleague.svg' },
  { id: 'la-liga', name: 'La Liga', logo: 'laliga-white.png' },
  { id: 'bundesliga', name: 'Bundesliga', logo: 'bundesliga-white.png' },
  { id: 'serie-a', name: 'Serie A', logo: 'seriea-white.png' },
  { id: 'ligue-1', name: 'Ligue 1', logo: 'ligue1-white.png' },
];

export function getLeagueById(id: string): LeagueDef | undefined {
  return leagueOptions.find(l => l.id === id);
}
```

Note: Only UCL, PL, and La Liga have white logos ready. Other leagues need white logo PNGs added to `badges/` — can be done incrementally. For now, include only leagues with existing assets and add more later.

- [ ] **Step 2: Commit**

```bash
git add lib/templates/halftime-score/leagues.ts
git commit -m "feat: add league definitions for halftime score template"
```

### Task 3: Create template definition

**Files:**
- Create: `lib/templates/halftime-score/index.ts`

- [ ] **Step 1: Create template definition**

```typescript
import { TemplateDefinition } from '../types';

export const halftimeScoreTemplate: TemplateDefinition = {
  id: 'halftime-score',
  name: 'Halftime Score',
  description: 'Instagram match score graphic with odds pills',
  canvasWidth: 1080,
  canvasHeight: 1080,
  fields: [
    { id: 'homeTeam', label: 'Home Team', type: 'select', group: 'Teams', half: true },
    { id: 'awayTeam', label: 'Away Team', type: 'select', group: 'Teams', half: true },
    { id: 'homeScore', label: 'Home Score', type: 'text', group: 'Score', half: true },
    { id: 'awayScore', label: 'Away Score', type: 'text', group: 'Score', half: true },
    { id: 'homeOdds', label: 'Home Odds %', type: 'text', group: 'Odds', half: true },
    { id: 'awayOdds', label: 'Away Odds %', type: 'text', group: 'Odds', half: true },
    { id: 'status', label: 'Status', type: 'select', group: 'Match Info',
      options: [
        { label: 'Halftime', value: 'HALFTIME' },
        { label: 'Fulltime', value: 'FULLTIME' },
        { label: 'Live', value: 'LIVE' },
      ]
    },
    { id: 'league', label: 'League', type: 'select', group: 'Match Info' },
  ],
  defaultValues: {
    homeTeam: 'real-madrid',
    awayTeam: 'barcelona',
    homeScore: '0',
    awayScore: '2',
    homeOdds: '30',
    awayOdds: '52',
    status: 'LIVE',
    league: 'la-liga',
  },
};
```

- [ ] **Step 2: Register in template index**

Modify `lib/templates/index.ts` — add import and include in `templates` array:

```typescript
import { halftimeScoreTemplate } from './halftime-score';

export const templates: TemplateDefinition[] = [
  logoOverlayTemplate,
  marketBannerTemplate,
  soccerFixturesTemplate,
  halftimeScoreTemplate,
];
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add lib/templates/halftime-score/index.ts lib/templates/index.ts
git commit -m "feat: add halftime score template definition and register it"
```

---

## Chunk 2: Sidebar

### Task 4: Create the sidebar component

**Files:**
- Create: `lib/templates/halftime-score/Sidebar.tsx`

- [ ] **Step 1: Define the fields interface**

```typescript
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
```

- [ ] **Step 2: Build sidebar component**

Follow the MarketBannerSidebar pattern. Key sections:

1. **Teams** — two `<select>` dropdowns using `leagues` from `soccer-fixtures/teams.ts` with `<optgroup>` per league
2. **Score** — two text inputs (half-width, side by side)
3. **Odds** — two text inputs with "%" suffix label (half-width)
4. **Match Info** — status `<select>` (HALFTIME/FULLTIME/LIVE) + league `<select>` from `leagues.ts`

Use the same styling classes as existing sidebars:
- Section labels: `text-[11px] font-medium uppercase tracking-wider text-white/50 mb-2`
- Inputs: `h-8 bg-pred-surface border border-pred-border rounded-md px-2.5`
- Selects: same styling with `appearance-none`

The `update` helper pattern:
```typescript
const update = (key: keyof HalftimeScoreFields, value: string) => {
  onChange({ ...fields, [key]: value });
};
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add lib/templates/halftime-score/Sidebar.tsx
git commit -m "feat: add halftime score sidebar with team, score, odds, and match info inputs"
```

---

## Chunk 3: Canvas Rendering

### Task 5: Create the canvas component

**Files:**
- Create: `components/HalftimeScoreCanvas.tsx`

This is the largest task. Follow the `SoccerFixturesCanvas.tsx` pattern exactly for structure, but with simpler layout (no repeater rows).

- [ ] **Step 1: Set up component scaffold**

```typescript
'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { HalftimeScoreFields } from '@/lib/templates/halftime-score/Sidebar';
import { getTeamById } from '@/lib/templates/soccer-fixtures/teams';
import { getLeagueById } from '@/lib/templates/halftime-score/leagues';

export interface HalftimeScoreCanvasHandle {
  exportImage: (format: 'png' | 'jpeg', quality?: number) => string | null;
  resetFraming: () => void;
  zoomTo: (level: number) => void;
  getPreview: () => string | null;
}

const CW = 1080;
const CH = 1080;
```

- [ ] **Step 2: Implement canvas lifecycle**

Same pattern as other canvases:
- `useEffect` for canvas init with `ResizeObserver`
- `dsRef` for display scale, `zoomRef` for user zoom
- `fabricRef` for canvas instance
- `useImperativeHandle` exposes `exportImage`, `resetFraming`, `zoomTo`, `getPreview`
- Export uses `multiplier: 2 / dsRef.current` for 2160x2160 output

- [ ] **Step 3: Implement `buildOverlays()` function**

This renders all template layers. Scale helper: `const s = (v: number) => Math.round(v * ds * 100) / 100;`

**Layer order (bottom to top):**

1. **Background image** — loaded from `imageDataUrl` prop or default mock, cover-fit
2. **Dark overlay** — `fabric.Rect` with semi-transparent black fill, full canvas
3. **Pred lockup** — load `/logos/lockup-white.svg`, position top-left (45, 45)
4. **Status tag** — `fabric.FabricText`, top-right, Barlow Condensed Black Italic, fill `#22C55E`
5. **Home score** — large Geist text, left column
6. **Away score** — large Geist text, right column
7. **League logo** — loaded from `badges/[logo]`, center, white, 15% opacity
8. **Home pill** — `fabric.Rect` with team primaryColor + border, team badge image behind, "TEAM XX%" text
9. **Pred icon** — center, dark rounded square with mark-white.svg
10. **Away pill** — same as home pill for away team

**Pill rendering detail:**
```typescript
// Pill background
const pillBg = new fabric.Rect({
  width: s(286), height: s(128),
  rx: s(35), ry: s(35),
  fill: homeTeam.primaryColor + 'EB', // slight transparency
});

// Pill extrude border (separate rect below)
const pillBorder = new fabric.Rect({
  width: s(286), height: s(10),
  fill: homeTeam.borderColor + 'E6',
});

// Team badge behind text (scaled up, low opacity, clipped by pill group)
// Use fabric.Group with clipPath for overflow:hidden effect

// Text overlay
const pillText = new fabric.FabricText(`${abbr} ${odds}%`, {
  fontSize: s(54), fontFamily: '"Geist", sans-serif',
  fontWeight: '600', fill: '#FFFFFF',
});
```

For the pill badge-behind-text effect, use `fabric.Group` with a `clipPath` (rounded rect) to achieve overflow:hidden.

- [ ] **Step 4: Implement font loading**

Load Geist (already in the app via Next.js) and Barlow Condensed (needs FontFace API load):

```typescript
useEffect(() => {
  const font = new FontFace('Barlow Condensed', 'url(https://fonts.gstatic.com/s/barlowcondensed/v12/HTxxL3I-JCGChYJ8VI-L6OO_au7B46r_04MvKQ.woff2)', {
    weight: '900',
    style: 'italic',
  });
  font.load().then(f => {
    document.fonts.add(f);
    // trigger rebuild
  });
}, []);
```

- [ ] **Step 5: Implement background image loading**

Same pattern as MarketBannerCanvas: load from `imageDataUrl` prop or fall back to `/mock/halftime-default.jpg`. Use `fabric.FabricImage.fromURL()`.

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 7: Commit**

```bash
git add components/HalftimeScoreCanvas.tsx
git commit -m "feat: add halftime score canvas with full layout rendering and 2x export"
```

---

## Chunk 4: Editor Integration

### Task 6: Wire everything into Editor.tsx

**Files:**
- Modify: `components/Editor.tsx`

- [ ] **Step 1: Add imports**

```typescript
import HalftimeScoreCanvas, { HalftimeScoreCanvasHandle } from './HalftimeScoreCanvas';
import HalftimeScoreSidebar, { HalftimeScoreFields } from '@/lib/templates/halftime-score/Sidebar';
```

- [ ] **Step 2: Add state and ref**

Near existing canvas refs (~line 58):
```typescript
const halftimeCanvasRef = useRef<HalftimeScoreCanvasHandle>(null);
```

Near existing field states:
```typescript
const [halftimeFields, setHalftimeFields] = useState<HalftimeScoreFields>({
  homeTeam: 'real-madrid',
  awayTeam: 'barcelona',
  homeScore: '0',
  awayScore: '2',
  homeOdds: '30',
  awayOdds: '52',
  status: 'LIVE',
  league: 'la-liga',
});
```

- [ ] **Step 3: Update getActiveCanvas**

```typescript
if (activeTemplate === 'halftime-score') return halftimeCanvasRef.current;
```

- [ ] **Step 4: Add canvas rendering**

In the canvas area (near lines 258-288), add:

```typescript
{activeTemplate === 'halftime-score' && (
  <HalftimeScoreCanvas
    ref={halftimeCanvasRef}
    fields={halftimeFields}
    imageDataUrl={imageDataUrl}
    onZoomChange={setZoom}
    onCanvasUpdate={handleCanvasUpdate}
  />
)}
```

- [ ] **Step 5: Add sidebar rendering**

In the sidebar conditional (near lines 377-439), add the `halftime-score` case:

```typescript
activeTemplate === 'halftime-score' ? (
  <>
    <ImageUpload ... />
    <HalftimeScoreSidebar fields={halftimeFields} onChange={setHalftimeFields} />
  </>
)
```

- [ ] **Step 6: Add template tab**

In the template tab bar, add a new tab button for "Halftime Score" with id `halftime-score`.

- [ ] **Step 7: Verify dev server runs**

Run: `npm run dev`
Open: `http://localhost:3000`
Expected: 4th tab visible, clicking it shows the halftime score template with mock data

- [ ] **Step 8: Commit**

```bash
git add components/Editor.tsx
git commit -m "feat: integrate halftime score template into editor"
```

---

## Chunk 5: Assets & Polish

### Task 7: Add default mock image

**Files:**
- Create: `public/mock/halftime-default.jpg`

- [ ] **Step 1: Source a mock background image**

Download a suitable football/soccer action photo for the default RMA vs BAR mock. Save to `public/mock/halftime-default.jpg`. Target ~200-400KB, landscape orientation that works when center-cropped to 1:1.

- [ ] **Step 2: Commit**

```bash
git add public/mock/halftime-default.jpg
git commit -m "feat: add default mock image for halftime score template"
```

### Task 8: Add missing league white logos

**Files:**
- Create: `badges/bundesliga-white.png` (if needed)
- Create: `badges/seriea-white.png` (if needed)
- Create: `badges/ligue1-white.png` (if needed)

- [ ] **Step 1: Source white-on-transparent logos for remaining leagues**

Use the same Python approach as La Liga: download logo, convert to white on transparent background, save to `badges/`.

- [ ] **Step 2: Commit**

```bash
git add badges/*-white.png
git commit -m "feat: add white league logos for halftime score template"
```

### Task 9: Visual QA and fixes

- [ ] **Step 1: Test all field combinations**

- Switch teams, verify pill colors update
- Change scores, verify layout stays centered
- Toggle status between HALFTIME/FULLTIME/LIVE
- Switch leagues, verify logo swaps
- Upload custom background image
- Test export at 2160x2160 in both PNG and JPEG

- [ ] **Step 2: Fix any layout/rendering issues found**

- [ ] **Step 3: Final commit**

```bash
git commit -m "fix: halftime score template visual polish and fixes"
```

---

## Execution Order

Tasks 1-3 (data layer) → Task 4 (sidebar) → Task 5 (canvas) → Task 6 (editor integration) → Tasks 7-9 (assets & polish)

Tasks 1, 2, and 3 can be parallelized. Task 5 is the critical path — it's the most complex piece.
