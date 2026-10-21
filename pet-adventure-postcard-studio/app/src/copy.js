// All user-facing English text. Edit wording here only.
import { INPUT_LIMITS, PHOTO_QUALITY } from './config.js';

const photoMaxMb = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
  .format(INPUT_LIMITS.photoMaxBytes / (1024 * 1024));
const photoTypeNames = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};
const photoFormats = new Intl.ListFormat('en-US', { type: 'disjunction' })
  .format(INPUT_LIMITS.photoTypes.map((type) => photoTypeNames[type] ?? type));

export const COPY = {
  pageTitle: 'Pet Adventure Postcard Studio',
  lead: 'Turn one visit photo and your notes into a printable 6 × 4 in postcard for the pet’s family.',

  fields: {
    photo: { label: 'Photo (required)', hint: `One visit photo. ${photoFormats}, up to ${photoMaxMb} MB.` },
    petName: { label: 'Pet’s name (optional)', placeholder: 'e.g. Biscuit' },
    notes: {
      label: 'What you observed (required)',
      hint: 'Only what really happened. Your words are printed exactly as written.',
      placeholder: 'e.g. Chased the red ball six times, then napped in the sunny spot by the window.',
    },
    visitDate: { label: 'Visit date (optional)' },
    sitterName: { label: 'Signed by (optional)', placeholder: 'Your name' },
    template: { legend: 'Card style' },
  },

  actions: {
    downloadPdf: 'Download print PDF',
    downloadImage: 'Download image (JPG)',
    downloadStarted: 'Your download has started.',
    readingPhoto: 'Opening photo…',
  },

  preview: {
    label: 'Postcard preview',
    empty: 'Add a photo and your notes to see the postcard.',
    updating: 'Updating postcard preview…',
    photoAlt: (petName) => (petName ? `Photo of ${petName}` : 'Visit photo'),
    cardAlt: (petName) => `Postcard preview for ${petName || 'your pet'}`,
  },

  charCount: (used, max) => `${used} / ${max}`,

  errors: {
    photoMissing: 'Add a photo to continue.',
    photoType: `This file isn’t a supported image. Use a ${photoFormats} photo.`,
    photoTooLarge: `This photo is over ${photoMaxMb} MB. Export a smaller copy from your photos app.`,
    photoUnreadable: 'This photo couldn’t be opened. Try saving it again as JPG.',
    petNameTooLong: `Keep the pet’s name to ${INPUT_LIMITS.petNameMax} characters or fewer.`,
    notesMissing: 'Add your notes — the card only uses what you write.',
    notesTooLong: `Shorten your notes to ${INPUT_LIMITS.notesMax} characters or fewer.`,
    notesDontFit: 'Your notes don’t fit on the card. Shorten them or remove line breaks.',
    signOffDontFit: 'Your name doesn’t fit on the card. Try a shorter version.',
    sitterNameTooLong: `Keep your name to ${INPUT_LIMITS.sitterNameMax} characters or fewer.`,
    exportFailed: 'The file couldn’t be created. Please try again.',
  },

  photoWarnings: {
    low: (ppi) =>
      `This photo prints at ${ppi} ppi (${PHOTO_QUALITY.targetPpi} recommended), so it may look a little soft. Use the original photo if you have it.`,
    veryLow: (ppi) =>
      `This photo prints at only ${ppi} ppi, so it will likely look blurry. Use the original, uncropped photo.`,
  },

  printNote: 'Print at 100% (“Actual size”) on 6 × 4 in photo paper. No borderless printing needed.',
};
