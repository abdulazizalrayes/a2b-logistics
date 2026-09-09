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
    var href = link.getAttribute('href');
    if (!href) return '';

    var url;
    try {
      url = new URL(href, window.location.origin);
    } catch (error) {
      return '';
    }

    if (url.protocol === 'mailto:') return 'email';
    if (url.protocol === 'tel:') return 'phone';
    if (url.protocol !== 'https:') return '';

    var hostname = url.hostname.toLowerCase();
    if (hostname === 'wa.me' || hostname === 'www.wa.me' || hostname === 'whatsapp.com' || hostname.endsWith('.whatsapp.com')) return 'whatsapp';
    if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')) return 'linkedin';
    if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) return 'instagram';
    if (hostname === 'x.com' || hostname.endsWith('.x.com') || hostname === 'twitter.com' || hostname.endsWith('.twitter.com')) return 'x';
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

    if (contactType === 'email' || contactType === 'phone' || contactType === 'whatsapp') {
      sendEvent('generate_lead', {
        contact_method: contactType,
        lead_source: 'website_contact',
        page_location: window.location.href
      });
    }
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
