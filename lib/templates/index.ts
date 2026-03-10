import type { TemplateDefinition } from './types';
import { logoOverlayTemplate } from './logo-overlay';
import { marketBannerTemplate } from './market-banner';
import { soccerFixturesTemplate } from './soccer-fixtures';
import { halftimeScoreTemplate } from './halftime-score';

export const templates: TemplateDefinition[] = [
  logoOverlayTemplate,
  marketBannerTemplate,
  soccerFixturesTemplate,
  halftimeScoreTemplate,
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templates.find((t) => t.id === id);
}
