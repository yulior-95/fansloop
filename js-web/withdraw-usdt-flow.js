(function () {
    /** USDT 提现网络（与充值页 USDT 列表一致心智；含摘要用费率） */
    var USDT_NETS = [
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
    ];

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

    function parseMaxBalance() {
        var hero = document.getElementById('balWithdrawHero');
        if (!hero) return 5820.4;
        var raw = hero.getAttribute('data-max-usdt');
        var n = parseFloat(String(raw || '').replace(/,/g, ''));
        return isNaN(n) ? 5820.4 : n;
    }

    function parseCnyRate() {
        var hero = document.getElementById('balWithdrawHero');
        if (!hero) return 7.0991;
        var raw = hero.getAttribute('data-cny-rate');
        var n = parseFloat(String(raw || '').replace(/,/g, ''));
        return isNaN(n) ? 7.0991 : n;
    }

    function fmtUsdt(n) {
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
        network: USDT_NETS[0]
    };

    var ddNet = document.getElementById('wdDdNet');
    var netTrigger = document.getElementById('wdNetTrigger');
    var netSearch = document.getElementById('wdNetSearchInput');
    var netSearchClear = document.getElementById('wdNetSearchClear');
    var netSearchWrap = document.querySelector('#wdNetPanel .fl-search-row');
    var netListEl = document.getElementById('wdNetDdList');
    var amtInput = document.getElementById('wdAmtInput');
    var fillMax = document.getElementById('wdFillMax');
    var equivEl = document.getElementById('wdEquivLine');
    var kvAmt = document.getElementById('kvWdAmt');
    var kvNet = document.getElementById('kvWdNet');
    var kvFee = document.getElementById('kvWdFee');
    var kvAddr = document.getElementById('kvWdAddr');
    var kvRecv = document.getElementById('kvWdRecv');
    var addrField = document.getElementById('wdAddrField');
    var addrNetShort = document.getElementById('wdAddrNetShort');

    function syncDdAria() {
        if (netTrigger && ddNet) {
            netTrigger.setAttribute('aria-expanded', ddNet.classList.contains('open') ? 'true' : 'false');
        }
    }

    function closeNetDd() {
        if (ddNet) ddNet.classList.remove('open');
        syncDdAria();
    }

    function updateSearchClear() {
        if (!netSearch || !netSearchWrap) return;
        netSearchWrap.classList.toggle('has-val', !!netSearch.value.trim());
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

    function refreshNetList() {
        if (!netListEl) return;
        var q = netSearch ? netSearch.value : '';
        netListEl.innerHTML = '';
        USDT_NETS.forEach(function (n) {
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
                closeNetDd();
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

    function clampAmountToMax() {
        if (!amtInput) return;
        var max = parseMaxBalance();
        var v = parseAmount();
        if (v > max) {
            amtInput.value = fmtUsdt(max);
        }
    }

    function normalizeAmountOnBlur() {
        if (!amtInput) return;
        var max = parseMaxBalance();
        var v = parseAmount();
        if (v > max) v = max;
        if (v < 0 || isNaN(v)) v = 0;
        amtInput.value = fmtUsdt(v);
    }

    function updateEquiv() {
        if (!equivEl) return;
        var rate = parseCnyRate();
        var a = parseAmount();
        if (a > parseMaxBalance()) a = parseMaxBalance();
        var cny = a * rate;
        equivEl.innerHTML =
            '≈ ' +
            fmtCny(cny) +
            ' · 参考实时汇率，<b style="color:var(--t-secondary)">最终以提现成功时的实时汇率为准</b>';
    }

    function updateAddrHint() {
        if (addrNetShort && state.network) {
            addrNetShort.textContent = state.network.addrTag;
        }
    }

    function updateSummary() {
        var max = parseMaxBalance();
        var a = parseAmount();
        if (a > max) a = max;
        var fee = state.network ? state.network.fee : 0;
        var recv = Math.max(0, a - fee);
        var addr = addrField ? addrField.textContent.trim() : '';

        if (fillMax) {
            fillMax.textContent = '全部 ' + fmtUsdt(max) + ' USDT';
        }
        if (kvAmt) kvAmt.textContent = fmtUsdt(a) + ' USDT';
        if (kvNet) kvNet.textContent = state.network ? state.network.summaryNet : '—';
        if (kvFee) kvFee.textContent = '− ' + fmtUsdt(fee) + ' USDT';
        if (kvAddr) kvAddr.textContent = shortenAddr(addr);
        if (kvRecv) kvRecv.textContent = fmtUsdt(recv) + ' USDT';

        updateEquiv();
    }

    function wireNetDd() {
        if (!ddNet || !netTrigger) return;
        netTrigger.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = ddNet.classList.toggle('open');
            if (open && netSearch) {
                setTimeout(function () {
                    netSearch.focus();
                }, 0);
            }
            syncDdAria();
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
        document.addEventListener('click', function (e) {
            if (!ddNet || !ddNet.contains(e.target)) closeNetDd();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeNetDd();
        });
    }

    function wireAmount() {
        if (!amtInput) return;
        amtInput.addEventListener('input', function () {
            var max = parseMaxBalance();
            var v = parseAmount();
            if (v > max) {
                amtInput.value = fmtUsdt(max);
            }
            updateSummary();
        });
        amtInput.addEventListener('blur', function () {
            normalizeAmountOnBlur();
            updateSummary();
        });
        if (fillMax) {
            fillMax.addEventListener('click', function (e) {
                e.preventDefault();
                var max = parseMaxBalance();
                amtInput.value = fmtUsdt(max);
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

    syncNetTrigger();
    refreshNetList();
    updateSearchClear();
    wireNetDd();
    wireAmount();
    wireRecentRows();
    updateAddrHint();
    clampAmountToMax();
    updateSummary();
})();
