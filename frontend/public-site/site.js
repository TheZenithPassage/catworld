const galleryEndpoint = '/api/public-gallery';
const publicationId = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

export async function loadPublicSite(doc, request = fetch) {
  await Promise.all([loadGallery(doc, request), loadContact(doc, request)]);
}

async function loadContact(doc, request) {
  try {
    const config = await getJson(request, '/public-config.json');
    const phone = config.whatsappPhone;
    if (typeof phone !== 'string' || !/^\+[1-9]\d{7,14}$/.test(phone)) return;

    const link = new URL('https://wa.me/' + phone.slice(1));
    link.searchParams.set('text', 'Hola, quisiera conocer más sobre CatWorld.');
    for (const button of doc.querySelectorAll('[data-whatsapp]')) {
      button.href = link.href;
      button.hidden = false;
    }
    doc.querySelector('[data-contact-section]').hidden = false;
  } catch {
    // Contact is optional until the business number is configured.
  }
}

async function loadGallery(doc, request) {
  const status = doc.querySelector('[data-gallery-status]');
  try {
    const entries = await getJson(request, galleryEndpoint);
    if (!Array.isArray(entries)) throw new Error('Invalid catalogue');

    for (const section of doc.querySelectorAll('[data-gallery-group]')) {
      const cards = entries
        .filter((entry) => validEntry(entry, section.dataset.galleryGroup))
        .map((entry) => galleryCard(doc, entry));
      section.querySelector('[data-gallery-items]').replaceChildren(...cards);
      section.hidden = cards.length === 0;
    }
    status.hidden = [...doc.querySelectorAll('[data-gallery-group]')].some(
      (group) => !group.hidden,
    );
    if (!status.hidden) status.textContent = 'Las fotos de la galería se irán publicando acá.';
  } catch {
    status.textContent = 'La galería no está disponible en este momento.';
  }
}

function validEntry(entry, group) {
  return (
    entry?.kind === group &&
    typeof entry.id === 'string' &&
    publicationId.test(entry.id) &&
    typeof entry.name === 'string' &&
    entry.name.trim().length > 0
  );
}

function galleryCard(doc, entry) {
  const card = doc.createElement('article');
  const image = doc.createElement('img');
  image.src = galleryEndpoint + '/' + entry.id + '/photo';
  image.alt = entry.name;
  image.loading = 'lazy';
  image.decoding = 'async';
  if (
    Number.isInteger(entry.width) &&
    Number.isInteger(entry.height) &&
    entry.width > 0 &&
    entry.height > 0
  ) {
    image.width = entry.width;
    image.height = entry.height;
  }

  const copy = doc.createElement('div');
  copy.className = 'gallery-card-copy';
  const heading = doc.createElement('h4');
  heading.textContent = entry.name;
  copy.append(heading);
  if (typeof entry.description === 'string' && entry.description.trim()) {
    const description = doc.createElement('p');
    description.textContent = entry.description;
    copy.append(description);
  }
  card.append(image, copy);
  return card;
}

async function getJson(request, path) {
  const response = await request(path, { credentials: 'omit', cache: 'no-store' });
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}

if (typeof document !== 'undefined') void loadPublicSite(document);
