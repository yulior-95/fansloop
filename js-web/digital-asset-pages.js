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
            target = 'my-digital-assets.html?open=' + encodeURIComponent(id);
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
        var isWizard = !!qs('#daSteps');
        var step = 1;
        var totalSteps = 4;

        /* 商品首图：列表卡片与详情首屏主图 */
        var HERO_MAX_EDGE = 720;
        var HERO_MAX_LEN = 220000; // 压缩后的 dataURL 上限，避免 localStorage 写入失败
        var heroUrl = '';
        var heroSource = '';

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
                else if (heroSource === 'upload') state.textContent = '已上传本地图片（原型压缩后存本地，约 ' + Math.round(heroUrl.length / 1024) + ' KB）';
                else state.textContent = '已使用图片 URL 作为首图';
            }
        }

        function setHero(url, source, fromInput) {
            heroUrl = url || '';
            heroSource = heroUrl ? (source || 'url') : '';
            var input = qs('#daCover');
            if (input && !fromInput) {
                input.value = heroSource === 'upload' ? '' : heroUrl;
            }
            refreshHeroUI();
        }

        function readHeroFile(file, cb) {
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
                    var q = 0.72;
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

        var typeSel = qs('#daAssetType');
        if (typeSel) {
            typeSel.innerHTML = Store.ASSET_TYPES.map(function (t) {
                return '<option value="' + t.id + '">' + t.label + '</option>';
            }).join('');
            typeSel.value = (forcedType === 'video' || forcedType === 'image') ? forcedType : 'image';
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
            var vidWrap = qs('#daVideoFileWrap');
            if (vidWrap) vidWrap.hidden = t !== 'video';
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
            var cover = heroUrl || qs('#daCover').value.trim();
            var assetType = currentType();
            var files = assetType === 'video'
                ? [(qs('#daVideoUrl') && qs('#daVideoUrl').value.trim()) || '']
                : (cover ? [cover] : []);
            files = files.filter(Boolean);
            return {
                title: qs('#daTitle').value.trim(),
                description: qs('#daDesc').value.trim(),
                coverUrl: cover || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
                assetType: assetType,
                contentFiles: files,
                priceUsdt: parseFloat(qs('#daPrice').value) || 0,
                supplyMode: mode,
                supplyTotal: mode === 'limited' ? (parseInt(qs('#daSupplyTotal').value, 10) || 100) : 0,
                autoList: !(qs('#daListState') && qs('#daListState').value === 'manual'),
                soldCount: 0
            };
        }

        function validateStep(n, data) {
            if (n === 1) {
                if (!data.assetType || (data.assetType !== 'image' && data.assetType !== 'video')) return '请选择商品类型';
                if (!data.title) return '请填写作品名称';
                if (!data.description) return '请填写作品描述';
                return null;
            }
            if (n === 2) {
                if (!heroUrl) return '请设置商品首图（上传图片或填写图片 URL）';
                if (data.assetType === 'video' && !(qs('#daVideoUrl') && qs('#daVideoUrl').value.trim())) {
                    return '请填写视频 URL';
                }
                return null;
            }
            if (n === 3) {
                if (data.priceUsdt <= 0) return '请设置有效价格';
                if (data.supplyMode === 'limited' && data.supplyTotal < 1) return '商品个数至少为 1 份';
                return null;
            }
            if (n === 4) {
                var agree = qs('#daAgree');
                if (agree && !agree.checked) return '请先确认版权与审核规范';
                return null;
            }
            return null;
        }

        function renderConfirm(data) {
            var card = qs('#daConfirmCard');
            if (!card) return;
            var supply = data.supplyMode === 'limited'
                ? ('限量 ' + data.supplyTotal + ' 份')
                : '不限个数';
            var listState = data.autoList
                ? '审核通过后上架'
                : '审核通过后保持下架（橱窗可手动上架）';
            var mediaLabel = data.assetType === 'video'
                ? '首图 + 视频 1 个'
                : '首图 1 张';
            var heroLabel = heroSource === 'upload' ? '本地上传图片' : (heroUrl ? '图片 URL' : '未设置（将使用默认占位图）');
            card.innerHTML =
                '<div class="da-confirm-cover"><img src="' + esc(data.coverUrl) + '" alt=""><span class="tag">首图</span></div>' +
                '<div class="da-confirm-body">' +
                '<div class="k">类型</div><div class="v">' + esc(Store.typeLabel(data.assetType)) + '</div>' +
                '<div class="k">首图</div><div class="v">' + esc(heroLabel) + '</div>' +
                '<div class="k">名称</div><div class="v">' + esc(data.title) + '</div>' +
                '<div class="k">描述</div><div class="v">' + esc(data.description) + '</div>' +
                '<div class="k">价格</div><div class="v">' + Number(data.priceUsdt).toFixed(2) + ' USDT</div>' +
                '<div class="k">个数</div><div class="v">' + esc(supply) + '</div>' +
                '<div class="k">上架</div><div class="v">' + esc(listState) + '</div>' +
                '<div class="k">素材</div><div class="v">' + esc(mediaLabel) + '</div>' +
                '<div class="k">交付</div><div class="v">' +
                (data.assetType === 'video' ? '购买后可播放 / 下载视频' : '购买后可浏览 / 下载图片') +
                '</div></div>';
        }

        function setStep(n) {
            step = Math.max(1, Math.min(totalSteps, n));
            qsa('.da-step', qs('#daSteps')).forEach(function (el) {
                var s = parseInt(el.getAttribute('data-step'), 10);
                el.classList.toggle('is-active', s === step);
                el.classList.toggle('is-done', s < step);
            });
            qsa('.da-step-panel', form).forEach(function (panel) {
                var s = parseInt(panel.getAttribute('data-panel'), 10);
                var on = s === step;
                panel.hidden = !on;
                panel.classList.toggle('is-active', on);
            });
            var prev = qs('#btnDaPrev');
            var next = qs('#btnDaNext');
            var submit = qs('#btnDaSubmit');
            if (prev) prev.hidden = step <= 1;
            if (next) next.hidden = step >= totalSteps;
            if (submit) submit.hidden = step < totalSteps;
            if (step === totalSteps) renderConfirm(collect());
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
                readHeroFile(file, function (dataUrl) {
                    setHero(dataUrl, 'upload');
                    toast('首图已上传');
                });
            });
        }
        var btnCoverClear = qs('#btnDaCoverClear');
        if (btnCoverClear) {
            btnCoverClear.addEventListener('click', function () { setHero('', ''); });
        }
        refreshHeroUI();

        syncTypeUI();
        syncSupplyUI();
        syncListUI();

        if (isWizard) {
            setStep(1);
            var btnPrev = qs('#btnDaPrev');
            var btnNext = qs('#btnDaNext');
            if (btnPrev) {
                btnPrev.addEventListener('click', function () { setStep(step - 1); });
            }
            if (btnNext) {
                btnNext.addEventListener('click', function () {
                    var data = collect();
                    var err = validateStep(step, data);
                    if (err) return toast(err, true);
                    setStep(step + 1);
                });
            }
        } else {
            var submitOnly = qs('#btnDaSubmit');
            if (submitOnly) submitOnly.hidden = false;
            if (qs('#btnDaNext')) qs('#btnDaNext').hidden = true;
            if (qs('#btnDaPrev')) qs('#btnDaPrev').hidden = true;
        }

        qs('#btnDaSaveDraft').addEventListener('click', function () {
            var data = collect();
            var e1 = validateStep(1, data);
            if (e1) return toast(e1, true);
            var p = Store.create(Object.assign(data, { status: 'draft' }));
            toast('草稿已保存');
            setTimeout(function () { afterSaveRedirect(p, false); }, 700);
        });

        qs('#btnDaSubmit').addEventListener('click', function () {
            var data = collect();
            var err = validateStep(1, data) || validateStep(2, data) || validateStep(3, data) || validateStep(4, data);
            if (err) return toast(err, true);
            var p = Store.create(Object.assign(data, { status: 'pending_review' }));
            toast('已提交审核，请在橱窗查看进度');
            setTimeout(function () { afterSaveRedirect(p, true); }, 700);
        });
    }

    function initMyAssetsPage() {
        var Orders = global.DigitalAssetOrdersStore;
        var Store = global.DigitalAssetsStore;
        var root = qs('#daMyAssets');
        if (!root || !Orders) return;
        var list = Orders.listEntitlements();
        if (!list.length) {
            root.innerHTML = '<div class="da-empty">还没有已购作品 · <a href="digital-asset-store.html" style="color:#C084FC">去 Creator Store 逛逛</a></div>';
            return;
        }
        root.innerHTML = '<div class="da-ent-list">' + list.map(function (e) {
            return (
                '<div class="da-ent-item">' +
                '<img src="' + esc(e.coverUrl) + '" alt="">' +
                '<div class="info"><h3>' + esc(e.productTitle) + '</h3>' +
                '<div class="sub">' + esc(Store ? Store.typeLabel(e.assetType) : e.assetType) +
                ' · ' + esc(e.creatorName) + ' · 获得于 ' + esc(e.grantedAt) + '</div></div>' +
                '<a class="btn btn-secondary btn-sm" href="digital-asset-detail.html?id=' + encodeURIComponent(e.productId) + '">查看</a>' +
                '</div>'
            );
        }).join('') + '</div>';
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
        initCreatorManageList: initCreatorManageList,
        cardHtml: cardHtml,
        bindCards: bindCards
    };
})(typeof window !== 'undefined' ? window : this);
