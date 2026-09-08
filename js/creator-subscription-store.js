/**
 * 创作者会员订阅档位价格（Web / H5 共用 localStorage）
 * configured=false 或月付未达最低价 → 创建页不可勾选「订阅专属」
 */
(function (global) {
    var KEY = 'gf_creator_subscription_tiers';
    var MIN = 5;

    function read() {
        try {
            return JSON.parse(localStorage.getItem(KEY) || 'null');
        } catch (e) {
            return null;
        }
    }

    function write(data) {
        try {
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) {}
    }

    function normalize(raw) {
        if (!raw || typeof raw !== 'object') return null;
        return {
            monthly: parseFloat(raw.monthly) || 0,
            quarterly: parseFloat(raw.quarterly) || 0,
            annual: parseFloat(raw.annual) || 0,
            configured: !!raw.configured,
            updatedAt: raw.updatedAt || 0
        };
    }

    function hasConfiguredPrice() {
        var t = normalize(read());
        if (!t || !t.configured) return false;
        return t.monthly >= MIN;
    }

    function getMonthlyPrice() {
        var t = normalize(read());
        if (!t || !t.configured || t.monthly < MIN) return null;
        return t.monthly;
    }

    function getTiers() {
        return normalize(read());
    }

    function saveTiers(prices, configured) {
        write({
            monthly: parseFloat(prices && prices.monthly) || 0,
            quarterly: parseFloat(prices && prices.quarterly) || 0,
            annual: parseFloat(prices && prices.annual) || 0,
            configured: configured !== false,
            updatedAt: Date.now()
        });
    }

    function clearConfigured() {
        var t = normalize(read()) || { monthly: 0, quarterly: 0, annual: 0 };
        t.configured = false;
        t.updatedAt = Date.now();
        write(t);
    }

    global.CreatorSubscriptionStore = {
        KEY: KEY,
        MIN: MIN,
        read: read,
        getTiers: getTiers,
        hasConfiguredPrice: hasConfiguredPrice,
        getMonthlyPrice: getMonthlyPrice,
        saveTiers: saveTiers,
        clearConfigured: clearConfigured
    };
})(typeof window !== 'undefined' ? window : this);
