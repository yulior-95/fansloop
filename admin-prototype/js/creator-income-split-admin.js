(function () {
  var Split = window.FLCreatorIncomeSplit;
  var M = window.AdminModal;
  if (!Split || !M) return;

  var state = { cfg: null };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function platformPreview(creatorPct) {
    return (100 - creatorPct) + '%';
  }

  function renderRows() {
    return Split.RULE_DEFS.map(function (def) {
      var pct = state.cfg.rules[def.id].creatorPercent;
      var tipTag = def.id.indexOf('tip_') === 0
        ? ' <span class="ant-tag ant-tag-magenta" style="font-size:10px;margin-left:4px">打赏</span>'
        : '';
      return (
        '<tr data-rule="' + esc(def.id) + '">' +
        '<td><strong>' + esc(def.name) + '</strong>' + tipTag + '</td>' +
        '<td style="font-size:13px;color:rgba(0,0,0,.65)">' + esc(def.desc) + '</td>' +
        '<td><span class="ant-tag">' + esc(def.settlementLabel) + '</span></td>' +
        '<td><input class="ant-input js-split-pct" type="number" min="50" max="95" step="1" value="' + pct + '" style="width:88px"> %</td>' +
        '<td class="js-split-platform" style="font-size:13px;color:rgba(0,0,0,.65)">' + platformPreview(pct) + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function bindInputs() {
    document.querySelectorAll('#splitRulesBody .js-split-pct').forEach(function (input) {
      input.addEventListener('input', function () {
        var tr = input.closest('tr');
        var pct = Split.clampPercent(input.value);
        tr.querySelector('.js-split-platform').textContent = platformPreview(pct);
      });
    });
  }

  function render() {
    state.cfg = Split.loadConfig();
    document.getElementById('fldLevelAdjust').checked = !!state.cfg.levelAdjustEnabled;
    document.getElementById('splitRulesBody').innerHTML = renderRows();
    bindInputs();
  }

  function collect() {
    var cfg = JSON.parse(JSON.stringify(state.cfg));
    cfg.levelAdjustEnabled = document.getElementById('fldLevelAdjust').checked;
    document.querySelectorAll('#splitRulesBody tr[data-rule]').forEach(function (tr) {
      var id = tr.getAttribute('data-rule');
      var pct = Split.clampPercent(tr.querySelector('.js-split-pct').value);
      cfg.rules[id].creatorPercent = pct;
    });
    return cfg;
  }

  document.getElementById('btnSplitSave').addEventListener('click', function () {
    M.confirmGoogle({
      title: '保存创作者分成配置',
      message: '将影响全站打赏 / 订阅 / 付费内容结算比例，C 端收益页将同步读取。请输入谷歌验证码确认保存。',
      onVerified: function () {
        state.cfg = Split.saveConfig(collect());
        render();
        M.toast('创作者分成配置已保存，C 端已同步');
      }
    });
  });

  document.getElementById('btnSplitReset').addEventListener('click', function () {
    M.confirmGoogle({
      title: '恢复默认分成',
      message: '将清除本地自定义创作者分成配置。请输入谷歌验证码确认。',
      onVerified: function () {
        Split.resetConfig();
        render();
        M.toast('已恢复默认');
      }
    });
  });

  render();
})();
