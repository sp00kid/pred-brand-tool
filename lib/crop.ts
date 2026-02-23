export interface CropPreset {
  id: string;
  label: string;
  ratio: number | null; // w/h ratio, null = no crop (original)
}

export const cropPresets: CropPreset[] = [
  { id: 'original', label: 'Original', ratio: null },
  { id: '1:1',      label: '1:1',      ratio: 1 },
  { id: '4:3',      label: '4:3',      ratio: 4 / 3 },
  { id: '3:4',      label: '3:4',      ratio: 3 / 4 },
  { id: '16:9',     label: '16:9',     ratio: 16 / 9 },
];

/**
 * Returns the largest rect of the target ratio that fits inside the source image.
 * Always maximizes one dimension.
 */
export function calculateCropDimensions(
  imgW: number,
  imgH: number,
  ratio: number | null
): { cropW: number; cropH: number } {
  if (ratio === null) return { cropW: imgW, cropH: imgH };

  const imgRatio = imgW / imgH;

  if (imgRatio > ratio) {
    // Image is wider than target — constrain by height
    return { cropW: Math.round(imgH * ratio), cropH: imgH };
  } else {
    // Image is taller than target — constrain by width
    return { cropW: imgW, cropH: Math.round(imgW / ratio) };
  }
}
