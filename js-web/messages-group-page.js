/**
 * 粉丝群 / 私域群聊 · 常用语模板（私聊无此能力）
 */
(function () {
    var GROUPS = [
        {
            id: 'vip',
            name: 'VIP 订阅者群',
            members: 128,
            preview: 'Luna：本周专属直播周五 20:00',
            messages: [
                { type: 'day', text: '今天' },
                { from: 'fan', sender: '小鹿', text: '今晚有直播吗？', time: '14:20' },
                { from: 'host', sender: 'Luna 🌙', text: '有的～周五 20:00 群内会发链接，记得打开通知 🔔', time: '14:22' },
                { from: 'fan', sender: 'Nova', text: '上次回放还能看吗', time: '14:25' }
            ]
        },
        {
            id: 'live',
            name: '直播粉丝群',
            members: 892,
            preview: '系统：开播提醒已发送',
            messages: [
                { type: 'day', text: '今天' },
                { from: 'host', sender: 'Luna 🌙', text: '今晚 21:00 富士山夜景直播，订阅者进房有专属机位～', time: '18:00' }
            ]
        },
        {
            id: 'welcome',
            name: '新粉欢迎群',
            members: 2041,
            preview: '你：欢迎加入 FansLoop 家族',
            messages: [
                { from: 'host', sender: 'Luna 🌙', text: '欢迎新朋友们！先看置顶：群规 + 订阅福利说明 👋', time: '昨天' }
            ]
        }
    ];

    var TEMPLATES = {
        welcome: [
            { label: '进群欢迎', text: '欢迎加入！请先阅读置顶群规，订阅者可解锁专属内容与直播通知～' },
            { label: '新粉问候', text: '嗨～感谢关注！有问题随时 @我，工作日 24h 内回复。' }
        ],
        ops: [
            { label: '开播预告', text: '🔴 今晚 21:00 直播「{主题}」，订阅者进房享专属机位，记得开提醒！' },
            { label: '内容更新', text: '本周订阅专属内容已更新，群内粉丝可优先预览链接～' },
            { label: '活动通知', text: '🎁 限时活动：本周订阅享 8 折，详情见主页「订阅」Tab。' }
        ],
        retain: [
            { label: '续费提醒', text: '你的订阅将在 3 天后到期，续费可继续解锁专属内容与群内福利。' },
            { label: '沉默唤醒', text: '好久不见～最近有新作品上线，回来看看有没有喜欢的 ✨' }
        ],
        close: [
            { label: '晚安语', text: '今天先到这里啦，晚安～明天群内见 🌙' },
            { label: '群规提醒', text: '请勿广告/外链/私加微信，违规将移出群聊，感谢配合。' }
        ]
    };

    var state = { groupId: 'vip', tplCat: 'welcome', tplOpen: false };

    var el = {};

    function $(id) { return document.getElementById(id); }

    function toast(msg) {
        var t = $('grpToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(t._tm);
        t._tm = setTimeout(function () { t.classList.remove('show'); }, 2200);
    }

    function findGroup(id) {
        for (var i = 0; i < GROUPS.length; i++) {
            if (GROUPS[i].id === id) return GROUPS[i];
        }
        return null;
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function renderGroupList() {
        if (!el.groupList) return;
        el.groupList.innerHTML = GROUPS.map(function (g) {
            var cls = 'thread-row' + (g.id === state.groupId ? ' active' : '');
            return '<div class="' + cls + '" data-id="' + g.id + '">' +
                '<div class="av" style="background:linear-gradient(135deg,#A855F7,#EC4899);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px"><i class="fa-solid fa-users"></i></div>' +
                '<div class="info"><div class="top"><div class="name">' + esc(g.name) + '</div><div class="time">' + g.members + ' 人</div></div>' +
                '<div class="pre">' + esc(g.preview) + '</div>' +
                '<div class="meta"><span class="grp-badge">私域</span></div></div></div>';
        }).join('');
    }

    function renderMsg(m) {
        if (m.type === 'day') return '<div class="day-sep"><span>' + esc(m.text) + '</span></div>';
        var host = m.from === 'host';
        return '<div class="msg-row grp' + (host ? ' host' : '') + '">' +
            (host ? '' : '<div class="av" style="background-image:url(https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80)"></div>') +
            '<div class="group"><div class="sender">' + esc(m.sender) + (host ? ' <i class="fa-solid fa-crown" style="font-size:9px;color:#FBBF24"></i>' : '') + '</div>' +
            '<div class="bub">' + esc(m.text) + '</div><div class="msg-time">' + esc(m.time) + '</div></div></div>';
    }

    function renderMessages() {
        var g = findGroup(state.groupId);
        if (!el.msgList || !g) return;
        el.msgList.innerHTML = g.messages.map(renderMsg).join('');
        el.msgList.scrollTop = el.msgList.scrollHeight;
        if (el.headName) el.headName.textContent = g.name;
        if (el.headStatus) el.headStatus.textContent = g.members + ' 位成员 · 仅群主可发公告';
        if (el.inputTa) el.inputTa.placeholder = '发送至「' + g.name + '」…';
    }

    function renderTemplates() {
        if (!el.tplList || !el.tplCats) return;
        var cats = [
            { id: 'welcome', label: '欢迎' },
            { id: 'ops', label: '运营' },
            { id: 'retain', label: '留存' },
            { id: 'close', label: '收尾' }
        ];
        el.tplCats.innerHTML = cats.map(function (c) {
            return '<button type="button" class="' + (c.id === state.tplCat ? 'on' : '') + '" data-cat="' + c.id + '">' + c.label + '</button>';
        }).join('');
        var list = TEMPLATES[state.tplCat] || [];
        el.tplList.innerHTML = list.map(function (t, i) {
            return '<button type="button" class="tpl-item" data-idx="' + i + '">' +
                '<span class="lbl">' + esc(t.label) + '</span>' + esc(t.text) + '</button>';
        }).join('');
        el._tplItems = list;
    }

    function toggleTplPanel(force) {
        state.tplOpen = typeof force === 'boolean' ? force : !state.tplOpen;
        if (el.tplPanel) el.tplPanel.classList.toggle('show', state.tplOpen);
        if (el.btnTemplate) el.btnTemplate.classList.toggle('on', state.tplOpen);
    }

    function selectGroup(id) {
        state.groupId = id;
        toggleTplPanel(false);
        renderGroupList();
        renderMessages();
    }

    function sendText() {
        var g = findGroup(state.groupId);
        var text = (el.inputTa && el.inputTa.value || '').trim();
        if (!g || !text) return;
        g.messages.push({ from: 'host', sender: 'Luna 🌙', text: text, time: '刚刚' });
        g.preview = '你：' + text.slice(0, 20);
        if (el.inputTa) el.inputTa.value = '';
        renderGroupList();
        renderMessages();
    }

    function bind() {
        if (el.groupList) {
            el.groupList.addEventListener('click', function (e) {
                var row = e.target.closest('.thread-row');
                if (row) selectGroup(row.getAttribute('data-id'));
            });
        }
        if (el.btnSend) el.btnSend.addEventListener('click', sendText);
        if (el.inputTa) {
            el.inputTa.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
            });
        }
        if (el.btnTemplate) el.btnTemplate.addEventListener('click', function () { toggleTplPanel(); });
        if (el.tplCats) {
            el.tplCats.addEventListener('click', function (e) {
                var b = e.target.closest('button[data-cat]');
                if (!b) return;
                state.tplCat = b.getAttribute('data-cat');
                renderTemplates();
            });
        }
        if (el.tplList) {
            el.tplList.addEventListener('click', function (e) {
                var item = e.target.closest('.tpl-item');
                if (!item) return;
                var idx = parseInt(item.getAttribute('data-idx'), 10);
                var text = (el._tplItems && el._tplItems[idx]) ? el._tplItems[idx].text : '';
                if (el.inputTa) el.inputTa.value = text;
                toggleTplPanel(false);
                toast('已填入常用语，可编辑后发送');
                el.inputTa.focus();
            });
        }
    }

    function init() {
        el.groupList = $('grpThreadList');
        el.msgList = $('grpMsgList');
        el.headName = $('grpHeadName');
        el.headStatus = $('grpHeadStatus');
        el.inputTa = $('grpInputTa');
        el.btnSend = $('grpBtnSend');
        el.btnTemplate = $('grpBtnTemplate');
        el.tplPanel = $('grpTemplatePanel');
        el.tplCats = $('grpTplCats');
        el.tplList = $('grpTplList');
        if (!el.groupList) return;
        bind();
        renderGroupList();
        renderTemplates();
        selectGroup(state.groupId);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
