export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface LogoVariant {
  id: string;
  label: string;
  path: string;
  type: 'mark' | 'lockup';
  color: 'yellow' | 'white' | 'black';
  // Optical insets: fraction of bounding box that's visually empty on each side
  // Used to compensate gap calculations so visual gaps appear equal
  opticalInsets?: { top: number; right: number; bottom: number; left: number };
}

export const logoVariants: LogoVariant[] = [
  { id: 'mark-yellow',    label: 'Yellow Mark',   path: '/logos/mark-yellow.svg',    type: 'mark',   color: 'yellow',  opticalInsets: { top: 0.06, right: 0.06, bottom: 0.06, left: 0.06 } },
  { id: 'mark-white',     label: 'White Mark',    path: '/logos/mark-white.svg',     type: 'mark',   color: 'white',   opticalInsets: { top: 0.06, right: 0.06, bottom: 0.06, left: 0.06 } },
  { id: 'mark-black',     label: 'Black Mark',    path: '/logos/mark-black.svg',     type: 'mark',   color: 'black',   opticalInsets: { top: 0.06, right: 0.06, bottom: 0.06, left: 0.06 } },
  { id: 'lockup-yellow',  label: 'Yellow Lockup', path: '/logos/lockup-yellow.svg',  type: 'lockup', color: 'yellow',  opticalInsets: { top: 0.22, right: 0, bottom: 0.22, left: 0 } },
  { id: 'lockup-white',   label: 'White Lockup',  path: '/logos/lockup-white.svg',   type: 'lockup', color: 'white',   opticalInsets: { top: 0.22, right: 0, bottom: 0.22, left: 0 } },
  { id: 'lockup-black',   label: 'Black Lockup',  path: '/logos/lockup-black.svg',   type: 'lockup', color: 'black',   opticalInsets: { top: 0.22, right: 0, bottom: 0.22, left: 0 } },
];

export interface LogoConstraints {
  corner: Corner;
  gap: number;       // proportional gap as fraction of image width (e.g., 0.033 = 3.3%)
  logoScale: number; // logo width as fraction of image width (e.g., 0.12 = 12%)
  opacity: number;   // logo opacity 0–1 (1 = fully visible)
}

export const defaultConstraints: LogoConstraints = {
  corner: 'bottom-right',
  gap: 0.033,
  logoScale: 0.12,
  opacity: 1,
};

export function calculateLogoPosition(
  imageWidth: number,
  imageHeight: number,
  logoWidth: number,
  logoHeight: number,
  constraints: LogoConstraints,
  opticalInsets?: { top: number; right: number; bottom: number; left: number }
): { left: number; top: number } {
  const gapPx = imageWidth * constraints.gap;
  const scaledLogoWidth = imageWidth * constraints.logoScale;
  const scale = scaledLogoWidth / logoWidth;
  const scaledLogoHeight = logoHeight * scale;

  // Optical compensation: shift logo to account for visual dead space in bounding box
  const insetLeft = (opticalInsets?.left ?? 0) * scaledLogoWidth;
  const insetRight = (opticalInsets?.right ?? 0) * scaledLogoWidth;
  const insetTop = (opticalInsets?.top ?? 0) * scaledLogoHeight;
  const insetBottom = (opticalInsets?.bottom ?? 0) * scaledLogoHeight;

  let left: number;
  let top: number;

  switch (constraints.corner) {
    case 'top-left':
      left = gapPx - insetLeft;
      top = gapPx - insetTop;
      break;
    case 'top-right':
      left = imageWidth - scaledLogoWidth - gapPx + insetRight;
      top = gapPx - insetTop;
      break;
    case 'bottom-left':
      left = gapPx - insetLeft;
      top = imageHeight - scaledLogoHeight - gapPx + insetBottom;
      break;
    case 'bottom-right':
      left = imageWidth - scaledLogoWidth - gapPx + insetRight;
      top = imageHeight - scaledLogoHeight - gapPx + insetBottom;
      break;
  }

  return { left, top };
}
