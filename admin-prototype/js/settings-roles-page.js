/**
 * 角色管理页交互
 */
(function () {
  var M = window.AdminModal;
  var R = window.AdminRbac;
  if (!M || !R) return;

  var tbody = document.getElementById("rolesTableBody");
  var pagerMount = document.getElementById("rolesPager");
  var pager = null;

  function renderTable() {
    if (!tbody) return;
    var roles = R.ROLES.slice();
    if (!roles.length) {
      if (pager) pager.setTotal(0);
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无角色</td></tr>';
      return;
    }
    if (pager) pager.setTotal(roles.length);
    var pageRoles = pager ? pager.getSlice(roles) : roles;
    tbody.innerHTML = pageRoles.map(function (role) {
      var ops =
        '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-role-perm">权限</button>' +
        '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-role-edit">编辑</button>';
      if (!role.builtin) {
        ops += '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-role-del" style="color:#ff4d4f">删除</button>';
      }
      return (
        "<tr data-code=\"" + R.esc(role.code) + "\" data-name=\"" + R.esc(role.name) + "\">" +
        "<td>" + R.esc(role.name) + "</td>" +
        "<td>" + R.esc(role.created) + "</td>" +
        "<td>" + R.esc(role.updated) + "</td>" +
        "<td>" + ops + "</td></tr>"
      );
    }).join("");
  }

  function openPermModal(tr) {
    var code = tr.getAttribute("data-code");
    var name = tr.getAttribute("data-name");
    var defaults = R.ROLE_DEFAULT_PERMS[code];
    var checked = defaults === null ? R.allPermIds() : defaults || [];

    M.open({
      title: "功能权限 · " + name,
      wide: true,
      body: R.renderPermTree(checked, code, name),
      footer: [
        { text: "取消", onClick: M.close },
        {
          text: "保存权限",
          primary: true,
          onClick: function () {
            if (code === "ROLE_ROOT") {
              M.close();
              return;
            }
            M.confirmGoogle({
              title: "确认保存权限",
              message: "保存后将影响所有拥有该角色的成员，需谷歌验证。",
              onVerified: function () {
                var remark = document.getElementById("permRemark");
                M.toast("权限已保存" + (remark && remark.value.trim() ? "，备注已写入操作日志" : "") + "（原型）");
              }
            });
          }
        }
      ],
      onMount: function (body) {
        var tree = body.querySelector("#adminPermTreeRoot");
        R.wirePermTree(tree);
      }
    });
  }

  function openEditModal(tr) {
    var code = tr.getAttribute("data-code");
    var name = tr.getAttribute("data-name");
    var role = R.ROLES.find(function (r) { return r.code === code; });
    var readonly = role && role.builtin;
    M.open({
      title: "编辑角色",
      body:
        "<div style='max-width:420px'>" +
        "<label style='display:block;margin-bottom:6px'>角色名称</label>" +
        "<input class='ant-input' id='roleEditName' style='width:100%;margin-bottom:12px' value='" +
        R.esc(name) +
        "'" +
        (readonly ? " disabled" : "") +
        ">" +
        (readonly ? "<p style='margin:0;font-size:12px;color:rgba(0,0,0,.45)'>系统内置角色不可改名。</p>" : "") +
        "</div>",
      footer: [
        { text: "取消", onClick: M.close },
        {
          text: "保存",
          primary: true,
          onClick: function () {
            if (readonly) {
              M.close();
              return;
            }
            M.confirmGoogle({
              message: "确认保存角色信息？",
              onVerified: function () {
                if (role) role.name = document.getElementById("roleEditName").value.trim() || role.name;
                renderTable();
                M.toast("角色已更新（原型）");
              }
            });
          }
        }
      ]
    });
  }

  document.getElementById("btnHelpRoles").addEventListener("click", function () {
    M.open({
      title: "角色管理帮助",
      body:
        "<ul style='margin:0;padding-left:18px;line-height:1.7'>" +
        "<li>权限按 <strong>一级菜单 → 二级菜单 → 功能操作</strong> 三级组织</li>" +
        "<li>支持全选 / 全不选快捷操作</li>" +
        "<li>删除与权限变更需谷歌验证</li>" +
        "</ul>",
      footer: [{ text: "知道了", primary: true, onClick: M.close }]
    });
  });

  document.getElementById("btnNewRole").addEventListener("click", function () {
    M.open({
      title: "新建角色",
      body:
        "<label style='display:block;margin-bottom:6px'>角色名称</label>" +
        "<input class='ant-input' id='roleNewName' style='width:100%;max-width:400px;margin-bottom:12px' placeholder='例如：客服'>" +
        "<label style='display:block;margin-bottom:6px'>角色编码</label>" +
        "<input class='ant-input' id='roleNewCode' style='width:100%;max-width:400px' placeholder='例如：ROLE_CS'>",
      footer: [
        { text: "取消", onClick: M.close },
        {
          text: "创建并配置权限",
          primary: true,
          onClick: function () {
            var n = (document.getElementById("roleNewName").value || "").trim();
            var c = (document.getElementById("roleNewCode").value || "").trim();
            if (!n || !c) {
              M.toast("请填写角色名称与编码");
              return;
            }
            R.ROLES.push({
              code: c,
              name: n,
              created: new Date().toISOString().slice(0, 16).replace("T", " "),
              updated: new Date().toISOString().slice(0, 16).replace("T", " "),
              builtin: false
            });
            R.ROLE_DEFAULT_PERMS[c] = [];
            renderTable();
            M.close();
            M.toast("角色已创建，请点击「权限」继续配置（原型）");
          }
        }
      ]
    });
  });

  document.getElementById("btnRefreshRoles").addEventListener("click", function () {
    renderTable();
    M.toast("列表已刷新（原型）");
  });

  if (tbody) {
    tbody.addEventListener("click", function (e) {
      var t = e.target;
      var tr = t.closest("tr");
      if (!tr || !tr.getAttribute("data-code")) return;
      if (t.classList.contains("js-role-perm")) openPermModal(tr);
      else if (t.classList.contains("js-role-edit")) openEditModal(tr);
      else if (t.classList.contains("js-role-del")) {
        M.confirmGoogle({
          title: "删除角色",
          message: "删除后不可恢复，绑定成员需先迁移角色。角色：" + tr.getAttribute("data-name"),
          onVerified: function () {
            var code = tr.getAttribute("data-code");
            R.ROLES = R.ROLES.filter(function (r) { return r.code !== code; });
            renderTable();
            M.toast("角色已删除（原型）");
          }
        });
      }
    });
  }

  if (pagerMount && window.AdminPager) {
    pager = window.AdminPager.create({
      mount: pagerMount,
      pageSize: 10,
      onChange: function () {
        renderTable();
      }
    });
  }

  renderTable();
})();
