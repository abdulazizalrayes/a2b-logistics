(function () {
  var WHATSAPP_URL = 'https://wa.me/966553846446?text=' + encodeURIComponent(
    'Hello a2b Logistics, I am contacting you through the a2b website regarding a logistics requirement.'
  );

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', 'G-909SV0D9FM');

  function sendEvent(name, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, params || {});
  }

  function classifyContactLink(link) {
    var href = link.getAttribute('href') || '';
    if (href.indexOf('wa.me/') !== -1 || href.indexOf('whatsapp.com/') !== -1) return 'whatsapp';
    if (href.indexOf('mailto:') === 0) return 'email';
    if (href.indexOf('tel:') === 0) return 'phone';
    if (href.indexOf('linkedin.com') !== -1) return 'linkedin';
    if (href.indexOf('instagram.com') !== -1) return 'instagram';
    if (href.indexOf('x.com') !== -1 || href.indexOf('twitter.com') !== -1) return 'x';
    return '';
  }

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;

    var contactType = classifyContactLink(link);
    if (!contactType) return;

    if (contactType === 'whatsapp') {
      sendEvent('whatsapp_click', {
        link_url: link.getAttribute('href'),
        link_text: (link.textContent || '').trim(),
        page_location: window.location.href
      });
    }

    sendEvent('contact_click', {
      contact_type: contactType,
      link_url: link.getAttribute('href'),
      page_location: window.location.href
    });
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', function () {
    var cards = document.querySelectorAll('.contact-grid .contact-card');

    Array.prototype.slice.call(cards, 0, 2).forEach(function (card) {
      if (card.querySelector('a[href*="wa.me/"]')) return;

      var phoneLink = card.querySelector('a[href="tel:+966553846446"]');
      if (!phoneLink) return;

      var whatsappLink = document.createElement('a');
      whatsappLink.href = WHATSAPP_URL;
      whatsappLink.target = '_blank';
      whatsappLink.rel = 'noopener';
      whatsappLink.className = 'whatsapp-link';
      whatsappLink.setAttribute('aria-label', 'Contact a2b Logistics on WhatsApp');
      whatsappLink.textContent = 'WhatsApp';
      phoneLink.insertAdjacentElement('afterend', whatsappLink);
    });
  });

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || !form.id) return;

    sendEvent('form_submit_attempt', {
      form_id: form.id,
      page_location: window.location.href
    });
  }, true);
})();
