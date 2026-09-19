(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function sendEvent(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  }

  function setupNav() {
    var navbar = byId('navbar');
    window.addEventListener('scroll', function () {
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        var hash = link.getAttribute('href');
        if (!hash || hash === '#') return;
        var target = document.getElementById(hash.slice(1));
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
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
