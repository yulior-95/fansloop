/**
 * 后台列表分页（Ant Design 视觉对齐，vanilla JS 全站复用）
 * 用法：AdminPager.create({ mount, pageSize, onChange }) → { setTotal, refresh, getSlice }
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
    if (start > 2) items.push('…');
    for (var p = start; p <= end; p++) items.push(p);
    if (end < totalPages - 1) items.push('…');
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

    mount.className = 'admin-pager-bar';
    mount.setAttribute('aria-label', '分页');

    function totalPages() {
      return Math.max(1, Math.ceil(total / pageSize) || 1);
    }

    function render() {
      var tp = totalPages();
      current = clampPage(current, tp);
      var html = '<span class="admin-pager-total">共 <b>' + total + '</b> 条</span>';
      html += '<div class="admin-pager-pages">';
      html += '<button type="button" class="ant-btn ant-btn-sm' + (current <= 1 ? ' ant-btn-disabled' : '') + '" data-pg="prev"' + (current <= 1 ? ' disabled' : '') + ' title="上一页"><i class="fa-solid fa-chevron-left"></i></button>';
      buildPageItems(current, tp).forEach(function (item) {
        if (item === '…') {
          html += '<span style="padding:0 4px;color:rgba(0,0,0,.25)">…</span>';
        } else {
          html += '<button type="button" class="ant-btn ant-btn-sm' + (item === current ? ' ant-btn-primary' : '') + '" data-pg="' + item + '">' + item + '</button>';
        }
      });
      html += '<button type="button" class="ant-btn ant-btn-sm' + (current >= tp ? ' ant-btn-disabled' : '') + '" data-pg="next"' + (current >= tp ? ' disabled' : '') + ' title="下一页"><i class="fa-solid fa-chevron-right"></i></button>';
      html += '</div>';
      html += '<label class="admin-pager-size">每页 <select class="ant-input" data-pg="size">';
      [5, 10, 20, 50].forEach(function (n) {
        html += '<option value="' + n + '"' + (n === pageSize ? ' selected' : '') + '>' + n + '</option>';
      });
      html += '</select> 条</label>';
      mount.innerHTML = html;
    }

    mount.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-pg]');
      if (!btn || btn.disabled) return;
      var pg = btn.getAttribute('data-pg');
      var tp = totalPages();
      if (pg === 'prev') current = clampPage(current - 1, tp);
      else if (pg === 'next') current = clampPage(current + 1, tp);
      else current = parseInt(pg, 10) || 1;
      onChange(current, pageSize);
    });

    mount.addEventListener('change', function (e) {
      if (e.target.getAttribute('data-pg') !== 'size') return;
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
      getPage: function () { return current; },
      getPageSize: function () { return pageSize; },
      resetPage: function () {
        current = 1;
        render();
      },
      refresh: render
    };
  }

  global.AdminPager = { create: create };
})(typeof window !== 'undefined' ? window : this);
