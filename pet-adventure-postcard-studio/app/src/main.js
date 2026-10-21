import { IMAGE, INPUT_LIMITS } from './config.js';
import { COPY } from './copy.js';
import { DEFAULT_TEMPLATE_ID, getTemplate } from './templates.js';
import { buildCardContent, exportFileName, validateInput, textLength } from './card-content.js';
import { photoQuality } from './layout.js';
import { drawCard } from './render-card.js';
import { validatePhotoFile } from './photo-file.js';
import { canvasToJpeg, pdfFromJpeg, downloadBlob } from './export-card.js';

const byId = (id) => document.getElementById(id);
const form = byId('card-form');
const fields = {
  photo: byId('photo'),
  petName: byId('pet-name'),
  notes: byId('notes'),
  visitDate: byId('visit-date'),
  sitterName: byId('sitter-name'),
};
const errorNodes = {
  photo: byId('photo-error'),
  petName: byId('pet-name-error'),
  notes: byId('notes-error'),
  sitterName: byId('sitter-name-error'),
};
const previewImage = byId('preview-image');
const previewEmpty = byId('preview-empty');
const status = byId('form-status');
const pdfButton = byId('download-pdf');
const imageButton = byId('download-image');

let photoBitmap = null;
let photoError = null;
let planError = null;
let photoRevision = 0;
let previewRevision = 0;
let previewTimer = null;
let previewUrl = null;
let previewJpeg = null;
let submitted = false;
let exporting = false;

function setText(id, value) { byId(id).textContent = value; }

function initializeForm() {
  fields.photo.accept = INPUT_LIMITS.photoTypes.join(',');
  fields.petName.maxLength = INPUT_LIMITS.petNameMax;
  fields.notes.maxLength = INPUT_LIMITS.notesMax;
  fields.sitterName.maxLength = INPUT_LIMITS.sitterNameMax;
  fields.petName.placeholder = COPY.fields.petName.placeholder;
  fields.notes.placeholder = COPY.fields.notes.placeholder;
  fields.sitterName.placeholder = COPY.fields.sitterName.placeholder;
  setText('photo-hint', COPY.fields.photo.hint);
  updateCount();
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.className = isError ? 'status error' : 'status';
}

function formInput() {
  return {
    hasPhoto: Boolean(photoBitmap),
    petName: fields.petName.value,
    notes: fields.notes.value,
    visitDate: fields.visitDate.value,
    sitterName: fields.sitterName.value,
    templateId: form.querySelector('input[name="templateId"]:checked')?.value ?? DEFAULT_TEMPLATE_ID,
  };
}

function updateCount() {
  setText('notes-count', COPY.charCount(textLength(fields.notes.value), INPUT_LIMITS.notesMax));
}

function currentErrors() {
  const errors = validateInput(formInput()).filter((key) => key !== 'photoMissing' || !photoError);
  if (photoError) errors.unshift(photoError);
  if (planError && !errors.includes(planError)) errors.push(planError);
  return errors;
}

function fieldForError(key) {
  if (key.startsWith('photo')) return 'photo';
  if (key.startsWith('petName')) return 'petName';
  if (key.startsWith('notes')) return 'notes';
  return 'sitterName';
}

function showErrors() {
  const visible = currentErrors().filter((key) => submitted || !['photoMissing', 'notesMissing'].includes(key));
  for (const [field, node] of Object.entries(errorNodes)) {
    const key = visible.find((item) => fieldForError(item) === field);
    node.textContent = key ? COPY.errors[key] : '';
    node.hidden = !key;
    if (key) fields[field].setAttribute('aria-invalid', 'true');
    else fields[field].removeAttribute('aria-invalid');
  }
  setStatus(visible.length ? COPY.errors[visible[0]] : '', visible.length > 0);
}

function setPreviewEmpty(message = COPY.preview.empty) {
  previewRevision += 1;
  previewJpeg = null;
  previewEmpty.textContent = message;
  previewEmpty.hidden = false;
  previewImage.hidden = true;
  previewImage.removeAttribute('src');
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
}

function makeCanvas(input) {
  const canvas = document.createElement('canvas');
  canvas.width = IMAGE.widthPx;
  canvas.height = IMAGE.heightPx;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas unavailable');
  const result = drawCard(context, buildCardContent(input), photoBitmap, getTemplate(input.templateId));
  return { canvas, error: result.error };
}

async function renderPreview() {
  const input = formInput();
  const revision = ++previewRevision;
  planError = null;
  if (!photoBitmap || !input.notes.trim()) {
    setPreviewEmpty();
    showErrors();
    return null;
  }
  try {
    const { canvas, error } = makeCanvas(input);
    if (error) {
      planError = error;
      setPreviewEmpty(COPY.errors[error]);
      showErrors();
      return null;
    }
    const blob = await canvasToJpeg(canvas);
    if (revision !== previewRevision) return null;
    const nextUrl = URL.createObjectURL(blob);
    const oldUrl = previewUrl;
    previewUrl = nextUrl;
    previewJpeg = blob;
    previewImage.alt = COPY.preview.cardAlt(input.petName.trim());
    previewImage.src = nextUrl;
    previewImage.hidden = false;
    previewEmpty.hidden = true;
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    showErrors();
    return blob;
  } catch {
    if (revision !== previewRevision) return null;
    setPreviewEmpty(COPY.errors.exportFailed);
    setStatus(COPY.errors.exportFailed, true);
    return null;
  }
}

function queuePreview() {
  clearTimeout(previewTimer);
  previewRevision += 1;
  previewJpeg = null;
  if (previewImage.hidden) previewEmpty.textContent = COPY.preview.updating;
  previewTimer = setTimeout(renderPreview, 120);
}

async function readPhoto() {
  const revision = ++photoRevision;
  if (photoBitmap) photoBitmap.close?.();
  photoBitmap = null;
  photoError = null;
  planError = null;
  byId('photo-warning').hidden = true;
  setPreviewEmpty();
  const file = fields.photo.files?.[0];
  if (!file) {
    showErrors();
    return;
  }
  setStatus(COPY.actions.readingPhoto);
  const error = await validatePhotoFile(file);
  if (revision !== photoRevision) return;
  if (error) {
    photoError = error;
    fields.photo.value = '';
    showErrors();
    return;
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    if (revision !== photoRevision) {
      bitmap.close?.();
      return;
    }
    photoBitmap = bitmap;
    const quality = photoQuality(bitmap.width, bitmap.height);
    const warning = byId('photo-warning');
    warning.hidden = quality.level === 'ok';
    warning.textContent = quality.level === 'ok' ? '' : COPY.photoWarnings[quality.level](quality.ppi);
    setStatus('');
    showErrors();
    queuePreview();
  } catch {
    if (revision !== photoRevision) return;
    photoError = 'photoUnreadable';
    fields.photo.value = '';
    showErrors();
  }
}

async function exportCard(format) {
  if (exporting) return;
  submitted = true;
  planError = null;
  const errors = currentErrors();
  if (errors.length) {
    showErrors();
    fields[fieldForError(errors[0])].focus();
    return;
  }
  const input = formInput();
  exporting = true;
  pdfButton.disabled = true;
  imageButton.disabled = true;
  try {
    clearTimeout(previewTimer);
    // The preview, JPG, and PDF use these same encoded bytes. If the form was
    // just edited, finish its current preview before starting the download.
    const jpg = previewJpeg ?? await renderPreview();
    if (!jpg) {
      const firstError = currentErrors()[0];
      if (firstError) fields[fieldForError(firstError)].focus();
      return;
    }
    if (previewJpeg !== jpg) return; // form changed while JPEG was encoding
    const extension = format === 'pdf' ? 'pdf' : IMAGE.extension;
    const blob = format === 'pdf' ? await pdfFromJpeg(jpg) : jpg;
    if (previewJpeg !== jpg) return; // form changed while PDF was being built
    downloadBlob(blob, exportFileName(input.petName, input.visitDate, extension));
    setStatus(COPY.actions.downloadStarted);
  } catch {
    setStatus(COPY.errors.exportFailed, true);
  } finally {
    exporting = false;
    pdfButton.disabled = false;
    imageButton.disabled = false;
  }
}

initializeForm();
fields.photo.addEventListener('change', readPhoto);
for (const field of [fields.petName, fields.notes, fields.visitDate, fields.sitterName]) {
  field.addEventListener('input', () => {
    planError = null;
    updateCount();
    showErrors();
    queuePreview();
  });
}
byId('template-options').addEventListener('change', () => {
  planError = null;
  queuePreview();
});
// Enter in a text field must not start a download, so the form never submits.
form.addEventListener('submit', (event) => event.preventDefault());
pdfButton.addEventListener('click', () => exportCard('pdf'));
imageButton.addEventListener('click', () => exportCard('image'));
window.addEventListener('pagehide', (event) => {
  if (event.persisted) return;
  photoBitmap?.close?.();
  if (previewUrl) URL.revokeObjectURL(previewUrl);
});
