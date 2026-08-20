/**
 * 运营后台 · 双商城页面逻辑
 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    if (window.AdminModal && window.AdminModal.toast) return window.AdminModal.toast(msg);
    alert(msg);
  }

  function qtyCells(p) {
    if (!p || p.supplyMode !== 'limited') {
      return '<td>不限</td><td>' + (p.soldCount || 0) + '</td><td>—</td>';
    }
    var left = window.DigitalAssetsStore.remaining(p);
    return '<td>' + (p.supplyTotal || 0) + '</td><td>' + (p.soldCount || 0) + '</td><td>' + left + '</td>';
  }

  function mediaGalleryHtml(p) {
    var Store = window.DigitalAssetsStore;
    var items = Store.mediaItems ? Store.mediaItems(p) : [];
    if (!items.length) {
      return '<div class="ant-empty-description" style="padding:12px 0;color:rgba(0,0,0,.45)">暂无写真 / 视频素材</div>';
    }
    return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">' +
      items.map(function (it) {
        if (it.kind === 'video') {
          return '<div style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;background:#000">' +
            '<video src="' + esc(it.url) + '" controls playsinline style="width:100%;height:140px;object-fit:contain;display:block"></video>' +
            '<div style="padding:6px 8px;font-size:12px;color:rgba(0,0,0,.45);background:#fff">视频</div></div>';
        }
        return '<div style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden">' +
          '<img src="' + esc(it.url) + '" alt="" style="width:100%;height:140px;object-fit:cover;display:block">' +
          '<div style="padding:6px 8px;font-size:12px;color:rgba(0,0,0,.45)">写真</div></div>';
      }).join('') + '</div>';
  }

  function productDetailBody(p) {
    var Store = window.DigitalAssetsStore;
    return '<div style="margin-bottom:12px;font-size:13px;color:rgba(0,0,0,.65)">' +
      '<div><span style="color:rgba(0,0,0,.45)">商品 ID</span> <code>' + esc(p.id) + '</code></div>' +
      '<div style="margin-top:4px">' + esc(Store.typeLabel(p.assetType)) + ' · ' + esc(Store.mediaSummary(p)) +
      ' · ' + Number(p.priceUsdt).toFixed(2) + ' USDT</div>' +
      (p.description ? '<p style="margin:8px 0 0">' + esc(p.description) + '</p>' : '') +
      '</div>' +
      '<div style="margin-bottom:8px;font-weight:600">全部素材</div>' +
      mediaGalleryHtml(p);
  }

  function matchProductQuery(p, q) {
    if (!q) return true;
    var blob = ((p.id || '') + ' ' + (p.title || '') + ' ' + (p.creatorName || '')).toLowerCase();
    return blob.indexOf(q) >= 0;
  }

    function initDigitalReview() {
    var Store = window.DigitalAssetsStore;
    var body = document.getElementById('mallReviewBody');
    var qEl = document.getElementById('mallReviewQ');
    if (!Store || !body) return;

    function openReview(p) {
      if (!window.AdminModal) return;
      window.AdminModal.open({
        title: '审核 · ' + p.title,
        width: 760,
        body: productDetailBody(p),
        footer: [
          { text: '取消', onClick: function () { window.AdminModal.close(); } },
          {
            text: '驳回',
            danger: true,
            onClick: function () {
              window.AdminModal.close();
              openReject(p.id);
            }
          },
          {
            text: '通过',
            primary: true,
            onClick: function () {
              var updated = Store.approve(p.id);
              window.AdminModal.close();
              toast(updated && updated.status === 'delisted'
                ? '已通过审核，按创作者设置保持下架'
                : '已通过并上架');
              render();
            }
          }
        ]
      });
    }

    function openReject(id) {
      var p = Store.getById(id);
      if (!p || !window.AdminModal) return;
      window.AdminModal.open({
        title: '驳回数字商品',
        width: 520,
        body:
          '<p style="margin:0 0 12px;color:rgba(0,0,0,.65);font-size:13px">驳回「<strong>' + esc(p.title) + '</strong>」后，创作者端将展示驳回原因。</p>' +
          '<div class="ant-form-item" style="margin:0">' +
          '<label style="display:block;margin-bottom:6px;font-size:12px;color:rgba(0,0,0,.45)">驳回原因 <span style="color:#ff4d4f">*</span></label>' +
          '<textarea class="ant-input" id="mallRejectReason" rows="4" maxlength="200" placeholder="请填写驳回原因（必填）" style="width:100%;resize:vertical"></textarea>' +
          '<div id="mallRejectReasonErr" style="margin-top:6px;font-size:12px;color:#ff4d4f;min-height:18px"></div>' +
          '</div>',
        footer: [
          { text: '取消', onClick: function () { window.AdminModal.close(); } },
          {
            text: '确认驳回',
            danger: true,
            primary: true,
            onClick: function () {
              var ta = document.getElementById('mallRejectReason');
              var err = document.getElementById('mallRejectReasonErr');
              var reason = ta ? String(ta.value || '').trim() : '';
              if (!reason) {
                if (err) err.textContent = '请填写驳回原因';
                if (ta) ta.focus();
                return;
              }
              Store.reject(id, reason);
              window.AdminModal.close();
              toast('已驳回，创作者端可见原因');
              render();
            }
          }
        ],
        onMount: function (root) {
          var ta = root.querySelector('#mallRejectReason');
          if (ta) setTimeout(function () { ta.focus(); }, 0);
        }
      });
    }

    function render() {
      var q = (qEl && qEl.value || '').trim().toLowerCase();
      var list = Store.list({ status: 'pending_review' }).filter(function (p) { return matchProductQuery(p, q); });
      if (!list.length) {
        body.innerHTML = '<tr><td colspan="12" style="text-align:center;color:rgba(0,0,0,.45);padding:28px">暂无待审核数字商品</td></tr>';
        return;
      }
      body.innerHTML = list.map(function (p, i) {
        return '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td><code style="font-size:12px">' + esc(p.id) + '</code></td>' +
          '<td><img src="' + esc(p.coverUrl) + '" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:6px"></td>' +
          '<td><strong>' + esc(p.title) + '</strong><div style="font-size:12px;color:rgba(0,0,0,.45)">' +
          esc(Store.typeLabel(p.assetType)) + ' · ' + esc(Store.mediaSummary(p)) + '</div></td>' +
          '<td>' + esc(p.creatorName) + '</td>' +
          '<td>' + Number(p.priceUsdt).toFixed(2) + '</td>' +
          qtyCells(p) +
          '<td>' + (p.autoList === false
            ? '<span class="ant-tag">下架</span>'
            : '<span class="ant-tag ant-tag-green">上架</span>') + '</td>' +
          '<td>' + esc(p.createdAt) + '</td>' +
          '<td><button type="button" class="ant-btn ant-btn-primary ant-btn-sm js-review" data-id="' + esc(p.id) + '">审核</button></td></tr>';
      }).join('');

      body.querySelectorAll('.js-review').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var p = Store.getById(btn.getAttribute('data-id'));
          if (p) openReview(p);
        });
      });
    }
    if (qEl) qEl.addEventListener('input', render);
    render();
  }

  function initDigitalProducts() {
    var Store = window.DigitalAssetsStore;
    var body = document.getElementById('mallProductsBody');
    var filter = document.getElementById('mallProductStatus');
    var qEl = document.getElementById('mallProductQ');
    if (!Store || !body) return;

    function statusOps(p) {
      var html = '<button type="button" class="ant-btn ant-btn-sm js-detail" data-id="' + esc(p.id) + '">详情</button> ';
      var shelf = Store.shelfStatus(p);
      if (shelf === 'listed') {
        html += '<button type="button" class="ant-btn ant-btn-sm js-delist" data-id="' + esc(p.id) + '">下架</button> ';
        html += '<button type="button" class="ant-btn ant-btn-dangerous ant-btn-sm js-force-delist" data-id="' + esc(p.id) + '">强制下架</button>';
      } else if (shelf === 'delisted') {
        html += '<button type="button" class="ant-btn ant-btn-primary ant-btn-sm js-force-relist" data-id="' + esc(p.id) + '">强制上架</button>';
      }
      return html;
    }

    function openDetail(p) {
      if (!window.AdminModal) return;
      window.AdminModal.open({
        title: '商品详情 · ' + p.title,
        width: 760,
        body: productDetailBody(p),
        footer: [{ text: '关闭', primary: true, onClick: function () { window.AdminModal.close(); } }]
      });
    }

    function render() {
      var status = filter && filter.value ? filter.value : '';
      var q = (qEl && qEl.value || '').trim().toLowerCase();
      var list = Store.list().filter(function (p) {
        var shelf = Store.shelfStatus(p);
        if (shelf !== 'listed' && shelf !== 'delisted') return false;
        if (status && shelf !== status) return false;
        return matchProductQuery(p, q);
      });
      body.innerHTML = list.map(function (p, i) {
        var shelf = Store.shelfStatus(p);
        return '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td><code style="font-size:12px">' + esc(p.id) + '</code></td>' +
          '<td>' + esc(p.title) + '</td>' +
          '<td>' + esc(p.creatorName) + '</td>' +
          '<td>' + esc(Store.typeLabel(p.assetType)) + '</td>' +
          '<td>' + Number(p.priceUsdt).toFixed(2) + '</td>' +
          qtyCells(p) +
          '<td><span class="ant-tag' + (shelf === 'listed' ? ' ant-tag-green' : '') + '">' +
          esc(Store.shelfLabel(p)) + '</span></td>' +
          '<td>' + statusOps(p) + '</td></tr>';
      }).join('') || '<tr><td colspan="11" style="text-align:center;padding:24px;color:rgba(0,0,0,.45)">暂无数据</td></tr>';

      body.querySelectorAll('.js-detail').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var p = Store.getById(btn.getAttribute('data-id'));
          if (p) openDetail(p);
        });
      });
      body.querySelectorAll('.js-delist').forEach(function (btn) {
        btn.addEventListener('click', function () {
          Store.delist(btn.getAttribute('data-id'));
          toast('已下架（创作者仍可自行上架）');
          render();
        });
      });
      body.querySelectorAll('.js-force-delist').forEach(function (btn) {
        btn.addEventListener('click', function () {
          Store.delist(btn.getAttribute('data-id'), { force: true });
          toast('已强制下架，创作者不可自行上架');
          render();
        });
      });
      body.querySelectorAll('.js-force-relist').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var updated = Store.relist(btn.getAttribute('data-id'), { adminForce: true });
          if (!updated) return toast('上架失败');
          toast('已强制上架');
          render();
        });
      });
    }
    if (filter) filter.addEventListener('change', render);
    if (qEl) qEl.addEventListener('input', render);
    render();
  }

  function initDigitalOrders() {
    var Orders = window.DigitalAssetOrdersStore;
    var body = document.getElementById('mallOrdersBody');
    var qEl = document.getElementById('mallOrderQ');
    if (!Orders || !body) return;

    function splitText(o) {
      var fee = o.feePercent != null ? Number(o.feePercent) : (o.priceUsdt ? Math.round(o.platformFee / o.priceUsdt * 100) : 10);
      var creator = 100 - fee;
      return '平台 ' + fee + '% / 创作者 ' + creator + '%';
    }

    function render() {
      var q = (qEl && qEl.value || '').trim().toLowerCase();
      var list = Orders.listOrders().filter(function (o) {
        if (!q) return true;
        var blob = ((o.id || '') + ' ' + (o.productId || '') + ' ' + (o.productTitle || '') + ' ' + (o.buyerId || '')).toLowerCase();
        return blob.indexOf(q) >= 0;
      });
      body.innerHTML = list.map(function (o, i) {
        return '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td>' + esc(o.id) + '</td>' +
          '<td><code style="font-size:12px">' + esc(o.productId) + '</code></td>' +
          '<td>' + esc(o.productTitle) + '</td>' +
          '<td>' + esc(o.creatorName) + '</td>' +
          '<td>' + esc(o.buyerId) + '</td>' +
          '<td>' + Number(o.priceUsdt).toFixed(2) + '</td>' +
          '<td>' + Number(o.platformFee).toFixed(2) + '</td>' +
          '<td>' + Number(o.creatorNet).toFixed(2) + '</td>' +
          '<td>' + esc(splitText(o)) + '</td>' +
          '<td>' + esc(o.createdAt) + '</td></tr>';
      }).join('') || '<tr><td colspan="11" style="text-align:center;padding:24px;color:rgba(0,0,0,.45)">暂无销售记录</td></tr>';
    }
    if (qEl) qEl.addEventListener('input', render);
    render();
  }

  function initCommerceConfig() {
    var Config = window.MallCommerceConfigStore;
    if (!Config) return;
    var cfg = Config.load();
    var fee = document.getElementById('cfgDigitalFee');
    var share = document.getElementById('cfgAffiliateShare');
    var meta = document.getElementById('cfgMeta');
    if (fee) fee.value = cfg.digitalPlatformFeePercent;
    if (share) share.value = cfg.affiliateCreatorSharePercent;
    if (meta) meta.textContent = '最近更新：' + cfg.updatedAt + ' · ' + cfg.updatedBy;

    function preview() {
      var f = parseInt(fee.value, 10) || 0;
      var s = parseInt(share.value, 10) || 0;
      var el1 = document.getElementById('cfgDigitalPreview');
      var el2 = document.getElementById('cfgAffiliatePreview');
      if (el1) el1.textContent = '创作者实得 ' + (100 - f) + '% · 平台抽成 ' + f + '%';
      if (el2) el2.textContent = '创作者获得联盟佣金的 ' + s + '% · 平台留存 ' + (100 - s) + '%';
    }
    if (fee) fee.addEventListener('input', preview);
    if (share) share.addEventListener('input', preview);
    preview();

    var saveBtn = document.getElementById('btnMallCfgSave');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        Config.save({
          digitalPlatformFeePercent: fee.value,
          affiliateCreatorSharePercent: share.value
        });
        cfg = Config.load();
        if (meta) meta.textContent = '最近更新：' + cfg.updatedAt + ' · ' + cfg.updatedBy;
        toast('商城分成配置已保存');
      });
    }
    var resetBtn = document.getElementById('btnMallCfgReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        cfg = Config.reset();
        if (fee) fee.value = cfg.digitalPlatformFeePercent;
        if (share) share.value = cfg.affiliateCreatorSharePercent;
        preview();
        toast('已恢复默认');
      });
    }
  }

  function initPartners() {
    var Catalog = window.AffiliateCatalogStore;
    var body = document.getElementById('mallPartnersBody');
    var qEl = document.getElementById('mallPartnerQ');
    var stEl = document.getElementById('mallPartnerStatus');
    var pagerMount = document.getElementById('mallPartnersPager');
    if (!Catalog || !body) return;

    var pager = window.AdminPager && pagerMount
      ? window.AdminPager.create({
          mount: pagerMount,
          pageSize: 10,
          onChange: function () { render(); }
        })
      : null;

    function filtered() {
      var q = (qEl && qEl.value || '').trim().toLowerCase();
      var st = stEl ? stEl.value : '';
      return Catalog.listPartners().filter(function (p) {
        if (st === '1' && !p.enabled) return false;
        if (st === '0' && p.enabled) return false;
        if (!q) return true;
        return (p.name || '').toLowerCase().indexOf(q) >= 0 ||
          (p.apiEndpoint || '').toLowerCase().indexOf(q) >= 0;
      });
    }

    function render() {
      var list = filtered();
      if (pager) pager.setTotal(list.length);
      var pageList = pager ? pager.getSlice(list) : list;
      if (!pageList.length) {
        body.innerHTML = '<tr><td colspan="6" style="text-align:center;color:rgba(0,0,0,.45);padding:28px">暂无合作方</td></tr>';
        return;
      }
      var offset = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
      body.innerHTML = pageList.map(function (p, i) {
        return '<tr>' +
          '<td>' + (offset + i + 1) + '</td>' +
          '<td><strong>' + esc(p.name) + '</strong></td>' +
          '<td class="col-endpoint">' + esc(p.apiEndpoint) + '</td>' +
          '<td>' + (p.enabled
            ? '<span class="ant-tag ant-tag-green">启用</span>'
            : '<span class="ant-tag">停用</span>') + '</td>' +
          '<td>' + esc(p.updatedAt) + '</td>' +
          '<td><button type="button" class="ant-btn ant-btn-link ant-btn-sm js-toggle" data-id="' + esc(p.id) + '">' +
          (p.enabled ? '停用' : '启用') + '</button></td></tr>';
      }).join('');
      body.querySelectorAll('.js-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var p = Catalog.getPartner(btn.getAttribute('data-id'));
          if (!p) return;
          p.enabled = !p.enabled;
          Catalog.savePartner(p);
          toast(p.enabled ? '已启用' : '已停用');
          render();
        });
      });
    }

    var qBtn = document.getElementById('btnMallPartnerQuery');
    var rBtn = document.getElementById('btnMallPartnerReset');
    if (qBtn) qBtn.addEventListener('click', function () { if (pager) pager.resetPage(); render(); });
    if (rBtn) rBtn.addEventListener('click', function () {
      if (qEl) qEl.value = '';
      if (stEl) stEl.value = '';
      if (pager) pager.resetPage();
      render();
    });
    if (qEl) qEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (pager) pager.resetPage(); render(); }
    });
    render();
  }

  function initSync() {
    var Catalog = window.AffiliateCatalogStore;
    var Aff = window.AffiliateShowcaseStore;
    var body = document.getElementById('mallSyncBody');
    var sel = document.getElementById('mallSyncPartner');
    var catEl = document.getElementById('mallSyncCategory');
    var enEl = document.getElementById('mallSyncEnabled');
    var qEl = document.getElementById('mallSyncQ');
    var pagerMount = document.getElementById('mallSyncPager');
    if (!Catalog || !body) return;

    if (sel) {
      sel.innerHTML = '<option value="">全部合作方</option>' + Catalog.listPartners().map(function (p) {
        return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>';
      }).join('');
    }
    if (catEl) {
      catEl.innerHTML = '<option value="">全部分类</option>' + Catalog.listCategories().map(function (c) {
        return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
      }).join('');
    }

    var pager = window.AdminPager && pagerMount
      ? window.AdminPager.create({
          mount: pagerMount,
          pageSize: 10,
          onChange: function () { render(); }
        })
      : null;

    function fmtPrice(p) {
      var amount = Number(p.priceAmount || 0).toFixed(2);
      var cur = p.priceCurrency || 'USD';
      return amount + ' ' + cur;
    }

    function fmtPct(rate) {
      return (Math.round((Number(rate) || 0) * 10000) / 100).toFixed(2) + '%';
    }

    function promoterCount(productId) {
      if (Aff && Aff.countCreatorsForProduct) return Aff.countCreatorsForProduct(productId);
      return 0;
    }

    function switchHtml(on, id) {
      return '<button type="button" role="switch" class="ant-switch ant-switch-small js-prod-switch' +
        (on ? ' ant-switch-checked' : '') + '" data-id="' + esc(id) + '" aria-checked="' + (on ? 'true' : 'false') + '"' +
        ' title="' + (on ? '点击停用' : '点击启用') + '"><div class="ant-switch-handle"></div></button>';
    }

    function filtered() {
      var partnerId = sel && sel.value ? sel.value : '';
      var categoryId = catEl && catEl.value ? catEl.value : '';
      var en = enEl ? enEl.value : '';
      var q = (qEl && qEl.value || '').trim();
      var list = Catalog.listProducts({
        partnerId: partnerId || undefined,
        categoryId: categoryId || undefined,
        q: q || undefined
      });
      if (en === '1') list = list.filter(function (p) { return p.enabled !== false; });
      if (en === '0') list = list.filter(function (p) { return p.enabled === false; });
      return list;
    }

    function openEdit(id) {
      var p = Catalog.getProduct(id);
      if (!p) return;
      var cats = Catalog.listCategories();
      var sdk = p.partnerSdk || (Catalog.defaultSdk && Catalog.defaultSdk(p)) || {};
      var sdkRows = Object.keys(sdk).map(function (k) {
        return '<tr><th>' + esc(k) + '</th><td>' + esc(sdk[k]) + '</td></tr>';
      }).join('') || '<tr><td colspan="2" style="color:rgba(0,0,0,.45)">暂无 SDK 回传字段</td></tr>';

      var catOpts = cats.map(function (c) {
        return '<option value="' + esc(c.id) + '"' + (c.id === p.categoryId ? ' selected' : '') + '>' + esc(c.name) + '</option>';
      }).join('');

      var bodyHtml =
        '<div class="mall-edit-grid">' +
        '<div class="ant-form-item"><label>商品分类</label><select class="ant-input" id="edCat">' + catOpts + '</select></div>' +
        '<div class="ant-form-item"><label>商品ID</label><input class="ant-input" id="edId" value="' + esc(p.id) + '" disabled></div>' +
        '<div class="ant-form-item span-2"><label>商品标题</label><input class="ant-input" id="edTitle" value="' + esc(p.title) + '"></div>' +
        '<div class="ant-form-item"><label>商品库存数</label><input class="ant-input" type="number" min="0" id="edStock" value="' + esc(p.stock) + '"></div>' +
        '<div class="ant-form-item"><label>商品单价</label><div style="display:flex;gap:8px"><input class="ant-input" type="number" min="0" step="0.01" id="edPrice" value="' + esc(p.priceAmount) + '" style="flex:1"><input class="ant-input" id="edCurrency" value="' + esc(p.priceCurrency || 'USD') + '" style="width:88px" placeholder="单位"></div></div>' +
        '<div class="ant-form-item"><label>汇率（原币 → USDT）</label><input class="ant-input" type="number" min="0" step="0.0001" id="edFx" value="' + esc(p.fxRate) + '"></div>' +
        '<div class="ant-form-item"><label>USDT金额</label><input class="ant-input" id="edUsdt" value="' + Number(p.priceUsdt || 0).toFixed(2) + '" disabled></div>' +
        '<div class="ant-form-item"><label>佣金比例（%）</label><input class="ant-input" type="number" min="0" step="0.01" id="edComm" value="' + esc((Math.round((Number(p.commissionRate) || 0) * 10000) / 100).toFixed(2)) + '">' +
        '<div class="mall-edit-glass mall-dev-glass-inline" aria-label="研发批注">' +
        '<span class="mall-dev-glass-wrap">' +
        '<span class="mall-dev-glass-sphere" tabindex="0"><span class="mall-dev-glass-shine"></span><span class="mall-dev-glass-txt">To 研发</span></span>' +
        '<span class="mall-dev-glass-pop" role="note"><strong>SKU 联盟佣金率</strong>成交额 × 本比例 = 联盟佣金（平台从第三方获得）。' +
        '<div class="formula">创作者最终实得另由「商城分成配置 · 创作者分成」二次分配，勿与本字段混用。</div></span>' +
        '</span></div></div>' +
        '<div class="ant-form-item"><label>状态</label><div style="padding-top:4px">' + switchHtml(p.enabled !== false, p.id).replace('js-prod-switch', 'js-ed-switch') + ' <span id="edEnabledLabel" style="margin-left:8px;font-size:12px;color:rgba(0,0,0,.65)">' + (p.enabled !== false ? '启用' : '停用') + '</span></div></div>' +
        '<div class="ant-form-item"><label>创建时间</label><input class="ant-input" value="' + esc(p.createdAt) + '" disabled></div>' +
        '<div class="ant-form-item"><label>更新时间</label><input class="ant-input" value="' + esc(p.updatedAt) + '" disabled></div>' +
        '<div class="ant-form-item"><label>推广创作者数量</label><input class="ant-input" value="' + promoterCount(p.id) + '" disabled></div>' +
        '<div class="ant-form-item span-2"><label>三方联盟 SDK 回传字段</label>' +
        '<div class="ant-table ant-table-small ant-table-bordered"><table class="mall-sdk-table"><thead><tr><th>SDK 字段</th><th>值</th></tr></thead><tbody>' + sdkRows + '</tbody></table></div></div>' +
        '</div>';

      if (!window.AdminModal || !window.AdminModal.open) {
        toast('弹窗组件未加载');
        return;
      }

      window.AdminModal.open({
        title: '编辑同步商品',
        wide: true,
        width: 760,
        body: bodyHtml,
        footer: [
          { text: '取消', onClick: function () { window.AdminModal.close(); } },
          {
            text: '保存',
            primary: true,
            onClick: function () {
              var stock = parseInt(document.getElementById('edStock').value, 10);
              var price = parseFloat(document.getElementById('edPrice').value);
              var fx = parseFloat(document.getElementById('edFx').value);
              var commPct = parseFloat(document.getElementById('edComm').value);
              var currency = (document.getElementById('edCurrency').value || 'USD').trim().toUpperCase();
              var enabledBtn = document.querySelector('.js-ed-switch');
              var enabled = enabledBtn ? enabledBtn.classList.contains('ant-switch-checked') : true;
              var next = Object.assign({}, p, {
                title: document.getElementById('edTitle').value.trim() || p.title,
                categoryId: document.getElementById('edCat').value,
                stock: isFinite(stock) ? stock : p.stock,
                priceAmount: isFinite(price) ? price : p.priceAmount,
                priceCurrency: currency || 'USD',
                fxRate: isFinite(fx) && fx > 0 ? fx : 1,
                commissionRate: isFinite(commPct) ? Math.round(commPct * 100) / 10000 : p.commissionRate,
                enabled: enabled
              });
              next.priceUsdt = Catalog.calcUsdt(next.priceAmount, next.fxRate);
              next.partnerSdk = Catalog.defaultSdk(next);
              Catalog.upsertProduct(next);
              toast('商品已保存');
              window.AdminModal.close();
              render();
            }
          }
        ],
        onMount: function (root) {
          if (window.MallDevGlass && window.MallDevGlass.bind) window.MallDevGlass.bind(root);
          function recalc() {
            var price = parseFloat(document.getElementById('edPrice').value);
            var fx = parseFloat(document.getElementById('edFx').value);
            var usdt = Catalog.calcUsdt(price, fx);
            var el = document.getElementById('edUsdt');
            if (el) el.value = usdt.toFixed(2);
          }
          ['edPrice', 'edFx'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', recalc);
          });
          var sw = root.querySelector('.js-ed-switch');
          if (sw) {
            sw.addEventListener('click', function () {
              var on = !sw.classList.contains('ant-switch-checked');
              sw.classList.toggle('ant-switch-checked', on);
              sw.setAttribute('aria-checked', on ? 'true' : 'false');
              var lab = document.getElementById('edEnabledLabel');
              if (lab) lab.textContent = on ? '启用' : '停用';
            });
          }
        }
      });
    }

    function render() {
      var list = filtered();
      if (pager) pager.setTotal(list.length);
      var pageList = pager ? pager.getSlice(list) : list;
      if (!pageList.length) {
        body.innerHTML = '<tr><td colspan="12" style="text-align:center;color:rgba(0,0,0,.45);padding:28px">暂无同步商品</td></tr>';
        return;
      }
      body.innerHTML = pageList.map(function (p) {
        var ops = '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-edit" data-id="' + esc(p.id) + '">编辑</button>';
        if (p.enabled === false) {
          ops += '<button type="button" class="ant-btn ant-btn-link ant-btn-sm ant-btn-dangerous js-del" data-id="' + esc(p.id) + '">删除</button>';
        }
        return '<tr>' +
          '<td>' + esc(Catalog.categoryName(p.categoryId)) + '</td>' +
          '<td><span class="pid">' + esc(p.id) + '</span><span class="pid-sub">' + esc(p.title) + '</span></td>' +
          '<td>' + esc(p.stock) + '</td>' +
          '<td>' + esc(fmtPrice(p)) + '</td>' +
          '<td>' + Number(p.fxRate || 1).toFixed(4) + '</td>' +
          '<td>' + Number(p.priceUsdt || 0).toFixed(2) + '</td>' +
          '<td>' + esc(fmtPct(p.commissionRate)) + '</td>' +
          '<td>' + esc(p.createdAt) + '</td>' +
          '<td>' + esc(p.updatedAt) + '</td>' +
          '<td>' + switchHtml(p.enabled !== false, p.id) + '</td>' +
          '<td>' + promoterCount(p.id) + '</td>' +
          '<td class="col-ops">' + ops + '</td></tr>';
      }).join('');

      body.querySelectorAll('.js-prod-switch').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          var p = Catalog.getProduct(id);
          if (!p) return;
          Catalog.setProductEnabled(id, !(p.enabled !== false));
          toast(p.enabled !== false ? '已停用' : '已启用');
          render();
        });
      });
      body.querySelectorAll('.js-edit').forEach(function (btn) {
        btn.addEventListener('click', function () { openEdit(btn.getAttribute('data-id')); });
      });
      body.querySelectorAll('.js-del').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          if (!window.confirm('确认删除已停用商品「' + id + '」？此操作不可恢复。')) return;
          var res = Catalog.deleteProduct(id);
          if (!res.ok) {
            toast(res.error || '删除失败');
            return;
          }
          toast('已删除');
          render();
        });
      });
    }

    function query() {
      if (pager) pager.resetPage();
      render();
    }

    var qBtn = document.getElementById('btnMallSyncQuery');
    var rBtn = document.getElementById('btnMallSyncReset');
    if (qBtn) qBtn.addEventListener('click', query);
    if (rBtn) rBtn.addEventListener('click', function () {
      if (sel) sel.value = '';
      if (catEl) catEl.value = '';
      if (enEl) enEl.value = '';
      if (qEl) qEl.value = '';
      query();
    });
    if (qEl) qEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); query(); }
    });

    var syncBtn = document.getElementById('btnMallSync');
    if (syncBtn) {
      syncBtn.addEventListener('click', function () {
        var partnerId = sel && sel.value;
        if (!partnerId) {
          var first = Catalog.listPartners()[0];
          partnerId = first && first.id;
        }
        if (!partnerId) {
          toast('请先选择合作方');
          return;
        }
        var job = Catalog.runSync(partnerId);
        toast(job.message);
        render();
      });
    }
    render();
  }

  function initCategories() {
    var Catalog = window.AffiliateCatalogStore;
    var body = document.getElementById('mallCatBody');
    if (!Catalog || !body) return;
    function render() {
      body.innerHTML = Catalog.listCategories().map(function (c) {
        return '<tr><td>' + esc(c.id) + '</td><td>' + esc(c.name) + '</td><td>' + c.sort + '</td><td>' +
          (c.enabled ? '<span class="ant-tag ant-tag-green">启用</span>' : '<span class="ant-tag">停用</span>') +
          '</td><td><button type="button" class="ant-btn ant-btn-sm js-cat-toggle" data-id="' + esc(c.id) + '">切换启用</button></td></tr>';
      }).join('');
      body.querySelectorAll('.js-cat-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          var cats = Catalog.listCategories();
          var c = cats.filter(function (x) { return x.id === id; })[0];
          if (!c) return;
          c.enabled = !c.enabled;
          Catalog.saveCategory(c);
          render();
        });
      });
    }
    render();
  }

  function initCommissions() {
    var Aff = window.AffiliateShowcaseStore;
    var body = document.getElementById('mallCommBody');
    if (!Aff || !body) return;

    function statusTag(status) {
      var label = Aff.statusLabel ? Aff.statusLabel(status) : status;
      var cls = 'ant-tag';
      if (status === 'settled') cls += ' ant-tag-green';
      else if (status === 'pending') cls += ' ant-tag-gold';
      else if (status === 'reverse') cls += ' ant-tag-red';
      return '<span class="' + cls + '">' + esc(label) + '</span>';
    }

    function fmtAmt(n) {
      var v = Number(n) || 0;
      var s = v.toFixed(2);
      return v < 0 ? '<span style="color:#cf1322">' + s + '</span>' : s;
    }

    var list = Aff.listCommissions();
    body.innerHTML = list.map(function (c, i) {
      var titleSub = '';
      if (c.status === 'reverse' && c.relatedId) {
        titleSub = '<div style="color:rgba(0,0,0,.45);margin-top:2px">冲销原单 ' + esc(c.relatedId) +
          (c.remark ? ' · ' + esc(c.remark) : '') + '</div>';
      }
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td style="white-space:nowrap">' + esc(c.platformOrderNo || '—') + '</td>' +
        '<td style="white-space:nowrap">' + esc(c.partnerOrderNo || '—') + '</td>' +
        '<td><div>' + esc(c.productTitle) + '</div>' + titleSub + '</td>' +
        '<td>' + esc(c.creatorId) + '</td>' +
        '<td>' + fmtAmt(c.orderAmount) + '</td>' +
        '<td>' + Math.round((c.commissionRate || 0) * 1000) / 10 + '%</td>' +
        '<td>' + fmtAmt(c.affiliateGross) + '</td>' +
        '<td>' + fmtAmt(c.creatorShare) + '</td>' +
        '<td>' + fmtAmt(c.platformShare) + '</td>' +
        '<td>' + statusTag(c.status) + '</td>' +
        '<td>' + esc(c.createdAt) + '</td></tr>';
    }).join('') || '<tr><td colspan="12" style="text-align:center;padding:24px;color:rgba(0,0,0,.45)">暂无佣金回传（可在橱窗点击「去购买」模拟）</td></tr>';
  }

  function initSplitReadonly() {
    var Split = window.FLCreatorIncomeSplit;
    var body = document.getElementById('mallSplitReadonlyBody');
    if (!Split || !body || !Split.getMallCommerceSummaryRules) return;
    body.innerHTML = Split.getMallCommerceSummaryRules().map(function (r) {
      return '<tr><td><strong>' + esc(r.name) + '</strong></td><td>' + esc(r.desc) + '</td><td><span class="ant-tag">' + esc(r.settlementLabel) + '</span></td><td>' + r.creatorPercent + '%</td><td>' + r.platformPercent + '%</td><td><a href="' + esc(r.configHref) + '">去商城配置</a></td></tr>';
    }).join('');
  }

  var page = document.body.getAttribute('data-admin-page') || '';
  if (page === 'mall-digital-review') initDigitalReview();
  if (page === 'mall-digital-products') initDigitalProducts();
  if (page === 'mall-digital-orders') initDigitalOrders();
  if (page === 'mall-commerce-config') initCommerceConfig();
  if (page === 'mall-affiliate-partners') initPartners();
  if (page === 'mall-affiliate-sync') initSync();
  if (page === 'mall-affiliate-categories') initCategories();
  if (page === 'mall-affiliate-commissions') initCommissions();
  if (page === 'creator-income-split') initSplitReadonly();
})();
