(function () {
  var Fee = window.FLFeeConfig;
  var M = window.AdminModal;
  if (!Fee || !M) return;

  var state = { cfg: null };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderTable() {
    var tbody = document.getElementById('feeTbody');
    if (!tbody) return;
    tbody.innerHTML = state.cfg.scenes.map(function (s) {
      return (
        '<tr data-id="' + esc(s.id) + '">' +
        '<td>' + esc(s.scene) + '</td>' +
        '<td>' + esc(Fee.billingLabel(s.billingType)) + '</td>' +
        '<td>' + esc(Fee.formatRate(s)) + '</td>' +
        '<td>' + esc(Fee.formatMinFee(s)) + '</td>' +
        '<td><span class="ant-tag ant-tag-green">生效</span></td>' +
        '<td style="font-size:13px">' + esc(s.updatedBy || '—') + '</td>' +
        '<td style="font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap">' + esc(Fee.formatUpdatedAt(s.updatedAt)) + '</td>' +
        '<td><button type="button" class="ant-btn ant-btn-link ant-btn-sm js-fee-edit">编辑</button></td>' +
        '</tr>'
      );
    }).join('');
  }

  function render() {
    state.cfg = Fee.loadConfig();
    renderTable();
  }

  function rateFieldHtml(scene) {
    var isPercent = scene.billingType === 'percent';
    return (
      '<label style="display:block;margin-bottom:6px" id="feeRateLabel">' +
      (isPercent ? '费率' : '固定费') +
      '</label>' +
      '<span class="ant-input-affix-wrapper" id="feeRateAffix" style="width:100%;max-width:360px;margin-bottom:12px">' +
      '<input class="ant-input" id="feeRateInput" type="number" min="0" step="' + (isPercent ? '0.1' : '0.01') + '" value="' + scene.rate + '">' +
      '<span class="ant-input-suffix" id="feeRateUnit">' + (isPercent ? '%' : 'USDT') + '</span>' +
      '</span>'
    );
  }

  function minFeeFieldHtml(scene) {
    return (
      '<label style="display:block;margin:12px 0 6px">最小手续费（USDT）</label>' +
      '<input class="ant-input" id="feeMinInput" type="number" min="0" step="0.01" style="width:100%;max-width:360px" placeholder="可选" value="' +
      (scene.minFee != null ? scene.minFee : '') + '">'
    );
  }

  function bindModalForm() {
    var typeSel = document.getElementById('feeTypeSelect');
    var rateLabel = document.getElementById('feeRateLabel');
    var rateInput = document.getElementById('feeRateInput');
    var rateUnit = document.getElementById('feeRateUnit');

    function syncType() {
      var isPercent = typeSel.value === 'percent';
      rateLabel.textContent = isPercent ? '费率' : '固定费';
      rateUnit.textContent = isPercent ? '%' : 'USDT';
      rateInput.step = isPercent ? '0.1' : '0.01';
    }

    typeSel.addEventListener('change', syncType);
    syncType();
  }

  function openEdit(id) {
    var scene = Fee.getScene(id, state.cfg);
    if (!scene) return;
    M.open({
      title: '编辑手续费 · ' + scene.scene,
      body:
        '<label style="display:block;margin-bottom:6px">计费方式</label>' +
        '<select class="ant-input" id="feeTypeSelect" style="width:100%;max-width:360px;margin-bottom:12px">' +
        '<option value="percent"' + (scene.billingType === 'percent' ? ' selected' : '') + '>百分比</option>' +
        '<option value="fixed"' + (scene.billingType === 'fixed' ? ' selected' : '') + '>固定费</option>' +
        '</select>' +
        rateFieldHtml(scene) +
        minFeeFieldHtml(scene),
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: '保存',
          primary: true,
          onClick: function () {
            var typeSel = document.getElementById('feeTypeSelect');
            var rateInput = document.getElementById('feeRateInput');
            var minInput = document.getElementById('feeMinInput');
            var billingType = typeSel.value === 'fixed' ? 'fixed' : 'percent';
            var rate = parseFloat(rateInput.value);
            if (isNaN(rate) || rate < 0) {
              M.toast('请输入有效费率');
              return;
            }
            var minFee = null;
            if (minInput && minInput.value !== '') {
              minFee = parseFloat(minInput.value);
              if (isNaN(minFee) || minFee < 0) {
                M.toast('请输入有效最小手续费');
                return;
              }
            }
            var payload = { billingType: billingType, rate: rate, minFee: minFee };
            M.confirmGoogle({
              message: '变更手续费影响全站报价，需谷歌验证。场景：' + scene.scene,
              onVerified: function () {
                state.cfg.scenes = state.cfg.scenes.map(function (s) {
                  if (s.id !== id) return s;
                  return Fee.touchScene(Object.assign({}, s, payload));
                });
                state.cfg = Fee.saveConfig(state.cfg);
                M.close();
                render();
                M.toast('手续费已更新');
              }
            });
          }
        }
      ],
      onMount: function () {
        bindModalForm();
      }
    });
  }

  document.getElementById('feeTbody').addEventListener('click', function (e) {
    if (!e.target.classList.contains('js-fee-edit')) return;
    var tr = e.target.closest('tr');
    var id = tr && tr.getAttribute('data-id');
    if (id) openEdit(id);
  });

  render();
})();
