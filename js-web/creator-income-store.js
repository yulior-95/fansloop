/**
 * 创作者收入 · 侧栏 chip / 收入页共享（按账号 + 自然月）
 */
(function (global) {
    var DEMO_UID = 'demo_uid_882910';
    var LS_KEY = 'fl_creator_income_v1';

    function currentMonthKey() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    function userId() {
        if (global.FansloopAuth && global.FansloopAuth.getUserId) {
            return global.FansloopAuth.getUserId();
        }
        return null;
    }

    function readStored(uid) {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (!data || data.userId !== uid || data.monthKey !== currentMonthKey()) return null;
            return data;
        } catch (e) {
            return null;
        }
    }

    function demoMonthlyUsdt() {
        return 298.4;
    }

    function getMonthlyUsdt() {
        var uid = userId();
        if (!uid) return demoMonthlyUsdt();

        if (uid === DEMO_UID) {
            var storedDemo = readStored(uid);
            if (storedDemo && typeof storedDemo.monthlyUsdt === 'number' && storedDemo.monthlyUsdt > 0) {
                return storedDemo.monthlyUsdt;
            }
            return demoMonthlyUsdt();
        }

        var stored = readStored(uid);
        if (stored && typeof stored.monthlyUsdt === 'number') {
            return stored.monthlyUsdt > 0 ? stored.monthlyUsdt : 0;
        }

        var acc = global.FLUserRegistry && global.FLUserRegistry.getByUserId
            ? global.FLUserRegistry.getByUserId(uid)
            : null;
        if (!acc || acc.role !== 'Creator') return 0;

        return 0;
    }

    function formatUsdtFull(n) {
        return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatChipText(amount) {
        if (amount >= 10000) {
            return '+' + (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        if (amount >= 1000) {
            return '+' + Math.round(amount);
        }
        var compact = Number(amount).toLocaleString('en-US', { maximumFractionDigits: 1 });
        return '+' + compact;
    }

    function chipTipLabel(amount) {
        var lang = global.FansLoopLang && global.FansLoopLang.getLang
            ? global.FansLoopLang.getLang()
            : 'zh-CN';
        var formatted = formatUsdtFull(amount);
        if (lang === 'en') {
            return 'Creator income this month · ' + formatted + ' USDT';
        }
        if (lang === 'zh-TW') {
            return '本月創作者收入 · ' + formatted + ' USDT';
        }
        return '本月创作者收入 · ' + formatted + ' USDT';
    }

    function chipHintShort() {
        var lang = global.FansLoopLang && global.FansLoopLang.getLang
            ? global.FansLoopLang.getLang()
            : 'zh-CN';
        if (lang === 'en') return 'Income this month (USDT)';
        if (lang === 'zh-TW') return '本月創作者收入（USDT）';
        return '本月创作者收入（USDT）';
    }

    function getSidebarChip() {
        var amount = getMonthlyUsdt();
        if (!(amount > 0)) return null;
        return {
            text: formatChipText(amount),
            title: chipTipLabel(amount),
            hint: chipHintShort(),
            amount: amount
        };
    }

    function persistMonthly(uid, monthlyUsdt) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify({
                userId: uid,
                monthKey: currentMonthKey(),
                monthlyUsdt: monthlyUsdt
            }));
        } catch (e) { /* ignore */ }
        try {
            global.dispatchEvent(new CustomEvent('fl-creator-income-change'));
        } catch (e2) { /* ignore */ }
    }

    global.FLCreatorIncomeStore = {
        getMonthlyUsdt: getMonthlyUsdt,
        getSidebarChip: getSidebarChip,
        formatChipText: formatChipText,
        setMonthlyUsdt: function (amount) {
            var uid = userId();
            if (!uid) return;
            persistMonthly(uid, amount > 0 ? amount : 0);
        }
    };
})(typeof window !== 'undefined' ? window : global);
