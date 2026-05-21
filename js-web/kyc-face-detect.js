/**
 * KYC 原型 · 取景框内人像粗检（最后一帧快照）
 */
(function (global) {
    function detectFaceInCanvas(canvas) {
        if (!canvas || !canvas.width || !canvas.height) {
            return { ok: false, reason: "未获取到有效画面，请重试" };
        }
        var ctx = canvas.getContext("2d");
        var w = canvas.width;
        var h = canvas.height;
        var x0 = Math.floor(w * 0.22);
        var y0 = Math.floor(h * 0.12);
        var rw = Math.floor(w * 0.56);
        var rh = Math.floor(h * 0.76);
        var data;
        try {
            data = ctx.getImageData(x0, y0, rw, rh).data;
        } catch (e) {
            return { ok: false, reason: "无法分析画面，请使用 HTTPS 或 localhost 打开原型" };
        }
        var skin = 0;
        var valid = 0;
        var lumaSum = 0;
        for (var i = 0; i < data.length; i += 4) {
            var r = data[i];
            var g = data[i + 1];
            var b = data[i + 2];
            var luma = 0.299 * r + 0.587 * g + 0.114 * b;
            if (luma < 35 || luma > 250) continue;
            valid++;
            lumaSum += luma;
            if (r > 95 && g > 40 && b > 20 && r > g && r > b && r - g > 12 && r - b > 12) {
                skin++;
            }
        }
        if (valid < 800) {
            return { ok: false, reason: "画面过暗或未检测到摄像头画面，请调整光线后重试" };
        }
        var avgLuma = lumaSum / valid;
        if (avgLuma < 55) {
            return { ok: false, reason: "环境光线不足，请面向光源后重试" };
        }
        var skinRatio = skin / valid;
        if (skinRatio < 0.08) {
            return { ok: false, reason: "未检测到清晰人像，请将面部对准取景框并保持静止" };
        }
        if (skinRatio < 0.16 && avgLuma > 200) {
            return { ok: false, reason: "画面过曝或背景干扰过大，请调整角度后重试" };
        }
        return { ok: true, skinRatio: skinRatio };
    }

    global.KycFaceDetect = { detectFaceInCanvas: detectFaceInCanvas };
})(window);
