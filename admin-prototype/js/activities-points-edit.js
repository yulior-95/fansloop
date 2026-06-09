(function () {
  var S = window.FLPointsActivityStore;
  var M = window.AdminModal;
  if (!S || !M) return;

  var form = document.getElementById('actForm');
  var params = new URLSearchParams(location.search);
  var editId = params.get('id');
  var act = editId ? S.getActivity(editId) : null;

  if (editId && !act) {
    M.toast('活动不存在');
    setTimeout(function () { location.href = 'activities-points-crud.html'; }, 800);
    return;
  }

  if (act) {
    document.getElementById('pageTitle').textContent = '编辑积分活动';
    document.getElementById('hdrMode').textContent = '编辑';
  }

  function fillTypeSelect() {
    var sel = document.getElementById('fldType');
    S.getTypes().forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.id;
      o.textContent = t.name + (t.builtin ? '' : '（自定义）');
      sel.appendChild(o);
    });
  }

  function fillMallCats() {
    var box = document.getElementById('mallCatChips');
    box.innerHTML = S.MALL_CATS.map(function (c) {
      return '<label><input type="checkbox" name="mallCats" value="' + c.id + '"> ' + c.label + '</label>';
    }).join('');
  }

  function renderTypeExtras(typeId) {
    var box = document.getElementById('typeExtraFields');
    var html = '';
    if (typeId === 'earn_task') {
      html = field('triggerMinutes', '触发时长（分钟）', 'number', '30') +
        field('freqPerDay', '每日次数上限', 'number', '3');
    } else if (typeId === 'earn_invite') {
      html = field('inviterPts', '邀请人积分', 'number', '200') +
        field('inviteePts', '被邀请人积分', 'number', '200') +
        field('riskReview', '需风控审核', 'checkbox', true);
    } else if (typeId === 'earn_checkin') {
      html = field('streakDays', '连续天数', 'number', '7') +
        field('ladder', '阶梯奖励 JSON', 'text', '10,20,30,50,70,85,100');
    } else if (typeId === 'redeem_goods') {
      html = field('stock', '库存（-1 不限）', 'number', '-1') +
        field('validDays', '兑换后有效天数', 'number', '1');
    } else if (typeId === 'custom_wheel') {
      html = field('spinCost', '单次消耗积分', 'number', '500') +
        field('dailySpins', '每日抽奖次数', 'number', '10');
    } else {
      html = '<div class="ap-field ap-field-full"><label>扩展配置 JSON</label>' +
        '<textarea class="ant-input" name="extraJson" rows="3" placeholder=\'{"key":"value"}\'></textarea></div>';
    }
    box.innerHTML = html;
  }

  function field(name, label, type, def) {
    if (type === 'checkbox') {
      return '<div class="ap-field"><label><input type="checkbox" name="' + name + '"' + (def ? ' checked' : '') + '> ' + label + '</label></div>';
    }
    return '<div class="ap-field"><label>' + label + '</label>' +
      '<input class="ant-input" name="' + name + '" type="' + type + '" value="' + (def != null ? def : '') + '"></div>';
  }

  function updatePreview() {
    var url = document.getElementById('fldImage').value.trim();
    var prev = document.getElementById('imgPreview');
    if (url) {
      prev.style.backgroundImage = "url('" + url + "')";
      prev.style.display = 'block';
    } else prev.style.display = 'none';
  }

  function populateForm() {
    if (!act) return;
    var fields = ['name', 'code', 'typeId', 'channel', 'status', 'sort', 'image', 'description',
      'rewardPoints', 'rewardDesc', 'freqDesc', 'dailyCap', 'totalCap', 'coolingDays'];
    fields.forEach(function (k) {
      var el = form.elements[k];
      if (el && act[k] != null) el.value = act[k];
    });
    if (act.mallCats) {
      form.querySelectorAll('input[name="mallCats"]').forEach(function (cb) {
        cb.checked = act.mallCats.indexOf(cb.value) >= 0;
      });
    }
    updatePreview();
    renderTypeExtras(act.typeId);
  }

  function collectForm(statusOverride) {
    var mallCats = [];
    form.querySelectorAll('input[name="mallCats"]:checked').forEach(function (cb) {
      mallCats.push(cb.value);
    });
    return {
      id: act ? act.id : S.uid(),
      name: form.name.value.trim(),
      code: form.code.value.trim().toUpperCase(),
      typeId: form.typeId.value,
      channel: form.channel.value,
      status: statusOverride || form.status.value,
      sort: parseInt(form.sort.value, 10) || 100,
      mallCats: mallCats,
      image: form.image.value.trim(),
      description: (form.description && form.description.value) || '',
      rewardPoints: parseInt(form.rewardPoints.value, 10) || 0,
      rewardDesc: form.rewardDesc.value.trim(),
      freqDesc: form.freqDesc.value.trim(),
      dailyCap: form.dailyCap.value ? parseInt(form.dailyCap.value, 10) : null,
      totalCap: form.totalCap.value ? parseInt(form.totalCap.value, 10) : null,
      coolingDays: parseInt(form.coolingDays.value, 10) || 0
    };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.name.value.trim() || !form.code.value.trim()) {
      M.toast('请填写名称与编码');
      return;
    }
    S.upsertActivity(collectForm());
    M.toast('活动已保存');
    setTimeout(function () { location.href = 'activities-points-crud.html'; }, 600);
  });

  document.getElementById('btnSaveDraft').addEventListener('click', function () {
    S.upsertActivity(collectForm('draft'));
    M.toast('已存为草稿');
    setTimeout(function () { location.href = 'activities-points-crud.html'; }, 600);
  });

  document.getElementById('fldType').addEventListener('change', function () {
    renderTypeExtras(this.value);
  });
  document.getElementById('fldImage').addEventListener('input', updatePreview);

  fillTypeSelect();
  fillMallCats();
  if (act) populateForm();
  else renderTypeExtras('earn_task');
})();
