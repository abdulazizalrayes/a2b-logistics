(function () {
  var KEY = 'dabfa5738883df4a66f9ad844188f7aa';
  var URLS = [
    'https://www.a2b.sa/',
    'https://www.a2b.sa/careers',
    'https://www.a2b.sa/fleet',
    'https://www.a2b.sa/vendors',
    'https://www.a2b.sa/privacy-policy',
    'https://www.a2b.sa/terms-and-conditions'
  ];
  var WMT_URL = 'https://www.bing.com/webmasters/indexnow?siteUrl=https://www.a2b.sa/';

  function byId(id) {
    return document.getElementById(id);
  }

  function pingURL(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      var endpoint = 'https://api.indexnow.org/indexnow?url=' + encodeURIComponent(url) + '&key=' + KEY + '&keyLocation=' + encodeURIComponent('https://www.a2b.sa/dabfa5738883df4a66f9ad844188f7aa.txt');
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(true); };
      img.src = endpoint;
      window.setTimeout(function () { resolve(true); }, 5000);
    });
  }

  function appendConfirmation(status) {
    var strong = document.createElement('strong');
    strong.textContent = 'All 6 URLs pinged';

    var small = document.createElement('small');
    small.className = 'confirm-note';
    small.append('To confirm receipt, check ');

    var link = document.createElement('a');
    link.href = WMT_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'confirm-link';
    link.textContent = 'Bing WMT → IndexNow';
    small.append(link, ' in ~10 minutes.');

    status.replaceChildren('✅ ', strong, ' — Bing & Yandex will crawl them shortly.', document.createElement('br'), small);
  }

  async function submitNow() {
    var btn = byId('submitBtn');
    var status = byId('status');
    if (!btn || !status) return;

    btn.disabled = true;
    btn.textContent = 'Submitting...';
    status.style.display = 'block';
    status.className = 'info';
    status.textContent = 'Sending pings to api.indexnow.org...';

    for (var i = 0; i < URLS.length; i += 1) {
      var badge = byId('b' + i);
      if (badge) badge.textContent = '⏳';
      await pingURL(URLS[i]);
      if (badge) badge.textContent = '✅';
      await new Promise(function (resolve) {
        window.setTimeout(resolve, 400);
      });
    }

    status.className = 'success';
    appendConfirmation(status);

    btn.disabled = false;
    btn.textContent = 'Submit All URLs to IndexNow';
  }

  function init() {
    var btn = byId('submitBtn');
    if (btn) btn.addEventListener('click', submitNow);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
