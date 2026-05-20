(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function init() {
    var navbar = byId('navbar');
    window.addEventListener('scroll', function () {
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    var hamburger = document.querySelector('.hamburger');
    var menu = byId('mobileMenu');
    if (hamburger && menu) {
      hamburger.addEventListener('click', function () {
        menu.classList.toggle('open');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
