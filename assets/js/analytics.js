(function () {
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

    sendEvent('contact_click', {
      contact_type: contactType,
      link_url: link.getAttribute('href'),
      page_location: window.location.href
    });
  }, { passive: true });

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || !form.id) return;

    sendEvent('form_submit_attempt', {
      form_id: form.id,
      page_location: window.location.href
    });
  }, true);
})();
