/**
 * Web 业务页 · 积分悬浮气泡（倒计时 + 拖拽/侧边收起，避开创作 FAB）
 */
(function () {
    try {
        if (window.self !== window.top && window.parent.document.getElementById('rewardDock')) {
            return; // 演示壳已有全局气泡，避免 iframe 内重贴
        }
    } catch (e) {}
    if (document.getElementById('rewardDock')) return;

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../css-web/reward-dock.css?v=20261125h5ball2';
    document.head.appendChild(link);

    var dock = document.createElement('div');
    dock.className = 'reward-dock reward-dock--page';
    dock.id = 'rewardDock';
    dock.setAttribute('role', 'button');
    dock.setAttribute('tabindex', '0');
    dock.setAttribute('aria-expanded', 'true');
    dock.setAttribute('aria-label', '积分商城');
    dock.title = '拖拽移动 · 悬停收起 · 点击进积分商城';
    dock.innerHTML =
        '<div class="rd-ring" id="rewardRing" style="--rd-progress:100" aria-hidden="true"></div>' +
        '<div class="rd-core">' +
        '<i class="fa-solid fa-coins coin-icon" aria-hidden="true"></i>' +
        '<span class="rd-countdown" id="rewardTime">45s</span>' +
        '</div>' +
        '<button type="button" class="rd-fold" title="收起到侧边" aria-label="收起到侧边"><i class="fa-solid fa-chevron-right"></i></button>';

    var layer = document.createElement('div');
    layer.id = 'rewardFloatLayer';
    layer.className = 'reward-float-layer--page';
    layer.setAttribute('aria-live', 'polite');

    document.body.appendChild(dock);
    document.body.appendChild(layer);

    if (window.RewardDockInteract && typeof window.RewardDockInteract.ensureRingIcon === 'function') {
        window.RewardDockInteract.ensureRingIcon(dock);
    }

    var TOTAL = 45;
    var left = TOTAL;
    var timer = null;
    var ring = document.getElementById('rewardRing');
    var timeEl = document.getElementById('rewardTime');

    function fmt(sec) {
        return Math.max(0, sec) + 's';
    }
    function syncRing() {
        var p = Math.max(0, Math.min(100, (left / TOTAL) * 100));
        if (ring) ring.style.setProperty('--rd-progress', String(Math.round(p)));
    }
    function tick() {
        left -= 1;
        if (left <= 0) {
            clearInterval(timer);
            timer = null;
            left = 0;
            if (timeEl) timeEl.textContent = '0s';
            syncRing();
            var burst = document.createElement('div');
            burst.className = 'reward-float-burst';
            burst.innerHTML = '<i class="fa-solid fa-coins"></i><span>+128 积分</span>';
            layer.appendChild(burst);
            dock.classList.add('just-paid');
            setTimeout(function () {
                dock.classList.remove('just-paid');
                if (burst.parentNode) burst.parentNode.removeChild(burst);
            }, 2000);
            setTimeout(start, 1400);
            return;
        }
        if (timeEl) timeEl.textContent = fmt(left);
        syncRing();
    }
    function start() {
        if (timer) clearInterval(timer);
        left = TOTAL;
        if (timeEl) timeEl.textContent = fmt(left);
        syncRing();
        timer = setInterval(tick, 1000);
    }

    function goMall() {
        location.href = 'points-mall.html';
    }

    function bootInteract() {
        if (!window.RewardDockInteract) return;
        RewardDockInteract.bind(dock, {
            floatLayer: layer,
            defaultRight: true,
            onActivate: goMall
        });
    }

    if (window.RewardDockInteract) bootInteract();
    else {
        var s = document.createElement('script');
        s.src = '../js-web/reward-dock-interact.js';
        s.onload = bootInteract;
        document.body.appendChild(s);
    }

    dock.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goMall();
        }
    });

    start();
})();
