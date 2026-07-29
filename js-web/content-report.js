/**
 * 内容举报 · 通用弹窗（图文 / 视频 / 直播）
 *
 * 用法：
 *   FL_ContentReport.open({
 *     type: 'video' | 'image' | 'live' | 'content',
 *     contentId: 'p1',
 *     onDone: function () { ... }  // 关闭后隐藏并切下一条
 *   });
 *
 * 已举报 id 存 localStorage，供各 Feed / 发现页过滤。
 */
(function (global) {
    var STORAGE_KEY = 'fl_content_reported_v1';

    var REASONS = [
        { id: 'dislike', label: '我不喜欢' },
        { id: 'rights', label: '侵犯权益' },
        { id: 'plagiarism', label: '搬运、抄袭作品' },
        { id: 'porn', label: '色情低俗' },
        { id: 'crime', label: '违法犯罪' },
        { id: 'politics', label: '政治敏感' },
        { id: 'spam', label: '违规营销' },
        { id: 'misinfo', label: '不实信息' },
        { id: 'cyberbully', label: '网络暴力' },
        { id: 'safety', label: '危害人身安全' },
        { id: 'minor', label: '未成年相关' },
        { id: 'ai', label: 'AI生成内容问题' },
        { id: 'other', label: '以上没有我想举报的类型', full: true }
    ];

    var TITLE_MAP = {
        video: '举报视频',
        image: '举报图文',
        live: '举报直播',
        content: '举报内容'
    };

    var state = {
        type: 'content',
        contentId: null,
        contentTitle: '',
        onDone: null,
        toastFn: null
    };

    var overlay = null;
    var toastEl = null;
    var toastTimer = null;

    function readReported() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    function writeReported(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (e) { /* ignore */ }
    }

    function isReported(id) {
        if (!id) return false;
        return readReported().indexOf(String(id)) >= 0;
    }

    function markReported(id) {
        if (!id) return;
        var key = String(id);
        var list = readReported();
        if (list.indexOf(key) < 0) {
            list.push(key);
            writeReported(list);
        }
    }

    function filterReported(list, idKey) {
        idKey = idKey || 'id';
        var banned = readReported();
        if (!banned.length) return list || [];
        return (list || []).filter(function (item) {
            var id = typeof item === 'string' ? item : item[idKey];
            return banned.indexOf(String(id)) < 0;
        });
    }

    function showToast(msg) {
        if (typeof state.toastFn === 'function') {
            state.toastFn(msg);
            return;
        }
        if (typeof global.toast === 'function') {
            global.toast(msg);
            return;
        }
        if (typeof global.crShowToast === 'function') {
            global.crShowToast(msg);
            return;
        }
        ensureToast();
        toastEl.textContent = msg;
        toastEl.classList.add('is-show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toastEl.classList.remove('is-show');
        }, 2200);
    }

    function ensureToast() {
        if (toastEl) return;
        toastEl = document.createElement('div');
        toastEl.className = 'fl-report-toast';
        toastEl.setAttribute('role', 'status');
        document.body.appendChild(toastEl);
    }

    function reasonHtml() {
        return REASONS.map(function (r) {
            return (
                '<label class="fl-report-reason' + (r.full ? ' is-full' : '') + '">' +
                '<input type="radio" name="flReportReason" value="' + r.id + '">' +
                '<span>' + r.label + '</span></label>'
            );
        }).join('');
    }

    var LOG_KEY = 'fl_content_report_logs_v1';

    function reasonLabelOf(id) {
        for (var i = 0; i < REASONS.length; i++) {
            if (REASONS[i].id === id) return REASONS[i].label;
        }
        return id || '—';
    }

    function readLogs() {
        try {
            var raw = localStorage.getItem(LOG_KEY);
            var list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    function writeLogs(list) {
        try {
            localStorage.setItem(LOG_KEY, JSON.stringify((list || []).slice(0, 200)));
        } catch (e) { /* ignore */ }
    }

    function currentReporter() {
        try {
            if (global.FL_AUTH && typeof global.FL_AUTH.getUser === 'function') {
                var u = global.FL_AUTH.getUser();
                if (u && (u.name || u.handle || u.email)) return u.name || u.handle || u.email;
            }
        } catch (e) { /* ignore */ }
        return '当前用户';
    }

    function ensureDom() {
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.className = 'fl-report-overlay';
        overlay.id = 'flReportOverlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML =
            '<div class="fl-report-modal" role="dialog" aria-modal="true" aria-labelledby="flReportTitle">' +
            '<div class="fl-report-hd">' +
            '<h3 id="flReportTitle">举报内容</h3>' +
            '<button type="button" class="fl-report-close" data-fl-report-close aria-label="关闭">' +
            '<i class="fa-solid fa-xmark"></i></button></div>' +
            '<div class="fl-report-bd">' +
            '<span class="fl-report-label">举报原因<span class="req">*</span></span>' +
            '<div class="fl-report-reasons" id="flReportReasons">' + reasonHtml() + '</div>' +
            '<span class="fl-report-label">举报描述</span>' +
            '<textarea class="fl-report-desc" id="flReportDesc" maxlength="500" ' +
            'placeholder="请详细描述举报原因，便于平台判断违规情况"></textarea>' +
            '</div>' +
            '<div class="fl-report-ft">' +
            '<button type="button" class="fl-report-submit" id="flReportSubmit" disabled>提交</button>' +
            '</div></div>';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });
        overlay.querySelector('[data-fl-report-close]').addEventListener('click', close);
        overlay.querySelector('#flReportReasons').addEventListener('change', syncSubmit);
        overlay.querySelector('#flReportSubmit').addEventListener('click', submit);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
        });
        return overlay;
    }

    function syncSubmit() {
        var btn = overlay && overlay.querySelector('#flReportSubmit');
        if (!btn) return;
        var checked = overlay.querySelector('input[name="flReportReason"]:checked');
        btn.disabled = !checked;
    }

    function resetForm() {
        if (!overlay) return;
        overlay.querySelectorAll('input[name="flReportReason"]').forEach(function (el) {
            el.checked = false;
        });
        var desc = overlay.querySelector('#flReportDesc');
        if (desc) desc.value = '';
        syncSubmit();
    }

    function open(opts) {
        opts = opts || {};
        ensureDom();
        state.type = opts.type || 'content';
        state.contentId = opts.contentId != null ? String(opts.contentId) : null;
        state.contentTitle = opts.contentTitle || opts.title || '';
        state.onDone = typeof opts.onDone === 'function' ? opts.onDone : null;
        state.toastFn = typeof opts.toast === 'function' ? opts.toast : null;

        var title = opts.title || TITLE_MAP[state.type] || TITLE_MAP.content;
        overlay.querySelector('#flReportTitle').textContent = title;
        resetForm();
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('fl-report-open');
    }

    function close() {
        if (!overlay) return;
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('fl-report-open');
    }

    function submit() {
        var checked = overlay && overlay.querySelector('input[name="flReportReason"]:checked');
        if (!checked) {
            showToast('请选择举报原因');
            return;
        }
        var reasonId = checked.value;
        var desc = (overlay.querySelector('#flReportDesc').value || '').trim();
        var payload = {
            id: 'rpt-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            contentId: state.contentId,
            contentTitle: state.contentTitle || state.contentId || '未命名内容',
            type: state.type,
            reason: reasonId,
            reasonLabel: reasonLabelOf(reasonId),
            desc: desc,
            at: Date.now(),
            status: 'pending',
            reporter: currentReporter(),
            handledAt: null,
            handledNote: ''
        };
        var logs = readLogs();
        logs.unshift(payload);
        writeLogs(logs);

        if (state.contentId) markReported(state.contentId);

        var done = state.onDone;
        close();
        showToast('提交成功');
        setTimeout(function () {
            if (done) done(payload);
        }, 280);
    }

    /** 从内容类型推断举报标题类型 */
    function resolveType(postType, fallback) {
        if (postType === 'live') return 'live';
        if (postType === 'image' || postType === 'images' || postType === 'photo') return 'image';
        if (postType === 'video') return 'video';
        return fallback || 'content';
    }

    global.FL_ContentReport = {
        open: open,
        close: close,
        isReported: isReported,
        markReported: markReported,
        filterReported: filterReported,
        getReportedIds: readReported,
        getLogs: readLogs,
        saveLogs: writeLogs,
        reasonLabelOf: reasonLabelOf,
        resolveType: resolveType,
        REASONS: REASONS,
        LOG_KEY: LOG_KEY
    };
})(window);
