(function () {
    var Store = window.FLAdminPointsTier;
    var M = window.AdminModal;
    if (!Store) return;

    var state = { cfg: null };

    var RULE_ORDER = [
        'registerDaysLte',
        'consecutiveLoginGte',
        'hasEngagement',
        'hasSubscription'
    ];

    function ruleCard(id, rule, meta) {
        var hasDays = id === 'registerDaysLte' || id === 'consecutiveLoginGte';
        var offCls = rule.enabled ? '' : ' is-off';
        var daysField = hasDays
            ? '<div><label>阈值（天）</label><input class="ant-input js-days" type="number" min="0" value="' + (rule.days || 0) + '"></div>'
            : '<div></div>';
        return (
            '<div class="pt-admin-rule-card' + offCls + '" data-rule="' + id + '">' +
            '<div class="pt-admin-rule-head">' +
            '<div><h3><i class="fa-solid ' + meta.icon + '" style="margin-right:8px;color:#1890ff"></i>' + meta.label + '</h3>' +
            '<div class="hint">' + meta.hint + '</div></div>' +
            '<label><input type="checkbox" class="js-enabled"' + (rule.enabled ? ' checked' : '') + '> 启用</label>' +
            '</div>' +
            '<div class="pt-admin-fields">' + daysField +
            '<div><label>加成倍率</label><input class="ant-input js-mul" type="number" step="0.05" min="0.1" value="' + (rule.multiplier || 1) + '"></div>' +
            '<div style="display:flex;align-items:flex-end;font-size:12px;color:rgba(0,0,0,.45)">命中后积分 × 倍率</div>' +
            '</div></div>'
        );
    }

    function render() {
        state.cfg = Store.getConfig();
        document.getElementById('fldMaxMul').value = state.cfg.maxCombinedMultiplier || 3;
        document.getElementById('tierMetaLine').textContent =
            '最近更新：' + (state.cfg.updatedAt || '—') + ' · ' + (state.cfg.updatedBy || '—');

        var html = RULE_ORDER.map(function (id) {
            return ruleCard(id, state.cfg.rules[id] || {}, Store.RULE_META[id]);
        }).join('');
        document.getElementById('tierRulesMount').innerHTML = html;
    }

    function collect() {
        var cfg = JSON.parse(JSON.stringify(state.cfg));
        cfg.maxCombinedMultiplier = parseFloat(document.getElementById('fldMaxMul').value) || 3;
        cfg.stackMode = document.getElementById('fldStack').value;
        RULE_ORDER.forEach(function (id) {
            var card = document.querySelector('.pt-admin-rule-card[data-rule="' + id + '"]');
            if (!card) return;
            var rule = cfg.rules[id] || {};
            rule.enabled = card.querySelector('.js-enabled').checked;
            rule.multiplier = parseFloat(card.querySelector('.js-mul').value) || 1;
            var daysInput = card.querySelector('.js-days');
            if (daysInput) rule.days = parseInt(daysInput.value, 10) || 0;
            cfg.rules[id] = rule;
        });
        return cfg;
    }

    function runSim() {
        var profile = document.getElementById('simProfile').value;
        var cfg = collect();
        Store.putConfig(cfg);
        var res = Store.simulateUser(profile);
        document.getElementById('simOutput').textContent = JSON.stringify({
            profile: profile,
            effectiveMultiplier: res.effectiveMultiplier,
            matched: res.matched.map(function (m) { return m.label + ' ' + m.multiplier; }),
            sample_reward_50: res.sample50,
            sample_reward_200: res.sample200
        }, null, 2);
    }

    document.getElementById('btnSaveTier').addEventListener('click', function () {
        M.confirmGoogle({
            title: '保存积分分层配置',
            message: '变更将影响全站积分发放倍率，确认保存？',
            onVerified: function () {
                var cfg = collect();
                Store.putConfig(cfg);
                state.cfg = cfg;
                render();
                M.toast('分层配置已保存，C 端将同步读取');
            }
        });
    });

    document.getElementById('btnResetTier').addEventListener('click', function () {
        M.confirmGoogle({
            title: '恢复默认配置',
            message: '将清除本地自定义分层规则。',
            onVerified: function () {
                Store.resetConfig();
                render();
                M.toast('已恢复默认');
            }
        });
    });

    document.getElementById('btnSimRun').addEventListener('click', runSim);
    render();
})();
