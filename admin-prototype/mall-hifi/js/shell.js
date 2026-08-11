/**
 * 双商城高保真壳层：侧栏注入 + Toast
 */
(function (global) {
  var PAGES = [
    { id: 'digital-review', href: 'digital-review.html', icon: 'fa-gem', label: '数字商品审核', group: '数字商城' },
    { id: 'digital-products', href: 'digital-products.html', icon: 'fa-cubes', label: '数字商品管理', group: '数字商城' },
    { id: 'digital-orders', href: 'digital-orders.html', icon: 'fa-receipt', label: '数字销售记录', group: '数字商城' },
    { id: 'affiliate-categories', href: 'affiliate-categories.html', icon: 'fa-tags', label: '实体商品分类', group: '联盟商城' },
    { id: 'affiliate-commissions', href: 'affiliate-commissions.html', icon: 'fa-sack-dollar', label: '联盟佣金流水', group: '联盟商城' }
  ];

  function mountSider(activeId) {
    var el = document.getElementById('mhSider');
    if (!el) return;
    var html = '' +
      '<div class="mh-logo">' +
      '<img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&h=80&fit=crop" alt="GOODFANS">' +
      '<div>GOODFANS<small>运营后台 · 双商城</small></div></div>' +
      '<nav class="mh-menu" aria-label="双商城导航">';

    var lastGroup = '';
    PAGES.forEach(function (p) {
      if (p.group !== lastGroup) {
        html += '<div class="mh-menu-group">' + p.group + '</div>';
        lastGroup = p.group;
      }
      html += '<a href="' + p.href + '" class="' + (p.id === activeId ? 'is-active' : '') + '">' +
        '<i class="fa-solid ' + p.icon + '"></i><span>' + p.label + '</span></a>';
    });
    html += '</nav>';
    el.innerHTML = html;
  }

  function toast(msg) {
    var el = document.getElementById('mhToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mhToast';
      el.className = 'mh-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function mountAnnoRail(items) {
    var rail = document.getElementById('mhAnnoRail');
    if (!rail || !items || !items.length) return;
    rail.innerHTML = items.map(function (it) {
      return '<aside class="mh-anno" role="note">' +
        '<div class="mh-anno-sphere" aria-hidden="true"><span>To 研发</span></div>' +
        '<div class="mh-anno-body"><strong>' + it.title + '</strong><p>' + it.body + '</p></div>' +
        '</aside>';
    }).join('');
  }

  global.MallHifiShell = {
    mountSider: mountSider,
    mountAnnoRail: mountAnnoRail,
    toast: toast,
    PAGES: PAGES
  };
})(window);
