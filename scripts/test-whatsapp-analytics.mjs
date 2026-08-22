import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function createLink(href, textContent = '') {
  return {
    href,
    textContent,
    attributes: { href },
    getAttribute(name) {
      return this[name] ?? this.attributes[name] ?? null;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    insertAdjacentElement(_position, element) {
      this.insertedElement = element;
    }
  };
}

function createCard() {
  const phoneLink = createLink('tel:+966553846446', '+966 55 384 6446');
  return {
    phoneLink,
    querySelector(selector) {
      if (selector === 'a[href*="wa.me/"]') return this.whatsappLink || null;
      if (selector === 'a[href="tel:+966553846446"]') return phoneLink;
      return null;
    }
  };
}

const listeners = {};
const cards = [createCard(), createCard(), createCard()];
const document = {
  addEventListener(name, handler) {
    listeners[name] = handler;
  },
  querySelectorAll(selector) {
    assert.equal(selector, '.contact-grid .contact-card');
    return cards;
  },
  createElement(tagName) {
    assert.equal(tagName, 'a');
    return createLink('');
  }
};
const window = {
  dataLayer: [],
  location: { href: 'https://www.a2b.sa/' }
};

vm.runInNewContext(fs.readFileSync('assets/js/analytics.js', 'utf8'), {
  document,
  window,
  Array,
  encodeURIComponent
});

listeners.DOMContentLoaded();

for (const card of cards.slice(0, 2)) {
  const link = card.phoneLink.insertedElement;
  assert.ok(link, 'WhatsApp link should follow the phone link');
  assert.equal(link.target, '_blank');
  assert.equal(link.rel, 'noopener');
  assert.equal(link.textContent, 'WhatsApp');
  assert.match(link.href, /^https:\/\/wa\.me\/966553846446\?text=/);
  assert.equal(
    decodeURIComponent(new URL(link.href).searchParams.get('text')),
    'Hello a2b Logistics, I am contacting you through the a2b website regarding a logistics requirement.'
  );
}
assert.equal(cards[2].phoneLink.insertedElement, undefined, 'Non-buyer contact cards should remain unchanged');

const whatsappLink = cards[0].phoneLink.insertedElement;
listeners.click({ target: { closest: () => whatsappLink } });

const eventEntries = window.dataLayer.filter((entry) => entry[0] === 'event');
const events = eventEntries.map((entry) => entry[1]);
assert.deepEqual(events, ['whatsapp_click', 'contact_click']);
assert.equal(eventEntries[0][2].page_location, 'https://www.a2b.sa/');
assert.equal(eventEntries[1][2].contact_type, 'whatsapp');

console.log('WhatsApp analytics tests passed.');
