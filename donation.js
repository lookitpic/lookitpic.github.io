(() => {
  'use strict';
  if (document.documentElement.lang !== 'ru') return;
  const trigger = document.getElementById('donate-link');
  const dialog = document.getElementById('donation-dialog');
  if (!trigger || !dialog || typeof dialog.showModal !== 'function') return;
  trigger.addEventListener('click', event => {
    event.preventDefault();
    if (!dialog.open) dialog.showModal();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => trigger.focus({preventScroll: true}));
})();
