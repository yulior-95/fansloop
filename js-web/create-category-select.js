/**
 * 创作页 · 内容类别选择（图文动态 / 视频作品）
 *
 * 抽屉单选，必须选到三级叶子；类目树由后台「平台内容类别管理」维护。
 * 发布时提交 category_id（三级）+ primary_category（一级，用于发现页 Tab 聚合）。
 */
(function (global) {
    var TX = global.FL_CONTENT_TAXONOMY;
    if (!TX) return;

    var LS_PREFIX = 'fl_cr_category_';
    var picked = { image: null, video: null };
    var activeType = null;
    var draft = { l1: null, l2: null, l3: null };
    var keyword = '';

    var drawer, colL1, colL2, colL3, resultsEl, searchInput, previewEl, confirmBtn;

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function read(type) {
        try {
            var id = localStorage.getItem(LS_PREFIX + type);
            return id && TX.isLeaf(id) ? id : null;
        } catch (e) {
            return null;
        }
    }

    function write(type, id) {
        try {
            if (id) localStorage.setItem(LS_PREFIX + type, id);
            else localStorage.removeItem(LS_PREFIX + type);
        } catch (e) { /* ignore */ }
    }

    function enabledChildren(id) {
        return TX.getChildren(id).filter(function (n) { return n.enabled !== false; });
    }

    function renderTrigger(type) {
        var btn = document.querySelector('.cat-trigger[data-cat-type="' + type + '"]');
        if (!btn) return;
        var id = picked[type];
        var path = id ? TX.getPath(id) : null;
        var valEl = btn.querySelector('.cat-trigger-val');
        var pathEl = btn.querySelector('.cat-trigger-path');
        if (!path) {
            btn.classList.add('is-empty');
            valEl.textContent = '选择内容类别（需精确到三级）';
            pathEl.textContent = '决定内容出现在发现页哪个频道';
            return;
        }
        btn.classList.remove('is-empty', 'is-invalid');
        valEl.textContent = path[2].name;
        pathEl.textContent = path[0].icon + ' ' + path.map(function (n) { return n.name; }).join(' / ');
    }

    function renderAllTriggers() {
        ['image', 'video'].forEach(renderTrigger);
    }

    function optHtml(node, level, activeId, isLeafLevel) {
        var cls = 'cd-opt' + (node.id === activeId ? ' is-active' : '');
        return (
            '<button type="button" class="' + cls + '" data-cd-pick="' + esc(node.id) + '" data-level="' + level + '">' +
            (level === 1 ? '<span class="ico">' + esc(node.icon || '📁') + '</span>' : '') +
            '<span class="nm">' + esc(node.name) + '</span>' +
            (isLeafLevel
                ? '<i class="fa-solid fa-check tick"></i>'
                : '<i class="fa-solid fa-chevron-right arrow"></i>') +
            '</button>'
        );
    }

    function emptyHtml(text) {
        return '<div class="cd-empty">' + text + '</div>';
    }

    function renderColumns() {
        var l1List = TX.getLevel1().filter(function (n) { return !n.system; });
        colL1.innerHTML =
            '<div class="cd-col-title">一级类目</div>' +
            (l1List.length
                ? l1List.map(function (n) { return optHtml(n, 1, draft.l1, false); }).join('')
                : emptyHtml('运营尚未配置类目'));

        var l2List = draft.l1 ? enabledChildren(draft.l1) : [];
        colL2.innerHTML =
            '<div class="cd-col-title">二级类目</div>' +
            (draft.l1
                ? (l2List.length
                    ? l2List.map(function (n) { return optHtml(n, 2, draft.l2, false); }).join('')
                    : emptyHtml('该类目下暂无二级类目'))
                : emptyHtml('请先选择左侧一级类目'));

        var l3List = draft.l2 ? enabledChildren(draft.l2) : [];
        colL3.innerHTML =
            '<div class="cd-col-title">三级类目 · 单选</div>' +
            (draft.l2
                ? (l3List.length
                    ? l3List.map(function (n) { return optHtml(n, 3, draft.l3, true); }).join('')
                    : emptyHtml('该类目下暂无三级类目'))
                : emptyHtml('请先选择二级类目'));
    }

    function renderResults() {
        var hits = TX.searchLeaves(keyword);
        if (!hits.length) {
            resultsEl.innerHTML = emptyHtml('没有匹配「' + esc(keyword) + '」的三级类目<br>试试更短的关键词');
            return;
        }
        resultsEl.innerHTML = hits
            .slice(0, 60)
            .map(function (item) {
                var cls = 'cd-result' + (item.node.id === draft.l3 ? ' is-active' : '');
                return (
                    '<button type="button" class="' + cls + '" data-cd-leaf="' + esc(item.node.id) + '">' +
                    esc(item.node.name) +
                    '<span class="rp">' + esc(item.path[0].icon) + ' ' + esc(item.path.map(function (n) { return n.name; }).join(' / ')) + '</span>' +
                    '</button>'
                );
            })
            .join('');
    }

    function renderPreview() {
        var ready = !!draft.l3;
        previewEl.innerHTML = ready
            ? '已选择：<b>' + esc(TX.getPathLabel(draft.l3)) + '</b>'
            : '尚未选择 · 需选到<b>三级类目</b>才能发布';
        confirmBtn.disabled = !ready;
        confirmBtn.style.opacity = ready ? '' : '0.5';
    }

    function render() {
        var searching = !!keyword;
        colL1.hidden = searching;
        colL2.hidden = searching;
        colL3.hidden = searching;
        resultsEl.hidden = !searching;
        if (searching) renderResults();
        else renderColumns();
        renderPreview();
    }

    function setDraftFromLeaf(leafId) {
        var path = leafId && TX.getPath(leafId);
        if (path && path.length === 3) {
            draft = { l1: path[0].id, l2: path[1].id, l3: path[2].id };
        } else {
            draft = { l1: null, l2: null, l3: null };
        }
    }

    function open(type) {
        if (!drawer) return;
        activeType = type;
        keyword = '';
        if (searchInput) searchInput.value = '';
        setDraftFromLeaf(picked[type]);
        var label = drawer.querySelector('#catDrawerScope');
        if (label) label.textContent = type === 'video' ? '视频作品' : '图文动态';
        drawer.classList.add('show');
        drawer.setAttribute('aria-hidden', 'false');
        render();
    }

    function close() {
        drawer.classList.remove('show');
        drawer.setAttribute('aria-hidden', 'true');
        activeType = null;
    }

    function onPick(e) {
        var leafBtn = e.target.closest('[data-cd-leaf]');
        if (leafBtn) {
            setDraftFromLeaf(leafBtn.getAttribute('data-cd-leaf'));
            renderResults();
            renderPreview();
            return;
        }
        var btn = e.target.closest('[data-cd-pick]');
        if (!btn) return;
        var level = parseInt(btn.getAttribute('data-level'), 10);
        var id = btn.getAttribute('data-cd-pick');
        if (level === 1) {
            draft.l1 = id;
            draft.l2 = null;
            draft.l3 = null;
        } else if (level === 2) {
            draft.l2 = id;
            draft.l3 = null;
        } else {
            draft.l3 = id;
        }
        render();
    }

    function mount() {
        drawer = document.getElementById('catPickerDrawer');
        if (!drawer) return;
        colL1 = document.getElementById('catColL1');
        colL2 = document.getElementById('catColL2');
        colL3 = document.getElementById('catColL3');
        resultsEl = document.getElementById('catSearchResults');
        searchInput = document.getElementById('catDrawerSearch');
        previewEl = document.getElementById('catDrawerPreview');
        confirmBtn = document.getElementById('catDrawerConfirm');

        picked.image = read('image');
        picked.video = read('video');
        renderAllTriggers();

        document.addEventListener('click', function (e) {
            var trigger = e.target.closest('.cat-trigger[data-cat-type]');
            if (trigger) open(trigger.getAttribute('data-cat-type'));
        });

        drawer.addEventListener('click', function (e) {
            if (e.target === drawer) close();
        });
        document.getElementById('catDrawerClose')?.addEventListener('click', close);
        document.getElementById('catDrawerClear')?.addEventListener('click', function () {
            draft = { l1: null, l2: null, l3: null };
            keyword = '';
            if (searchInput) searchInput.value = '';
            render();
        });
        confirmBtn?.addEventListener('click', function () {
            if (!draft.l3 || !activeType) return;
            picked[activeType] = draft.l3;
            write(activeType, draft.l3);
            renderTrigger(activeType);
            if (global.crShowToast) global.crShowToast('内容类别已设为「' + TX.getPathLabel(draft.l3) + '」');
            close();
        });
        [colL1, colL2, colL3, resultsEl].forEach(function (el) {
            if (el) el.addEventListener('click', onPick);
        });
        searchInput?.addEventListener('input', function () {
            keyword = String(searchInput.value || '').trim();
            render();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && drawer.classList.contains('show')) close();
        });

        TX.onChange(function () {
            ['image', 'video'].forEach(function (t) {
                if (picked[t] && !TX.isLeaf(picked[t])) {
                    picked[t] = null;
                    write(t, null);
                }
            });
            renderAllTriggers();
            if (drawer.classList.contains('show')) render();
        });
    }

    global.FL_CreateCategory = {
        /** 三级叶子 id */
        get: function (type) { return picked[type] || null; },
        /** 一级 id，落库 primary_category */
        getRoot: function (type) {
            return picked[type] ? TX.rootIdOf(picked[type]) : null;
        },
        getLabel: function (type) {
            return picked[type] ? TX.getPathLabel(picked[type]) : '';
        },
        set: function (type, leafId) {
            if (leafId && !TX.isLeaf(leafId)) return false;
            picked[type] = leafId || null;
            write(type, picked[type]);
            renderTrigger(type);
            return true;
        },
        /** 发布前校验：未选中时高亮入口并滚动定位 */
        validate: function (type) {
            if (picked[type]) return true;
            var btn = document.querySelector('.cat-trigger[data-cat-type="' + type + '"]');
            if (btn) {
                btn.classList.add('is-invalid');
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        },
        open: open
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})(window);
