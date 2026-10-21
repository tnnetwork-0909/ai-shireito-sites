// Card geometry (in PDF points) and the math that depends on it.
// One shared grid for all three card styles keeps them visually consistent.
import { PRINT, IMAGE, PHOTO_QUALITY } from './config.js';

const S = PRINT.safeMarginPt;
const GUTTER = 18;
const PHOTO_W = 216; // 3.0 in
const TEXT_X = S + PHOTO_W + GUTTER;

export const LAYOUT = {
  safe: { x: S, y: S, w: PRINT.widthPt - 2 * S, h: PRINT.heightPt - 2 * S },
  photo: { x: S, y: S, w: PHOTO_W, h: PRINT.heightPt - 2 * S }, // 3.0 x 3.5 in
  text: { x: TEXT_X, y: S, w: PRINT.widthPt - S - TEXT_X, h: PRINT.heightPt - 2 * S }, // 2.25 x 3.5 in
  kicker: { sizePt: 9, letterSpacingPt: 1.2 },
  title: { sizePt: 16, minSizePt: 13, lineHeight: 1.2, maxLines: 2 },
  rule: { lengthPt: 36, weightPt: 1 },
  date: { sizePt: 9 },
  notes: { sizePt: 11, minSizePt: 9, lineHeight: 1.35 },
  signOff: { sizePt: 10, minSizePt: 8, lineHeight: 1.2, maxLines: 2, reservedPt: 20 }, // 2 lines x 8pt x 1.2 = 19.2 <= 20
};

export const PX_PER_PT = IMAGE.widthPx / PRINT.widthPt; // 300 / 72

export function ptToPx(pt) {
  return pt * PX_PER_PT;
}

// Source pixels needed so the photo frame reaches the target ppi.
export function requiredPhotoPixels(frame = LAYOUT.photo, ppi = PHOTO_QUALITY.targetPpi) {
  return { w: Math.ceil((frame.w / 72) * ppi), h: Math.ceil((frame.h / 72) * ppi) };
}

// The photo is cropped to fill the frame ("cover"), so the shorter side relative
// to the frame decides how many source pixels land on each printed inch.
export function effectivePpi(srcW, srcH, frame = LAYOUT.photo) {
  const ppi = Math.min(srcW / (frame.w / 72), srcH / (frame.h / 72));
  return Math.floor(ppi + 1e-9);
}

export function photoQuality(srcW, srcH, frame = LAYOUT.photo) {
  const ppi = effectivePpi(srcW, srcH, frame);
  let level = 'ok';
  if (ppi < PHOTO_QUALITY.minimumPpi) level = 'veryLow';
  else if (ppi < PHOTO_QUALITY.targetPpi) level = 'low';
  return { ppi, level, required: requiredPhotoPixels(frame) };
}

// Centered crop of the source that fills the frame without distortion.
export function coverCrop(srcW, srcH, frameW, frameH) {
  const scale = Math.max(frameW / srcW, frameH / srcH);
  const sw = frameW / scale;
  const sh = frameH / scale;
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh };
}

// Greedy word wrap. `measure(str)` returns width in the same unit as maxWidth.
// Breaks only at plain spaces (a no-break space U+00A0 holds words together).
// Words longer than a line are split by grapheme (so 🐕‍🦺 or é stay whole).
// A single grapheme wider than the line is kept as-is, so a line can still be
// too wide; fitText() re-checks widths and rejects that case.
const graphemeSegmenter = typeof Intl !== 'undefined' && Intl.Segmenter
  ? new Intl.Segmenter('en', { granularity: 'grapheme' })
  : null;

function graphemes(str) {
  return graphemeSegmenter ? Array.from(graphemeSegmenter.segment(str), (g) => g.segment) : [...str];
}

export function wrapText(text, maxWidth, measure) {
  const lines = [];
  for (const paragraph of String(text).split('\n')) {
    const words = paragraph.split(/ +/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      if (measure(word) <= maxWidth) {
        line = word;
        continue;
      }
      let chunk = '';
      for (const ch of graphemes(word)) {
        if (measure(chunk + ch) > maxWidth && chunk) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
    }
    lines.push(line);
  }
  return lines;
}

// Largest font size (whole points, from maxSize down to minSize) at which the
// wrapped text fits within maxWidth x maxHeight. Returns null if it never fits.
// `measureAt(str, sizePt)` returns width in points.
export function fitText(text, { maxWidth, maxHeight, maxSize, minSize, lineHeight, maxLines = Infinity }, measureAt) {
  for (let size = maxSize; size >= minSize; size -= 1) {
    const measure = (s) => measureAt(s, size);
    const lines = wrapText(text, maxWidth, measure);
    if (
      lines.length <= maxLines &&
      lines.length * size * lineHeight <= maxHeight &&
      lines.every((line) => measure(line) <= maxWidth)
    ) {
      return { sizePt: size, lines };
    }
  }
  return null;
}
