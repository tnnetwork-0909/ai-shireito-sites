// The three card styles. They share one grid, palette and type scale (see
// layout.js / config.js) and differ only in wording and one framing detail.
// Titles and kickers are fixed frames around the pet's name: they never state
// an event, so the card contains no story the sitter didn't write.
// The pet's name is optional; without it the title says "Your Pet" instead.

export const UNNAMED_PET = 'Your Pet';
const nameOr = (petName) => petName || UNNAMED_PET;

export const TEMPLATES = [
  {
    id: 'adventure-log',
    name: 'Adventure Log',
    kicker: 'ADVENTURE LOG',
    title: (petName) => `${nameOr(petName)}’s Day`,
    frame: 'photoBorder', // accent border around the photo
  },
  {
    id: 'field-notes',
    name: 'Field Notes',
    kicker: 'FIELD NOTES',
    title: (petName) => `Notes on ${nameOr(petName)}`,
    frame: 'ruledLines', // faint ruled lines behind the notes
  },
  {
    id: 'hello-from',
    name: 'Hello From',
    kicker: 'GREETINGS',
    title: (petName) => `Hello from ${nameOr(petName)}`,
    frame: 'doubleRule', // paper mat + thin accent line inside the photo
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
