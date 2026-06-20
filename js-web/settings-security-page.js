/**
 * 账户安全 · 验证方式修改 / 登录密码修改
 */
(function (global) {
    var STORAGE_KEY = 'fl_security_contact_v1';
    var PWD_KEY = 'fl_security_login_pwd_v1';
    var PWD_CHANGED_KEY = 'fl_security_pwd_changed_at';
    var DEFAULT_PWD = 'FansLoop2024!';

    var DEFAULT_CONTACT = {
        primaryEmail: 'luna@fansloop.io',
        phoneCountry: '+81',
        phoneNumber: '88862',
        backupEmail: ''
    };

    var TWO_FA_KEY = 'fl_security_2fa_v1';
    var DEFAULT_2FA = {
        totp: false,
        totpSecret: '',
        sms: false,
        webauthn: false,
        hardware: false,
        webauthnDevice: '',
        recoveryLeft: 10
    };

    var totpSetupSecret = '';

    var SCORE_RULES = [
        { id: 'strongPwd', label: '强登录密码', points: 20, anchor: '#pwdCard', tip: '至少 12 位，含大小写、数字与符号' },
        { id: 'backupEmail', label: '备用恢复邮箱', points: 15, anchor: '#secRowBackupEmail', tip: '与主邮箱不同服务商' },
        { id: 'totp', label: '认证器 APP (2FA)', points: 25, anchor: '#faTotp', tip: '推荐首选二次验证' },
        { id: 'webauthn', label: '生物识别 WebAuthn', points: 15, anchor: '#faWebAuthn', tip: '注册本机指纹/面容' },
        { id: 'payPwd', label: '支付密码', points: 10, anchor: '#secPayPwdRow', tip: '用于订阅、打赏与提现' }
    ];

    var SCORE_ARC = 314;

    var SEC_ACTIVITY_FILTERS = [
        { id: 'all', label: '全部' },
        { id: 'login', label: '登录与会话' },
        { id: 'fund', label: '资金与提现' },
        { id: 'account', label: '账号与验证' },
        { id: 'device', label: '设备管理' },
        { id: 'risk', label: '风险与安全' }
    ];

    var SEC_ACTIVITY_TYPE_LABELS = {
        login: '登录与会话',
        fund: '资金与提现',
        account: '账号与验证',
        device: '设备管理',
        risk: '风险与安全'
    };

    var SEC_ACTIVITY_LOGS = [
        { id: 'a1', type: 'login', variant: 'success', icon: 'fa-arrow-right-to-bracket', title: '从 MacBook Pro 登录', meta: '日本 · 东京 · Chrome 138 · 192.168.*.*', time: '1 分钟前', daysAgo: 0, detail: '登录方式：邮箱 + 密码。本设备已标记为常用设备，未触发 2FA 二次验证。' },
        { id: 'a2', type: 'fund', variant: 'success', icon: 'fa-coins', title: '完成 USDT 链上提现 · 218 USDT', meta: '已通过 2FA · 目标地址 0x7A3F…3F2C', time: '2 小时前', daysAgo: 0, detail: '提现流程：2FA 校验 → 支付密码 → 邮件确认。链上 TX 已广播，预计 3 分钟内到账。' },
        { id: 'a3', type: 'risk', variant: 'warn', icon: 'fa-triangle-exclamation', title: '异地登录尝试 - 已阻止', meta: '中国 · 上海 · Edge 132 · 未通过 2FA', time: '3 天前', daysAgo: 3, detail: '系统检测到非常用地区登录，已要求 2FA 验证。验证失败后锁定该次会话，并向主邮箱发送安全警报。' },
        { id: 'a4', type: 'account', variant: 'success', icon: 'fa-key', title: '修改提现密码', meta: '从 MacBook Pro · 已通过 2FA', time: '12 天前', daysAgo: 12, detail: '支付密码已更新。若非本人操作，请立即修改登录密码并强制下线所有设备。' },
        { id: 'a5', type: 'device', variant: 'success', icon: 'fa-mobile-screen', title: '添加新认证设备 · iPhone 17 Pro', meta: '已通过邮件验证 · FansLoop App 2.4.0', time: '18 天前', daysAgo: 18, detail: '新设备已通过主邮箱验证码确认。可在「登录设备」中随时强制下线。' },
        { id: 'a6', type: 'login', variant: 'success', icon: 'fa-arrow-right-to-bracket', title: '从 iPhone 17 Pro 登录', meta: '日本 · 横滨 · FansLoop App · 4G', time: '2 小时前', daysAgo: 0, detail: '移动端生物识别快捷登录。设备已在信任列表中。' },
        { id: 'a7', type: 'fund', variant: 'success', icon: 'fa-wallet', title: '钱包充值 · 100 USDT', meta: '链上转入 · 已入账', time: '5 天前', daysAgo: 5, detail: '来自外部钱包的 USDT (TRC20) 充值已确认，可用余额已更新。' },
        { id: 'a8', type: 'account', variant: 'success', icon: 'fa-shield-halved', title: '开启认证器 APP (2FA)', meta: 'Google Authenticator · 从 MacBook Pro', time: '20 天前', daysAgo: 20, detail: 'TOTP 二次验证已启用。新设备、异地或敏感操作将要求输入动态码。' },
        { id: 'a9', type: 'device', variant: 'success', icon: 'fa-power-off', title: '强制下线 · Windows 11 · Edge 132', meta: '从 MacBook Pro 发起 · 中国 · 上海', time: '3 天前', daysAgo: 3, detail: '你已手动将该设备会话终止。如仍有异常，建议修改登录密码。' },
        { id: 'a10', type: 'risk', variant: 'danger', icon: 'fa-ban', title: '连续 5 次登录密码错误 - 已临时锁定', meta: '中国 · 上海 · 15 分钟冷却', time: '4 天前', daysAgo: 4, detail: '同一 IP 在 10 分钟内多次密码错误，账号登录已临时锁定 15 分钟，并已发送邮件通知。' },
        { id: 'a11', type: 'login', variant: 'success', icon: 'fa-right-from-bracket', title: '从 iPhone 17 Pro 登出', meta: '主动登出 · 会话已清除', time: '6 天前', daysAgo: 6, detail: '用户在 App 内主动退出登录，Refresh Token 已作废。' },
        { id: 'a12', type: 'account', variant: 'success', icon: 'fa-envelope', title: '修改主邮箱验证方式', meta: 'l***@fansloop.io · 已通过旧邮箱确认', time: '25 天前', daysAgo: 25, detail: '主邮箱信息已更新。重要通知与提现确认将发送至新邮箱。' },
        { id: 'a13', type: 'fund', variant: 'warn', icon: 'fa-clock', title: '提现请求待邮件确认', meta: '150 USDT · 30 分钟内有效', time: '28 天前', daysAgo: 28, detail: '你已发起提现，等待主邮箱验证码确认。超时未确认将自动取消。' },
        { id: 'a14', type: 'device', variant: 'success', icon: 'fa-fingerprint', title: '注册生物识别 · MacBook Pro', meta: 'WebAuthn · Touch ID', time: '22 天前', daysAgo: 22, detail: '本机 Touch ID 已绑定，可用于 2FA 快捷验证。' },
        { id: 'a15', type: 'risk', variant: 'warn', icon: 'fa-envelope-circle-check', title: '安全警报邮件已发送', meta: '异地登录尝试 · 主邮箱', time: '3 天前', daysAgo: 3, detail: '系统检测到可疑登录并向你的主邮箱发送了警报，内含「不是我」一键锁定链接。' },
        { id: 'a16', type: 'login', variant: 'success', icon: 'fa-arrow-right-to-bracket', title: '从 MacBook Pro 登录', meta: '日本 · 东京 · Chrome 137', time: '35 天前', daysAgo: 35, detail: '常规登录，设备指纹与历史记录匹配。' },
        { id: 'a17', type: 'account', variant: 'success', icon: 'fa-lock', title: '修改登录密码', meta: '从 MacBook Pro · 已通过 2FA', time: '38 天前', daysAgo: 38, detail: '登录密码已更新。所有非常用设备会话已要求重新验证。' },
        { id: 'a18', type: 'fund', variant: 'success', icon: 'fa-coins', title: '完成 USDT 链上提现 · 86 USDT', meta: '已通过 2FA + 支付密码', time: '42 天前', daysAgo: 42, detail: '链上提现成功，TXID 可在账变记录中查看。' }
    ];

    var activityLogState = { filter: 'all', search: '', page: 1, pageSize: 8, openId: null, loading: false, hasMore: true };
    var SEC_ACTIVITY_MONTH_DAYS = 30;

    function twoFaStorageKey() {
        return TWO_FA_KEY + '_' + uid();
    }

    function load2fa() {
        try {
            var raw = localStorage.getItem(twoFaStorageKey());
            if (raw) return Object.assign({}, DEFAULT_2FA, JSON.parse(raw));
        } catch (e) { /* ignore */ }
        return Object.assign({}, DEFAULT_2FA);
    }

    function persist2fa(data) {
        try {
            localStorage.setItem(twoFaStorageKey(), JSON.stringify(data));
        } catch (e) { /* ignore */ }
    }

    function detectDeviceName() {
        var ua = navigator.userAgent || '';
        if (/iPhone|iPad/i.test(ua)) return 'iPhone / Safari';
        if (/Mac OS X/i.test(ua)) return 'Mac · ' + (/Chrome/i.test(ua) ? 'Chrome' : 'Safari');
        if (/Windows/i.test(ua)) return 'Windows · ' + (/Edg/i.test(ua) ? 'Edge' : 'Chrome');
        return '本机浏览器';
    }

    function scoreItemDone(id) {
        var contact = loadContact();
        var twofa = load2fa();
        if (id === 'strongPwd') return scorePassword(getLoginPassword()) >= 3;
        if (id === 'backupEmail') return !!contact.backupEmail;
        if (id === 'totp') return !!twofa.totp;
        if (id === 'webauthn') return !!twofa.webauthn;
        if (id === 'payPwd') return global.FLPayPasswordStore && global.FLPayPasswordStore.hasPassword();
        return false;
    }

    function calcSecurityScore() {
        var total = 0;
        SCORE_RULES.forEach(function (r) {
            if (scoreItemDone(r.id)) total += r.points;
        });
        return Math.min(100, total);
    }

    function scoreLevelMeta(score) {
        if (score >= 90) return { label: '优秀', level: 'high', hint: '安全项配置完善，请继续保持。' };
        if (score >= 70) return { label: '良好', level: 'good', hint: '基础防护到位，完成剩余安全项可进一步提升。' };
        if (score >= 40) return { label: '一般', level: 'mid', hint: '建议开启 2FA 并绑定备用邮箱。' };
        return { label: '较弱', level: 'low', hint: '请尽快完善安全设置，降低账号被盗风险。' };
    }

    function updateSecurityOverview() {
        var score = calcSecurityScore();
        var meta = scoreLevelMeta(score);
        var numEl = $('secScoreNum');
        var levelEl = $('secScoreLevel');
        var hintEl = $('secScoreHint');
        var ring = $('secScoreRing');
        var arc = $('secScoreArc');

        if (numEl) numEl.textContent = String(score);
        if (levelEl) levelEl.textContent = meta.label;
        if (hintEl) hintEl.textContent = meta.hint;
        if (ring) ring.setAttribute('data-level', meta.level);
        if (arc) {
            var offset = SCORE_ARC - (SCORE_ARC * score / 100);
            arc.style.strokeDasharray = String(SCORE_ARC);
            arc.style.strokeDashoffset = String(offset);
        }
    }

    function renderScoreRulesModal() {
        var body = $('secScoreRulesBody');
        if (!body) return;
        body.innerHTML =
            '<p class="sec-rules-intro">满分 100，仅统计你已实际开启/配置的项目，不含营销权益。</p>' +
            '<table class="sec-rules-table"><thead><tr><th>安全项</th><th>分值</th><th>说明</th><th>状态</th></tr></thead><tbody>' +
            SCORE_RULES.map(function (r) {
                var done = scoreItemDone(r.id);
                return '<tr><td>' + esc(r.label) + '</td><td>+' + r.points + '</td><td>' + esc(r.tip) + '</td><td class="' + (done ? 'ok' : 'no') + '">' + (done ? '已达成' : '未完成') + '</td></tr>';
            }).join('') +
            '</tbody></table>';
    }

    function openScoreRules() {
        renderScoreRulesModal();
        var ovl = $('ovlSecScoreRules');
        if (!ovl) return;
        ovl.classList.add('show');
        ovl.setAttribute('aria-hidden', 'false');
    }

    function closeScoreRules() {
        var ovl = $('ovlSecScoreRules');
        if (!ovl) return;
        ovl.classList.remove('show');
        ovl.setAttribute('aria-hidden', 'true');
    }

    function renderActivityLogRow(item, expandable, isOpen) {
        var typeLabel = SEC_ACTIVITY_TYPE_LABELS[item.type] || item.type;
        var variant = item.variant || '';
        var rowCls = expandable ? 'sec-log-item' + (isOpen ? ' open' : '') : 'log-row';
        return (
            '<div class="' + rowCls + '" data-log-id="' + esc(item.id) + '"' + (expandable ? ' role="button" tabindex="0"' : '') + '>' +
            '<div class="l-ic ' + esc(variant) + '"><i class="fa-solid ' + esc(item.icon) + '"></i></div>' +
            '<div class="' + (expandable ? 'l-main' : 'l-info') + '">' +
            '<div class="ti">' + esc(item.title) +
            (expandable ? ' <span class="type-tag">' + esc(typeLabel) + '</span>' : '') +
            '</div>' +
            '<div class="meta">' + esc(item.meta) + (expandable ? '' : ' · ' + esc(item.time)) + '</div>' +
            (expandable ? '<div class="l-detail">' + esc(item.detail) + '</div>' : '') +
            '</div>' +
            (expandable ? '<span class="l-time">' + esc(item.time) + '</span>' : '') +
            '</div>'
        );
    }

    function renderActivityPreview() {
        var host = $('secActivityPreview');
        if (!host) return;
        var preview = getFilteredActivityLogs().slice(0, 5);
        host.innerHTML =
            preview.map(function (item) { return renderActivityLogRow(item, false); }).join('') +
            '<div class="sec-activity-foot"><a href="#" id="btnSecActivityViewAll" role="button">查看全部安全日志 <i class="fa-solid fa-arrow-right" style="font-size:10px"></i></a></div>';
        var btn = $('btnSecActivityViewAll');
        if (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                openActivityLogModal();
            });
        }
    }

    function renderActivityFilters() {
        var host = $('secLogFilters');
        if (!host) return;
        host.innerHTML = SEC_ACTIVITY_FILTERS.map(function (f) {
            return '<button type="button" data-log-filter="' + esc(f.id) + '" class="' + (activityLogState.filter === f.id ? 'active' : '') + '" role="tab" aria-selected="' + (activityLogState.filter === f.id ? 'true' : 'false') + '">' + esc(f.label) + '</button>';
        }).join('');
    }

    function getFilteredActivityLogs() {
        var q = (activityLogState.search || '').trim().toLowerCase();
        return SEC_ACTIVITY_LOGS.filter(function (item) {
            if (item.daysAgo > SEC_ACTIVITY_MONTH_DAYS) return false;
            if (activityLogState.filter !== 'all' && item.type !== activityLogState.filter) return false;
            if (!q) return true;
            var blob = [item.title, item.meta, item.detail, SEC_ACTIVITY_TYPE_LABELS[item.type]].join(' ').toLowerCase();
            return blob.indexOf(q) >= 0;
        }).sort(function (a, b) { return a.daysAgo - b.daysAgo; });
    }

    function updateActivityLogSummary(all, shown) {
        var summary = $('secLogSummary');
        if (!summary) return;
        summary.innerHTML =
            '<span class="hint-month">仅展示近一个月的数据</span>' +
            ' · 共 ' + all.length + ' 条记录 · 已显示 ' + shown + ' 条';
    }

    function renderActivityLogList(reset) {
        var list = $('secLogList');
        var empty = $('secLogEmpty');
        if (!list) return;

        var all = getFilteredActivityLogs();
        var end = activityLogState.page * activityLogState.pageSize;
        var slice = all.slice(0, end);
        activityLogState.hasMore = slice.length < all.length;

        if (reset) {
            list.innerHTML = '';
            activityLogState.openId = null;
            list.scrollTop = 0;
        }

        var currentCount = list.querySelectorAll('.sec-log-item').length;
        var loaderEl = list.querySelector('.sec-log-loading');
        if (loaderEl) loaderEl.remove();

        if (reset || slice.length <= currentCount) {
            list.innerHTML = slice.map(function (item) {
                return renderActivityLogRow(item, true, activityLogState.openId === item.id);
            }).join('');
        } else if (slice.length > currentCount) {
            var delta = slice.slice(currentCount);
            list.insertAdjacentHTML('beforeend', delta.map(function (item) {
                return renderActivityLogRow(item, true, false);
            }).join(''));
        }

        updateActivityLogSummary(all, Math.min(slice.length, list.querySelectorAll('.sec-log-item').length));

        if (activityLogState.hasMore) {
            list.insertAdjacentHTML('beforeend', '<div class="sec-log-loading" aria-hidden="true"><i class="fa-solid fa-spinner fa-spin"></i>向下滚动加载更多</div>');
        }

        if (empty) {
            var showEmpty = all.length === 0;
            empty.hidden = !showEmpty;
            list.style.display = showEmpty ? 'none' : '';
        }
    }

    function tryLoadMoreActivityLogs() {
        var list = $('secLogList');
        if (!list || activityLogState.loading || !activityLogState.hasMore) return;
        if (list.scrollTop + list.clientHeight < list.scrollHeight - 56) return;
        activityLogState.loading = true;
        activityLogState.page += 1;
        renderActivityLogList(false);
        activityLogState.loading = false;
    }

    function openActivityLogModal() {
        activityLogState.filter = 'all';
        activityLogState.search = '';
        activityLogState.page = 1;
        activityLogState.openId = null;
        activityLogState.loading = false;
        activityLogState.hasMore = true;
        var search = $('secLogSearch');
        if (search) search.value = '';
        renderActivityFilters();
        renderActivityLogList(true);
        var ovl = $('ovlSecActivityLog');
        if (!ovl) return;
        ovl.classList.add('show');
        ovl.setAttribute('aria-hidden', 'false');
        if (search) search.focus();
    }

    function closeActivityLogModal() {
        var ovl = $('ovlSecActivityLog');
        if (!ovl) return;
        ovl.classList.remove('show');
        ovl.setAttribute('aria-hidden', 'true');
        activityLogState.openId = null;
    }

    function exportActivityLogsCsv() {
        var rows = getFilteredActivityLogs();
        if (!rows.length) {
            toast('当前筛选无数据可导出', 'err');
            return;
        }
        toast('已导出 ' + rows.length + ' 条安全日志（原型演示）', 'ok');
    }

    function bindActivityLog() {
        renderActivityPreview();

        var filters = $('secLogFilters');
        if (filters) {
            filters.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-log-filter]');
                if (!btn) return;
                activityLogState.filter = btn.getAttribute('data-log-filter') || 'all';
                activityLogState.page = 1;
                renderActivityFilters();
                renderActivityLogList(true);
            });
        }

        var search = $('secLogSearch');
        if (search) {
            search.addEventListener('input', function () {
                activityLogState.search = search.value;
                activityLogState.page = 1;
                renderActivityLogList(true);
            });
        }

        var list = $('secLogList');
        if (list) {
            list.addEventListener('click', function (e) {
                var row = e.target.closest('.sec-log-item');
                if (!row) return;
                var id = row.getAttribute('data-log-id');
                if (activityLogState.openId === id) {
                    activityLogState.openId = null;
                    row.classList.remove('open');
                } else {
                    var prev = list.querySelector('.sec-log-item.open');
                    if (prev) prev.classList.remove('open');
                    activityLogState.openId = id;
                    row.classList.add('open');
                }
            });
            list.addEventListener('keydown', function (e) {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                var row = e.target.closest('.sec-log-item');
                if (!row) return;
                e.preventDefault();
                row.click();
            });
            list.addEventListener('scroll', tryLoadMoreActivityLogs);
        }

        $('btnSecLogExport') && $('btnSecLogExport').addEventListener('click', exportActivityLogsCsv);
        $('closeSecActivityLog') && $('closeSecActivityLog').addEventListener('click', closeActivityLogModal);
        $('btnSecActivityLogOk') && $('btnSecActivityLogOk').addEventListener('click', closeActivityLogModal);
        $('ovlSecActivityLog') && $('ovlSecActivityLog').addEventListener('click', function (e) {
            if (e.target === $('ovlSecActivityLog')) closeActivityLogModal();
        });

        document.addEventListener('keydown', function (e) {
            var ovl = $('ovlSecActivityLog');
            if (e.key === 'Escape' && ovl && ovl.classList.contains('show')) closeActivityLogModal();
        });
    }

    function render2faUi() {
        var data = load2fa();
        var contact = loadContact();

        function setSwitch(key, on) {
            var sw = document.querySelector('[data-2fa-switch="' + key + '"]');
            if (sw) sw.classList.toggle('on', !!on);
            var row = document.getElementById(key === 'totp' ? 'faTotp' : key === 'sms' ? 'faSms' : '');
            if (row) row.classList.toggle('active', !!on);
        }

        setSwitch('totp', data.totp);
        setSwitch('sms', data.sms);

        var totpDesc = $('faTotpDesc');
        if (totpDesc) {
            totpDesc.textContent = data.totp
                ? '已开启 · 常用设备免验证；新设备 / 异地 / 超 30 天未登录或改密时须输入动态码'
                : '开启后常用设备登录不变；新设备、异地或超 30 天未登录时需动态码 · 未开启';
        }

        var smsDesc = $('faSmsDesc');
        if (smsDesc) {
            smsDesc.textContent = data.sms
                ? maskPhone(contact.phoneCountry, contact.phoneNumber) + ' · 已作为备用 2FA'
                : '绑定手机号后可用 · 备用方式（建议保持关闭）';
        }

        var webDesc = $('faWebAuthnDesc');
        var webAction = $('faWebAuthnAction');
        var webRow = $('faWebAuthn');
        if (data.webauthn) {
            if (webDesc) webDesc.textContent = data.webauthnDevice + ' · 已注册，可用于登录等账号操作快捷验证';
            if (webRow) webRow.classList.add('active');
            if (webAction) {
                webAction.innerHTML = '<div class="switch on" data-2fa-switch="webauthn" role="switch" tabindex="0" aria-label="生物识别"></div>';
            }
        } else {
            if (webDesc) webDesc.textContent = 'Touch ID / Face ID / Windows Hello · 未注册设备';
            if (webRow) webRow.classList.remove('active');
            if (webAction) {
                webAction.innerHTML = '<button type="button" class="btn btn-sm btn-primary" id="btnWebAuthnRegister">注册本设备</button>';
            }
        }

        var hwDesc = $('faHardwareDesc');
        if (hwDesc) {
            hwDesc.textContent = data.hardware
                ? '已绑定 YubiKey · 账号操作优先使用密钥校验'
                : '最高级别账号保护 · 未配置';
        }
        var hwBtn = $('btnHardwareAdd');
        if (hwBtn) {
            hwBtn.textContent = data.hardware ? '管理' : '添加';
            hwBtn.classList.toggle('btn-primary', !data.hardware);
        }

        var rec = $('faRecoveryLeft');
        if (rec) rec.textContent = String(data.recoveryLeft != null ? data.recoveryLeft : 10);
    }

    function generateTotpSecret() {
        var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        var out = '';
        for (var i = 0; i < 16; i++) {
            out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
        return out;
    }

    function formatTotpSecret(secret) {
        return String(secret || '').replace(/\s/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim();
    }

    function openTotpSetupModal() {
        totpSetupSecret = generateTotpSecret();
        var secretEl = $('totpSetupSecret');
        var accountEl = $('totpSetupAccount');
        if (secretEl) secretEl.textContent = formatTotpSecret(totpSetupSecret);
        if (accountEl) {
            var email = global.FansloopAuth && global.FansloopAuth.getEmail ? global.FansloopAuth.getEmail() : '';
            accountEl.textContent = email || 'FansLoop 账户';
        }
        var ovl = $('ovlSecTotpSetup');
        if (ovl) {
            ovl.classList.add('show');
            ovl.setAttribute('aria-hidden', 'false');
        }
    }

    function closeTotpSetupModal() {
        totpSetupSecret = '';
        var ovl = $('ovlSecTotpSetup');
        if (ovl) {
            ovl.classList.remove('show');
            ovl.setAttribute('aria-hidden', 'true');
        }
    }

    function confirmTotpSetup() {
        if (!totpSetupSecret) {
            toast('密钥无效，请重新开启', 'err');
            return;
        }
        var data = load2fa();
        data.totp = true;
        data.totpSecret = totpSetupSecret;
        persist2fa(data);
        closeTotpSetupModal();
        render2faUi();
        updateSecurityOverview();
        toast('认证器 APP 已开启', 'ok');
    }

    function openTotpDisableModal() {
        var ovl = $('ovlSecTotpDisable');
        if (ovl) {
            ovl.classList.add('show');
            ovl.setAttribute('aria-hidden', 'false');
        }
    }

    function closeTotpDisableModal() {
        var ovl = $('ovlSecTotpDisable');
        if (ovl) {
            ovl.classList.remove('show');
            ovl.setAttribute('aria-hidden', 'true');
        }
    }

    function confirmTotpDisable() {
        var data = load2fa();
        data.totp = false;
        data.totpSecret = '';
        persist2fa(data);
        closeTotpDisableModal();
        render2faUi();
        updateSecurityOverview();
        toast('已关闭认证器 APP', 'ok');
    }

    function copyTotpSecret() {
        var text = totpSetupSecret || '';
        if (!text) return;
        function done(ok) {
            toast(ok ? '密钥已复制到剪贴板' : '复制失败，请手动选择密钥复制', ok ? 'ok' : 'err');
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { done(true); }).catch(function () {
                fallbackCopy(text, done);
            });
            return;
        }
        fallbackCopy(text, done);
    }

    function fallbackCopy(text, done) {
        try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            var ok = document.execCommand('copy');
            document.body.removeChild(ta);
            done(!!ok);
        } catch (e) {
            done(false);
        }
    }

    function toggle2fa(key) {
        var data = load2fa();
        if (key === 'totp') {
            if (data.totp) {
                openTotpDisableModal();
            } else {
                openTotpSetupModal();
            }
            return;
        }
        if (key === 'webauthn') {
            if (data.webauthn) {
                data.webauthn = false;
                data.webauthnDevice = '';
                persist2fa(data);
                render2faUi();
                updateSecurityOverview();
                toast('已关闭生物识别', 'ok');
            } else {
                openWebAuthnModal();
            }
            return;
        }
        if (key === 'sms' && !data.sms) {
            var contact = loadContact();
            if (!contact.phoneNumber) {
                toast('请先绑定手机号', 'err');
                return;
            }
        }
        data[key] = !data[key];
        persist2fa(data);
        render2faUi();
        updateSecurityOverview();
        toast(data[key] ? '已更新验证方式' : '已关闭该验证方式', 'ok');
    }

    function openWebAuthnModal() {
        var ovl = $('ovlSecWebAuthn');
        var inp = $('webAuthnDeviceName');
        if (inp) inp.value = detectDeviceName();
        if (ovl) {
            ovl.classList.add('show');
            ovl.setAttribute('aria-hidden', 'false');
        }
    }

    function closeWebAuthnModal() {
        var ovl = $('ovlSecWebAuthn');
        if (ovl) {
            ovl.classList.remove('show');
            ovl.setAttribute('aria-hidden', 'true');
        }
    }

    function confirmWebAuthn() {
        var name = ($('webAuthnDeviceName') || {}).value.trim() || detectDeviceName();
        var data = load2fa();
        data.webauthn = true;
        data.webauthnDevice = name;
        persist2fa(data);
        closeWebAuthnModal();
        render2faUi();
        updateSecurityOverview();
        toast('生物识别已注册：' + name, 'ok');
    }

    function syncPayPwdRow() {
        var status = $('secPayPwdStatus');
        var btn = $('btnSecPayPwd');
        if (!status || !global.FLPayPasswordStore) return;
        var has = global.FLPayPasswordStore.hasPassword();
        status.textContent = has ? '已设置' : '未设置';
        if (btn) {
            btn.textContent = has ? '修改' : '设置';
            btn.classList.toggle('btn-primary', !has);
        }
        updateSecurityOverview();
    }

    function syncWithdrawEmailRow() {
        var sw = $('swWithdrawEmailConfirm');
        if (!sw || !global.FLWithdrawEmailConfirm) return;
        sw.classList.toggle('on', global.FLWithdrawEmailConfirm.isEnabled());
    }

    var contactModal = document.getElementById('ovlSecContact');
    var toastEl = document.getElementById('secPageToast');

    var pwdCurrent = document.getElementById('pwdCurrent');
    var pwdNew = document.getElementById('pwdNew');
    var pwdConfirm = document.getElementById('pwdConfirm');
    var pwdStrength = document.getElementById('pwdStrength');
    var pwdStrengthLabel = document.getElementById('pwdStrengthLabel');
    var pwdLastChanged = document.getElementById('pwdLastChanged');
    var errCurrent = document.getElementById('pwdErrCurrent');
    var errNew = document.getElementById('pwdErrNew');
    var errConfirm = document.getElementById('pwdErrConfirm');
    var btnPwdSave = document.getElementById('btnPwdSave');
    var btnPwdCancel = document.getElementById('btnPwdCancel');

    var modalState = {
        type: '',
        step: 1,
        sentCode: '',
        countdown: 0,
        timer: null
    };

    function uid() {
        return global.FansloopAuth && global.FansloopAuth.getUserId
            ? global.FansloopAuth.getUserId()
            : 'guest';
    }

    function storageKey() {
        return STORAGE_KEY + '_' + uid();
    }

    function pwdStorageKey() {
        return PWD_KEY + '_' + uid();
    }

    function loadContact() {
        try {
            var raw = localStorage.getItem(storageKey());
            if (raw) return Object.assign({}, DEFAULT_CONTACT, JSON.parse(raw));
        } catch (e) { /* ignore */ }
        return Object.assign({}, DEFAULT_CONTACT);
    }

    function persistContact(data) {
        try {
            localStorage.setItem(storageKey(), JSON.stringify(data));
        } catch (e) { /* ignore */ }
    }

    function getLoginPassword() {
        try {
            return localStorage.getItem(pwdStorageKey()) || DEFAULT_PWD;
        } catch (e) {
            return DEFAULT_PWD;
        }
    }

    function setLoginPassword(pw) {
        try {
            localStorage.setItem(pwdStorageKey(), pw);
            localStorage.setItem(PWD_CHANGED_KEY + '_' + uid(), String(Date.now()));
        } catch (e) { /* ignore */ }
    }

    function maskEmail(email) {
        if (!email) return '';
        var parts = String(email).split('@');
        if (parts.length < 2) return email;
        var name = parts[0];
        var masked = name.length <= 1 ? '*' : name.charAt(0) + '***';
        return masked + '@' + parts[1];
    }

    function maskPhone(country, num) {
        var digits = String(num || '').replace(/\D/g, '');
        if (digits.length < 4) return country + ' ***';
        var tail = digits.slice(-4);
        return country + ' *** **** ' + tail;
    }

    function toast(msg, type) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.className = 'sec-toast show' + (type === 'err' ? ' err' : ' ok');
        clearTimeout(toast._tm);
        toast._tm = setTimeout(function () {
            toastEl.classList.remove('show');
        }, 2600);
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function renderContactRows() {
        var data = loadContact();
        var primarySub = document.getElementById('secPrimaryEmailSub');
        var phoneSub = document.getElementById('secPhoneSub');
        var backupRow = document.getElementById('secRowBackupEmail');
        var backupTag = document.getElementById('secBackupTag');
        var backupSub = document.getElementById('secBackupSub');
        var backupBtn = document.getElementById('btnAddBackupEmail');

        if (primarySub) {
            primarySub.textContent = maskEmail(data.primaryEmail) + ' · 注册时绑定 · 用于密码找回与重要登录通知';
        }
        if (phoneSub) {
            phoneSub.textContent = maskPhone(data.phoneCountry, data.phoneNumber) + ' · 用于 SMS 二次验证与异常登录警报';
        }
        if (data.backupEmail && backupRow) {
            if (backupTag) {
                backupTag.className = 'tag tag-success';
                backupTag.textContent = '已验证';
            }
            if (backupSub) backupSub.textContent = maskEmail(data.backupEmail) + ' · 备用恢复与重要安全通知';
            if (backupBtn) {
                backupBtn.textContent = '修改';
                backupBtn.classList.remove('btn-primary');
            }
        }
        updateSecurityOverview();
    }

    function formatPwdChanged() {
        if (!pwdLastChanged) return;
        try {
            var ts = parseInt(localStorage.getItem(PWD_CHANGED_KEY + '_' + uid()) || '', 10);
            if (!ts) {
                pwdLastChanged.innerHTML = '<i class="fa-solid fa-clock"></i> 上次修改：38 天前';
                return;
            }
            var days = Math.max(0, Math.floor((Date.now() - ts) / 86400000));
            var label = days === 0 ? '今天' : days + ' 天前';
            pwdLastChanged.innerHTML = '<i class="fa-solid fa-clock"></i> 上次修改：' + label;
        } catch (e) {
            pwdLastChanged.innerHTML = '<i class="fa-solid fa-clock"></i> 上次修改：38 天前';
        }
    }

    function showFieldError(errEl, controlEl, msg) {
        if (errEl) {
            errEl.textContent = msg;
            errEl.classList.add('show');
        }
        if (controlEl) controlEl.classList.add('has-error');
    }

    function clearFieldError(errEl, controlEl) {
        if (errEl) {
            errEl.textContent = '';
            errEl.classList.remove('show');
        }
        if (controlEl) controlEl.classList.remove('has-error');
    }

    function scorePassword(pw) {
        var n = 0;
        if (!pw) return 0;
        if (pw.length >= 12) n++;
        if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) n++;
        if (/\d/.test(pw)) n++;
        if (/[^a-zA-Z0-9]/.test(pw)) n++;
        return n;
    }

    function strengthLabel(level, pw) {
        if (!pw) return { text: '', cls: '' };
        if (level <= 1) return { text: '弱 — 建议增加长度与字符种类', cls: 'weak' };
        if (level === 2) return { text: '中 — 可再添加符号提升强度', cls: 'mid' };
        if (level === 3) return { text: '强 — 破解需 152 年', cls: 'strong' };
        return { text: '极强 — 破解需数百年', cls: 'strong' };
    }

    function updatePwdStrength() {
        if (!pwdNew || !pwdStrength) return;
        var pw = pwdNew.value;
        var level = scorePassword(pw);
        pwdStrength.setAttribute('data-level', pw ? String(level) : '0');
        if (pwdStrengthLabel) {
            var info = strengthLabel(level, pw);
            pwdStrengthLabel.className = 'pwd-strength-label' + (info.cls ? ' ' + info.cls : '');
            pwdStrengthLabel.innerHTML = pw
                ? '<i class="fa-solid fa-shield-halved"></i> ' + esc(info.text)
                : '';
        }
    }

    function resetPwdVisibility() {
        document.querySelectorAll('#pwdCard .pwd-input-wrap').forEach(function (wrap) {
            var inp = wrap.querySelector('input');
            var btn = wrap.querySelector('.pwd-toggle');
            var icon = btn && btn.querySelector('i');
            if (inp) inp.type = 'password';
            if (btn) {
                btn.classList.remove('on');
                btn.setAttribute('aria-pressed', 'false');
                btn.setAttribute('aria-label', '显示密码');
            }
            if (icon) icon.className = 'fa-regular fa-eye';
        });
    }

    function bindPwdToggles() {
        document.querySelectorAll('#pwdCard .pwd-toggle').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var wrap = btn.closest('.pwd-input-wrap');
                var inp = wrap && wrap.querySelector('input');
                if (!inp) return;
                var show = inp.type === 'password';
                inp.type = show ? 'text' : 'password';
                btn.classList.toggle('on', show);
                btn.setAttribute('aria-pressed', show ? 'true' : 'false');
                btn.setAttribute('aria-label', show ? '隐藏密码' : '显示密码');
                var icon = btn.querySelector('i');
                if (icon) icon.className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
            });
        });
    }

    function resetPwdForm() {
        if (pwdCurrent) pwdCurrent.value = '';
        if (pwdNew) pwdNew.value = '';
        if (pwdConfirm) pwdConfirm.value = '';
        resetPwdVisibility();
        clearFieldError(errCurrent, pwdCurrent && pwdCurrent.closest('.control'));
        clearFieldError(errNew, pwdNew && pwdNew.closest('.control'));
        clearFieldError(errConfirm, pwdConfirm && pwdConfirm.closest('.control'));
        updatePwdStrength();
    }

    function validatePwdForm() {
        var ok = true;
        var current = pwdCurrent ? pwdCurrent.value : '';
        var newer = pwdNew ? pwdNew.value : '';
        var confirm = pwdConfirm ? pwdConfirm.value : '';

        clearFieldError(errCurrent, pwdCurrent && pwdCurrent.closest('.control'));
        clearFieldError(errNew, pwdNew && pwdNew.closest('.control'));
        clearFieldError(errConfirm, pwdConfirm && pwdConfirm.closest('.control'));

        if (!current) {
            showFieldError(errCurrent, pwdCurrent.closest('.control'), '请输入当前密码');
            ok = false;
        } else if (current !== getLoginPassword()) {
            showFieldError(errCurrent, pwdCurrent.closest('.control'), '当前密码不正确');
            ok = false;
        }

        var level = scorePassword(newer);
        if (!newer) {
            showFieldError(errNew, pwdNew.closest('.control'), '请输入新密码');
            ok = false;
        } else if (newer.length < 12 || level < 3) {
            showFieldError(errNew, pwdNew.closest('.control'), '至少 12 位，且需含大小写、数字与符号');
            ok = false;
        } else if (newer === current) {
            showFieldError(errNew, pwdNew.closest('.control'), '新密码不能与当前密码相同');
            ok = false;
        }

        if (!confirm) {
            showFieldError(errConfirm, pwdConfirm.closest('.control'), '请再次输入新密码');
            ok = false;
        } else if (confirm !== newer) {
            showFieldError(errConfirm, pwdConfirm.closest('.control'), '两次输入的密码不一致');
            ok = false;
        }

        return ok;
    }

    function savePassword() {
        if (!validatePwdForm()) {
            toast('请修正表单中的错误', 'err');
            return;
        }
        setLoginPassword(pwdNew.value);
        resetPwdForm();
        formatPwdChanged();
        updateSecurityOverview();
        toast('登录密码已更新', 'ok');
    }

    function $(id) { return document.getElementById(id); }

    function setModalError(msg) {
        var el = $('secContactErr');
        if (!el) return;
        if (msg) {
            el.textContent = msg;
            el.classList.add('show');
        } else {
            el.textContent = '';
            el.classList.remove('show');
        }
    }

    function openContactModal(type) {
        if (!contactModal) return;
        modalState.type = type;
        modalState.step = 1;
        modalState.sentCode = '';
        setModalError('');

        var title = $('secContactTitle');
        var hint = $('secContactHint');
        var emailField = $('secContactEmailField');
        var phoneField = $('secContactPhoneField');
        var codeField = $('secContactCodeField');
        var emailInput = $('secContactEmail');
        var phoneInput = $('secContactPhone');
        var codeInput = $('secContactCode');
        var btnSend = $('btnSecSendCode');
        var btnSave = $('btnSecContactSave');

        if (codeField) codeField.style.display = 'none';
        if (codeInput) codeInput.value = '';
        if (btnSend) {
            btnSend.disabled = false;
            btnSend.textContent = '获取验证码';
        }
        if (btnSave) btnSave.textContent = '下一步';

        var data = loadContact();

        if (type === 'primary-email') {
            if (title) title.textContent = '修改主邮箱';
            if (hint) hint.textContent = '新邮箱需完成验证码校验。修改后 24 小时内提现功能将暂时锁定。';
            if (emailField) emailField.style.display = '';
            if (phoneField) phoneField.style.display = 'none';
            if (emailInput) emailInput.value = data.primaryEmail;
        } else if (type === 'phone') {
            if (title) title.textContent = '修改手机号';
            if (hint) hint.textContent = '我们将向新手机号发送 6 位验证码，用于确认是你本人操作。';
            if (emailField) emailField.style.display = 'none';
            if (phoneField) phoneField.style.display = '';
            if (phoneInput) phoneInput.value = data.phoneNumber;
            var country = $('secContactCountry');
            if (country) country.value = data.phoneCountry || '+81';
        } else {
            if (title) title.textContent = data.backupEmail ? '修改备用邮箱' : '添加备用邮箱';
            if (hint) hint.textContent = '备用邮箱需与主邮箱不同，用于账号恢复与安全通知。';
            if (emailField) emailField.style.display = '';
            if (phoneField) phoneField.style.display = 'none';
            if (emailInput) emailInput.value = data.backupEmail || '';
        }

        contactModal.classList.add('show');
        contactModal.setAttribute('aria-hidden', 'false');
    }

    function closeContactModal() {
        if (!contactModal) return;
        contactModal.classList.remove('show');
        contactModal.setAttribute('aria-hidden', 'true');
        if (modalState.timer) {
            clearInterval(modalState.timer);
            modalState.timer = null;
        }
    }

    function validEmail(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    function startCountdown(btn) {
        modalState.countdown = 60;
        btn.disabled = true;
        btn.textContent = modalState.countdown + 's 后重发';
        modalState.timer = setInterval(function () {
            modalState.countdown--;
            if (modalState.countdown <= 0) {
                clearInterval(modalState.timer);
                modalState.timer = null;
                btn.disabled = false;
                btn.textContent = '重新发送';
                return;
            }
            btn.textContent = modalState.countdown + 's 后重发';
        }, 1000);
    }

    function sendCode() {
        var btnSend = $('btnSecSendCode');
        var codeField = $('secContactCodeField');
        var data = loadContact();
        setModalError('');

        if (modalState.type === 'phone') {
            var phone = ($('secContactPhone') || {}).value || '';
            if (!/^\d{5,15}$/.test(phone.replace(/\s/g, ''))) {
                setModalError('请输入有效的手机号码');
                return;
            }
        } else {
            var email = ($('secContactEmail') || {}).value || '';
            if (!validEmail(email)) {
                setModalError('请输入有效的邮箱地址');
                return;
            }
            if (modalState.type === 'backup-email' && email.toLowerCase() === (data.primaryEmail || '').toLowerCase()) {
                setModalError('备用邮箱不能与主邮箱相同');
                return;
            }
        }

        modalState.sentCode = String(Math.floor(100000 + Math.random() * 900000));
        modalState.step = 2;
        if (codeField) codeField.style.display = '';
        var btnSave = $('btnSecContactSave');
        if (btnSave) btnSave.textContent = '确认保存';
        if (btnSend) startCountdown(btnSend);
        toast('验证码已发送（演示：' + modalState.sentCode + '）', 'ok');
    }

    function saveContact() {
        var data = loadContact();
        var code = ($('secContactCode') || {}).value || '';
        setModalError('');

        if (modalState.step < 2) {
            sendCode();
            return;
        }

        if (!/^\d{6}$/.test(code)) {
            setModalError('请输入 6 位数字验证码');
            return;
        }
        if (code !== modalState.sentCode) {
            setModalError('验证码错误，请重试或重新获取');
            return;
        }

        if (modalState.type === 'primary-email') {
            var email = ($('secContactEmail') || {}).value.trim();
            if (!validEmail(email)) {
                setModalError('请输入有效的邮箱地址');
                return;
            }
            data.primaryEmail = email;
            toast('主邮箱已更新', 'ok');
        } else if (modalState.type === 'phone') {
            data.phoneCountry = ($('secContactCountry') || {}).value || '+81';
            data.phoneNumber = ($('secContactPhone') || {}).value.replace(/\s/g, '');
            toast('手机号已更新', 'ok');
        } else {
            var backup = ($('secContactEmail') || {}).value.trim();
            if (!validEmail(backup)) {
                setModalError('请输入有效的邮箱地址');
                return;
            }
            if (backup.toLowerCase() === (data.primaryEmail || '').toLowerCase()) {
                setModalError('备用邮箱不能与主邮箱相同');
                return;
            }
            data.backupEmail = backup;
            toast('备用邮箱已绑定', 'ok');
        }

        persistContact(data);
        renderContactRows();
        closeContactModal();
    }

    function bind() {
        var btnPrimary = $('btnEditPrimaryEmail');
        var btnPhone = $('btnEditPhone');
        var btnBackup = $('btnAddBackupEmail');
        if (btnPrimary) btnPrimary.addEventListener('click', function () { openContactModal('primary-email'); });
        if (btnPhone) btnPhone.addEventListener('click', function () { openContactModal('phone'); });
        if (btnBackup) btnBackup.addEventListener('click', function () { openContactModal('backup-email'); });

        $('btnSecSendCode') && $('btnSecSendCode').addEventListener('click', sendCode);
        $('btnSecContactSave') && $('btnSecContactSave').addEventListener('click', saveContact);
        $('btnSecContactCancel') && $('btnSecContactCancel').addEventListener('click', closeContactModal);
        $('closeSecContact') && $('closeSecContact').addEventListener('click', closeContactModal);
        contactModal && contactModal.addEventListener('click', function (e) {
            if (e.target === contactModal) closeContactModal();
        });

        if (pwdNew) pwdNew.addEventListener('input', updatePwdStrength);
        if (btnPwdSave) btnPwdSave.addEventListener('click', savePassword);
        if (btnPwdCancel) btnPwdCancel.addEventListener('click', resetPwdForm);
        bindPwdToggles();
        if (pwdCurrent) {
            pwdCurrent.addEventListener('focus', function () {
                if (pwdCurrent.value === '••••••••••') pwdCurrent.value = '';
            });
        }

        $('btn2faIntroToggle') && $('btn2faIntroToggle').addEventListener('click', function () {
            var body = $('sec2faIntroBody');
            var open = body && body.hasAttribute('hidden');
            if (body) {
                if (open) body.removeAttribute('hidden');
                else body.setAttribute('hidden', '');
            }
            this.setAttribute('aria-expanded', open ? 'true' : 'false');
            this.classList.toggle('open', !!open);
        });

        document.addEventListener('click', function (e) {
            var wdSw = e.target.closest('[data-withdraw-email-switch]');
            if (wdSw && global.FLWithdrawEmailConfirm) {
                e.stopPropagation();
                var on = !wdSw.classList.contains('on');
                global.FLWithdrawEmailConfirm.setEnabled(on);
                syncWithdrawEmailRow();
                toast(on ? '已开启提现邮件确认' : '已关闭提现邮件确认', 'ok');
                return;
            }
            var sw = e.target.closest('[data-2fa-switch]');
            if (sw) {
                e.stopPropagation();
                toggle2fa(sw.getAttribute('data-2fa-switch'));
                return;
            }
            if (e.target.closest('#btnWebAuthnRegister')) {
                e.preventDefault();
                openWebAuthnModal();
            }
        });

        $('btnWebAuthnConfirm') && $('btnWebAuthnConfirm').addEventListener('click', confirmWebAuthn);
        $('btnWebAuthnCancel') && $('btnWebAuthnCancel').addEventListener('click', closeWebAuthnModal);
        $('closeSecWebAuthn') && $('closeSecWebAuthn').addEventListener('click', closeWebAuthnModal);
        $('ovlSecWebAuthn') && $('ovlSecWebAuthn').addEventListener('click', function (e) {
            if (e.target === $('ovlSecWebAuthn')) closeWebAuthnModal();
        });

        $('btnTotpSetupDone') && $('btnTotpSetupDone').addEventListener('click', confirmTotpSetup);
        $('btnTotpSetupCancel') && $('btnTotpSetupCancel').addEventListener('click', closeTotpSetupModal);
        $('closeSecTotpSetup') && $('closeSecTotpSetup').addEventListener('click', closeTotpSetupModal);
        $('btnTotpCopySecret') && $('btnTotpCopySecret').addEventListener('click', copyTotpSecret);
        $('ovlSecTotpSetup') && $('ovlSecTotpSetup').addEventListener('click', function (e) {
            if (e.target === $('ovlSecTotpSetup')) closeTotpSetupModal();
        });

        $('btnTotpDisableConfirm') && $('btnTotpDisableConfirm').addEventListener('click', confirmTotpDisable);
        $('btnTotpDisableCancel') && $('btnTotpDisableCancel').addEventListener('click', closeTotpDisableModal);
        $('closeSecTotpDisable') && $('closeSecTotpDisable').addEventListener('click', closeTotpDisableModal);
        $('ovlSecTotpDisable') && $('ovlSecTotpDisable').addEventListener('click', function (e) {
            if (e.target === $('ovlSecTotpDisable')) closeTotpDisableModal();
        });

        $('btnHardwareAdd') && $('btnHardwareAdd').addEventListener('click', function () {
            var data = load2fa();
            if (data.hardware) {
                toast('硬件密钥管理（原型演示）', 'ok');
                return;
            }
            data.hardware = true;
            persist2fa(data);
            render2faUi();
            updateSecurityOverview();
            toast('已添加硬件安全密钥（演示）', 'ok');
        });

        $('btnRecoveryCodes') && $('btnRecoveryCodes').addEventListener('click', function () {
            toast('恢复码：FL-RC-' + Math.random().toString(36).slice(2, 8).toUpperCase() + '（演示）', 'ok');
        });

        $('btnSecScoreRules') && $('btnSecScoreRules').addEventListener('click', openScoreRules);
        $('closeSecScoreRules') && $('closeSecScoreRules').addEventListener('click', closeScoreRules);
        $('btnSecScoreRulesOk') && $('btnSecScoreRulesOk').addEventListener('click', closeScoreRules);
        $('ovlSecScoreRules') && $('ovlSecScoreRules').addEventListener('click', function (e) {
            if (e.target === $('ovlSecScoreRules')) closeScoreRules();
        });

        bindActivityLog();

        document.addEventListener('fl-user-assets-change', syncPayPwdRow);
    }

    function init() {
        renderContactRows();
        formatPwdChanged();
        updatePwdStrength();
        render2faUi();
        syncPayPwdRow();
        syncWithdrawEmailRow();
        updateSecurityOverview();
        bind();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(typeof window !== 'undefined' ? window : this);
