'use strict';

const MAX_CATS = 20;
const MAX_PHOTOS_PER_CAT = 2;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const ACCEPTED_PHOTOS =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif';
const FIELDS = [
  ['name', 'Nombre', 'text', true, 100],
  ['birthDate', 'Fecha de nacimiento', 'date', true, undefined, 'Puede ser aproximada.'],
  ['sex', 'Sexo', 'select', true],
  ['breed', 'Raza', 'text', false, 100],
  ['coat', 'Pelaje', 'text', false, 100],
  ['color', 'Color', 'text', false, 100],
  ['personality', 'Personalidad', 'text', false, 255],
  ['foodBrand', 'Marca de comida', 'text', false, 100],
  ['litterBrand', 'Marca de arena', 'text', false, 100],
  ['lastTripleFelineDate', 'Última vacuna triple felina', 'date'],
  ['lastRabiesDate', 'Última vacuna antirrábica', 'date'],
  ['lastInternalDewormerName', 'Último desparasitante interno', 'text', false, 100],
  ['lastInternalDewormingDate', 'Fecha de desparasitación interna', 'date'],
  ['lastExternalDewormerName', 'Último tratamiento antipulgas', 'text', false, 100],
  ['lastExternalDewormingDate', 'Fecha del tratamiento antipulgas', 'date'],
];

const form = document.querySelector('#intake');
const editable = document.querySelector('#editable');
const existingHint = document.querySelector('#existing-hint');
const cats = document.querySelector('#cats');
const status = document.querySelector('#status');
const errorMessage = document.querySelector('#error');
const retry = document.querySelector('#retry');
const addCat = document.querySelector('#add-cat');
const send = document.querySelector('#submit');
const cards = [];
let allowNewCats = false;
let newCatNumber = 0;
let sending = false;
let token = new URLSearchParams(location.hash.slice(1)).get('token');

if (location.hash) history.replaceState(null, '', location.pathname);

const unavailable = 'Este enlace no está disponible. Pedile a CatWorld que te comparta uno nuevo.';

function element(tag, className, label) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (label) item.textContent = label;
  return item;
}

function showStatus(message) {
  status.textContent = message;
  status.hidden = !message;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = !message;
  if (message) errorMessage.focus();
}

function finish(message) {
  token = null;
  cards.length = 0;
  cats.replaceChildren();
  retry.hidden = true;
  form.hidden = true;
  showStatus(message);
}

function unavailableStatus(code) {
  return code === 401 || code === 403 || code === 404 || code === 410;
}

function request(path, options = {}) {
  return fetch(path, {
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'error',
    ...options,
    headers: { Authorization: 'Bearer ' + token },
  });
}

function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return [now.getFullYear(), month, day].join('-');
}

function createField([key, title, type, requiredForNew, maxLength, hint], initialValue, isNew) {
  const required = isNew && requiredForNew;
  const label = element('label', 'field');
  const name = element('span', '', required ? title + ' *' : title);
  const input = element(type === 'select' ? 'select' : 'input');
  if (type === 'select') {
    for (const [value, text] of [
      ['', 'Seleccioná una opción'],
      ['FEMALE', 'Hembra'],
      ['MALE', 'Macho'],
    ]) {
      input.add(new Option(text, value));
    }
  } else {
    input.type = type;
    if (maxLength) input.maxLength = maxLength;
    if (type === 'date') input.max = localToday();
  }
  input.name = key;
  input.required = Boolean(required);
  input.value = initialValue ?? '';
  label.append(name, input);
  if (hint) label.append(element('small', 'hint', hint));
  return { label, input };
}

function refreshActions() {
  addCat.hidden = !allowNewCats;
  addCat.disabled = cards.length >= MAX_CATS;
  send.disabled = cards.length === 0;
}

function addCard(catId, initial = {}) {
  const card = element('details', 'cat-card');
  const title = catId ? initial.name : 'Gato nuevo ' + ++newCatNumber;
  const summary = element('summary', '', title || 'Datos del gato');
  const content = element('div', 'cat-content');
  const fieldGrid = element('div', 'fields');
  const inputs = new Map();

  for (const field of FIELDS) {
    const key = field[0];
    const { label, input } = createField(field, initial[key], catId === null);
    fieldGrid.append(label);
    inputs.set(key, input);
  }
  inputs.get('name').addEventListener('input', ({ target }) => {
    summary.textContent = target.value.trim() || title;
  });

  const attachments = element('div', 'attachments');
  const fileLabel = element('label', 'field');
  const fileInput = element('input');
  const fileStatus = element('p', 'hint');
  const clearFiles = element('button', 'secondary', 'Quitar fotos');
  fileInput.type = 'file';
  fileInput.accept = ACCEPTED_PHOTOS;
  fileInput.multiple = true;
  fileStatus.setAttribute('aria-live', 'polite');
  clearFiles.type = 'button';
  clearFiles.hidden = true;
  fileLabel.append(element('span', '', 'Fotos de comprobantes (opcional)'), fileInput);
  attachments.append(
    fileLabel,
    element('p', 'hint', 'Hasta dos fotos por gato y 8 MiB por foto.'),
    fileStatus,
    clearFiles,
  );
  fileInput.addEventListener('change', () => {
    const files = [...fileInput.files];
    const invalid =
      files.length > MAX_PHOTOS_PER_CAT || files.some((file) => file.size > MAX_PHOTO_BYTES);
    const feedback = invalid ? 'Elegí hasta dos fotos de 8 MiB o menos.' : '';
    fileInput.setCustomValidity(feedback);
    fileStatus.textContent = feedback || files.map((file) => file.name).join(', ');
    clearFiles.hidden = files.length === 0;
  });
  clearFiles.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.setCustomValidity('');
    fileStatus.textContent = '';
    clearFiles.hidden = true;
    fileInput.focus();
  });

  const entry = { catId, inputs, fileInput, card };
  content.append(fieldGrid, attachments);
  if (catId === null) {
    const remove = element('button', 'secondary remove-cat', 'Quitar este gato');
    remove.type = 'button';
    remove.addEventListener('click', () => {
      cards.splice(cards.indexOf(entry), 1);
      card.remove();
      refreshActions();
      addCat.focus();
    });
    content.append(remove);
  }
  card.open = cards.length === 0 || catId === null;
  card.append(summary, content);
  cards.push(entry);
  cats.append(card);
  refreshActions();
  return entry;
}

async function load() {
  if (!token) {
    finish(unavailable);
    return;
  }
  retry.hidden = true;
  showStatus('Cargando la ficha…');
  try {
    const response = await request('/api/intake/request');
    if (unavailableStatus(response.status)) {
      finish(unavailable);
      return;
    }
    if (!response.ok) throw new Error('Request failed');
    const invitation = await response.json();
    allowNewCats = invitation.allowNewCats === true;
    existingHint.hidden = invitation.cats.length === 0;
    for (const cat of invitation.cats) addCard(cat.catId, cat.fields);
    if (cards.length === 0 && allowNewCats) addCard(null);
    refreshActions();
    showStatus('');
    form.hidden = false;
  } catch {
    cards.length = 0;
    cats.replaceChildren();
    showStatus('No se pudo cargar la ficha. Podés volver a intentar.');
    retry.hidden = false;
  }
}

function multipart() {
  const body = new FormData();
  let totalBytes = 0;
  const entries = cards.map(({ catId, inputs, fileInput }, index) => {
    const fields = {};
    for (const [key, input] of inputs) {
      const value = input.value.trim();
      if (value) fields[key] = value;
    }
    const photoKeys = [...fileInput.files].map((photo, position) => {
      const key = 'photo-' + index + '-' + position;
      totalBytes += photo.size;
      body.append(key, photo);
      return key;
    });
    return { catId, fields, photoKeys };
  });
  if (totalBytes > MAX_TOTAL_BYTES) return null;
  body.append(
    'submission',
    new Blob([JSON.stringify({ cats: entries })], { type: 'application/json' }),
  );
  return body;
}

addCat.addEventListener('click', () => {
  if (allowNewCats && cards.length < MAX_CATS) addCard(null).inputs.get('name').focus();
});

form.addEventListener(
  'invalid',
  (event) => {
    const card = event.target.closest('details');
    if (card) card.open = true;
  },
  true,
);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (sending || cards.length === 0) return;
  showError('');
  const body = multipart();
  if (!body) {
    showError(
      'Las fotos del envío superan los 32 MiB. Quitá alguna foto o elegí archivos más chicos.',
    );
    return;
  }
  sending = true;
  editable.disabled = true;
  send.textContent = 'Enviando…';
  try {
    const response = await request('/api/intake/submissions', { method: 'POST', body });
    if (response.ok) {
      finish('Ficha recibida. CatWorld va a revisar los datos.');
    } else if (unavailableStatus(response.status)) {
      finish(unavailable);
    } else if (response.status === 413) {
      showError('Las fotos son demasiado grandes. Elegí archivos más chicos y volvé a enviar.');
    } else if (response.status === 400 || response.status === 415 || response.status === 422) {
      showError(
        'Revisá los datos y los comprobantes. Las fotos deben ser JPEG, PNG, WebP, HEIC o HEIF.',
      );
    } else {
      showError('No se pudo confirmar el envío. Volvé a intentar.');
    }
  } catch {
    showError('No se pudo confirmar el envío. Volvé a intentar.');
  } finally {
    sending = false;
    editable.disabled = false;
    send.textContent = 'Enviar ficha';
  }
});

retry.addEventListener('click', load);
void load();
