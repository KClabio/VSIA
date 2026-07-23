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
    if (!(link.closest('#adminSidebar') || link.closest('#adminContent'))) return;

    var url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname.indexOf('/admin') !== 0) return;

    e.preventDefault();
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
