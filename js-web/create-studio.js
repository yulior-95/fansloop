/**

 * 创建内容工作室 · 类型切换 / 预览 / 媒体 / 定价 / 发布

 */

(function () {

    var currentType = 'image';

    var videoUploaded = false;

    var MAX_MEDIA = 9;

    var LS_DRAFT_PREFIX = 'fl_cr_draft_';

    var pendingEditMode = false;

    var pendingEditRow = null;

    var editorZone = document.getElementById('createEditorZone');

    var typeGrid = document.getElementById('createTypeGrid');



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



    function syncActionBarMedia() { /* 已移除统计文案 */ }

    function hasDraft(type) {

        try { return !!localStorage.getItem(LS_DRAFT_PREFIX + type); } catch (e) { return false; }

    }

    function saveDraftForType(type) {

        var panel = document.getElementById('panel' + type.charAt(0).toUpperCase() + type.slice(1));

        if (!panel) return;

        var payload = {

            title: panel.querySelector('.title-input')?.value || '',

            text: panel.querySelector('.editor-text')?.value || '',

            savedAt: Date.now()

        };

        try { localStorage.setItem(LS_DRAFT_PREFIX + type, JSON.stringify(payload)); } catch (e) {}

    }

    function clearDraftForType(type) {

        try { localStorage.removeItem(LS_DRAFT_PREFIX + type); } catch (e) {}

    }

    function syncActionBarButtons() {

        var bar = document.getElementById('createActionBar');

        var saveDraftBtn = document.getElementById('btnSaveDraft');

        var clearDraftBtn = document.getElementById('btnClearDraft');

        var draftGlass = document.getElementById('draftDevGlassWrap');

        var pubBtn = document.getElementById('btnPublishMain');

        if (bar) bar.classList.toggle('is-pending-edit', pendingEditMode);

        if (pendingEditMode) {

            if (saveDraftBtn) saveDraftBtn.style.display = 'none';

            if (clearDraftBtn) clearDraftBtn.style.display = 'none';

            if (draftGlass) draftGlass.style.display = 'none';

            if (pubBtn) pubBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 重新提交审核';

            return;

        }

        var isLive = currentType === 'live';

        var has = !isLive && hasDraft(currentType);

        if (saveDraftBtn) saveDraftBtn.style.display = isLive ? 'none' : (has ? 'none' : '');

        if (clearDraftBtn) clearDraftBtn.style.display = isLive ? 'none' : (has ? '' : 'none');

        if (draftGlass) draftGlass.style.display = isLive ? 'none' : ((has || editorZone?.classList.contains('is-open')) ? '' : 'none');

        if (pubBtn) {

            if (currentType === 'live') {

                if (window.crUpdatePublishButton) window.crUpdatePublishButton('live');

                else pubBtn.innerHTML = '<i class="fa-solid fa-tower-broadcast"></i> 进入主播直播间';

            } else if (currentType === 'video') {

                pubBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 提交视频审核';

            } else {

                pubBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 立即发布';

            }

        }

    }

    function openCreateEditor(type) {

        if (pendingEditMode && type !== currentType) {

            showToast('审核编辑中不可切换内容类型，请先保存或取消编辑');

            return;

        }

        if (editorZone) editorZone.classList.add('is-open');

        setType(type);

        setTimeout(function () {

            editorZone?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        }, 60);

    }

    function fillPendingContentFromBtn(btn, kind) {

        var panel = document.getElementById('panel' + kind.charAt(0).toUpperCase() + kind.slice(1));

        if (!panel) return;

        var title = btn.getAttribute('data-title') || '';

        var desc = btn.getAttribute('data-desc') || '';

        var titleEl = panel.querySelector('.title-input');

        var textEl = panel.querySelector('.editor-text') || panel.querySelector('#liveNowDesc');

        if (titleEl) titleEl.value = title;

        if (textEl && desc) textEl.value = desc;

        if (kind === 'image' && mediaGrid && mediaAddBtn) {

            var urls = [];

            ['data-img1', 'data-img2', 'data-img3', 'data-img4'].forEach(function (attr) {

                var u = btn.getAttribute(attr);

                if (u) urls.push(u);

            });

            if (urls.length) {

                mediaGrid.querySelectorAll('.mp-cell:not(.add)').forEach(function (c) { c.remove(); });

                urls.forEach(function (u) { addMediaFromUrl(u); });

            }

        }

        if (kind === 'video') {

            var poster = btn.getAttribute('data-video-poster');

            var vz = document.getElementById('videoUploadZone');

            var st = document.getElementById('videoStatus');

            if (poster && vz) {

                videoUploaded = true;

                vz.classList.add('has-video');

                vz.style.backgroundImage = "url('" + poster + "')";

                if (st) st.textContent = '已载入审核稿件关联画面（原型）';

            }

        }

    }

    function enterPendingEdit(btn) {

        pendingEditMode = true;

        pendingEditRow = btn.closest('tr');

        var kind = btn.getAttribute('data-kind') || 'image';

        var title = btn.getAttribute('data-title') || '';

        var kindLabel = kind === 'video' ? '视频' : kind === 'live' ? '直播' : '图文';

        typeGrid?.classList.add('type-locked');

        if (editorZone) editorZone.classList.add('is-open');

        setType(kind);

        requestAnimationFrame(function () {

            requestAnimationFrame(function () {

                fillPendingContentFromBtn(btn, kind);

                syncActionBarButtons();

                showToast('已选中「' + kindLabel + '」并载入「' + title + '」到下方编辑器');

                typeGrid?.scrollIntoView({ behavior: 'smooth', block: 'center' });

                setTimeout(function () {

                    editorZone?.scrollIntoView({ behavior: 'smooth', block: 'start' });

                }, 120);

            });

        });

    }

    function exitPendingEdit(restorePublish) {

        pendingEditMode = false;

        pendingEditRow = null;

        typeGrid?.classList.remove('type-locked');

        syncActionBarButtons();

        if (restorePublish !== false) setType(currentType);

    }

    function initPendingRowActions() {

        document.querySelectorAll('#pending tbody tr[data-pending-status]').forEach(function (tr) {

            var status = tr.getAttribute('data-pending-status');

            var editBtn = tr.querySelector('.btn-edit');

            var cancelBtn = tr.querySelector('.btn-cancel');

            if (editBtn) {

                if (status === 'rejected') {

                    editBtn.classList.remove('is-hidden');

                    editBtn.disabled = false;

                } else {

                    editBtn.classList.add('is-hidden');

                    editBtn.disabled = true;

                }

            }

            if (cancelBtn) {

                cancelBtn.classList.toggle('is-hidden', status !== 'rejected' && status !== 'reviewing');

            }

        });

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

        var tipSub = document.getElementById('rowAllowTipSub');
        if (tipSub) {
            if (type === 'live') tipSub.textContent = '直播中观众可发送 USDT 打赏与礼物';
            else if (type === 'video') tipSub.textContent = '视频动态下观众可打赏与送礼';
            else tipSub.textContent = '图文动态下观众可打赏与送礼';
        }

        syncActionBarButtons();

    }



    document.querySelectorAll('.type-card[data-type]').forEach(function (card) {

        card.addEventListener('click', function () {

            openCreateEditor(card.getAttribute('data-type'));

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



    document.getElementById('btnPublishMain')?.addEventListener('click', function () {

        if (pendingEditMode) {

            openSuccess('修改已重新提交审核，通过后将更新线上内容（原型）。');

            if (pendingEditRow) {

                var titleCell = pendingEditRow.cells[1];

                if (titleCell) {

                    var panel = document.getElementById('panel' + currentType.charAt(0).toUpperCase() + currentType.slice(1));

                    var t = panel?.querySelector('.title-input')?.value;

                    if (t) titleCell.textContent = t;

                }

                pendingEditRow.setAttribute('data-pending-status', 'reviewing');

                var stCell = pendingEditRow.cells[3];

                if (stCell) stCell.innerHTML = '<span class="status-pill reviewing"><i class="fa-solid fa-spinner fa-spin"></i> 审核中</span>';

                initPendingRowActions();

            }

            exitPendingEdit();

            return;

        }

        if (currentType === 'live') {
            if (window.crIsLivePreview && window.crIsLivePreview()) {
                var pt = document.getElementById('livePreviewTime')?.value || '';
                var label = pt ? pt.replace('T', ' ') : '待定';
                openSuccess('直播预告已作为图文动态发布到 Feed，计划开播时间 ' + label + '（展示用，不会自动开播）。');
                showToast('直播预告已发布（图文）');
            } else {
                if (window.LiveMetaStore && window.LiveMetaStore.saveFromCreateForm) {
                    window.LiveMetaStore.saveFromCreateForm();
                }
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

                syncActionBarButtons();

            }

        });

    }



    var pendingCancelOverlay = document.getElementById('pendingCancelOverlay');

    var pendingCancelSub = document.getElementById('pendingCancelSub');

    var pendingCancelTargetRow = null;

    function openPendingCancelModal(btn) {

        pendingCancelTargetRow = btn.closest('tr');

        var t = btn.getAttribute('data-title') || '';

        if (pendingCancelSub) {

            pendingCancelSub.textContent = t

                ? '将取消「' + t + '」的审核申请，确认后该条从列表移除。'

                : '取消后该条将从待审核列表移除（原型演示）。';

        }

        if (pendingCancelOverlay) {

            pendingCancelOverlay.classList.add('show');

            pendingCancelOverlay.setAttribute('aria-hidden', 'false');

        }

    }

    function closePendingCancelModal() {

        pendingCancelTargetRow = null;

        if (pendingCancelOverlay) {

            pendingCancelOverlay.classList.remove('show');

            pendingCancelOverlay.setAttribute('aria-hidden', 'true');

        }

    }

    function updatePendingListCount() {

        var n = document.querySelectorAll('#pending tbody tr[data-pending-status]').length;

        var tag = document.querySelector('#pending .tag-warning');

        if (tag) tag.innerHTML = '<i class="fa-solid fa-clock"></i> ' + n + ' 条（待审核 / 不通过）';

    }

    document.getElementById('pendingCancelDismiss')?.addEventListener('click', closePendingCancelModal);

    pendingCancelOverlay?.addEventListener('click', function (e) {

        if (e.target === pendingCancelOverlay) closePendingCancelModal();

    });

    document.getElementById('pendingCancelConfirm')?.addEventListener('click', function () {

        var tr = pendingCancelTargetRow;

        if (!tr) { closePendingCancelModal(); return; }

        var t = tr.querySelector('.btn-cancel')?.getAttribute('data-title') || '';

        if (pendingEditMode && pendingEditRow === tr) exitPendingEdit();

        tr.remove();

        updatePendingListCount();

        closePendingCancelModal();

        showToast(t ? '已取消「' + t + '」' : '已取消发布内容');

    });

    document.querySelectorAll('.pending-actions .btn-cancel').forEach(function (btn) {

        btn.addEventListener('click', function () {

            if (btn.classList.contains('is-hidden')) return;

            openPendingCancelModal(btn);

        });

    });

    document.querySelectorAll('.pending-actions .btn-edit').forEach(function (btn) {

        btn.addEventListener('click', function () {

            if (btn.disabled || btn.classList.contains('is-hidden')) return;

            enterPendingEdit(btn);

        });

    });

    document.getElementById('btnPendingSaveEdit')?.addEventListener('click', function () {

        if (!pendingEditMode) return;

        showToast('审核内容修改已保存（原型，未重新提审）');

    });

    document.getElementById('btnPendingCancelEdit')?.addEventListener('click', function () {

        if (!pendingEditMode) return;

        if (!confirm('放弃本次编辑？未保存的修改将丢失。')) return;

        exitPendingEdit();

        showToast('已取消编辑');

    });

    document.getElementById('btnSaveDraft')?.addEventListener('click', function () {

        if (pendingEditMode || currentType === 'live') return;

        saveDraftForType(currentType);

        syncActionBarButtons();

        showToast('「' + (currentType === 'video' ? '视频' : currentType === 'live' ? '直播' : '图文') + '」草稿已保存（每类型仅 1 份）');

    });

    document.getElementById('btnClearDraft')?.addEventListener('click', function () {

        if (pendingEditMode || currentType === 'live') return;

        if (!confirm('确定清除当前类型的草稿？')) return;

        clearDraftForType(currentType);

        syncActionBarButtons();

        showToast('已清除当前类型草稿');

    });



    initMediaGallery();

    initPricing();

    initPendingRowActions();

    ['image', 'video', 'live'].forEach(function (t) {

        var panel = document.getElementById('panel' + t.charAt(0).toUpperCase() + t.slice(1));

        if (panel) panel.style.display = 'none';

    });

    document.querySelectorAll('.type-card[data-type]').forEach(function (c) { c.classList.remove('selected'); });

    syncActionBarButtons();

})();


