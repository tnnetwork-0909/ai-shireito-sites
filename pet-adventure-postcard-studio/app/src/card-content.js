// Turns the form input into the exact text printed on the card.
// Rule: every word on the card comes from the sitter's input or from the
// fixed template frame. Nothing is generated, summarized or embellished.
import { INPUT_LIMITS } from './config.js';
import { getTemplate } from './templates.js';

// Strip control characters (keep line breaks), trim, and collapse runs of
// spaces / blank lines so the layout is predictable. Wording is untouched.
export function cleanText(value, { multiline = false } = {}) {
  let s = String(value ?? '').replace(/\r\n?/g, '\n');
  s = s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ');
  // Invisible direction overrides / zero-width marks could reorder or hide
  // printed words. ZWJ (U+200D) stays: emoji like 🐕‍🦺 need it.
  s = s.replace(/[\u061C\u200B\u200E\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g, '');
  if (!multiline) s = s.replace(/\n/g, ' ');
  s = s.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

// "2026-10-19" -> "October 19, 2026". Parsed as UTC so the day never shifts.
export function formatVisitDate(isoDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate ?? ''));
  if (!m) return '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (d.getUTCMonth() !== +m[2] - 1) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

// Counted in UTF-16 units, the same unit the inputs' maxLength uses, so the
// counter, the browser limit and validation always agree (an emoji counts 2).
export function textLength(value) {
  return String(value).length;
}

// Returns a list of error keys (matching COPY.errors). Empty list = valid.
export function validateInput(input) {
  const errors = [];
  const petName = cleanText(input.petName);
  const notes = cleanText(input.notes, { multiline: true });
  const sitterName = cleanText(input.sitterName);
  if (!input.hasPhoto) errors.push('photoMissing');
  if (textLength(petName) > INPUT_LIMITS.petNameMax) errors.push('petNameTooLong');
  if (!notes) errors.push('notesMissing');
  else if (textLength(notes) > INPUT_LIMITS.notesMax) errors.push('notesTooLong');
  if (textLength(sitterName) > INPUT_LIMITS.sitterNameMax) errors.push('sitterNameTooLong');
  return errors;
}

export function buildCardContent(input) {
  const template = getTemplate(input.templateId);
  const petName = cleanText(input.petName);
  const sitterName = cleanText(input.sitterName);
  return {
    templateId: template.id,
    kicker: template.kicker,
    title: template.title(petName),
    dateLine: formatVisitDate(input.visitDate),
    notes: cleanText(input.notes, { multiline: true }),
    signOff: sitterName ? `—\u00A0${sitterName}` : '', // no-break space keeps the dash with the name
  };
}

// "postcard-biscuit-2026-10-19.pdf". Only [a-z0-9-] reach the file name.
export function exportFileName(petName, visitDate, extension) {
  const slug = cleanText(petName)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  const date = formatVisitDate(visitDate) ? `-${visitDate}` : '';
  return `postcard-${slug || 'pet'}${date}.${extension}`;
}
