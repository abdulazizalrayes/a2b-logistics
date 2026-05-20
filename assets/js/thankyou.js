(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function span(className, text) {
    var element = document.createElement('span');
    element.className = className;
    element.textContent = text;
    return element;
  }

  function setStepText(step, english, arabic) {
    if (!step) return;
    step.replaceChildren(
      span('en-text', english),
      span('ar-text', arabic)
    );
  }

  function sendEvent(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  }

  function init() {
    var params = new URLSearchParams(window.location.search);
    var from = params.get('from') || '';
    var badge = byId('sourceBadge');
    var step3 = byId('step3text');

    if (from === 'vendors') {
      if (badge) {
        badge.textContent = 'Vendor Registration Received';
        badge.style.background = '#fff3e0';
        badge.style.color = '#e65100';
      }
      setStepText(step3, 'Our partnerships team will reach out to discuss onboarding as an a2b approved vendor.', 'سيتواصل معك فريق الشراكات لمناقشة انضمامك كمورد معتمد لشركة a2b.');
      sendEvent('vendor_registration_complete', { event_category: 'form', event_label: 'vendor' });
    } else if (from === 'careers') {
      if (badge) {
        badge.textContent = 'Application Submitted';
        badge.style.background = '#e8f5e9';
        badge.style.color = '#2e7d32';
      }
      setStepText(step3, 'Our HR team will review your application and reach out if your profile matches our current openings.', 'سيراجع فريق الموارد البشرية طلبك ويتواصل معك إذا كان ملفك يتناسب مع فرص العمل المتاحة.');
      sendEvent('job_application_complete', { event_category: 'form', event_label: 'careers' });
    } else if (from === 'contact') {
      if (badge) badge.textContent = 'Message Received';
      setStepText(step3, 'A member of our team will contact you to discuss your logistics requirements.', 'سيتواصل معك أحد أعضاء فريقنا لمناقشة متطلباتك اللوجستية.');
      sendEvent('contact_form_complete', { event_category: 'form', event_label: 'contact' });
    } else {
      sendEvent('form_submission_complete', { event_category: 'form' });
    }

    var lang = localStorage.getItem('a2b_lang') || 'en';
    if (lang === 'ar') {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
