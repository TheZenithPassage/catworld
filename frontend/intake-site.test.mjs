import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('./intake-site/index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('./intake-site/intake.js', import.meta.url), 'utf8');

async function openForm(t, invitation, previewOptions = {}) {
  const dom = new JSDOM(html, {
    url: 'https://fichas.example.test/#token=example',
    runScripts: 'outside-only',
  });
  t.after(() => dom.window.close());
  const { window } = dom;
  const requests = [];
  window.Blob = Blob;
  window.FormData = FormData;
  // jsdom has the dialog element but omits the native dialog actions.
  window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  window.fetch = async (path, options) => {
    requests.push({ path, ...options });
    if (path === '/api/intake/request') {
      return Response.json(typeof invitation === 'function' ? invitation() : invitation);
    }
    if (path === '/api/intake/submissions' && previewOptions.submit) {
      return previewOptions.submit();
    }
    if (path === '/api/intake/photo-preview' && previewOptions.response) {
      return previewOptions.response();
    }
    if (path.startsWith('/api/intake/photos/') && previewOptions.retainedResponse) {
      return previewOptions.retainedResponse();
    }
    return new Response(null, { status: 204 });
  };
  Object.assign(window.URL, previewOptions.urls);
  window.eval(script);
  await tick();
  const form = window.document.querySelector('#intake');
  return {
    window,
    form,
    requests,
    entries: () => [...form.querySelectorAll('#cats > *')],
    add: () => form.querySelector('#add-cat').click(),
    submit: async () => {
      const before = requests.length;
      form.querySelector('#submit').click();
      await tick();
      return requests.slice(before).find((request) => request.path === '/api/intake/submissions');
    },
  };
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

async function setOpen(disclosure, open) {
  if (disclosure.open === open) return;
  const toggled = new Promise((resolve) =>
    disclosure.addEventListener('toggle', resolve, { once: true }),
  );
  disclosure.open = open;
  await toggled;
}

function enter(window, card, key, value) {
  const input = card.querySelector(`[name="${key}"]`);
  input.value = value;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  return input;
}

const existing = {
  catId: 'registered-cat',
  fields: { name: 'Mora' },
  requestedFields: ['foodBrand', 'litterBrand'],
};

test('a collapsed blank new cat blocks a valid existing cat update until removed', async (t) => {
  const portal = await openForm(t, { allowNewCats: true, cats: [existing] });
  const [mora] = portal.entries();
  const food = enter(portal.window, mora, 'foodBrand', 'Royal Canin');
  const variety = mora.querySelector('[name="foodDetail"]');
  assert.equal(variety.closest('.fields'), food.closest('.fields'));
  assert.equal(variety.closest('.other-fields'), null);
  assert.equal(variety.required, false);
  portal.add();
  const [, newCat] = portal.entries();
  const disclosure = newCat.closest('details') ?? newCat.querySelector('details');
  await setOpen(disclosure, false);
  const name = newCat.querySelector('[name="name"]');

  assert.equal(await portal.submit(), undefined);
  assert.equal(disclosure.open, true);
  assert.equal(portal.window.document.activeElement, name);
  assert.equal(name.getAttribute('aria-invalid'), 'true');
  assert.equal(food.value, 'Royal Canin');

  await setOpen(disclosure, false);
  const remove = [...newCat.querySelectorAll('button')].find((button) =>
    button.textContent.includes('Quitar este gato'),
  );
  assert.equal(remove.hidden, false);
  remove.click();
  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(
    cats.map((cat) => cat.fields),
    [{ foodBrand: 'Royal Canin' }],
  );
});

test('only an empty unsubmitted cat can be removed, even while open', async (t) => {
  const portal = await openForm(t, {
    allowNewCats: true,
    cats: [
      { ...existing, requestedFields: [] },
      { catId: null, revision: 1, draftId: 'submitted-cat', proposedFields: { name: 'Sol' } },
    ],
  });
  portal.add();
  const [mora, sol, newCat] = portal.entries();
  const removeButton = (card) =>
    [...card.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Quitar este gato'),
    );
  assert.equal(removeButton(mora), undefined);
  assert.equal(removeButton(sol), undefined);
  const remove = removeButton(newCat);
  assert.equal(newCat.querySelector('details').open, true);
  assert.equal(remove.hidden, false);

  enter(portal.window, newCat, 'color', 'Gris');
  assert.equal(remove.hidden, true);
  await setOpen(newCat.querySelector('details'), false);
  assert.equal(remove.hidden, true);

  await setOpen(newCat.querySelector('details'), true);
  enter(portal.window, newCat, 'color', '');
  assert.equal(remove.hidden, false);
  await setOpen(newCat.querySelector('details'), false);
  assert.equal(remove.hidden, false);
});

test('full registration requires its core fields and submits only the selected birth precision', async (t) => {
  const portal = await openForm(t, { allowNewCats: true, cats: [] });
  const [cat] = portal.entries();
  enter(portal.window, cat, 'name', 'Gala');
  enter(portal.window, cat, 'birthDate', '2021-05-07');
  enter(portal.window, cat, 'sex', 'FEMALE');
  assert.equal(await portal.submit(), undefined);
  assert.equal(portal.window.document.activeElement.name, 'breed');

  const onlyYear = [...cat.querySelectorAll('input[type="checkbox"]')].find((input) =>
    input.closest('label').textContent.includes('Solo sé el año'),
  );
  onlyYear.click();
  enter(portal.window, cat, 'birthYear', '123');
  assert.equal(await portal.submit(), undefined);
  assert.equal(portal.window.document.activeElement.name, 'birthYear');
  enter(portal.window, cat, 'birthYear', '2021');
  for (const [key, value] of Object.entries({
    breed: 'Sin raza definida',
    coat: 'Corto',
    color: 'Gris',
    personality: 'Tímida',
    foodBrand: 'Comida casera',
    careInstructions: 'Come de noche',
  })) {
    enter(portal.window, cat, key, value);
  }
  const litter = [...cat.querySelectorAll('select')].find((select) =>
    [...select.options].some((option) => option.value === 'shared'),
  );
  litter.value = 'shared';
  litter.dispatchEvent(new portal.window.Event('change', { bubbles: true }));
  assert.equal(await portal.submit(), undefined);
  assert.equal(portal.window.document.activeElement.name, 'foodDetail');
  enter(portal.window, cat, 'foodDetail', 'Pollo');

  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.equal(cats[0].fields.birthYear, '2021');
  assert.equal(cats[0].fields.birthDate, undefined);
  assert.equal(cats[0].fields.litterBrand, 'Usa las de CatWorld');
  assert.equal(cats[0].fields.careInstructions, 'Come de noche');
  assert.equal(cats[0].fields.foodBrand, 'Comida casera');
  assert.equal(cats[0].fields.foodDetail, 'Pollo');
});

test('editing an existing year-only birth can replace it with a precise date', async (t) => {
  const portal = await openForm(t, {
    allowNewCats: false,
    cats: [{ ...existing, fields: { name: 'Mora', birthYear: '2021' }, requestedFields: [] }],
  });
  const [cat] = portal.entries();
  const onlyYear = [...cat.querySelectorAll('input[type="checkbox"]')].find((input) =>
    input.closest('label').textContent.includes('Solo sé el año'),
  );
  assert.equal(onlyYear.checked, true);
  onlyYear.click();
  enter(portal.window, cat, 'birthDate', '2021-05-07');
  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(cats[0].fields, { birthDate: '2021-05-07' });
});

test('choosing personal litter answers the request without a brand and reopens as an empty description', async (t) => {
  const cat = { ...existing, requestedFields: ['litterBrand'] };
  const portal = await openForm(t, { allowNewCats: false, cats: [cat] });
  const [card] = portal.entries();
  const selectLitter = (entry) =>
    [...entry.querySelectorAll('select')].find((select) =>
      [...select.options].some((option) => option.value === 'own'),
    );
  const litter = selectLitter(card);
  litter.value = 'own';
  litter.dispatchEvent(new portal.window.Event('change', { bubbles: true }));

  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(cats[0].fields, { litterBrand: 'Trae sus propias piedritas' });

  const reopened = await openForm(t, {
    allowNewCats: false,
    cats: [{ ...cat, revision: 1, proposedFields: cats[0].fields }],
  });
  const [received] = reopened.entries();
  assert.equal(selectLitter(received).value, 'own');
  assert.equal(received.querySelector('[name="litterBrand"]').value, '');
});

test('reopening a partial submission shows both pending data and the submitted status', async (t) => {
  const portal = await openForm(t, {
    allowNewCats: true,
    cats: [
      { ...existing, revision: 1, proposedFields: { foodBrand: 'Royal Canin' } },
      { catId: 'complete-cat', fields: { name: 'Pepa' }, requestedFields: [] },
    ],
  });
  const [mora, pepa] = portal.entries();
  assert.match(mora.querySelector('summary').textContent, /Datos pendientes/);
  assert.match(mora.querySelector('summary').textContent, /Enviado a CatWorld/);
  assert.match(pepa.querySelector('summary').textContent, /Sin datos pendientes/);
  assert.equal(pepa.querySelector('details')?.open, false);
});

test('restoring the original data withdraws the proposal while requested fields are unanswered', async (t) => {
  const portal = await openForm(t, {
    allowNewCats: false,
    cats: [{ ...existing, revision: 1, proposedFields: { foodBrand: 'Royal Canin' } }],
  });
  const [cat] = portal.entries();
  enter(portal.window, cat, 'foodBrand', '');
  const post = await portal.submit();
  assert.ok(post, 'the portal should post the withdrawn proposal even with unanswered requests');
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(cats[0].fields, {});
  assert.match(
    portal.window.document.querySelector('#status').textContent,
    /Se retiraron los cambios/,
  );
});

test('partial and exact catalog matches require a choice even after leaving the field', async (t) => {
  const portal = await openForm(t, {
    allowNewCats: false,
    cats: [{ ...existing, requestedFields: ['breed', 'foodBrand'] }],
    catalogOptions: {
      breed: [{ id: 'breed-siamese', name: 'Siamés' }],
      foodBrand: [{ id: 'brand-royal', name: 'Royal Canin' }],
      coat: [{ id: 'coat-short', name: 'Corto' }],
    },
  });
  const [cat] = portal.entries();
  const breed = enter(portal.window, cat, 'breed', 'sia');
  breed.focus();
  breed.dispatchEvent(
    new portal.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
  );
  const option = portal.window.document.activeElement;
  assert.equal(option.textContent, 'Siamés');
  option.click();
  const brand = enter(portal.window, cat, 'foodBrand', 'R');
  brand.focus();
  breed.focus();
  assert.equal(portal.window.document.activeElement, breed);
  const suggestions = portal.window.document.getElementById(brand.getAttribute('aria-controls'));
  assert.equal(suggestions.hidden, false);
  assert.match(suggestions.textContent, /Royal Canin/);
  assert.equal(await portal.submit(), undefined);
  assert.equal(portal.window.document.activeElement, brand);

  enter(portal.window, cat, 'foodBrand', ' royal   canin  ');
  assert.equal(suggestions.hidden, false);
  assert.equal(await portal.submit(), undefined);
  suggestions.querySelector('button').click();
  assert.match(brand.closest('.catalog-field').textContent, /✓.*Seleccionado: Royal Canin/);
  enter(portal.window, cat, 'coat', 'Semilargo');
  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(cats[0].fields, {
    breed: 'Siamés',
    coat: 'Semilargo',
    foodBrand: 'Royal Canin',
  });
  assert.deepEqual(cats[0].optionIds, { breed: 'breed-siamese', foodBrand: 'brand-royal' });
});

test('variety is shown with its brand and selecting a different brand clears the old choice', async (t) => {
  const portal = await openForm(t, {
    allowNewCats: false,
    cats: [
      {
        ...existing,
        fields: { name: 'Mora', foodBrand: 'Royal Canin', foodDetail: 'Kitten' },
        requestedFields: [],
        optionIds: { foodBrand: 'brand-royal', foodDetail: 'royal-kitten' },
      },
    ],
    catalogOptions: {
      foodBrand: [
        { id: 'brand-royal', name: 'Royal Canin' },
        { id: 'brand-purina', name: 'Purina' },
      ],
    },
    foodVarieties: [
      { id: 'royal-kitten', brandId: 'brand-royal', name: 'Kitten' },
      { id: 'purina-kitten', brandId: 'brand-purina', name: 'Kitten' },
      { id: 'purina-adult', brandId: 'brand-purina', name: 'Adulto' },
    ],
  });
  const [cat] = portal.entries();
  const variety = cat.querySelector('[name="foodDetail"]');
  const brand = cat.querySelector('[name="foodBrand"]');
  await setOpen(cat.querySelector('details'), true);
  await setOpen(cat.querySelector('.other-fields'), true);
  assert.equal(variety.closest('.fields'), brand.closest('.fields'));
  assert.equal(variety.required, false);
  assert.match(variety.closest('.catalog-field').textContent, /✓.*Seleccionado: Kitten/);

  enter(portal.window, cat, 'foodBrand', 'R');
  brand.closest('.catalog-field').querySelector('.catalog-suggestions button').click();
  assert.equal(variety.value, 'Kitten');
  assert.match(variety.closest('.catalog-field').textContent, /✓.*Seleccionado: Kitten/);
  assert.equal(await portal.submit(), undefined);

  enter(portal.window, cat, 'foodBrand', 'Puri');
  brand.closest('.catalog-field').querySelector('.catalog-suggestions button').click();
  assert.equal(variety.value, '');
  assert.equal(variety.closest('.catalog-field').querySelector('.catalog-selection').hidden, true);
  enter(portal.window, cat, 'foodDetail', 'Kit');
  const choices = [
    ...variety.closest('.catalog-field').querySelectorAll('.catalog-suggestions button'),
  ];
  assert.deepEqual(
    choices.map((choice) => choice.textContent),
    ['Kitten'],
  );
  assert.equal(await portal.submit(), undefined);
  choices[0].click();
  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(cats[0].fields, { foodBrand: 'Purina', foodDetail: 'Kitten' });
  assert.deepEqual(cats[0].optionIds, { foodBrand: 'brand-purina', foodDetail: 'purina-kitten' });
});

test('an unrelated update preserves historical catalog text and diet', async (t) => {
  const portal = await openForm(t, {
    allowNewCats: false,
    cats: [
      {
        ...existing,
        fields: { name: 'Mora', foodBrand: 'Royal Canin', foodDetail: 'Dieta indicada' },
        requestedFields: [],
        revision: 1,
        proposedFields: { breed: 'R' },
      },
    ],
    catalogOptions: {
      foodBrand: [{ id: 'brand-royal', name: 'Royal Canin' }],
      breed: [{ id: 'breed-ragdoll', name: 'Ragdoll' }],
    },
    foodVarieties: [{ id: 'royal-kitten', brandId: 'brand-royal', name: 'Kitten' }],
  });
  const [cat] = portal.entries();
  assert.match(
    cat.querySelector('[name="foodBrand"]').closest('.catalog-field').textContent,
    /✓.*Seleccionado: Royal Canin/,
  );
  enter(portal.window, cat, 'personality', 'Tímida');
  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(cats[0].fields, { breed: 'R', personality: 'Tímida' });
  assert.equal(cats[0].optionIds, undefined);
});

test('catalog conflicts refresh choices in place and preserve the draft and attachments', async (t) => {
  let catalogChanged = false;
  const portal = await openForm(
    t,
    () => ({
      allowNewCats: false,
      cats: [{ ...existing, requestedFields: ['foodBrand'] }],
      catalogOptions: {
        foodBrand: catalogChanged ? [{ id: 'brand-royal', name: 'Royal Canin' }] : [],
        color: [{ id: 'color-gray', name: 'Gris' }],
      },
    }),
    {
      submit: () => {
        if (catalogChanged) return new Response(null, { status: 204 });
        catalogChanged = true;
        return Response.json(
          { code: 'CAT_INTAKE_CATALOG_CHANGED', field: 'foodBrand' },
          { status: 409 },
        );
      },
    },
  );
  const [cat] = portal.entries();
  await setOpen(cat.querySelector('.other-fields'), true);
  const color = enter(portal.window, cat, 'color', 'G');
  color.closest('.catalog-field').querySelector('.catalog-suggestions button').click();
  const brand = enter(portal.window, cat, 'foodBrand', 'Royal Canin');
  const fileInput = cat.querySelector('input[type="file"]');
  const file = new File(['photo'], 'vaccine.jpg', { type: 'image/jpeg' });
  Object.defineProperty(fileInput, 'files', { value: [file] });
  const initial = await portal.submit();
  assert.ok(initial);
  assert.equal(portal.entries()[0], cat);
  assert.equal(portal.window.document.activeElement, brand);
  assert.equal(brand.value, 'Royal Canin');
  assert.equal(fileInput.files[0], file);
  assert.match(color.closest('.catalog-field').textContent, /✓.*Seleccionado: Gris/);
  assert.equal(await portal.submit(), undefined);
  brand.closest('.catalog-field').querySelector('.catalog-suggestions button').click();
  const retry = await portal.submit();
  const { cats } = JSON.parse(await retry.body.get('submission').text());
  assert.deepEqual(cats[0].optionIds, { foodBrand: 'brand-royal', color: 'color-gray' });
  assert.equal(retry.body.get(cats[0].photoKeys[0]).name, 'vaccine.jpg');
});

test('selected HEIC falls back to an authenticated JPEG preview and clearing revokes its URLs', async (t) => {
  const revoked = [];
  let object = 0;
  const portal = await openForm(
    t,
    { allowNewCats: true, cats: [] },
    {
      response: () => new Response('preview', { headers: { 'Content-Type': 'image/jpeg' } }),
      urls: {
        createObjectURL: () => `blob:photo-${++object}`,
        revokeObjectURL: (url) => revoked.push(url),
      },
    },
  );
  const [cat] = portal.entries();
  const input = cat.querySelector('input[type="file"]');
  const file = new File(['photo'], 'dose.HEIC', { type: 'image/heic' });
  Object.defineProperty(input, 'files', {
    configurable: true,
    get: () => (input.value ? [file] : []),
  });
  Object.defineProperty(input, 'value', { configurable: true, writable: true, value: 'dose.HEIC' });
  input.dispatchEvent(new portal.window.Event('change', { bubbles: true }));
  assert.equal(cat.querySelector('.remove-cat').hidden, true);

  const disclosure = cat.querySelector('details');
  await setOpen(disclosure, false);
  assert.equal(cat.querySelector('.remove-cat').hidden, true);
  await setOpen(disclosure, true);

  const image = cat.querySelector('img');
  assert.equal(image.getAttribute('src'), 'blob:photo-1');
  image.dispatchEvent(new portal.window.Event('error'));
  await tick();
  const preview = portal.requests.find((request) => request.path === '/api/intake/photo-preview');
  assert.equal(preview.method, 'POST');
  assert.equal(preview.headers.Authorization, 'Bearer example');
  assert.equal(preview.body.get('photo').name, 'dose.HEIC');
  assert.equal(image.getAttribute('src'), 'blob:photo-2');

  const enlarge = image.closest('button');
  enlarge.focus();
  enlarge.click();
  const dialog = portal.window.document.querySelector('dialog[open]');
  assert.equal(dialog.querySelector('img').getAttribute('src'), 'blob:photo-2');
  assert.equal(portal.window.document.activeElement, dialog.querySelector('button'));
  dialog.dispatchEvent(new portal.window.Event('cancel', { cancelable: true }));
  assert.equal(dialog.open, false);
  assert.equal(dialog.querySelector('img').hasAttribute('src'), false);
  assert.equal(portal.window.document.activeElement, enlarge);
  assert.equal(
    portal.requests.some(({ path }) => path === '/api/intake/submissions'),
    false,
  );

  const clear = [...cat.querySelectorAll('button')].find((button) =>
    button.textContent.includes('Quitar fotos nuevas'),
  );
  clear.click();
  assert.equal(cat.querySelector('img'), null);
  assert.deepEqual(revoked, ['blob:photo-1', 'blob:photo-2']);
  await setOpen(disclosure, false);
  assert.equal(cat.querySelector('.remove-cat').hidden, false);
});

test('a pending cat can send five kept and new photos after correcting a six-photo selection', async (t) => {
  const portal = await openForm(
    t,
    {
      cats: [
        {
          ...existing,
          revision: 2,
          proposedFields: { foodBrand: 'Proposed food' },
          photos: [{ id: 'first' }, { id: 'second' }],
        },
      ],
    },
    { urls: { createObjectURL: () => 'blob:photo', revokeObjectURL: () => {} } },
  );
  const [cat] = portal.entries();
  const field = enter(portal.window, cat, 'foodBrand', 'Updated food');
  const input = cat.querySelector('input[type="file"]');
  const files = Array.from({ length: 4 }, (_, index) => new File(['photo'], `photo-${index}.jpg`));
  Object.defineProperty(input, 'files', { value: files });
  input.dispatchEvent(new portal.window.Event('change', { bubbles: true }));
  assert.equal(await portal.submit(), undefined);
  assert.match(cat.querySelector('[role="alert"]').textContent, /cinco fotos/);
  assert.equal(field.value, 'Updated food');
  assert.equal(input.files.length, 4);

  cat.querySelector('.keep-photo input').click();
  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(cats[0].retainedPhotoIds, ['second']);
  assert.equal(cats[0].photoKeys.length, 4);
});

test('a photo over 8 MiB leaves the selected file and draft available to correct', async (t) => {
  const portal = await openForm(t, { cats: [existing] });
  const [cat] = portal.entries();
  const field = enter(portal.window, cat, 'foodBrand', 'Updated food');
  const input = cat.querySelector('input[type="file"]');
  const file = new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'large.jpg');
  Object.defineProperty(input, 'files', { value: [file] });
  input.dispatchEvent(new portal.window.Event('change', { bubbles: true }));
  assert.equal(await portal.submit(), undefined);
  assert.match(cat.querySelector('[role="alert"]').textContent, /8 MiB/);
  assert.equal(field.value, 'Updated food');
  assert.equal(input.files[0], file);
});

test('new photos over 32 MiB leave the draft available to correct', async (t) => {
  const portal = await openForm(
    t,
    { cats: [existing] },
    { urls: { createObjectURL: () => 'blob:photo', revokeObjectURL: () => {} } },
  );
  const [cat] = portal.entries();
  const field = enter(portal.window, cat, 'foodBrand', 'Updated food');
  const input = cat.querySelector('input[type="file"]');
  const files = Array.from(
    { length: 5 },
    (_, index) => new File([new Uint8Array(7 * 1024 * 1024)], `photo-${index}.jpg`),
  );
  Object.defineProperty(input, 'files', { value: files });
  input.dispatchEvent(new portal.window.Event('change', { bubbles: true }));
  assert.equal(await portal.submit(), undefined);
  assert.match(portal.form.querySelector('#error').textContent, /32 MiB/);
  assert.equal(field.value, 'Updated food');
  assert.equal(input.files.length, 5);
});

test('retained JPEG enlarges in the form, restores focus and closes on departure', async (t) => {
  const revoked = [];
  const portal = await openForm(
    t,
    { cats: [{ ...existing, revision: 2, photos: [{ id: 'retained' }] }] },
    {
      retainedResponse: () =>
        new Response('preview', { headers: { 'Content-Type': 'image/jpeg' } }),
      urls: {
        createObjectURL: () => 'blob:retained',
        revokeObjectURL: (url) => revoked.push(url),
      },
    },
  );
  const [cat] = portal.entries();
  const enlarge = cat.querySelector('.retained-photos button');
  enlarge.focus();
  enlarge.click();
  const dialog = portal.window.document.querySelector('dialog[open]');
  assert.equal(dialog.querySelector('img').getAttribute('src'), 'blob:retained');
  const request = portal.requests.find(({ path }) => path === '/api/intake/photos/retained');
  assert.equal(request.headers.Authorization, 'Bearer example');
  dialog.querySelector('button').click();
  assert.equal(dialog.open, false);
  assert.equal(portal.window.document.activeElement, enlarge);

  enlarge.click();
  portal.window.dispatchEvent(new portal.window.PageTransitionEvent('pagehide'));
  assert.equal(dialog.open, false);
  assert.deepEqual(revoked, ['blob:retained']);
  assert.equal(
    portal.requests.some(({ path }) => path === '/api/intake/submissions'),
    false,
  );
});
