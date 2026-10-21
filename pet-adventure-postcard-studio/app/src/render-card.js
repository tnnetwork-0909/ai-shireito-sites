// Draws a card. planCard() is pure (positions in points) so it can be tested;
// drawCard() paints the plan onto a 1800 x 1200 canvas 2D context.
import { IMAGE, PALETTE, FONTS } from './config.js';
import { LAYOUT, PX_PER_PT, coverCrop, fitText } from './layout.js';

const GAP = { afterKicker: 6, afterTitle: 6, afterRule: 8, afterDate: 8 };

// measureAt(str, sizePt, role) -> width in points; role is 'title' | 'body'.
export function planCard(content, measureAt) {
  const t = LAYOUT.text;
  const items = [];
  let y = t.y;

  items.push({ text: content.kicker, x: t.x, y, sizePt: LAYOUT.kicker.sizePt, role: 'kicker', color: PALETTE.accent });
  y += LAYOUT.kicker.sizePt * 1.2 + GAP.afterKicker;

  const title = fitText(
    content.title,
    {
      maxWidth: t.w,
      maxHeight: Infinity,
      maxSize: LAYOUT.title.sizePt,
      minSize: LAYOUT.title.minSizePt,
      lineHeight: LAYOUT.title.lineHeight,
      maxLines: LAYOUT.title.maxLines,
    },
    (s, size) => measureAt(s, size, 'title'),
  );
  if (!title) return { error: 'petNameTooLong', items: [] };
  for (const line of title.lines) {
    items.push({ text: line, x: t.x, y, sizePt: title.sizePt, role: 'title', color: PALETTE.ink });
    y += title.sizePt * LAYOUT.title.lineHeight;
  }
  y += GAP.afterTitle;

  const rule = { x: t.x, y, w: LAYOUT.rule.lengthPt, h: LAYOUT.rule.weightPt };
  y += LAYOUT.rule.weightPt + GAP.afterRule;

  if (content.dateLine) {
    items.push({ text: content.dateLine, x: t.x, y, sizePt: LAYOUT.date.sizePt, role: 'body', color: PALETTE.inkMuted });
    y += LAYOUT.date.sizePt * 1.3 + GAP.afterDate;
  }

  // Signature: shrinks 10 -> 8 pt, then wraps to 2 lines, bottom-aligned in its reserved band.
  let signOff = null;
  if (content.signOff) {
    const so = LAYOUT.signOff;
    signOff = fitText(
      content.signOff,
      { maxWidth: t.w, maxHeight: so.reservedPt, maxSize: so.sizePt, minSize: so.minSizePt, lineHeight: so.lineHeight, maxLines: so.maxLines },
      (s, size) => measureAt(s, size, 'signOff'),
    );
    if (!signOff) return { error: 'signOffDontFit', items: [] };
  }

  const bottom = t.y + t.h - (signOff ? LAYOUT.signOff.reservedPt : 0);
  const notes = fitText(
    content.notes,
    {
      maxWidth: t.w,
      maxHeight: bottom - y,
      maxSize: LAYOUT.notes.sizePt,
      minSize: LAYOUT.notes.minSizePt,
      lineHeight: LAYOUT.notes.lineHeight,
    },
    (s, size) => measureAt(s, size, 'body'),
  );
  if (!notes) return { error: 'notesDontFit', items: [] };
  const notesTop = y;
  for (const line of notes.lines) {
    items.push({ text: line, x: t.x, y, sizePt: notes.sizePt, role: 'body', color: PALETTE.ink });
    y += notes.sizePt * LAYOUT.notes.lineHeight;
  }

  if (signOff) {
    const step = signOff.sizePt * LAYOUT.signOff.lineHeight;
    let sy = t.y + t.h - signOff.lines.length * step;
    for (const line of signOff.lines) {
      items.push({ text: line, x: t.x, y: sy, sizePt: signOff.sizePt, role: 'signOff', color: PALETTE.ink });
      sy += step;
    }
  }

  return {
    error: null,
    items,
    rule,
    notesBox: { x: t.x, y: notesTop, w: t.w, h: bottom - notesTop, lineStepPt: notes.sizePt * LAYOUT.notes.lineHeight },
  };
}

export function fontFor(role, sizePt) {
  const px = sizePt * PX_PER_PT;
  if (role === 'title') return `700 ${px}px ${FONTS.title}`;
  if (role === 'signOff') return `italic 400 ${px}px ${FONTS.title}`;
  if (role === 'kicker') return `700 ${px}px ${FONTS.body}`;
  return `400 ${px}px ${FONTS.body}`;
}

export function canvasMeasurer(ctx) {
  return (str, sizePt, role) => {
    ctx.font = fontFor(role, sizePt);
    return ctx.measureText(str).width / PX_PER_PT;
  };
}

// photo: anything drawImage accepts with .width/.height (e.g. ImageBitmap).
// Returns { error } — null on success, otherwise a COPY.errors key.
export function drawCard(ctx, content, photo, template) {
  const k = PX_PER_PT;
  ctx.save();
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, IMAGE.widthPx, IMAGE.heightPx);

  const plan = planCard(content, canvasMeasurer(ctx));
  if (plan.error) {
    ctx.restore();
    return { error: plan.error };
  }

  const p = LAYOUT.photo;
  const photoPx = {
    x: Math.round(p.x * k),
    y: Math.round(p.y * k),
    w: Math.round(p.w * k),
    h: Math.round(p.h * k),
  };
  ctx.fillStyle = PALETTE.photoBackdrop;
  ctx.fillRect(photoPx.x, photoPx.y, photoPx.w, photoPx.h);
  if (photo) {
    const c = coverCrop(photo.width, photo.height, p.w, p.h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(photo, c.sx, c.sy, c.sw, c.sh, photoPx.x, photoPx.y, photoPx.w, photoPx.h);
  }

  drawFrame(ctx, template.frame, plan);

  ctx.fillStyle = PALETTE.accent;
  ctx.fillRect(plan.rule.x * k, plan.rule.y * k, plan.rule.w * k, plan.rule.h * k);

  ctx.textBaseline = 'top';
  for (const item of plan.items) {
    ctx.font = fontFor(item.role, item.sizePt);
    ctx.fillStyle = item.color;
    // letterSpacing is Chromium/Firefox only; other browsers just skip it.
    if ('letterSpacing' in ctx) ctx.letterSpacing = item.role === 'kicker' ? `${LAYOUT.kicker.letterSpacingPt * k}px` : '0px';
    ctx.fillText(item.text, item.x * k, item.y * k);
  }
  ctx.restore();
  return { error: null };
}

function drawFrame(ctx, frame, plan) {
  const k = PX_PER_PT;
  if (frame === 'photoBorder') {
    const p = LAYOUT.photo;
    ctx.strokeStyle = PALETTE.accent;
    ctx.lineWidth = 1.5 * k;
    const inset = 0.75 * k; // keep the stroke inside the safe area
    ctx.strokeRect(p.x * k + inset, p.y * k + inset, p.w * k - 2 * inset, p.h * k - 2 * inset);
  } else if (frame === 'ruledLines') {
    const b = plan.notesBox;
    ctx.strokeStyle = PALETTE.accentTint;
    ctx.lineWidth = 0.5 * k;
    const lastSafeY = Math.min(b.y + b.h, LAYOUT.safe.y + LAYOUT.safe.h - 0.25);
    for (let y = b.y + b.lineStepPt; y <= lastSafeY; y += b.lineStepPt) {
      ctx.beginPath();
      ctx.moveTo((b.x + 0.25) * k, y * k);
      ctx.lineTo((b.x + b.w - 0.25) * k, y * k);
      ctx.stroke();
    }
  } else if (frame === 'doubleRule') {
    // Postcard-style paper mat: a paper-colored band, then a thin accent line.
    const p = LAYOUT.photo;
    ctx.strokeStyle = PALETTE.paper;
    ctx.lineWidth = 6 * k;
    ctx.strokeRect((p.x + 3) * k, (p.y + 3) * k, (p.w - 6) * k, (p.h - 6) * k);
    ctx.strokeStyle = PALETTE.accent;
    ctx.lineWidth = 0.75 * k;
    ctx.strokeRect((p.x + 6.4) * k, (p.y + 6.4) * k, (p.w - 12.8) * k, (p.h - 12.8) * k);
  }
}
