/**
 * 系统设置 · 角色 / 成员 / 权限树 共享数据与 UI
 */
(function (global) {
  var PERM_TREE = [
    {
      id: "user",
      label: "用户管理",
      children: [
        {
          id: "user-list",
          label: "用户列表",
          ops: [
            { id: "user-list-view", label: "查看" },
            { id: "user-list-edit", label: "编辑" },
            { id: "user-list-reset", label: "重置密码" },
            { id: "user-list-disable-wallet", label: "禁用钱包" },
            { id: "user-list-export", label: "导出" }
          ]
        },
        {
          id: "user-assets",
          label: "用户资产",
          ops: [
            { id: "user-assets-view", label: "查看" },
            { id: "user-assets-export", label: "导出" }
          ]
        },
        {
          id: "user-kyc",
          label: "KYC 审核",
          ops: [
            { id: "user-kyc-view", label: "查看" },
            { id: "user-kyc-approve", label: "通过" },
            { id: "user-kyc-reject", label: "驳回" }
          ]
        }
      ]
    },
    {
      id: "order",
      label: "订单管理",
      children: [
        {
          id: "order-recharge",
          label: "充值订单",
          ops: [
            { id: "order-recharge-view", label: "查看" },
            { id: "order-recharge-export", label: "导出" }
          ]
        },
        {
          id: "order-withdraw",
          label: "提现订单",
          ops: [
            { id: "order-withdraw-view", label: "查看" },
            { id: "order-withdraw-force-fail", label: "强制失败" },
            { id: "order-withdraw-export", label: "导出" }
          ]
        }
      ]
    },
    {
      id: "risk",
      label: "风控中心",
      children: [
        {
          id: "risk-speech",
          label: "异常发言",
          ops: [
            { id: "risk-speech-view", label: "查看" },
            { id: "risk-speech-mute", label: "禁言" },
            { id: "risk-speech-export", label: "导出" }
          ]
        },
        {
          id: "risk-limits",
          label: "限额策略",
          ops: [
            { id: "risk-limits-view", label: "查看" },
            { id: "risk-limits-edit", label: "编辑" }
          ]
        }
      ]
    },
    {
      id: "settings",
      label: "系统设置",
      children: [
        {
          id: "settings-roles",
          label: "角色管理",
          ops: [
            { id: "settings-roles-view", label: "查看" },
            { id: "settings-roles-edit", label: "编辑" },
            { id: "settings-roles-delete", label: "删除" }
          ]
        },
        {
          id: "settings-members",
          label: "成员账号",
          ops: [
            { id: "settings-members-view", label: "查看" },
            { id: "settings-members-create", label: "创建" },
            { id: "settings-members-edit", label: "编辑" },
            { id: "settings-members-disable", label: "禁用" }
          ]
        },
        {
          id: "settings-logs",
          label: "操作日志",
          ops: [
            { id: "settings-logs-view", label: "查看" },
            { id: "settings-logs-export", label: "导出" }
          ]
        }
      ]
    }
  ];

  var ROLE_DEFAULT_PERMS = {
    ROLE_ROOT: null,
    ROLE_OPS: [
      "user-list-view", "user-list-edit", "user-list-export",
      "order-recharge-view", "order-recharge-export",
      "order-withdraw-view", "order-withdraw-export",
      "settings-logs-view"
    ],
    ROLE_RISK: [
      "user-list-view",
      "risk-speech-view", "risk-speech-mute", "risk-speech-export",
      "risk-limits-view", "risk-limits-edit"
    ]
  };

  var ROLES = [
    { code: "ROLE_ROOT", name: "超级管理员", created: "2024-08-01 10:00", updated: "2026-05-10 18:02", builtin: true },
    { code: "ROLE_OPS", name: "运营", created: "2024-09-12 14:20", updated: "2026-05-09 11:20", builtin: false },
    { code: "ROLE_RISK", name: "风控", created: "2024-10-05 09:15", updated: "2026-05-08 09:41", builtin: false }
  ];

  var MEMBERS = [
    {
      account: "wangyi",
      name: "王一",
      email: "wangyi@fansloop.io",
      role: "运营",
      roleCode: "ROLE_OPS",
      status: "enabled",
      ip: "203.0.113.8",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      lastLogin: "2026-05-11 09:12"
    },
    {
      account: "limin",
      name: "李敏",
      email: "limin@fansloop.io",
      role: "风控",
      roleCode: "ROLE_RISK",
      status: "enabled",
      ip: "198.51.100.2",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
      lastLogin: "2026-05-10 21:40"
    },
    {
      account: "chenchen",
      name: "陈晨",
      email: "chenchen@fansloop.io",
      role: "超级管理员",
      roleCode: "ROLE_ROOT",
      status: "disabled",
      ip: "192.0.2.88",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
      lastLogin: "2026-04-02 08:01"
    }
  ];

  var OPERATION_LOGS = [
    {
      time: "2026-05-11 10:22:01",
      operator: "wangyi",
      operatorEmail: "wangyi@fansloop.io",
      module: "用户管理",
      submodule: "用户列表",
      action: "重置密码",
      target: "UID 882910",
      ip: "203.0.113.8",
      result: "success",
      requestId: "req_8f3a2c91",
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0"
    },
    {
      time: "2026-05-11 10:18:44",
      operator: "limin",
      operatorEmail: "limin@fansloop.io",
      module: "风控中心",
      submodule: "异常发言",
      action: "禁言 24h",
      target: "UID 102938",
      ip: "198.51.100.2",
      result: "success",
      requestId: "req_7e2b1d80",
      ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    },
    {
      time: "2026-05-11 09:55:12",
      operator: "admin",
      operatorEmail: "admin@fansloop.io",
      module: "系统设置",
      submodule: "角色管理",
      action: "更新权限",
      target: "ROLE_OPS",
      ip: "192.0.2.10",
      result: "success",
      requestId: "req_6d1c0a72",
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/124.0"
    },
    {
      time: "2026-05-11 09:12:00",
      operator: "chenchen",
      operatorEmail: "chenchen@fansloop.io",
      module: "登录",
      submodule: "后台登录",
      action: "登录失败",
      target: "—",
      ip: "192.0.2.88",
      result: "fail",
      requestId: "req_5c0b9f61",
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0"
    },
    {
      time: "2026-05-11 08:40:33",
      operator: "wangyi",
      operatorEmail: "wangyi@fansloop.io",
      module: "系统设置",
      submodule: "成员账号",
      action: "创建成员",
      target: "account: ops_zhang",
      ip: "203.0.113.8",
      result: "success",
      requestId: "req_4b0a8e50",
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0"
    }
  ];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function allPermIds() {
    var ids = [];
    PERM_TREE.forEach(function (l1) {
      l1.children.forEach(function (l2) {
        l2.ops.forEach(function (op) {
          ids.push(op.id);
        });
      });
    });
    return ids;
  }

  function countL2Ops(l2, checked, isRoot) {
    var total = l2.ops.length;
    var hit = 0;
    if (isRoot) return { total: total, hit: total };
    l2.ops.forEach(function (op) {
      if (checked.indexOf(op.id) >= 0) hit++;
    });
    return { total: total, hit: hit };
  }

  function countL1Ops(l1, checked, isRoot) {
    var total = 0;
    var hit = 0;
    l1.children.forEach(function (l2) {
      var c = countL2Ops(l2, checked, isRoot);
      total += c.total;
      hit += c.hit;
    });
    return { total: total, hit: hit };
  }

  function parentCbAttrs(total, hit, isRoot) {
    if (isRoot) return " checked disabled";
    if (total > 0 && hit === total) return " checked";
    return "";
  }

  function renderPermTree(checkedIds, roleCode, roleName) {
    var checked = checkedIds || [];
    var isRoot = roleCode === "ROLE_ROOT";
    var toolbarDisabled = isRoot ? " disabled" : "";
    var html =
      '<div class="admin-perm-role-hd">角色：<strong>' +
      esc(roleName) +
      "</strong>" +
      (isRoot ? ' <span class="ant-tag ant-tag-red" style="margin-left:6px">内置全权限</span>' : "") +
      "</div>" +
      '<div class="admin-perm-toolbar" id="permToolbar">' +
      '<button type="button" class="ant-btn ant-btn-sm" data-perm-action="select-all"' + toolbarDisabled + '><i class="fa-solid fa-check-double"></i> 全选</button>' +
      '<button type="button" class="ant-btn ant-btn-sm" data-perm-action="select-none"' + toolbarDisabled + '><i class="fa-regular fa-square"></i> 全不选</button>' +
      '<span class="perm-select-stat" id="permSelectStat">已选 <strong>0</strong> / 0</span>' +
      "</div>" +
      '<div class="admin-perm-tree" id="adminPermTreeRoot">';

    PERM_TREE.forEach(function (l1) {
      var l1c = countL1Ops(l1, checked, isRoot);
      html += '<div class="admin-perm-l1" data-l1="' + l1.id + '">';
      html +=
        '<div class="admin-perm-l1-hd"><label><input type="checkbox" class="perm-l1-cb" data-l1="' +
        l1.id +
        '"' +
        parentCbAttrs(l1c.total, l1c.hit, isRoot) +
        "> " +
        esc(l1.label) +
        "</label></div>";
      l1.children.forEach(function (l2) {
        var l2c = countL2Ops(l2, checked, isRoot);
        html += '<div class="admin-perm-l2" data-l2="' + l2.id + '" data-l1="' + l1.id + '">';
        html +=
          '<div class="admin-perm-l2-title"><label><input type="checkbox" class="perm-l2-cb" data-l2="' +
          l2.id +
          '" data-l1="' +
          l1.id +
          '"' +
          parentCbAttrs(l2c.total, l2c.hit, isRoot) +
          "> " +
          esc(l2.label) +
          "</label></div>";
        html += '<div class="admin-perm-ops">';
        l2.ops.forEach(function (op) {
          var on = isRoot || checked.indexOf(op.id) >= 0;
          html +=
            '<label class="' + (on ? "is-checked" : "is-unchecked") + '"><input type="checkbox" class="perm-op-cb" data-op="' +
            op.id +
            '" data-l2="' +
            l2.id +
            '" data-l1="' +
            l1.id +
            '"' +
            (on ? " checked" : "") +
            (isRoot ? " disabled" : "") +
            "> " +
            esc(op.label) +
            "</label>";
        });
        html += "</div></div>";
      });
      html += "</div>";
    });

    html +=
      '</div><div class="admin-perm-remark"><label>备注</label><textarea id="permRemark" placeholder="记录本次权限变更原因，将写入操作日志（选填）" maxlength="200"></textarea></div>';
    return html;
  }

  function setChildrenChecked(root, l1Id, l2Id, on) {
    var sel = ".perm-op-cb:not(:disabled)";
    if (l2Id) sel = '.perm-op-cb[data-l2="' + l2Id + '"]:not(:disabled)';
    else if (l1Id) sel = '.perm-op-cb[data-l1="' + l1Id + '"]:not(:disabled)';
    root.querySelectorAll(sel).forEach(function (cb) {
      cb.checked = on;
    });
  }

  function wirePermTree(root) {
    if (!root) return;

    function syncL2(l2Id) {
      var ops = root.querySelectorAll('.perm-op-cb[data-l2="' + l2Id + '"]:not(:disabled)');
      var l2cb = root.querySelector('.perm-l2-cb[data-l2="' + l2Id + '"]');
      if (!l2cb || l2cb.disabled) return;
      var total = ops.length;
      var hit = 0;
      ops.forEach(function (cb) {
        if (cb.checked) hit++;
      });
      l2cb.checked = total > 0 && hit === total;
      l2cb.indeterminate = hit > 0 && hit < total;
    }

    function syncL1(l1Id) {
      var l1cb = root.querySelector('.perm-l1-cb[data-l1="' + l1Id + '"]');
      if (!l1cb || l1cb.disabled) return;
      var ops = root.querySelectorAll('.perm-op-cb[data-l1="' + l1Id + '"]:not(:disabled)');
      var total = ops.length;
      var hit = 0;
      ops.forEach(function (cb) {
        if (cb.checked) hit++;
      });
      l1cb.checked = total > 0 && hit === total;
      l1cb.indeterminate = hit > 0 && hit < total;
    }

    function syncAllFromOps() {
      root.querySelectorAll(".admin-perm-l2[data-l2]").forEach(function (el) {
        syncL2(el.getAttribute("data-l2"));
      });
      root.querySelectorAll(".admin-perm-l1[data-l1]").forEach(function (el) {
        syncL1(el.getAttribute("data-l1"));
      });
    }

    function refreshVisualState() {
      root.querySelectorAll(".admin-perm-ops label").forEach(function (label) {
        var cb = label.querySelector("input.perm-op-cb");
        if (!cb) return;
        label.classList.toggle("is-checked", cb.checked);
        label.classList.toggle("is-unchecked", !cb.checked);
      });

      root.querySelectorAll(".admin-perm-l2[data-l2]").forEach(function (l2) {
        var l2cb = l2.querySelector(".perm-l2-cb");
        if (!l2cb) return;
        l2.classList.toggle("is-checked", l2cb.checked && !l2cb.indeterminate);
        l2.classList.toggle("is-partial", l2cb.indeterminate);
        l2.classList.toggle("is-unchecked", !l2cb.checked && !l2cb.indeterminate);
      });

      root.querySelectorAll(".admin-perm-l1[data-l1]").forEach(function (l1) {
        var l1cb = l1.querySelector(".perm-l1-cb");
        if (!l1cb) return;
        l1.classList.toggle("is-checked", l1cb.checked && !l1cb.indeterminate);
        l1.classList.toggle("is-partial", l1cb.indeterminate);
        l1.classList.toggle("is-unchecked", !l1cb.checked && !l1cb.indeterminate);
      });

      var toolbar = root.previousElementSibling;
      if (!toolbar || !toolbar.classList.contains("admin-perm-toolbar")) return;
      var total = root.querySelectorAll(".perm-op-cb:not(:disabled)").length;
      var checkedCount = root.querySelectorAll(".perm-op-cb:not(:disabled):checked").length;
      var stat = toolbar.querySelector("#permSelectStat");
      if (stat) {
        stat.innerHTML = "已选 <strong>" + checkedCount + "</strong> / " + total;
      }
      var btnAll = toolbar.querySelector('[data-perm-action="select-all"]');
      var btnNone = toolbar.querySelector('[data-perm-action="select-none"]');
      if (btnAll) btnAll.classList.toggle("is-active", total > 0 && checkedCount === total);
      if (btnNone) btnNone.classList.toggle("is-active", total > 0 && checkedCount === 0);
    }

    function afterChange() {
      syncAllFromOps();
      refreshVisualState();
    }

    function setAllOps(on) {
      root.querySelectorAll(".perm-op-cb:not(:disabled)").forEach(function (cb) {
        cb.checked = on;
      });
      afterChange();
    }

    root.addEventListener("change", function (e) {
      var t = e.target;
      if (!t.classList.contains("perm-op-cb") && !t.classList.contains("perm-l2-cb") && !t.classList.contains("perm-l1-cb")) {
        return;
      }

      if (t.classList.contains("perm-l1-cb")) {
        t.indeterminate = false;
        setChildrenChecked(root, t.getAttribute("data-l1"), null, t.checked);
      } else if (t.classList.contains("perm-l2-cb")) {
        t.indeterminate = false;
        setChildrenChecked(root, null, t.getAttribute("data-l2"), t.checked);
      }

      afterChange();
    });

    var toolbar = root.previousElementSibling;
    if (toolbar && toolbar.classList.contains("admin-perm-toolbar")) {
      var btnAll = toolbar.querySelector('[data-perm-action="select-all"]');
      var btnNone = toolbar.querySelector('[data-perm-action="select-none"]');
      if (btnAll) {
        btnAll.addEventListener("click", function (e) {
          e.preventDefault();
          if (btnAll.disabled) return;
          setAllOps(true);
        });
      }
      if (btnNone) {
        btnNone.addEventListener("click", function (e) {
          e.preventDefault();
          if (btnNone.disabled) return;
          setAllOps(false);
        });
      }
    }

    afterChange();
  }

  function collectPermIds(root) {
    var ids = [];
    if (!root) return ids;
    root.querySelectorAll(".perm-op-cb:checked").forEach(function (cb) {
      ids.push(cb.getAttribute("data-op"));
    });
    return ids;
  }

  function roleOptionsHtml(selectedCode) {
    return ROLES.map(function (r) {
      return (
        '<option value="' +
        esc(r.code) +
        '"' +
        (r.code === selectedCode ? " selected" : "") +
        ">" +
        esc(r.name) +
        "</option>"
      );
    }).join("");
  }

  function renderMemberForm(opts) {
    opts = opts || {};
    var isEdit = !!opts.edit;
    var m = opts.member || {};
    var secret = opts.secret || "";
    var secretFmt = opts.secretFmt || secret;

    var html = '<div class="admin-mem-form">';
    html +=
      '<div class="field"><label>账号<span class="req">*</span></label>' +
      '<input class="ant-input" id="memAccount" value="' +
      esc(m.account || "") +
      '" placeholder="登录账号，如 wangyi"' +
      (isEdit ? " disabled" : "") +
      ">" +
      (isEdit ? '<div class="field-hint">账号创建后不可修改</div>' : "") +
      "</div>";
    html +=
      '<div class="field"><label>IP 地址<span class="req">*</span></label>' +
      '<input class="ant-input" id="memIp" value="' +
      esc(m.ip || "") +
      '" placeholder="如 203.0.113.8">' +
      '<div class="field-hint">用于 IP 风控白名单</div></div>';
    html +=
      '<div class="field"><label>角色<span class="req">*</span></label>' +
      '<select class="ant-input" id="memRole">' +
      roleOptionsHtml(m.roleCode || "ROLE_OPS") +
      "</select></div>";
    html +=
      '<div class="field"><label>状态<span class="req">*</span></label>' +
      '<select class="ant-input" id="memStatus">' +
      '<option value="enabled"' +
      (m.status !== "disabled" ? " selected" : "") +
      ">启用</option>" +
      '<option value="disabled"' +
      (m.status === "disabled" ? " selected" : "") +
      ">禁用</option>" +
      "</select></div>";
    html +=
      '<div class="field"><label>邮箱<span class="opt">（选填）</span></label>' +
      '<input class="ant-input" id="memEmail" type="email" value="' +
      esc(m.email || "") +
      '" placeholder="member@fansloop.io"></div>';
    html +=
      '<div class="field"><label>显示名称<span class="opt">（选填）</span></label>' +
      '<input class="ant-input" id="memName" value="' +
      esc(m.name || "") +
      '" placeholder="成员姓名"></div>';

    if (!isEdit) {
      html +=
        '<div class="field"><label>初始登录密码</label>' +
        '<input class="ant-input" value="123456a" disabled style="max-width:200px;font-family:ui-monospace,monospace">' +
        '<div class="field-hint">新建成员默认密码为 <strong>123456a</strong>，首次登录后建议修改</div></div>';
    }
    if (!isEdit && secretFmt) {
      html +=
        '<div class="admin-mem-secret-box"><strong><i class="fa-brands fa-google"></i> 谷歌验证密钥</strong>（创建时自动分配）<br>' +
        '<code id="memNewSecret">' +
        esc(secretFmt) +
        "</code>" +
        '<div style="margin-top:6px;color:rgba(0,0,0,.45)">请通过安全渠道将密钥交给成员；勿在公开渠道传播。</div></div>';
    }
    html += "</div>";
    return html;
  }

  function readMemberForm() {
    return {
      account: (document.getElementById("memAccount") || {}).value || "",
      ip: (document.getElementById("memIp") || {}).value || "",
      roleCode: (document.getElementById("memRole") || {}).value || "",
      status: (document.getElementById("memStatus") || {}).value || "enabled",
      email: (document.getElementById("memEmail") || {}).value || "",
      name: (document.getElementById("memName") || {}).value || ""
    };
  }

  function validateMemberForm(data, isEdit) {
    data.account = String(data.account || "").trim();
    data.ip = String(data.ip || "").trim();
    if (!isEdit && !data.account) return "请填写账号";
    if (!data.ip) return "请填写 IP 地址";
    if (!/^[\d.a-fA-F:]+$/.test(data.ip) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(data.ip)) {
      return "IP 地址格式不正确";
    }
    if (!data.roleCode) return "请选择角色";
    if (!data.status) return "请选择状态";
    return null;
  }

  function renderLogDetail(log) {
    var resultTag =
      log.result === "success"
        ? '<span class="ant-tag ant-tag-green">成功</span>'
        : '<span class="ant-tag ant-tag-red">失败</span>';
    return (
      '<dl class="admin-log-detail">' +
      "<dt>时间</dt><dd>" + esc(log.time) + "</dd>" +
      "<dt>操作人</dt><dd>" + esc(log.operator) + "（" + esc(log.operatorEmail) + "）</dd>" +
      "<dt>一级模块</dt><dd>" + esc(log.module) + "</dd>" +
      "<dt>二级模块</dt><dd>" + esc(log.submodule) + "</dd>" +
      "<dt>功能操作</dt><dd>" + esc(log.action) + "</dd>" +
      "<dt>操作对象</dt><dd>" + esc(log.target) + "</dd>" +
      "<dt>来源 IP</dt><dd>" + esc(log.ip) + "</dd>" +
      "<dt>结果</dt><dd>" + resultTag + "</dd>" +
      "<dt>Request ID</dt><dd><code>" + esc(log.requestId) + "</code></dd>" +
      "<dt>User-Agent</dt><dd>" + esc(log.ua) + "</dd>" +
      "</dl>" +
      "<div style='font-size:12px;color:rgba(0,0,0,.45);margin-bottom:6px'>变更快照 / 附加参数</div>" +
      "<pre class='admin-log-diff'>{\n  \"action\": \"" + esc(log.action) + "\",\n  \"module\": \"" + esc(log.module) + " / " + esc(log.submodule) + "\",\n  \"result\": \"" + esc(log.result) + "\"\n}</pre>"
    );
  }

  global.AdminRbac = {
    PERM_TREE: PERM_TREE,
    ROLE_DEFAULT_PERMS: ROLE_DEFAULT_PERMS,
    ROLES: ROLES,
    MEMBERS: MEMBERS,
    OPERATION_LOGS: OPERATION_LOGS,
    esc: esc,
    allPermIds: allPermIds,
    renderPermTree: renderPermTree,
    wirePermTree: wirePermTree,
    collectPermIds: collectPermIds,
    renderMemberForm: renderMemberForm,
    readMemberForm: readMemberForm,
    validateMemberForm: validateMemberForm,
    renderLogDetail: renderLogDetail,
    roleOptionsHtml: roleOptionsHtml
  };
})(typeof window !== "undefined" ? window : this);
