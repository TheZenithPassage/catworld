'use strict';

const MAX_CATS = 20;
const MAX_PHOTOS_PER_CAT = 5;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const TOTAL_PHOTO_ERROR =
  'Las fotos nuevas del envío superan los 32 MiB. Quitá alguna foto o elegí archivos más chicos.';
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
  ['foodDetail', 'Variedad del alimento', 'text', true, 255, 'Por ejemplo, Kitten o Senior.'],
  ['litterBrand', 'Piedritas', 'litter', true],
  ['careInstructions', 'Indicaciones extra', 'textarea', false, 2000],
  ['lastTripleFelineDate', 'Fecha de aplicación de la triple felina', 'date', true],
  ['lastRabiesDate', 'Fecha de aplicación de la antirrábica', 'date', true],
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
let litterRatePerKg = null;
let vaccineDateRange;
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

function createCatalogField(
  title,
  labelText,
  input,
  options,
  initialId,
  showAllWhenEmpty,
  example,
) {
  const field = element('div', 'field catalog-field');
  const label = element('label', 'catalog-label', labelText);
  input.id = 'catalog-' + ++labelNumber;
  input.autocomplete = 'off';
  label.htmlFor = input.id;
  const control = element('div', 'catalog-control');
  const suffix = element('div', 'catalog-suffix');
  const check = element('span', 'catalog-check', '✓');
  check.setAttribute('aria-hidden', 'true');
  const clear = element('button', 'catalog-clear', '×');
  clear.type = 'button';
  clear.setAttribute('aria-label', 'Limpiar ' + title);
  suffix.append(check, clear);
  control.append(input, suffix);
  const suggestions = element('ul', 'catalog-suggestions');
  suggestions.hidden = true;
  suggestions.id = input.id + '-suggestions';
  suggestions.setAttribute('aria-label', 'Opciones para ' + title);
  input.setAttribute('aria-controls', suggestions.id);
  const selection = element('p', 'sr-only');
  selection.setAttribute('role', 'status');
  const results = element('p', 'sr-only');
  results.setAttribute('role', 'status');
  field.append(label, control, selection, suggestions, results);

  let selected;
  const storedChoice = initialId ? { id: initialId, name: input.value } : undefined;

  function updateSelection(option) {
    selected = option;
    const announcement = selected ? 'Seleccionado: ' + selected.name : '';
    if (selection.textContent !== announcement) selection.textContent = announcement;
    check.hidden = !selected;
    clear.hidden = !input.value;
    input.classList.toggle('catalog-input--selected', Boolean(selected));
    input.placeholder = example && !input.value && document.activeElement === input ? example : '';
  }

  function restoreChoice(value, id) {
    input.value = value;
    updateSelection(id ? { id, name: value } : undefined);
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
    if (example && !input.value) input.placeholder = example;
    if (suggestions.hidden) renderSuggestions(showAllWhenEmpty);
  });
  input.addEventListener('blur', () => {
    input.placeholder = '';
  });
  clear.addEventListener('click', () => {
    input.value = '';
    input.focus();
    input.dispatchEvent(new Event('input', { bubbles: true }));
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
      const available =
        selected &&
        options().find(
          ({ id, name }) => id === selected.id && catalogKey(name) === catalogKey(selected.name),
        );
      const retained =
        storedChoice &&
        selected?.id === storedChoice.id &&
        catalogKey(input.value) === catalogKey(storedChoice.name);
      updateSelection(retained ? storedChoice : available);
      renderSuggestions();
    },
  };
}

function ownLitterDetail({ litterBrand, litterDetail }) {
  if (!litterBrand || litterBrand === SHARED_LITTER) return '';
  return (litterDetail ?? (litterBrand === OWN_LITTER ? '' : litterBrand)).trim();
}

function createLitterField(title, initialValue, initialDetail, required, catalog) {
  const field = element('div', 'field');
  const choice = element('select');
  choice.add(new Option('Por confirmar', ''));
  choice.add(new Option(SHARED_LITTER, 'shared'));
  choice.add(new Option(OWN_LITTER, 'own'));
  choice.required = required;
  const hasRate = litterRatePerKg !== null;
  const rate = hasRate ? new Intl.NumberFormat('es-AR').format(BigInt(litterRatePerKg)) : '';
  const expectation = hasRate
    ? `La tarifa actual es de ${rate} pesos por kg.`
    : 'La tarifa todavía no está disponible.';
  const choiceLabel = fieldLabel(
    title,
    choice,
    `El consumo habitual es de ½ kg por gato por día. ${expectation}`,
  );
  const sharedHint = choiceLabel.querySelector('.hint');

  const own = element('input');
  own.name = 'litterBrand';
  own.maxLength = 100;
  own.value = ownLitterDetail({ litterBrand: initialValue, litterDetail: initialDetail });
  choice.value = initialValue === SHARED_LITTER ? 'shared' : initialValue.trim() ? 'own' : '';
  const ownTitle = 'Marca o tipo de piedritas';
  const detail = createCatalogField(ownTitle, ownTitle, own, catalog.options, catalog.id, true);
  function updateChoice() {
    detail.control.hidden = choice.value !== 'own';
    own.disabled = detail.control.hidden;
    sharedHint.hidden = choice.value !== 'shared';
    if (sharedHint.hidden) choice.removeAttribute('aria-describedby');
    else choice.setAttribute('aria-describedby', sharedHint.id);
  }
  updateChoice();
  choice.addEventListener('change', updateChoice);

  field.append(choiceLabel, detail.control);
  return {
    control: field,
    hasEnteredValue: () => Boolean(choice.value || own.value.trim()),
    get input() {
      return choice.value === 'own' && own.value.trim() ? own : choice;
    },
    get option() {
      return choice.value === 'own' ? detail.option : undefined;
    },
    requiresChoice: () => choice.value === 'own' && detail.requiresChoice(),
    readLitterDetail: () => (choice.value === 'own' ? own.value.trim() : ''),
    refreshOptions: () => detail.refreshOptions(),
    read: () => {
      if (choice.value === 'shared') return SHARED_LITTER;
      if (choice.value !== 'own') return '';
      const value = own.value.trim();
      return value && value !== SHARED_LITTER ? value : OWN_LITTER;
    },
  };
}

function dateLimits(input) {
  if (VACCINES.includes(input.name)) {
    input.min = vaccineDateRange?.min ?? '';
    input.max = vaccineDateRange?.max ?? '';
    return;
  }
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
  if (type === 'litter') {
    return createLitterField(labelText, initialValue, initial.litterDetail, required, catalog);
  }
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
  }
  input.name = key;
  if (type === 'date') dateLimits(input);
  input.required = required;
  input.value = initialValue;
  if (catalog) {
    return createCatalogField(
      title,
      labelText,
      input,
      catalog.options,
      catalog.id,
      key === 'foodDetail',
      hint,
    );
  }
  return { control: fieldLabel(labelText, input), input, read: () => input.value };
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

async function showRetainedPhoto(photo, preview, title, signal) {
  try {
    const response = await request('/api/intake/photos/' + encodeURIComponent(photo.id), {
      signal,
    });
    if (!response.ok) throw new Error('Photo unavailable');
    const blob = await response.blob();
    if (signal.aborted) return;
    const url = URL.createObjectURL(blob);
    const image = element('img');
    image.src = url;
    image.alt = title;
    const thumbnail = photoThumbnail(image, title);
    signal.addEventListener(
      'abort',
      () => {
        if (photoTrigger === thumbnail) closePhotoViewer();
        URL.revokeObjectURL(url);
      },
      { once: true },
    );
    preview.replaceChildren(thumbnail);
  } catch {
    if (!signal.aborted) preview.textContent = 'No se pudo mostrar este comprobante.';
  }
}

function selectedPhotoPreview(file, signal) {
  const item = element('li', 'photo-preview');
  const caption = element('p', 'hint', file.name);
  item.append(caption);

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

function photoRemovalButton(label) {
  const remove = element('button', 'photo-remove', '×');
  remove.type = 'button';
  remove.setAttribute('aria-label', label);
  return remove;
}

function createAttachments(photos, required) {
  const attachments = element('div', 'attachments');
  const selected = element('ul', 'selected-photos');
  const newPhotos = [];
  const fileInput = element('input', 'file-picker-input');
  fileInput.type = 'file';
  fileInput.accept = [...PHOTO_TYPES, ...PHOTO_EXTENSIONS].join(',');
  fileInput.multiple = true;
  const fileLabel = fieldLabel(
    required ? 'Fotos de comprobantes *' : 'Fotos de comprobantes',
    fileInput,
    'Para informar una vacuna, adjuntá el comprobante de este gato.',
  );
  const labelId = fileInput.getAttribute('aria-labelledby');
  const filePicker = element('span', 'file-picker-row');
  const fileButton = element('span', 'file-picker-button', 'Elegir archivos');
  const fileStatus = element('span', 'file-picker-status');
  fileButton.id = labelId + '-picker';
  fileStatus.id = labelId + '-attachments';
  fileStatus.setAttribute('role', 'status');
  fileInput.setAttribute('aria-labelledby', labelId + ' ' + fileButton.id);
  fileInput.setAttribute('aria-describedby', labelId + '-hint ' + fileStatus.id);
  filePicker.append(fileButton, fileStatus);
  fileInput.after(filePicker);
  const retainedCount = () => photos.filter((photo) => photo.keep).length;

  function updateFileStatus() {
    const count = retainedCount() + newPhotos.length;
    fileStatus.textContent =
      count === 0
        ? 'Sin archivos adjuntos'
        : count === 1
          ? '1 archivo adjunto'
          : `${count} archivos adjuntos`;
  }

  function notifyChange() {
    updateFileStatus();
    if (errorInput === fileInput) showError('');
    attachments.dispatchEvent(new Event('change', { bubbles: true }));
  }

  if (photos.length) {
    const saved = element('ul', 'retained-photos');
    for (const photo of photos) {
      const title = 'comprobante ' + photo.number;
      const item = element('li', 'photo-preview');
      const remove = photoRemovalButton('Quitar ' + title);
      const restore = element('button', 'secondary', 'Restaurar ' + title);
      restore.type = 'button';

      function renderRetained() {
        const preview = element('div', '', 'Cargando ' + title + '…');
        item.replaceChildren(preview, remove);
        photo.request = new AbortController();
        void showRetainedPhoto(photo, preview, title, photo.request.signal);
      }

      remove.addEventListener('click', () => {
        photo.keep = false;
        photo.request.abort();
        item.replaceChildren(restore);
        notifyChange();
        restore.focus();
      });
      restore.addEventListener('click', () => {
        const message = photoLimitError(
          newPhotos.map(({ file }) => file),
          retainedCount() + 1,
        );
        if (message) {
          showError(message, fileInput);
          return;
        }
        photo.keep = true;
        renderRetained();
        notifyChange();
        remove.focus();
      });

      renderRetained();
      saved.append(item);
    }
    attachments.append(saved);
  }
  updateFileStatus();
  attachments.append(fileLabel, selected);
  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    fileInput.value = '';
    if (!files.length) return;
    const message = photoLimitError(
      [...newPhotos.map(({ file }) => file), ...files],
      retainedCount(),
    );
    const totalBytes = cards.reduce(
      (total, card) => {
        return total + card.newFiles().reduce((bytes, file) => bytes + file.size, 0);
      },
      files.reduce((bytes, file) => bytes + file.size, 0),
    );
    if (message || totalBytes > MAX_TOTAL_BYTES) {
      showError(message || TOTAL_PHOTO_ERROR, fileInput);
      return;
    }

    for (const file of files) {
      const photo = { file, request: new AbortController() };
      const item = selectedPhotoPreview(file, photo.request.signal);
      const remove = photoRemovalButton('Quitar foto ' + file.name);
      remove.addEventListener('click', () => {
        photo.request.abort();
        newPhotos.splice(newPhotos.indexOf(photo), 1);
        item.remove();
        notifyChange();
        fileInput.focus();
      });
      item.append(remove);
      selected.append(item);
      newPhotos.push(photo);
    }
    updateFileStatus();
    if (errorInput === fileInput) showError('');
  });

  return {
    attachments,
    fileInput,
    newFiles: () => newPhotos.map(({ file }) => file),
    releasePhotos() {
      for (const photo of [...photos, ...newPhotos]) photo.request.abort();
    },
  };
}

const OPTIONAL_FIELDS = new Set([
  'careInstructions', 'lastInternalDewormerName', 'lastInternalDewormingDate',
  'lastExternalDewormerName', 'lastExternalDewormingDate',
]);

function createPortrait(saved, required) {
  const control = element('section', 'profile-photo');
  const label = element('label', '', required ? 'Foto de perfil *' : 'Foto de perfil');
  const input = element('input');
  input.type = 'file';
  input.name = 'profilePhoto';
  input.accept = [...PHOTO_TYPES, ...PHOTO_EXTENSIONS].join(',');
  label.append(input);
  const preview = element('div', 'profile-photo-preview');
  const image = element('img');
  image.alt = 'Encuadre de la foto de perfil';
  preview.append(image);
  const framing = element('div', 'profile-photo-controls');
  const ranges = [
    ['frameX', 'Posición horizontal', 0, 100, 50],
    ['frameY', 'Posición vertical', 0, 100, 50],
    ['frameZoom', 'Zoom', 100, 300, 100],
  ].map(([key, text, min, max, fallback]) => {
    const field = element('label', '', text);
    const slider = element('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = saved?.frame[key] ?? fallback;
    field.append(slider);
    framing.append(field);
    return { key, slider, fallback };
  });
  const frame = () => Object.fromEntries(ranges.map(({ key, slider }) => [key, Number(slider.value)]));
  function paint() {
    const { frameX, frameY, frameZoom } = frame();
    const position = frameX + '% ' + frameY + '%';
    image.style.objectPosition = position;
    image.style.transformOrigin = position;
    image.style.transform = 'scale(' + frameZoom / 100 + ')';
  }
  const remove = element('button', 'secondary', 'Quitar foto nueva');
  remove.type = 'button';
  const feedback = element('p', 'hint');
  let file;
  let url;
  let pending;
  function release() {
    pending?.abort();
    if (url) URL.revokeObjectURL(url);
    url = undefined;
  }
  async function show() {
    release();
    preview.hidden = true;
    framing.hidden = !file;
    remove.hidden = !file;
    feedback.textContent = '';
    if (!file && !saved) return;
    const controller = new AbortController();
    pending = controller;
    try {
      let blob = file;
      if (!file) {
        const response = await request('/api/intake/photos/' + encodeURIComponent(saved.id), { signal: controller.signal });
        if (!response.ok) throw new Error('Preview unavailable');
        blob = await response.blob();
      } else if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        const body = new FormData();
        body.append('photo', file);
        const response = await request('/api/intake/photo-preview', { method: 'POST', body, signal: controller.signal });
        if (!response.ok) throw new Error('Preview unavailable');
        blob = await response.blob();
      }
      if (controller.signal.aborted) return;
      url = URL.createObjectURL(blob);
      image.src = url;
      paint();
      preview.hidden = false;
    } catch {
      if (!controller.signal.aborted) feedback.textContent = 'Vista previa no disponible.';
    }
  }
  input.addEventListener('change', () => {
    const next = input.files?.[0];
    input.value = '';
    if (!next) return;
    const problem = photoLimitError([next], 0);
    if (problem) {
      showError(problem, input);
      return;
    }
    showError('');
    file = next;
    for (const { slider, fallback } of ranges) slider.value = fallback;
    void show();
  });
  remove.addEventListener('click', () => {
    file = undefined;
    for (const { key, slider, fallback } of ranges) slider.value = saved?.frame[key] ?? fallback;
    void show();
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  for (const { slider } of ranges) slider.addEventListener('input', paint);
  control.append(label, preview, framing, remove, feedback);
  void show();
  return { control, input, file: () => file, frame, saved, release };
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
  if (
    Object.hasOwn(proposedFields, 'litterBrand') &&
    !Object.hasOwn(proposedFields, 'litterDetail')
  ) {
    delete initial.litterDetail;
  }
  const card = element('div', 'cat-card');
  const disclosure = element('details');
  const fallbackTitle = isNew ? 'Gato nuevo ' + ++newCatNumber : 'Datos del gato';
  const summary = element('summary');
  const title = element('span', '', initial.name || fallbackTitle);
  summary.append(title);
  const hasPending = isNew ? revision === 0 : requestedFields.some((key) => {
    if (key === 'profilePhoto') return !savedPhotos.some(({ frame }) => frame);
    if (key === 'birthDate' && proposedFields.birthYear) return false;
    if (key === 'litterDetail' && proposedFields.litterBrand === SHARED_LITTER) return false;
    return !proposedFields[key];
  });
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
    const catalogField = key === 'litterBrand' ? 'litterDetail' : key;
    const isCatalog = CATALOG_FIELDS.has(key) || key === 'litterBrand';
    const options = () => {
      if (key !== 'foodDetail') return catalogOptions[catalogField] ?? [];
      const brandId = inputs.get('foodBrand').option?.id;
      return foodVarieties.filter((variety) => variety.brandId === brandId);
    };
    const catalog = isCatalog ? { options, id: optionIds?.[catalogField] } : undefined;
    const ui = createField(field, initial, isNew, catalog);
    const requested = requestedFields.includes(key) ||
      (key === 'litterBrand' && requestedFields.includes('litterDetail'));
    const container = isNew || requested ? primaryFields : otherFields;
    if (key === 'foodBrand') {
      (requestedFields.includes('foodDetail') ? primaryFields : container).append(foodFields);
    }
    (key === 'foodBrand' || key === 'foodDetail' ? foodFields : container).append(ui.control);
    inputs.set(key, ui);
  }
  const brand = inputs.get('foodBrand');
  const variety = inputs.get('foodDetail');
  const initialBrand = catalogKey(brand.read());
  const initialBrandId = brand.option?.id;
  const initialVariety = { value: variety.read(), id: variety.option?.id };
  let lastBrand = initialBrand;
  let lastBrandId = initialBrandId;
  function updateVariety() {
    const nextBrand = catalogKey(brand.read());
    const nextBrandId = brand.option?.id;
    if (lastBrand !== nextBrand || lastBrandId !== nextBrandId) {
      lastBrand = nextBrand;
      lastBrandId = nextBrandId;
      if (nextBrand === initialBrand && (!initialBrandId || initialBrandId === nextBrandId)) {
        variety.restore(initialVariety.value, initialVariety.id);
      } else {
        variety.restore('');
      }
    } else {
      variety.refreshOptions();
    }
  }
  brand.input.addEventListener('input', updateVariety);
  brand.input.addEventListener('change', updateVariety);
  inputs.get('name').input.addEventListener('input', ({ target }) => {
    title.textContent = target.value.trim() || fallbackTitle;
  });

  const portrait = createPortrait(savedPhotos.find(({ frame }) => frame), isNew);
  const photos = savedPhotos.filter(({ frame }) => !frame).map(({ id }, index) => ({ id, number: index + 1, keep: true }));
  const { attachments, fileInput, newFiles, releasePhotos } = createAttachments(photos, isNew);
  (isNew || requestedFields.includes('profilePhoto') || portrait.saved ? primaryFields : otherFields).append(portrait.control);
  content.append(primaryFields);
  if (isNew || photos.length || VACCINES.some((key) => requestedFields.includes(key))) {
    content.append(attachments);
  } else {
    other.append(attachments);
  }
  if (!isNew && !hasPending) {
    content.append(element('p', 'hint', 'Podés actualizar lo que haya cambiado.'));
  }
  if (!isNew) content.append(other);

  const entry = {
    catId,
    draftId: isNew ? (draftId ?? crypto.randomUUID()) : undefined,
    revision,
    requestedFields,
    fields,
    initial,
    optionIds,
    title,
    inputs,
    photos,
    fileInput,
    newFiles,
    portrait,
    releasePhotos: () => {
      releasePhotos();
      portrait.release();
    },
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
        newFiles().length > 0 || !!portrait.file() ||
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
      entry.releasePhotos();
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

function setVaccineDateRange(range) {
  vaccineDateRange = range;
  for (const card of cards) {
    for (const key of VACCINES) dateLimits(card.inputs.get(key).input);
  }
}

function showVaccineDateError(input) {
  const displayDate = (date) => date.split('-').reverse().join('/');
  const { min, max } = vaccineDateRange;
  editable.disabled = false;
  showError(
    `Ingresá una fecha de aplicación entre el ${displayDate(min)} y el ${displayDate(max)}.`,
    input,
  );
}

function changedVaccines({ card, fields }) {
  return VACCINES.filter((key) => fields[key] && fields[key] !== card.initial[key]);
}

async function validateVaccineDates(entries) {
  if (!entries.some((entry) => changedVaccines(entry).length)) return true;
  const latest = await request('/api/intake/request');
  if (unavailableStatus(latest.status)) {
    endAccess();
    return false;
  }
  if (!latest.ok) throw new Error('Request failed');
  setVaccineDateRange((await latest.json()).vaccineDateRange);
  const { min, max } = vaccineDateRange;
  for (const entry of entries) {
    const invalid = changedVaccines(entry).find(
      (key) => entry.fields[key] < min || entry.fields[key] > max,
    );
    if (invalid) {
      showVaccineDateError(entry.card.inputs.get(invalid).input);
      return false;
    }
  }
  return true;
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
    litterRatePerKg = invitation.litterRatePerKg ?? null;
    setVaccineDateRange(invitation.vaccineDateRange);
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
    if (key === 'litterBrand') {
      const original = card.fields.litterBrand?.trim() ?? '';
      const initial = card.initial.litterBrand?.trim() ?? '';
      const entered = field.read().trim();
      const value = entered || original;
      const originalDetail = ownLitterDetail(card.fields);
      const text = entered ? field.readLitterDetail() : originalDetail;
      const optionId = field.option?.id;
      const matchesInitial = value === initial && text === ownLitterDetail(card.initial);
      const newSelection = optionId && optionId !== card.initialLitterOptionId;
      if (!matchesInitial || newSelection || (entered && card.initialLitterOptionId && !optionId)) {
        changed = true;
      }
      if (value !== original || text !== originalDetail || newSelection) {
        fields.litterBrand = value;
        if (text && (!matchesInitial || Object.hasOwn(card.initial, 'litterDetail') || optionId)) {
          fields.litterDetail = field.option?.name ?? text;
        }
        if (optionId) optionIds.litterDetail = optionId;
      }
      continue;
    }
    const original = card.fields[key]?.trim() ?? '';
    const entered = field.read().trim();
    const value = entered || original;
    const initial = card.initial[key]?.trim() ?? '';
    const unchanged = sameFieldValue(key, value, initial);
    const option = field.option;
    if (!unchanged) changed = true;
    if (
      !sameFieldValue(key, value, original) ||
      (key === 'foodDetail' && entered && fields.foodBrand)
    ) {
      fields[key] = option?.name ?? (unchanged ? initial : value);
      if (option) {
        optionIds[key] = option.id;
        if (option.id !== card.optionIds[key]) changed = true;
      }
    }
  }
  const files = card.newFiles();
  const retainedPhotoIds = card.photos.filter((photo) => photo.keep).map((photo) => photo.id);
  return {
    card,
    fields,
    optionIds,
    files,
    retainedPhotoIds,
    changed: changed || !!card.portrait.file() || files.length > 0 || retainedPhotoIds.length !== card.photos.length,
  };
}

function validateCards(drafts) {
  for (const input of form.querySelectorAll('[data-required-missing]')) {
    input.removeAttribute('data-required-missing');
    input.removeAttribute('aria-invalid');
  }
  const missing = [];
  for (const { card, files, retainedPhotoIds, changed } of drafts) {
    if (card.catId !== null || (!changed && card.revision > 0)) continue;
    for (const field of card.inputs.values()) {
      if (field.input.required && !field.read().trim() && !field.input.validity.badInput) missing.push(field.input);
    }
    if (!card.portrait.file() && !card.portrait.saved) missing.push(card.portrait.input);
    if (!files.length && !retainedPhotoIds.length) missing.push(card.fileInput);
  }
  if (missing.length) {
    for (const input of missing) {
      input.setAttribute('data-required-missing', '');
      input.setAttribute('aria-invalid', 'true');
    }
    showError('Completá los campos obligatorios y adjuntá las fotos requeridas.', missing[0]);
    return false;
  }
  for (const { card, fields, files, retainedPhotoIds, changed } of drafts) {
    if (!changed && (card.catId !== null || card.revision > 0)) continue;
    for (const [key, field] of card.inputs) {
      const { input } = field;
      const value = field.read().trim();
      if (
        input.name === 'birthYear' &&
        value &&
        (Number(value) < MIN_BIRTH_YEAR || Number(value) > Number(localToday().slice(0, 4)))
      ) {
        showError('Ingresá un año de nacimiento válido.', input);
        return false;
      }
      // Vaccine bounds come from CatWorld and are refreshed before sending new dates.
      if (input.validity.badInput || (value && !VACCINES.includes(key) && !input.validity.valid)) {
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
        (varietyBrandChanged ||
          (key === 'litterBrand' && field.readLitterDetail() !== ownLitterDetail(card.initial)) ||
          !sameFieldValue(key, value, card.initial[key] ?? ''))
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

function hasProposal({ card, fields, files, retainedPhotoIds }) {
  return !!card.portrait.file() || !!card.portrait.saved ||
    Object.keys(fields).length > 0 || files.length > 0 || retainedPhotoIds.length > 0;
}

function missingFor({ card, fields }) {
  const missing = [];
  const isNew = card.catId === null;
  for (const [key, label] of FIELDS) {
    if (card.requestedFields.includes(key) || (isNew && OPTIONAL_FIELDS.has(key))) {
      const answered = fields[key] || (key === 'birthDate' && fields.birthYear);
      if (!answered) missing.push([key, label]);
    }
  }
  if (card.requestedFields.includes('profilePhoto') && !card.portrait.file() && !card.portrait.saved) {
    missing.push(['profilePhoto', 'Foto de perfil']);
  }
  const litter = card.inputs.get('litterBrand');
  if ((isNew || card.requestedFields.includes('litterDetail')) &&
      litter.read()?.startsWith(OWN_LITTER) && !litter.readLitterDetail()) {
    missing.push(['litterBrand', 'Marca o tipo de piedritas']);
  }
  return { card, fields: missing };
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
    const portrait = card.portrait.file();
    const portraitKey = portrait && 'portrait-' + index;
    if (portrait) {
      totalBytes += portrait.size;
      body.append(portraitKey, portrait);
    }
    return {
      catId: card.catId,
      draftId: card.draftId,
      revision: card.revision,
      fields,
      ...(Object.keys(optionIds).length ? { optionIds } : {}),
      retainedPhotoIds,
      photoKeys,
      ...(portrait ? { portraitKey, portraitFrame: card.portrait.frame() } : {}),
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
    const fieldKey = conflict.field === 'litterDetail' ? 'litterBrand' : conflict.field;
    const affected = entries.filter(({ fields }) => Object.hasOwn(fields, fieldKey));
    const entry =
      affected.find(({ card, optionIds }) => {
        const field = card.inputs.get(fieldKey);
        return field?.requiresChoice?.() || (optionIds[conflict.field] && !field?.option);
      }) ?? affected[0];
    editable.disabled = false;
    showError(
      'Las opciones de este dato cambiaron. Revisalo antes de enviar.',
      entry?.card.inputs.get(fieldKey)?.input,
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
  partialSubmission = { body, entries, firstPending: card.inputs.get(fields[0][0])?.input ?? card.portrait.input };
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
  const body = multipart(entries);
  if (!body) {
    showError(TOTAL_PHOTO_ERROR);
    return;
  }
  const missing = drafts
    .map(missingFor)
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
    if (!(await validateVaccineDates(entries))) return;
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
      const problem = await response.json().catch(() => null);
      if (problem?.code === 'CAT_INTAKE_VACCINE_DATE_OUT_OF_RANGE') {
        setVaccineDateRange(problem.vaccineDateRange);
        showVaccineDateError(entries[problem.catIndex]?.card.inputs.get(problem.field)?.input);
      } else {
        showError(
          'Revisá los datos y los comprobantes. Las fotos deben ser JPEG, PNG, WebP, HEIC o HEIF.',
        );
      }
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
