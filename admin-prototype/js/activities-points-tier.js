(function () {
    var Store = window.FLAdminPointsTier;
    var M = window.AdminModal;
    if (!Store) return;

    var state = { cfg: null, bound: false };

    var RULE_ORDER = [
        'registerDaysLte',
        'consecutiveLoginGte',
        'hasEngagement',
        'hasSubscription'
    ];

    var BOOST_CARD_MUL = 1.2;

    var LIMITS = {
        tierCap: { min: 1, max: 2 },
        globalCap: { min: 1, max: 3 },
        ruleMul: { min: 1, max: 1.2, enabledMin: 1.02 },
        dailyBonusCap: { min: 0, max: 5000 },
        days: { min: 1, max: 365 },
        windowDays: { min: 1, max: 90 },
        minActions: { min: 1, max: 100 },
        minPosts: { min: 1, max: 50 },
        minAuthors: { min: 1, max: 50 },
        minAccountAge: { min: 0, max: 90 },
        bonusMaxDays: { min: 1, max: 90 },
        minSubDays: { min: 1, max: 365 },
        minPaid: { min: 0, max: 99999 }
    };

    var FIELD_TIPS = {
        maxCombinedMultiplier: '每笔发放时，多条分层规则连乘的上限（非单日）；防薅建议 ≤ 1.5。',
        globalMaxMultiplier: '每笔发放时，分层与加速卡叠加后的总倍率上限（非单日）；建议 ≤ 1.65。',
        dailyTierBonusCap: '按「积分」计数。每笔发奖只累计「加成部分」= 实发积分 − 任务基础分（不含基础分本身）。单用户自然日内加总，达到上限后当日后续发奖不再多加成。与风控里的「每日任务获取总上限」分开，避免重复限流。',
        externalBoostStackMode: '推荐「取较高者」：避免加速卡与分层连乘放大；连乘模式风险更高。',
        excludedActivityTypes: '勾选后，该活动渠道发放积分时不叠加分层倍率（只发任务基础分）。建议勾选「邀请拉新」「研发活动」等高额或易刷渠道。',
        ruleEnabled: '关闭后该规则不参与命中与连乘；开启后须配置有效加成倍率（> 1.0）。',
        ruleDays: '新用户：注册后可享加成的最长天数（注册时锁定）；连续登录：至少连登多少天才命中。',
        ruleMultiplierRegister: '新用户倍率在注册时锁定；建议 ≤ 1.1。',
        ruleMultiplier: '单条规则倍率，防薅建议 1.02～1.08；多条连乘后再受分层封顶截断。',
        bonusMaxDays: '连登达标后，最多享受加成的天数（非终身）；用尽后须重新累计连登。',
        windowDays: '统计近 N 日内的有效互动；窗口过期后未达标则失去加成。',
        minActions: '窗口内至少完成的有效互动次数（点赞/评论等）。',
        minDistinctPosts: '互动须分布在至少 N 篇不同内容。',
        minDistinctAuthors: '互动须来自至少 N 位不同创作者，防小号互刷。',
        minAccountAgeDays: '账号注册满 N 天后才允许命中互动分层，防批量新号。',
        minPaidAmount: '订阅实付金额下限（USDT），免费试用不计入。',
        minSubscribedDays: '连续订阅满 N 天才可命中，防订一天即取消薅加成。',
        requireActive: '须为当前有效付费订阅；取消后立即失去加成。',
        simProfile: '选择模拟用户画像，预览命中规则与倍率，不会写入线上数据。'
    };

    function tipHtml(key) {
        var text = FIELD_TIPS[key] || '';
        return '<span class="pt-field-tip" tabindex="0" aria-label="规则说明">' +
            '<i class="fa-solid fa-circle-exclamation"></i>' +
            '<span class="pt-field-tip-pop">' + text + '</span></span>';
    }

    function fieldLabel(text, tipKey) {
        return '<div class="pt-field-label">' + text + tipHtml(tipKey) + '</div>';
    }

    function roundMul(n) {
        return Math.round(n * 100) / 100;
    }

    function parseNum(val, fallback) {
        var n = parseFloat(val);
        return isNaN(n) ? fallback : n;
    }

    function parseIntVal(val, fallback) {
        var n = parseInt(val, 10);
        return isNaN(n) ? fallback : n;
    }

    function getGlobalValues() {
        return {
            maxCombinedMultiplier: parseNum(document.getElementById('fldMaxMul').value, 1.8),
            globalMaxMultiplier: parseNum(document.getElementById('fldGlobalMax').value, 2.2),
            dailyTierBonusCap: parseIntVal(document.getElementById('fldDailyBonusCap').value, 80),
            externalBoostStackMode: document.getElementById('fldExtStack').value
        };
    }

    function getRuleSnapshots() {
        return RULE_ORDER.map(function (id) {
            var card = document.querySelector('.pt-admin-rule-card[data-rule="' + id + '"]');
            if (!card) return null;
            var meta = Store.RULE_META[id];
            return {
                id: id,
                label: meta ? meta.label : id,
                enabled: card.querySelector('.js-enabled').checked,
                multiplier: parseNum(card.querySelector('.js-mul').value, 1),
                days: card.querySelector('.js-days') ? parseIntVal(card.querySelector('.js-days').value, 0) : null,
                windowDays: card.querySelector('.js-window') ? parseIntVal(card.querySelector('.js-window').value, 7) : null,
                minActions: card.querySelector('.js-min-actions') ? parseIntVal(card.querySelector('.js-min-actions').value, 3) : null,
                minDistinctPosts: card.querySelector('.js-min-posts') ? parseIntVal(card.querySelector('.js-min-posts').value, 2) : null,
                minPaidAmount: card.querySelector('.js-min-paid') ? parseNum(card.querySelector('.js-min-paid').value, 0) : null
            };
        }).filter(Boolean);
    }

    function markInvalid(el, invalid) {
        if (!el) return;
        el.classList.toggle('pt-admin-input-invalid', !!invalid);
    }

    function clearAllInvalid() {
        document.querySelectorAll('.pt-admin-input-invalid').forEach(function (el) {
            el.classList.remove('pt-admin-input-invalid');
        });
    }

    function showValidateToast(msg) {
        M.toast(msg, '参数校验');
    }

    function clamp(n, min, max) {
        return Math.min(max, Math.max(min, n));
    }

    function validateField(key, el) {
        var g = getGlobalValues();
        var rules = getRuleSnapshots();
        var val = el ? parseNum(el.value, NaN) : NaN;
        var intVal = el ? parseIntVal(el.value, NaN) : NaN;

        if (key === 'maxCombinedMultiplier') {
            if (val < LIMITS.tierCap.min || val > LIMITS.tierCap.max) {
                return {
                    ok: false,
                    msg: '请将「分层封顶倍率」调整到 1.0～2.0 之间。',
                    fix: clamp(val, LIMITS.tierCap.min, LIMITS.tierCap.max)
                };
            }
            var maxRule = 1;
            rules.forEach(function (r) {
                if (r.enabled && r.multiplier > maxRule) maxRule = r.multiplier;
            });
            if (maxRule > 1 && val < maxRule) {
                var offender = rules.find(function (r) { return r.enabled && r.multiplier === maxRule; });
                return {
                    ok: false,
                    msg: '「分层封顶倍率」低于「' + (offender ? offender.label : '某规则') + '」的加成倍率（' + maxRule + '），请提高封顶或下调该规则倍率。',
                    fix: roundMul(maxRule)
                };
            }
            if (val > g.globalMaxMultiplier) {
                return {
                    ok: false,
                    msg: '「分层封顶倍率」不能高于「全局封顶倍率」，请降低分层封顶或提高全局封顶。',
                    fix: g.globalMaxMultiplier
                };
            }
            return { ok: true };
        }

        if (key === 'globalMaxMultiplier') {
            if (val < LIMITS.globalCap.min || val > LIMITS.globalCap.max) {
                return {
                    ok: false,
                    msg: '请将「全局封顶倍率」调整到 1.0～5.0 之间。',
                    fix: clamp(val, LIMITS.globalCap.min, LIMITS.globalCap.max)
                };
            }
            if (val < g.maxCombinedMultiplier) {
                return {
                    ok: false,
                    msg: '「全局封顶倍率」不能低于「分层封顶倍率」，请提高全局封顶或降低分层封顶。',
                    fix: g.maxCombinedMultiplier
                };
            }
            if (g.externalBoostStackMode === 'multiply_capped' && val < g.maxCombinedMultiplier * BOOST_CARD_MUL - 0.001) {
                return {
                    ok: false,
                    msg: '连乘模式下「全局封顶倍率」应 ≥ 分层封顶 × 加速卡倍率（约 ' + roundMul(g.maxCombinedMultiplier * BOOST_CARD_MUL) + '），请提高全局封顶或改用「取较高者」。',
                    fix: roundMul(g.maxCombinedMultiplier * BOOST_CARD_MUL)
                };
            }
            return { ok: true };
        }

        if (key === 'dailyTierBonusCap') {
            if (intVal < LIMITS.dailyBonusCap.min || intVal > LIMITS.dailyBonusCap.max) {
                return {
                    ok: false,
                    msg: '请将「单用户每日加成积分上限」调整到 0～5000 之间。',
                    fix: clamp(intVal, LIMITS.dailyBonusCap.min, LIMITS.dailyBonusCap.max)
                };
            }
            return { ok: true };
        }

        if (key === 'ruleMultiplier') {
            var card = el.closest('.pt-admin-rule-card');
            var ruleId = card ? card.getAttribute('data-rule') : '';
            var rule = rules.find(function (r) { return r.id === ruleId; });
            if (!rule) return { ok: true };
            if (val > LIMITS.ruleMul.max) {
                return {
                    ok: false,
                    msg: '请将「' + rule.label + '」的加成倍率降至 1.2 及以下。',
                    fix: LIMITS.ruleMul.max
                };
            }
            if (rule.enabled && val <= LIMITS.ruleMul.min) {
                return {
                    ok: false,
                    msg: '「' + rule.label + '」已启用但倍率 ≤ 1.0，请将加成倍率调到 1.02 以上或关闭该规则。',
                    fix: LIMITS.ruleMul.enabledMin
                };
            }
            if (rule.enabled && val < LIMITS.ruleMul.enabledMin) {
                return {
                    ok: false,
                    msg: '请将「' + rule.label + '」的加成倍率调到 1.02 以上，或关闭该规则。',
                    fix: LIMITS.ruleMul.enabledMin
                };
            }
            if (rule.enabled && val > g.maxCombinedMultiplier) {
                return {
                    ok: false,
                    msg: '「' + rule.label + '」加成倍率高于「分层封顶倍率」，请下调该规则倍率或提高分层封顶。',
                    fix: g.maxCombinedMultiplier
                };
            }
            return { ok: true };
        }

        if (key === 'ruleDays') {
            var cardDays = el.closest('.pt-admin-rule-card');
            var ruleDays = rules.find(function (r) { return r.id === cardDays.getAttribute('data-rule'); });
            if (!ruleDays || !ruleDays.enabled) return { ok: true };
            intVal = parseIntVal(el.value, 0);
            if (intVal < LIMITS.days.min || intVal > LIMITS.days.max) {
                return {
                    ok: false,
                    msg: '请将「' + ruleDays.label + '」的阈值天数调到 1～365 之间。',
                    fix: clamp(intVal, LIMITS.days.min, LIMITS.days.max)
                };
            }
            return { ok: true };
        }

        if (key === 'windowDays') {
            if (intVal < LIMITS.windowDays.min || intVal > LIMITS.windowDays.max) {
                return { ok: false, msg: '请将「统计窗口」调到 1～90 天之间。', fix: clamp(intVal, LIMITS.windowDays.min, LIMITS.windowDays.max) };
            }
            return { ok: true };
        }

        if (key === 'minActions') {
            if (intVal < LIMITS.minActions.min || intVal > LIMITS.minActions.max) {
                return { ok: false, msg: '请将「最少互动次数」调到 1～100 之间。', fix: clamp(intVal, LIMITS.minActions.min, LIMITS.minActions.max) };
            }
            var cardEng = el.closest('.pt-admin-rule-card');
            var minPostsEl = cardEng.querySelector('.js-min-posts');
            var posts = minPostsEl ? parseIntVal(minPostsEl.value, 2) : 2;
            if (intVal < posts) {
                return { ok: false, msg: '「最少互动次数」不能少于「最少不同内容数」，请提高互动次数或降低内容数要求。', fix: posts };
            }
            return { ok: true };
        }

        if (key === 'minPosts') {
            if (intVal < LIMITS.minPosts.min || intVal > LIMITS.minPosts.max) {
                return { ok: false, msg: '请将「最少不同内容数」调到 1～50 之间。', fix: clamp(intVal, LIMITS.minPosts.min, LIMITS.minPosts.max) };
            }
            var cardEng2 = el.closest('.pt-admin-rule-card');
            var actionsEl = cardEng2.querySelector('.js-min-actions');
            var actions = actionsEl ? parseIntVal(actionsEl.value, 3) : 3;
            if (intVal > actions) {
                return { ok: false, msg: '「最少不同内容数」不能大于「最少互动次数」，请降低内容数要求或提高互动次数。', fix: actions };
            }
            return { ok: true };
        }

        if (key === 'minPaid') {
            if (val < LIMITS.minPaid.min || val > LIMITS.minPaid.max) {
                return { ok: false, msg: '请将「最低实付金额」调到 0～99999 之间。', fix: clamp(val, LIMITS.minPaid.min, LIMITS.minPaid.max) };
            }
            return { ok: true };
        }

        if (key === 'bonusMaxDays') {
            if (intVal < LIMITS.bonusMaxDays.min || intVal > LIMITS.bonusMaxDays.max) {
                return { ok: false, msg: '请将「加成最多享」调到 1～90 天之间。', fix: clamp(intVal, LIMITS.bonusMaxDays.min, LIMITS.bonusMaxDays.max) };
            }
            return { ok: true };
        }

        if (key === 'minAuthors') {
            if (intVal < LIMITS.minAuthors.min || intVal > LIMITS.minAuthors.max) {
                return { ok: false, msg: '请将「最少不同作者数」调到 1～50 之间。', fix: clamp(intVal, LIMITS.minAuthors.min, LIMITS.minAuthors.max) };
            }
            return { ok: true };
        }

        if (key === 'minAccountAge') {
            if (intVal < LIMITS.minAccountAge.min || intVal > LIMITS.minAccountAge.max) {
                return { ok: false, msg: '请将「账号最低龄」调到 0～90 天之间。', fix: clamp(intVal, LIMITS.minAccountAge.min, LIMITS.minAccountAge.max) };
            }
            return { ok: true };
        }

        if (key === 'minSubDays') {
            if (intVal < LIMITS.minSubDays.min || intVal > LIMITS.minSubDays.max) {
                return { ok: false, msg: '请将「最少订阅天数」调到 1～365 天之间。', fix: clamp(intVal, LIMITS.minSubDays.min, LIMITS.minSubDays.max) };
            }
            return { ok: true };
        }

        return { ok: true };
    }

    function validateAll() {
        clearAllInvalid();
        var checks = [];

        document.querySelectorAll('.pt-admin-rule-card').forEach(function (card) {
            var mul = card.querySelector('.js-mul');
            if (mul) checks.push({ el: mul, key: 'ruleMultiplier' });
            var days = card.querySelector('.js-days');
            if (days) checks.push({ el: days, key: 'ruleDays' });
            var win = card.querySelector('.js-window');
            if (win) checks.push({ el: win, key: 'windowDays' });
            var ma = card.querySelector('.js-min-actions');
            if (ma) checks.push({ el: ma, key: 'minActions' });
            var mp = card.querySelector('.js-min-posts');
            if (mp) checks.push({ el: mp, key: 'minPosts' });
            var auth = card.querySelector('.js-min-authors');
            if (auth) checks.push({ el: auth, key: 'minAuthors' });
            var age = card.querySelector('.js-min-account-age');
            if (age) checks.push({ el: age, key: 'minAccountAge' });
            var bonus = card.querySelector('.js-bonus-max');
            if (bonus) checks.push({ el: bonus, key: 'bonusMaxDays' });
            var paid = card.querySelector('.js-min-paid');
            if (paid) checks.push({ el: paid, key: 'minPaid' });
            var subDays = card.querySelector('.js-min-sub-days');
            if (subDays) checks.push({ el: subDays, key: 'minSubDays' });
        });

        checks.push({ el: document.getElementById('fldMaxMul'), key: 'maxCombinedMultiplier' });
        checks.push({ el: document.getElementById('fldGlobalMax'), key: 'globalMaxMultiplier' });
        checks.push({ el: document.getElementById('fldDailyBonusCap'), key: 'dailyTierBonusCap' });

        for (var i = 0; i < checks.length; i++) {
            var item = checks[i];
            var res = validateField(item.key, item.el);
            if (!res.ok) {
                markInvalid(item.el, true);
                showValidateToast(res.msg);
                if (item.el && res.fix != null) item.el.value = res.fix;
                item.el && item.el.focus();
                return false;
            }
        }
        return true;
    }

    function onFieldBlur(e) {
        var el = e.target;
        if (!el.classList.contains('js-validate')) return;
        var key = el.getAttribute('data-validate');
        if (!key) {
            if (el.classList.contains('js-mul')) key = 'ruleMultiplier';
            else if (el.classList.contains('js-days')) key = 'ruleDays';
            else if (el.classList.contains('js-window')) key = 'windowDays';
            else if (el.classList.contains('js-min-actions')) key = 'minActions';
            else if (el.classList.contains('js-min-posts')) key = 'minPosts';
            else if (el.classList.contains('js-min-authors')) key = 'minAuthors';
            else if (el.classList.contains('js-min-account-age')) key = 'minAccountAge';
            else if (el.classList.contains('js-bonus-max')) key = 'bonusMaxDays';
            else if (el.classList.contains('js-min-paid')) key = 'minPaid';
            else if (el.classList.contains('js-min-sub-days')) key = 'minSubDays';
        }
        if (!key) return;
        var res = validateField(key, el);
        if (!res.ok) {
            markInvalid(el, true);
            showValidateToast(res.msg);
            if (res.fix != null) el.value = res.fix;
        } else {
            markInvalid(el, false);
            if (key === 'maxCombinedMultiplier' || key === 'globalMaxMultiplier' || key === 'ruleMultiplier') {
                var related = document.getElementById(key === 'globalMaxMultiplier' ? 'fldMaxMul' : 'fldGlobalMax');
                if (related) {
                    var re = validateField(related.getAttribute('data-validate'), related);
                    markInvalid(related, !re.ok);
                }
            }
        }
    }

    function ruleExtraFields(id, rule) {
        if (id === 'consecutiveLoginGte') {
            return (
                '<div>' + fieldLabel('加成最多享（天）', 'bonusMaxDays') +
                '<input class="ant-input js-validate js-bonus-max" type="number" min="1" max="90" data-validate="bonusMaxDays" value="' + (rule.bonusMaxDays || 21) + '"></div>' +
                '<div></div><div></div>'
            );
        }
        if (id === 'hasEngagement') {
            return (
                '<div>' + fieldLabel('统计窗口（天）', 'windowDays') +
                '<input class="ant-input js-validate js-window" type="number" min="1" max="90" data-validate="windowDays" value="' + (rule.windowDays || 7) + '"></div>' +
                '<div>' + fieldLabel('最少互动次数', 'minActions') +
                '<input class="ant-input js-validate js-min-actions" type="number" min="1" max="100" data-validate="minActions" value="' + (rule.minActions || 5) + '"></div>' +
                '<div>' + fieldLabel('最少不同内容数', 'minDistinctPosts') +
                '<input class="ant-input js-validate js-min-posts" type="number" min="1" max="50" data-validate="minPosts" value="' + (rule.minDistinctPosts || 3) + '"></div>' +
                '<div>' + fieldLabel('最少不同作者数', 'minDistinctAuthors') +
                '<input class="ant-input js-validate js-min-authors" type="number" min="1" max="50" data-validate="minAuthors" value="' + (rule.minDistinctAuthors || 2) + '"></div>' +
                '<div>' + fieldLabel('账号最低龄（天）', 'minAccountAgeDays') +
                '<input class="ant-input js-validate js-min-account-age" type="number" min="0" max="90" data-validate="minAccountAge" value="' + (rule.minAccountAgeDays || 3) + '"></div>' +
                '<div></div>'
            );
        }
        if (id === 'hasSubscription') {
            return (
                '<div>' + fieldLabel('最低实付金额', 'minPaidAmount') +
                '<input class="ant-input js-validate js-min-paid" type="number" step="0.1" min="0" data-validate="minPaid" value="' + (rule.minPaidAmount != null ? rule.minPaidAmount : 4.99) + '"></div>' +
                '<div>' + fieldLabel('最少订阅天数', 'minSubscribedDays') +
                '<input class="ant-input js-validate js-min-sub-days" type="number" min="1" max="365" data-validate="minSubDays" value="' + (rule.minSubscribedDays != null ? rule.minSubscribedDays : 7) + '"></div>' +
                '<div style="display:flex;flex-direction:column;justify-content:flex-end">' +
                '<label style="display:inline-flex;align-items:center;gap:6px;margin:0;font-size:12px;color:rgba(0,0,0,0.55)">' +
                '<input type="checkbox" class="js-require-active"' + (rule.requireActive !== false ? ' checked' : '') + '> 须为有效付费订阅' +
                tipHtml('requireActive') + '</label></div>'
            );
        }
        return '<div></div><div></div><div></div>';
    }

    function ruleCard(id, rule, meta) {
        var hasDays = id === 'registerDaysLte' || id === 'consecutiveLoginGte';
        var offCls = rule.enabled ? '' : ' is-off';
        var daysLabel = id === 'registerDaysLte' ? '阈值（天）' : '阈值（天）';
        var daysTip = id === 'registerDaysLte' ? 'ruleDays' : 'ruleDays';
        var mulTip = id === 'registerDaysLte' ? 'ruleMultiplierRegister' : 'ruleMultiplier';
        var daysField = hasDays
            ? '<div>' + fieldLabel(daysLabel, daysTip) +
              '<input class="ant-input js-validate js-days" type="number" min="1" max="365" data-validate="ruleDays" value="' + (rule.days || 0) + '"></div>'
            : '<div></div>';
        var registerNote = id === 'registerDaysLte'
            ? '<div style="display:flex;align-items:flex-end;font-size:12px;color:rgba(0,0,0,.45);line-height:1.45">注册时锁定；建议 ≤5 天、×1.08</div>'
            : '<div style="display:flex;align-items:flex-end;font-size:12px;color:rgba(0,0,0,.45)">防薅建议单条 ≤ 1.08</div>';
        var extraRow = (id === 'consecutiveLoginGte' || id === 'hasEngagement' || id === 'hasSubscription')
            ? '<div class="pt-admin-fields" style="margin-top:10px">' + ruleExtraFields(id, rule) + '</div>'
            : '';
        return (
            '<div class="pt-admin-rule-card' + offCls + '" data-rule="' + id + '">' +
            '<div class="pt-admin-rule-head">' +
            '<div><h3><i class="fa-solid ' + meta.icon + '" style="margin-right:8px;color:#1890ff"></i>' + meta.label + '</h3>' +
            '<div class="hint">' + meta.hint + '</div></div>' +
            '<label style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;margin:0">' +
            '<input type="checkbox" class="js-enabled"' + (rule.enabled ? ' checked' : '') + '> 启用' +
            tipHtml('ruleEnabled') + '</label>' +
            '</div>' +
            '<div class="pt-admin-fields">' + daysField +
            '<div>' + fieldLabel('加成倍率', mulTip) +
            '<input class="ant-input js-validate js-mul" type="number" step="0.05" min="1" max="2" data-validate="ruleMultiplier" value="' + (rule.multiplier || 1) + '"></div>' +
            registerNote +
            '</div>' + extraRow +
            '</div>'
        );
    }

    function renderExcludedTypes(selected) {
        var mount = document.getElementById('fldExcludedTypesMount');
        if (!mount) return;
        var opts = (window.FLPointsTier && window.FLPointsTier.EXCLUDED_ACTIVITY_OPTIONS) || [];
        var set = {};
        (selected || []).forEach(function (id) { set[id] = true; });
        mount.innerHTML = opts.map(function (o) {
            return '<label class="pt-excluded-check">' +
                '<input type="checkbox" class="js-excluded-type" value="' + o.id + '"' +
                (set[o.id] ? ' checked' : '') + '> ' + o.label + '</label>';
        }).join('');
    }

    function collectExcludedTypes() {
        return Array.prototype.map.call(
            document.querySelectorAll('.js-excluded-type:checked'),
            function (el) { return el.value; }
        );
    }

    function fillStaticTips() {
        document.querySelectorAll('.pt-field-tip-pop[data-tip-key]').forEach(function (pop) {
            var key = pop.getAttribute('data-tip-key');
            if (FIELD_TIPS[key]) pop.textContent = FIELD_TIPS[key];
        });
    }

    function renderPublishMeta() {
        var el = document.getElementById('tierPublishLine');
        var draftEl = document.getElementById('tierMetaLine');
        if (!el) return;
        var pub = Store.getPublishedMeta();
        var draft = state.cfg || Store.getConfig();
        if (pub && pub.publishedAt) {
            el.innerHTML = '<span class="ant-tag ant-tag-green">已发布</span> v' + pub.version +
                ' · ' + pub.publishedAt + ' · ' + (pub.publishedBy || '—');
        } else {
            el.innerHTML = '<span class="ant-tag ant-tag-orange">未发布</span> 用户端当前使用内置默认配置';
        }
        if (draftEl) {
            draftEl.textContent = '草稿最近更新：' + (draft.updatedAt || '—') + ' · ' + (draft.updatedBy || '—');
        }
    }

    function collectDangerWarnings(cfg) {
        var warnings = [];
        var excluded = cfg.excludedActivityTypes || [];
        if (excluded.indexOf('earn_invite') < 0) {
            warnings.push('「邀请拉新」未排除分层，高额邀请奖励可被加成放大，极易被薅。');
        }
        if (excluded.indexOf('campaign') < 0) {
            warnings.push('「研发活动」未排除分层，限时活动面额叠加分层存在预算风险。');
        }
        if (cfg.externalBoostStackMode === 'multiply_capped') {
            warnings.push('加速卡与分层为连乘模式，即使受全局封顶，仍高于「取较高者」，薅羊毛收益更大。');
        }
        if ((cfg.dailyTierBonusCap || 0) > 200) {
            warnings.push('每日分层加成上限超过 200，单账号薅取空间偏大。');
        }
        return warnings;
    }

    function renderConflictNotes() {
        /* 运营向说明已收敛至页顶 pt-module-tip；研发说明见 pt-dev-glass */
    }

    function bindValidation() {
        if (state.bound) return;
        state.bound = true;
        document.addEventListener('focusout', function (e) {
            if (e.target && e.target.classList && e.target.classList.contains('js-validate')) {
                onFieldBlur(e);
            }
        });
        document.getElementById('fldExtStack').addEventListener('change', function () {
            var el = document.getElementById('fldGlobalMax');
            var res = validateField('globalMaxMultiplier', el);
            if (!res.ok) {
                markInvalid(el, true);
                showValidateToast(res.msg);
                if (res.fix != null) el.value = res.fix;
            } else {
                markInvalid(el, false);
            }
        });
        document.getElementById('tierRulesMount').addEventListener('change', function (e) {
            if (e.target && e.target.classList.contains('js-enabled') && e.target.closest('.pt-admin-rule-card')) {
                var mul = e.target.closest('.pt-admin-rule-card').querySelector('.js-mul');
                if (mul) onFieldBlur({ target: mul });
            }
        });
    }

    function render() {
        state.cfg = Store.getConfig();
        document.getElementById('fldMaxMul').value = state.cfg.maxCombinedMultiplier || 1.5;
        document.getElementById('fldGlobalMax').value = state.cfg.globalMaxMultiplier || 1.65;
        document.getElementById('fldDailyBonusCap').value = state.cfg.dailyTierBonusCap || 80;
        document.getElementById('fldExtStack').value = state.cfg.externalBoostStackMode || 'max_only';
        renderExcludedTypes(state.cfg.excludedActivityTypes);
        renderPublishMeta();

        var html = RULE_ORDER.map(function (id) {
            return ruleCard(id, state.cfg.rules[id] || {}, Store.RULE_META[id]);
        }).join('');
        document.getElementById('tierRulesMount').innerHTML = html;
        fillStaticTips();
        clearAllInvalid();
    }

    function collect() {
        var cfg = JSON.parse(JSON.stringify(state.cfg));
        cfg.maxCombinedMultiplier = parseFloat(document.getElementById('fldMaxMul').value) || 1.5;
        cfg.globalMaxMultiplier = parseFloat(document.getElementById('fldGlobalMax').value) || 1.65;
        cfg.dailyTierBonusCap = parseInt(document.getElementById('fldDailyBonusCap').value, 10) || 80;
        cfg.externalBoostStackMode = document.getElementById('fldExtStack').value;
        cfg.excludedActivityTypes = collectExcludedTypes();
        cfg.stackMode = 'multiply';
        RULE_ORDER.forEach(function (id) {
            var card = document.querySelector('.pt-admin-rule-card[data-rule="' + id + '"]');
            if (!card) return;
            var rule = cfg.rules[id] || {};
            rule.enabled = card.querySelector('.js-enabled').checked;
            rule.multiplier = parseFloat(card.querySelector('.js-mul').value) || 1;
            var daysInput = card.querySelector('.js-days');
            if (daysInput) rule.days = parseInt(daysInput.value, 10) || 0;
            if (id === 'consecutiveLoginGte') {
                var bonusMax = card.querySelector('.js-bonus-max');
                if (bonusMax) rule.bonusMaxDays = parseInt(bonusMax.value, 10) || 21;
            }
            if (id === 'hasEngagement') {
                rule.windowDays = parseInt(card.querySelector('.js-window').value, 10) || 7;
                rule.minActions = parseInt(card.querySelector('.js-min-actions').value, 10) || 5;
                rule.minDistinctPosts = parseInt(card.querySelector('.js-min-posts').value, 10) || 3;
                rule.minDistinctAuthors = parseInt(card.querySelector('.js-min-authors').value, 10) || 2;
                rule.minAccountAgeDays = parseInt(card.querySelector('.js-min-account-age').value, 10) || 3;
                rule.excludeSelfContent = true;
            }
            if (id === 'hasSubscription') {
                rule.minPaidAmount = parseFloat(card.querySelector('.js-min-paid').value) || 0;
                rule.minSubscribedDays = parseInt(card.querySelector('.js-min-sub-days').value, 10) || 7;
                rule.requireActive = card.querySelector('.js-require-active').checked;
            }
            cfg.rules[id] = rule;
        });
        return cfg;
    }

    function runSim() {
        if (!validateAll()) return;
        var profile = document.getElementById('simProfile').value;
        var cfg = collect();
        Store.putConfig(cfg);
        var res = Store.simulateUser(profile);
        document.getElementById('simOutput').textContent = JSON.stringify({
            profile: profile,
            tierMultiplier: res.tierMultiplier,
            externalMultiplier: res.externalMultiplier,
            effectiveMultiplier: res.effectiveMultiplier,
            matched: res.matched.map(function (m) { return m.label + ' ' + m.multiplier + (m.detail ? ' (' + m.detail + ')' : ''); }),
            registerDaysPolicy: res.registerDaysPolicy,
            dailyTierBonusCap: cfg.dailyTierBonusCap,
            sample_reward_50: res.sample50,
            sample_reward_200: res.sample200,
            sample_invite_200: window.FLPointsTier.calcReward(200, res.user, cfg, { activityTypeId: 'earn_invite', trackDailyBonus: false })
        }, null, 2);
    }

    document.getElementById('btnSaveTier').addEventListener('click', function () {
        if (!validateAll()) return;
        M.confirmGoogle({
            title: '保存分层草稿',
            message: '草稿仅保存在后台，C 端用户须待「发布上线」后才会生效。请输入谷歌验证码确认保存。',
            onVerified: function () {
                var cfg = collect();
                Store.putConfig(cfg);
                state.cfg = cfg;
                render();
                M.toast('草稿已保存，请点击「发布上线」同步至用户端');
            }
        });
    });

    document.getElementById('btnPublishTier').addEventListener('click', function () {
        if (!validateAll()) return;
        var cfg = collect();
        var dangers = collectDangerWarnings(cfg);
        var msg = '发布后将立即影响全站积分发奖结算（C 端读取已发布版本）。请输入谷歌验证码确认发布。';
        if (dangers.length) {
            msg += '\n\n高风险项：\n' + dangers.map(function (w, i) { return (i + 1) + '. ' + w; }).join('\n');
        }
        M.confirmGoogle({
            title: '发布积分分层配置',
            message: msg,
            onVerified: function () {
                Store.putConfig(cfg);
                var pub = Store.publishConfig(cfg);
                state.cfg = cfg;
                render();
                M.toast('已发布 v' + (pub && pub.version ? pub.version : '') + '，C 端将按服务端结算读取');
            }
        });
    });

    document.getElementById('btnResetTier').addEventListener('click', function () {
        M.confirmGoogle({
            title: '恢复默认配置',
            message: '将清除本地自定义分层规则，恢复优化后的默认防薅参数。请输入谷歌验证码确认。',
            onVerified: function () {
                Store.resetConfig();
                render();
                M.toast('已恢复默认');
            }
        });
    });

    document.getElementById('btnSimRun').addEventListener('click', runSim);
    bindValidation();
    render();
})();
