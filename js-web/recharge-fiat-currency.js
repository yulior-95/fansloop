/**
 * 法币充值页 · 全球主流货币下拉模糊搜索（原型）
 */
(function () {
    var CURRENCIES = [
        { code: 'USD', name: '美元 United States Dollar', sym: '$' },
        { code: 'EUR', name: '欧元 Euro', sym: '€' },
        { code: 'GBP', name: '英镑 British Pound', sym: '£' },
        { code: 'JPY', name: '日元 Japanese Yen', sym: '¥' },
        { code: 'CNY', name: '人民币 Chinese Yuan', sym: '¥' },
        { code: 'HKD', name: '港币 Hong Kong Dollar', sym: 'HK$' },
        { code: 'TWD', name: '新台币 Taiwan Dollar', sym: 'NT$' },
        { code: 'SGD', name: '新加坡元 Singapore Dollar', sym: 'S$' },
        { code: 'KRW', name: '韩元 Korean Won', sym: '₩' },
        { code: 'AUD', name: '澳元 Australian Dollar', sym: 'A$' },
        { code: 'NZD', name: '新西兰元 NZ Dollar', sym: 'NZ$' },
        { code: 'CAD', name: '加元 Canadian Dollar', sym: 'C$' },
        { code: 'CHF', name: '瑞士法郎 Swiss Franc', sym: 'CHF' },
        { code: 'SEK', name: '瑞典克朗 Swedish Krona', sym: 'kr' },
        { code: 'NOK', name: '挪威克朗 Norwegian Krone', sym: 'kr' },
        { code: 'DKK', name: '丹麦克朗 Danish Krone', sym: 'kr' },
        { code: 'PLN', name: '波兰兹罗提 Polish Zloty', sym: 'zł' },
        { code: 'CZK', name: '捷克克朗 Czech Koruna', sym: 'Kč' },
        { code: 'HUF', name: '匈牙利福林 Hungarian Forint', sym: 'Ft' },
        { code: 'RON', name: '罗马尼亚列伊 Romanian Leu', sym: 'lei' },
        { code: 'TRY', name: '土耳其里拉 Turkish Lira', sym: '₺' },
        { code: 'RUB', name: '俄罗斯卢布 Russian Ruble', sym: '₽' },
        { code: 'UAH', name: '乌克兰格里夫纳 Ukrainian Hryvnia', sym: '₴' },
        { code: 'ILS', name: '以色列新谢克尔 Israeli Shekel', sym: '₪' },
        { code: 'AED', name: '阿联酋迪拉姆 UAE Dirham', sym: 'د.إ' },
        { code: 'SAR', name: '沙特里亚尔 Saudi Riyal', sym: '﷼' },
        { code: 'INR', name: '印度卢比 Indian Rupee', sym: '₹' },
        { code: 'IDR', name: '印尼盾 Indonesian Rupiah', sym: 'Rp' },
        { code: 'MYR', name: '马来西亚林吉特 Malaysian Ringgit', sym: 'RM' },
        { code: 'THB', name: '泰铢 Thai Baht', sym: '฿' },
        { code: 'PHP', name: '菲律宾比索 Philippine Peso', sym: '₱' },
        { code: 'VND', name: '越南盾 Vietnamese Dong', sym: '₫' },
        { code: 'BRL', name: '巴西雷亚尔 Brazilian Real', sym: 'R$' },
        { code: 'MXN', name: '墨西哥比索 Mexican Peso', sym: '$' },
        { code: 'ARS', name: '阿根廷比索 Argentine Peso', sym: '$' },
        { code: 'CLP', name: '智利比索 Chilean Peso', sym: '$' },
        { code: 'COP', name: '哥伦比亚比索 Colombian Peso', sym: '$' },
        { code: 'ZAR', name: '南非兰特 South African Rand', sym: 'R' },
        { code: 'EGP', name: '埃及镑 Egyptian Pound', sym: 'E£' },
        { code: 'NGN', name: '尼日利亚奈拉 Nigerian Naira', sym: '₦' },
        { code: 'MAD', name: '摩洛哥迪拉姆 Moroccan Dirham', sym: 'د.م.' }
    ];

    function norm(s) {
        return (s || '').toLowerCase().replace(/\s+/g, '');
    }

    function mount(rootId) {
        var root = document.getElementById(rootId);
        if (!root) return;

        var inp = root.querySelector('.currency-combo-input');
        var list = root.querySelector('.currency-combo-list');
        var hidden = root.querySelector('input[type="hidden"]');
        if (!inp || !list) return;

        var startEmpty = root.getAttribute('data-start-empty') === '1';
        var selected = startEmpty ? null : (CURRENCIES.find(function (c) { return c.code === 'EUR'; }) || CURRENCIES[0]);

        function render(filter) {
            var f = norm(filter);
            list.innerHTML = '';
            var n = 0;
            CURRENCIES.forEach(function (c) {
                var hay = norm(c.code + c.name);
                if (!f || hay.indexOf(f) !== -1) {
                    var row = document.createElement('button');
                    row.type = 'button';
                    row.className = 'currency-combo-item';
                    row.innerHTML = '<span class="cc-code">' + c.code + '</span><span class="cc-name">' + c.name + '</span>';
                    row.addEventListener('click', function () {
                        selected = c;
                        inp.value = c.code + ' · ' + c.name.split(' ')[0];
                        if (hidden) hidden.value = c.code;
                        inp.classList.remove('is-placeholder');
                        list.classList.remove('open');
                        root.dispatchEvent(new CustomEvent('currencychange', { detail: c }));
                        var symId = root.getAttribute('data-sym-id') || 'fiatCurrencySymbol';
                        var unitId = root.getAttribute('data-unit-id') || 'fiatUnitLabel';
                        var symEl = document.getElementById(symId);
                        if (symEl) symEl.textContent = c.sym;
                        var unitEl = document.getElementById(unitId);
                        if (unitEl) unitEl.textContent = c.code;
                    });
                    list.appendChild(row);
                    n++;
                }
            });
            if (n === 0) {
                list.innerHTML = '<div class="currency-combo-empty">无匹配货币，请更换关键词</div>';
            }
        }

        inp.addEventListener('focus', function () {
            list.classList.add('open');
            render(inp.value);
        });

        inp.addEventListener('input', function () {
            list.classList.add('open');
            render(inp.value);
        });

        inp.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') list.classList.remove('open');
        });

        document.addEventListener('click', function (e) {
            if (!root.contains(e.target)) list.classList.remove('open');
        });

        if (startEmpty && !selected) {
            inp.value = '';
            if (hidden) hidden.value = '';
            inp.classList.add('is-placeholder');
            inp.setAttribute('placeholder', inp.getAttribute('placeholder') || '请选择到账货币，或输入代码搜索…');
            var symId0 = root.getAttribute('data-sym-id') || 'fiatCurrencySymbol';
            var unitId0 = root.getAttribute('data-unit-id') || 'fiatUnitLabel';
            var symEl0 = document.getElementById(symId0);
            if (symEl0) symEl0.textContent = '—';
            var unitEl0 = document.getElementById(unitId0);
            if (unitEl0) unitEl0.textContent = '—';
        } else if (selected) {
            inp.value = selected.code + ' · ' + selected.name.split(' ')[0];
            if (hidden) hidden.value = selected.code;
        }
    }

    function boot() {
        mount('fiatCurrencyCombo');
        mount('withdrawCurrencyCombo');
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
