# Halftime Score Template — Design Spec

## Overview

A new template for the Pred Template Tool that generates 1080x1080 Instagram match score graphics. Shows two teams with scores, win probability odds as styled pills, league branding, and a status tag (HALFTIME/FULLTIME/LIVE). Exports at 2160x2160 (2x resolution).

## Visual Reference

Designed in Paper across three artboards:
- GAL vs LIV (UCL, HALFTIME)
- ARS vs CHE (PL, FULLTIME)
- RMA vs BAR (La Liga, LIVE)

## Architecture

Follows the Market Banner pattern: canvas component + sidebar + template definition.

### New Files

- `components/HalftimeScoreCanvas.tsx` — renders the 1080x1080 graphic to canvas
- `components/HalftimeScoreSidebar.tsx` — form inputs for all editable fields
- `lib/templates/halftimeScore.ts` — template metadata, field schema, default values

### Modified Files

- `components/Editor.tsx` — add as 4th template in `activeTemplate` state and tab switcher
- Team data source — add `primaryColor` and `borderColor` per team

## Data Model

```ts
interface HalftimeScoreData {
  homeTeam: string;       // team ID from existing fixtures team list
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeOdds: number;       // percentage, e.g. 30
  awayOdds: number;       // percentage, e.g. 52
  status: 'HALFTIME' | 'FULLTIME' | 'LIVE';
  league: string;         // league ID
  backgroundImage: string; // data URL or default mock path
}
```

## Team Color System

Each team gets two new color fields that drive pill styling automatically on selection:

```ts
primaryColor: string;   // pill background (e.g. "#EF0107" for Arsenal)
borderColor: string;    // darker extrude border-bottom (e.g. "#7A0004")
```

No manual color picking — colors derive from team selection.

## League Data

League definitions with:
- Name and abbreviation
- White logo path in `badges/` directory
- Existing assets: UCL (`badges/ucl.png`), Premier League (`badges/premierleague.svg`), La Liga (`badges/laliga-white.png`)

Manual league selector in sidebar — no auto-detection from teams.

## Canvas Layout (bottom to top)

1. **Background image** — cover fit, centered
2. **Dark gradient overlay** — user-tuned opacity from Paper design
3. **Top bar** — Pred lockup white (left) + status tag (right)
   - Status tag: Barlow Condensed Black Italic, green (#22C55E)
4. **Score + league row** — home score (left) + white league logo at 15% opacity (center) + away score (right)
   - Score font: Geist, heavy weight, ~200px
5. **Odds row** — home pill (left) + Pred icon in dark rounded square (center) + away pill (right)

### Pill Structure

- Team primary color background with slight transparency (EB alpha)
- Darker border-bottom extrude (~10px, E6 alpha)
- Team badge scaled up at low opacity behind text (overflow hidden)
- Centered text: team abbreviation + odds percentage
- Border radius: 35px
- Width: 286px (at 1080 canvas scale)

## Team List

Reuses existing 84 teams from Soccer Fixtures (`public/badges/`). Same selection UI pattern.

## Export

- Canvas display: 1080x1080
- Export resolution: 2160x2160 (2x multiplier)
- Formats: PNG (lossless) and JPEG (0.85 quality)
- Auto-generated filename from team abbreviations

## Mock Default

Ships pre-filled: RMA vs BAR, La Liga, LIVE, 0-2, 30% vs 52%. Default background image stored in `public/mock/`.
