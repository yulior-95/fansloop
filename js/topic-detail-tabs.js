/**
 * 话题详情 · 图文 / 视频 / 正在进行的直播 Tab 切换（Web + H5 共用）
 */
(function (global) {
    function bindTopicDetailTabs(root) {
        root = root || document;
        var tablist = root.querySelector('.td-tabs, .h5-td-tabs');
        if (!tablist) return;

        var tabs = tablist.querySelectorAll('[data-td-tab]');
        var panelsRoot = root.querySelector('#tdTabPanels, #h5TdTabPanels');
        if (!panelsRoot || !tabs.length) return;

        var panels = panelsRoot.querySelectorAll('[data-td-panel]');
        var defaultKey = 'image';

        function activate(key) {
            if (!key) return;
            tabs.forEach(function (tab) {
                var on = tab.getAttribute('data-td-tab') === key;
                tab.classList.toggle('active', on);
                if (tab.getAttribute('role') === 'tab') {
                    tab.setAttribute('aria-selected', on ? 'true' : 'false');
                    tab.setAttribute('tabindex', on ? '0' : '-1');
                }
            });
            panels.forEach(function (panel) {
                panel.hidden = panel.getAttribute('data-td-panel') !== key;
            });
        }

        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                activate(tab.getAttribute('data-td-tab'));
            });
        });

        activate(defaultKey);
    }

    global.FL_bindTopicDetailTabs = bindTopicDetailTabs;
})(typeof window !== 'undefined' ? window : this);
