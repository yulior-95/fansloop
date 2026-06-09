(function () {
  var S = window.FLPointsActivityStore;
  var M = window.AdminModal;
  if (!S || !M) return;

  function esc(s) { return M.esc(s); }

  function typeEditorBody(t) {
    t = t || { id: '', name: '', icon: 'fa-star', schema: '', builtin: false };
    return (
      '<div style="max-width:480px">' +
      '<label style="display:block;margin-bottom:6px;font-size:13px">类型名称 <span style="color:#ff4d4f">*</span></label>' +
      '<input class="ant-input" id="teName" value="' + esc(t.name) + '" style="width:100%;margin-bottom:12px">' +
      '<label style="display:block;margin-bottom:6px;font-size:13px">类型 ID <span style="color:#ff4d4f">*</span></label>' +
      '<input class="ant-input" id="teId" value="' + esc(t.id) + '" style="width:100%;font-family:monospace;margin-bottom:12px"' +
      (t.builtin ? ' readonly' : '') + '>' +
      '<label style="display:block;margin-bottom:6px;font-size:13px">图标（FontAwesome）</label>' +
      '<input class="ant-input" id="teIcon" value="' + esc(t.icon || 'fa-star') + '" style="width:100%;margin-bottom:12px">' +
      '<label style="display:block;margin-bottom:6px;font-size:13px">Schema 字段（逗号分隔）</label>' +
      '<input class="ant-input" id="teSchema" value="' + esc(t.schema) + '" style="width:100%;margin-bottom:8px" placeholder="reward_points,daily_cap,cooling_days">' +
      '<p style="margin:0;font-size:11px;color:rgba(0,0,0,.45)">创建活动时根据 schema 渲染扩展表单项</p>' +
      '</div>'
    );
  }

  function render() {
    var tbody = document.getElementById('typeTbody');
    var list = S.getTypes();
    tbody.innerHTML = list.map(function (t) {
      return '<tr data-id="' + esc(t.id) + '">' +
        '<td><div class="ap-type-card"><div class="ic"><i class="fa-solid ' + esc(t.icon || 'fa-star') + '"></i></div>' +
        '<div><strong>' + esc(t.name) + '</strong></div></div></td>' +
        '<td><code>' + esc(t.id) + '</code></td>' +
        '<td><span class="ap-schema-code">' + esc(t.schema || '—') + '</span></td>' +
        '<td>' + (t.builtin ? '<span class="ant-tag ant-tag-blue">内置</span>' : '<span class="ant-tag ant-tag-purple">自定义</span>') + '</td>' +
        '<td>' +
        '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-edit">编辑</button>' +
        (t.builtin ? '' : '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-del" style="color:#ff4d4f">删除</button>') +
        '</td></tr>';
    }).join('');
  }

  function openEditor(existing) {
    var isEdit = !!existing;
    M.open({
      title: isEdit ? '编辑活动类型' : '新增活动类型',
      wide: true,
      body: typeEditorBody(existing),
      footer: [
        { text: '取消', onClick: M.close },
        { text: '保存', primary: true, onClick: function () {
          var name = document.getElementById('teName').value.trim();
          var id = document.getElementById('teId').value.trim();
          var icon = document.getElementById('teIcon').value.trim() || 'fa-star';
          var schema = document.getElementById('teSchema').value.trim();
          if (!name || !id) { M.toast('请填写名称与 ID'); return; }
          var list = S.getTypes();
          if (!isEdit && list.some(function (x) { return x.id === id; })) {
            M.toast('ID 已存在'); return;
          }
          var row = { id: id, name: name, icon: icon, schema: schema, builtin: false };
          if (isEdit) {
            for (var i = 0; i < list.length; i++) {
              if (list[i].id === existing.id) {
                if (existing.builtin) row.builtin = true;
                list[i] = row;
                break;
              }
            }
          } else list.push(row);
          S.saveTypes(list);
          M.close();
          M.toast('类型已保存');
          render();
        }}
      ]
    });
  }

  document.getElementById('btnNewType').addEventListener('click', function () {
    openEditor(null);
  });

  document.getElementById('typeTbody').addEventListener('click', function (e) {
    var tr = e.target.closest('tr');
    if (!tr) return;
    var id = tr.getAttribute('data-id');
    var t = S.getTypes().filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    if (e.target.classList.contains('js-edit')) openEditor(t);
    if (e.target.classList.contains('js-del') && !t.builtin) {
      M.open({
        title: '删除类型',
        body: '<p style="margin:0">删除后使用该类型的活动需先迁移类型。</p>',
        footer: [
          { text: '取消', onClick: M.close },
          { text: '删除', danger: true, onClick: function () {
            S.saveTypes(S.getTypes().filter(function (x) { return x.id !== id; }));
            M.close();
            M.toast('已删除');
            render();
          }}
        ]
      });
    }
  });

  render();
})();
