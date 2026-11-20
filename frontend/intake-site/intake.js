'use strict';

const MAX_CATS = 20;
const MAX_PHOTOS_PER_CAT = 2;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
const MIN_BIRTH_YEAR = 1000;
const SHARED_LITTER = 'Usa las de CatWorld';
const OWN_LITTER = 'Trae sus propias piedritas';
const VACCINES = ['lastTripleFelineDate', 'lastRabiesDate'];
const CATALOG_FIELDS = new Set([
  'breed',
  'coat',
  'color',
  'foodBrand',
  'lastInternalDewormerName',
  'lastExternalDewormerName',
]);
const FIELDS = [
  ['name', 'Nombre', 'text', true, 100],
  ['birthDate', 'Fecha de nacimiento', 'birth', true],
  ['sex', 'Sexo', 'select', true],
  ['breed', 'Raza', 'text', true, 100, 'Por ejemplo, Sin raza definida.'],
  ['coat', 'Pelaje', 'text', true, 100],
  ['color', 'Color', 'text', true, 100],
  ['personality', 'Personalidad', 'text', true, 255],
  ['foodBrand', 'Marca de comida', 'text', true, 100, 'Por ejemplo, Royal Canin o Comida casera.'],
  ['foodDetail', 'Variedad o dieta', 'text', true, 255, 'Por ejemplo, Kitten.'],
  ['litterBrand', 'Piedritas', 'litter', true],
  [
    'careInstructions',
    'Indicaciones de cuidado del tutor',
    'textarea',
    false,
    2000,
    'Opcional. El equipo de CatWorld podrá leer estas indicaciones.',
  ],
  ['lastTripleFelineDate', 'Fecha de aplicación de la triple felina', 'date'],
  ['lastRabiesDate', 'Fecha de aplicación de la antirrábica', 'date'],
  ['lastInternalDewormerName', 'Último desparasitante interno', 'text', false, 100],
  ['lastInternalDewormingDate', 'Fecha de desparasitación interna', 'date'],
  ['lastExternalDewormerName', 'Última pipeta antipulgas', 'text', false, 100],
  ['lastExternalDewormingDate', 'Fecha de la última pipeta antipulgas', 'date'],
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
let catalogOptions = {};
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
  for (const { photos, clearPreviews } of cards) {
    clearPreviews();
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

function catalogKey(value) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function fieldValue(key, value) {
  const text = value?.trim() ?? '';
  const options = catalogOptions[key];
  if (!options || !text) return text;
  return options.find(({ name }) => catalogKey(name) === catalogKey(text))?.name ?? text;
}

function createCatalogField(key, title, label, input) {
  const field = element('div', 'catalog-field');
  const suggestions = element('ul', 'catalog-suggestions');
  suggestions.hidden = true;
  suggestions.id = input.getAttribute('aria-labelledby') + '-suggestions';
  suggestions.setAttribute('aria-label', 'Opciones para ' + title);
  input.setAttribute('aria-controls', suggestions.id);
  const results = element('p', 'sr-only');
  results.setAttribute('role', 'status');
  field.append(label, suggestions, results);

  function hideSuggestions() {
    suggestions.hidden = true;
    results.textContent = '';
  }

  input.addEventListener('input', () => {
    const query = catalogKey(input.value);
    const matches = query
      ? (catalogOptions[key] ?? [])
          .filter(({ name }) => catalogKey(name).includes(query) && catalogKey(name) !== query)
          .slice(0, 6)
      : [];
    suggestions.replaceChildren();
    for (const { name } of matches) {
      const item = element('li');
      const choose = element('button', 'secondary', name);
      choose.type = 'button';
      choose.addEventListener('mousedown', (event) => event.preventDefault());
      choose.addEventListener('click', () => {
        input.value = name;
        input.focus();
        input.dispatchEvent(new Event('change', { bubbles: true }));
        hideSuggestions();
      });
      item.append(choose);
      suggestions.append(item);
    }
    suggestions.hidden = matches.length === 0;
    results.textContent = '';
    if (matches.length)
      results.textContent =
        matches.length === 1 ? 'Una opción disponible.' : `${matches.length} opciones disponibles.`;
  });
  input.addEventListener('change', () => {
    input.value = fieldValue(key, input.value);
  });
  field.addEventListener('focusout', (event) => {
    if (!field.contains(event.relatedTarget)) hideSuggestions();
  });
  field.addEventListener('keydown', (event) => {
    if (suggestions.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      input.focus();
      hideSuggestions();
    } else if (event.key === 'ArrowDown' && event.target === input) {
      event.preventDefault();
      suggestions.querySelector('button').focus();
    }
  });
  return field;
}

function createLitterField(title, initialValue, required) {
  const field = element('div', 'field');
  const choice = element('select');
  choice.add(new Option('Seleccioná una opción', ''));
  choice.add(new Option(SHARED_LITTER, 'shared'));
  choice.add(new Option(OWN_LITTER, 'own'));
  choice.required = required;
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
  own.value = initialValue === SHARED_LITTER || initialValue === OWN_LITTER ? '' : initialValue;
  choice.value = initialValue === SHARED_LITTER ? 'shared' : initialValue ? 'own' : '';
  const ownLabel = fieldLabel('Marca o tipo de piedritas (opcional)', own);
  function updateChoice() {
    ownLabel.hidden = choice.value !== 'own';
    own.disabled = ownLabel.hidden;
    sharedHint.hidden = choice.value !== 'shared';
    if (sharedHint.hidden) choice.removeAttribute('aria-describedby');
    else choice.setAttribute('aria-describedby', sharedHint.id);
  }
  updateChoice();
  choice.addEventListener('change', updateChoice);

  field.append(choiceLabel, ownLabel);
  return {
    control: field,
    hasEnteredValue: () => Boolean(choice.value || own.value.trim()),
    get input() {
      return choice.value === 'own' && own.value.trim() ? own : choice;
    },
    read: () => {
      if (choice.value === 'shared') return SHARED_LITTER;
      return choice.value === 'own' ? own.value.trim() || OWN_LITTER : '';
    },
  };
}

function dateLimits(input) {
  input.min = `${MIN_BIRTH_YEAR}-01-01`;
  input.max = localToday();
}

function createBirthField(title, initial, required) {
  const field = element('div', 'birth-field');
  const date = element('input');
  date.type = 'date';
  date.name = 'birthDate';
  dateLimits(date);
  date.value = initial.birthDate ?? '';
  const dateLabel = fieldLabel(title, date);

  const year = element('input');
  year.name = 'birthYear';
  year.inputMode = 'numeric';
  year.pattern = '[0-9]{4}';
  year.maxLength = 4;
  year.value = initial.birthYear ?? '';
  const yearLabel = fieldLabel(required ? 'Año de nacimiento *' : 'Año de nacimiento', year);

  const onlyYear = element('input');
  onlyYear.type = 'checkbox';
  onlyYear.checked = Boolean(initial.birthYear);
  const toggle = element('label', 'birth-toggle');
  toggle.append(element('span', '', 'Solo sé el año'), onlyYear);
  function updatePrecision() {
    dateLabel.hidden = date.disabled = onlyYear.checked;
    yearLabel.hidden = year.disabled = !onlyYear.checked;
    date.required = required && !onlyYear.checked;
    year.required = required && onlyYear.checked;
  }
  updatePrecision();
  onlyYear.addEventListener('change', updatePrecision);

  field.append(dateLabel, yearLabel, toggle);
  return {
    control: field,
    get input() {
      return onlyYear.checked ? year : date;
    },
    hasEnteredValue: () => Boolean(date.value || date.validity.badInput || year.value.trim()),
    read() {
      return this.input.value;
    },
  };
}

function createField([key, title, type, requiredForNew, maxLength, hint], initial, isNew) {
  const required = Boolean(isNew && requiredForNew);
  const labelText = required ? title + ' *' : title;
  const initialValue = initial[key] ?? '';
  if (type === 'birth') return createBirthField(labelText, initial, required);
  if (type === 'litter') return createLitterField(labelText, initialValue, required);
  const input = element(type === 'select' || type === 'textarea' ? type : 'input');
  if (type === 'select') {
    input.add(new Option('Seleccioná una opción', ''));
    input.add(new Option('Hembra', 'FEMALE'));
    input.add(new Option('Macho', 'MALE'));
  } else {
    if (type !== 'textarea') input.type = type;
    if (maxLength) input.maxLength = maxLength;
    if (type === 'date') dateLimits(input);
  }
  input.name = key;
  input.required = required;
  input.value = initialValue;
  const search = CATALOG_FIELDS.has(key);
  const guidance = search
    ? [hint, 'Buscá una opción o escribí un nombre nuevo.'].filter(Boolean).join(' ')
    : hint;
  const label = fieldLabel(labelText, input, guidance);
  const control = search ? createCatalogField(key, title, label, input) : label;
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

function selectedPhotoPreview(file, signal) {
  const item = element('li', 'photo-preview');
  const caption = element('p', 'hint', file.name);
  item.append(caption);
  if (file.size > MAX_PHOTO_BYTES) return item;

  const image = element('img');
  image.alt = 'Vista previa de ' + file.name;
  let url;
  function releaseUrl() {
    if (url) URL.revokeObjectURL(url);
    url = undefined;
  }
  function setSource(blob) {
    url = URL.createObjectURL(blob);
    image.src = url;
  }
  function unavailablePreview() {
    releaseUrl();
    image.remove();
    caption.textContent = file.name + ' · Vista previa no disponible';
  }
  signal.addEventListener('abort', releaseUrl, { once: true });
  image.addEventListener(
    'error',
    async () => {
      releaseUrl();
      if (signal.aborted) return;
      const name = file.name.toLowerCase();
      const supported =
        PHOTO_TYPES.includes(file.type.toLowerCase()) ||
        PHOTO_EXTENSIONS.some((extension) => name.endsWith(extension));
      if (!supported) {
        unavailablePreview();
        return;
      }
      image.hidden = true;
      try {
        const body = new FormData();
        body.append('photo', file);
        const response = await request('/api/intake/photo-preview', {
          method: 'POST',
          body,
          signal,
        });
        if (!response.ok) throw new Error('Preview unavailable');
        const jpeg = await response.blob();
        if (signal.aborted) return;
        image.addEventListener('error', unavailablePreview, { once: true });
        image.hidden = false;
        setSource(jpeg);
      } catch {
        if (!signal.aborted) unavailablePreview();
      }
    },
    { once: true },
  );
  setSource(file);
  item.prepend(image);
  return item;
}

function createAttachments(photos) {
  const attachments = element('div', 'attachments');
  const selected = element('ul', 'selected-photos');
  const fileInput = element('input');
  const fileStatus = element('p', 'hint');
  const clearFiles = element('button', 'secondary', 'Quitar fotos nuevas');
  fileInput.type = 'file';
  fileInput.accept = [...PHOTO_TYPES, ...PHOTO_EXTENSIONS].join(',');
  fileInput.multiple = true;
  fileStatus.setAttribute('aria-live', 'polite');
  clearFiles.type = 'button';
  clearFiles.hidden = true;
  const fileLabel = fieldLabel(
    'Fotos de comprobantes',
    fileInput,
    'Para informar una vacuna, adjuntá el comprobante de este gato. Una foto puede mostrar las dos vacunas. Hasta dos fotos por gato, de 8 MB cada una y 32 MB por envío.',
  );
  let previewRequest;

  function clearPreviews() {
    previewRequest?.abort();
    previewRequest = undefined;
    selected.replaceChildren();
  }

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
  attachments.append(fileLabel, fileStatus, selected, clearFiles);
  fileInput.addEventListener('change', () => {
    clearPreviews();
    const files = Array.from(fileInput.files);
    clearFiles.hidden = files.length === 0;
    fileStatus.textContent =
      files.length > MAX_PHOTOS_PER_CAT ? 'Elegí hasta dos fotos por gato.' : '';
    if (files.length && files.length <= MAX_PHOTOS_PER_CAT) {
      previewRequest = new AbortController();
      selected.append(...files.map((file) => selectedPhotoPreview(file, previewRequest.signal)));
    }
  });
  clearFiles.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    fileInput.focus();
  });
  return { attachments, fileInput, clearPreviews };
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
  if (proposedFields.birthDate) delete initial.birthYear;
  if (proposedFields.birthYear) delete initial.birthDate;
  const card = element('div', 'cat-card');
  const disclosure = element('details');
  const fallbackTitle = isNew ? 'Gato nuevo ' + ++newCatNumber : 'Datos del gato';
  const summary = element('summary');
  const title = element('span', '', initial.name || fallbackTitle);
  summary.append(title);
  const hasPending = isNew ? revision === 0 : requestedFields.some((key) => !proposedFields[key]);
  if (hasPending) {
    summary.append(' ', element('span', 'cat-state cat-state--pending', 'Datos pendientes'));
  }
  if (revision > 0) {
    summary.append(' ', element('span', 'cat-state cat-state--submitted', 'Enviado a CatWorld'));
  }
  if (!hasPending && revision === 0) {
    summary.append(' ', element('span', 'cat-state cat-state--complete', 'Sin datos pendientes'));
  }
  const content = element('div', 'cat-content');
  const primaryFields = element('div', 'fields');
  const other = element('details', 'other-fields');
  const otherFields = element('div', 'fields');
  other.append(element('summary', '', 'Modificar otros datos de este gato'), otherFields);
  const inputs = new Map();

  for (const field of FIELDS) {
    const key = field[0];
    const ui = createField(field, initial, isNew);
    const container = isNew || requestedFields.includes(key) ? primaryFields : otherFields;
    container.append(ui.control);
    inputs.set(key, ui);
  }
  inputs.get('name').input.addEventListener('input', ({ target }) => {
    title.textContent = target.value.trim() || fallbackTitle;
  });

  const photos = savedPhotos.map(({ id }, index) => ({ id, number: index + 1, keep: true }));
  const { attachments, fileInput, clearPreviews } = createAttachments(photos);
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
    clearPreviews,
  };
  disclosure.open = isNew || hasPending;
  disclosure.append(summary, content);
  card.append(disclosure);
  if (isNew && revision === 0) {
    const remove = element('button', 'secondary remove-cat', 'Quitar este gato');
    remove.type = 'button';
    function refreshRemoval() {
      remove.hidden =
        fileInput.files.length > 0 ||
        [...inputs.values()].some(
          (field) =>
            field.hasEnteredValue?.() ??
            Boolean(field.read().trim() || field.input.validity.badInput),
        );
    }
    refreshRemoval();
    content.addEventListener('input', refreshRemoval);
    content.addEventListener('change', refreshRemoval);
    remove.addEventListener('click', () => {
      refreshRemoval();
      if (remove.hidden) return;
      if (card.contains(errorInput)) showError('');
      clearPreviews();
      cards.splice(cards.indexOf(entry), 1);
      card.remove();
      refreshActions();
      addCat.focus();
    });
    card.append(remove);
  }
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
    catalogOptions = {
      foodBrand: invitation.brands ?? invitation.foodBrands ?? [],
      ...invitation.catalogOptions,
    };
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
      if (key === 'birthDate') {
        const originalKey = card.fields.birthYear ? 'birthYear' : 'birthDate';
        const initialKey = card.initial.birthYear ? 'birthYear' : 'birthDate';
        const entered = field.read().trim();
        const activeKey = entered ? field.input.name : originalKey;
        const value = entered || card.fields[originalKey] || '';
        const initialValue = card.initial[initialKey] ?? '';
        if (value !== initialValue || (value && activeKey !== initialKey)) changed = true;
        if (value && (activeKey !== originalKey || value !== card.fields[originalKey])) {
          fields[activeKey] = value;
        }
        continue;
      }
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

function validateCards(drafts) {
  for (const { card, fields, files, retainedPhotoIds, changed } of drafts) {
    if (!changed && (card.catId !== null || card.revision > 0)) continue;
    for (const field of card.inputs.values()) {
      const { input } = field;
      const value = field.read().trim();
      if (input.required && !value && !input.validity.badInput) {
        showError('Completá este dato para registrar a tu gato.', input);
        return false;
      }
      if (
        input.name === 'birthYear' &&
        value &&
        (Number(value) < MIN_BIRTH_YEAR || Number(value) > Number(localToday().slice(0, 4)))
      ) {
        showError('Ingresá un año de nacimiento válido.', input);
        return false;
      }
      if (input.validity.badInput || (value && !input.validity.valid)) {
        showError('Revisá este dato antes de enviar la ficha.', input);
        return false;
      }
    }
    const count = files.length + retainedPhotoIds.length;
    if (count > MAX_PHOTOS_PER_CAT || files.some((file) => file.size > MAX_PHOTO_BYTES)) {
      showError('Elegí hasta dos fotos de 8 MB o menos por gato.', card.fileInput);
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

  return true;
}

function validateRequestedAnswer(entries) {
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

function hasProposal({ fields, files, retainedPhotoIds }) {
  return Object.keys(fields).length > 0 || files.length > 0 || retainedPhotoIds.length > 0;
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
  if (!validateCards(drafts)) return;
  const entries = drafts.filter(({ changed }) => changed);
  if (!entries.length) {
    showError('No hay datos nuevos para enviar.');
    return;
  }
  const proposals = entries.filter(hasProposal);
  if (proposals.length && !validateRequestedAnswer(proposals)) return;
  const body = multipart(entries);
  if (!body) {
    showError(
      'Las fotos del envío superan los 32 MB. Quitá alguna foto o elegí archivos más chicos.',
    );
    return;
  }
  sending = true;
  editable.disabled = true;
  send.textContent = 'Enviando…';
  try {
    const response = await request('/api/intake/submissions', { method: 'POST', body });
    if (response.ok) {
      closeForm(
        proposals.length
          ? 'Ficha recibida. CatWorld va a revisar los datos.'
          : 'Se retiraron los cambios de la ficha.',
        'Volver a la ficha',
      );
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
