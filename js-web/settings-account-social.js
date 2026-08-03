/**
 * 设置 · 编辑资料 · 外链账号（绑定 / 编辑 / 解绑 / 新增）
 */
(function (global) {
    var STORAGE_KEY = 'fl_social_links_v1';
    var MAX_LINKS = 5;

    var PLATFORMS = {
        twitter: { name: 'X (Twitter)', icon: 'fa-brands fa-x-twitter', bg: '#1DA1F2', placeholder: 'https://x.com/username' },
        instagram: { name: 'Instagram', icon: 'fa-brands fa-instagram', bg: 'linear-gradient(135deg,#C13584,#FD1D1D,#F77737)', placeholder: '@username 或主页链接' },
        youtube: { name: 'YouTube', icon: 'fa-brands fa-youtube', bg: '#FF0000', placeholder: '@channel 或频道链接' },
        tiktok: { name: 'TikTok', icon: 'fa-brands fa-tiktok', bg: '#010101', placeholder: '@username' },
        telegram: { name: 'Telegram', icon: 'fa-brands fa-telegram', bg: '#229ED9', placeholder: 'https://t.me/username' },
        discord: { name: 'Discord', icon: 'fa-brands fa-discord', bg: '#5865F2', placeholder: 'https://discord.gg/invite' },
        github: { name: 'GitHub', icon: 'fa-brands fa-github', bg: '#24292f', placeholder: 'https://github.com/username' },
        website: { name: '个人网站', icon: 'fa-solid fa-link', bg: 'rgba(168,85,247,0.35)', placeholder: 'https://your-site.com' }
    };

    var DEFAULT_LINKS = [
        { id: 'sl_1', platform: 'twitter', value: 'https://x.com/luna_creator' },
        { id: 'sl_2', platform: 'instagram', value: '@lunamoon.travel' },
        { id: 'sl_3', platform: 'youtube', value: '@LunaTravels' }
    ];

    var listEl = document.getElementById('socialLinksList');
    var ovl = document.getElementById('ovlSocialLink');
    var platformField = document.getElementById('socialPlatformField');
    var platformSelect = document.getElementById('socialPlatformSelect');
    var inputEl = document.getElementById('socialLinkInput');
    var titleEl = document.getElementById('socialModalTitle');
    var hintEl = document.getElementById('socialLinkHint');
    var btnSave = document.getElementById('btnSocialSave');
    var btnCancel = document.getElementById('btnSocialCancel');
    var btnUnbind = document.getElementById('btnSocialUnbind');
    var btnClose = document.getElementById('closeSocialLink');
    var toastEl = document.getElementById('settingsAccountToast');

    if (!listEl || !ovl) return;

    var state = { links: [], mode: 'add', editingId: null };

    function storageKey() {
        var uid = global.GoodfansAuth && global.GoodfansAuth.getUserId ? global.GoodfansAuth.getUserId() : '';
        return uid ? STORAGE_KEY + '_' + uid : STORAGE_KEY;
    }

    function toast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toast._tm);
        toast._tm = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
    }

    function load() {
        try {
            var raw = localStorage.getItem(storageKey());
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return DEFAULT_LINKS.map(function (l) { return Object.assign({}, l); });
    }

    function save() {
        try {
            localStorage.setItem(storageKey(), JSON.stringify(state.links));
        } catch (e) { /* ignore */ }
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function platformMeta(key) {
        return PLATFORMS[key] || PLATFORMS.website;
    }

    function usedPlatforms() {
        return state.links.map(function (l) { return l.platform; });
    }

    function fillPlatformSelect(excludeId) {
        if (!platformSelect) return;
        var used = usedPlatforms();
        var current = null;
        if (excludeId) {
            var row = state.links.find(function (l) { return l.id === excludeId; });
            current = row ? row.platform : null;
        }
        platformSelect.innerHTML = '';
        Object.keys(PLATFORMS).forEach(function (key) {
            if (used.indexOf(key) >= 0 && key !== current) return;
            var p = PLATFORMS[key];
            var opt = document.createElement('option');
            opt.value = key;
            opt.textContent = p.name;
            platformSelect.appendChild(opt);
        });
    }

    function updateHint() {
        if (!hintEl || !platformSelect) return;
        var p = platformMeta(platformSelect.value);
        hintEl.textContent = '示例：' + p.placeholder;
        if (inputEl) inputEl.placeholder = p.placeholder;
    }

    function render() {
        var html = '';
        state.links.forEach(function (link) {
            var p = platformMeta(link.platform);
            html +=
                '<div class="sl-row" data-link-id="' + esc(link.id) + '">' +
                '<div class="sl-ic" style="background:' + p.bg + '"><i class="' + p.icon + '"></i></div>' +
                '<div class="sl-info"><div class="n">' + esc(p.name) + '</div><div class="h">' + esc(link.value) + '</div></div>' +
                '<div class="sl-action">' +
                '<span class="tag tag-success sl-tag-bound">已绑定</span>' +
                '<button type="button" class="btn btn-sm sl-btn-edit" data-action="edit" data-id="' + esc(link.id) + '">编辑</button>' +
                '<button type="button" class="btn btn-sm sl-btn-unbind" data-action="unbind" data-id="' + esc(link.id) + '">解绑</button>' +
                '</div></div>';
        });
        if (state.links.length < MAX_LINKS) {
            html +=
                '<div class="sl-row sl-row-add">' +
                '<div class="sl-ic sl-ic-add"><i class="fa-solid fa-plus"></i></div>' +
                '<div class="sl-info"><div class="n" style="color:var(--t-secondary)">添加外链账号</div>' +
                '<div class="h sl-h-add">支持 Twitter / IG / YouTube / TikTok / Telegram / Discord / GitHub 等</div></div>' +
                '<div class="sl-action">' +
                '<button type="button" class="btn btn-sm btn-primary sl-btn-add" data-action="add"><i class="fa-solid fa-plus"></i> 新增</button>' +
                '</div></div>';
        }
        listEl.innerHTML = html;
    }

    function openModal(mode, id) {
        state.mode = mode;
        state.editingId = id || null;
        var link = id ? state.links.find(function (l) { return l.id === id; }) : null;
        if (titleEl) titleEl.textContent = mode === 'add' ? '新增外链账号' : '编辑外链账号';
        if (platformField) platformField.style.display = mode === 'add' ? '' : 'none';
        if (btnUnbind) btnUnbind.style.display = mode === 'edit' ? '' : 'none';
        if (mode === 'edit' && link) {
            fillPlatformSelect(link.id);
            if (platformSelect) platformSelect.value = link.platform;
            if (inputEl) inputEl.value = link.value;
        } else {
            fillPlatformSelect();
            if (platformSelect && platformSelect.options.length) platformSelect.selectedIndex = 0;
            if (inputEl) inputEl.value = '';
        }
        updateHint();
        ovl.classList.add('show');
        ovl.setAttribute('aria-hidden', 'false');
        if (inputEl) setTimeout(function () { inputEl.focus(); }, 80);
    }

    function closeModal() {
        ovl.classList.remove('show');
        ovl.setAttribute('aria-hidden', 'true');
        state.editingId = null;
    }

    function validateValue(val) {
        val = (val || '').trim();
        if (!val) return { ok: false, message: '请输入链接或账号' };
        if (val.length > 200) return { ok: false, message: '内容过长，请精简' };
        return { ok: true, value: val };
    }

    function onSave() {
        var check = validateValue(inputEl && inputEl.value);
        if (!check.ok) {
            toast(check.message);
            return;
        }
        if (state.mode === 'edit' && state.editingId) {
            state.links = state.links.map(function (l) {
                if (l.id !== state.editingId) return l;
                return Object.assign({}, l, { value: check.value });
            });
            toast('外链已更新');
        } else {
            var platform = platformSelect ? platformSelect.value : 'website';
            state.links.push({
                id: 'sl_' + Date.now(),
                platform: platform,
                value: check.value
            });
            toast('外链已绑定');
        }
        save();
        render();
        closeModal();
    }

    function onUnbind(id) {
        if (!id) id = state.editingId;
        if (!id) return;
        var link = state.links.find(function (l) { return l.id === id; });
        if (!link) return;
        var name = platformMeta(link.platform).name;
        if (!global.confirm('确定解绑「' + name + '」？解绑后主页将不再展示该链接。')) return;
        state.links = state.links.filter(function (l) { return l.id !== id; });
        save();
        render();
        closeModal();
        toast('已解绑 ' + name);
    }

    listEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var action = btn.getAttribute('data-action');
        var id = btn.getAttribute('data-id');
        if (action === 'edit') openModal('edit', id);
        if (action === 'unbind') onUnbind(id);
        if (action === 'add') openModal('add');
    });

    if (platformSelect) {
        platformSelect.addEventListener('change', updateHint);
    }
    if (btnSave) btnSave.addEventListener('click', onSave);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnUnbind) btnUnbind.addEventListener('click', function () { onUnbind(state.editingId); });
    if (ovl) {
        ovl.addEventListener('click', function (e) {
            if (e.target === ovl) closeModal();
        });
    }

    state.links = load();
    render();
})();
