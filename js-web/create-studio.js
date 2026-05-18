/**

 * 创建内容工作室 · 类型切换 / 预览 / 媒体 / 定价 / 发布

 */

(function () {

    var currentType = 'image';

    var videoUploaded = false;

    var MAX_MEDIA = 9;



    var toast = document.getElementById('crToast');

    var drawer = document.getElementById('previewDrawer');

    var pvHead = document.getElementById('pvHeadLabel');

    var pvBodyTitle = document.getElementById('pvBodyTitle');

    var pvBodyText = document.getElementById('pvBodyText');

    var pvImgs = document.getElementById('pvImgs');

    var pvVideo = document.getElementById('pvVideo');

    var successOverlay = document.getElementById('pubSuccessOverlay');



    var mediaGrid = document.getElementById('mediaPreviewGrid');

    var mediaAddBtn = document.getElementById('mediaAddBtn');

    var mediaFileInput = document.getElementById('mediaFileInput');



    var priceGrid = document.getElementById('priceGrid');

    var rowSubPrice = document.getElementById('rowSubPrice');

    var rowPpvPrice = document.getElementById('rowPpvPrice');

    var inputSubPrice = document.getElementById('inputSubPrice');

    var inputPpvPrice = document.getElementById('inputPpvPrice');

    var priceSubDisplay = document.getElementById('priceSubDisplay');

    var pricePpvDisplay = document.getElementById('pricePpvDisplay');



    var DEMO_POOL = [

        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80',

        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80',

        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80',

        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&q=80'

    ];



    var pricing = { free: false, sub: true, ppv: false };



    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2400);
    }
    window.crShowToast = showToast;



    function getEditorTitle() {

        var panel = document.getElementById('panel' + currentType.charAt(0).toUpperCase() + currentType.slice(1));

        return panel ? panel.querySelector('.title-input')?.value || '' : '';

    }



    function getEditorText() {

        var panel = document.getElementById('panel' + currentType.charAt(0).toUpperCase() + currentType.slice(1));

        return panel ? panel.querySelector('.editor-text')?.value || '' : '';

    }



    function renderPreviewImages(urls) {

        if (!pvImgs) return;

        pvImgs.innerHTML = '';

        (urls || []).forEach(function (url) {

            var cell = document.createElement('div');

            cell.style.backgroundImage = "url('" + url + "')";

            pvImgs.appendChild(cell);

        });

        pvImgs.style.display = urls && urls.length ? 'grid' : 'none';

    }



    function openPreview(opts) {

        opts = opts || {};

        if (pvHead) pvHead.textContent = opts.head || '订阅者视角';

        if (pvBodyTitle) pvBodyTitle.textContent = opts.title || getEditorTitle() || '未命名';

        if (pvBodyText) pvBodyText.textContent = opts.text || getEditorText() || '';



        var isVideo = opts.kind === 'video';

        if (pvVideo) {

            if (isVideo && opts.videoPoster) {

                pvVideo.style.backgroundImage = "url('" + opts.videoPoster + "')";

                pvVideo.classList.add('show');

                pvVideo.setAttribute('aria-hidden', 'false');

            } else {

                pvVideo.classList.remove('show');

                pvVideo.style.backgroundImage = '';

                pvVideo.setAttribute('aria-hidden', 'true');

            }

        }



        if (isVideo) {

            renderPreviewImages([]);

        } else if (opts.images && opts.images.length) {

            renderPreviewImages(opts.images);

        } else if (opts.hideImgs) {

            renderPreviewImages([]);

        } else {

            var urls = [];

            mediaGrid?.querySelectorAll('.mp-cell:not(.add)').forEach(function (c) {

                var src = c.getAttribute('data-src') || '';

                if (src) urls.push(src);

            });

            renderPreviewImages(urls);

        }



        drawer.classList.add('show');

        drawer.setAttribute('aria-hidden', 'false');

    }



    function closePreview() {

        drawer.classList.remove('show');

        drawer.setAttribute('aria-hidden', 'true');

    }



    function openSuccess(msg) {

        var el = document.getElementById('pubSuccessMsg');

        if (el && msg) el.textContent = msg;

        if (successOverlay) successOverlay.classList.add('show');

    }



    function closeSuccess() {

        if (successOverlay) successOverlay.classList.remove('show');

    }



    function countMediaCells() {

        return mediaGrid ? mediaGrid.querySelectorAll('.mp-cell:not(.add)').length : 0;

    }



    function syncCoverTag() {

        if (!mediaGrid) return;

        mediaGrid.querySelectorAll('.mp-cell:not(.add)').forEach(function (c, i) {

            c.classList.toggle('cover-tag', i === 0);

        });

    }



    function syncActionBarMedia() {

        var barInfo = document.getElementById('actionBarInfo');

        if (!barInfo || currentType !== 'image') return;

        var n = countMediaCells();

        var len = getEditorText().length;

        barInfo.innerHTML = '<b style="color:#fff">' + n + ' 张图片</b> · 字数 ' + len + ' · 标签 3';

    }



    function createMediaCell(src) {

        var cell = document.createElement('div');

        cell.className = 'mp-cell';

        cell.setAttribute('data-src', src);

        cell.style.backgroundImage = "url('" + src + "')";

        var del = document.createElement('span');

        del.className = 'del';

        del.setAttribute('role', 'button');

        del.setAttribute('tabindex', '0');

        del.title = '删除';

        del.innerHTML = '<i class="fa-solid fa-xmark"></i>';

        cell.appendChild(del);

        return cell;

    }



    function addMediaFromUrl(src) {

        if (!mediaGrid || !mediaAddBtn) return;

        if (countMediaCells() >= MAX_MEDIA) {

            showToast('最多上传 ' + MAX_MEDIA + ' 张图片');

            return;

        }

        mediaGrid.insertBefore(createMediaCell(src), mediaAddBtn);

        syncCoverTag();

        syncActionBarMedia();

    }



    function removeMediaCell(cell) {

        if (!mediaGrid || !cell || cell.classList.contains('add')) return;

        cell.remove();

        if (countMediaCells() === 0) {

            addMediaFromUrl(DEMO_POOL[0]);

            showToast('至少保留一张图片，已恢复示例图');

        }

        syncCoverTag();

        syncActionBarMedia();

    }



    function initMediaGallery() {

        if (!mediaGrid) return;



        mediaGrid.addEventListener('click', function (e) {

            var del = e.target.closest('.del');

            if (del) {

                e.stopPropagation();

                removeMediaCell(del.closest('.mp-cell'));

                return;

            }

            if (e.target.closest('#mediaAddBtn') || e.target.closest('.mp-cell.add')) {

                if (countMediaCells() >= MAX_MEDIA) {

                    showToast('最多上传 ' + MAX_MEDIA + ' 张图片');

                    return;

                }

                mediaFileInput?.click();

            }

        });



        mediaAddBtn?.addEventListener('keydown', function (e) {

            if (e.key === 'Enter' || e.key === ' ') {

                e.preventDefault();

                mediaFileInput?.click();

            }

        });



        mediaFileInput?.addEventListener('change', function () {

            var files = mediaFileInput.files;

            if (!files || !files.length) return;

            Array.prototype.forEach.call(files, function (file, i) {

                if (countMediaCells() >= MAX_MEDIA) return;

                var reader = new FileReader();

                reader.onload = function (ev) {

                    addMediaFromUrl(ev.target.result);

                };

                reader.readAsDataURL(file);

            });

            mediaFileInput.value = '';

            showToast('图片已添加（原型）');

        });



        // 双击添加区：从图库池追加（无文件选择时演示）

        mediaAddBtn?.addEventListener('dblclick', function (e) {

            e.preventDefault();

            var url = DEMO_POOL[countMediaCells() % DEMO_POOL.length];

            addMediaFromUrl(url);

            showToast('已从图库添加示例图');

        });

    }



    function getPriceCell(mode) {

        return priceGrid?.querySelector('.price-cell[data-mode="' + mode + '"]');

    }



    function syncPriceUI() {

        var freeEl = getPriceCell('free');

        var subEl = getPriceCell('sub');

        var ppvEl = getPriceCell('ppv');

        var paidActive = pricing.sub || pricing.ppv;



        if (freeEl) {

            freeEl.classList.toggle('selected', pricing.free);

            freeEl.classList.toggle('disabled', paidActive);

        }

        if (subEl) subEl.classList.toggle('checked', pricing.sub);

        if (ppvEl) ppvEl.classList.toggle('checked', pricing.ppv);



        if (rowSubPrice) rowSubPrice.classList.toggle('show', pricing.sub);

        if (rowPpvPrice) rowPpvPrice.classList.toggle('show', pricing.ppv);



        if (priceSubDisplay && inputSubPrice) priceSubDisplay.textContent = inputSubPrice.value || '28';

        if (pricePpvDisplay && inputPpvPrice) pricePpvDisplay.textContent = inputPpvPrice.value || '5';

    }



    function togglePriceMode(mode) {

        if (mode === 'free') {

            if (pricing.free) return;

            pricing = { free: true, sub: false, ppv: false };

        } else if (mode === 'sub') {

            pricing.free = false;

            pricing.sub = !pricing.sub;

            if (!pricing.sub && !pricing.ppv) pricing.free = true;

        } else if (mode === 'ppv') {

            pricing.free = false;

            pricing.ppv = !pricing.ppv;

            if (!pricing.sub && !pricing.ppv) pricing.free = true;

        }

        syncPriceUI();

    }



    function initPricing() {

        if (!priceGrid) return;

        syncPriceUI();



        priceGrid.addEventListener('click', function (e) {

            var cell = e.target.closest('.price-cell');

            if (!cell || cell.classList.contains('disabled')) return;

            togglePriceMode(cell.getAttribute('data-mode'));

        });



        priceGrid.addEventListener('keydown', function (e) {

            if (e.key !== 'Enter' && e.key !== ' ') return;

            var cell = e.target.closest('.price-cell');

            if (!cell || cell.classList.contains('disabled')) return;

            e.preventDefault();

            togglePriceMode(cell.getAttribute('data-mode'));

        });



        inputSubPrice?.addEventListener('input', syncPriceUI);

        inputPpvPrice?.addEventListener('input', syncPriceUI);

    }



    function setType(type) {

        currentType = type;

        document.querySelectorAll('.type-card').forEach(function (c) {

            c.classList.toggle('selected', c.getAttribute('data-type') === type);

        });

        ['image', 'video', 'live'].forEach(function (t) {

            var panel = document.getElementById('panel' + t.charAt(0).toUpperCase() + t.slice(1));

            if (panel) panel.style.display = t === type ? 'block' : 'none';
        });
        if (window.crToggleLiveOnlyUI) window.crToggleLiveOnlyUI(type === 'live');

        var barInfo = document.getElementById('actionBarInfo');

        if (barInfo) {

            if (type === 'video') barInfo.innerHTML = '<b style="color:#fff">视频</b> · ' + (videoUploaded ? '已上传' : '未上传');

            else if (type === 'live') barInfo.innerHTML = '<b style="color:#fff">直播</b> · 准备开播';

            else syncActionBarMedia();

        }

        var pubBtn = document.getElementById('btnPublishMain');

        if (pubBtn) {

            if (type === 'live') {
                if (window.crUpdatePublishButton) window.crUpdatePublishButton('live');
                else pubBtn.innerHTML = '<i class="fa-solid fa-tower-broadcast"></i> 进入主播直播间';
            }

            else if (type === 'video') pubBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 提交视频审核';

            else pubBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 立即发布';

        }

    }



    document.querySelectorAll('.type-card[data-type]').forEach(function (card) {

        card.addEventListener('click', function () {

            setType(card.getAttribute('data-type'));

        });

    });



    document.getElementById('pvClose')?.addEventListener('click', closePreview);

    drawer?.addEventListener('click', function (e) { if (e.target === drawer) closePreview(); });



    document.querySelectorAll('.btn-pending-preview').forEach(function (btn) {

        btn.addEventListener('click', function () {

            var title = btn.getAttribute('data-title') || '';

            var kind = btn.getAttribute('data-kind') || 'image';

            var desc = btn.getAttribute('data-desc') || '此为待审核内容的发布效果预览（原型）。';

            var images = [];

            ['data-img1', 'data-img2', 'data-img3', 'data-img4'].forEach(function (attr) {

                var u = btn.getAttribute(attr);

                if (u) images.push(u);

            });

            openPreview({

                kind: kind,

                title: title,

                text: desc,

                videoPoster: btn.getAttribute('data-video-poster') || '',

                images: kind === 'image' ? images : []

            });

        });

    });



    ['btnDraftTop'].forEach(function (id) {

        var b = document.getElementById(id);

        if (b) b.addEventListener('click', function () { showToast('草稿已保存到云端（原型）'); });

    });



    document.getElementById('btnPublishMain')?.addEventListener('click', function () {

        if (currentType === 'live') {
            if (window.crIsLivePreview && window.crIsLivePreview()) {
                var pt = document.getElementById('livePreviewTime')?.value || '';
                var label = pt ? pt.replace('T', ' ') : '待定';
                openSuccess('直播预告已作为图文动态发布到 Feed，计划开播时间 ' + label + '（展示用，不会自动开播）。');
                showToast('直播预告已发布（图文）');
            } else {
                location.href = 'create-live-host.html';
            }
            return;
        }

        if (currentType === 'video') {

            if (!videoUploaded) {

                showToast('请先上传视频文件');

                return;

            }

            openSuccess('视频已提交审核，发布成功后将在首页展示。');

            return;

        }

        openSuccess('图文动态已发布，订阅者将在 Feed 中看到你的内容。');

    });



    document.getElementById('pubSuccessClose')?.addEventListener('click', closeSuccess);

    successOverlay?.addEventListener('click', function (e) {

        if (e.target === successOverlay) closeSuccess();

    });



    var videoZone = document.getElementById('videoUploadZone');

    var videoInput = document.getElementById('videoFileInput');

    if (videoZone && videoInput) {

        videoZone.addEventListener('click', function () { videoInput.click(); });

        videoInput.addEventListener('change', function () {

            if (videoInput.files && videoInput.files[0]) {

                videoUploaded = true;

                videoZone.classList.add('has-video');

                videoZone.style.backgroundImage = "url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80')";

                var st = document.getElementById('videoStatus');

                if (st) st.textContent = '已选择：' + videoInput.files[0].name;

                var barInfo = document.getElementById('actionBarInfo');

                if (barInfo) barInfo.innerHTML = '<b style="color:#fff">视频</b> · 已上传';

            }

        });

    }



    document.querySelectorAll('.pending-actions .btn-cancel').forEach(function (btn) {

        btn.addEventListener('click', function () {

            var t = btn.getAttribute('data-title') || '';

            if (confirm('确认撤回审核申请「' + t + '」？内容将退回草稿箱。')) {

                showToast('已提交撤回（原型）：「' + t + '」');

                btn.closest('tr').style.opacity = '0.35';

            }

        });

    });

    document.querySelectorAll('.pending-actions .btn-edit').forEach(function (btn) {

        btn.addEventListener('click', function () {

            var t = btn.getAttribute('data-title') || '';

            showToast('已从「' + t + '」载入编辑器字段（原型演示）');

            document.querySelector('.title-input')?.focus();

        });

    });



    initMediaGallery();

    initPricing();

    setType('image');

})();


