(function () {
  function init() {
    var button = document.querySelector('.hamburger');
    var menu = document.getElementById('mobileMenu');
    if (!button || !menu) return;
    function setOpen(open, restoreFocus) {
      menu.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
      if (restoreFocus) button.focus();
    }
    button.addEventListener('click', function () { setOpen(button.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false, true); }
    });
    button.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false, true);
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('click', function (event) {
      if (!menu.contains(event.target) && !button.contains(event.target)) setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.getComputedStyle(button).display === 'none') setOpen(false);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
