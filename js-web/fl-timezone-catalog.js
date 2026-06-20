/**
 * IANA 时区目录 · 供设置页时区选择器使用
 */
(function (global) {
    var FALLBACK_IDS = [
        'Pacific/Midway', 'Pacific/Honolulu', 'America/Anchorage', 'America/Los_Angeles', 'America/Denver',
        'America/Chicago', 'America/New_York', 'America/Caracas', 'America/Sao_Paulo', 'Atlantic/South_Georgia',
        'Atlantic/Azores', 'UTC', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Helsinki',
        'Europe/Moscow', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok',
        'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Taipei', 'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney',
        'Pacific/Guam', 'Pacific/Auckland', 'Pacific/Fiji'
    ];

    var CITY_ZH = {
        Shanghai: '上海', Hong_Kong: '香港', Taipei: '台北', Tokyo: '东京', Seoul: '首尔',
        New_York: '纽约', Los_Angeles: '洛杉矶', Chicago: '芝加哥', Denver: '丹佛', Anchorage: '安克雷奇',
        London: '伦敦', Paris: '巴黎', Berlin: '柏林', Moscow: '莫斯科', Dubai: '迪拜',
        Sydney: '悉尼', Auckland: '奥克兰', Singapore: '新加坡', Bangkok: '曼谷', Jakarta: '雅加达',
        Mumbai: '孟买', Kolkata: '加尔各答', Karachi: '卡拉奇', Dhaka: '达卡', Manila: '马尼拉',
        Honolulu: '檀香山', Sao_Paulo: '圣保罗', Toronto: '多伦多', Vancouver: '温哥华',
        Mexico_City: '墨西哥城', Buenos_Aires: '布宜诺斯艾利斯', Cairo: '开罗', Johannesburg: '约翰内斯堡',
        Istanbul: '伊斯坦布尔', Riyadh: '利雅得', Jerusalem: '耶路撒冷', Hanoi: '河内',
        Ho_Chi_Minh: '胡志明市', Kuala_Lumpur: '吉隆坡', Macau: '澳门', Urumqi: '乌鲁木齐',
        Chongqing: '重庆', Harbin: '哈尔滨', Ulaanbaatar: '乌兰巴托', Vladivostok: '海参崴',
        Guam: '关岛', Fiji: '斐济', Midway: '中途岛', Azores: '亚速尔', Helsinki: '赫尔辛基',
        Rome: '罗马', Madrid: '马德里', Amsterdam: '阿姆斯特丹', Zurich: '苏黎世', Vienna: '维也纳',
        Warsaw: '华沙', Athens: '雅典', Lisbon: '里斯本', Dublin: '都柏林', Reykjavik: '雷克雅未克'
    };

    var REGION_ZH = {
        Pacific: '太平洋', America: '美洲', Atlantic: '大西洋', Europe: '欧洲', Africa: '非洲',
        Asia: '亚洲', Indian: '印度洋', Australia: '澳大利亚', Antarctica: '南极洲', Arctic: '北极',
        Etc: '其他'
    };

    function getOffsetMinutes(tz, date) {
        date = date || new Date();
        try {
            var parts = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                timeZoneName: 'shortOffset'
            }).formatToParts(date);
            var off = parts.find(function (p) { return p.type === 'timeZoneName'; });
            if (off && off.value) {
                var m = off.value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
                if (m) {
                    var mins = parseInt(m[2], 10) * 60 + parseInt(m[3] || '0', 10);
                    return m[1] === '-' ? -mins : mins;
                }
            }
        } catch (e) { /* fall through */ }
        return 0;
    }

    function formatOffset(mins) {
        var sign = mins >= 0 ? '+' : '-';
        var abs = Math.abs(mins);
        var h = Math.floor(abs / 60);
        var m = abs % 60;
        return 'UTC' + sign + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }

    function cityLabel(id) {
        var key = id.split('/').pop();
        var seg = key.replace(/_/g, ' ');
        return CITY_ZH[key] || seg;
    }

    function regionLabel(id) {
        if (id === 'UTC') return '协调世界时';
        var r = id.split('/')[0];
        return REGION_ZH[r] || r;
    }

    function buildEntry(id) {
        var mins = getOffsetMinutes(id);
        var city = cityLabel(id);
        var region = regionLabel(id);
        return {
            id: id,
            label: formatOffset(mins) + ' · ' + city,
            desc: region + ' · ' + id,
            offset: mins,
            city: city,
            icon: 'fa-solid fa-clock'
        };
    }

    function allIds() {
        try {
            if (typeof Intl.supportedValuesOf === 'function') {
                var list = Intl.supportedValuesOf('timeZone');
                if (list && list.length) return list.slice();
            }
        } catch (e) { /* ignore */ }
        return FALLBACK_IDS.slice();
    }

    var _cache = null;

    function getAll() {
        if (_cache) return _cache;
        _cache = allIds().map(buildEntry).sort(function (a, b) {
            if (a.offset !== b.offset) return a.offset - b.offset;
            return a.city.localeCompare(b.city, 'zh-CN');
        });
        return _cache;
    }

    function find(id) {
        if (id === 'system') {
            var sys = 'UTC';
            try { sys = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { /* ignore */ }
            return {
                id: 'system',
                label: '跟随系统',
                desc: '当前设备：' + sys,
                offset: 0,
                icon: 'fa-solid fa-laptop'
            };
        }
        var hit = getAll().filter(function (t) { return t.id === id; })[0];
        if (hit) return Object.assign({}, hit);
        return buildEntry(id);
    }

    function filter(q) {
        q = (q || '').trim().toLowerCase();
        if (!q) return getAll();
        return getAll().filter(function (t) {
            return t.id.toLowerCase().indexOf(q) >= 0 ||
                t.label.toLowerCase().indexOf(q) >= 0 ||
                t.desc.toLowerCase().indexOf(q) >= 0 ||
                t.city.toLowerCase().indexOf(q) >= 0;
        });
    }

    global.FLTimezoneCatalog = {
        getAll: getAll,
        find: find,
        filter: filter,
        formatOffset: formatOffset,
        systemTimezone: function () {
            try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
        }
    };
})(window);
