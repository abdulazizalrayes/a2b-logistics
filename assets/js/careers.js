(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function textValue(formData, name, fallback, maxLength) {
    var value = String(formData.get(name) || fallback || '');
    return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
  }

  function setupNav() {
    var navbar = byId('navbar');
    window.addEventListener('scroll', function () {
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    var menu = byId('mobileMenu');
    var hamburger = document.querySelector('.hamburger');
    if (hamburger && menu) {
      hamburger.addEventListener('click', function () {
        menu.classList.toggle('open');
      });
    }

    document.querySelectorAll('#mobileMenu a[href^="/#"]').forEach(function (link) {
      link.addEventListener('click', function () {
        if (menu) menu.classList.remove('open');
      });
    });
  }

  function setupFileLabel() {
    var fileInput = document.querySelector('.file-label input[type="file"]');
    var label = byId('fileLabel');
    if (!fileInput || !label) return;

    fileInput.addEventListener('change', function () {
      label.textContent = (fileInput.files && fileInput.files[0]) ? fileInput.files[0].name : 'Upload CV';
    });
  }

  function setupForm() {
    var form = byId('careerForm');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var name = textValue(data, 'full_name', '', 160);
      var email = textValue(data, 'email', '', 160);
      var phone = textValue(data, 'phone', '', 80);

      var body = 'Career Application\n\nFull Name: ' + name + '\nEmail: ' + email + '\nPhone: ' + phone + '\n\n---\nPlease attach your CV to this email.';
      var mailtoLink = 'mailto:' + 'info' + '@' + 'a2b.sa?subject=careers - ' + encodeURIComponent(name) + '&body=' + encodeURIComponent(body);
      window.location.href = mailtoLink;

      form.style.display = 'none';
      var successMsg = byId('successMsg');
      if (successMsg) successMsg.style.display = 'block';
      window.setTimeout(function () {
        window.location.href = 'thankyou.html?from=careers';
      }, 1500);
    });
  }

  function init() {
    setupNav();
    setupFileLabel();
    setupForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
