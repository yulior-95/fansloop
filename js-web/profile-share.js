/**
 * 个人主页 · 分享海报 / 邀请码 / 复制链接 / 保存海报
 */
(function () {
    var INVITE_CODE = 'LUNA-8K3F';
    var PROFILE_URL = 'https://fansloop.io/@luna';
    var SHARE_URL = PROFILE_URL + '?ref=' + encodeURIComponent(INVITE_CODE);
    var COVER_IMG = 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=900&q=80';
    var AVATAR_IMG = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80';

    var qrImg = document.getElementById('profileShareQr');
    var linkInput = document.getElementById('profileShareLinkInput');
    var inviteInput = document.getElementById('profileInviteCodeInput');
    var toast = document.getElementById('pfToast');

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2600);
    }

    function copyText(text, okMsg) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                showToast(okMsg);
            }).catch(function () { fallbackCopy(text, okMsg); });
        } else {
            fallbackCopy(text, okMsg);
        }
    }

    function fallbackCopy(text, okMsg) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast(okMsg);
        } catch (e) {
            showToast('请手动复制');
        }
        document.body.removeChild(ta);
    }

    function initQr() {
        if (!qrImg) return;
        qrImg.src =
            'https://api.qrserver.com/v1/create-qr-code/?size=144x144&margin=8&data=' +
            encodeURIComponent(SHARE_URL);
    }

    function copyLink() {
        copyText(linkInput ? linkInput.value : PROFILE_URL, '主页链接已复制');
    }

    function copyInvite() {
        copyText(inviteInput ? inviteInput.value : INVITE_CODE, '邀请码已复制 · 好友注册后双方得积分');
    }

    function loadImage(url) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function () { resolve(img); };
            img.onerror = function () { reject(new Error('image load failed')); };
            img.src = url;
        });
    }

    function savePoster() {
        showToast('正在生成海报…');
        var qrUrl =
            'https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=0&data=' +
            encodeURIComponent(SHARE_URL);

        Promise.all([loadImage(COVER_IMG), loadImage(AVATAR_IMG), loadImage(qrUrl)])
            .then(function (imgs) {
                var w = 640;
                var h = 996;
                var canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                var ctx = canvas.getContext('2d');

                ctx.fillStyle = '#0c0c14';
                ctx.fillRect(0, 0, w, h);

                var coverH = Math.floor(h * 0.52);
                ctx.drawImage(imgs[0], 0, 0, w, coverH);
                var grad = ctx.createLinearGradient(0, coverH * 0.35, 0, coverH + 120);
                grad.addColorStop(0, 'rgba(12,12,20,0)');
                grad.addColorStop(1, 'rgba(12,12,20,0.98)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, coverH + 120);

                ctx.fillStyle = 'rgba(0,0,0,0.45)';
                roundRect(ctx, 24, 24, 130, 28, 14);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 18px system-ui, sans-serif';
                ctx.fillText('FansLoop', 44, 44);

                var avR = 52;
                var avX = 32;
                var avY = coverH - 20;
                ctx.beginPath();
                ctx.arc(avX + avR, avY + avR, avR + 4, 0, Math.PI * 2);
                ctx.fillStyle = '#0c0c14';
                ctx.fill();
                ctx.save();
                ctx.beginPath();
                ctx.arc(avX + avR, avY + avR, avR, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(imgs[1], avX, avY, avR * 2, avR * 2);
                ctx.restore();

                var ty = coverH + 48;
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 34px system-ui, sans-serif';
                ctx.fillText('Luna', 32, ty);
                ctx.fillStyle = '#c084fc';
                ctx.font = '600 16px system-ui, sans-serif';
                ctx.fillText('认证创作者', 32, ty + 32);
                ctx.fillStyle = 'rgba(255,255,255,0.75)';
                ctx.font = '15px system-ui, sans-serif';
                wrapText(ctx, '旅行 / 美食 / 慢生活摄影师 · 东京', 32, ty + 58, w - 64, 22);

                var invY = ty + 100;
                ctx.fillStyle = 'rgba(168,85,247,0.2)';
                roundRect(ctx, 32, invY, w - 64, 72, 12);
                ctx.fill();
                ctx.strokeStyle = 'rgba(168,85,247,0.5)';
                ctx.stroke();
                ctx.fillStyle = '#fcd34d';
                ctx.font = '600 12px system-ui, sans-serif';
                ctx.fillText('我的邀请码', w / 2, invY + 22);
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 36px ui-monospace, monospace';
                ctx.fillText(INVITE_CODE, w / 2, invY + 52);
                ctx.font = '11px system-ui, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.fillText('新用户注册填码 · 双方得积分', w / 2, invY + 68);
                ctx.textAlign = 'left';

                var footY = h - 118;
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.beginPath();
                ctx.moveTo(32, footY);
                ctx.lineTo(w - 32, footY);
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.font = '11px system-ui, sans-serif';
                ctx.fillText('SCAN TO REGISTER', 32, footY + 20);
                ctx.fillStyle = '#e9d5ff';
                ctx.font = 'bold 16px system-ui, sans-serif';
                ctx.fillText('fansloop.io/@luna', 32, footY + 44);

                var qrSize = 88;
                ctx.drawImage(imgs[2], w - 32 - qrSize, footY + 6, qrSize, qrSize);

                var a = document.createElement('a');
                a.download = 'FansLoop-Luna-profile.png';
                a.href = canvas.toDataURL('image/png');
                a.click();
                showToast('海报已保存（PNG）');
            })
            .catch(function () {
                showToast('海报保存失败，请稍后重试（原型）');
            });
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        var line = '';
        var ly = y;
        for (var i = 0; i < text.length; i++) {
            var test = line + text.charAt(i);
            if (ctx.measureText(test).width > maxWidth && line) {
                ctx.fillText(line, x, ly);
                line = text.charAt(i);
                ly += lineHeight;
            } else {
                line = test;
            }
        }
        ctx.fillText(line, x, ly);
    }

    initQr();
    if (linkInput) linkInput.value = PROFILE_URL;
    if (inviteInput) inviteInput.value = INVITE_CODE;
    var disp = document.getElementById('profileInviteCodeDisplay');
    if (disp) disp.textContent = INVITE_CODE;

    document.getElementById('btnCopyProfileLink')?.addEventListener('click', copyLink);
    document.getElementById('btnCopyProfileLinkMain')?.addEventListener('click', copyLink);
    document.getElementById('btnCopyInviteCode')?.addEventListener('click', copyInvite);
    document.getElementById('btnCopyInviteCodeMain')?.addEventListener('click', copyInvite);
    document.getElementById('btnSaveProfilePoster')?.addEventListener('click', savePoster);

    var params = new URLSearchParams(window.location.search);
    if (params.get('share') === 'open') {
        setTimeout(function () {
            var sheet = document.getElementById('sheetShare');
            if (sheet) {
                sheet.classList.add('show');
                sheet.setAttribute('aria-hidden', 'false');
            }
        }, 400);
    }
})();
