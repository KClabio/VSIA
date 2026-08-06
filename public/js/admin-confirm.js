// Thay hộp thoại confirm() mặc định của trình duyệt bằng popup tự thiết kế cho các form có
// data-confirm-title. Gắn ở capture phase để luôn chạy TRƯỚC listener submit của admin-spa.js
// (submit event bubble, nhưng capture phase luôn chạy trước bubble phase bất kể thứ tự đăng ký),
// nhờ vậy chặn được submit gốc trước khi admin-spa.js kịp fetch. Khi người dùng bấm "Xoá", form
// được đánh dấu data-confirm-bypass rồi requestSubmit() lại — lần này listener bỏ qua, để
// admin-spa.js xử lý submit thật như bình thường.
(function () {
  var overlay = null;
  var titleEl, messageEl, confirmBtn, cancelBtn;
  var pendingForm = null;

  function ensureModal() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'adm-confirm-overlay';
    overlay.innerHTML =
      '<div class="adm-confirm-modal" role="alertdialog" aria-modal="true">' +
        '<div class="adm-confirm-title"></div>' +
        '<div class="adm-confirm-message"></div>' +
        '<div class="adm-confirm-actions">' +
          '<button type="button" class="adm-confirm-btn adm-confirm-btn-cancel">Huỷ</button>' +
          '<button type="button" class="adm-confirm-btn adm-confirm-btn-delete">Xoá</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    titleEl = overlay.querySelector('.adm-confirm-title');
    messageEl = overlay.querySelector('.adm-confirm-message');
    confirmBtn = overlay.querySelector('.adm-confirm-btn-delete');
    cancelBtn = overlay.querySelector('.adm-confirm-btn-cancel');

    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    confirmBtn.addEventListener('click', function () {
      var form = pendingForm;
      closeModal();
      if (!form) return;
      form.setAttribute('data-confirm-bypass', '1');
      if (form.requestSubmit) form.requestSubmit();
      else form.submit();
    });
  }

  function closeModal() {
    if (overlay) overlay.classList.remove('open');
    pendingForm = null;
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.hasAttribute('data-confirm-bypass')) {
      form.removeAttribute('data-confirm-bypass');
      return;
    }

    var title = form.getAttribute('data-confirm-title');
    if (!title) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    ensureModal();
    titleEl.textContent = title;
    var name = form.getAttribute('data-confirm-name');
    messageEl.textContent = name || '';
    messageEl.style.display = name ? '' : 'none';
    confirmBtn.textContent = form.getAttribute('data-confirm-label') || 'Xoá';
    var neutral = form.getAttribute('data-confirm-neutral') === '1';
    confirmBtn.classList.toggle('adm-confirm-btn-delete', !neutral);
    confirmBtn.classList.toggle('adm-confirm-btn-primary', neutral);
    pendingForm = form;
    overlay.classList.add('open');
  }, true);
})();
