(function () {
    /** 充值仅开放 USDT / USDC */
    var COINS = [
        { id: 'usdt', sym: 'USDT', name: 'TetherUS', mark: '₮', search: 'usdt tether 泰达 稳定币' },
        { id: 'usdc', sym: 'USDC', name: 'USD Coin', mark: '₵', search: 'usdc circle 稳定币' }
    ];

    var NETS_BY_COIN = {
        usdt: [
            { id: 'trc20', label: 'TRON (TRC20)', sub: '低手续费 · 推荐', hintEnd: 'a3X2', search: 'tron trc20 tron' },
            { id: 'erc20', label: 'ETH · Ethereum (ERC20)', sub: '合约 Gas 视拥堵而定', hintEnd: '31ec7', search: 'eth ethereum erc20 以太' },
            { id: 'bep20', label: 'BSC (BEP20)', sub: '币安智能链', hintEnd: '8f2b1', search: 'bsc bep20 binance 币安' },
            { id: 'poly', label: 'Polygon', sub: 'Polygon PoS', hintEnd: '9c4de', search: 'polygon matic poly' }
        ],
        usdc: [
            { id: 'erc20', label: 'ETH · Ethereum (ERC20)', sub: '主网 USDC', hintEnd: '0a5b3', search: 'eth erc20' },
            { id: 'poly', label: 'Polygon', sub: '低成本转账', hintEnd: '7e2aa', search: 'polygon' },
            { id: 'sol', label: 'Solana', sub: '高速确认', hintEnd: '4d91c', search: 'sol solana' },
            { id: 'bep20', label: 'BSC (BEP20)', sub: '币安智能链', hintEnd: 'c1e90', search: 'bsc bep20' }
        ]
    };

    function coinMark(c) {
        return (c && c.mark) || (c && c.sym ? c.sym.charAt(0) : '?');
    }

    /** 模糊：含连续子串匹配 + 子序列匹配（拼音/缩写容错） */
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

    function addrFor(coinId, netId) {
        if (netId === 'trc20') return 'TLa2f6WVqHrKZ5X6c9Y8a8X7a7X6a5X4a3X2';
        if (netId === 'sol') return '7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK';
        return '0xb2132bae7ddd15459dcfaebbef5266d51eaeb74a';
    }

    var state = {
        coin: COINS[0],
        network: null
    };

    var ddCoin = document.getElementById('ddCoin');
    var ddNet = document.getElementById('ddNet');
    var coinTrigger = document.getElementById('coinDdTrigger');
    var netTrigger = document.getElementById('netDdTrigger');
    var coinSearch = document.getElementById('coinSearchInput');
    var netSearch = document.getElementById('netSearchInput');
    var coinListEl = document.getElementById('coinDdList');
    var netListEl = document.getElementById('netDdList');
    var depositCard = document.getElementById('depositAddrCard');
    var addrText = document.getElementById('depositAddrText');
    var qrImg = document.getElementById('depositQrImg');
    var netFoot = document.getElementById('netContractFoot');
    var toastEl = document.getElementById('rechargeToast');
    var kvNetworkFee = document.getElementById('kvNetworkFee');

    function showToast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        setTimeout(function () {
            toastEl.classList.remove('show');
        }, 2000);
    }

    function syncDdAria() {
        if (coinTrigger && ddCoin) {
            coinTrigger.setAttribute('aria-expanded', ddCoin.classList.contains('open') ? 'true' : 'false');
        }
        if (netTrigger && ddNet) {
            netTrigger.setAttribute('aria-expanded', ddNet.classList.contains('open') ? 'true' : 'false');
        }
    }

    function closeAllDd() {
        if (ddCoin) ddCoin.classList.remove('open');
        if (ddNet) ddNet.classList.remove('open');
        syncDdAria();
    }

    function updateSearchClear(input, wrap) {
        if (!input || !wrap) return;
        wrap.classList.toggle('has-val', !!input.value.trim());
    }

    function renderCoinList() {
        if (!coinListEl) return;
        var q = coinSearch ? coinSearch.value : '';
        coinListEl.innerHTML = '';
        COINS.forEach(function (c) {
            var blob = c.sym + ' ' + c.name + ' ' + c.search;
            if (!fuzzyMatch(q, blob)) return;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'fl-dd-item' + (state.coin && state.coin.id === c.id ? ' selected' : '');
            btn.innerHTML =
                '<span class="coin-ic ' +
                c.id +
                '">' +
                coinMark(c) +
                '</span><span class="mid"><span class="n">' +
                c.sym +
                '</span><span class="d">' +
                c.name +
                '</span></span><i class="fa-solid fa-check tick"></i>';
            btn.addEventListener('click', function () {
                state.coin = c;
                state.network = null;
                closeAllDd();
                syncCoinTrigger();
                syncNetTrigger();
                refreshNetList();
                updateNetDdDisabled();
                updateAll();
            });
            coinListEl.appendChild(btn);
        });
        if (!coinListEl.children.length) {
            coinListEl.innerHTML =
                '<div style="padding:16px;text-align:center;color:var(--t-tertiary);font-size:12px">无匹配币种</div>';
        }
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
                updateAll();
            });
            netListEl.appendChild(btn);
        });
        if (!netListEl.children.length && nets.length) {
            netListEl.innerHTML =
                '<div style="padding:16px;text-align:center;color:var(--t-tertiary);font-size:12px">无匹配网络</div>';
        }
        if (!nets.length) {
            netListEl.innerHTML =
                '<div style="padding:16px;text-align:center;color:var(--t-tertiary);font-size:12px">请先选择币种</div>';
        }
    }

    function syncCoinTrigger() {
        if (!coinTrigger) return;
        var mid = coinTrigger.querySelector('.mid');
        var ph = coinTrigger.querySelector('.ph');
        var ic = coinTrigger.querySelector('.coin-ic');
        coinTrigger.classList.toggle('is-empty', !state.coin);
        if (!state.coin) {
            if (mid) mid.style.display = 'none';
            if (ph) {
                ph.style.display = 'block';
                ph.textContent = '请选择币种';
            }
            if (ic) ic.style.display = 'none';
            return;
        }
        if (ph) ph.style.display = 'none';
        if (ic) {
            ic.style.display = 'flex';
            ic.className = 'coin-ic ' + state.coin.id;
            ic.textContent = coinMark(state.coin);
        }
        var nEl = coinTrigger.querySelector('.mid .n');
        var dEl = coinTrigger.querySelector('.mid .d');
        if (nEl) nEl.textContent = state.coin.sym;
        if (dEl) dEl.textContent = state.coin.name;
        if (mid) mid.style.display = 'flex';
    }

    function syncNetTrigger() {
        if (!netTrigger) return;
        var mid = netTrigger.querySelector('.mid');
        var ph = netTrigger.querySelector('.ph');
        var ic = netTrigger.querySelector('.net-dot');
        netTrigger.classList.toggle('is-empty', !state.network);
        if (!state.network) {
            if (mid) mid.style.display = 'none';
            if (ph) {
                ph.style.display = 'block';
                ph.textContent = '请选择网络';
            }
            if (ic) ic.style.display = 'none';
            return;
        }
        if (ph) ph.style.display = 'none';
        if (mid) mid.style.display = 'flex';
        if (ic) ic.style.display = 'block';
        var nEl = netTrigger.querySelector('.mid .n');
        var dEl = netTrigger.querySelector('.mid .d');
        if (nEl) nEl.textContent = state.network.label;
        if (dEl) dEl.textContent = state.network.sub;
    }

    function updateNetDdDisabled() {
        if (!ddNet) return;
        if (!state.coin) ddNet.classList.add('disabled');
        else ddNet.classList.remove('disabled');
        if (netTrigger) {
            netTrigger.setAttribute('aria-disabled', state.coin ? 'false' : 'true');
        }
    }

    function updateRail() {
        var nums = document.querySelectorAll('#rechargeRail .rail-num');
        if (!nums.length || nums.length < 3) return;
        var doneCoin = !!state.coin;
        var doneNet = !!state.network;
        var doneAddr = !!(state.coin && state.network);
        var st = [doneCoin, doneNet, doneAddr];
        nums.forEach(function (el, idx) {
            el.classList.remove('active', 'done');
            if (st[idx]) el.classList.add('done');
        });
        var activeIdx = 0;
        if (!state.coin) activeIdx = 0;
        else if (!state.network) activeIdx = 1;
        else activeIdx = 2;
        if (nums[activeIdx]) nums[activeIdx].classList.add('active');
    }

    function updateDeposit() {
        var show = !!(state.coin && state.network);
        if (depositCard) depositCard.classList.toggle('show', show);
        if (netFoot) {
            netFoot.classList.toggle('show', show);
            if (state.network && netFoot.querySelector('.contract-end')) {
                netFoot.querySelector('.contract-end').textContent = state.network.hintEnd || '—';
            }
        }
        if (show && addrText && qrImg && state.coin && state.network) {
            var addr = addrFor(state.coin.id, state.network.id);
            addrText.textContent = addr;
            var enc = encodeURIComponent('fansloop:' + state.coin.sym + ':' + state.network.id + ':' + addr);
            qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=148x148&data=' + enc;
            qrImg.alt = '充值二维码';
        }
    }

    function updateSummary() {
        var sym = state.coin ? state.coin.sym : 'USDT';
        if (kvNetworkFee) kvNetworkFee.textContent = '0.35 ' + sym;
    }

    function updateAll() {
        updateRail();
        updateDeposit();
        updateSummary();
    }

    function copyAddr() {
        var t = addrText ? addrText.textContent : '';
        if (!t || t === '—') return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(t).then(
                function () {
                    showToast('地址已复制');
                },
                function () {
                    showToast('复制失败，请手动选择复制');
                }
            );
        } else {
            showToast('请手动复制地址');
        }
    }

    document.getElementById('btnCopyAddr') &&
        document.getElementById('btnCopyAddr').addEventListener('click', copyAddr);

    function setupDd(wrap, trigger, onOpen) {
        if (!wrap || !trigger) return;
        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = wrap.classList.contains('open');
            closeAllDd();
            if (!open) {
                wrap.classList.add('open');
                syncDdAria();
                if (typeof onOpen === 'function') onOpen();
            }
        });
    }

    if (coinTrigger && ddCoin) {
        coinTrigger.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = ddCoin.classList.contains('open');
            closeAllDd();
            if (!open) {
                ddCoin.classList.add('open');
                syncDdAria();
                renderCoinList();
                if (coinSearch) {
                    coinSearch.value = '';
                    updateSearchClear(coinSearch, coinSearch.closest('.fl-search-row'));
                    setTimeout(function () {
                        coinSearch.focus();
                    }, 50);
                }
            }
        });
    }

    if (netTrigger && ddNet) {
        netTrigger.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!state.coin) {
                showToast('请先选择币种');
                return;
            }
            var open = ddNet.classList.contains('open');
            closeAllDd();
            if (!open) {
                ddNet.classList.add('open');
                syncDdAria();
                refreshNetList();
                if (netSearch) {
                    netSearch.value = '';
                    updateSearchClear(netSearch, netSearch.closest('.fl-search-row'));
                    setTimeout(function () {
                        netSearch.focus();
                    }, 50);
                }
            }
        });
    }

    /** 仅点击下拉区域外时收起，避免与 document 上其它 click 监听（如语言切换）同帧抢闭 */
    document.addEventListener('click', function (e) {
        var t = e.target;
        if (ddCoin && ddCoin.contains(t)) return;
        if (ddNet && ddNet.contains(t)) return;
        closeAllDd();
    });

    if (coinSearch) {
        coinSearch.addEventListener('input', function () {
            updateSearchClear(coinSearch, coinSearch.closest('.fl-search-row'));
            renderCoinList();
        });
        coinSearch.addEventListener('keyup', function () {
            updateSearchClear(coinSearch, coinSearch.closest('.fl-search-row'));
        });
    }
    var coinClr = document.getElementById('coinSearchClear');
    if (coinClr && coinSearch) {
        coinClr.addEventListener('click', function (e) {
            e.stopPropagation();
            coinSearch.value = '';
            updateSearchClear(coinSearch, coinSearch.closest('.fl-search-row'));
            renderCoinList();
            coinSearch.focus();
        });
    }

    if (netSearch) {
        netSearch.addEventListener('input', function () {
            updateSearchClear(netSearch, netSearch.closest('.fl-search-row'));
            refreshNetList();
        });
        netSearch.addEventListener('keyup', function () {
            updateSearchClear(netSearch, netSearch.closest('.fl-search-row'));
        });
    }
    var netClr = document.getElementById('netSearchClear');
    if (netClr && netSearch) {
        netClr.addEventListener('click', function (e) {
            e.stopPropagation();
            netSearch.value = '';
            updateSearchClear(netSearch, netSearch.closest('.fl-search-row'));
            refreshNetList();
            netSearch.focus();
        });
    }

    syncCoinTrigger();
    syncNetTrigger();
    updateNetDdDisabled();
    renderCoinList();
    refreshNetList();
    updateAll();
    syncDdAria();
})();
