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
  // jsdom exposes the dialog element without its native modal methods.
  window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
    this.querySelector('[autofocus]')?.focus();
  };
  window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  window.Blob = Blob;
  window.FormData = FormData;
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
  Object.assign(window.URL, {
    createObjectURL: () => 'blob:evidence',
    revokeObjectURL: () => {},
    ...previewOptions.urls,
  });
  window.eval(script);
  await tick();
  const form = window.document.querySelector('#intake');
  return {
    window,
    form,
    requests,
    confirmPartial: async () => {
      const before = requests.length;
      window.document.querySelector('#send-partial').click();
      await tick();
      return requests.slice(before).find(({ path }) => path === '/api/intake/submissions');
    },
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

function chooseFiles(window, input, files) {
  Object.defineProperty(input, 'files', { configurable: true, value: files });
  input.dispatchEvent(new window.Event('change', { bubbles: true }));
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
  assert.equal(await portal.submit(), undefined);
  const post = await portal.confirmPartial();
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
  const portal = await openForm(t, { allowNewCats: true, vaccineDateRange: { min: "2025-11-22", max: "2026-11-22" }, cats: [] });
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
  assert.equal(cat.querySelector('[name="birthYear"]').value, '123');
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
  const date = '2026-01-15';
  for (const key of ['lastRabiesDate', 'lastTripleFelineDate']) enter(portal.window, cat, key, date);
  const portrait = cat.querySelector('[name="profilePhoto"]');
  const evidence = cat.querySelector('input[type="file"][multiple]');
  chooseFiles(portal.window, portrait, [new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' })]);
  chooseFiles(portal.window, evidence, [new File(['evidence'], 'proof.jpg', { type: 'image/jpeg' })]);

  assert.equal(await portal.submit(), undefined);
  const post = await portal.confirmPartial();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.equal(cats[0].fields.birthYear, '2021');
  assert.equal(cats[0].fields.birthDate, undefined);
  assert.equal(cats[0].fields.litterBrand, 'Usa las de CatWorld');
  assert.equal(cats[0].fields.careInstructions, 'Come de noche');
  assert.equal(cats[0].fields.foodBrand, 'Comida casera');
  assert.equal(cats[0].fields.foodDetail, 'Pollo');
  assert.equal(cats[0].fields.lastRabiesDate, date);
  assert.equal(cats[0].fields.lastTripleFelineDate, date);
  assert.equal(post.body.get(cats[0].portraitKey).name, 'portrait.jpg');
  assert.equal(cats[0].photoKeys.length, 1);

});

test('a legacy coat stays on an existing profile and color stays free text', async (t) => {
  const portal = await openForm(t, {
    cats: [{ ...existing, fields: { name: 'Mora', coat: 'Semilargo' }, requestedFields: [] }],
    catalogOptions: {
      coat: [{ id: 'coat-legacy', name: 'Semilargo' }],
      color: [{ id: 'color-gray', name: 'Gris' }],
    },
  });
  const [cat] = portal.entries();
  cat.querySelector('details').open = true;
  cat.querySelector('details.other-fields').open = true;
  const coat = cat.querySelector('[name="coat"]');
  assert.equal(coat.tagName, 'SELECT');
  assert.deepEqual(
    [...coat.options].map(({ value }) => value),
    ['', 'Corto', 'Largo', 'Sin pelo', 'Semilargo'],
  );
  assert.equal(coat.value, 'Semilargo');
  const color = enter(portal.window, cat, 'color', 'Gris');
  assert.equal(color.closest('.catalog-field'), null);
  const submission = await portal.submit();
  const { cats } = JSON.parse(await submission.body.get('submission').text());
  assert.deepEqual(cats[0].fields, { color: 'Gris' });
  assert.equal(cats[0].optionIds, undefined);
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

test('shows the litter reference only for shared use and keeps an optional own-litter description', async (t) => {
  const cat = { ...existing, requestedFields: ['litterBrand'] };
  const portal = await openForm(t, {
    allowNewCats: false,
    cats: [cat],
    litterRatePerKg: '9876543210987654321',
  });
  const [card] = portal.entries();
  const selectLitter = (entry) =>
    [...entry.querySelectorAll('select')].find((select) =>
      [...select.options].some((option) => option.value === 'own'),
    );
  const litter = selectLitter(card);
  litter.value = 'shared';
  litter.dispatchEvent(new portal.window.Event('change', { bubbles: true }));
  const hint = portal.window.document.getElementById(litter.getAttribute('aria-describedby'));
  assert.equal(hint.hidden, false);
  assert.equal(
    hint.textContent,
    'El consumo habitual es de ½ kg por gato por día. La tarifa actual es de 9.876.543.210.987.654.321 pesos por kg.',
  );

  litter.value = 'own';
  litter.dispatchEvent(new portal.window.Event('change', { bubbles: true }));
  assert.equal(hint.hidden, true);
  assert.equal(litter.hasAttribute('aria-describedby'), false);

  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(cats[0].fields, { litterBrand: 'Trae sus propias piedritas' });

  const reopened = await openForm(t, {
    allowNewCats: false,
    cats: [{ ...cat, revision: 1, proposedFields: cats[0].fields }],
  });
  const [received] = reopened.entries();
  const reopenedLitter = selectLitter(received);
  assert.equal(reopenedLitter.value, 'own');
  assert.equal(received.querySelector('[name="litterBrand"]').value, '');
  reopenedLitter.value = 'shared';
  reopenedLitter.dispatchEvent(new reopened.window.Event('change', { bubbles: true }));
  const unavailableHint = reopened.window.document.getElementById(
    reopenedLitter.getAttribute('aria-describedby'),
  );
  assert.equal(
    unavailableHint.textContent,
    'El consumo habitual es de ½ kg por gato por día. La tarifa todavía no está disponible.',
  );
});

test('own litter submits the selected catalog ID and shared litter ignores the detail', async (t) => {
  const ownType = 'Usa las de CatWorld';
  const invitation = {
    allowNewCats: false,
    cats: [{ ...existing, requestedFields: ['litterBrand'] }],
    catalogOptions: { litterDetail: [{ id: 'personal', name: ownType }] },
  };
  const portal = await openForm(t, invitation);
  const [card] = portal.entries();
  function choose(portal, card, value) {
    const choice = [...card.querySelectorAll('select')].find((select) =>
      [...select.options].some((option) => option.value === 'own'),
    );
    choice.value = value;
    choice.dispatchEvent(new portal.window.Event('change', { bubbles: true }));
  }
  choose(portal, card, 'own');
  const partialDetail = enter(portal.window, card, 'litterBrand', 'las de Cat');
  assert.equal(await portal.submit(), undefined);
  assert.equal(portal.window.document.activeElement, partialDetail);
  const detail = enter(portal.window, card, 'litterBrand', ownType);
  assert.equal(await portal.submit(), undefined);
  detail.closest('.catalog-field').querySelector('.catalog-suggestions button').click();
  let post = await portal.submit();
  let [cat] = JSON.parse(await post.body.get('submission').text()).cats;
  assert.deepEqual(cat.fields, {
    litterBrand: 'Trae sus propias piedritas',
    litterDetail: ownType,
  });
  assert.deepEqual(cat.optionIds, { litterDetail: 'personal' });

  const next = await openForm(t, {
    ...invitation,
    cats: [
      { ...invitation.cats[0], revision: 1, proposedFields: cat.fields, optionIds: cat.optionIds },
    ],
  });
  const [reopened] = next.entries();
  assert.equal(
    reopened.querySelector('.catalog-input--selected[name="litterBrand"]').value,
    ownType,
  );
  choose(next, reopened, 'shared');
  post = await next.submit();
  [cat] = JSON.parse(await post.body.get('submission').text()).cats;
  assert.deepEqual(cat.fields, { litterBrand: 'Usa las de CatWorld' });
  assert.equal(cat.optionIds, undefined);
});

test('each own-litter input has its own plain label and keeps new descriptions in the draft', async (t) => {
  const ownLitter = 'Trae sus propias piedritas';
  const invitation = {
    allowNewCats: false,
    cats: [
      { ...existing, requestedFields: ['litterBrand'] },
      {
        ...existing,
        catId: 'second-cat',
        fields: { name: 'Sol', litterBrand: ownLitter, litterDetail: 'Arcilla' },
        requestedFields: [],
      },
    ],
    catalogOptions: { litterDetail: [{ id: 'pine', name: 'Pino' }] },
  };
  const portal = await openForm(t, invitation);
  const [mora, sol] = portal.entries();
  const choice = mora.querySelector('select');
  choice.value = 'own';
  choice.dispatchEvent(new portal.window.Event('change', { bubbles: true }));
  const detail = enter(portal.window, mora, 'litterBrand', 'Sílice');
  const solDetail = sol.querySelector('[name="litterBrand"]');

  for (const input of [detail, solDetail]) {
    assert.equal(input.labels.length, 1);
    assert.equal(input.labels[0].textContent, 'Marca o tipo de piedritas');
    assert.equal(input.labels[0].htmlFor, input.id);
    assert.equal(input.hasAttribute('aria-describedby'), false);
  }
  assert.notEqual(detail.id, solDetail.id);

  const post = await portal.submit();
  const [cat] = JSON.parse(await post.body.get('submission').text()).cats;
  assert.deepEqual(cat.fields, { litterBrand: 'Sílice', litterDetail: 'Sílice' });
  assert.equal(cat.optionIds, undefined);

  const reopened = await openForm(t, {
    ...invitation,
    cats: [{ ...invitation.cats[0], revision: 1, proposedFields: cat.fields }, invitation.cats[1]],
  });
  const [draft] = reopened.entries();
  assert.equal(draft.querySelector('[name="litterBrand"]').value, 'Sílice');
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

test('confirms an incomplete household draft and returns to the first unanswered field', async (t) => {
  const portal = await openForm(
    t,
    {
      allowNewCats: false,
      vaccineDateRange: { min: '2025-11-21', max: '2026-11-21' },
      cats: [
        {
          ...existing,
          fields: { name: 'Mora', lastRabiesDate: '2020-01-01' },
          requestedFields: ['foodBrand', 'lastRabiesDate'],
          proposedFields: { foodBrand: 'Royal Canin' },
          revision: 1,
        },
        {
          catId: 'second',
          fields: { name: 'Pipa', foodBrand: 'Purina' },
          requestedFields: ['foodDetail'],
        },
      ],
    },
    {
      urls: { createObjectURL: () => 'blob:local-evidence', revokeObjectURL: () => {} },
    },
  );
  const { window, requests } = portal;
  const [mora, pipa] = portal.entries();
  enter(window, mora, 'careInstructions', 'Come por la noche');
  const fileInput = mora.querySelector('input[type="file"]:not([name="profilePhoto"])');
  const file = new File(['evidence'], 'dose.jpg', { type: 'image/jpeg' });
  chooseFiles(window, fileInput, [file]);
  mora.querySelector('details').open = false;

  assert.equal(await portal.submit(), undefined);
  const dialog = window.document.querySelector('dialog[open]');
  const cats = [...dialog.querySelectorAll('#partial-cats > li')].map((item) => item.textContent);
  assert.equal(cats.length, 2);
  assert.match(cats[0], /Mora.*antirrábica/);
  assert.match(cats[1], /Pipa.*Variedad del alimento/);
  assert.doesNotMatch(dialog.textContent, /Marca de comida/);
  assert.equal(window.document.activeElement.id, 'complete-partial');

  window.document.querySelector('#complete-partial').click();
  assert.equal(dialog.open, false);
  assert.equal(mora.querySelector('details').open, true);
  assert.equal(window.document.activeElement.name, 'lastRabiesDate');
  assert.equal(mora.querySelector('[name="careInstructions"]').value, 'Come por la noche');
  assert.equal(mora.querySelector('img').getAttribute('src'), 'blob:local-evidence');

  enter(window, pipa, 'foodDetail', 'Pollo');
  assert.equal(await portal.submit(), undefined);
  assert.doesNotMatch(dialog.textContent, /Pipa/);
  const confirm = window.document.querySelector('#send-partial');
  confirm.click();
  confirm.click();
  await tick();
  const posts = requests.filter(({ path }) => path === '/api/intake/submissions');
  assert.equal(posts.length, 1);
  const { cats: submitted } = JSON.parse(await posts[0].body.get('submission').text());
  assert.deepEqual(submitted[0].fields, {
    foodBrand: 'Royal Canin',
    careInstructions: 'Come por la noche',
  });
  assert.equal(posts[0].body.get('photo-0-0').name, 'dose.jpg');
  assert.deepEqual(submitted[1].fields, { foodDetail: 'Pollo' });
});

test('keeps evidence validation and unchanged submissions ahead of partial confirmation', async (t) => {
  const portal = await openForm(t, {
    allowNewCats: false,
    vaccineDateRange: { min: '2025-11-21', max: '2026-11-21' },
    cats: [{ ...existing, requestedFields: ['foodBrand', 'lastRabiesDate'] }],
  });
  const { window } = portal;
  const [card] = portal.entries();
  const dialog = window.document.querySelector('#partial-submission');
  const date = enter(window, card, 'lastRabiesDate', '2025-11-21');
  assert.equal(await portal.submit(), undefined);
  assert.equal(dialog.open, false);
  assert.equal(window.document.activeElement.type, 'file');
  assert.match(window.document.querySelector('#field-error').textContent, /Adjuntá/);

  enter(window, card, date.name, '');
  assert.equal(await portal.submit(), undefined);
  assert.equal(dialog.open, false);
  assert.match(window.document.querySelector('#error').textContent, /No hay datos nuevos/);
});

test('refreshes vaccine bounds on submission and keeps a rejected draft and evidence', async (t) => {
  let vaccineDateRange = { min: '2025-11-21', max: '2026-11-21' };
  const portal = await openForm(
    t,
    () => ({
      vaccineDateRange,
      cats: [{ ...existing, requestedFields: ['lastRabiesDate'] }],
    }),
    { urls: { createObjectURL: () => 'blob:vaccine-proof', revokeObjectURL: () => {} } },
  );
  const { window } = portal;
  const [card] = portal.entries();
  const dose = enter(window, card, 'lastRabiesDate', '2025-11-21');
  assert.equal(dose.min, '2025-11-21');
  assert.equal(dose.max, '2026-11-21');
  enter(window, card, 'careInstructions', 'Come de noche');
  const fileInput = card.querySelector('input[type="file"]:not([name="profilePhoto"])');
  const file = new File(['evidence'], 'dose.jpg', { type: 'image/jpeg' });
  Object.defineProperty(fileInput, 'files', { value: [file] });
  fileInput.dispatchEvent(new window.Event('change', { bubbles: true }));

  vaccineDateRange = { min: '2025-11-22', max: '2026-11-22' };
  assert.equal(await portal.submit(), undefined);
  assert.equal(window.document.activeElement, dose);
  assert.match(window.document.querySelector('#field-error').textContent, /22\/11\/2025/);
  assert.equal(dose.min, '2025-11-22');
  assert.equal(dose.value, '2025-11-21');
  assert.equal(card.querySelector('[name="careInstructions"]').value, 'Come de noche');
  assert.equal(fileInput.files[0], file);

  enter(window, card, 'lastRabiesDate', '2026-11-22');
  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.equal(cats[0].fields.lastRabiesDate, '2026-11-22');
  assert.equal(post.body.get('photo-0-0').name, 'dose.jpg');
});

test('marks proposal edits and retained photo changes until they are undone', async (t) => {
  const portal = await openForm(t, {
    allowNewCats: false,
    cats: [
      {
        ...existing,
        revision: 1,
        proposedFields: { foodBrand: 'Royal Canin' },
        photos: [{ id: 'proof' }],
      },
    ],
  });
  const [card] = portal.entries();
  const summary = card.querySelector('summary');
  const assertDirty = () => {
    assert.match(summary.textContent, /Cambios sin enviar/);
    assert.doesNotMatch(summary.textContent, /Enviado a CatWorld/);
  };
  const assertReceived = () => {
    assert.match(summary.textContent, /Enviado a CatWorld/);
    assert.doesNotMatch(summary.textContent, /Cambios sin enviar/);
  };
  assertReceived();
  enter(portal.window, card, 'foodBrand', '');
  assertDirty();
  enter(portal.window, card, 'foodBrand', 'Royal Canin');
  assertReceived();
  card.querySelector('button[aria-label="Quitar comprobante 1"]').click();
  assertDirty();
  const restore = card.querySelector('.retained-photos button');
  assert.equal(restore.textContent, 'Restaurar comprobante 1');
  restore.click();
  assertReceived();
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
  assert.ok(brand.classList.contains('catalog-input--selected'));
  assert.equal(
    brand.closest('.catalog-field').querySelector('.sr-only[role="status"]').textContent,
    'Seleccionado: Royal Canin',
  );
  assert.ok(
    brand.closest('.catalog-field').querySelector('button[aria-label="Limpiar Marca de comida"]'),
  );
  enter(portal.window, cat, 'coat', 'Sin pelo');
  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(cats[0].fields, {
    breed: 'Siamés',
    coat: 'Sin pelo',
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
  assert.ok(variety.classList.contains('catalog-input--selected'));

  enter(portal.window, cat, 'foodBrand', 'R');
  brand.closest('.catalog-field').querySelector('.catalog-suggestions button').click();
  assert.equal(variety.value, 'Kitten');
  assert.ok(variety.classList.contains('catalog-input--selected'));
  assert.equal(await portal.submit(), undefined);

  enter(portal.window, cat, 'foodBrand', 'Puri');
  brand.closest('.catalog-field').querySelector('.catalog-suggestions button').click();
  assert.equal(variety.value, '');
  assert.ok(!variety.classList.contains('catalog-input--selected'));
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
  assert.doesNotMatch(
    cat.querySelector('[name="foodBrand"]').closest('.catalog-field').textContent,
    /Seleccionado: Royal Canin/,
  );
  const brand = cat.querySelector('[name="foodBrand"]');
  const variety = cat.querySelector('[name="foodDetail"]');
  await setOpen(cat.querySelector('details'), true);
  await setOpen(cat.querySelector('.other-fields'), true);
  assert.ok(!brand.classList.contains('catalog-input--selected'));
  assert.equal(variety.value, 'Dieta indicada');
  enter(portal.window, cat, 'foodDetail', '').focus();
  assert.equal(variety.getAttribute('placeholder'), 'Por ejemplo, Kitten o Senior.');
  assert.equal(
    variety.closest('.catalog-field').querySelector('.catalog-suggestions').hidden,
    true,
  );
  enter(portal.window, cat, 'personality', 'Tímida');
  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(cats[0].fields, { breed: 'R', personality: 'Tímida' });
  assert.equal(cats[0].optionIds, undefined);
});

test('retains the saved selection of a renamed option that is no longer offered', async (t) => {
  const portal = await openForm(t, {
    allowNewCats: false,
    cats: [
      {
        ...existing,
        fields: { name: 'Mora' },
        requestedFields: [],
        revision: 1,
        proposedFields: { breed: 'Original breed' },
        optionIds: { breed: 'hidden-breed' },
      },
    ],
    catalogOptions: { breed: [] },
  });
  const [cat] = portal.entries();
  assert.match(
    cat.querySelector('[name="breed"]').closest('.catalog-field').textContent,
    /Seleccionado: Original breed/,
  );
  enter(portal.window, cat, 'personality', 'Tímida');
  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(cats[0].fields, { breed: 'Original breed', personality: 'Tímida' });
  assert.deepEqual(cats[0].optionIds, { breed: 'hidden-breed' });
});

for (const partial of [false, true]) {
  test(
    'catalog conflicts preserve the draft and attachments' +
      (partial ? ' after partial confirmation' : ''),
    async (t) => {
      let catalogChanged = false;
      const portal = await openForm(
        t,
        () => ({
          allowNewCats: false,
          cats: [
            {
              ...existing,
              requestedFields: partial ? ['foodBrand', 'litterBrand'] : ['foodBrand'],
            },
          ],
          catalogOptions: {
            foodBrand: catalogChanged ? [{ id: 'brand-royal', name: 'Royal Canin' }] : [],
            breed: [{ id: 'breed-persian', name: 'Persa' }],
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
      const breed = enter(portal.window, cat, 'breed', 'Per');
      breed.closest('.catalog-field').querySelector('.catalog-suggestions button').click();
      const brand = enter(portal.window, cat, 'foodBrand', 'Royal Canin');
      const fileInput = cat.querySelector('input[type="file"]:not([name="profilePhoto"])');
      const file = new File(['photo'], 'vaccine.jpg', { type: 'image/jpeg' });
      chooseFiles(portal.window, fileInput, [file]);
      const submitDraft = async () => {
        const request = await portal.submit();
        if (!partial) return request;
        assert.equal(request, undefined);
        return portal.confirmPartial();
      };
      const initial = await submitDraft();
      assert.ok(initial);
      assert.equal(portal.entries()[0], cat);
      assert.equal(portal.window.document.activeElement, brand);
      assert.equal(brand.value, 'Royal Canin');
      assert.equal(cat.querySelector('.selected-photos .hint').textContent, file.name);
      assert.ok(breed.classList.contains('catalog-input--selected'));
      assert.equal(await portal.submit(), undefined);
      brand.closest('.catalog-field').querySelector('.catalog-suggestions button').click();
      const retry = await submitDraft();
      const { cats } = JSON.parse(await retry.body.get('submission').text());
      assert.deepEqual(cats[0].optionIds, { foodBrand: 'brand-royal', breed: 'breed-persian' });
      assert.equal(retry.body.get(cats[0].photoKeys[0]).name, 'vaccine.jpg');
    },
  );
}

test('a partial confirmation closes on expiry and discards its pending submission', async (t) => {
  const portal = await openForm(t, {
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    cats: [existing],
  });
  const { window } = portal;
  let expire;
  window.setTimeout = (callback) => {
    expire = callback;
    return 0;
  };
  enter(window, portal.entries()[0], 'foodBrand', 'Proposed food');
  assert.equal(await portal.submit(), undefined);
  assert.ok(window.document.querySelector('#partial-submission').open);
  expire();
  assert.equal(window.document.querySelector('dialog[open]'), null);
  assert.ok(portal.form.hidden);
  assert.equal(window.document.activeElement.id, 'status');
  assert.equal(await portal.confirmPartial(), undefined);
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
  const input = cat.querySelector('input[type="file"]:not([name="profilePhoto"])');
  const file = new File(['photo'], 'dose.HEIC', { type: 'image/heic' });
  chooseFiles(portal.window, input, [file]);
  assert.equal(cat.querySelector('.remove-cat').hidden, true);

  const disclosure = cat.querySelector('details');
  await setOpen(disclosure, false);
  assert.equal(cat.querySelector('.remove-cat').hidden, true);
  await setOpen(disclosure, true);

  const image = cat.querySelector('.selected-photos img');
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

  cat.querySelector('button[aria-label="Quitar foto dose.HEIC"]').click();
  assert.equal(cat.querySelector('.selected-photos img'), null);
  assert.deepEqual(revoked, ['blob:photo-1', 'blob:photo-2']);
  await setOpen(disclosure, false);
  assert.equal(cat.querySelector('.remove-cat').hidden, false);
});

test('adds photos across chooser sessions and rejects a sixth without losing earlier photos', async (t) => {
  const portal = await openForm(t, {
    cats: [
      {
        ...existing,
        requestedFields: [],
        revision: 2,
        proposedFields: { foodBrand: 'Proposed food' },
        photos: [{ id: 'first' }, { id: 'second' }],
      },
    ],
  });
  const [cat] = portal.entries();
  const input = cat.querySelector('input[type="file"]:not([name="profilePhoto"])');
  const files = Array.from(
    { length: 4 },
    (_, index) => new File(['photo'], 'photo-' + index + '.jpg'),
  );
  const names = () =>
    [...cat.querySelectorAll('.selected-photos .hint')].map((el) => el.textContent);
  const attachmentCount = () => cat.querySelector('.file-picker-status').textContent;

  assert.equal(cat.querySelector('.file-picker-button').textContent, 'Elegir archivos');
  assert.equal(attachmentCount(), '2 archivos adjuntos');
  chooseFiles(portal.window, input, files.slice(0, 2));
  assert.equal(attachmentCount(), '4 archivos adjuntos');
  input.dispatchEvent(new portal.window.Event('cancel', { bubbles: true }));
  assert.equal(attachmentCount(), '4 archivos adjuntos');
  chooseFiles(portal.window, input, files.slice(2, 3));
  chooseFiles(portal.window, input, files.slice(3));
  assert.match(cat.querySelector('[role="alert"]').textContent, /cinco fotos/);
  assert.deepEqual(names(), ['photo-0.jpg', 'photo-1.jpg', 'photo-2.jpg']);
  assert.equal(attachmentCount(), '5 archivos adjuntos');

  cat.querySelector('button[aria-label="Quitar comprobante 1"]').click();
  assert.equal(attachmentCount(), '4 archivos adjuntos');
  chooseFiles(portal.window, input, files.slice(3));
  assert.deepEqual(
    names(),
    files.map(({ name }) => name),
  );
  cat.querySelector('button[aria-label="Quitar foto photo-1.jpg"]').click();
  assert.equal(attachmentCount(), '4 archivos adjuntos');
  assert.equal(portal.window.document.activeElement, input);
  assert.equal(portal.requests.filter(({ path }) => path === '/api/intake/submissions').length, 0);

  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(cats[0].retainedPhotoIds, ['second']);
  assert.deepEqual(
    cats[0].photoKeys.map((key) => post.body.get(key).name),
    ['photo-0.jpg', 'photo-2.jpg', 'photo-3.jpg'],
  );
});

test('rejects a photo over 8 MiB and keeps the valid draft', async (t) => {
  const portal = await openForm(t, { cats: [{ ...existing, requestedFields: [] }] });
  const [cat] = portal.entries();
  const field = enter(portal.window, cat, 'foodBrand', 'Updated food');
  const input = cat.querySelector('input[type="file"]:not([name="profilePhoto"])');
  const large = new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'large.jpg');
  chooseFiles(portal.window, input, [new File(['photo'], 'first.jpg')]);
  chooseFiles(portal.window, input, [large]);
  assert.match(cat.querySelector('[role="alert"]').textContent, /8 MiB/);
  assert.equal(field.value, 'Updated food');
  const post = await portal.submit();
  assert.equal(post.body.get('photo-0-0').name, 'first.jpg');
  assert.equal(post.body.has('photo-0-1'), false);
});

test('rejects more than 32 MiB in new photos across the household and preserves the prior selection', async (t) => {
  const portal = await openForm(t, {
    cats: [
      { ...existing, requestedFields: [] },
      { ...existing, catId: 'second-cat', requestedFields: [] },
    ],
  });
  const [first, second] = portal.entries();
  const input = (cat) => cat.querySelector('input[type="file"]:not([name="profilePhoto"])');
  const files = Array.from(
    { length: 5 },
    (_, index) => new File([new Uint8Array(8 * 1024 * 1024)], 'photo-' + index + '.jpg'),
  );
  chooseFiles(portal.window, input(first), files.slice(0, 3));
  chooseFiles(portal.window, input(second), files.slice(3, 4));
  chooseFiles(portal.window, input(second), files.slice(4));
  assert.match(second.querySelector('[role="alert"]').textContent, /32 MiB/);
  assert.equal(second.querySelector('.selected-photos .hint').textContent, files[3].name);
  const post = await portal.submit();
  const { cats } = JSON.parse(await post.body.get('submission').text());
  assert.deepEqual(
    cats.map(({ photoKeys }) => photoKeys.length),
    [3, 1],
  );
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
