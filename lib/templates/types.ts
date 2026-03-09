export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'color' | 'image' | 'select' | 'repeater';
  default?: string;
  group?: string;
  half?: boolean; // render at half-width (side by side)
  options?: { label: string; value: string }[];
  // Repeater-specific
  itemFields?: TemplateField[];
  min?: number;
  max?: number;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  canvasWidth: number;
  canvasHeight: number;
  fields: TemplateField[];
  defaultValues: Record<string, string | Record<string, string>[]>;
}
