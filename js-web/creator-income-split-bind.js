/**
 * 将创作者分成配置绑定到 C 端展示位
 */
(function (global) {
    var Split = global.FLCreatorIncomeSplit;

    function setText(el, text) {
        if (el) el.textContent = text;
    }

    function bindEarningsSettings() {
        if (!Split) return;
        var sub = Split.getRule('subscription');
        var tip = Split.getTipGiftCreatorPercent();
        var ppv = Split.getRule('ppv');

        setText(document.getElementById('earnSplitSubPct'), sub.creatorPercent + '%');
        setText(document.getElementById('earnSplitSubSub'), '粉丝月付订阅 · 你获得 ' + sub.creatorPercent + '%');
        setText(document.getElementById('earnSplitTipPct'), tip + '%');
        setText(document.getElementById('earnSplitTipSub'), '直播 / 动态打赏 · 你获得 ' + tip + '%');
        setText(document.getElementById('earnSplitPpvPct'), ppv.creatorPercent + '%');
        setText(document.getElementById('earnSplitPpvSub'), '粉丝按篇付费购买 · 你获得 ' + ppv.creatorPercent + '%');
    }

    function bindSplitTables() {
        if (!Split) return;
        var html = Split.renderSplitTableRows();
        document.querySelectorAll('[data-income-split-table]').forEach(function (tbody) {
            tbody.innerHTML = html;
        });
        var tip = Split.getRule('tip_live');
        document.querySelectorAll('[data-income-split-fee-tip]').forEach(function (el) {
            el.textContent = String(tip.platformPercent);
        });
    }

    function init() {
        bindEarningsSettings();
        bindSplitTables();
    }

    global.FLCreatorIncomeSplitBind = {
        init: init,
        bindEarningsSettings: bindEarningsSettings,
        bindSplitTables: bindSplitTables
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(typeof window !== 'undefined' ? window : this);
