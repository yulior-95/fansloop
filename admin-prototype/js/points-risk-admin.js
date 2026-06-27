(function () {
    var Risk = window.FLPointsRisk;
    var M = window.AdminModal;
    if (!Risk) return;

    var state = { cfg: null };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function channelMode(chVal) {
        if (chVal === 0) return 'instant';
        if (chVal === null || chVal === undefined || chVal === '') return 'global';
        return 'custom';
    }

    function renderChannelRows() {
        var g = state.cfg.coolingPeriodDays || 0;
        return Risk.getCoolingTypeRows().map(function (row) {
            var val = state.cfg.channelCooling[row.id];
            var mode = channelMode(val);
            var customDays = mode === 'custom' ? val : g;
            return (
                '<tr data-channel="' + esc(row.id) + '">' +
                '<td><strong>' + esc(row.label) + '</strong>' +
                '<div style="font-size:11px;color:rgba(0,0,0,.4);margin-top:2px;font-family:monospace">' + esc(row.id) + '</div>' +
                '<div style="font-size:12px;color:rgba(0,0,0,.45);margin-top:2px">' + esc(row.hint) + '</div></td>' +
                '<td><select class="ant-input js-ch-mode" style="width:140px;height:32px">' +
                '<option value="global"' + (mode === 'global' ? ' selected' : '') + '>跟随全局</option>' +
                '<option value="instant"' + (mode === 'instant' ? ' selected' : '') + '>即时可用</option>' +
                '<option value="custom"' + (mode === 'custom' ? ' selected' : '') + '>自定义</option>' +
                '</select></td>' +
                '<td><input class="ant-input js-ch-days" type="number" min="0" value="' + customDays + '" style="width:88px"' + (mode === 'custom' ? '' : ' disabled') + '></td>' +
                '<td class="js-ch-preview" style="font-size:13px;color:rgba(0,0,0,.65)">—</td>' +
                '</tr>'
            );
        }).join('');
    }

    function previewRow(tr) {
        var mode = tr.querySelector('.js-ch-mode').value;
        var daysInput = tr.querySelector('.js-ch-days');
        var globalDays = parseInt(document.getElementById('fldCoolingDays').value, 10) || 0;
        var enabled = document.getElementById('fldCoolingEnabled').checked;
        var preview = tr.querySelector('.js-ch-preview');
        if (!enabled) {
            preview.textContent = '冷静期已关闭 · 即时可用';
            return;
        }
        if (mode === 'instant') {
            preview.textContent = '即时可用';
            return;
        }
        if (mode === 'global') {
            preview.textContent = '跟随全局 · ' + Risk.formatCoolingLabel(globalDays);
            return;
        }
        var d = parseInt(daysInput.value, 10) || 0;
        preview.textContent = Risk.formatCoolingLabel(d);
    }

    function refreshPreviews() {
        document.querySelectorAll('#channelCoolingTable tbody tr').forEach(previewRow);
    }

    function bindChannelTable() {
        document.querySelectorAll('#channelCoolingTable tbody tr').forEach(function (tr) {
            var modeSel = tr.querySelector('.js-ch-mode');
            var daysInput = tr.querySelector('.js-ch-days');
            modeSel.addEventListener('change', function () {
                var m = modeSel.value;
                daysInput.disabled = m !== 'custom';
                if (m === 'global') daysInput.value = document.getElementById('fldCoolingDays').value;
                if (m === 'instant') daysInput.value = '0';
                previewRow(tr);
            });
            daysInput.addEventListener('input', function () { previewRow(tr); });
        });
    }

    function render() {
        state.cfg = Risk.loadConfig();
        var c = state.cfg;
        document.getElementById('fldPlatformDailyBudget').value = c.caps.platformDailyBudget;
        document.getElementById('fldDailyPointsCap').value = c.caps.dailyPointsCap;
        document.getElementById('fldInviteDailyCap').value = c.caps.inviteRewardDailyCap;
        document.getElementById('fldInviteTotalCap').value = c.caps.inviteRewardTotalCap;
        document.getElementById('fldCoolingEnabled').checked = !!c.coolingEnabled;
        document.getElementById('fldCoolingDays').value = c.coolingPeriodDays;
        document.getElementById('fldCoolingDays').disabled = !c.coolingEnabled;
        document.getElementById('pointsRiskMeta').textContent =
            '最近更新：' + (c.updatedAt || '—') + ' · ' + (c.updatedBy || '—') +
            ' · 活动类型 ' + Risk.getCoolingTypeRows().length + ' 项（与「活动类型管理」获取类同步）';
        document.getElementById('channelCoolingBody').innerHTML = renderChannelRows();
        bindChannelTable();
        refreshPreviews();
    }

    function collectChannelCooling() {
        var out = {};
        document.querySelectorAll('#channelCoolingTable tbody tr').forEach(function (tr) {
            var id = tr.getAttribute('data-channel');
            var mode = tr.querySelector('.js-ch-mode').value;
            if (mode === 'global') out[id] = null;
            else if (mode === 'instant') out[id] = 0;
            else out[id] = parseInt(tr.querySelector('.js-ch-days').value, 10) || 0;
        });
        return out;
    }

    function collect() {
        var cfg = JSON.parse(JSON.stringify(state.cfg));
        cfg.coolingEnabled = document.getElementById('fldCoolingEnabled').checked;
        cfg.coolingPeriodDays = parseInt(document.getElementById('fldCoolingDays').value, 10) || 0;
        cfg.channelCooling = collectChannelCooling();
        cfg.caps = {
            platformDailyBudget: parseInt(document.getElementById('fldPlatformDailyBudget').value, 10) || 0,
            dailyPointsCap: parseInt(document.getElementById('fldDailyPointsCap').value, 10) || 0,
            inviteRewardDailyCap: parseInt(document.getElementById('fldInviteDailyCap').value, 10) || 0,
            inviteRewardTotalCap: parseInt(document.getElementById('fldInviteTotalCap').value, 10) || 0
        };
        return cfg;
    }

    function syncActivitiesCooling(cfg) {
        var Store = window.FLPointsActivityStore;
        if (!Store) return;
        var list = Store.getActivities();
        var changed = false;
        list.forEach(function (act) {
            if (!Store.isPointsEarnType(act.typeId)) return;
            var days = Risk.resolveCoolingDays(act.typeId, cfg);
            if (act.coolingDays !== days) {
                act.coolingDays = days;
                changed = true;
            }
        });
        if (changed) Store.saveActivities(list);
    }

    function savePointsRisk() {
        M.confirmGoogle({
            title: '保存积分风控配置',
            message: '将影响全站积分额度与冷静期规则，C 端将同步读取。请输入谷歌验证码确认保存。',
            onVerified: function () {
                var cfg = collect();
                Risk.saveConfig(cfg);
                syncActivitiesCooling(cfg);
                state.cfg = cfg;
                render();
                M.toast('积分风控配置已保存，C 端已同步');
            }
        });
    }

    document.getElementById('btnPointsRiskSave').addEventListener('click', savePointsRisk);
    document.getElementById('btnPointsRiskReset').addEventListener('click', function () {
        M.confirmGoogle({
            title: '恢复默认积分风控',
            message: '将清除本地自定义积分风控与冷静期配置。请输入谷歌验证码确认。',
            onVerified: function () {
                Risk.resetConfig();
                render();
                M.toast('已恢复默认');
            }
        });
    });

    document.getElementById('fldCoolingEnabled').addEventListener('change', function () {
        document.getElementById('fldCoolingDays').disabled = !this.checked;
        refreshPreviews();
    });
    document.getElementById('fldCoolingDays').addEventListener('input', refreshPreviews);

    render();
})();
