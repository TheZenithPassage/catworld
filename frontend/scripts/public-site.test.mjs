import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { loadPublicSite } from '../public-site/site.js';

const resident = {
  id: 'ec37bd49-f30c-4eb8-a1ac-96a4bb484d0b',
  name: 'Nube',
  description: '<img src="https://example.invalid/image">',
  kind: 'RESIDENT',
  width: 12,
  height: 8,
};
const guest = {
  ...resident,
  id: '45296760-2b08-4435-a27f-9dc0afca9012',
  name: 'Sol',
  kind: 'GUEST',
};

function page() {
  const html = readFileSync(new URL('../public-site/index.html', import.meta.url), 'utf8');
  return new JSDOM(html, { url: 'https://example.test' }).window.document;
}

function responses(catalogue, whatsappPhone) {
  return async (path) => {
    assert.ok(['/api/public-gallery', '/public-config.json'].includes(path));
    return {
      ok: true,
      json: async () => (path === '/api/public-gallery' ? catalogue : { whatsappPhone }),
    };
  };
}

test('uses the published catalogue and renders supplied names and descriptions as text', async () => {
  const document = page();
  await loadPublicSite(document, responses([resident, guest], ''));
  const residentCard = document.querySelector('[data-gallery-group="RESIDENT"] article');
  assert.ok(residentCard);
  assert.equal(residentCard.querySelector('h4').textContent, 'Nube');
  assert.equal(residentCard.querySelector('p').textContent, resident.description);
  assert.equal(residentCard.querySelectorAll('img').length, 1);
  assert.equal(
    residentCard.querySelector('img').getAttribute('src'),
    '/api/public-gallery/' + resident.id + '/photo',
  );
  assert.equal(
    document.querySelector('[data-gallery-group="GUEST"] article h4').textContent,
    'Sol',
  );
});

test('only shows WhatsApp for a configured international phone and opens a general inquiry', async () => {
  const document = page();
  await loadPublicSite(document, responses([], '+5491100000000'));
  for (const link of document.querySelectorAll('[data-whatsapp]')) {
    assert.equal(link.hidden, false);
    const url = new URL(link.href);
    assert.equal(url.origin, 'https://wa.me');
    assert.equal(url.pathname, '/5491100000000');
    assert.equal(url.searchParams.get('text'), 'Hola, quisiera conocer más sobre CatWorld.');
  }
  assert.equal(document.querySelectorAll('[data-gallery-group] article').length, 0);

  const invalidDocument = page();
  await loadPublicSite(invalidDocument, responses([], 'https://example.invalid'));
  assert.ok([...invalidDocument.querySelectorAll('[data-whatsapp]')].every((link) => link.hidden));
});
