document.querySelectorAll('.services-list').forEach((list) => {
  const pills = list.querySelectorAll('.service-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });
});

document.getElementById('navToggle')?.addEventListener('click', () => {
  document.getElementById('mainNav')?.classList.toggle('open');
});

document.getElementById('webinarShowMoreBtn')?.addEventListener('click', function () {
  document.querySelectorAll('#webinarGrid .webinar-card-hidden').forEach((card) => {
    card.classList.remove('webinar-card-hidden');
  });
  this.closest('.webinar-more-cta')?.remove();
});

(function () {
  const header = document.getElementById('siteHeader');
  const inner = header?.querySelector('.header-inner');
  if (!header || !inner) return;

  function checkNavFit() {
    const wasCompact = header.classList.contains('nav-compact');
    header.classList.remove('nav-compact'); // đo ở trạng thái đầy đủ

    const overflowing = inner.scrollWidth > inner.clientWidth + 1;
    header.classList.toggle('nav-compact', overflowing);

    if (wasCompact && !overflowing) {
      document.getElementById('mainNav')?.classList.remove('open');
    }
  }

  checkNavFit();
  window.addEventListener('resize', checkNavFit);
  window.addEventListener('load', checkNavFit);
  if (document.fonts?.ready) document.fonts.ready.then(checkNavFit);
})();

(() => {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.main-nav a:not(.nav-cta)').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('/')) return;
    const isActive = href === '/' ? currentPath === '/' : (currentPath === href || currentPath.startsWith(href + '/'));
    if (isActive) link.classList.add('active');
  });
})();

// Dùng event delegation (gắn trên document) thay vì gắn thẳng lên #sidebarClose vì admin-spa.js
// thay innerHTML của #adminSidebar mỗi khi chuyển trang trong khu quản trị, làm mất listener gắn trực tiếp.
document.addEventListener('click', (e) => {
  if (e.target.closest('#sidebarToggle')) {
    document.getElementById('adminSidebar')?.classList.toggle('open');
    document.getElementById('sidebarBackdrop')?.classList.toggle('open');
    return;
  }
  if (e.target.closest('#sidebarClose') || e.target.closest('#sidebarBackdrop')) {
    document.getElementById('adminSidebar')?.classList.remove('open');
    document.getElementById('sidebarBackdrop')?.classList.remove('open');
  }
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

document.querySelectorAll('.nav-dropdown-trigger').forEach((trigger) => {
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = trigger.closest('.nav-dropdown');
    const isOpen = dropdown.classList.contains('open');
    document.querySelectorAll('.nav-dropdown.open').forEach((d) => {
      d.classList.remove('open');
      d.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      dropdown.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown.open').forEach((d) => {
    d.classList.remove('open');
    d.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.nav-dropdown.open').forEach((d) => d.classList.remove('open'));
    document.querySelectorAll('.nav-subdropdown.open').forEach((d) => d.classList.remove('open'));
  }
});

document.querySelectorAll('.nav-subdropdown-toggle').forEach((toggle) => {
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const sub = toggle.closest('.nav-subdropdown');
    const isOpen = sub.classList.contains('open');
    document.querySelectorAll('.nav-subdropdown.open').forEach((s) => {
      s.classList.remove('open');
      s.querySelector('.nav-subdropdown-toggle')?.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      sub.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    }
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.nav-subdropdown.open').forEach((d) => {
    d.classList.remove('open');
    d.querySelector('.nav-subdropdown-toggle')?.setAttribute('aria-expanded', 'false');
  });
});

// Hero trang chủ: tự động chuyển giữa nhiều ảnh nền (crossfade), nếu admin đã tải lên >1 ảnh.
(function () {
  const slides = document.querySelectorAll('.hero-home-bg-slide');
  if (slides.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 5000);
})();

document.querySelectorAll('.gallery-marquee').forEach((marquee) => {
  const track = marquee.querySelector('.gallery-marquee-track');
  if (!track) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paused = false;
  const speed = 0.6; // px mỗi frame

  function autoScroll() {
    if (!paused) {
      const half = track.scrollWidth / 2;
      track.scrollLeft += speed;
      if (track.scrollLeft >= half) track.scrollLeft -= half;
    }
    requestAnimationFrame(autoScroll);
  }
  if (!prefersReducedMotion) requestAnimationFrame(autoScroll);

  marquee.addEventListener('mouseenter', () => { paused = true; });
  marquee.addEventListener('mouseleave', () => { paused = false; });
  track.addEventListener('touchstart', () => { paused = true; }, { passive: true });

  const nudge = () => Math.min(track.clientWidth * 0.7, 360);
  marquee.querySelector('[data-marquee-prev]')?.addEventListener('click', () => {
    let target = track.scrollLeft - nudge();
    if (target < 0) target += track.scrollWidth / 2;
    track.scrollLeft = target;
  });
  marquee.querySelector('[data-marquee-next]')?.addEventListener('click', () => {
    let target = track.scrollLeft + nudge();
    const half = track.scrollWidth / 2;
    if (target >= half) target -= half;
    track.scrollLeft = target;
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

// Hiệu ứng chiều sâu (3D depth / immersive scroll) cho từng section khi cuộn tới
// Bỏ qua section đầu tiên (hero) để không bị ẩn khi vừa tải trang
document.querySelectorAll('section.section').forEach((sec) => sec.classList.add('depth-section'));
if (window.IntersectionObserver) {
  const ioDepth = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('depth-in');
        ioDepth.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.depth-section').forEach((el) => ioDepth.observe(el));
} else {
  document.querySelectorAll('.depth-section').forEach((el) => el.classList.add('depth-in'));
}

// Chatbot AI (widget nổi)
const chatToggleBtn = document.getElementById('chatToggleBtn');
const chatPanel = document.getElementById('chatPanel');
const chatPanelClose = document.getElementById('chatPanelClose');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

if (chatToggleBtn && chatPanel) {
  const chatHistory = [];

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function inlineFormat(str) {
    let out = str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Chỉ chấp nhận link nội bộ (bắt đầu bằng /) hoặc http(s), chặn javascript:/data: để tránh XSS.
    out = out.replace(/\[([^[\]]+)\]\s?\((\/[^\s()]*|https?:\/\/[^\s()]+)\)/g, (match, label, url) => {
      const external = /^https?:\/\//.test(url);
      const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return '<a href="' + url + '"' + attrs + '>' + label + '</a>';
    });
    return out;
  }

  // Chuyển markdown đơn giản (đậm, link, gạch đầu dòng) từ AI thành HTML.
  // Escape HTML trước, sau đó mới bọc thẻ do chính ta tạo ra nên an toàn khỏi XSS.
  function renderBotMarkdown(text) {
    const lines = escapeHtml(text).split('\n');
    let html = '';
    let inList = false;
    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      const bulletMatch = line.match(/^[-*]\s+(.*)$/) || line.match(/^\d+[.)]\s+(.*)$/);
      if (bulletMatch) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += '<li>' + inlineFormat(bulletMatch[1]) + '</li>';
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        if (line) html += '<p>' + inlineFormat(line) + '</p>';
      }
    });
    if (inList) html += '</ul>';
    return html;
  }

  function addChatMessage(role, text) {
    const el = document.createElement('div');
    el.className = 'chat-msg ' + (role === 'user' ? 'chat-msg-user' : 'chat-msg-bot');
    if (role === 'user') {
      el.textContent = text;
    } else {
      el.innerHTML = renderBotMarkdown(text);
    }
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return el;
  }

  chatToggleBtn.addEventListener('click', () => {
    chatPanel.classList.toggle('open');
    if (chatPanel.classList.contains('open')) chatInput?.focus();
  });
  chatPanelClose?.addEventListener('click', () => chatPanel.classList.remove('open'));

  chatForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    addChatMessage('user', text);
    chatHistory.push({ role: 'user', content: text });
    chatInput.value = '';
    chatInput.disabled = true;

    const typingEl = document.createElement('div');
    typingEl.className = 'chat-msg chat-msg-typing';
    typingEl.textContent = 'Đang trả lời...';
    chatMessages.appendChild(typingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });
      const data = await res.json();
      typingEl.remove();
      if (res.ok && data.reply) {
        addChatMessage('bot', data.reply);
        chatHistory.push({ role: 'assistant', content: data.reply });
      } else {
        addChatMessage('bot', data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } catch (err) {
      typingEl.remove();
      addChatMessage('bot', 'Không thể kết nối, vui lòng kiểm tra mạng và thử lại.');
    } finally {
      chatInput.disabled = false;
      chatInput.focus();
    }
  });
}

// Modal đăng ký tư vấn
const contactToggleBtns = document.querySelectorAll('#contactToggleBtn, [data-open-contact]');
const contactOverlay = document.getElementById('contactOverlay');
const contactModalClose = document.getElementById('contactModalClose');
const contactForm = document.getElementById('contactForm');
const contactFormMsg = document.getElementById('contactFormMsg');

if (contactToggleBtns.length && contactOverlay) {
  const openContactModal = (e) => { e.preventDefault(); contactOverlay.classList.add('open'); };
  const closeContactModal = () => contactOverlay.classList.remove('open');

  contactToggleBtns.forEach((btn) => btn.addEventListener('click', openContactModal));
  contactModalClose?.addEventListener('click', closeContactModal);
  contactOverlay.addEventListener('click', (e) => {
    if (e.target === contactOverlay) closeContactModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeContactModal();
  });

  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    contactFormMsg.style.display = 'none';
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const formData = new FormData(contactForm);
    try {
      const res = await fetch('/lien-he-tu-van', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          contact: [formData.get('phone'), formData.get('email')].filter(Boolean).join(' - '),
          message: formData.get('message'),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        contactForm.reset();
        contactFormMsg.style.display = 'block';
        contactFormMsg.style.color = 'var(--green)';
        contactFormMsg.textContent = 'Đã gửi yêu cầu! VSIA sẽ liên hệ với bạn sớm nhất.';
        setTimeout(closeContactModal, 1800);
      } else {
        contactFormMsg.style.display = 'block';
        contactFormMsg.style.color = '';
        contactFormMsg.textContent = data.error || 'Có lỗi xảy ra, vui lòng thử lại.';
      }
    } catch (err) {
      contactFormMsg.style.display = 'block';
      contactFormMsg.style.color = '';
      contactFormMsg.textContent = 'Không thể kết nối, vui lòng thử lại.';
    } finally {
      submitBtn.disabled = false;
    }
  });
}
