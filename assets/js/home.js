(function () {
  var isAr = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function sendEvent(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  }

  function toggleMenu() {
    var menu = byId('mobileMenu');
    if (menu) menu.classList.toggle('open');
  }

  function closeMobile() {
    var menu = byId('mobileMenu');
    if (menu) menu.classList.remove('open');
  }

  function toggleLang() {
    isAr = !isAr;
    var html = document.documentElement;
    var body = document.body;
    var btn = byId('langBtn');

    if (isAr) {
      html.setAttribute('lang', 'ar');
      html.setAttribute('dir', 'rtl');
      body.classList.add('ar');
      if (btn) btn.textContent = 'EN';
    } else {
      html.setAttribute('lang', 'en');
      html.setAttribute('dir', 'ltr');
      body.classList.remove('ar');
      if (btn) btn.textContent = 'AR';
    }
  }

  function setupNav() {
    var navbar = byId('navbar');
    window.addEventListener('scroll', function () {
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    var hamburger = document.querySelector('.hamburger');
    if (hamburger) hamburger.addEventListener('click', toggleMenu);

    var langBtn = byId('langBtn');
    if (langBtn) langBtn.addEventListener('click', toggleLang);

    document.querySelectorAll('#mobileMenu a[href^="#"], #mobileMenu a[href^="/#"]').forEach(function (link) {
      link.addEventListener('click', closeMobile);
    });

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        var target = document.querySelector(link.getAttribute('href'));
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function setupAnalyticsEvents() {
    document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
      el.addEventListener('click', function () {
        sendEvent('phone_click', {
          event_category: 'engagement',
          event_label: this.href
        });
      });
    });

    document.querySelectorAll('a[href^="mailto:"]').forEach(function (el) {
      el.addEventListener('click', function () {
        sendEvent('email_click', {
          event_category: 'engagement',
          event_label: this.href
        });
      });
    });

    document.querySelectorAll('.btn-nav, .btn-primary, a[href="#contact"]').forEach(function (el) {
      el.addEventListener('click', function () {
        sendEvent('cta_click', {
          event_category: 'engagement',
          event_label: el.textContent.trim()
        });
      });
    });

    var form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', function () {
        sendEvent('form_submit', {
          event_category: 'lead',
          event_label: 'contact_form'
        });
      });
    }

    var milestones = { 25: false, 50: false, 75: false, 90: false };
    window.addEventListener('scroll', function () {
      var scrollable = document.body.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      var pct = Math.round((window.scrollY / scrollable) * 100);
      Object.keys(milestones).forEach(function (milestone) {
        if (!milestones[milestone] && pct >= Number(milestone)) {
          milestones[milestone] = true;
          sendEvent('scroll_depth', {
            event_category: 'engagement',
            event_label: milestone + '%',
            value: Number(milestone)
          });
        }
      });
    }, { passive: true });
  }

  function init() {
    setupNav();
    setupAnalyticsEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
