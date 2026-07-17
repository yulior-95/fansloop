(function () {
    var COINS = [
        {
            id: 'usdt',
            sym: 'USDT',
            name: 'TetherUS',
            mark: '₮',
            bal: 5820.4,
            search: 'usdt tether 泰达'
        },
        {
            id: 'usdc',
            sym: 'USDC',
            name: 'USD Coin',
            mark: '₵',
            bal: 1280.5,
            search: 'usdc circle'
        }
    ];

    var NETS_BY_COIN = {
        usdt: [
            {
                id: 'trc20',
                label: 'TRON (TRC20)',
                sub: '低手续费 · 推荐',
                search: 'tron trc20 tron 波场',
                fee: 1.4,
                summaryNet: 'TRC20 (Tron)',
                addrTag: 'TRC20'
            },
            {
                id: 'erc20',
                label: 'ETH · Ethereum (ERC20)',
                sub: '合约 Gas 视拥堵而定',
                search: 'eth ethereum erc20 以太',
                fee: 2.5,
                summaryNet: 'ERC20 (Ethereum)',
                addrTag: 'ERC20'
            },
            {
                id: 'bep20',
                label: 'BSC (BEP20)',
                sub: '币安智能链',
                search: 'bsc bep20 binance 币安',
                fee: 0.9,
                summaryNet: 'BEP20 (BSC)',
                addrTag: 'BEP20'
            },
            {
                id: 'poly',
                label: 'Polygon',
                sub: 'Polygon PoS',
                search: 'polygon matic poly',
                fee: 0.35,
                summaryNet: 'Polygon',
                addrTag: 'Polygon'
            }
        ],
        usdc: [
            {
                id: 'erc20',
                label: 'ETH · Ethereum (ERC20)',
                sub: '主网 USDC',
                search: 'eth ethereum erc20',
                fee: 2.5,
                summaryNet: 'ERC20 (Ethereum)',
                addrTag: 'ERC20'
            },
            {
                id: 'poly',
                label: 'Polygon',
                sub: '低成本转账',
                search: 'polygon matic',
                fee: 0.35,
                summaryNet: 'Polygon',
                addrTag: 'Polygon'
            },
            {
                id: 'sol',
                label: 'Solana',
                sub: '高速确认',
                search: 'sol solana',
                fee: 0.2,
                summaryNet: 'Solana',
                addrTag: 'SOL'
            },
            {
                id: 'bep20',
                label: 'BSC (BEP20)',
                sub: '币安智能链',
                search: 'bsc bep20',
                fee: 0.9,
                summaryNet: 'BEP20 (BSC)',
                addrTag: 'BEP20'
            }
        ]
    };

    function fuzzyMatch(q, text) {
        if (!q || !q.trim()) return true;
        var needle = q.trim().toLowerCase();
        var hay = (text || '').toLowerCase();
        if (hay.indexOf(needle) !== -1) return true;
        var i = 0;
        for (var j = 0; j < hay.length && i < needle.length; j++) {
            if (hay[j] === needle[i]) i++;
        }
        return i === needle.length;
    }

    function parseCnyRate() {
        var hero = document.getElementById('balWithdrawHero');
        if (!hero) return 7.0991;
        var raw = hero.getAttribute('data-cny-rate');
        var n = parseFloat(String(raw || '').replace(/,/g, ''));
        return isNaN(n) ? 7.0991 : n;
    }

    function fmtAmt(n) {
        var x = Number(n);
        if (!isFinite(x)) x = 0;
        return x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function fmtCny(n) {
        var x = Number(n);
        if (!isFinite(x)) x = 0;
        return (
            '¥' +
            x.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        );
    }

    function shortenAddr(addr) {
        if (!addr || addr.length < 14) return addr || '—';
        return addr.slice(0, 4) + '…' + addr.slice(-6);
    }

    var state = {
        coin: COINS[0],
        network: NETS_BY_COIN.usdt[0]
    };

    var ddCoin = document.getElementById('wdDdCoin');
    var coinTrigger = document.getElementById('wdCoinTrigger');
    var coinListEl = document.getElementById('wdCoinDdList');
    var ddNet = document.getElementById('wdDdNet');
    var netTrigger = document.getElementById('wdNetTrigger');
    var netSearch = document.getElementById('wdNetSearchInput');
    var netSearchClear = document.getElementById('wdNetSearchClear');
    var netSearchWrap = document.querySelector('#wdNetPanel .fl-search-row');
    var netListEl = document.getElementById('wdNetDdList');
    var amtInput = document.getElementById('wdAmtInput');
    var fillMax = document.getElementById('wdFillMax');
    var unitEl = document.getElementById('wdAmtUnit');
    var equivEl = document.getElementById('wdEquivLine');
    var kvAmt = document.getElementById('kvWdAmt');
    var kvNet = document.getElementById('kvWdNet');
    var kvFee = document.getElementById('kvWdFee');
    var kvAddr = document.getElementById('kvWdAddr');
    var kvRecv = document.getElementById('kvWdRecv');
    var addrField = document.getElementById('wdAddrField');
    var addrNetShort = document.getElementById('wdAddrNetShort');
    var hero = document.getElementById('balWithdrawHero');
    var pageDesc = document.getElementById('wdPageDesc');

    function maxBal() {
        return state.coin ? state.coin.bal : 0;
    }

    function sym() {
        return state.coin ? state.coin.sym : 'USDT';
    }

    function closeAllDd() {
        if (ddCoin) ddCoin.classList.remove('open');
        if (ddNet) ddNet.classList.remove('open');
        syncDdAria();
    }

    function syncDdAria() {
        if (coinTrigger && ddCoin) {
            coinTrigger.setAttribute('aria-expanded', ddCoin.classList.contains('open') ? 'true' : 'false');
        }
        if (netTrigger && ddNet) {
            netTrigger.setAttribute('aria-expanded', ddNet.classList.contains('open') ? 'true' : 'false');
        }
    }

    function updateSearchClear() {
        if (!netSearch || !netSearchWrap) return;
        netSearchWrap.classList.toggle('has-val', !!netSearch.value.trim());
    }

    function syncCoinTrigger() {
        if (!coinTrigger || !state.coin) return;
        var ic = coinTrigger.querySelector('.coin-ic');
        var nEl = coinTrigger.querySelector('.mid .n');
        var dEl = coinTrigger.querySelector('.mid .d');
        var mid = coinTrigger.querySelector('.mid');
        var ph = coinTrigger.querySelector('.ph');
        if (ph) ph.style.display = 'none';
        if (mid) mid.style.display = 'flex';
        if (ic) {
            ic.className = 'coin-ic ' + state.coin.id;
            ic.textContent = state.coin.mark;
            ic.style.display = 'flex';
        }
        if (nEl) nEl.textContent = state.coin.sym;
        if (dEl) dEl.textContent = state.coin.name;
        coinTrigger.classList.remove('is-empty');
    }

    function syncNetTrigger() {
        if (!netTrigger) return;
        var mid = netTrigger.querySelector('.mid');
        var ph = netTrigger.querySelector('.ph');
        var dot = netTrigger.querySelector('.net-dot');
        var has = !!state.network;
        netTrigger.classList.toggle('is-empty', !has);
        if (!has) {
            if (mid) mid.style.display = 'none';
            if (ph) {
                ph.style.display = 'block';
                ph.textContent = '请选择网络';
            }
            if (dot) dot.style.display = 'none';
            return;
        }
        if (ph) ph.style.display = 'none';
        if (mid) mid.style.display = 'flex';
        if (dot) dot.style.display = 'block';
        var nEl = netTrigger.querySelector('.mid .n');
        var dEl = netTrigger.querySelector('.mid .d');
        if (nEl) nEl.textContent = state.network.label;
        if (dEl) dEl.textContent = state.network.sub;
    }

    function refreshCoinList() {
        if (!coinListEl) return;
        coinListEl.innerHTML = '';
        COINS.forEach(function (c) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'fl-dd-item' + (state.coin && state.coin.id === c.id ? ' selected' : '');
            btn.innerHTML =
                '<span class="coin-ic ' +
                c.id +
                '">' +
                c.mark +
                '</span><span class="mid"><span class="n">' +
                c.sym +
                '</span><span class="d">' +
                c.name +
                ' · 可用 ' +
                fmtAmt(c.bal) +
                '</span></span><i class="fa-solid fa-check tick"></i>';
            btn.addEventListener('click', function () {
                state.coin = c;
                var nets = NETS_BY_COIN[c.id] || [];
                state.network = nets[0] || null;
                closeAllDd();
                syncCoinTrigger();
                syncNetTrigger();
                refreshNetList();
                updateHero();
                updateSummary();
            });
            coinListEl.appendChild(btn);
        });
    }

    function refreshNetList() {
        if (!netListEl) return;
        var nets = state.coin ? NETS_BY_COIN[state.coin.id] || [] : [];
        var q = netSearch ? netSearch.value : '';
        netListEl.innerHTML = '';
        nets.forEach(function (n) {
            var blob = n.label + ' ' + n.sub + ' ' + n.search;
            if (!fuzzyMatch(q, blob)) return;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'fl-dd-item' + (state.network && state.network.id === n.id ? ' selected' : '');
            btn.innerHTML =
                '<span class="mid"><span class="n">' +
                n.label +
                '</span><span class="d">' +
                n.sub +
                '</span></span><i class="fa-solid fa-check tick"></i>';
            btn.addEventListener('click', function () {
                state.network = n;
                closeAllDd();
                syncNetTrigger();
                updateAddrHint();
                updateSummary();
            });
            netListEl.appendChild(btn);
        });
        if (!netListEl.children.length) {
            netListEl.innerHTML =
                '<div style="padding:16px;text-align:center;color:var(--t-tertiary);font-size:12px">无匹配网络</div>';
        }
    }

    function parseAmount() {
        if (!amtInput) return 0;
        var raw = String(amtInput.value || '').replace(/,/g, '').trim();
        var v = parseFloat(raw);
        return isNaN(v) ? 0 : v;
    }

    function updateHero() {
        if (!hero || !state.coin) return;
        hero.setAttribute('data-max-bal', String(state.coin.bal));
        var val = hero.querySelector('.bal-main .val');
        if (val) {
            val.innerHTML = fmtAmt(state.coin.bal) + '<span class="u">' + state.coin.sym + '</span>';
        }
        var cnyEl = hero.querySelector('.bal-sub .cny');
        if (cnyEl) cnyEl.textContent = fmtCny(state.coin.bal * parseCnyRate());
        if (pageDesc) {
            pageDesc.innerHTML =
                '支持 <b style="color:#fff">USDT / USDC</b> 提现至链上地址。<b style="color:#fff">参考实时汇率</b>展示法币估值；最终以提现成功时的实时汇率为准。';
        }
    }

    function updateEquiv() {
        if (!equivEl) return;
        var rate = parseCnyRate();
        var a = parseAmount();
        if (a > maxBal()) a = maxBal();
        equivEl.innerHTML =
            '≈ ' +
            fmtCny(a * rate) +
            ' · 参考实时汇率，<b style="color:var(--t-secondary)">最终以提现成功时的实时汇率为准</b>';
    }

    function updateAddrHint() {
        if (addrNetShort && state.network) {
            addrNetShort.textContent = state.network.addrTag;
        }
    }

    function updateSummary() {
        var max = maxBal();
        var a = parseAmount();
        if (a > max) a = max;
        var fee = state.network ? state.network.fee : 0;
        var recv = Math.max(0, a - fee);
        var addr = addrField ? addrField.textContent.trim() : '';
        var s = sym();

        if (unitEl) unitEl.textContent = s;
        if (fillMax) fillMax.textContent = '全部 ' + fmtAmt(max) + ' ' + s;
        if (kvAmt) kvAmt.textContent = fmtAmt(a) + ' ' + s;
        if (kvNet) kvNet.textContent = state.network ? state.network.summaryNet : '—';
        if (kvFee) kvFee.textContent = '− ' + fmtAmt(fee) + ' ' + s;
        if (kvAddr) kvAddr.textContent = shortenAddr(addr);
        if (kvRecv) kvRecv.textContent = fmtAmt(recv) + ' ' + s;

        updateEquiv();
    }

    function wireCoinDd() {
        if (!ddCoin || !coinTrigger) return;
        coinTrigger.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = ddCoin.classList.contains('open');
            closeAllDd();
            if (!open) {
                ddCoin.classList.add('open');
                syncDdAria();
                refreshCoinList();
            }
        });
    }

    function wireNetDd() {
        if (!ddNet || !netTrigger) return;
        netTrigger.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = ddNet.classList.contains('open');
            closeAllDd();
            if (!open) {
                ddNet.classList.add('open');
                syncDdAria();
                refreshNetList();
                if (netSearch) {
                    setTimeout(function () {
                        netSearch.focus();
                    }, 0);
                }
            }
        });
        if (netSearch) {
            netSearch.addEventListener('input', function () {
                updateSearchClear();
                refreshNetList();
            });
        }
        if (netSearchClear) {
            netSearchClear.addEventListener('click', function (e) {
                e.stopPropagation();
                if (netSearch) netSearch.value = '';
                updateSearchClear();
                refreshNetList();
                if (netSearch) netSearch.focus();
            });
        }
    }

    function wireAmount() {
        if (!amtInput) return;
        amtInput.addEventListener('input', function () {
            var max = maxBal();
            var v = parseAmount();
            if (v > max) amtInput.value = fmtAmt(max);
            updateSummary();
        });
        amtInput.addEventListener('blur', function () {
            var max = maxBal();
            var v = parseAmount();
            if (v > max) v = max;
            if (v < 0 || isNaN(v)) v = 0;
            amtInput.value = fmtAmt(v);
            updateSummary();
        });
        if (fillMax) {
            fillMax.addEventListener('click', function (e) {
                e.preventDefault();
                amtInput.value = fmtAmt(maxBal());
                updateSummary();
            });
        }
    }

    function wireRecentRows() {
        document.querySelectorAll('.recent-row').forEach(function (row) {
            row.addEventListener('click', function () {
                document.querySelectorAll('.recent-row').forEach(function (r) {
                    r.classList.remove('selected');
                    var ind = r.querySelector('.row-ind i');
                    if (ind) {
                        ind.className = 'fa-solid fa-chevron-right';
                        ind.style.color = 'var(--t-tertiary)';
                        ind.style.fontSize = '11px';
                    }
                });
                row.classList.add('selected');
                var ind = row.querySelector('.row-ind i');
                if (ind) {
                    ind.className = 'fa-solid fa-check';
                    ind.style.color = 'var(--brand-purple)';
                    ind.style.fontSize = '12px';
                }
                var addr = row.getAttribute('data-addr');
                if (addrField && addr) addrField.textContent = addr;
                updateSummary();
            });
        });
    }

    document.addEventListener('click', function (e) {
        if (ddCoin && ddCoin.contains(e.target)) return;
        if (ddNet && ddNet.contains(e.target)) return;
        closeAllDd();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeAllDd();
    });

    syncCoinTrigger();
    syncNetTrigger();
    refreshCoinList();
    refreshNetList();
    updateSearchClear();
    wireCoinDd();
    wireNetDd();
    wireAmount();
    wireRecentRows();
    updateHero();
    updateAddrHint();
    updateSummary();
})();
