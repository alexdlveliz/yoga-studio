(() => {
  const forms = document.querySelectorAll('[data-pending-form]');
  function reset(form) {
    form.dataset.pending = '';
    form.querySelectorAll('button[type="submit"]').forEach(button => {
      button.disabled = false;
      if (button.dataset.originalText) button.textContent = button.dataset.originalText;
    });
    const status = form.querySelector('[data-pending-status]');
    if (status) status.textContent = '';
  }
  forms.forEach(form => {
    reset(form);
    form.addEventListener('submit', event => {
      if (form.dataset.pending) { event.preventDefault(); return; }
      if (!form.checkValidity()) return;
      form.dataset.pending = 'true';
      const button = event.submitter || form.querySelector('button[type="submit"]');
      const text = form.dataset.pendingText || 'Guardando…';
      if (button) { button.dataset.originalText = button.textContent; button.disabled = true; button.textContent = text; }
      const status = form.querySelector('[data-pending-status]');
      if (status) status.textContent = text;
    });
  });
  window.addEventListener('pageshow', () => forms.forEach(reset));
})();
