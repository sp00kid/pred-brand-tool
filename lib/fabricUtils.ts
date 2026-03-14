import * as fabric from 'fabric';

export function applyBgBlur(
  bg: fabric.FabricImage | null,
  c: fabric.Canvas | null,
  bgBlur: number,
) {
  if (!bg || !c) return;
  if (bgBlur > 0) {
    if (bg.filters?.length === 1 && bg.filters[0] instanceof fabric.filters.Blur) {
      (bg.filters[0] as fabric.filters.Blur).blur = bgBlur / 100;
    } else {
      bg.filters = [new fabric.filters.Blur({ blur: bgBlur / 100 })];
    }
  } else {
    bg.filters = [];
  }
  bg.applyFilters();
  c.requestRenderAll();
}
