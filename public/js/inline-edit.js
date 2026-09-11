/* Chế độ sửa nội dung tại chỗ trên chính trang thật.
 *
 * File này chỉ được nhúng khi admin mở trang với ?edit=1 (xem views/partials/footer.ejs),
 * nên không có một dòng nào chạy trong phiên của khách truy cập.
 *
 * Cách hoạt động:
 *   - Server đã in sẵn data-ce-key / data-ce-img / data-ce-link vào các phần tử sửa được.
 *   - Script quét DOM tìm các dấu đó, biến chữ thành ô nhập, phủ nút "Thay ảnh"/"Sửa link"
 *     lên ảnh và link.
 *   - Bấm "Lưu" thì gửi từng thay đổi lên /admin/noi-dung/*.
 *
 * Không dùng alert/confirm/prompt của trình duyệt — tất cả hộp thoại đều tự vẽ, để luồng
 * làm việc không bị treo và giao diện thống nhất.
 */
(function () {
  'use strict';

  var API = {
    text: '/admin/noi-dung/text',
    link: '/admin/noi-dung/link',
    image: '/admin/noi-dung/anh',
    reset: '/admin/noi-dung/reset'
  };

  var PAGE = window.__CE_PAGE__ || { seo: [] };

  // key -> { el, original, value }  các ô chữ đang có thay đổi chưa lưu
  var dirtyText = {};
  var dirtyCount = 0;
  var focusedText = null;
  var saving = false;

  var bar, statusEl, saveBtn, resetBtn, layer;
  var markers = [];
  var toastTimer = null;

  /* ------------------------------------------------------------------ tiện ích */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function toast(message, kind) {
    var existing = document.querySelector('.ce-toast');
    if (existing) existing.remove();
    if (toastTimer) clearTimeout(toastTimer);

    var node = el('div', 'ce-toast', message);
    node.setAttribute('data-kind', kind || 'info');
    document.body.appendChild(node);
    toastTimer = setTimeout(function () { node.remove(); }, kind === 'error' ? 6000 : 3000);
  }

  function postJson(url, payload) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(readResponse);
  }

  function readResponse(response) {
    return response.text().then(function (raw) {
      var data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch (e) { data = null; }

      if (!response.ok) {
        // Hết session thì server trả về HTML trang đăng nhập chứ không phải JSON — nói rõ
        // để người dùng biết phải đăng nhập lại, thay vì báo "lỗi không xác định".
        if (response.status === 401 || response.status === 403) {
          throw new Error('Phiên đăng nhập đã hết hoặc bạn không có quyền sửa nội dung. Hãy đăng nhập lại.');
        }
        throw new Error((data && data.error) || ('Lỗi ' + response.status + ' từ server.'));
      }
      if (!data) throw new Error('Server trả về dữ liệu không đọc được. Có thể bạn đã bị đăng xuất.');
      return data;
    });
  }

  /* ------------------------------------------------- theo dõi thay đổi chưa lưu */

  function markDirty(node, isDirty) {
    var key = node.getAttribute('data-ce-key');
    var wasDirty = Object.prototype.hasOwnProperty.call(dirtyText, key);

    if (isDirty && !wasDirty) {
      dirtyText[key] = node;
      dirtyCount += 1;
    } else if (!isDirty && wasDirty) {
      delete dirtyText[key];
      dirtyCount -= 1;
    }
    node.setAttribute('data-ce-dirty', isDirty ? '1' : '0');
    refreshStatus();
  }

  function refreshStatus() {
    if (!statusEl) return;
    if (saving) {
      statusEl.textContent = 'Đang lưu...';
      statusEl.setAttribute('data-state', 'saving');
    } else if (dirtyCount > 0) {
      statusEl.textContent = dirtyCount + ' ô chưa lưu';
      statusEl.setAttribute('data-state', 'dirty');
    } else {
      statusEl.textContent = 'Chưa có thay đổi nào';
      statusEl.setAttribute('data-state', 'clean');
    }
    if (saveBtn) saveBtn.disabled = saving || dirtyCount === 0;
    if (resetBtn) resetBtn.disabled = saving || !focusedText;
  }

  /* ----------------------------------------------------------- ô chữ sửa được */

  function currentText(node) {
    // innerText giữ đúng ngắt dòng người dùng thấy (<br> -> \n), khác textContent.
    return (node.innerText || '').replace(/\u00A0/g, ' ').replace(/\s+$/, '');
  }

  // Một khoá có thể xuất hiện nhiều lần trên cùng trang (ví dụ dòng chữ chạy trong footer lặp
  // lại 16 lần, hay một nhãn dùng ở cả bản desktop và bản mobile). Gõ vào một ô thì cập nhật
  // luôn các ô còn lại để xem trước đúng, còn khi lưu thì vẫn chỉ gửi một lần cho mỗi khoá.
  function mirrorSameKey(source) {
    var key = source.getAttribute('data-ce-key');
    var text = currentText(source);
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-ce-key="' + key.replace(/"/g, '\\"') + '"]'),
      function (twin) {
        if (twin === source) return;
        if (currentText(twin) === text) return;
        twin.innerText = text;
        twin.setAttribute('data-ce-dirty', source.getAttribute('data-ce-dirty') || '0');
      },
    );
  }

  function setupTextNodes() {
    var nodes = document.querySelectorAll('[data-ce-key]');
    Array.prototype.forEach.call(nodes, function (node) {
      node.__ceOriginal = currentText(node);

      node.addEventListener('focus', function () {
        focusedText = node;
        refreshStatus();
      });

      node.addEventListener('blur', function () {
        if (focusedText === node) {
          focusedText = null;
          refreshStatus();
        }
      });

      node.addEventListener('input', function () {
        markDirty(node, currentText(node) !== node.__ceOriginal);
        mirrorSameKey(node);
      });

      // Dán từ Word/Google Docs mang theo cả thẻ và style; chỉ nhận chữ thuần.
      node.addEventListener('paste', function (event) {
        event.preventDefault();
        var text = (event.clipboardData || window.clipboardData).getData('text/plain') || '';
        if (node.getAttribute('data-ce-multiline') !== '1') text = text.replace(/\u00A0/g, ' ');
        document.execCommand('insertText', false, text);
      });

      node.addEventListener('keydown', function (event) {
        // Ô một dòng (tiêu đề, chữ trên nút): Enter để lưu luôn thay vì tạo dòng mới làm vỡ layout.
        if (event.key === 'Enter' && node.getAttribute('data-ce-multiline') !== '1') {
          event.preventDefault();
          node.blur();
          return;
        }
        // Esc: bỏ thay đổi của riêng ô này.
        if (event.key === 'Escape') {
          event.preventDefault();
          node.innerText = node.__ceOriginal;
          markDirty(node, false);
          node.blur();
        }
      });
    });
    return nodes.length;
  }

  /* ------------------------------------------------- lớp phủ ảnh / link */

  function buildMarkers() {
    layer = el('div', 'ce-overlay-layer');
    document.body.appendChild(layer);

    Array.prototype.forEach.call(document.querySelectorAll('[data-ce-img]'), function (target) {
      markers.push(createMarker(target, 'ce-marker-img', 'Thay ảnh', function () {
        openImageDialog(target);
      }));
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-ce-link]'), function (target) {
      markers.push(createMarker(target, 'ce-marker-link', 'Sửa link', function () {
        openLinkDialog(target);
      }));
    });

    positionMarkers();
  }

  function createMarker(target, className, label, onClick) {
    var marker = el('div', 'ce-marker ' + className);
    var button = el('button', 'ce-marker-btn', label);
    button.type = 'button';
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });
    marker.appendChild(button);
    layer.appendChild(marker);
    return { target: target, node: marker };
  }

  function positionMarkers() {
    if (!markers.length) return;
    // Toạ độ tính tương đối với chính lớp phủ, nên không phụ thuộc vào việc body có
    // position: relative hay không.
    var origin = layer.getBoundingClientRect();
    markers.forEach(function (marker) {
      var rect = marker.target.getBoundingClientRect();
      if (!rect.width && !rect.height) {
        marker.node.style.display = 'none';
        return;
      }
      marker.node.style.display = '';
      marker.node.style.top = (rect.top - origin.top) + 'px';
      marker.node.style.left = (rect.left - origin.left) + 'px';
      marker.node.style.width = rect.width + 'px';
      marker.node.style.height = rect.height + 'px';
    });
  }

  var repositionQueued = false;
  function queueReposition() {
    if (repositionQueued) return;
    repositionQueued = true;
    requestAnimationFrame(function () {
      repositionQueued = false;
      positionMarkers();
    });
  }

  /* ------------------------------------------------------------- hộp thoại */

  function openModal(build) {
    var backdrop = el('div', 'ce-modal-backdrop');
    var modal = el('div', 'ce-modal');
    backdrop.appendChild(modal);

    function close() {
      document.removeEventListener('keydown', onKeydown);
      backdrop.remove();
    }
    function onKeydown(event) {
      if (event.key === 'Escape') close();
    }

    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) close();
    });
    document.addEventListener('keydown', onKeydown);

    build(modal, close);
    document.body.appendChild(backdrop);

    var firstField = modal.querySelector('input, textarea, button');
    if (firstField) firstField.focus();
    return close;
  }

  function modalActions(modal, close, primaryLabel, onPrimary, extraButton) {
    var errorEl = el('p', 'ce-modal-error');
    errorEl.style.display = 'none';
    modal.appendChild(errorEl);

    var actions = el('div', 'ce-modal-actions');
    if (extraButton) actions.appendChild(extraButton);

    var cancel = el('button', 'ce-modal-btn', 'Huỷ');
    cancel.type = 'button';
    cancel.addEventListener('click', close);

    var primary = el('button', 'ce-modal-btn ce-modal-btn-primary', primaryLabel);
    primary.type = 'button';
    primary.addEventListener('click', function () {
      errorEl.style.display = 'none';
      primary.disabled = true;
      Promise.resolve(onPrimary())
        .then(function () { close(); })
        .catch(function (err) {
          errorEl.textContent = err.message;
          errorEl.style.display = '';
          primary.disabled = false;
        });
    });

    actions.appendChild(cancel);
    actions.appendChild(primary);
    modal.appendChild(actions);
    return { error: errorEl, primary: primary };
  }

  /* ------------------------------------------------------------ sửa ảnh */

  function openImageDialog(target) {
    var key = target.getAttribute('data-ce-img');

    openModal(function (modal, close) {
      modal.appendChild(el('h3', null, 'Thay ảnh'));
      modal.appendChild(el('p', 'ce-modal-hint',
        'Chọn ảnh JPG, PNG, WEBP hoặc GIF. Sau khi tải lên, trang sẽ tự nạp lại để hiển thị ảnh mới.'));

      var label = el('label', null, 'Chọn ảnh từ máy');
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp,image/gif';
      label.appendChild(input);
      modal.appendChild(label);

      var removeBtn = el('button', 'ce-modal-btn ce-modal-btn-danger', 'Xoá ảnh này');
      removeBtn.type = 'button';
      removeBtn.addEventListener('click', function () {
        removeBtn.disabled = true;
        postJson(API.reset, { key: key })
          .then(function () {
            close();
            reloadKeepingEditMode();
          })
          .catch(function (err) {
            toast(err.message, 'error');
            removeBtn.disabled = false;
          });
      });

      modalActions(modal, close, 'Tải lên', function () {
        if (!input.files || !input.files[0]) throw new Error('Bạn chưa chọn ảnh nào.');

        var form = new FormData();
        form.append('key', key);
        form.append('image', input.files[0]);

        return fetch(API.image, { method: 'POST', body: form })
          .then(readResponse)
          .then(function () { reloadKeepingEditMode(); });
      }, removeBtn);
    });
  }

  /* ------------------------------------------------------------ sửa link */

  function openLinkDialog(target) {
    var key = target.getAttribute('data-ce-link');
    var overridden = target.getAttribute('data-ce-overridden') === '1';
    var currentHref = target.getAttribute('href') || '';

    openModal(function (modal, close) {
      modal.appendChild(el('h3', null, 'Sửa link'));
      modal.appendChild(el('p', 'ce-modal-hint',
        'Link nội bộ bắt đầu bằng / (ví dụ /khoa-hoc), link ngoài bắt đầu bằng https://, '
        + 'gửi email dùng mailto:, gọi điện dùng tel:.'));

      var label = el('label', null, 'Địa chỉ đích');
      var input = document.createElement('input');
      input.type = 'text';
      input.value = currentHref;
      label.appendChild(input);
      modal.appendChild(label);

      var resetLinkBtn = null;
      if (overridden) {
        resetLinkBtn = el('button', 'ce-modal-btn ce-modal-btn-danger', 'Về link gốc');
        resetLinkBtn.type = 'button';
        resetLinkBtn.addEventListener('click', function () {
          resetLinkBtn.disabled = true;
          postJson(API.reset, { key: key })
            .then(function () {
              close();
              reloadKeepingEditMode();
            })
            .catch(function (err) {
              toast(err.message, 'error');
              resetLinkBtn.disabled = false;
            });
        });
      }

      modalActions(modal, close, 'Lưu link', function () {
        return postJson(API.link, { key: key, value: input.value }).then(function (data) {
          target.setAttribute('href', data.value);
          target.setAttribute('data-ce-overridden', '1');
          toast('Đã lưu link.', 'ok');
        });
      }, resetLinkBtn);
    });
  }

  /* ------------------------------------------------ cài đặt trang (tiêu đề SEO) */

  function openSeoDialog() {
    if (!PAGE.seo || !PAGE.seo.length) {
      toast('Trang này chưa khai báo ô cài đặt SEO.', 'info');
      return;
    }

    openModal(function (modal, close) {
      modal.appendChild(el('h3', null, 'Cài đặt trang'));
      modal.appendChild(el('p', 'ce-modal-hint',
        'Những nội dung này không hiện trên trang mà nằm trong thẻ <head> — dùng cho tab '
        + 'trình duyệt, Google và ảnh xem trước khi chia sẻ lên Facebook/Zalo.'));

      var fields = PAGE.seo.map(function (field) {
        var label = el('label', null, field.label);
        var input = field.multiline
          ? document.createElement('textarea')
          : document.createElement('input');
        if (field.multiline) input.rows = 3; else input.type = 'text';
        input.value = field.value || '';
        label.appendChild(input);
        modal.appendChild(label);
        return { key: field.key, input: input };
      });

      modalActions(modal, close, 'Lưu', function () {
        return Promise.all(fields.map(function (field) {
          return postJson(API.text, { key: field.key, value: field.input.value });
        })).then(function () {
          toast('Đã lưu cài đặt trang.', 'ok');
        });
      });
    });
  }

  /* ----------------------------------------------------------------- lưu */

  function saveAll() {
    var keys = Object.keys(dirtyText);
    if (!keys.length || saving) return Promise.resolve();

    saving = true;
    refreshStatus();

    var failures = [];

    return keys.reduce(function (chain, key) {
      return chain.then(function () {
        var node = dirtyText[key];
        var value = currentText(node);
        return postJson(API.text, { key: key, value: value })
          .then(function () {
            node.__ceOriginal = value;
            node.setAttribute('data-ce-overridden', '1');
            markDirty(node, false);
          })
          .catch(function (err) {
            failures.push(err.message);
          });
      });
    }, Promise.resolve()).then(function () {
      saving = false;
      refreshStatus();
      if (failures.length) {
        toast('Không lưu được ' + failures.length + ' ô: ' + failures[0], 'error');
      } else {
        toast('Đã lưu tất cả thay đổi.', 'ok');
      }
    });
  }

  function resetFocusedText() {
    var node = focusedText;
    if (!node) return;
    var key = node.getAttribute('data-ce-key');
    var defaultText = node.getAttribute('data-ce-default') || '';

    postJson(API.reset, { key: key })
      .then(function () {
        node.innerText = defaultText;
        node.__ceOriginal = defaultText;
        node.setAttribute('data-ce-overridden', '0');
        markDirty(node, false);
        toast('Đã khôi phục nội dung mặc định.', 'ok');
        queueReposition();
      })
      .catch(function (err) { toast(err.message, 'error'); });
  }

  /* ------------------------------------------------------- điều hướng / thoát */

  function urlWithoutEditMode() {
    var url = new URL(window.location.href);
    url.searchParams.delete('edit');
    return url.pathname + (url.search ? url.search : '') + url.hash;
  }

  function reloadKeepingEditMode() {
    window.__ceLeaving = true;
    window.location.reload();
  }

  function exitEditMode() {
    window.__ceLeaving = true;
    window.location.href = urlWithoutEditMode();
  }

  /* ----------------------------------------------------------- thanh công cụ */

  function addPanelToggle(container, selector, label) {
    var panel = document.querySelector(selector);
    if (!panel || !panel.querySelector('[data-ce-key]')) return;

    var button = el('button', 'ce-btn', label);
    button.type = 'button';
    button.addEventListener('click', function () {
      panel.classList.toggle('open');
      queueReposition();
    });
    container.appendChild(button);
  }

  function buildBar(textCount, imageCount, linkCount) {
    bar = el('div', 'ce-bar');

    var title = el('div', 'ce-bar-title');
    title.appendChild(el('span', 'ce-bar-dot'));
    title.appendChild(el('span', null, 'Đang sửa nội dung'));
    bar.appendChild(title);

    statusEl = el('span', 'ce-bar-status', '');
    bar.appendChild(statusEl);

    bar.appendChild(el('span', 'ce-bar-status',
      textCount + ' ô chữ · ' + imageCount + ' ảnh · ' + linkCount + ' link'));

    bar.appendChild(el('div', 'ce-bar-spacer'));

    // Hộp chat và form tư vấn bình thường bị ẩn tới khi khách bấm nút, nên chữ bên trong chúng
    // không thể sửa nếu không có cách mở ra. Hai nút này chỉ hiện trong chế độ sửa.
    addPanelToggle(bar, '#chatPanel', 'Hộp chat');
    addPanelToggle(bar, '#contactOverlay', 'Form tư vấn');

    var seoBtn = el('button', 'ce-btn', 'Cài đặt trang');
    seoBtn.type = 'button';
    seoBtn.addEventListener('click', openSeoDialog);
    bar.appendChild(seoBtn);

    resetBtn = el('button', 'ce-btn', 'Khôi phục ô đang chọn');
    resetBtn.type = 'button';
    // mousedown thay vì click: click xảy ra sau blur nên lúc đó đã mất ô đang chọn.
    resetBtn.addEventListener('mousedown', function (event) {
      event.preventDefault();
      resetFocusedText();
    });
    bar.appendChild(resetBtn);

    var exitBtn = el('button', 'ce-btn', 'Thoát');
    exitBtn.type = 'button';
    exitBtn.addEventListener('click', function () {
      if (dirtyCount > 0) {
        openModal(function (modal, close) {
          modal.appendChild(el('h3', null, 'Còn thay đổi chưa lưu'));
          modal.appendChild(el('p', 'ce-modal-hint',
            'Bạn có ' + dirtyCount + ' ô đã sửa nhưng chưa lưu. Thoát bây giờ sẽ mất những thay đổi đó.'));

          var discard = el('button', 'ce-modal-btn ce-modal-btn-danger', 'Thoát, bỏ thay đổi');
          discard.type = 'button';
          discard.addEventListener('click', function () {
            dirtyCount = 0;
            exitEditMode();
          });

          modalActions(modal, close, 'Lưu rồi thoát', function () {
            return saveAll().then(exitEditMode);
          }, discard);
        });
        return;
      }
      exitEditMode();
    });
    bar.appendChild(exitBtn);

    saveBtn = el('button', 'ce-btn ce-btn-primary', 'Lưu thay đổi');
    saveBtn.type = 'button';
    saveBtn.addEventListener('click', function () { saveAll(); });
    bar.appendChild(saveBtn);

    document.body.appendChild(bar);
  }

  /* ------------------------------------------------------------------ khởi động */

  function init() {
    document.body.classList.add('ce-on');

    var textCount = setupTextNodes();
    var imageCount = document.querySelectorAll('[data-ce-img]').length;
    var linkCount = document.querySelectorAll('[data-ce-link]').length;

    buildBar(textCount, imageCount, linkCount);
    buildMarkers();
    refreshStatus();

    // Trong lúc sửa, mọi link/nút trên trang bị vô hiệu hoá: bấm vào chữ trong một thẻ <a>
    // phải là sửa chữ đó, không phải nhảy trang. Dùng capture để chặn trước cả handler của
    // main.js (mở modal tư vấn, dropdown menu...).
    document.addEventListener('click', function (event) {
      // data-ce-allow: link được phép bấm kể cả trong chế độ sửa (ví dụ link sang trang Cài đặt).
      if (event.target.closest('.ce-bar, .ce-modal-backdrop, .ce-marker, .ce-toast, [data-ce-allow]')) return;
      var interactive = event.target.closest('a[href], button, [data-open-contact]');
      if (!interactive) return;
      event.preventDefault();
      event.stopPropagation();
      if (interactive.matches('a[href]') && !event.target.closest('[data-ce-key]')) {
        toast('Đang ở chế độ sửa nên link không mở. Bấm "Thoát" để duyệt web bình thường.', 'info');
      }
    }, true);

    document.addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveAll();
      }
    });

    window.addEventListener('scroll', queueReposition, { passive: true });
    window.addEventListener('resize', queueReposition);
    // Ảnh và font tải xong làm layout dịch chuyển -> đặt lại vị trí các nút phủ.
    window.addEventListener('load', queueReposition);
    if (window.ResizeObserver) {
      new ResizeObserver(queueReposition).observe(document.body);
    }

    window.addEventListener('beforeunload', function (event) {
      if (dirtyCount > 0 && !window.__ceLeaving) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    });

    if (textCount === 0 && imageCount === 0 && linkCount === 0) {
      toast('Trang này chưa được gắn nội dung sửa được.', 'info');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
