(() => {
  document.addEventListener('click', event => {
    const link = event.target.closest('a.legal-link');
    if (!link) return;
    const dialog = document.getElementById(link.hash.slice(1));
    if (!(dialog instanceof HTMLDialogElement)) return;
    event.preventDefault();
    if (!dialog.open) dialog.showModal();
  });
})();
