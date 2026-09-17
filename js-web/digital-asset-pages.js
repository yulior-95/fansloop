/**
 * 数字商品页通用渲染 / 交互
 */
(function (global) {
    function qs(sel, root) { return (root || document).querySelector(sel); }
    function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    function toast(msg, isErr) {
        var el = qs('#daToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'daToast';
            el.className = 'da-toast';
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.className = 'da-toast show' + (isErr ? ' err' : '');
        clearTimeout(el._t);
        el._t = setTimeout(function () { el.classList.remove('show'); }, 2600);
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function supplyHtml(p) {
        var Store = global.DigitalAssetsStore;
        if (!p || p.supplyMode !== 'limited') {
            return '<div class="supply">不限个数 · 已售 ' + (p.soldCount || 0) + '</div>';
        }
        var left = Store.remaining(p);
        var pct = p.supplyTotal ? Math.min(100, Math.round((p.soldCount / p.supplyTotal) * 100)) : 0;
        return '<div class="supply">限量 ' + p.supplyTotal + ' 份 · 已售 ' + p.soldCount + ' · 剩余 ' + left +
            '<div class="bar"><i style="width:' + pct + '%"></i></div></div>';
    }

    function statusBadgeHtml(p, Store) {
        var map = {
            sold_out: ['soldout', '已售罄'],
            delisted: ['soldout', '已下架'],
            pending_review: ['', '审核中'],
            rejected: ['soldout', '已驳回'],
            draft: ['', '草稿']
        };
        var pair = map[p.status];
        if (!pair) return '<span class="badge">' + esc(Store.typeLabel(p.assetType)) + '</span>';
        return '<span class="badge' + (pair[0] ? ' ' + pair[0] : '') + '">' + esc(pair[1]) + '</span>';
    }

    function cardHtml(p) {
        var Store = global.DigitalAssetsStore;
        var badge = statusBadgeHtml(p, Store);
        return (
            '<article class="da-card" data-id="' + esc(p.id) + '" role="link" tabindex="0">' +
            '<div class="cover">' + badge + '<img src="' + esc(p.coverUrl) + '" alt=""></div>' +
            '<div class="body">' +
            '<div class="type">' + esc(Store.typeLabel(p.assetType)) +
            (p.status && p.status !== 'listed' ? ' · ' + esc(Store.statusLabel(p.status)) : '') + '</div>' +
            '<h3>' + esc(p.title) + '</h3>' +
            '<div class="meta"><span class="price">' + Number(p.priceUsdt).toFixed(2) + ' USDT</span>' +
            '<span>' + esc(p.creatorName || '') + '</span></div>' +
            supplyHtml(p) +
            '</div></article>'
        );
    }

    function bindCards(root) {
        qsa('.da-card', root).forEach(function (card) {
            function go() {
                var id = card.getAttribute('data-id');
                if (global.DigitalAssetCommerceModal) {
                    var p = global.DigitalAssetsStore && global.DigitalAssetsStore.getById(id);
                    var own = global.DigitalAssetCommerceModal.isOwnProduct && global.DigitalAssetCommerceModal.isOwnProduct(p);
                    global.DigitalAssetCommerceModal.openDetail(id, {
                        ownerView: !!own,
                        onDone: function () {
                            if (typeof global.__daReloadStore === 'function') global.__daReloadStore();
                        }
                    });
                    return;
                }
                location.href = 'digital-asset-detail.html?id=' + encodeURIComponent(id);
            }
            card.addEventListener('click', go);
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
            });
        });
    }

    function renderStoreGrid(container, filter) {
        var Store = global.DigitalAssetsStore;
        if (!container || !Store) return;
        var list = Store.list(filter || { listedOnly: true });
        if (!list.length) {
            container.innerHTML = '<div class="da-empty">暂无上架数字商品</div>';
            return;
        }
        container.innerHTML = '<div class="da-grid">' + list.map(cardHtml).join('') + '</div>';
        bindCards(container);
    }

    function param(name) {
        try {
            return new URLSearchParams(location.search).get(name);
        } catch (e) {
            return null;
        }
    }

    function initDetailPage() {
        var id = param('id');
        var from = param('from') || '';
        if (!id) {
            var root = qs('#daDetailRoot');
            if (root) root.innerHTML = '<div class="da-empty">商品不存在或已删除</div>';
            return;
        }
        var target;
        if (from === 'showcase' || from === 'creator-showcase') {
            target = 'creator-showcase.html?open=' + encodeURIComponent(id);
            var name = param('name');
            var owner = param('owner');
            if (name) target += '&name=' + encodeURIComponent(name);
            if (owner === '1') target += '&owner=1';
        } else if (from === 'my') {
            target = 'digital-asset-owned-view.html?id=' + encodeURIComponent(id) + '&from=my';
        } else {
            target = 'digital-asset-store.html?open=' + encodeURIComponent(id);
        }
        location.replace(target);
    }

    function initCreatePage() {
        var Store = global.DigitalAssetsStore;
        var form = qs('#daCreateForm');
        if (!form || !Store) return;

        var forcedType = (param('type') || '').toLowerCase();
        if (forcedType === 'nft' || forcedType === 'membership' || forcedType === 'exclusive' || forcedType === 'other') {
            forcedType = 'image';
        }
        var fromShowcase = param('from') === 'showcase';
        var HERO_MAX_EDGE = 720;
        var HERO_MAX_LEN = 180000;
        var heroUrl = '';
        var heroSource = '';
        var workImages = [];
        var workVideos = [];

        function refreshHeroUI() {
            var img = qs('#daCoverImg');
            var ph = qs('#daCoverPh');
            var tag = qs('#daCoverTag');
            var state = qs('#daCoverState');
            var clear = qs('#btnDaCoverClear');
            if (img) {
                img.hidden = !heroUrl;
                if (heroUrl) img.src = heroUrl;
                else img.removeAttribute('src');
            }
            if (ph) ph.hidden = !!heroUrl;
            if (tag) tag.hidden = !heroUrl;
            if (clear) clear.hidden = !heroUrl;
            if (state) {
                if (!heroUrl) state.textContent = '未设置首图，可上传本地图片或粘贴 URL';
                else if (heroSource === 'upload') state.textContent = '已上传本地图片（约 ' + Math.round(heroUrl.length / 1024) + ' KB）';
                else state.textContent = '已使用图片 URL 作为首图';
            }
        }

        function setHero(url, source, fromInput) {
            heroUrl = url || '';
            heroSource = heroUrl ? (source || 'url') : '';
            var input = qs('#daCover');
            if (input && !fromInput) input.value = heroSource === 'upload' ? '' : heroUrl;
            refreshHeroUI();
        }

        function readImageFile(file, cb) {
            if (!/^image\//.test(file.type || '')) return toast('请选择图片文件', true);
            var reader = new FileReader();
            reader.onerror = function () { toast('读取图片失败，请重试', true); };
            reader.onload = function () {
                var img = new Image();
                img.onerror = function () { toast('图片解析失败，请换一张', true); };
                img.onload = function () {
                    var scale = Math.min(1, HERO_MAX_EDGE / Math.max(img.width, img.height));
                    var canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(img.width * scale));
                    canvas.height = Math.max(1, Math.round(img.height * scale));
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    var q = 0.7;
                    var out = canvas.toDataURL('image/jpeg', q);
                    while (out.length > HERO_MAX_LEN && q > 0.4) {
                        q -= 0.12;
                        out = canvas.toDataURL('image/jpeg', q);
                    }
                    cb(out);
                };
                img.src = String(reader.result || '');
            };
            reader.readAsDataURL(file);
        }

        function renderWorkGrid(kind) {
            var isVid = kind === 'video';
            var list = isVid ? workVideos : workImages;
            var grid = qs(isVid ? '#daVideoGrid' : '#daImageGrid');
            if (!grid) return;
            if (!list.length) {
                grid.innerHTML = '<div class="da-work-empty">尚未添加' + (isVid ? '视频' : '图片') + '</div>';
                return;
            }
            grid.innerHTML = list.map(function (url, i) {
                var inner = isVid
                    ? '<video src="' + esc(url) + '" muted></video><span class="tag">视频</span>'
                    : '<img src="' + esc(url) + '" alt="">';
                return '<div class="da-work-tile" data-kind="' + kind + '" data-i="' + i + '">' + inner +
                    '<button type="button" class="da-work-del" aria-label="删除">&times;</button></div>';
            }).join('');
            qsa('.da-work-del', grid).forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var tile = btn.parentNode;
                    var idx = parseInt(tile.getAttribute('data-i'), 10);
                    if (isVid) workVideos.splice(idx, 1);
                    else workImages.splice(idx, 1);
                    renderWorkGrid(kind);
                });
            });
        }

        var typeSel = qs('#daAssetType');
        if (typeSel) {
            typeSel.innerHTML = Store.ASSET_TYPES.map(function (t) {
                return '<option value="' + t.id + '">' + t.label + '</option>';
            }).join('');
            typeSel.value = (forcedType === 'video' || forcedType === 'bundle') ? forcedType : 'image';
        }

        function currentType() {
            return (typeSel && typeSel.value) || 'image';
        }

        function syncTypeUI() {
            var t = currentType();
            qsa('#daTypeCards .da-type-card', form).forEach(function (card) {
                var on = card.getAttribute('data-type') === t;
                card.classList.toggle('is-active', on);
                card.setAttribute('aria-checked', on ? 'true' : 'false');
            });
            var imageField = qs('#daImageField');
            var videoField = qs('#daVideoField');
            if (imageField) imageField.hidden = t === 'video';
            if (videoField) videoField.hidden = t === 'image';
        }

        qsa('#daTypeCards .da-type-card', form).forEach(function (card) {
            card.addEventListener('click', function () {
                if (typeSel) typeSel.value = card.getAttribute('data-type') || 'image';
                syncTypeUI();
            });
        });

        var backBtn = qs('#daBackShowcase');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                location.href = fromShowcase
                    ? 'creator-showcase.html?owner=1&tab=digital'
                    : 'digital-asset-store.html?mine=1';
            });
        }

        function afterSaveRedirect(p, submitted) {
            if (fromShowcase) {
                location.href = 'creator-showcase.html?owner=1&tab=digital' +
                    (p && p.id ? '&open=' + encodeURIComponent(p.id) : '');
                return;
            }
            if (submitted) {
                location.href = 'digital-asset-store.html?mine=1';
                return;
            }
            location.href = 'digital-asset-detail.html?id=' + encodeURIComponent(p.id);
        }

        function collect() {
            var mode = qs('#daSupplyMode').value;
            var t = currentType();
            var cover = heroUrl || (qs('#daCover') && qs('#daCover').value.trim()) || '';
            var images = t === 'video' ? [] : workImages.slice();
            if (cover && images.indexOf(cover) < 0 && !Store.isVideoUrl(cover)) images.unshift(cover);
            var videos = t === 'image' ? [] : workVideos.slice();
            var files = images.map(function (url) { return { kind: 'image', url: url }; })
                .concat(videos.map(function (url) { return { kind: 'video', url: url }; }));
            return {
                title: qs('#daTitle').value.trim(),
                description: qs('#daDesc').value.trim(),
                coverUrl: cover || (images[0] || ''),
                assetType: currentType(),
                contentFiles: files,
                priceUsdt: parseFloat(qs('#daPrice').value) || 0,
                supplyMode: mode,
                supplyTotal: mode === 'limited' ? (parseInt(qs('#daSupplyTotal').value, 10) || 100) : 0,
                autoList: !(qs('#daListState') && qs('#daListState').value === 'manual'),
                soldCount: 0
            };
        }

        function validate(data) {
            if (!data.assetType || !Store.ASSET_TYPES.filter(function (t) { return t.id === data.assetType; }).length) {
                return '请选择商品类型';
            }
            if (!data.title) return '请填写作品名称';
            if (!data.description) return '请填写作品描述';
            if (!heroUrl && !(qs('#daCover') && qs('#daCover').value.trim())) return '请设置商品首图';
            var counts = Store.mediaCounts(data);
            if (data.assetType === 'image' && counts.images < 1) return '图片合集请至少上传 1 张写真（或首图）';
            if (data.assetType === 'video' && counts.videos < 1) return '视频作品请至少添加 1 个视频';
            if (data.assetType === 'bundle' && (counts.images < 1 || counts.videos < 1)) return '图视作品包需要至少 1 张图片和 1 个视频';
            if (data.priceUsdt <= 0) return '请设置有效价格';
            if (data.supplyMode === 'limited' && data.supplyTotal < 1) return '商品个数至少为 1 份';
            var agree = qs('#daAgree');
            if (agree && !agree.checked) return '请先确认版权与审核规范';
            return null;
        }

        function syncSupplyUI() {
            var mode = (qs('#daSupplyMode') && qs('#daSupplyMode').value) || 'limited';
            qsa('#daSupplyCards .da-type-card', form).forEach(function (card) {
                var on = card.getAttribute('data-supply') === mode;
                card.classList.toggle('is-active', on);
                card.setAttribute('aria-checked', on ? 'true' : 'false');
            });
            var wrap = qs('#daSupplyTotalWrap');
            if (wrap) wrap.hidden = mode !== 'limited';
        }

        function syncListUI() {
            var v = (qs('#daListState') && qs('#daListState').value) || 'auto';
            qsa('#daListCards .da-type-card', form).forEach(function (card) {
                var on = card.getAttribute('data-list') === v;
                card.classList.toggle('is-active', on);
                card.setAttribute('aria-checked', on ? 'true' : 'false');
            });
        }

        qsa('#daSupplyCards .da-type-card', form).forEach(function (card) {
            card.addEventListener('click', function () {
                if (qs('#daSupplyMode')) qs('#daSupplyMode').value = card.getAttribute('data-supply') || 'limited';
                syncSupplyUI();
            });
        });
        qsa('#daListCards .da-type-card', form).forEach(function (card) {
            card.addEventListener('click', function () {
                if (qs('#daListState')) qs('#daListState').value = card.getAttribute('data-list') || 'auto';
                syncListUI();
            });
        });

        var coverInput = qs('#daCover');
        if (coverInput) {
            coverInput.addEventListener('input', function () {
                setHero(coverInput.value.trim(), 'url', true);
            });
        }
        var coverFile = qs('#daCoverFile');
        var btnCoverUpload = qs('#btnDaCoverUpload');
        if (btnCoverUpload && coverFile) {
            btnCoverUpload.addEventListener('click', function () { coverFile.click(); });
            coverFile.addEventListener('change', function () {
                var file = coverFile.files && coverFile.files[0];
                coverFile.value = '';
                if (!file) return;
                readImageFile(file, function (dataUrl) {
                    setHero(dataUrl, 'upload');
                    toast('首图已上传');
                });
            });
        }
        var btnCoverClear = qs('#btnDaCoverClear');
        if (btnCoverClear) {
            btnCoverClear.addEventListener('click', function () { setHero('', ''); });
        }

        var imageFiles = qs('#daImageFiles');
        var btnImageUpload = qs('#btnDaImageUpload');
        if (btnImageUpload && imageFiles) {
            btnImageUpload.addEventListener('click', function () { imageFiles.click(); });
            imageFiles.addEventListener('change', function () {
                var files = Array.prototype.slice.call(imageFiles.files || []);
                imageFiles.value = '';
                files.forEach(function (file) {
                    readImageFile(file, function (dataUrl) {
                        workImages.push(dataUrl);
                        renderWorkGrid('image');
                    });
                });
            });
        }
        var imageUrlInp = qs('#daImageUrl');
        if (imageUrlInp) {
            imageUrlInp.addEventListener('keydown', function (e) {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                var v = imageUrlInp.value.trim();
                if (!v) return;
                workImages.push(v);
                imageUrlInp.value = '';
                renderWorkGrid('image');
            });
        }
        var videoUrlInp = qs('#daVideoUrl');
        function addVideoFromInput() {
            var v = videoUrlInp && videoUrlInp.value.trim();
            if (!v) return toast('请粘贴视频 URL', true);
            workVideos.push(v);
            videoUrlInp.value = '';
            renderWorkGrid('video');
        }
        var btnVideoAdd = qs('#btnDaVideoAdd');
        if (btnVideoAdd) btnVideoAdd.addEventListener('click', addVideoFromInput);
        if (videoUrlInp) {
            videoUrlInp.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); addVideoFromInput(); }
            });
        }

        refreshHeroUI();
        renderWorkGrid('image');
        renderWorkGrid('video');
        syncTypeUI();
        syncSupplyUI();
        syncListUI();

        qs('#btnDaSubmit').addEventListener('click', function () {
            var data = collect();
            var err = validate(data);
            if (err) return toast(err, true);
            var p = Store.create(Object.assign(data, { status: 'pending_review' }));
            toast('已提交审核，请在橱窗查看进度');
            setTimeout(function () { afterSaveRedirect(p, true); }, 700);
        });
    }
    function entitlementPills(order, Orders, hideRefund) {
        if (hideRefund) {
            if (order && order.status === 'refunded') {
                return '<span class="da-pill bad">已退款</span>';
            }
            return '<span class="da-pill ok">已获得</span>';
        }
        if (!order) return '<span class="da-pill off">已获得</span>';
        if (order.status === 'refunded') {
            return '<span class="da-pill bad">已退款</span><span class="da-pill off">' + esc(order.refundedAt || '') + '</span>';
        }
        var check = Orders.getRefundEligibility(order.id, order.buyerId);
        if (check.ok) {
            return '<span class="da-pill ok">已获得</span><span class="da-pill warn">7日内可退 · 剩' + check.daysLeft + '天</span>';
        }
        if (check.expired) {
            return '<span class="da-pill ok">已获得</span><span class="da-pill off">售后期已过</span>';
        }
        return '<span class="da-pill ok">已获得</span><span class="da-pill off">' + esc(order.createdAt || '') + '</span>';
    }

    function entitlementBadgeWeb(order, Orders, hideRefund) {
        if (hideRefund) {
            if (order && order.status === 'refunded') return '<span class="da-ent-badge bad">已退款</span>';
            return '<span class="da-ent-badge ok">已获得</span>';
        }
        if (!order) return '<span class="da-ent-badge muted">已获得</span>';
        if (order.status === 'refunded') return '<span class="da-ent-badge bad">已退款</span>';
        var check = Orders.getRefundEligibility(order.id, order.buyerId);
        if (check.ok) return '<span class="da-ent-badge refund">7 日内可退 · 剩余 ' + check.daysLeft + ' 天</span>';
        if (check.expired) return '<span class="da-ent-badge muted">售后期已过（购买超 7 天）</span>';
        return '<span class="da-ent-badge ok">已获得</span>';
    }

    function ownedViewHref(productId, layout, opts) {
        opts = opts || {};
        var from = opts.viewFrom || 'my';
        if (layout === 'h5') {
            return 'digital-owned-view.html?id=' + encodeURIComponent(productId) + '&from=' + encodeURIComponent(from);
        }
        return 'digital-asset-owned-view.html?id=' + encodeURIComponent(productId) + '&from=' + encodeURIComponent(from);
    }

    function refundActionHtml(order, Orders, layout) {
        if (!order || order.status === 'refunded') return '';
        var check = Orders.getRefundEligibility(order.id, order.buyerId);
        if (!check.ok) return '';
        if (layout === 'h5') {
            return '<button type="button" class="mini ghost" data-da-refund="' + esc(order.id) + '">申请退款</button>';
        }
        return '<button type="button" class="btn btn-secondary btn-sm" data-da-refund="' + esc(order.id) + '">申请退款</button>';
    }

    function bindAfterSalesActions(root, layout, reloadOpts) {
        qsa('[data-da-refund]', root).forEach(function (btn) {
            btn.addEventListener('click', function () {
                var oid = btn.getAttribute('data-da-refund');
                if (!oid) return;
                if (layout === 'h5') {
                    location.href = 'digital-after-sales.html?orderId=' + encodeURIComponent(oid);
                    return;
                }
                if (global.DigitalAssetAfterSales && global.DigitalAssetAfterSales.open) {
                    global.DigitalAssetAfterSales.open({
                        orderId: oid,
                        onDone: function () { initMyAssetsPage(reloadOpts); }
                    });
                }
            });
        });
    }

    function initMyAssetsPage(opts) {
        opts = opts || {};
        var Orders = global.DigitalAssetOrdersStore;
        var Store = global.DigitalAssetsStore;
        var rootSel = opts.root || '#daMyAssets';
        var root = typeof rootSel === 'string' ? qs(rootSel) : rootSel;
        var layout = opts.layout || 'web';
        if (!root || !Orders) return;
        var list = Orders.listEntitlements();
        var storeHref = layout === 'h5' ? 'digital-store.html' : 'digital-asset-store.html';
        var hideRefund = !!opts.hideRefund;
        if (!list.length) {
            root.innerHTML = '<div class="da-empty">还没有已购作品 · <a href="' + storeHref + '" style="color:#C084FC">去逛逛</a></div>';
            return;
        }
        if (layout === 'h5') {
            root.innerHTML = list.map(function (e) {
                var order = Orders.getOrderById(e.orderId);
                return (
                    '<div class="da-manage-card">' +
                    '<img src="' + esc(e.coverUrl) + '" alt="">' +
                    '<div class="main">' +
                    '<div class="t">' + esc(e.productTitle) + '</div>' +
                    '<div class="id">' + esc(Store ? Store.typeLabel(e.assetType) : e.assetType) +
                    ' · ' + esc(e.creatorName) + '</div>' +
                    '<div class="row">' + entitlementPills(order, Orders, hideRefund) + '</div>' +
                    '<div class="da-btns">' +
                    '<button type="button" class="mini pri" onclick="location.href=\'' +
                    ownedViewHref(e.productId, 'h5', opts) + '\'">查看</button>' +
                    (hideRefund ? '' : refundActionHtml(order, Orders, 'h5')) +
                    '</div></div></div>'
                );
            }).join('');
            if (!hideRefund) bindAfterSalesActions(root, 'h5', opts);
            return;
        }
        root.innerHTML = '<div class="da-ent-list">' + list.map(function (e) {
            var order = Orders.getOrderById(e.orderId);
            var viewHref = ownedViewHref(e.productId, 'web', opts);
            return (
                '<div class="da-ent-item">' +
                '<img src="' + esc(e.coverUrl) + '" alt="">' +
                '<div class="info"><h3>' + esc(e.productTitle) + '</h3>' +
                '<div class="sub">' + esc(Store ? Store.typeLabel(e.assetType) : e.assetType) +
                ' · ' + esc(e.creatorName) + ' · 获得于 ' + esc(e.grantedAt) + '</div>' +
                entitlementBadgeWeb(order, Orders, hideRefund) + '</div>' +
                '<div class="da-ent-actions">' +
                '<a class="btn btn-secondary btn-sm" href="' + esc(viewHref) + '">查看</a>' +
                (hideRefund ? '' : refundActionHtml(order, Orders, 'web')) +
                '</div></div>'
            );
        }).join('') + '</div>';
        if (!hideRefund) bindAfterSalesActions(root, 'web', opts);
    }

    function ownedBackHref(from, layout) {
        if (from === 'profile') return layout === 'h5' ? 'profile.html' : 'profile.html';
        return layout === 'h5' ? 'my-digital-assets.html' : 'my-digital-assets.html';
    }

    function renderOwnedMediaHtml(p, Store) {
        var items = Store.mediaItems(p);
        var images = items.filter(function (x) { return x.kind === 'image'; });
        var videos = items.filter(function (x) { return x.kind === 'video'; });
        if (!items.length && p.coverUrl) {
            images = [{ kind: 'image', url: p.coverUrl }];
        }
        var html = '';
        var showImages = p.assetType === 'image' || p.assetType === 'bundle' || (images.length && !videos.length);
        var showVideos = p.assetType === 'video' || p.assetType === 'bundle' || videos.length;

        if (showImages && images.length) {
            var imgTitle = p.assetType === 'bundle' ? '图片合集' : '浏览图片';
            html += '<div class="da-owned-section"><h3>' + esc(imgTitle) + '</h3></div>' +
                '<div class="da-owned-grid">' +
                images.map(function (it) {
                    return '<a class="da-owned-tile" href="' + esc(it.url) + '" target="_blank" rel="noopener">' +
                        '<img src="' + esc(it.url) + '" alt=""></a>';
                }).join('') +
                '</div>';
        }
        if (showVideos && videos.length) {
            html += '<div class="da-owned-section"><h3>' + (p.assetType === 'bundle' ? '视频' : '播放视频') + '</h3></div>' +
                '<div class="da-owned-videos">' +
                videos.map(function (it, i) {
                    var poster = p.coverUrl && i === 0 ? ' poster="' + esc(p.coverUrl) + '"' : '';
                    return '<video controls playsinline preload="metadata"' + poster + ' src="' + esc(it.url) + '"></video>';
                }).join('') +
                '</div>';
        }
        if (!html) {
            html = '<div class="da-empty">暂无可浏览的素材</div>';
        }
        return html;
    }

    function initOwnedViewPage(opts) {
        opts = opts || {};
        var layout = opts.layout || (document.body && document.body.getAttribute('data-da-layout')) || 'web';
        var id = param('id');
        var from = param('from') || 'my';
        var root = qs(opts.root || '#daOwnedViewRoot');
        var back = qs(opts.back || '#daOwnedBack');
        var Store = global.DigitalAssetsStore;
        var Orders = global.DigitalAssetOrdersStore;
        if (back) back.setAttribute('href', ownedBackHref(from, layout));
        if (!root) return;
        if (!id || !Store || !Orders) {
            root.innerHTML = '<div class="da-empty">无效链接</div>';
            return;
        }
        if (!Orders.hasEntitlement(id)) {
            var storeHref = layout === 'h5' ? 'digital-store.html' : 'digital-asset-store.html';
            root.innerHTML = '<div class="da-empty">未找到购买权益 · <a href="' + storeHref + '" style="color:#C084FC">去 Store</a></div>';
            return;
        }
        var p = Store.getById(id);
        if (!p) {
            root.innerHTML = '<div class="da-empty">商品不存在或已删除</div>';
            return;
        }
        var ent = Orders.listEntitlements().filter(function (e) { return e.productId === id; })[0];
        var summary = Store.mediaSummary(p);
        root.innerHTML =
            '<div class="da-owned-head">' +
            '<div class="da-owned-kicker">' +
            '<span class="da-chip">已解锁</span>' +
            '<span class="da-chip">' + esc(Store.typeLabel(p.assetType)) + '</span>' +
            '</div>' +
            '<h1 class="da-owned-title">' + esc(p.title) + '</h1>' +
            '<p class="da-owned-meta">' + esc(p.creatorName || '') + ' · ' + esc(summary) +
            (ent && ent.grantedAt ? ' · 获得于 ' + esc(ent.grantedAt) : '') + '</p>' +
            (p.description ? '<p class="da-owned-desc">' + esc(p.description) + '</p>' : '') +
            '</div>' +
            renderOwnedMediaHtml(p, Store);
        if (layout === 'web') {
            document.title = (p.title || '已购作品') + ' · GOODFANS';
        }
    }

    function initCreatorManageList(container) {
        var Store = global.DigitalAssetsStore;
        if (!container || !Store) return;
        var list = Store.list({ creatorId: Store.DEMO_CREATOR });
        if (!list.length) {
            container.innerHTML = '<div class="da-empty">尚未创建数字商品</div>';
            return;
        }
        container.innerHTML = '<div class="da-grid">' + list.map(function (p) {
            return cardHtml(p).replace('</div></article>',
                '<div class="supply" style="margin-top:8px">状态：' + esc(Store.statusLabel(p.status)) + '</div></div></article>');
        }).join('') + '</div>';
        bindCards(container);
    }

    global.DigitalAssetPages = {
        toast: toast,
        renderStoreGrid: renderStoreGrid,
        initDetailPage: initDetailPage,
        initCreatePage: initCreatePage,
        initMyAssetsPage: initMyAssetsPage,
        initOwnedViewPage: initOwnedViewPage,
        ownedViewHref: ownedViewHref,
        initCreatorManageList: initCreatorManageList,
        cardHtml: cardHtml,
        bindCards: bindCards
    };
})(typeof window !== 'undefined' ? window : this);
