'use strict';

const MAX_CATS = 20;
const MAX_PHOTOS_PER_CAT = 2;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const ACCEPTED_PHOTOS =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif';
const SHARED_LITTER = 'Usa las de CatWorld';
const VACCINES = ['lastTripleFelineDate', 'lastRabiesDate'];
const FIELDS = [
  ['name', 'Nombre', 'text', true, 100],
  ['birthDate', 'Fecha de nacimiento', 'date', true, undefined, 'Puede ser aproximada.'],
  ['sex', 'Sexo', 'select', true],
  ['breed', 'Raza', 'text', false, 100],
  ['coat', 'Pelaje', 'text', false, 100],
  ['color', 'Color', 'text', false, 100],
  ['personality', 'Personalidad', 'text', false, 255],
  ['foodBrand', 'Marca de comida', 'text', false, 100],
  ['foodDetail', 'Variedad o dieta', 'text', false, 255],
  ['litterBrand', 'Arena', 'litter'],
  ['lastTripleFelineDate', 'Fecha de aplicación de la triple felina', 'date'],
  ['lastRabiesDate', 'Fecha de aplicación de la antirrábica', 'date'],
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
const fieldError = document.createElement('span');
fieldError.id = 'field-error';
fieldError.className = 'field-error';
fieldError.setAttribute('role', 'alert');
const retry = document.querySelector('#retry');
const addCat = document.querySelector('#add-cat');
const send = document.querySelector('#submit');
const cards = [];
let brands = [];
let litterRatePerKg = null;
let allowNewCats = false;
let newCatNumber = 0;
let labelNumber = 0;
let sending = false;
let stale = false;
let errorInput;
const sharedToken = new URLSearchParams(location.hash.slice(1)).get('token');
let token = sharedToken || history.state?.intakeToken;

// Keep the WhatsApp fragment out of the visible URL and allow a reload in this tab.
if (location.hash) {
  history.replaceState({ intakeToken: sharedToken }, '', location.pathname + location.search);
}
window.addEventListener('hashchange', () => {
  if (location.hash) location.reload();
});

const unavailable = 'Este enlace no está disponible. Pedile a CatWorld que te comparta uno nuevo.';

function element(tag, className, label) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (label) item.textContent = label;
  return item;
}

function fieldLabel(title, input, hint) {
  const label = element('label', 'field');
  const name = element('span', '', title);
  name.id = 'label-' + ++labelNumber;
  input.setAttribute('aria-labelledby', name.id);
  label.append(name, input);
  if (hint) {
    const description = element('small', 'hint', hint);
    description.id = name.id + '-hint';
    input.setAttribute('aria-describedby', description.id);
    label.append(description);
  }
  return label;
}

function showStatus(message) {
  status.textContent = message;
  status.hidden = !message;
}

function showError(message, input) {
  if (errorInput) {
    errorInput.removeAttribute('aria-invalid');
    const description = errorInput.getAttribute('aria-labelledby') + '-hint';
    const hint = document.getElementById(description);
    if (hint && !hint.hidden) {
      errorInput.setAttribute('aria-describedby', description);
    } else {
      errorInput.removeAttribute('aria-describedby');
    }
    fieldError.remove();
  }
  errorInput = input;
  errorMessage.textContent = input ? '' : message;
  errorMessage.hidden = Boolean(input) || !message;
  if (input) {
    for (let parent = input.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
    input.setAttribute('aria-invalid', 'true');
    const description = input.getAttribute('aria-describedby');
    input.setAttribute(
      'aria-describedby',
      description ? fieldError.id + ' ' + description : fieldError.id,
    );
    fieldError.textContent = message;
    input.before(fieldError);
    input.focus();
  } else if (message) {
    errorMessage.focus();
  }
}

function clearCards() {
  for (const { photos } of cards) {
    for (const photo of photos) {
      if (photo.url) URL.revokeObjectURL(photo.url);
    }
  }
  cards.length = 0;
  cats.replaceChildren();
  newCatNumber = 0;
}

function closeForm(message, buttonText) {
  clearCards();
  form.hidden = true;
  showError('');
  showStatus(message);
  retry.hidden = !buttonText;
  if (buttonText) retry.textContent = buttonText;
}

function endAccess() {
  token = null;
  history.replaceState(null, '', location.pathname + location.search);
  closeForm(unavailable);
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

function brandKey(value) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function fieldValue(key, value) {
  const text = value?.trim() ?? '';
  if (key !== 'foodBrand' || !text) return text;
  return brands.find((brand) => brandKey(brand.name) === brandKey(text))?.name ?? text;
}

function createBrandField(label, input) {
  const field = element('div', 'brand-field');
  const suggestions = element('ul', 'brand-suggestions');
  suggestions.hidden = true;
  suggestions.setAttribute('aria-label', 'Marcas de comida sugeridas');
  field.append(label, suggestions);

  input.addEventListener('input', () => {
    const query = brandKey(input.value);
    const matches = query
      ? brands
          .filter((brand) => brandKey(brand.name).includes(query) && brandKey(brand.name) !== query)
          .slice(0, 6)
      : [];
    suggestions.replaceChildren();
    for (const { name } of matches) {
      const item = element('li');
      const choose = element('button', 'secondary', name);
      choose.type = 'button';
      choose.addEventListener('click', () => {
        input.value = name;
        input.focus();
        suggestions.hidden = true;
      });
      item.append(choose);
      suggestions.append(item);
    }
    suggestions.hidden = matches.length === 0;
  });
  input.addEventListener('change', () => {
    input.value = fieldValue('foodBrand', input.value);
  });
  field.addEventListener('focusout', (event) => {
    if (!field.contains(event.relatedTarget)) suggestions.hidden = true;
  });
  field.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !suggestions.hidden) {
      input.focus();
      suggestions.hidden = true;
    }
  });
  return field;
}

function createLitterField(title, initialValue) {
  const field = element('div', 'field');
  const choice = element('select');
  choice.add(new Option('Seleccioná una opción', ''));
  choice.add(new Option(SHARED_LITTER, 'shared'));
  choice.add(new Option('Usa su propia arena', 'own'));
  const hasRate = litterRatePerKg !== null;
  const rate = hasRate ? new Intl.NumberFormat('es-AR').format(BigInt(litterRatePerKg)) : '';
  const expectation = hasRate
    ? `La tarifa actual es de ${rate} pesos por kg. CatWorld confirma la cantidad y el precio para cada estadía.`
    : 'La tarifa todavía no está disponible. CatWorld te confirmará el precio para la estadía.';
  const choiceLabel = fieldLabel(
    title,
    choice,
    `El consumo habitual es de ½ kg por gato por día. ${expectation}`,
  );
  const sharedHint = choiceLabel.querySelector('.hint');

  const own = element('input');
  own.name = 'litterBrand';
  own.maxLength = 100;
  own.value = initialValue === SHARED_LITTER ? '' : initialValue;
  choice.value = initialValue === SHARED_LITTER ? 'shared' : initialValue ? 'own' : '';
  const ownLabel = fieldLabel('Marca o tipo de arena', own);
  function updateLitterHints() {
    ownLabel.hidden = choice.value !== 'own';
    sharedHint.hidden = choice.value !== 'shared';
    if (sharedHint.hidden) choice.removeAttribute('aria-describedby');
    else choice.setAttribute('aria-describedby', sharedHint.id);
  }
  updateLitterHints();
  choice.addEventListener('change', updateLitterHints);

  field.append(choiceLabel, ownLabel);
  return {
    control: field,
    get input() {
      return choice.value === 'own' ? own : choice;
    },
    read: () => {
      if (choice.value === 'shared') return SHARED_LITTER;
      return choice.value === 'own' ? own.value : '';
    },
  };
}

function createField([key, title, type, requiredForNew, maxLength, hint], initialValue, isNew) {
  if (type === 'litter') return createLitterField(title, initialValue);
  const required = isNew && requiredForNew;
  const input = element(type === 'select' ? 'select' : 'input');
  if (type === 'select') {
    input.add(new Option('Seleccioná una opción', ''));
    input.add(new Option('Hembra', 'FEMALE'));
    input.add(new Option('Macho', 'MALE'));
  } else {
    input.type = type;
    if (maxLength) input.maxLength = maxLength;
    if (type === 'date') {
      input.min = '1000-01-01';
      input.max = localToday();
    }
  }
  input.name = key;
  input.required = Boolean(required);
  input.value = initialValue;
  const label = fieldLabel(required ? title + ' *' : title, input, hint);
  const control = key === 'foodBrand' ? createBrandField(label, input) : label;
  return { control, input, read: () => input.value };
}

function refreshActions() {
  addCat.hidden = !allowNewCats;
  addCat.disabled = cards.length >= MAX_CATS || stale;
  send.disabled = cards.length === 0 || stale;
}

async function showRetainedPhoto(photo, preview) {
  try {
    const response = await request('/api/intake/photos/' + encodeURIComponent(photo.id));
    if (!response.ok) throw new Error('Photo unavailable');
    const blob = await response.blob();
    if (!preview.isConnected) return;
    photo.url = URL.createObjectURL(blob);
    const link = element('a');
    const image = element('img');
    image.src = photo.url;
    image.alt = 'Comprobante ' + photo.number;
    link.href = photo.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.append(image);
    preview.replaceChildren(link);
  } catch {
    if (preview.isConnected) preview.textContent = 'No se pudo mostrar este comprobante.';
  }
}

function createAttachments(photos) {
  const attachments = element('div', 'attachments');
  const fileInput = element('input');
  const fileStatus = element('p', 'hint');
  const clearFiles = element('button', 'secondary', 'Quitar fotos nuevas');
  fileInput.type = 'file';
  fileInput.accept = ACCEPTED_PHOTOS;
  fileInput.multiple = true;
  fileStatus.setAttribute('aria-live', 'polite');
  clearFiles.type = 'button';
  clearFiles.hidden = true;
  const fileLabel = fieldLabel('Fotos de comprobantes', fileInput);

  if (photos.length) {
    const saved = element('ul', 'retained-photos');
    for (const photo of photos) {
      const item = element('li');
      const preview = element('div', 'photo-preview', 'Cargando comprobante ' + photo.number + '…');
      const keepLabel = element('label', 'keep-photo');
      const keep = element('input');
      keep.type = 'checkbox';
      keep.checked = true;
      keep.addEventListener('change', () => {
        photo.keep = keep.checked;
      });
      keepLabel.append(keep, element('span', '', 'Conservar foto ' + photo.number));
      item.append(preview, keepLabel);
      saved.append(item);
      void showRetainedPhoto(photo, preview);
    }
    attachments.append(saved);
  }
  attachments.append(
    fileLabel,
    element(
      'p',
      'hint',
      'Para informar una vacuna, adjuntá el comprobante de este gato. Una foto puede mostrar las dos vacunas. Hasta dos fotos por gato, de 8 MiB cada una.',
    ),
    fileStatus,
    clearFiles,
  );
  fileInput.addEventListener('change', () => {
    fileStatus.textContent = Array.from(fileInput.files, (file) => file.name).join(', ');
    clearFiles.hidden = fileInput.files.length === 0;
  });
  clearFiles.addEventListener('click', () => {
    fileInput.value = '';
    fileStatus.textContent = '';
    clearFiles.hidden = true;
    fileInput.focus();
  });
  return { attachments, fileInput };
}

function addCard(
  {
    catId,
    fields = {},
    requestedFields = [],
    draftId,
    revision = 0,
    proposedFields = {},
    photos: savedPhotos = [],
  } = { catId: null },
) {
  const isNew = catId === null;
  const initial = { ...fields, ...proposedFields };
  const card = element('details', 'cat-card');
  const fallbackTitle = isNew ? 'Gato nuevo ' + ++newCatNumber : 'Datos del gato';
  const summary = element('summary');
  const title = element('span', '', initial.name || fallbackTitle);
  summary.append(title);
  if (revision > 0) {
    summary.append(' ', element('span', 'cat-state', 'En revisión'));
  } else if (!isNew && !requestedFields.length) {
    summary.append(' ', element('span', 'cat-state', 'Al día'));
  }
  const content = element('div', 'cat-content');
  const primaryFields = element('div', 'fields');
  const other = element('details', 'other-fields');
  const otherFields = element('div', 'fields');
  other.append(element('summary', '', 'Modificar otros datos de este gato'), otherFields);
  const inputs = new Map();

  for (const field of FIELDS) {
    const key = field[0];
    const ui = createField(field, initial[key] ?? '', isNew);
    const container = isNew || requestedFields.includes(key) ? primaryFields : otherFields;
    container.append(ui.control);
    inputs.set(key, ui);
  }
  inputs.get('name').input.addEventListener('input', ({ target }) => {
    title.textContent = target.value.trim() || fallbackTitle;
  });

  const photos = savedPhotos.map(({ id }, index) => ({ id, number: index + 1, keep: true }));
  const { attachments, fileInput } = createAttachments(photos);
  content.append(primaryFields);
  if (isNew || photos.length || VACCINES.some((key) => requestedFields.includes(key))) {
    content.append(attachments);
  } else {
    other.append(attachments);
  }
  if (!isNew) content.append(other);

  const entry = {
    catId,
    draftId: isNew ? (draftId ?? crypto.randomUUID()) : undefined,
    revision,
    requestedFields,
    fields,
    initial,
    inputs,
    photos,
    fileInput,
  };
  if (isNew && revision === 0) {
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
  card.open = isNew || requestedFields.length > 0 || revision > 0;
  card.append(summary, content);
  cards.push(entry);
  cats.append(card);
  refreshActions();
  return entry;
}

async function load() {
  if (!token) {
    endAccess();
    return;
  }
  retry.hidden = true;
  showStatus('Cargando la ficha…');
  try {
    const response = await request('/api/intake/request');
    if (unavailableStatus(response.status)) {
      endAccess();
      return;
    }
    if (!response.ok) throw new Error('Request failed');
    const invitation = await response.json();
    clearCards();
    showError('');
    stale = false;
    allowNewCats = invitation.allowNewCats === true;
    brands = invitation.brands ?? [];
    litterRatePerKg = invitation.litterRatePerKg ?? null;
    existingHint.hidden = !invitation.cats.some((cat) => cat.catId);
    for (const cat of invitation.cats) addCard(cat);
    if (cards.length === 0 && allowNewCats) addCard();
    refreshActions();
    showStatus('');
    form.hidden = false;
  } catch {
    showStatus('No se pudo cargar la ficha. Podés volver a intentar.');
    retry.textContent = 'Reintentar';
    retry.hidden = false;
  }
}

function submissionCards() {
  return cards.map((card) => {
    const fields = {};
    let changed = false;
    for (const [key, field] of card.inputs) {
      const original = fieldValue(key, card.fields[key]);
      const value = fieldValue(key, field.read()) || original;
      if (value !== fieldValue(key, card.initial[key])) changed = true;
      if (value !== original) fields[key] = value;
    }
    const files = Array.from(card.fileInput.files);
    const retainedPhotoIds = card.photos.filter((photo) => photo.keep).map((photo) => photo.id);
    return {
      card,
      fields,
      files,
      retainedPhotoIds,
      changed: changed || files.length > 0 || retainedPhotoIds.length !== card.photos.length,
    };
  });
}

function validate(entries) {
  for (const { card, fields, files, retainedPhotoIds } of entries) {
    for (const [key, { input }] of card.inputs) {
      if (card.catId === null && input.required && !fields[key]) {
        showError(
          'Para agregar un gato, completá el nombre, la fecha de nacimiento y el sexo.',
          input,
        );
        return false;
      }
      if (fields[key] && !input.validity.valid) {
        showError('Revisá este dato antes de enviar la ficha.', input);
        return false;
      }
    }
    const count = files.length + retainedPhotoIds.length;
    if (count > MAX_PHOTOS_PER_CAT || files.some((file) => file.size > MAX_PHOTO_BYTES)) {
      showError('Elegí hasta dos fotos de 8 MiB o menos por gato.', card.fileInput);
      return false;
    }
    if (VACCINES.some((key) => fields[key]) && count === 0) {
      showError(
        'Adjuntá al menos una foto del comprobante de la vacuna de este gato.',
        card.fileInput,
      );
      return false;
    }
  }

  const pending = cards.find((card) => card.requestedFields.length);
  const answersRequest = entries.some(({ card, fields }) =>
    card.requestedFields.some((key) => fields[key]),
  );
  if (pending && !answersRequest && !entries.some(({ card }) => card.catId === null)) {
    const requested = pending.requestedFields.find((key) => pending.inputs.has(key));
    showError(
      'Completá al menos uno de los datos que te pidió CatWorld antes de enviar la ficha.',
      pending.inputs.get(requested)?.input,
    );
    return false;
  }
  return true;
}

function multipart(entries) {
  const body = new FormData();
  let totalBytes = 0;
  const updates = entries.map(({ card, fields, files, retainedPhotoIds }, index) => {
    const photoKeys = files.map((photo, position) => {
      const key = 'photo-' + index + '-' + position;
      totalBytes += photo.size;
      body.append(key, photo);
      return key;
    });
    return {
      catId: card.catId,
      draftId: card.draftId,
      revision: card.revision,
      fields,
      retainedPhotoIds,
      photoKeys,
    };
  });
  if (totalBytes > MAX_TOTAL_BYTES) return null;
  body.append(
    'submission',
    new Blob([JSON.stringify({ cats: updates })], { type: 'application/json' }),
  );
  return body;
}

addCat.addEventListener('click', () => {
  if (allowNewCats && cards.length < MAX_CATS) addCard().inputs.get('name').input.focus();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (sending || stale || cards.length === 0) return;
  showError('');
  const drafts = submissionCards();
  const entries = drafts.filter(({ changed }) => changed);
  if (!entries.length) {
    const fresh = drafts.find(({ card }) => card.catId === null && card.revision === 0);
    if (fresh) validate([fresh]);
    else showError('No hay datos nuevos para enviar.');
    return;
  }
  if (!validate(entries)) return;
  const body = multipart(entries);
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
      closeForm('Ficha recibida. CatWorld va a revisar los datos.', 'Volver a la ficha');
      retry.focus();
    } else if (unavailableStatus(response.status)) {
      endAccess();
    } else if (response.status === 409) {
      stale = true;
      showStatus('La ficha cambió. Cargá la versión actual antes de volver a hacer tus cambios.');
      retry.textContent = 'Cargar versión actual';
      retry.hidden = false;
      retry.focus();
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
    refreshActions();
  }
});

retry.addEventListener('click', load);
void load();
