(function () {
    var params = new URLSearchParams(location.search);
    var host = params.get('host') || 'luna';
    var creator = params.get('creator') ? decodeURIComponent(params.get('creator')) : 'Luna 🌙';
    var nav = params.get('nav') || 'home';

    var PRESETS = {
        luna: {
            name: 'Luna 🌙',
            title: '爵士夜即兴 · 手机开播',
            av: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160',
            bg: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&q=80'
        },
        yeyu: {
            name: '夜雨听弦',
            title: '深夜电台 · 即兴钢琴',
            av: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160',
            bg: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80'
        },
        coffee: {
            name: '咖啡店主',
            title: '早晨手冲直播',
            av: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160',
            bg: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80'
        }
    };

    var cfg = PRESETS[host] || PRESETS.luna;
    if (creator && creator !== cfg.name) cfg = Object.assign({}, cfg, { name: creator });

    function toast(msg) {
        if (window.DigitalH5Nav && window.DigitalH5Nav.toast) window.DigitalH5Nav.toast(msg);
    }

    var video = document.getElementById('lvVideo');
    if (video) video.style.backgroundImage = "url('" + cfg.bg + "')";

    var nameEl = document.getElementById('lvHostName');
    var titleEl = document.getElementById('lvLiveTitle');
    var avEl = document.getElementById('lvHostAv');
    if (nameEl) nameEl.textContent = cfg.name;
    if (titleEl) titleEl.textContent = cfg.title;
    if (avEl) avEl.style.backgroundImage = "url('" + cfg.av + "')";

    var back = document.getElementById('lvBack');
    if (back) {
        back.addEventListener('click', function () {
            if (nav === 'home') location.href = 'home.html';
            else if (nav === 'subs') location.href = 'subscriptions.html';
            else location.href = 'home.html';
        });
    }

    var chat = document.getElementById('lvChat');
    var seeds = [
        { sys: true, text: '欢迎进入直播间，请文明发言' },
        { user: cfg.name.split(' ')[0], text: '今晚即兴爵士～感谢来到直播间' },
        { user: 'Fan_01', text: '来了来了！' },
        { user: 'Mila', text: '声音好治愈 🎹' }
    ];
    function pushLine(item) {
        if (!chat) return;
        var div = document.createElement('div');
        div.className = 'line' + (item.sys ? ' sys' : '');
        div.innerHTML = item.sys ? item.text : '<b>' + item.user + '</b> ' + item.text;
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
    }
    seeds.forEach(pushLine);

    setInterval(function () {
        var samples = ['666', '主播加油', '已打赏 5 USDT', '这段太好听了', '求 Encore'];
        pushLine({ user: '观众' + Math.floor(Math.random() * 900 + 100), text: samples[Math.floor(Math.random() * samples.length)] });
    }, 9000);

    var input = document.getElementById('lvChatInput');
    function sendChat() {
        var t = (input && input.value || '').trim();
        if (!t) return;
        pushLine({ user: '我', text: t });
        if (input) input.value = '';
    }
    if (input) {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); sendChat(); }
        });
    }

    document.getElementById('lvBtnMicApply')?.addEventListener('click', function () {
        toast('已提交上麦申请，等待主播同意（演示）');
    });
    document.getElementById('lvBtnGift')?.addEventListener('click', function () {
        toast('打开礼物面板 · USDT 打赏（演示）');
    });
    document.getElementById('lvBtnShare')?.addEventListener('click', function () {
        toast('直播链接已复制（演示）');
    });

    var follow = document.getElementById('lvBtnFollow');
    if (follow) {
        follow.addEventListener('click', function () {
            var on = follow.classList.toggle('on');
            follow.textContent = on ? '已关注' : '关注';
            toast(on ? '已关注 ' + cfg.name : '已取消关注');
        });
    }
})();
