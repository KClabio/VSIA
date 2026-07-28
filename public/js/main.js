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
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function inlineFormat(str) {
    return str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  // Chuyển markdown đơn giản (đậm, gạch đầu dòng) từ AI thành HTML.
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
const contactToggleBtn = document.getElementById('contactToggleBtn');
const contactOverlay = document.getElementById('contactOverlay');
const contactModalClose = document.getElementById('contactModalClose');
const contactForm = document.getElementById('contactForm');
const contactFormMsg = document.getElementById('contactFormMsg');

if (contactToggleBtn && contactOverlay) {
  const openContactModal = () => contactOverlay.classList.add('open');
  const closeContactModal = () => contactOverlay.classList.remove('open');

  contactToggleBtn.addEventListener('click', openContactModal);
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
