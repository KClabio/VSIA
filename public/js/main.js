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

document.querySelectorAll('.carousel').forEach((carousel) => {
  const track = carousel.querySelector('.carousel-track');
  const step = () => Math.min(track.clientWidth * 0.8, 320);
  carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => {
    track.scrollBy({ left: -step(), behavior: 'smooth' });
  });
  carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => {
    track.scrollBy({ left: step(), behavior: 'smooth' });
  });
});

document.querySelectorAll('.team-tabs').forEach((tabs) => {
  const container = tabs.parentElement;
  const buttons = tabs.querySelectorAll('[data-team-tab]');
  const panels = container.querySelectorAll('[data-team-panel]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-team-tab');
      buttons.forEach((b) => b.classList.toggle('active', b === btn));
      panels.forEach((p) => p.classList.toggle('active', p.getAttribute('data-team-panel') === target));
    });
  });
});

document.querySelectorAll('.accordion-steps').forEach((group) => {
  const steps = group.querySelectorAll('.accordion-step');
  steps.forEach((step) => {
    step.querySelector('.accordion-step-header')?.addEventListener('click', () => {
      const isActive = step.classList.contains('active');
      steps.forEach((s) => s.classList.remove('active'));
      if (!isActive) step.classList.add('active');
    });
  });
});

const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('show', window.scrollY > 400);
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Nav trở nền đặc khi cuộn (chỉ áp dụng cho header trong suốt trên trang chủ)
const siteHeader = document.getElementById('siteHeader');
if (siteHeader && siteHeader.classList.contains('nav-transparent')) {
  const onScroll = () => siteHeader.classList.toggle('solid', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Hiệu ứng xuất hiện khi cuộn tới
if (window.IntersectionObserver) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
}

// Tab "Lĩnh vực hoạt động" (trang chủ)
document.querySelectorAll('.biz-tabs').forEach((tabs) => {
  const container = tabs.parentElement;
  const buttons = tabs.querySelectorAll('[data-biz-tab]');
  const panels = container.querySelectorAll('[data-biz-panel]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-biz-tab');
      buttons.forEach((b) => b.classList.toggle('active', b === btn));
      panels.forEach((p) => p.classList.toggle('on', p.getAttribute('data-biz-panel') === target));
    });
  });
});
