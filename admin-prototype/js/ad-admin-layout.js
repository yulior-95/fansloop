/**
 * 广告管理后台 · 共享布局辅助（分页、角色切换）
 */
(function (global) {
    var AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face';

    function bindRoleSelect(selectId) {
        var sel = document.getElementById(selectId);
        if (!sel) return;
        sel.value = localStorage.getItem('fl_ad_admin_role') || 'operator';
        sel.onchange = function () {
            localStorage.setItem('fl_ad_admin_role', sel.value);
            if (global.AdminModal && AdminModal.toast) AdminModal.toast('原型角色：' + sel.value);
        };
    }

    function renderPager(containerId, total, opts) {
        if (!global.AdminPager) return;
        var el = document.getElementById(containerId);
        if (!el) return;
        if (!el._adPager) {
            el._adPager = AdminPager.create({ mount: el, pageSize: (opts && opts.pageSize) || 10, onChange: function () {} });
        }
        el._adPager.setTotal(total || 0);
    }

    function bindSwitch(root, selector) {
        var scope = root || document;
        scope.querySelectorAll(selector || '.ad-switch[data-switch]').forEach(function (sw) {
            sw.onclick = function () {
                sw.classList.toggle('on');
                sw.setAttribute('aria-checked', sw.classList.contains('on') ? 'true' : 'false');
            };
        });
    }

    global.AdAdminLayout = {
        AVATAR: AVATAR,
        bindRoleSelect: bindRoleSelect,
        renderPager: renderPager,
        bindSwitch: bindSwitch
    };
})(typeof window !== 'undefined' ? window : this);
