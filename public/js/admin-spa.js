(function () {
  var contentEl = document.getElementById('adminContent');
  if (!contentEl) return;

  function closeLiveConnection() {
    if (window.__adminSSE) {
      window.__adminSSE.close();
      window.__adminSSE = null;
    }
  }

  function runContentScripts(container) {
    container.querySelectorAll('script').forEach(function (oldScript) {
      var newScript = document.createElement('script');
      Array.prototype.forEach.call(oldScript.attributes, function (attr) {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });
  }

  function swapFromHtml(html, url, push) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var newContent = doc.getElementById('adminContent');

    if (!newContent) {
      window.location.href = url;
      return;
    }

    var newSidebar = doc.getElementById('adminSidebar');
    var newTitleEl = doc.getElementById('adminTopbarTitle');

    document.getElementById('adminContent').innerHTML = newContent.innerHTML;
    if (newSidebar) document.getElementById('adminSidebar').innerHTML = newSidebar.innerHTML;
    if (newTitleEl) document.getElementById('adminTopbarTitle').textContent = newTitleEl.textContent;
    document.title = doc.title;

    if (push !== false) history.pushState({ adminSpa: true }, '', url);
    runContentScripts(document.getElementById('adminContent'));
    window.scrollTo(0, 0);
  }

  async function navigate(url, options) {
    options = options || {};
    closeLiveConnection();
    try {
      var res = await fetch(url, {
        method: options.method || 'GET',
        body: options.body,
        headers: options.headers,
      });
      var html = await res.text();
      swapFromHtml(html, res.url, options.push);
    } catch (e) {
      window.location.href = url;
    }
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var link = e.target.closest('a');
    if (!link || !link.href || link.target === '_blank') return;
    var fromSidebar = link.closest('#adminSidebar');
    if (!(fromSidebar || link.closest('#adminContent'))) return;

    var url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname.indexOf('/admin') !== 0) return;

    e.preventDefault();
    if (fromSidebar) {
      document.getElementById('adminSidebar')?.classList.remove('open');
      document.getElementById('sidebarBackdrop')?.classList.remove('open');
    }
    navigate(url.pathname + url.search);
  });

  document.addEventListener('submit', function (e) {
    if (e.defaultPrevented) return;

    var form = e.target;
    if (!form.closest('#adminContent')) return;

    var url = new URL(form.getAttribute('action') || window.location.pathname, window.location.href);
    if (url.pathname.indexOf('/admin') !== 0) return;

    e.preventDefault();

    var method = (form.getAttribute('method') || 'GET').toUpperCase();

    // GET không có body — dữ liệu form (vd ô tìm kiếm) phải nằm trong query string của URL,
    // nhồi vào body như POST sẽ khiến fetch() báo lỗi (GET/HEAD không được có body) và mất luôn
    // từ khoá vì rơi về fallback tải lại trang không kèm query.
    if (method === 'GET') {
      var params = new URLSearchParams(new FormData(form));
      navigate(url.pathname + '?' + params.toString());
      return;
    }

    var isMultipart = form.enctype === 'multipart/form-data';
    var body;
    var headers = {};

    if (isMultipart) {
      body = new FormData(form);
    } else {
      body = new URLSearchParams(new FormData(form));
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    navigate(url.pathname, { method: method, body: body, headers: headers });
  });

  window.addEventListener('popstate', function () {
    navigate(window.location.pathname + window.location.search, { push: false });
  });
})();

(function () {
  var input = document.getElementById('adminSearchInput');
  var box = document.getElementById('adminSearchBox');
  var resultsEl = document.getElementById('adminSearchResults');
  if (!input || !box || !resultsEl) return;

  var debounceTimer = null;
  var currentRequestId = 0;

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderResults(results) {
    if (results.length === 0) {
      resultsEl.innerHTML = '<div class="admin-search-empty">Không tìm thấy kết quả</div>';
      return;
    }
    var groups = {};
    var order = [];
    results.forEach(function (r) {
      if (!groups[r.type]) { groups[r.type] = []; order.push(r.type); }
      groups[r.type].push(r);
    });
    var html = '';
    order.forEach(function (type) {
      html += '<div class="admin-search-group-title">' + escapeHtml(type) + '</div>';
      groups[type].forEach(function (r) {
        html += '<a class="admin-search-result" href="' + r.url + '">' + escapeHtml(r.title) + '</a>';
      });
    });
    resultsEl.innerHTML = html;
  }

  function runSearch(q) {
    var requestId = ++currentRequestId;
    fetch('/admin/search?q=' + encodeURIComponent(q))
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (requestId !== currentRequestId) return;
        renderResults(data.results || []);
        box.classList.add('open');
      })
      .catch(function () {
        if (requestId !== currentRequestId) return;
        resultsEl.innerHTML = '<div class="admin-search-empty">Có lỗi khi tìm kiếm</div>';
        box.classList.add('open');
      });
  }

  input.addEventListener('input', function () {
    var q = input.value.trim();
    clearTimeout(debounceTimer);
    if (q.length < 2) {
      box.classList.remove('open');
      resultsEl.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(function () { runSearch(q); }, 300);
  });

  input.addEventListener('focus', function () {
    if (resultsEl.innerHTML) box.classList.add('open');
  });

  document.addEventListener('click', function (e) {
    if (!box.contains(e.target)) box.classList.remove('open');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') box.classList.remove('open');
  });
})();
