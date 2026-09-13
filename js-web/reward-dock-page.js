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
    link.href = '../css-web/reward-dock.css';
    document.head.appendChild(link);

    var dock = document.createElement('div');
    dock.className = 'reward-dock reward-dock--page';
    dock.id = 'rewardDock';
    dock.setAttribute('role', 'button');
    dock.setAttribute('tabindex', '0');
    dock.setAttribute('aria-expanded', 'true');
    var pointsReward = '积分奖励';
    var pointsHint = '避开创作按钮 · 可收起侧边';
    var pointsFold = '收起到侧边';
    if (window.FLI18n && window.FLI18n.t) {
        var code = window.FLI18n.getLangCode ? window.FLI18n.getLangCode() : 'zh-CN';
        pointsReward = window.FLI18n.t(code, 'home_points_reward') || pointsReward;
        pointsHint = window.FLI18n.t(code, 'home_points_hint') || pointsHint;
        pointsFold = window.FLI18n.t(code, 'home_points_fold') || pointsFold;
    }
    dock.title = pointsFold;
    dock.innerHTML =
        '<div class="rd-ring" id="rewardRing" style="--rd-progress:100"><i class="fa-solid fa-coins"></i></div>' +
        '<div class="rd-txt">' +
        '<div class="lb"><i class="fa-solid fa-gift" style="margin-right:4px;color:#FBBF24"></i>' + pointsReward + '</div>' +
        '<div class="tm" id="rewardTime">00:45</div>' +
        '<div class="rd-hint" id="rewardHint">' + pointsHint + '</div>' +
        '</div>' +
        '<button type="button" class="rd-fold" title="' + pointsFold + '" aria-label="' + pointsFold + '"><i class="fa-solid fa-chevron-right"></i></button>';

    var layer = document.createElement('div');
    layer.id = 'rewardFloatLayer';
    layer.className = 'reward-float-layer--page';
    layer.setAttribute('aria-live', 'polite');

    document.body.appendChild(dock);
    document.body.appendChild(layer);

    var TOTAL = 45;
    var left = TOTAL;
    var timer = null;
    var ring = document.getElementById('rewardRing');
    var timeEl = document.getElementById('rewardTime');

    function fmt(sec) {
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
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
            if (timeEl) timeEl.textContent = '00:00';
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
