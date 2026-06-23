/**
 * 后台原型 · 当前登录角色（sessionStorage 模拟）
 * 用于区分「活动运营」与「研发 / 管理员」权限。
 */
(function (global) {
  var KEY = 'fl_admin_role_v1';

  var ROLES = {
    ROLE_OPS: { label: '活动运营', canDevActivities: false },
    ROLE_DEV: { label: '研发', canDevActivities: true },
    ROLE_ROOT: { label: '超级管理员', canDevActivities: true }
  };

  function getRole() {
    var r = sessionStorage.getItem(KEY);
    return r && ROLES[r] ? r : 'ROLE_ROOT';
  }

  function setRole(code) {
    if (!ROLES[code]) return;
    sessionStorage.setItem(KEY, code);
  }

  function canManageDevActivities() {
    var r = ROLES[getRole()];
    return !!(r && r.canDevActivities);
  }

  function roleLabel() {
    var r = ROLES[getRole()];
    return r ? r.label : getRole();
  }

  /** 挂载到 header-right，原型演示用角色切换 */
  function mountRoleSwitcher(beforeNode) {
    var wrap = document.createElement('div');
    wrap.className = 'admin-role-switch';
    wrap.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-right:8px';
    wrap.innerHTML =
      '<label style="font-size:12px;color:rgba(0,0,0,.45);white-space:nowrap">原型角色</label>' +
      '<select class="ant-input" id="fldAdminRole" style="height:28px;width:128px;font-size:12px;padding:0 8px"></select>';
    if (beforeNode && beforeNode.parentNode) {
      beforeNode.parentNode.insertBefore(wrap, beforeNode);
    }
    var sel = wrap.querySelector('#fldAdminRole');
    Object.keys(ROLES).forEach(function (code) {
      var o = document.createElement('option');
      o.value = code;
      o.textContent = ROLES[code].label;
      sel.appendChild(o);
    });
    sel.value = getRole();
    sel.addEventListener('change', function () {
      setRole(this.value);
      location.reload();
    });
    return wrap;
  }

  function syncHeaderUserLabel() {
    var span = document.querySelector('.admin-header-user span');
    if (span) span.textContent = roleLabel();
  }

  global.FLAdminSession = {
    ROLES: ROLES,
    getRole: getRole,
    setRole: setRole,
    canManageDevActivities: canManageDevActivities,
    roleLabel: roleLabel,
    mountRoleSwitcher: mountRoleSwitcher,
    syncHeaderUserLabel: syncHeaderUserLabel
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', syncHeaderUserLabel);
  }
})(typeof window !== 'undefined' ? window : this);
