/**
 * 后台列表分页（Ant Design 视觉对齐，vanilla JS 全站复用）
 * 用法：AdminPager.create({ mount, pageSize, onChange }) → { setTotal, refresh, getSlice }
 * 静态表：AdminPager.bootStaticTables() 或由 admin-nav 自动引导
 */
(function (global) {
  function clampPage(page, totalPages) {
    if (totalPages < 1) return 1;
    if (page < 1) return 1;
    if (page > totalPages) return totalPages;
    return page;
  }

  function buildPageItems(current, totalPages) {
    if (totalPages <= 7) {
      var all = [];
      for (var i = 1; i <= totalPages; i++) all.push(i);
      return all;
    }
    var items = [1];
    var start = Math.max(2, current - 1);
    var end = Math.min(totalPages - 1, current + 1);
    if (start > 2) items.push("…");
    for (var p = start; p <= end; p++) items.push(p);
    if (end < totalPages - 1) items.push("…");
    items.push(totalPages);
    return items;
  }

  function create(options) {
    var mount = options.mount;
    var pageSize = options.pageSize || 10;
    var current = 1;
    var total = 0;
    var onChange = options.onChange || function () {};

    if (!mount) return null;

    mount.className = "admin-pager-bar";
    mount.setAttribute("aria-label", "分页");

    function totalPages() {
      return Math.max(1, Math.ceil(total / pageSize) || 1);
    }

    function render() {
      var tp = totalPages();
      current = clampPage(current, tp);
      var html = '<span class="admin-pager-total">共 <b>' + total + "</b> 条</span>";
      html += '<div class="admin-pager-pages">';
      html +=
        '<button type="button" class="ant-btn ant-btn-sm' +
        (current <= 1 ? " ant-btn-disabled" : "") +
        '" data-pg="prev"' +
        (current <= 1 ? " disabled" : "") +
        ' title="上一页"><i class="fa-solid fa-chevron-left"></i></button>';
      buildPageItems(current, tp).forEach(function (item) {
        if (item === "…") {
          html += '<span style="padding:0 4px;color:rgba(0,0,0,.25)">…</span>';
        } else {
          html +=
            '<button type="button" class="ant-btn ant-btn-sm' +
            (item === current ? " ant-btn-primary" : "") +
            '" data-pg="' +
            item +
            '">' +
            item +
            "</button>";
        }
      });
      html +=
        '<button type="button" class="ant-btn ant-btn-sm' +
        (current >= tp ? " ant-btn-disabled" : "") +
        '" data-pg="next"' +
        (current >= tp ? " disabled" : "") +
        ' title="下一页"><i class="fa-solid fa-chevron-right"></i></button>';
      html += "</div>";
      html += '<label class="admin-pager-size">每页 <select class="ant-input" data-pg="size">';
      [5, 10, 20, 50].forEach(function (n) {
        html += '<option value="' + n + '"' + (n === pageSize ? " selected" : "") + ">" + n + "</option>";
      });
      html += "</select> 条</label>";
      mount.innerHTML = html;
    }

    mount.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-pg]");
      if (!btn || btn.disabled) return;
      var pg = btn.getAttribute("data-pg");
      var tp = totalPages();
      if (pg === "prev") current = clampPage(current - 1, tp);
      else if (pg === "next") current = clampPage(current + 1, tp);
      else current = parseInt(pg, 10) || 1;
      onChange(current, pageSize);
    });

    mount.addEventListener("change", function (e) {
      if (e.target.getAttribute("data-pg") !== "size") return;
      pageSize = parseInt(e.target.value, 10) || 10;
      current = 1;
      onChange(current, pageSize);
    });

    return {
      setTotal: function (n) {
        total = n || 0;
        render();
      },
      getSlice: function (list) {
        var tp = totalPages();
        current = clampPage(current, tp);
        var start = (current - 1) * pageSize;
        return list.slice(start, start + pageSize);
      },
      getPage: function () {
        return current;
      },
      getPageSize: function () {
        return pageSize;
      },
      resetPage: function () {
        current = 1;
        render();
      },
      refresh: render
    };
  }

  function isEmptyStateRow(tr) {
    if (!tr || tr.children.length !== 1) return false;
    return !!tr.querySelector("td[colspan]");
  }

  function getTableDataRows(tbody) {
    return Array.prototype.filter.call(tbody.querySelectorAll(":scope > tr"), function (tr) {
      return !isEmptyStateRow(tr);
    });
  }

  function bindDomTbody(tbody, options) {
    options = options || {};
    if (typeof tbody === "string") tbody = document.querySelector(tbody);
    if (!tbody || tbody.getAttribute("data-pager-bound")) return null;

    var mount = options.mount;
    if (typeof mount === "string") mount = document.querySelector(mount);
    if (!mount) {
      mount = document.createElement("div");
      var anchor = tbody.closest(".ant-table") || tbody.parentElement;
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(mount, anchor.nextSibling);
    }

    tbody.setAttribute("data-pager-bound", "dom");

    var pager = create({
      mount: mount,
      pageSize: options.pageSize || 10,
      onChange: function () {
        apply();
        if (options.onChange) options.onChange();
      }
    });

    function apply() {
      var rows = getTableDataRows(tbody);
      pager.setTotal(rows.length);
      var slice = pager.getSlice(rows);
      rows.forEach(function (r) {
        r.style.display = "none";
      });
      slice.forEach(function (r) {
        r.style.display = "";
      });
    }

    mount.setAttribute("data-bound", "1");
    apply();

    return { pager: pager, refresh: apply };
  }

  function shouldSkipAutoPager(tbody) {
    if (!tbody) return true;
    if (tbody.getAttribute("data-pager") === "js") return true;
    if (tbody.getAttribute("data-pager-bound")) return true;
    if (tbody.closest(".fl-modal, .fl-modal-body, #admin-fl-modal-root")) return true;
    return false;
  }

  function bootStaticTables(root) {
    root = root || document;
    var bodies = root.querySelectorAll("main.admin-content tbody");
    bodies.forEach(function (tbody) {
      if (shouldSkipAutoPager(tbody)) return;
      var cardBody = tbody.closest(".ant-card-body");
      if (!cardBody) return;
      var mount = cardBody.querySelector(".admin-pager-bar");
      if (mount && mount.getAttribute("data-bound")) return;
      if (!mount) {
        mount = document.createElement("div");
        cardBody.appendChild(mount);
      }
      bindDomTbody(tbody, { mount: mount, pageSize: 10 });
    });
  }

  global.AdminPager = { create: create, bindDomTbody: bindDomTbody, bootStaticTables: bootStaticTables };

  if (typeof document !== "undefined") {
    function scheduleBoot() {
      bootStaticTables();
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scheduleBoot);
    } else {
      scheduleBoot();
    }
  }
})(typeof window !== "undefined" ? window : this);
