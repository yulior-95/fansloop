/**
 * 成员账号页交互
 */
(function () {
  var M = window.AdminModal;
  var R = window.AdminRbac;
  var Auth = window.AdminGoogleAuth;
  var Session = window.FLAdminSession;
  if (!M || !R) return;

  var tbody = document.getElementById("membersTableBody");
  var pagerMount = document.getElementById("membersPager");
  var pager = null;
  var DEFAULT_PWD = (Auth && Auth.DEFAULT_PASSWORD) || "123456a";

  function isSuperAdmin() {
    if (Session && Session.getRole) {
      return Session.getRole() === "ROLE_ROOT";
    }
    return true;
  }

  function roleNameByCode(code) {
    for (var i = 0; i < R.ROLES.length; i++) {
      if (R.ROLES[i].code === code) return R.ROLES[i].name;
    }
    return code;
  }

  function statusHtml(status) {
    if (status === "disabled") {
      return '<span class="ant-badge ant-badge-status-text"><span class="admin-badge-dot" style="background:#d9d9d9"></span>禁用</span>';
    }
    return '<span class="ant-badge ant-badge-status-text"><span class="admin-badge-dot" style="background:#52c41a"></span>启用</span>';
  }

  function tagClass(code) {
    if (code === "ROLE_ROOT") return "ant-tag ant-tag-red";
    if (code === "ROLE_RISK") return "ant-tag ant-tag-orange";
    return "ant-tag";
  }

  var filterKeyword = document.getElementById("memFilterKeyword");
  var filterEmail = document.getElementById("memFilterEmail");
  var filterRole = document.getElementById("memFilterRole");
  var filterStatus = document.getElementById("memFilterStatus");

  function getFilteredMembers() {
    var kw = filterKeyword ? String(filterKeyword.value || "").trim().toLowerCase() : "";
    var email = filterEmail ? String(filterEmail.value || "").trim().toLowerCase() : "";
    var role = filterRole ? filterRole.value : "";
    var status = filterStatus ? filterStatus.value : "";
    return R.MEMBERS.filter(function (m) {
      if (role && m.roleCode !== role) return false;
      if (status && m.status !== status) return false;
      if (email && String(m.email || "").toLowerCase().indexOf(email) < 0) return false;
      if (kw) {
        var hit =
          String(m.account || "").toLowerCase().indexOf(kw) >= 0 ||
          String(m.name || "").toLowerCase().indexOf(kw) >= 0;
        if (!hit) return false;
      }
      return true;
    });
  }

  function renderTable() {
    if (!tbody) return;
    var members = getFilteredMembers();
    if (!members.length) {
      if (pager) pager.setTotal(0);
      tbody.innerHTML =
        '<tr><td colspan="9" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无成员</td></tr>';
      return;
    }
    if (pager) pager.setTotal(members.length);
    var pageMembers = pager ? pager.getSlice(members) : members;
    var startIdx = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
    var showSecret = isSuperAdmin();
    tbody.innerHTML = pageMembers.map(function (m, i) {
      var disableBtn =
        m.status === "disabled"
          ? '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-mem-enable">启用</button>'
          : '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-mem-disable">禁用</button>';
      var secretBtn = showSecret
        ? '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-mem-view-secret">查看谷歌密钥</button>'
        : "";
      return (
        "<tr data-account=\"" + R.esc(m.account) + "\">" +
        "<td class=\"admin-col-index\">" + (startIdx + i + 1) + "</td>" +
        "<td><div style=\"display:flex;align-items:center;gap:10px\">" +
        "<img src=\"" + R.esc(m.avatar) + "\" width=\"36\" height=\"36\" style=\"border-radius:50%;object-fit:cover\" alt=\"\"> " +
        R.esc(m.name || m.account) + "</div></td>" +
        "<td><code>" + R.esc(m.account) + "</code></td>" +
        "<td>" + (m.email ? R.esc(m.email) : "<span style='color:rgba(0,0,0,.25)'>—</span>") + "</td>" +
        "<td><span class=\"" + tagClass(m.roleCode) + "\">" + R.esc(m.role) + "</span></td>" +
        "<td>" + statusHtml(m.status) + "</td>" +
        "<td><code style='font-size:12px'>" + R.esc(m.ip) + "</code></td>" +
        "<td>" + R.esc(m.lastLogin) + "</td>" +
        "<td style=\"white-space:nowrap\">" +
        '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-mem-edit">编辑</button>' +
        secretBtn +
        disableBtn +
        "</td></tr>"
      );
    }).join("");
  }

  function findMember(account) {
    for (var i = 0; i < R.MEMBERS.length; i++) {
      if (R.MEMBERS[i].account === account) return R.MEMBERS[i];
    }
    return null;
  }

  function openViewSecretModal(m) {
    M.confirmGoogle({
      title: "查看谷歌密钥",
      message: "查看成员「" + (m.name || m.account) + "」的 TOTP 密钥属于敏感操作，需输入你的谷歌验证码。",
      onVerified: function () {
        var auth = Auth && Auth.getAuthForAccount ? Auth.getAuthForAccount(m.account) : null;
        var secret = auth && auth.secret;
        var secretFmt = secret && Auth.formatSecretBlocks ? Auth.formatSecretBlocks(secret) : "—";
        M.open({
          title: "谷歌验证密钥 · " + (m.name || m.account),
          body:
            "<p style='margin:0 0 12px'>账号：<code>" + R.esc(m.account) + "</code></p>" +
            '<div class="admin-mem-secret-box" style="margin:0">' +
            '<strong><i class="fa-brands fa-google"></i> TOTP 密钥</strong><br>' +
            '<code style="font-size:14px;letter-spacing:.08em">' + R.esc(secretFmt) + "</code>" +
            '<div style="margin-top:8px;color:rgba(0,0,0,.45)">' +
            "请通过安全渠道告知成员，勿在公开渠道传播。" +
            "</div></div>",
          footer: [{ text: "关闭", primary: true, onClick: M.close }]
        });
      }
    });
  }

  function openMemberModal(opts) {
    opts = opts || {};
    var isEdit = !!opts.edit;
    var m = opts.member || {};
    var secret = "";
    var secretFmt = "";
    if (!isEdit && Auth) {
      secret = Auth.generateSecret();
      secretFmt = Auth.formatSecretBlocks(secret);
    }

    M.open({
      title: isEdit ? "编辑成员 · " + (m.name || m.account) : "新建成员",
      body: R.renderMemberForm({
        edit: isEdit,
        member: m,
        secret: secret,
        secretFmt: secretFmt
      }),
      footer: [
        { text: "取消", onClick: M.close },
        {
          text: isEdit ? "保存" : "创建",
          primary: true,
          onClick: function () {
            var data = R.readMemberForm();
            var err = R.validateMemberForm(data, isEdit);
            if (err) {
              M.toast(err);
              return;
            }
            if (isEdit) {
              M.confirmGoogle({
                message: "保存成员信息（含角色与 IP）需谷歌验证。",
                onVerified: function () {
                  m.ip = data.ip.trim();
                  m.roleCode = data.roleCode;
                  m.role = roleNameByCode(data.roleCode);
                  m.status = data.status;
                  m.email = data.email.trim();
                  m.name = data.name.trim() || m.account;
                  if (Auth && Auth.assignMemberAuth) {
                    Auth.assignMemberAuth(m.account, {
                      name: m.name,
                      email: m.email,
                      secret: (Auth.getAuthForAccount(m.account) || {}).secret
                    });
                  }
                  renderTable();
                  M.toast("成员信息已保存（原型）");
                }
              });
            } else {
              var exists = false;
              for (var j = 0; j < R.MEMBERS.length; j++) {
                if (R.MEMBERS[j].account === data.account.trim()) {
                  exists = true;
                  break;
                }
              }
              if (exists) {
                M.toast("账号已存在");
                return;
              }
              var account = data.account.trim();
              var row = {
                account: account,
                name: data.name.trim() || account,
                email: data.email.trim(),
                roleCode: data.roleCode,
                role: roleNameByCode(data.roleCode),
                status: data.status,
                ip: data.ip.trim(),
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
                lastLogin: "—"
              };
              R.MEMBERS.push(row);
              if (Auth && Auth.assignMemberAuth) {
                Auth.assignMemberAuth(account, {
                  secret: secret,
                  name: row.name,
                  email: row.email,
                  password: DEFAULT_PWD
                });
              }
              renderTable();
              M.close();
              M.toast("成员创建成功，初始登录密码：" + DEFAULT_PWD + "（原型）");
            }
          }
        }
      ]
    });
  }

  var FT = window.AdminFilterToolbar;
  if (FT) {
    FT.onQuery("btnQueryMembers", function () {
      if (pager) pager.resetPage();
      renderTable();
      M.toast("已查询 " + getFilteredMembers().length + " 条");
    });
    FT.onReset("btnResetMembers", function () {
      if (pager) pager.resetPage();
      renderTable();
    });
  }

  document.getElementById("btnNewMember").addEventListener("click", function () {
    openMemberModal({ edit: false });
  });

  if (tbody) {
    tbody.addEventListener("click", function (e) {
      var t = e.target;
      var tr = t.closest("tr");
      if (!tr || !tr.getAttribute("data-account")) return;
      var account = tr.getAttribute("data-account");
      var m = findMember(account);
      if (!m) return;

      if (t.classList.contains("js-mem-edit")) {
        openMemberModal({ edit: true, member: m });
      } else if (t.classList.contains("js-mem-view-secret")) {
        openViewSecretModal(m);
      } else if (t.classList.contains("js-mem-disable")) {
        M.confirmGoogle({
          title: "禁用成员",
          message: "禁用后账号「" + account + "」无法登录后台。",
          onVerified: function () {
            m.status = "disabled";
            renderTable();
            M.toast("成员已禁用（原型）");
          }
        });
      } else if (t.classList.contains("js-mem-enable")) {
        M.open({
          title: "启用成员",
          body: "<p style='margin:0'>确认恢复账号 <strong>" + R.esc(account) + "</strong> 的登录权限？</p>",
          footer: [
            { text: "取消", onClick: M.close },
            {
              text: "确认启用",
              primary: true,
              onClick: function () {
                m.status = "enabled";
                renderTable();
                M.close();
                M.toast("成员已启用（原型）");
              }
            }
          ]
        });
      }
    });
  }

  if (Session && Session.mountRoleSwitcher) {
    var userNode = document.querySelector(".admin-header-user");
    if (userNode) Session.mountRoleSwitcher(userNode);
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
