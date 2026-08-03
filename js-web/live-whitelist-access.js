/**
 * 付费直播观看白名单 · 用户端解锁（原型）
 * URL 带 ?paidLive=1 时展示付费门控；白名单 UID 自动放行
 */
(function (global) {
  function isPaidLiveDemo() {
    try {
      var u = new URL(location.href);
      return u.searchParams.get('paidLive') === '1' || u.searchParams.get('paid') === '1';
    } catch (e) {
      return false;
    }
  }

  function toast(msg) {
    var el = document.getElementById('ldToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  function injectStyles() {
    if (document.getElementById('liveWlGateStyles')) return;
    var s = document.createElement('style');
    s.id = 'liveWlGateStyles';
    s.textContent =
      '#livePaidGate{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;' +
      'background:linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.82));backdrop-filter:blur(6px)}' +
      '#livePaidGate[hidden]{display:none!important}' +
      '.live-paid-gate-card{max-width:360px;margin:16px;padding:24px 22px;border-radius:16px;text-align:center;' +
      'background:rgba(15,23,42,.92);border:1px solid rgba(168,85,247,.35);color:#fff}' +
      '.live-paid-gate-card h3{margin:0 0 8px;font-size:18px}' +
      '.live-paid-gate-card p{margin:0 0 16px;font-size:13px;color:rgba(255,255,255,.72);line-height:1.55}' +
      '.live-paid-gate-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;' +
      'font-size:11px;font-weight:700;background:rgba(16,185,129,.2);color:#6EE7B7;margin-bottom:12px}';
    document.head.appendChild(s);
  }

  function ensureGate() {
    var player = document.getElementById('livePlayer');
    if (!player || document.getElementById('livePaidGate')) return document.getElementById('livePaidGate');
    injectStyles();
    var gate = document.createElement('div');
    gate.id = 'livePaidGate';
    gate.hidden = true;
    gate.setAttribute('aria-hidden', 'true');
    gate.innerHTML =
      '<div class="live-paid-gate-card">' +
      '<div class="live-paid-gate-badge" id="livePaidGateBadge" hidden><i class="fa-solid fa-unlock"></i> 白名单已解锁</div>' +
      '<h3><i class="fa-solid fa-ticket" style="color:#C084FC;margin-right:6px"></i>付费直播</h3>' +
      '<p id="livePaidGateDesc">本场直播需付费解锁观看。白名单用户登录后将自动放行。</p>' +
      '<button type="button" class="btn btn-primary" id="btnLivePaidUnlock"><i class="fa-solid fa-bolt"></i> 28 USDT 解锁观看</button>' +
      '</div>';
    player.appendChild(gate);
    gate.querySelector('#btnLivePaidUnlock').addEventListener('click', function () {
      toast('原型：非白名单用户需完成付费流程（MoonPay / 钱包扣款）');
    });
    return gate;
  }

  function syncGate() {
    if (!isPaidLiveDemo()) return;
    var gate = ensureGate();
    if (!gate) return;
    var wl = global.FLRiskWhitelistStore;
    var ok = wl && wl.isCurrentUserLiveWhitelisted && wl.isCurrentUserLiveWhitelisted();
    if (ok) {
      gate.hidden = true;
      gate.setAttribute('aria-hidden', 'true');
      toast('白名单用户 · 已直接解锁付费直播');
      try {
        global.dispatchEvent(new CustomEvent('fl-live-whitelist-unlocked', { detail: { room: 'live-detail' } }));
      } catch (e) { /* ignore */ }
      return;
    }
    gate.hidden = false;
    gate.setAttribute('aria-hidden', 'false');
  }

  function boot() {
    syncGate();
    global.addEventListener('fl-risk-whitelist-change', syncGate);
    global.addEventListener('goodfans-auth-change', syncGate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.FLLiveWhitelistAccess = { syncGate: syncGate, isPaidLiveDemo: isPaidLiveDemo };
})(typeof window !== 'undefined' ? window : this);
