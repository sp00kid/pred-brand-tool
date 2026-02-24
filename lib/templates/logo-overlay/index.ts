import type { TemplateDefinition } from '../types';

export const logoOverlayTemplate: TemplateDefinition = {
  id: 'logo-overlay',
  name: 'Logo Overlay',
  description: 'Place the Pred logo on any photo',
  canvasWidth: 0,  // dynamic — adapts to uploaded image
  canvasHeight: 0,
  fields: [],
  defaultValues: {},
};
