const pet = document.getElementById('pet-name');
const date = document.getElementById('visit-date');
const observation = document.getElementById('observation');
const title = document.getElementById('preview-title');
const previewDate = document.getElementById('preview-date');
const body = document.getElementById('preview-body');
const status = document.getElementById('note-status');
const form = document.getElementById('note-form');

function noteText() {
  const name = pet.value.trim();
  const day = date.value;
  const seen = observation.value.trim();
  return `${name ? `${name}’s visit` : 'Visit note'}${day ? `\n${day}` : ''}\n\n${seen}`;
}

function update() {
  title.textContent = pet.value.trim() ? `${pet.value.trim()}’s visit` : 'Visit note';
  previewDate.textContent = date.value;
  body.textContent = observation.value.trim() || 'Write one observation to see your note here.';
  status.textContent = '';
  observation.removeAttribute('aria-invalid');
}

function ready() {
  if (observation.value.trim()) return true;
  status.textContent = 'Write an observation before printing or copying.';
  observation.setAttribute('aria-invalid', 'true');
  observation.focus();
  return false;
}

form.addEventListener('submit', (event) => event.preventDefault());
for (const field of [pet, date, observation]) field.addEventListener('input', update);
document.getElementById('print-note').addEventListener('click', () => { if (ready()) window.print(); });
document.getElementById('copy-note').addEventListener('click', async () => {
  if (!ready()) return;
  try {
    await navigator.clipboard.writeText(noteText());
    status.textContent = 'Copied. Paste the note into your usual message to the owner.';
  } catch {
    status.textContent = 'Copy is unavailable here. Use Print or save PDF instead.';
  }
});
