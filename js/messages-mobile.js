/**
 * 移动端消息：收件箱跳转 + 单聊页
 */
(function () {
    var PEERS = {
        Luna: {
            av: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80',
            messages: [
                { from: 'them', text: '已向你发送新的订阅专属视频 🎬', time: '刚刚' },
                { from: 'me', text: '收到，马上看！', time: '刚刚' }
            ]
        },
        Mila: {
            av: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80',
            messages: [
                { from: 'them', text: '谢谢你的打赏！已收到 10 USDT 💜', time: '14:32' }
            ]
        },
        Ryo: {
            av: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
            messages: [
                { from: 'them', text: '下周会去京都拍新的 vlog，敬请期待～', time: '昨天' }
            ]
        },
        Nova: {
            av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80',
            messages: [
                { from: 'them', text: '新作品～', time: '昨天', image: true }
            ]
        }
    };

    function initInbox() {
        document.querySelectorAll('.chat-item[data-peer]').forEach(function (item) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', function () {
                location.href = 'messages-chat.html?peer=' + encodeURIComponent(item.getAttribute('data-peer'));
            });
        });
        document.querySelectorAll('.quick-grid .q[data-href]').forEach(function (q) {
            q.style.cursor = 'pointer';
            q.addEventListener('click', function () {
                location.href = q.getAttribute('data-href');
            });
        });
        var composeBtn = document.querySelector('.nav-right .nav-btn');
        if (composeBtn) {
            composeBtn.addEventListener('click', function () {
                location.href = 'messages-chat.html?peer=' + encodeURIComponent('Luna');
            });
        }
        document.querySelectorAll('.top-filters .chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                document.querySelectorAll('.top-filters .chip').forEach(function (c) { c.classList.remove('active'); });
                chip.classList.add('active');
            });
        });
    }

    function initChat() {
        var m = /[?&]peer=([^&]+)/.exec(location.search);
        var name = m ? decodeURIComponent(m[1]) : 'Luna';
        var data = PEERS[name] || { av: '', messages: [{ from: 'them', text: '开始新对话', time: '刚刚' }] };

        var title = document.getElementById('chatTitle');
        if (title) title.textContent = name;

        var list = document.getElementById('mobMsgList');
        if (!list) return;

        list.innerHTML = data.messages.map(function (msg) {
            var cls = 'mob-bub' + (msg.from === 'me' ? ' me' : '');
            if (msg.image) return '<div class="' + cls + '"><img src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400" style="max-width:200px;border-radius:12px;display:block"><div style="font-size:11px;margin-top:4px;opacity:0.7">' + msg.time + '</div></div>';
            return '<div class="' + cls + '">' + msg.text + '<div style="font-size:11px;margin-top:4px;opacity:0.7">' + msg.time + '</div></div>';
        }).join('');

        var input = document.getElementById('mobChatInput');
        var send = document.getElementById('mobChatSend');
        function sendMsg() {
            var t = (input && input.value || '').trim();
            if (!t) return;
            var bub = document.createElement('div');
            bub.className = 'mob-bub me';
            bub.innerHTML = t + '<div style="font-size:11px;margin-top:4px;opacity:0.7">刚刚</div>';
            list.appendChild(bub);
            input.value = '';
            list.scrollTop = list.scrollHeight;
            setTimeout(function () {
                var r = document.createElement('div');
                r.className = 'mob-bub';
                r.innerHTML = '收到啦～<div style="font-size:11px;margin-top:4px;opacity:0.7">刚刚</div>';
                list.appendChild(r);
                list.scrollTop = list.scrollHeight;
            }, 1500);
        }
        if (send) send.addEventListener('click', sendMsg);
        if (input) input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
        });

        document.getElementById('mobBtnGift')?.addEventListener('click', function () {
            alert('打开送礼（移动端演示）');
        });
        document.getElementById('mobBtnShare')?.addEventListener('click', function () {
            var card = document.createElement('div');
            card.className = 'mob-bub me';
            card.innerHTML = '<div style="background:var(--bg-card);border-radius:12px;overflow:hidden;max-width:220px"><img src="https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=300" style="width:100%;height:100px;object-fit:cover"><div style="padding:8px;font-size:12px">分享作品 · 晨雾富士</div></div>';
            list.appendChild(card);
            list.scrollTop = list.scrollHeight;
        });
    }

    if (document.body.getAttribute('data-page') === 'messages-inbox') initInbox();
    if (document.body.getAttribute('data-page') === 'messages-chat') initChat();
})();
