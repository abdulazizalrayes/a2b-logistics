(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function setStepText(step, english) {
    if (!step) return;
    step.textContent = english;
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
        badge.classList.add('type-badge-vendor');
      }
      setStepText(step3, 'Our partnerships team will reach out to discuss onboarding as an a2b approved vendor.');
      sendEvent('vendor_registration_complete', { event_category: 'form', event_label: 'vendor' });
    } else if (from === 'careers') {
      if (badge) {
        badge.textContent = 'Application Submitted';
        badge.classList.add('type-badge-careers');
      }
      setStepText(step3, 'Our HR team will review your application and reach out if your profile matches our current openings.');
      sendEvent('job_application_complete', { event_category: 'form', event_label: 'careers' });
    } else if (from === 'contact') {
      if (badge) badge.textContent = 'Message Received';
      setStepText(step3, 'A member of our team will contact you to discuss your logistics requirements.');
      sendEvent('contact_form_complete', { event_category: 'form', event_label: 'contact' });
    } else {
      sendEvent('form_submission_complete', { event_category: 'form' });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
