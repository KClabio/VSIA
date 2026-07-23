document.getElementById('navToggle')?.addEventListener('click', () => {
  document.getElementById('mainNav')?.classList.toggle('open');
});

document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('adminSidebar')?.classList.toggle('open');
});

document.querySelectorAll('.user-menu-trigger').forEach((trigger) => {
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = trigger.closest('.user-menu');
    const isOpen = menu.classList.contains('open');
    document.querySelectorAll('.user-menu.open').forEach((m) => m.classList.remove('open'));
    if (!isOpen) {
      menu.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.user-menu.open').forEach((m) => {
    m.classList.remove('open');
    m.querySelector('.user-menu-trigger')?.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.user-menu.open').forEach((m) => m.classList.remove('open'));
  }
});
