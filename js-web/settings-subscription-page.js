/**
 * 会员订阅设置 · 周期定价与校验（月付 < 季付 < 年付）
 */
(function () {
    var TIER_META = {
        monthly: { label: '月付价格', unit: 'USDT / 月', suffix: 'USDT/月', badge: '当前主推', short: '月付' },
        quarterly: { label: '季付价格', unit: 'USDT / 季', suffix: 'USDT/季', badge: '当前主推', short: '季付' },
        annual: { label: '年付价格', unit: 'USDT / 年', suffix: 'USDT/年', badge: '当前主推', short: '年付' }
    };

    var grid = document.getElementById('tierGrid');
    var inp = document.getElementById('subPriceInput');
    var hint = document.getElementById('subPriceHint');
    var priceLabel = document.getElementById('subPriceLabel');
    var priceUnit = document.getElementById('subPriceUnit');
    if (!grid || !inp) return;

    var activeTier = 'monthly';

    function getPrices() {
        var out = {};
        grid.querySelectorAll('.tier-card').forEach(function (card) {
            var key = card.getAttribute('data-tier');
            var val = parseFloat(card.getAttribute('data-price'));
            out[key] = isNaN(val) ? 0 : val;
        });
        return out;
    }

    function setTierPrice(tier, value) {
        var card = grid.querySelector('.tier-card[data-tier="' + tier + '"]');
        if (!card) return;
        card.setAttribute('data-price', String(value));
        var priceEl = card.querySelector('[data-tier-price]');
        if (priceEl) {
            priceEl.innerHTML = value + ' <small>' + (TIER_META[tier] ? TIER_META[tier].suffix : '') + '</small>';
        }
    }

    function getDisplayError(prices) {
        var raw = inp.value.trim();
        var val = parseFloat(raw);
        var meta = TIER_META[activeTier];
        var monthly = prices.monthly;
        var quarterly = prices.quarterly;
        var annual = prices.annual;

        if (raw === '' || isNaN(val)) {
            return '请输入有效的价格数字';
        }
        if (val < 5) {
            return (meta ? meta.short : '该周期') + '价格不能低于 5 USDT';
        }

        if (activeTier === 'monthly') {
            if (quarterly > 0 && !(val < quarterly)) {
                return '月付须低于季付（当前季付 ' + quarterly + ' USDT）';
            }
            if (annual > 0 && !(val < annual)) {
                return '月付须低于年付（当前年付 ' + annual + ' USDT）';
            }
        }
        if (activeTier === 'quarterly') {
            if (monthly > 0 && !(monthly < val)) {
                return '季付须高于月付（当前月付 ' + monthly + ' USDT）';
            }
            if (annual > 0 && !(val < annual)) {
                return '季付须低于年付（当前年付 ' + annual + ' USDT）';
            }
        }
        if (activeTier === 'annual') {
            if (quarterly > 0 && !(quarterly < val)) {
                return '年付须高于季付（当前季付 ' + quarterly + ' USDT）';
            }
            if (monthly > 0 && !(monthly < val)) {
                return '年付须高于月付（当前月付 ' + monthly + ' USDT）';
            }
        }

        if (monthly > 0 && quarterly > 0 && !(monthly < quarterly)) {
            return '请调整价格，使月付（' + monthly + '）< 季付（' + quarterly + '）';
        }
        if (quarterly > 0 && annual > 0 && !(quarterly < annual)) {
            return '请调整价格，使季付（' + quarterly + '）< 年付（' + annual + '）';
        }
        if (monthly > 0 && annual > 0 && !(monthly < annual)) {
            return '请调整价格，使月付（' + monthly + '）< 年付（' + annual + '）';
        }

        return '';
    }

    function applyValidation() {
        var prices = getPrices();
        var err = getDisplayError(prices);

        if (err) {
            inp.setAttribute('aria-invalid', 'true');
            if (hint) {
                hint.textContent = err;
                hint.hidden = false;
            }
        } else {
            inp.removeAttribute('aria-invalid');
            if (hint) {
                hint.textContent = '';
                hint.hidden = true;
            }
        }
    }

    function selectTier(tier) {
        activeTier = tier;
        var meta = TIER_META[tier];
        var card = grid.querySelector('.tier-card[data-tier="' + tier + '"]');
        if (!card || !meta) return;

        grid.querySelectorAll('.tier-card').forEach(function (c) {
            c.classList.remove('active');
            var b = c.querySelector('.tier-badge');
            if (b) b.remove();
        });
        card.classList.add('active');
        if (!card.querySelector('.tier-badge')) {
            var badge = document.createElement('span');
            badge.className = 'tier-badge';
            badge.textContent = meta.badge;
            card.appendChild(badge);
        }

        inp.value = card.getAttribute('data-price') || '';
        if (priceLabel) priceLabel.textContent = meta.label;
        if (priceUnit) priceUnit.textContent = meta.unit;
        applyValidation();
    }

    function commitInputValue() {
        var raw = inp.value.trim();
        if (raw === '') {
            applyValidation();
            return;
        }
        var val = parseFloat(raw);
        if (isNaN(val)) {
            applyValidation();
            return;
        }
        setTierPrice(activeTier, val);
        applyValidation();
    }

    grid.querySelectorAll('.tier-card').forEach(function (card) {
        card.addEventListener('click', function () {
            selectTier(card.getAttribute('data-tier'));
        });
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectTier(card.getAttribute('data-tier'));
            }
        });
    });

    inp.addEventListener('input', commitInputValue);
    inp.addEventListener('change', commitInputValue);

    document.querySelectorAll('.switch').forEach(function (sw) {
        sw.addEventListener('click', function () { sw.classList.toggle('on'); });
    });

    selectTier('monthly');
})();
