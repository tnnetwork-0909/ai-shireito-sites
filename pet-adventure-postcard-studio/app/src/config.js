// Single source of truth for product, print and export settings.
// Change values here; everything else reads from this file.

export const PRODUCT = {
  name: 'Pet Adventure Postcard Studio',
  price: '$5',
  priceNote: 'one-time',
};

// Print: landscape 6 x 4 in, no bleed, 0.25 in safe margin on all four sides.
export const PRINT = {
  widthIn: 6,
  heightIn: 4,
  widthPt: 432, // 6 in * 72 pt
  heightPt: 288, // 4 in * 72 pt
  safeMarginPt: 18, // 0.25 in
  bleedPt: 0,
};

// Image export: exactly 300 px per inch over the 6 x 4 in card.
export const IMAGE = {
  widthPx: 1800,
  heightPx: 1200,
  mimeType: 'image/jpeg',
  quality: 0.92,
  extension: 'jpg',
};

// Photo resolution check, measured at the photo's placed size on the card.
export const PHOTO_QUALITY = {
  targetPpi: 300, // at or above: no warning
  minimumPpi: 150, // below: strong warning (export still allowed)
};

export const INPUT_LIMITS = {
  petNameMax: 20,
  notesMax: 280,
  sitterNameMax: 30,
  photoMaxBytes: 25 * 1024 * 1024,
  photoTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

export const PALETTE = {
  paper: '#FFFDF8',
  ink: '#1F2937', // 14.9:1 on paper
  inkMuted: '#4B5563', // 7.4:1 on paper
  accent: '#9A3412', // 7.0:1 on paper; the only accent color
  accentTint: '#F3D9CC', // decorative lines only, never text
  photoBackdrop: '#E5E7EB',
};

export const FONTS = {
  title: 'Georgia, "Times New Roman", serif',
  body: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};
