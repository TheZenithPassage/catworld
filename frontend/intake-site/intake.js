'use strict';

const MAX_CATS = 20;
const MAX_PHOTOS_PER_CAT = 5;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
const MIN_BIRTH_YEAR = 1000;
const SHARED_LITTER = 'Usa las de CatWorld';
const OWN_LITTER = 'Trae sus propias piedritas';
const COAT_LENGTHS = ['Corto', 'Largo', 'Sin pelo'];
const VACCINES = ['lastTripleFelineDate', 'lastRabiesDate'];
const CATALOG_FIELDS = new Set([
  'breed',
  'foodBrand',
  'foodDetail',
  'lastInternalDewormerName',
  'lastExternalDewormerName',
]);
const FIELDS = [
  ['name', 'Nombre', 'text', true, 100],
  ['birthDate', 'Fecha de nacimiento', 'birth', true],
  ['sex', 'Sexo', 'select', true],
  ['breed', 'Raza', 'text', true, 100, 'Por ejemplo, Común.'],
  ['coat', 'Largo del pelo', 'coat', true],
  ['color', 'Color y marcas', 'text', true, 100],
  ['personality', 'Personalidad', 'text', true, 255],
  ['foodBrand', 'Marca de comida', 'text', true, 100, 'Por ejemplo, Royal Canin.'],
  ['foodDetail', 'Variedad del alimento', 'text', true, 255, 'Por ejemplo, Kitten.'],
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
const photoViewer = document.querySelector('.photo-viewer');
const photoViewerTitle = photoViewer.querySelector('h2');
const photoViewerImage = photoViewer.querySelector('img');
const photoViewerClose = photoViewer.querySelector('button');
const partialDialog = document.querySelector('#partial-submission');
const partialCats = document.querySelector('#partial-cats');
const cards = [];
let catalogOptions = {};
let foodVarieties = [];
let allowNewCats = false;
let newCatNumber = 0;
let labelNumber = 0;
let sending = false;
let partialSubmission;
let stale = false;
let errorInput;
let expiresAt;
let photoTrigger;
let dialogExpiryTimer;
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

function openField(input) {
  for (let parent = input.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === 'DETAILS') parent.open = true;
  }
  input.focus();
}

function showError(message, input) {
  if (errorInput) {
    errorInput.removeAttribute('aria-invalid');
    const description = errorInput
      .getAttribute('aria-describedby')
      ?.split(' ')
      .filter((id) => id !== fieldError.id)
      .join(' ');
    if (description) {
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
    input.setAttribute('aria-invalid', 'true');
    const description = input.getAttribute('aria-describedby');
    input.setAttribute(
      'aria-describedby',
      description ? fieldError.id + ' ' + description : fieldError.id,
    );
    fieldError.textContent = message;
    input.before(fieldError);
    openField(input);
  } else if (message) {
    errorMessage.focus();
  }
}

function clearCards() {
  closePhotoViewer();
  closePartialSubmission();
  for (const { releasePhotos } of cards) releasePhotos();
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
  const wasOpen = !form.hidden;
  token = null;
  history.replaceState(null, '', location.pathname + location.search);
  closeForm(unavailable);
  if (wasOpen) status.focus();
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

function sameFieldValue(key, left, right) {
  return CATALOG_FIELDS.has(key) ? catalogKey(left) === catalogKey(right) : left === right;
}

function createCatalogField(title, label, input, options, initialId, showAllWhenEmpty) {
  const field = element('div', 'catalog-field');
  const labelId = input.getAttribute('aria-labelledby');
  const suggestions = element('ul', 'catalog-suggestions');
  suggestions.hidden = true;
  suggestions.id = labelId + '-suggestions';
  suggestions.setAttribute('aria-label', 'Opciones para ' + title);
  input.setAttribute('aria-controls', suggestions.id);
  const selection = element('p', 'catalog-selection');
  selection.id = labelId + '-selection';
  selection.setAttribute('role', 'status');
  const check = element('span', '', '✓');
  check.setAttribute('aria-hidden', 'true');
  const selectionName = element('span');
  selection.append(check, ' ', selectionName);
  input.setAttribute(
    'aria-describedby',
    input.getAttribute('aria-describedby') + ' ' + selection.id,
  );
  const results = element('p', 'sr-only');
  results.setAttribute('role', 'status');
  field.append(label, selection, suggestions, results);

  let selected;

  function updateSelection(option) {
    selected = option;
    selectionName.textContent = selected ? 'Seleccionado: ' + selected.name : '';
    selection.hidden = !selected;
    input.classList.toggle('catalog-input--selected', Boolean(selected));
  }
  function restoreChoice(value, chosenId) {
    input.value = value;
    const query = catalogKey(value);
    updateSelection(
      options().find(({ id, name }) => (chosenId ? id === chosenId : catalogKey(name) === query)),
    );
  }
  restoreChoice(input.value, initialId);

  function matchingOptions(showAll = false) {
    const query = catalogKey(input.value);
    if (selected || (!query && !showAll)) return [];
    return options().filter(({ name }) => catalogKey(name).includes(query));
  }

  function renderSuggestions(showAll = false) {
    const matches = matchingOptions(showAll);
    suggestions.replaceChildren();
    for (const match of matches) {
      const item = element('li');
      const choose = element('button', 'secondary', match.name);
      choose.type = 'button';
      choose.addEventListener('click', () => {
        input.value = match.name;
        updateSelection(match);
        if (errorInput === input) showError('');
        input.focus();
        renderSuggestions();
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      item.append(choose);
      suggestions.append(item);
    }
    suggestions.hidden = matches.length === 0;
    results.textContent = '';
    if (matches.length)
      results.textContent =
        matches.length === 1 ? 'Una opción disponible.' : `${matches.length} opciones disponibles.`;
  }

  input.addEventListener('input', () => {
    updateSelection(undefined);
    if (errorInput === input) showError('');
    renderSuggestions(showAllWhenEmpty);
  });
  input.addEventListener('focus', () => {
    if (suggestions.hidden) renderSuggestions(showAllWhenEmpty);
  });
  field.addEventListener('keydown', (event) => {
    if (suggestions.hidden) return;
    if (event.key === 'Escape' && suggestions.contains(event.target)) {
      event.preventDefault();
      input.focus();
    } else if (event.key === 'ArrowDown' && event.target === input) {
      event.preventDefault();
      suggestions.querySelector('button').focus();
    }
  });
  return {
    control: field,
    input,
    read: () => input.value,
    get option() {
      return selected;
    },
    requiresChoice: () => matchingOptions().length > 0,
    restore(value, id) {
      restoreChoice(value, id);
      if (errorInput === input) showError('');
      renderSuggestions();
    },
    refreshOptions() {
      updateSelection(selected && options().find(({ id }) => id === selected.id));
      renderSuggestions();
    },
  };
}

function createLitterField(title, initialValue, required) {
  const field = element('div', 'field');
  const choice = element('select');
  choice.add(new Option('Por confirmar', ''));
  choice.add(new Option(SHARED_LITTER, 'shared'));
  choice.add(new Option(OWN_LITTER, 'own'));
  choice.required = required;
  const choiceLabel = fieldLabel(title, choice);

  const own = element('input');
  own.name = 'litterBrand';
  own.maxLength = 100;
  own.value = initialValue === SHARED_LITTER || initialValue === OWN_LITTER ? '' : initialValue;
  choice.value = initialValue === SHARED_LITTER ? 'shared' : initialValue.trim() ? 'own' : '';
  const ownLabel = fieldLabel('Marca o tipo de piedritas', own);
  function updateChoice() {
    ownLabel.hidden = choice.value !== 'own';
    own.disabled = ownLabel.hidden;
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
      if (choice.value !== 'own') return '';
      const detail = own.value.trim();
      return detail && detail !== SHARED_LITTER ? detail : OWN_LITTER;
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
  toggle.append(onlyYear, element('span', '', 'Solo sé el año'));
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

function createField([key, title, type, requiredForNew, maxLength, hint], initial, isNew, catalog) {
  const required = Boolean(isNew && requiredForNew);
  const labelText = required ? title + ' *' : title;
  const initialValue = initial[key] ?? '';
  if (type === 'birth') return createBirthField(labelText, initial, required);
  if (type === 'litter') return createLitterField(labelText, initialValue, required);
  const input = element(
    type === 'coat' ? 'select' : ['select', 'textarea'].includes(type) ? type : 'input',
  );
  if (type === 'coat') {
    input.add(new Option('Seleccioná una opción', ''));
    for (const length of COAT_LENGTHS) input.add(new Option(length, length));
    if (initialValue && !COAT_LENGTHS.includes(initialValue)) {
      input.add(new Option(initialValue, initialValue));
    }
  } else if (type === 'select') {
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
  const guidance = catalog
    ? [hint, 'Buscá una opción o escribí un nombre nuevo.'].filter(Boolean).join(' ')
    : hint;
  const label = fieldLabel(labelText, input, guidance);
  if (catalog) {
    return createCatalogField(
      title,
      label,
      input,
      catalog.options,
      catalog.id,
      key === 'foodDetail',
    );
  }
  return { control: label, input, read: () => input.value };
}

function refreshActions() {
  addCat.hidden = !allowNewCats;
  addCat.disabled = cards.length >= MAX_CATS || stale;
  send.disabled = cards.length === 0 || stale;
}

function closePhotoViewer(restoreFocus = false) {
  if (!photoViewer.open) return;
  clearTimeout(dialogExpiryTimer);
  photoViewer.close();
  photoViewerImage.removeAttribute('src');
  photoViewerImage.alt = '';
  if (restoreFocus && photoTrigger?.isConnected) photoTrigger.focus({ preventScroll: true });
  photoTrigger = undefined;
}

function watchDialogExpiry() {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) {
    endAccess();
    return false;
  }
  if (Number.isFinite(remaining)) dialogExpiryTimer = setTimeout(endAccess, remaining);
  return true;
}

photoViewerClose.addEventListener('click', () => closePhotoViewer(true));
photoViewer.addEventListener('cancel', (event) => {
  event.preventDefault();
  closePhotoViewer(true);
});
window.addEventListener('pagehide', (event) => {
  closePhotoViewer();
  closePartialSubmission();
  if (!event.persisted) clearCards();
});

function photoThumbnail(image, title) {
  const button = element('button', 'photo-enlarge');
  button.type = 'button';
  button.setAttribute('aria-label', 'Ampliar ' + title);
  button.setAttribute('aria-haspopup', 'dialog');
  button.append(image);
  button.addEventListener('click', () => {
    if (partialDialog.open || photoViewer.open || !watchDialogExpiry()) return;
    photoTrigger = button;
    photoViewerTitle.textContent = title;
    photoViewerImage.src = image.src;
    photoViewerImage.alt = image.alt;
    photoViewer.showModal();
    photoViewerClose.focus({ preventScroll: true });
  });
  return button;
}

async function showRetainedPhoto(photo, preview, signal) {
  try {
    const response = await request('/api/intake/photos/' + encodeURIComponent(photo.id), {
      signal,
    });
    if (!response.ok) throw new Error('Photo unavailable');
    const blob = await response.blob();
    if (signal.aborted) return;
    photo.url = URL.createObjectURL(blob);
    const image = element('img');
    image.src = photo.url;
    image.alt = 'Comprobante ' + photo.number;
    preview.replaceChildren(photoThumbnail(image, image.alt));
  } catch {
    if (!signal.aborted) preview.textContent = 'No se pudo mostrar este comprobante.';
  }
}

function selectedPhotoPreview(file, signal) {
  const item = element('li', 'photo-preview');
  const caption = element('p', 'hint', file.name);
  item.append(caption);
  if (file.size > MAX_PHOTO_BYTES) return item;

  const image = element('img');
  image.alt = 'Vista previa de ' + file.name;
  const thumbnail = photoThumbnail(image, file.name);
  let url;
  function releaseUrl() {
    if (photoTrigger === thumbnail) closePhotoViewer();
    if (url) URL.revokeObjectURL(url);
    url = undefined;
  }
  function setSource(blob) {
    url = URL.createObjectURL(blob);
    image.src = url;
  }
  function unavailablePreview() {
    releaseUrl();
    thumbnail.remove();
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
      thumbnail.hidden = true;
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
        thumbnail.hidden = false;
        setSource(jpeg);
      } catch {
        if (!signal.aborted) unavailablePreview();
      }
    },
    { once: true },
  );
  setSource(file);
  item.prepend(thumbnail);
  return item;
}

function photoLimitError(files, retainedCount) {
  if (files.length + retainedCount > MAX_PHOTOS_PER_CAT) {
    return 'Elegí hasta cinco fotos por gato, incluidas las que quieras conservar.';
  }
  if (files.some((file) => file.size > MAX_PHOTO_BYTES)) {
    return 'Cada foto puede pesar hasta 8 MiB. Elegí un archivo más chico.';
  }
  return '';
}

function createAttachments(photos) {
  const attachments = element('div', 'attachments');
  const selected = element('ul', 'selected-photos');
  const fileInput = element('input');
  const clearFiles = element('button', 'secondary', 'Quitar fotos nuevas');
  fileInput.type = 'file';
  fileInput.accept = [...PHOTO_TYPES, ...PHOTO_EXTENSIONS].join(',');
  fileInput.multiple = true;
  clearFiles.type = 'button';
  clearFiles.hidden = true;
  const fileLabel = fieldLabel(
    'Fotos de comprobantes',
    fileInput,
    'Para informar una vacuna, adjuntá el comprobante de este gato.',
  );
  const retainedRequest = photos.length ? new AbortController() : undefined;
  let previewRequest;

  function clearPreviews() {
    previewRequest?.abort();
    previewRequest = undefined;
    selected.replaceChildren();
  }

  function releasePhotos() {
    clearPreviews();
    retainedRequest?.abort();
    for (const photo of photos) {
      if (photo.url) URL.revokeObjectURL(photo.url);
    }
  }

  function checkPhotoSelection() {
    const message = photoLimitError(
      Array.from(fileInput.files),
      photos.filter((photo) => photo.keep).length,
    );
    if (message || errorInput === fileInput) showError(message, message ? fileInput : undefined);
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
        checkPhotoSelection();
      });
      keepLabel.append(keep, element('span', '', 'Conservar foto ' + photo.number));
      item.append(preview, keepLabel);
      saved.append(item);
      void showRetainedPhoto(photo, preview, retainedRequest.signal);
    }
    attachments.append(saved);
  }
  attachments.append(fileLabel, selected, clearFiles);
  fileInput.addEventListener('change', () => {
    clearPreviews();
    const files = Array.from(fileInput.files);
    clearFiles.hidden = files.length === 0;
    checkPhotoSelection();
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
  return { attachments, fileInput, releasePhotos };
}

function addCard(
  {
    catId,
    fields = {},
    requestedFields = [],
    draftId,
    revision = 0,
    proposedFields = {},
    optionIds = {},
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
  const savedBadge =
    revision > 0
      ? element('span', 'cat-state cat-state--submitted', 'Enviado a CatWorld')
      : hasPending
        ? null
        : element('span', 'cat-state cat-state--complete', 'Sin datos pendientes');
  const unsentBadge = element('span', 'cat-state cat-state--dirty', 'Cambios sin enviar');
  const draftState = element('span');
  draftState.setAttribute('aria-live', 'polite');
  summary.append(' ', draftState);
  const content = element('div', 'cat-content');
  const primaryFields = element('div', 'fields');
  const other = element('details', 'other-fields');
  const otherFields = element('div', 'fields');
  other.append(element('summary', '', 'Modificar otros datos de este gato'), otherFields);
  const inputs = new Map();
  const foodFields = element('div', 'fields food-fields');

  for (const field of FIELDS) {
    const key = field[0];
    const isCatalog = CATALOG_FIELDS.has(key);
    const options = () => {
      if (key !== 'foodDetail') return catalogOptions[key] ?? [];
      const brand = inputs.get('foodBrand');
      const brandName = catalogKey(brand.read() || fields.foodBrand || '');
      const storedBrand = [initial.foodBrand, fields.foodBrand].some(
        (name) => name && catalogKey(name) === brandName,
      );
      const knownBrand = storedBrand
        ? catalogOptions.foodBrand?.find(({ name }) => catalogKey(name) === brandName)
        : undefined;
      const brandId = (brand.option ?? knownBrand)?.id;
      return foodVarieties.filter((variety) => variety.brandId === brandId);
    };
    const catalog = isCatalog ? { options, id: optionIds?.[key] } : undefined;
    const ui = createField(field, initial, isNew, catalog);
    const container = isNew || requestedFields.includes(key) ? primaryFields : otherFields;
    if (key === 'foodBrand') {
      (requestedFields.includes('foodDetail') ? primaryFields : container).append(foodFields);
    }
    (key === 'foodBrand' || key === 'foodDetail' ? foodFields : container).append(ui.control);
    inputs.set(key, ui);
  }
  const brand = inputs.get('foodBrand');
  const variety = inputs.get('foodDetail');
  const initialBrand = catalogKey(brand.read());
  const initialVariety = { value: variety.read(), id: variety.option?.id };
  let lastBrand = initialBrand;
  function updateVariety() {
    const nextBrand = catalogKey(brand.read());
    if (lastBrand !== nextBrand) {
      lastBrand = nextBrand;
      if (nextBrand === initialBrand) variety.restore(initialVariety.value, initialVariety.id);
      else variety.restore('');
    } else {
      variety.refreshOptions();
    }
  }
  brand.input.addEventListener('input', updateVariety);
  brand.input.addEventListener('change', updateVariety);
  inputs.get('name').input.addEventListener('input', ({ target }) => {
    title.textContent = target.value.trim() || fallbackTitle;
  });

  const photos = savedPhotos.map(({ id }, index) => ({ id, number: index + 1, keep: true }));
  const { attachments, fileInput, releasePhotos } = createAttachments(photos);
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
    title,
    inputs,
    photos,
    fileInput,
    releasePhotos,
  };
  function refreshDraftState() {
    const dirty =
      submissionCard(entry).changed ||
      [...inputs.values()].some(({ input }) => input.validity.badInput);
    const badge = dirty ? unsentBadge : savedBadge;
    if (draftState.firstElementChild !== badge) {
      draftState.replaceChildren(...(badge ? [badge] : []));
    }
  }
  refreshDraftState();
  content.addEventListener('input', refreshDraftState);
  content.addEventListener('change', refreshDraftState);
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
      releasePhotos();
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

function setCatalogOptions(invitation) {
  catalogOptions = {
    foodBrand: invitation.brands ?? invitation.foodBrands ?? [],
    ...invitation.catalogOptions,
  };
  foodVarieties = invitation.foodVarieties ?? [];
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
    expiresAt = Date.parse(invitation.expiresAt);
    showError('');
    stale = false;
    allowNewCats = invitation.allowNewCats === true;
    setCatalogOptions(invitation);
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

function submissionCard(card) {
  const fields = {};
  const optionIds = {};
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
    const original = card.fields[key]?.trim() ?? '';
    const entered = field.read().trim();
    const value = entered || original;
    const initial = card.initial[key]?.trim() ?? '';
    const unchanged = sameFieldValue(key, value, initial);
    if (!unchanged) changed = true;
    if (
      !sameFieldValue(key, value, original) ||
      (key === 'foodDetail' && entered && fields.foodBrand)
    ) {
      const option = field.option;
      fields[key] = option?.name ?? (unchanged ? initial : value);
      if (option) optionIds[key] = option.id;
    }
  }
  const files = Array.from(card.fileInput.files);
  const retainedPhotoIds = card.photos.filter((photo) => photo.keep).map((photo) => photo.id);
  return {
    card,
    fields,
    optionIds,
    files,
    retainedPhotoIds,
    changed: changed || files.length > 0 || retainedPhotoIds.length !== card.photos.length,
  };
}

function validateCards(drafts) {
  for (const { card, fields, files, retainedPhotoIds, changed } of drafts) {
    if (!changed && (card.catId !== null || card.revision > 0)) continue;
    for (const [key, field] of card.inputs) {
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
      const varietyBrandChanged =
        key === 'foodDetail' &&
        !sameFieldValue(
          'foodBrand',
          card.inputs.get('foodBrand').read() || card.fields.foodBrand || '',
          card.initial.foodBrand || '',
        );
      if (
        fields[key] &&
        field.requiresChoice?.() &&
        (varietyBrandChanged || !sameFieldValue(key, value, card.initial[key] ?? ''))
      ) {
        showError('Elegí una de las opciones para este dato.', input);
        return false;
      }
    }
    if (fields.foodDetail && !fields.foodBrand && !card.fields.foodBrand) {
      showError('Ingresá la marca para indicar la variedad.', card.inputs.get('foodBrand').input);
      return false;
    }
    const count = files.length + retainedPhotoIds.length;
    const photoError = photoLimitError(files, retainedPhotoIds.length);
    if (photoError) {
      showError(photoError, card.fileInput);
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
  const updates = entries.map(({ card, fields, optionIds, files, retainedPhotoIds }, index) => {
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
      ...(Object.keys(optionIds).length ? { optionIds } : {}),
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

async function refreshCatalogConflict(response, entries) {
  const conflict = await response.json().catch(() => null);
  if (conflict?.code !== 'CAT_INTAKE_CATALOG_CHANGED') return false;
  try {
    const latest = await request('/api/intake/request');
    if (unavailableStatus(latest.status)) {
      endAccess();
      return true;
    }
    if (!latest.ok) throw new Error('Request failed');
    setCatalogOptions(await latest.json());
    for (const card of cards) {
      for (const field of card.inputs.values()) field.refreshOptions?.();
    }
    const affected = entries.filter(({ fields }) => Object.hasOwn(fields, conflict.field));
    const entry =
      affected.find(({ card, optionIds }) => {
        const field = card.inputs.get(conflict.field);
        return field?.requiresChoice?.() || (optionIds[conflict.field] && !field?.option);
      }) ?? affected[0];
    editable.disabled = false;
    showError(
      'Las opciones de este dato cambiaron. Revisalo antes de enviar.',
      entry?.card.inputs.get(conflict.field)?.input,
    );
  } catch {
    showError('No se pudieron actualizar las opciones. Volvé a intentar.');
  }
  return true;
}

addCat.addEventListener('click', () => {
  if (allowNewCats && cards.length < MAX_CATS) addCard().inputs.get('name').input.focus();
});

function showPartialSubmission(missing, body, entries) {
  if (!watchDialogExpiry()) return;
  partialCats.replaceChildren();
  for (const { card, fields } of missing) {
    const item = element('li');
    const requested = element('ul');
    for (const [, label] of fields) requested.append(element('li', '', label));
    item.append(element('strong', '', card.title.textContent), requested);
    partialCats.append(item);
  }
  const [{ card, fields }] = missing;
  partialSubmission = { body, entries, firstPending: card.inputs.get(fields[0][0]).input };
  partialDialog.showModal();
}

function closePartialSubmission() {
  if (!partialDialog.open) return;
  clearTimeout(dialogExpiryTimer);
  partialSubmission = undefined;
  partialDialog.close();
}

function returnToDraft() {
  if (!partialSubmission) return;
  const { firstPending } = partialSubmission;
  closePartialSubmission();
  openField(firstPending);
}

document.querySelector('#complete-partial').addEventListener('click', returnToDraft);
partialDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  returnToDraft();
});
document.querySelector('#send-partial').addEventListener('click', () => {
  if (!partialSubmission) return;
  const { body, entries } = partialSubmission;
  closePartialSubmission();
  void submitDraft(body, entries, true);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (sending || stale || partialDialog.open || photoViewer.open || cards.length === 0) return;
  showError('');
  const drafts = cards.map(submissionCard);
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
      'Las fotos nuevas del envío superan los 32 MiB. Quitá alguna foto o elegí archivos más chicos.',
    );
    return;
  }
  const missing = drafts
    .map(({ card, fields }) => ({
      card,
      fields: FIELDS.filter(([key]) => card.requestedFields.includes(key) && !fields[key]),
    }))
    .filter(({ fields }) => fields.length);
  if (proposals.length && missing.length) {
    showPartialSubmission(missing, body, entries);
    return;
  }
  void submitDraft(body, entries, proposals.length > 0);
});

async function submitDraft(body, entries, hasProposals) {
  sending = true;
  editable.disabled = true;
  send.textContent = 'Enviando…';
  try {
    const response = await request('/api/intake/submissions', { method: 'POST', body });
    if (response.ok) {
      closeForm(
        hasProposals
          ? 'Ficha recibida. CatWorld va a revisar los datos.'
          : 'Se retiraron los cambios de la ficha.',
        'Volver a la ficha',
      );
      retry.focus();
    } else if (unavailableStatus(response.status)) {
      endAccess();
    } else if (response.status === 409) {
      if (!(await refreshCatalogConflict(response, entries))) {
        stale = true;
        showStatus('La ficha cambió. Cargá la versión actual antes de volver a hacer tus cambios.');
        retry.textContent = 'Cargar versión actual';
        retry.hidden = false;
        retry.focus();
      }
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
}

retry.addEventListener('click', load);
void load();
