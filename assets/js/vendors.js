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

  function setupForm() {
    var form = byId('vendorForm');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(form);

      var companyName = textValue(data, 'company_name', '', 180);
      var crNumber = textValue(data, 'cr_number', '', 80);
      var vatNumber = textValue(data, 'vat_number', 'N/A', 80);
      var yearsOp = textValue(data, 'years_operation', '', 40);
      var category = textValue(data, 'vendor_category', '', 120);
      var contactName = textValue(data, 'contact_name', '', 160);
      var contactTitle = textValue(data, 'contact_title', 'N/A', 120);
      var email = textValue(data, 'email', '', 160);
      var phone = textValue(data, 'phone', '', 80);
      var services = textValue(data, 'services', '', 1200);

      var body = 'Vendor Registration Application\n\n--- Company Information ---\nCompany Name: ' + companyName + '\nCR Number: ' + crNumber + '\nVAT Number: ' + vatNumber + '\nYears in Operation: ' + yearsOp + '\nVendor Category: ' + category + '\n\n--- Contact Person ---\nFull Name: ' + contactName + '\nJob Title: ' + contactTitle + '\nEmail: ' + email + '\nPhone: ' + phone + '\n\n--- Services and Capabilities ---\n' + services;
      var mailtoLink = 'mailto:' + 'info' + '@' + 'a2b.sa?subject=vendors - ' + encodeURIComponent(companyName) + '&body=' + encodeURIComponent(body);
      window.location.href = mailtoLink;

      form.style.display = 'none';
      var successMsg = byId('successMsg');
      if (successMsg) successMsg.style.display = 'block';
      window.setTimeout(function () {
        window.location.href = 'thankyou.html?from=vendors';
      }, 1500);
    });
  }

  function init() {
    setupNav();
    setupForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
