/**
 * 运营后台 · 平台内容类别管理（三级类目树）
 * 数据源与前台共用 js-web/content-taxonomy-store.js，保存即对前台生效。
 */
(function () {
  var TX = window.FL_CONTENT_TAXONOMY;
  var M = window.AdminModal;
  if (!TX || !M) return;

  var esc = M.esc;
  var ICON_CHOICES = ['🔥', '☕', '🎨', '🎬', '💬', '💞', '🌌', '🌿', '💡', '🎧', '🎮', '🍜', '🧘', '🛍️', '🐾', '📚'];

  var tree = TX.getTree();
  var selected = { l1: null, l2: null, l3: null };
  var keyword = '';

  function persist(msg) {
    tree = TX.save(tree);
    if (msg) M.toast(msg);
    render();
  }

  function findIndex(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return i;
    }
    return -1;
  }

  function listAt(level) {
    if (level === 1) return tree;
    if (level === 2) {
      var l1 = selected.l1 && tree[findIndex(tree, selected.l1)];
      return l1 ? l1.children : null;
    }
    var parent1 = selected.l1 && tree[findIndex(tree, selected.l1)];
    if (!parent1) return null;
    var i2 = findIndex(parent1.children || [], selected.l2);
    return i2 < 0 ? null : parent1.children[i2].children;
  }

  function slugify(name, level) {
    var ascii = String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (ascii) return ascii;
    return 'cat-l' + level + '-' + Date.now().toString(36).slice(-5);
  }

  function idExists(id) {
    return !!TX.getPath(id) || !!collectIds()[id];
  }

  function collectIds() {
    var map = {};
    tree.forEach(function (a) {
      map[a.id] = 1;
      (a.children || []).forEach(function (b) {
        map[b.id] = 1;
        (b.children || []).forEach(function (c) { map[c.id] = 1; });
      });
    });
    return map;
  }

  function uniqueId(base) {
    var id = base;
    var n = 2;
    while (idExists(id)) {
      id = base + '-' + n;
      n++;
    }
    return id;
  }

  function matches(node) {
    if (!keyword) return true;
    var kw = keyword.toLowerCase();
    return node.name.toLowerCase().indexOf(kw) >= 0 || node.id.toLowerCase().indexOf(kw) >= 0;
  }

  /** 搜索时保留“自身或任一后代命中”的分支 */
  function branchMatches(node) {
    if (matches(node)) return true;
    return (node.children || []).some(branchMatches);
  }

  function switchHtml(node, level) {
    var on = node.enabled !== false;
    return (
      '<button type="button" role="switch" class="ant-switch ant-switch-small' + (on ? ' ant-switch-checked' : '') + '"' +
      ' data-cc-toggle="' + esc(node.id) + '" data-level="' + level + '" aria-checked="' + on + '"' +
      ' title="' + (on ? '点击停用' : '点击启用') + '"><div class="ant-switch-handle"></div></button>'
    );
  }

  function itemHtml(node, level, index, total) {
    var activeId = level === 1 ? selected.l1 : level === 2 ? selected.l2 : selected.l3;
    var cls = 'cc-item' + (node.id === activeId ? ' is-active' : '') + (node.enabled === false ? ' is-off' : '');
    var html = '<div class="' + cls + '" data-cc-item="' + esc(node.id) + '" data-level="' + level + '">';
    if (level === 1) html += '<span class="cc-item-icon">' + esc(node.icon || '📁') + '</span>';
    html +=
      '<span class="cc-item-main"><span class="cc-item-name">' + esc(node.name) + '</span>' +
      '<br><span class="cc-item-id">' + esc(node.id) + '</span></span>';
    if (node.system) html += '<span class="cc-item-lock">系统</span>';
    html +=
      '<span class="cc-item-ops">' +
      '<button type="button" class="cc-op-btn" data-cc-move="-1" title="上移"' + (index === 0 ? ' disabled' : '') + '><i class="fa-solid fa-arrow-up"></i></button>' +
      '<button type="button" class="cc-op-btn" data-cc-move="1" title="下移"' + (index === total - 1 ? ' disabled' : '') + '><i class="fa-solid fa-arrow-down"></i></button>' +
      '<button type="button" class="cc-op-btn" data-cc-edit="1" title="编辑"><i class="fa-solid fa-pen"></i></button>' +
      '<button type="button" class="cc-op-btn is-danger" data-cc-del="1" title="删除"' + (node.system ? ' disabled' : '') + '><i class="fa-solid fa-trash-can"></i></button>' +
      '</span>';
    html += switchHtml(node, level);
    if (level < 3) html += '<i class="fa-solid fa-chevron-right cc-arrow"></i>';
    return html + '</div>';
  }

  function emptyHtml(icon, text) {
    return '<div class="cc-empty"><i class="' + icon + '"></i>' + text + '</div>';
  }

  function renderColumn(elId, level) {
    var el = document.getElementById(elId);
    if (!el) return;
    var list = listAt(level);
    if (!list) {
      el.innerHTML = emptyHtml('fa-regular fa-hand-point-left', level === 2 ? '请先在左侧选择一级类目' : '请先选择二级类目');
      return;
    }
    var visible = list.filter(level === 3 ? matches : branchMatches);
    if (!visible.length) {
      el.innerHTML = emptyHtml('fa-regular fa-folder-open', keyword ? '没有匹配的类目' : '暂无类目，点击右上角「新增」');
      return;
    }
    el.innerHTML = visible
      .map(function (node) {
        return itemHtml(node, level, findIndex(list, node.id), list.length);
      })
      .join('');
  }

  function renderCrumb() {
    var el = document.getElementById('ccCrumb');
    if (!el) return;
    var parts = [];
    var l1 = selected.l1 && tree[findIndex(tree, selected.l1)];
    if (l1) parts.push('<b>' + esc(l1.icon || '') + ' ' + esc(l1.name) + '</b>');
    if (l1 && selected.l2) {
      var i2 = findIndex(l1.children || [], selected.l2);
      if (i2 >= 0) parts.push('<b>' + esc(l1.children[i2].name) + '</b>');
    }
    if (!parts.length) {
      el.innerHTML = '<i class="fa-solid fa-sitemap"></i> 当前位置：未选择，点击一级类目逐级展开';
      return;
    }
    var note = l1 && l1.system
      ? '<span class="cc-crumb-note"><i class="fa-solid fa-wand-magic-sparkles"></i> 该频道下的类目为推荐算法投放位，由算法按热度与新鲜度填充，创作者发布时不可选择</span>'
      : '';
    el.innerHTML = '<i class="fa-solid fa-sitemap"></i> 当前位置：' + parts.join(' <span>/</span> ') + note;
  }

  function normalizeSelection() {
    var i1 = selected.l1 ? findIndex(tree, selected.l1) : -1;
    if (i1 < 0) {
      selected.l1 = null;
      selected.l2 = null;
      selected.l3 = null;
      return;
    }
    var children = tree[i1].children || [];
    if (selected.l2 && findIndex(children, selected.l2) < 0) {
      selected.l2 = null;
      selected.l3 = null;
      return;
    }
    if (!selected.l2) {
      selected.l3 = null;
      return;
    }
    var grand = children[findIndex(children, selected.l2)].children || [];
    if (selected.l3 && findIndex(grand, selected.l3) < 0) selected.l3 = null;
  }

  function render() {
    normalizeSelection();
    renderCrumb();
    renderColumn('ccColL1', 1);
    renderColumn('ccColL2', 2);
    renderColumn('ccColL3', 3);
  }

  function openEditor(level, node) {
    var isNew = !node;
    var current = node || { name: '', id: '', icon: ICON_CHOICES[1], enabled: true };
    var levelName = level === 1 ? '一级' : level === 2 ? '二级' : '三级';
    var body =
      '<div class="cc-form-row"><label>类目名称 <span style="color:#ff4d4f">*</span></label>' +
      '<input class="ant-input" id="ccFormName" maxlength="12" placeholder="如：视觉美学" value="' + esc(current.name) + '"></div>' +
      '<div class="cc-form-row"><label>类目标识（英文 id）</label>' +
      '<input class="ant-input" id="ccFormId" placeholder="留空则按名称自动生成" value="' + esc(current.id) + '"' + (isNew ? '' : ' disabled') + '>' +
      '<p class="cc-form-tip">' + (isNew ? '创建后不可修改，内容归类以此为准。' : '已被内容引用，创建后不可修改。') + '</p></div>';
    if (level === 1) {
      body +=
        '<div class="cc-form-row"><label>展示图标（用户端 Tab）</label><div class="cc-icon-grid" id="ccFormIcons">' +
        ICON_CHOICES.map(function (ic) {
          return '<button type="button" data-icon="' + ic + '"' + (ic === current.icon ? ' class="is-active"' : '') + '>' + ic + '</button>';
        }).join('') +
        '</div></div>';
    }
    body +=
      '<div class="cc-form-row"><label>状态</label>' +
      '<label style="font-size:13px"><input type="checkbox" id="ccFormEnabled"' + (current.enabled !== false ? ' checked' : '') + '> 启用' +
      (level === 1 ? '（停用后发现页 Tab 与搜索筛选不再展示）' : '（停用后创作者不可选择）') +
      '</label></div>';

    var pickedIcon = current.icon;
    M.open({
      title: (isNew ? '新增' : '编辑') + levelName + '类目',
      body: body,
      width: 460,
      onMount: function (root) {
        var grid = root.querySelector('#ccFormIcons');
        if (grid) {
          grid.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-icon]');
            if (!btn) return;
            pickedIcon = btn.getAttribute('data-icon');
            grid.querySelectorAll('button').forEach(function (b) {
              b.classList.toggle('is-active', b === btn);
            });
          });
        }
        var nameInput = root.querySelector('#ccFormName');
        if (nameInput) nameInput.focus();
      },
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: '保存',
          primary: true,
          onClick: function () {
            var name = String(document.getElementById('ccFormName').value || '').trim();
            if (!name) {
              M.toast('请填写类目名称', 'warning');
              return;
            }
            var enabled = document.getElementById('ccFormEnabled').checked;
            if (isNew) {
              var rawId = String(document.getElementById('ccFormId').value || '').trim();
              var id = uniqueId(rawId ? slugify(rawId, level) : slugify(name, level));
              var created = { id: id, name: name, enabled: enabled };
              if (level === 1) {
                created.icon = pickedIcon;
                created.children = [];
                tree.push(created);
                selected.l1 = id;
                selected.l2 = null;
                selected.l3 = null;
              } else if (level === 2) {
                created.children = [];
                listAt(2).push(created);
                selected.l2 = id;
                selected.l3 = null;
              } else {
                listAt(3).push(created);
                selected.l3 = id;
              }
            } else {
              node.name = name;
              node.enabled = enabled;
              if (level === 1) node.icon = pickedIcon;
            }
            M.close();
            persist((isNew ? '已新增' : '已保存') + levelName + '类目「' + name + '」');
          }
        }
      ]
    });
  }

  function confirmDelete(level, node, list) {
    var hasChildren = (node.children || []).length > 0;
    M.open({
      title: '删除类目',
      width: 440,
      body:
        '<p style="margin:0 0 8px;font-size:14px">确认删除「<b>' + esc(node.name) + '</b>」？</p>' +
        (hasChildren
          ? '<p style="margin:0 0 8px;color:#ff4d4f;font-size:13px">该类目下仍有子级类目，删除后子级一并移除。</p>'
          : '') +
        '<p style="margin:0;color:rgba(0,0,0,.45);font-size:12px">已发布内容不会被删除，其归类将标记为待运营重新指定。</p>',
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: '确认删除',
          danger: true,
          onClick: function () {
            list.splice(findIndex(list, node.id), 1);
            if (level === 1) selected.l1 = null;
            if (level === 2) selected.l2 = null;
            if (level === 3) selected.l3 = null;
            M.close();
            persist('已删除类目「' + node.name + '」');
          }
        }
      ]
    });
  }

  function onColumnClick(e) {
    var itemEl = e.target.closest('[data-cc-item]');
    if (!itemEl) return;
    var level = parseInt(itemEl.getAttribute('data-level'), 10);
    var list = listAt(level);
    if (!list) return;
    var node = list[findIndex(list, itemEl.getAttribute('data-cc-item'))];
    if (!node) return;

    var toggle = e.target.closest('[data-cc-toggle]');
    if (toggle) {
      if (node.system && node.enabled !== false) {
        M.toast('热门为系统频道，不可停用', 'warning');
        return;
      }
      node.enabled = node.enabled === false;
      persist('「' + node.name + '」已' + (node.enabled ? '启用' : '停用'));
      return;
    }

    var moveBtn = e.target.closest('[data-cc-move]');
    if (moveBtn) {
      if (moveBtn.disabled) return;
      var from = findIndex(list, node.id);
      var to = from + parseInt(moveBtn.getAttribute('data-cc-move'), 10);
      if (to < 0 || to >= list.length) return;
      list.splice(to, 0, list.splice(from, 1)[0]);
      persist('排序已更新');
      return;
    }

    if (e.target.closest('[data-cc-edit]')) {
      openEditor(level, node);
      return;
    }

    var delBtn = e.target.closest('[data-cc-del]');
    if (delBtn) {
      if (delBtn.disabled) {
        M.toast('系统类目不可删除', 'warning');
        return;
      }
      confirmDelete(level, node, list);
      return;
    }

    if (level === 1) {
      selected.l1 = node.id;
      selected.l2 = null;
      selected.l3 = null;
    } else if (level === 2) {
      selected.l2 = node.id;
      selected.l3 = null;
    } else {
      selected.l3 = node.id;
    }
    render();
  }

  ['ccColL1', 'ccColL2', 'ccColL3'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', onColumnClick);
  });

  document.querySelectorAll('[data-cc-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var level = parseInt(btn.getAttribute('data-cc-add'), 10);
      if (level === 2 && !selected.l1) {
        M.toast('请先选择一级类目', 'warning');
        return;
      }
      if (level === 3 && !selected.l2) {
        M.toast('请先选择二级类目', 'warning');
        return;
      }
      openEditor(level, null);
    });
  });

  document.getElementById('btnCcAddL1')?.addEventListener('click', function () {
    openEditor(1, null);
  });

  document.getElementById('btnCcReset')?.addEventListener('click', function () {
    M.open({
      title: '恢复默认类目树',
      width: 420,
      body: '<p style="margin:0;font-size:14px">将丢弃全部自定义类目，恢复平台默认三级类目树，确认继续？</p>',
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: '确认恢复',
          danger: true,
          onClick: function () {
            tree = TX.reset();
            selected = { l1: null, l2: null, l3: null };
            M.close();
            M.toast('已恢复默认类目树');
            render();
          }
        }
      ]
    });
  });

  var searchEl = document.getElementById('ccSearch');
  if (searchEl) {
    searchEl.addEventListener('input', function () {
      keyword = String(searchEl.value || '').trim();
      render();
    });
  }

  selected.l1 = tree.length > 1 ? tree[1].id : tree[0] && tree[0].id;
  render();
})();
