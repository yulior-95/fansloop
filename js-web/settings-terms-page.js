/**
 * 条款与协议 · 文档切换 / 搜索高亮 / 章节折叠 / 下载
 */
(function () {
    var DOCS = ['service', 'privacy', 'creator', 'community', 'cookie'];
    var activeDoc = 'service';

    var toastEl = document.getElementById('termsToast');
    var searchInput = document.getElementById('termsSearch');
    var downloadBtn = document.getElementById('termsDownload');

    function toast(msg, type) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.className = 'ab-toast show' + (type === 'err' ? ' err' : ' ok');
        clearTimeout(toast._tm);
        toast._tm = setTimeout(function () {
            toastEl.classList.remove('show');
        }, 2600);
    }

    function resolveDocFromHash() {
        var hash = (location.hash || '').replace(/^#/, '');
        if (hash && DOCS.indexOf(hash) >= 0) return hash;
        return 'service';
    }

    function switchDoc(docId, pushHash) {
        if (DOCS.indexOf(docId) < 0) docId = 'service';
        activeDoc = docId;

        document.querySelectorAll('.terms-doc-item').forEach(function (el) {
            el.classList.toggle('active', el.getAttribute('data-doc') === docId);
        });
        document.querySelectorAll('.terms-doc-panel').forEach(function (el) {
            el.classList.toggle('active', el.getAttribute('data-doc-panel') === docId);
        });

        if (pushHash !== false) {
            var next = '#' + docId;
            if (location.hash !== next) history.replaceState(null, '', next);
        }

        if (searchInput && searchInput.value.trim()) applySearch(searchInput.value.trim());
        else {
            clearSearchHighlight();
            var panel = document.querySelector('.terms-doc-panel[data-doc-panel="' + docId + '"]');
            if (panel) {
                panel.querySelectorAll('.terms-sec').forEach(function (sec, i) {
                    sec.classList.toggle('open', i === 0);
                });
            }
        }
    }

    function toggleSection(sec) {
        var wasOpen = sec.classList.contains('open');
        sec.classList.toggle('open', !wasOpen);
    }

    function bindSections() {
        document.querySelectorAll('.terms-sec-head').forEach(function (head) {
            head.setAttribute('role', 'button');
            head.setAttribute('tabindex', '0');
            head.addEventListener('click', function () {
                toggleSection(head.closest('.terms-sec'));
            });
            head.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection(head.closest('.terms-sec'));
                }
            });
        });
    }

    function bindDocNav() {
        document.querySelectorAll('.terms-doc-item').forEach(function (el) {
            function pick() { switchDoc(el.getAttribute('data-doc')); }
            el.addEventListener('click', pick);
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    pick();
                }
            });
        });
    }

    function escRe(s) {
        return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlightText(node, query) {
        if (!node || !query) return;
        var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
        var texts = [];
        while (walker.nextNode()) texts.push(walker.currentNode);
        texts.forEach(function (textNode) {
            var val = textNode.nodeValue;
            if (!val || val.indexOf(query) < 0) return;
            var re = new RegExp('(' + escRe(query) + ')', 'gi');
            var span = document.createElement('span');
            span.innerHTML = val.replace(re, '<mark>$1</mark>');
            textNode.parentNode.replaceChild(span, textNode);
        });
    }

    function clearSearchHighlight() {
        document.querySelectorAll('.terms-sec-body mark').forEach(function (mark) {
            var parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
        document.querySelectorAll('.terms-sec.hidden-by-search').forEach(function (el) {
            el.classList.remove('hidden-by-search');
        });
        var empty = document.getElementById('termsSearchEmpty');
        if (empty) empty.hidden = true;
    }

    function applySearch(query) {
        clearSearchHighlight();
        if (!query) return;

        var panel = document.querySelector('.terms-doc-panel.active');
        if (!panel) return;

        var sections = panel.querySelectorAll('.terms-sec');
        var visible = 0;

        sections.forEach(function (sec) {
            var body = sec.querySelector('.terms-sec-body');
            var text = body ? body.textContent : '';
            var match = text.toLowerCase().indexOf(query.toLowerCase()) >= 0;
            sec.classList.toggle('hidden-by-search', !match);
            if (match) {
                visible++;
                sec.classList.add('open');
                highlightText(body, query);
            }
        });

        var empty = document.getElementById('termsSearchEmpty');
        if (empty) empty.hidden = visible > 0;
    }

    function downloadDoc() {
        var panel = document.querySelector('.terms-doc-panel.active');
        if (!panel) return;
        var title = panel.querySelector('.terms-doc-hd h3');
        var sections = panel.querySelectorAll('.terms-sec:not(.hidden-by-search)');
        var lines = [(title ? title.textContent : 'FansLoop 协议') + '\n', '导出时间：' + new Date().toLocaleString('zh-CN'), ''];
        sections.forEach(function (sec) {
            var ti = sec.querySelector('.terms-sec-head .ti');
            var body = sec.querySelector('.terms-sec-body');
            if (ti) lines.push('## ' + ti.textContent);
            if (body) lines.push(body.textContent.trim());
            lines.push('');
        });
        var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'fansloop-' + activeDoc + '.txt';
        a.click();
        URL.revokeObjectURL(a.href);
        toast('协议已导出为文本文件', 'ok');
    }

    if (searchInput) {
        var searchTm;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTm);
            var q = searchInput.value.trim();
            searchTm = setTimeout(function () {
                if (!q) clearSearchHighlight();
                else applySearch(q);
            }, 200);
        });
    }

    if (downloadBtn) downloadBtn.addEventListener('click', downloadDoc);

    bindDocNav();
    bindSections();
    switchDoc(resolveDocFromHash(), false);
    window.addEventListener('hashchange', function () {
        switchDoc(resolveDocFromHash(), false);
    });

    document.querySelectorAll('.terms-doc-panel.active .terms-sec').forEach(function (sec, i) {
        if (i === 0) sec.classList.add('open');
    });
})();
