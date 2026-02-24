import type { TemplateDefinition } from './types';
import { logoOverlayTemplate } from './logo-overlay';
import { marketBannerTemplate } from './market-banner';

export const templates: TemplateDefinition[] = [
  logoOverlayTemplate,
  marketBannerTemplate,
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templates.find((t) => t.id === id);
}
