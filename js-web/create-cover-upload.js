/**
 * 创作中心 · 封面图上传（视频 / 直播 · 与 H5 交互一致）
 */
(function (global) {
    function qs(sel, root) {
        return (root || document).querySelector(sel);
    }

    function applyCover(el, url) {
        if (!el) return;
        if (url) {
            el.style.backgroundImage = "url('" + String(url).replace(/'/g, '%27') + "')";
            el.classList.add('has-cover');
        } else {
            el.style.backgroundImage = '';
            el.classList.remove('has-cover');
        }
        var ph = el.querySelector('.cr-cover-placeholder');
        if (ph) ph.style.display = url ? 'none' : '';
    }

    function bindCoverUpload(el, input, opts) {
        opts = opts || {};
        if (typeof el === 'string') el = qs(el);
        if (typeof input === 'string') input = qs(input);
        if (!el || !input || el.getAttribute('data-cover-bound') === '1') return;
        el.setAttribute('data-cover-bound', '1');

        if (opts.defaultUrl) applyCover(el, opts.defaultUrl);

        el.addEventListener('click', function () {
            input.click();
        });
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                input.click();
            }
        });

        input.addEventListener('change', function () {
            var f = input.files && input.files[0];
            if (!f) return;
            var reader = new FileReader();
            reader.onload = function (ev) {
                var url = ev.target && ev.target.result;
                applyCover(el, url);
                if (opts.onChange) opts.onChange(url);
                if (global.crShowToast) global.crShowToast('封面已更新');
            };
            reader.readAsDataURL(f);
            input.value = '';
        });
    }

    function initCreateCoverUploads() {
        bindCoverUpload('#videoCoverUpload', '#videoCoverInput');
        bindCoverUpload('#liveNowCoverUpload', '#liveNowCoverInput');
        bindCoverUpload('#livePreviewCover', '#livePreviewCoverInput', {
            defaultUrl: 'https://picsum.photos/seed/live-preview-default/1200/675'
        });
    }

    global.FL_bindCreateCoverUpload = bindCoverUpload;
    global.FL_applyCreateCover = applyCover;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCreateCoverUploads);
    } else {
        initCreateCoverUploads();
    }
})(typeof window !== 'undefined' ? window : this);
