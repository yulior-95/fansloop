/**
 * 后台 · 链上充提网络与手续费（Ant Design 高保真 CRUD）
 */
(function () {
  var Fee = window.FLFeeConfig;
  var M = window.AdminModal;
  if (!Fee || !M) return;

  var body = document.getElementById('feeTbody');
  var statsEl = document.getElementById('nfStats');
  var hintEl = document.getElementById('nfListHint');
  var pagerMount = document.getElementById('nfPager');
  var assetEl = document.getElementById('nfAsset');
  var enEl = document.getElementById('nfEnabled');
  var qEl = document.getElementById('nfQ');
  if (!body) return;

  var pager = window.AdminPager && pagerMount
    ? window.AdminPager.create({
        mount: pagerMount,
        pageSize: 10,
        onChange: function () { renderTable(); }
      })
    : null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    M.toast(msg);
  }

  function enhanceControls(root) {
    if (window.AdminFormControls && window.AdminFormControls.boot) {
      window.AdminFormControls.boot(root || document);
    }
  }

  function shortAddr(addr) {
    var s = String(addr || '');
    if (!s) return '—';
    if (s.length <= 20) return s;
    return s.slice(0, 10) + '…' + s.slice(-8);
  }

  function feeHtml(fee, asset) {
    fee = fee || {};
    return (
      '<div class="nf-fee-cell">' +
      '<div class="nf-fee-main">' + esc(Fee.formatFee(fee, asset)) + '</div>' +
      '<span class="nf-fee-sub">' + esc(Fee.billingLabel(fee.billingType)) + '</span>' +
      '</div>'
    );
  }

  function switchHtml(on, id) {
    return (
      '<button type="button" role="switch" class="ant-switch ant-switch-small js-nf-switch' +
      (on ? ' ant-switch-checked' : '') +
      '" data-id="' + esc(id) + '" aria-checked="' + (on ? 'true' : 'false') + '"' +
      ' title="' + (on ? '点击停用' : '点击启用') + '">' +
      '<div class="ant-switch-handle"></div>' +
      '<span class="ant-switch-inner"></span>' +
      '</button>'
    );
  }

  function addrCell(addr) {
    if (!addr) return '<span style="color:rgba(0,0,0,.25)">未配置</span>';
    return (
      '<div class="nf-addr-cell">' +
      '<span class="nf-addr" title="' + esc(addr) + '">' + esc(shortAddr(addr)) + '</span>' +
      '<button type="button" class="nf-copy js-copy" data-copy="' + esc(addr) + '" title="复制地址">' +
      '<i class="fa-regular fa-copy"></i></button></div>'
    );
  }

  function qrCell(url, title) {
    return (
      '<div class="nf-qr-wrap js-qr" data-title="' + esc(title) + '" title="点击预览">' +
      '<img src="' + esc(url) + '" alt="' + esc(title) + '">' +
      '</div>'
    );
  }

  function filtered() {
    var asset = assetEl && assetEl.value ? assetEl.value : '';
    var en = enEl ? enEl.value : '';
    var q = (qEl && qEl.value || '').trim();
    return Fee.listNetworks({
      asset: asset || undefined,
      enabled: en === '1' ? true : en === '0' ? false : undefined,
      q: q || undefined
    });
  }

  function renderStats() {
    if (!statsEl) return;
    var all = Fee.listNetworks();
    var usdt = all.filter(function (n) { return n.asset === 'USDT'; }).length;
    var usdc = all.filter(function (n) { return n.asset === 'USDC'; }).length;
    var on = all.filter(function (n) { return n.enabled !== false; }).length;
    var off = all.length - on;
    statsEl.innerHTML =
      '<div class="nf-stat nf-stat--usdt"><div class="lb"><i class="fa-solid fa-coins"></i>USDT 网络</div>' +
      '<div class="v">' + usdt + '</div><div class="sub">多链充提通道</div></div>' +
      '<div class="nf-stat nf-stat--usdc"><div class="lb"><i class="fa-solid fa-circle-dollar-to-slot"></i>USDC 网络</div>' +
      '<div class="v">' + usdc + '</div><div class="sub">多链充提通道</div></div>' +
      '<div class="nf-stat nf-stat--on"><div class="lb"><i class="fa-solid fa-toggle-on"></i>已启用</div>' +
      '<div class="v">' + on + '</div><div class="sub">对用户端可见</div></div>' +
      '<div class="nf-stat nf-stat--off"><div class="lb"><i class="fa-solid fa-toggle-off"></i>已停用</div>' +
      '<div class="v">' + off + '</div><div class="sub">仅后台保留配置</div></div>';
  }

  function readFileAsDataUrl(file, cb) {
    if (!file) return cb(null);
    if (!/^image\//.test(file.type)) {
      toast('请上传图片格式二维码');
      return cb(null);
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('图片请小于 2MB');
      return cb(null);
    }
    var reader = new FileReader();
    reader.onload = function () { cb(String(reader.result || '')); };
    reader.onerror = function () { toast('读取图片失败'); cb(null); };
    reader.readAsDataURL(file);
  }

  function feeFieldsHtml(prefix, fee, asset) {
    fee = fee || { billingType: 'fixed', rate: 0, minFee: null };
    var isPct = fee.billingType === 'percent';
    return (
      '<div class="ant-form-item"><label>计费方式</label>' +
      '<select class="ant-input js-fee-type" data-prefix="' + prefix + '">' +
      '<option value="fixed"' + (!isPct ? ' selected' : '') + '>固定费</option>' +
      '<option value="percent"' + (isPct ? ' selected' : '') + '>百分比</option>' +
      '</select></div>' +
      '<div class="ant-form-item"><label id="' + prefix + 'RateLabel">' + (isPct ? '费率 (%)' : '固定费 (' + asset + ')') + '</label>' +
      '<input class="ant-input" id="' + prefix + 'Rate" type="number" min="0" step="0.01" value="' + esc(fee.rate) + '"></div>' +
      '<div class="ant-form-item span-2"><label>最小手续费（百分比场景建议填写，单位 ' + asset + '）</label>' +
      '<input class="ant-input" id="' + prefix + 'Min" type="number" min="0" step="0.01" placeholder="可选，留空表示不设最低" value="' +
      (fee.minFee != null ? esc(fee.minFee) : '') + '"></div>'
    );
  }

  function qrUploadHtml(prefix, url, label) {
    return (
      '<div class="ant-form-item span-2"><label>' + label + '</label>' +
      '<div class="nf-qr-upload">' +
      '<img id="' + prefix + 'Preview" src="' + esc(url) + '" alt="' + esc(label) + '">' +
      '<div class="meta">' +
      '<input type="hidden" id="' + prefix + 'Url" value="' + esc(url) + '">' +
      '<input class="ant-input" type="file" id="' + prefix + 'File" accept="image/*" data-admin-control="skip">' +
      '<div class="tip">支持 PNG / JPG，建议方形二维码；也可在下方粘贴图片 URL</div>' +
      '<input class="ant-input" id="' + prefix + 'UrlInput" style="margin-top:8px" placeholder="https://… 或 data:image/…" value="' +
      (String(url || '').indexOf('data:') === 0 ? '' : esc(url)) + '">' +
      '</div></div></div>'
    );
  }

  function bindFeeTypeLabels(root, asset) {
    root.querySelectorAll('.js-fee-type').forEach(function (sel) {
      var prefix = sel.getAttribute('data-prefix');
      function sync() {
        var label = document.getElementById(prefix + 'RateLabel');
        if (!label) return;
        label.textContent = sel.value === 'percent' ? '费率 (%)' : '固定费 (' + asset + ')';
      }
      sel.addEventListener('change', sync);
      sync();
    });
  }

  function bindQrUploads() {
    ['nfDepQr'].forEach(function (prefix) {
      var file = document.getElementById(prefix + 'File');
      var hidden = document.getElementById(prefix + 'Url');
      var input = document.getElementById(prefix + 'UrlInput');
      var preview = document.getElementById(prefix + 'Preview');
      if (file) {
        file.addEventListener('change', function () {
          var f = file.files && file.files[0];
          readFileAsDataUrl(f, function (dataUrl) {
            if (!dataUrl) return;
            if (hidden) hidden.value = dataUrl;
            if (input) input.value = '';
            if (preview) preview.src = dataUrl;
          });
        });
      }
      if (input) {
        input.addEventListener('change', function () {
          var v = input.value.trim();
          if (!v) return;
          if (hidden) hidden.value = v;
          if (preview) preview.src = v;
        });
      }
    });
  }

  function readFee(prefix) {
    var typeEl = document.querySelector('.js-fee-type[data-prefix="' + prefix + '"]');
    var rateEl = document.getElementById(prefix + 'Rate');
    var minEl = document.getElementById(prefix + 'Min');
    var billingType = typeEl && typeEl.value === 'percent' ? 'percent' : 'fixed';
    var rate = parseFloat(rateEl && rateEl.value);
    if (isNaN(rate) || rate < 0) return { error: '请输入有效手续费数值' };
    var minFee = null;
    if (minEl && minEl.value !== '') {
      minFee = parseFloat(minEl.value);
      if (isNaN(minFee) || minFee < 0) return { error: '请输入有效最小手续费' };
    }
    return { billingType: billingType, rate: rate, minFee: minFee };
  }

  function openEditor(existing) {
    var isEdit = !!existing;
    var row = existing ? Object.assign({}, existing) : {
      id: Fee.uid('net'),
      asset: 'USDT',
      networkId: '',
      networkName: '',
      enabled: true,
      depositAddress: '',
      depositFee: { billingType: 'fixed', rate: 1, minFee: null },
      depositQrUrl: Fee.placeholderQr('new-deposit'),
      sort: 100
    };

    function bodyHtml(asset) {
      return (
        '<div class="nf-edit-grid">' +
        '<div class="nf-section"><i class="fa-solid fa-network-wired"></i>基础信息<span class="hint">资产 × 网络唯一通道</span></div>' +
        '<div class="ant-form-item"><label>资产</label>' +
        '<select class="ant-input" id="nfAssetSel">' +
        '<option value="USDT"' + (asset === 'USDT' ? ' selected' : '') + '>USDT</option>' +
        '<option value="USDC"' + (asset === 'USDC' ? ' selected' : '') + '>USDC</option>' +
        '</select></div>' +
        '<div class="ant-form-item"><label>网络标识</label>' +
        '<input class="ant-input" id="nfNetId" value="' + esc(row.networkId) + '" placeholder="如 trc20 / erc20 / sol"></div>' +
        '<div class="ant-form-item span-2"><label>网络显示名称</label>' +
        '<input class="ant-input" id="nfNetName" value="' + esc(row.networkName) + '" placeholder="如 TRON (TRC20)"></div>' +
        '<div class="ant-form-item"><label>排序权重</label>' +
        '<input class="ant-input" id="nfSort" type="number" value="' + esc(row.sort) + '" placeholder="越小越靠前"></div>' +
        '<div class="ant-form-item"><label>状态</label>' +
        '<select class="ant-input" id="nfEnabledSel">' +
        '<option value="1"' + (row.enabled !== false ? ' selected' : '') + '>启用</option>' +
        '<option value="0"' + (row.enabled === false ? ' selected' : '') + '>停用</option>' +
        '</select></div>' +

        '<div class="nf-section"><i class="fa-solid fa-wallet"></i>充值地址<span class="hint">平台收款地址</span></div>' +
        '<div class="ant-form-item span-2"><label>充值地址</label>' +
        '<input class="ant-input" id="nfDepAddr" value="' + esc(row.depositAddress) + '" placeholder="平台收款地址"></div>' +

        '<div class="nf-section"><i class="fa-solid fa-percent"></i>充值手续费<span class="hint">按网络独立计价</span></div>' +
        feeFieldsHtml('nfDep', row.depositFee, asset) +

        '<div class="nf-section"><i class="fa-solid fa-qrcode"></i>充值二维码<span class="hint">用户端展示用</span></div>' +
        qrUploadHtml('nfDepQr', row.depositQrUrl, '充值二维码') +
        '</div>'
      );
    }

    M.open({
      title: isEdit ? '编辑网络 · ' + row.asset + ' / ' + row.networkName : '新增充提网络',
      wide: true,
      width: 820,
      body: bodyHtml(row.asset),
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: '保存',
          primary: true,
          onClick: function () {
            var asset = (document.getElementById('nfAssetSel').value || 'USDT').toUpperCase();
            if (asset !== 'USDC') asset = 'USDT';
            var networkId = (document.getElementById('nfNetId').value || '').trim();
            var networkName = (document.getElementById('nfNetName').value || '').trim();
            var depositAddress = (document.getElementById('nfDepAddr').value || '').trim();
            if (!networkId) { toast('请填写网络标识'); return; }
            if (!networkName) { toast('请填写网络名称'); return; }
            if (!depositAddress) { toast('请填写充值地址'); return; }
            var depFee = readFee('nfDep');
            if (depFee.error) { toast(depFee.error); return; }
            var depQr = document.getElementById('nfDepQrUrl').value.trim();
            var sort = parseInt(document.getElementById('nfSort').value, 10);
            var enabled = document.getElementById('nfEnabledSel').value !== '0';

            var payload = {
              id: row.id,
              asset: asset,
              networkId: networkId,
              networkName: networkName,
              depositAddress: depositAddress,
              withdrawAddress: row.withdrawAddress || '',
              depositFee: depFee,
              withdrawFee: row.withdrawFee || { billingType: 'fixed', rate: 0, minFee: null },
              depositQrUrl: depQr || Fee.placeholderQr(asset + '-' + networkId + '-deposit'),
              withdrawQrUrl: row.withdrawQrUrl || '',
              sort: isFinite(sort) ? sort : 100,
              enabled: enabled,
              createdAt: row.createdAt
            };

            M.confirmGoogle({
              message: (isEdit ? '变更' : '新增') + '链上充值网络将影响用户端可选网络与手续费报价，需谷歌验证。',
              onVerified: function () {
                Fee.upsertNetwork(payload);
                M.close();
                render();
                toast(isEdit ? '网络已更新' : '网络已新增');
              }
            });
          }
        }
      ],
      onMount: function (root) {
        var assetSel = document.getElementById('nfAssetSel');
        function syncAssetLabels() {
          var asset = (assetSel.value || 'USDT').toUpperCase();
          bindFeeTypeLabels(root, asset === 'USDC' ? 'USDC' : 'USDT');
        }
        if (assetSel) assetSel.addEventListener('change', syncAssetLabels);
        syncAssetLabels();
        bindQrUploads();
        enhanceControls(root);
      }
    });
  }

  function previewQr(url, title) {
    if (!url) return;
    M.open({
      title: title || '二维码预览',
      body:
        '<div style="text-align:center;padding:8px 0 4px">' +
        '<img src="' + esc(url) + '" alt="" style="width:min(240px,70vw);height:auto;border-radius:2px;border:1px solid #f0f0f0;background:#fff">' +
        '<p style="margin:12px 0 0;font-size:12px;color:rgba(0,0,0,.45)">扫码或保存后用于线下核对</p></div>',
      footer: [{ text: '关闭', primary: true, onClick: M.close }]
    });
  }

  function copyText(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('地址已复制');
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast('地址已复制');
    } catch (e) {
      toast('复制失败，请手动选择');
    }
    document.body.removeChild(ta);
  }

  function renderTable() {
    var list = filtered();
    if (pager) pager.setTotal(list.length);
    var pageList = pager ? pager.getSlice(list) : list;
    if (hintEl) {
      hintEl.textContent = '当前筛选 ' + list.length + ' 条 · 按排序权重展示 · 支持横向滚动';
    }
    if (!pageList.length) {
      body.innerHTML =
        '<tr><td colspan="8" style="text-align:center;color:rgba(0,0,0,.45);padding:48px 28px">' +
        '<div style="font-size:32px;opacity:.25;margin-bottom:8px"><i class="fa-solid fa-inbox"></i></div>' +
        '暂无网络配置，请点击「新增网络」</td></tr>';
      return;
    }
    body.innerHTML = pageList.map(function (n) {
      var assetCls = n.asset === 'USDC' ? 'nf-asset-badge--usdc' : 'nf-asset-badge--usdt';
      return '<tr data-id="' + esc(n.id) + '">' +
        '<td class="col-sticky-asset"><span class="nf-asset-badge ' + assetCls + '">' + esc(n.asset) + '</span></td>' +
        '<td class="col-sticky-net"><div class="nf-net-name">' + esc(n.networkName) + '</div>' +
        '<div class="nf-net-id">' + esc(n.networkId) + '</div></td>' +
        '<td>' + addrCell(n.depositAddress) + '</td>' +
        '<td>' + feeHtml(n.depositFee, n.asset) + '</td>' +
        '<td>' + qrCell(n.depositQrUrl, '充值二维码 · ' + n.asset + ' / ' + n.networkName) + '</td>' +
        '<td>' + switchHtml(n.enabled !== false, n.id) + '</td>' +
        '<td><div class="nf-time">' + esc(Fee.formatUpdatedAt(n.updatedAt)) +
        '<div class="by">' + esc(n.updatedBy || '—') + '</div></div></td>' +
        '<td class="col-ops">' +
        '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-edit">编辑</button>' +
        '<button type="button" class="ant-btn ant-btn-link ant-btn-sm ant-btn-dangerous js-del">删除</button>' +
        '</td></tr>';
    }).join('');
  }

  function render() {
    renderStats();
    renderTable();
  }

  function query() {
    if (pager) pager.resetPage();
    render();
  }

  body.addEventListener('click', function (e) {
    var tr = e.target.closest('tr');
    var id = tr && tr.getAttribute('data-id');

    var copyBtn = e.target.closest('.js-copy');
    if (copyBtn) {
      e.stopPropagation();
      copyText(copyBtn.getAttribute('data-copy') || '');
      return;
    }

    var qr = e.target.closest('.js-qr');
    if (qr) {
      var img = qr.querySelector('img');
      previewQr(img ? img.getAttribute('src') : '', qr.getAttribute('data-title'));
      return;
    }

    if (e.target.closest('.js-nf-switch')) {
      var btn = e.target.closest('.js-nf-switch');
      var sid = btn.getAttribute('data-id');
      var row = Fee.getNetwork(sid);
      if (!row) return;
      Fee.setNetworkEnabled(sid, !(row.enabled !== false));
      toast(row.enabled !== false ? '已停用' : '已启用');
      render();
      return;
    }

    if (e.target.classList.contains('js-edit') || e.target.closest('.js-edit')) {
      if (!id) return;
      openEditor(Fee.getNetwork(id));
      return;
    }

    if (e.target.classList.contains('js-del') || e.target.closest('.js-del')) {
      if (!id) return;
      var n = Fee.getNetwork(id);
      if (!n) return;
      if (!window.confirm('确认删除「' + n.asset + ' / ' + n.networkName + '」？删除后用户端将不可选该网络。')) return;
      M.confirmGoogle({
        message: '删除链上充提网络为敏感操作，需谷歌验证。',
        onVerified: function () {
          var res = Fee.deleteNetwork(id);
          if (!res.ok) {
            toast(res.error || '删除失败');
            return;
          }
          render();
          toast('已删除');
        }
      });
    }
  });

  function bindAdd(btn) {
    if (btn) btn.addEventListener('click', function () { openEditor(null); });
  }

  var qBtn = document.getElementById('btnNfQuery');
  var rBtn = document.getElementById('btnNfReset');
  var resetDataBtn = document.getElementById('btnNfResetData');
  if (qBtn) qBtn.addEventListener('click', query);
  if (rBtn) rBtn.addEventListener('click', function () {
    if (assetEl) assetEl.value = '';
    if (enEl) enEl.value = '';
    if (qEl) qEl.value = '';
    enhanceControls(document.querySelector('.nf-filter-toolbar'));
    query();
  });
  if (qEl) qEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); query(); }
  });
  bindAdd(document.getElementById('btnNfAdd'));
  bindAdd(document.getElementById('btnNfAddHeader'));
  if (resetDataBtn) resetDataBtn.addEventListener('click', function () {
    if (!window.confirm('将清空当前配置并恢复演示默认网络数据，确认继续？')) return;
    Fee.resetConfig();
    query();
    toast('已恢复默认网络配置');
  });

  enhanceControls(document);
  render();
})();
