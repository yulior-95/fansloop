/**
 * 地址簿管理页
 */
(function () {
  var M = window.AdminModal;
  if (!M) return;

  var tbody = document.getElementById("addrTbody");
  var pagerMount = document.getElementById("addrPager");
  var filterUid = document.getElementById("addrFilterUid");
  var filterKw = document.getElementById("addrFilterKw");
  var pager = null;

  var ROWS = [
    {
      uid: "882910",
      chain: "TRON",
      protocol: "TRC20",
      address: "TXYZexampleAddress1122334455",
      remark: "主地址",
      createdAt: "2026-01-02 10:15:00",
      lastUsedAt: "2026-05-11 08:01:22"
    },
    {
      uid: "102938",
      chain: "ETH",
      protocol: "ERC20",
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      remark: "冷钱包",
      createdAt: "2026-03-20 14:22:18",
      lastUsedAt: null
    },
    {
      uid: "556677",
      chain: "BNB",
      protocol: "BEP20",
      address: "0x9f3a2b1c4d5e6f708192a3b4c5d6e7f8091a2b3",
      remark: "提现常用",
      createdAt: "2026-04-12 09:30:00",
      lastUsedAt: "2026-06-18 16:05:11"
    },
    {
      uid: "771201",
      chain: "TRON",
      protocol: "TRC20",
      address: "TLa2f8K3mN1pQ7rS4tU6vW8xY0zAbCdEf",
      remark: "—",
      createdAt: "2026-05-02 11:20:00",
      lastUsedAt: "2026-06-15 09:12:44"
    }
  ];

  function esc(s) {
    return M.esc(s == null ? "" : String(s));
  }

  function networkLabel(chain, protocol) {
    if (!chain) return "—";
    if (protocol) return esc(chain) + "(" + esc(protocol) + ")";
    return esc(chain);
  }

  function dashTime(v) {
    return v ? esc(v) : "—";
  }

  function getFiltered() {
    var uid = filterUid ? String(filterUid.value || "").trim() : "";
    var kw = filterKw ? String(filterKw.value || "").trim().toLowerCase() : "";
    return ROWS.filter(function (r) {
      if (uid && String(r.uid).indexOf(uid) < 0) return false;
      if (!kw) return true;
      return (
        String(r.address).toLowerCase().indexOf(kw) >= 0 ||
        String(r.remark || "").toLowerCase().indexOf(kw) >= 0 ||
        String(r.chain).toLowerCase().indexOf(kw) >= 0 ||
        String(r.protocol || "").toLowerCase().indexOf(kw) >= 0
      );
    });
  }

  function renderTable() {
    if (!tbody) return;
    var list = getFiltered();
    if (pager) pager.setTotal(list.length);
    var pageRows = pager ? pager.getSlice(list) : list;
    var startIdx = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;

    if (!pageRows.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:40px;color:rgba(0,0,0,.45)">暂无地址记录</td></tr>';
      return;
    }

    tbody.innerHTML = pageRows
      .map(function (r, i) {
        return (
          "<tr>" +
          '<td class="col-sticky-left"><span class="js-uid-link" data-uid="' +
          esc(r.uid) +
          '">' +
          esc(r.uid) +
          "</span></td>" +
          "<td>" +
          networkLabel(r.chain, r.protocol) +
          "</td>" +
          "<td class=\"col-address\"><code title=\"" +
          esc(r.address) +
          "\">" +
          esc(r.address) +
          "</code></td>" +
          "<td>" +
          esc(r.remark || "—") +
          "</td>" +
          "<td>" +
          dashTime(r.createdAt) +
          "</td>" +
          "<td>" +
          dashTime(r.lastUsedAt) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
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

  var btnQuery = document.getElementById("addrQ");
  if (btnQuery) {
    btnQuery.addEventListener("click", function () {
      if (pager) pager.resetPage();
      renderTable();
      M.toast("已查询 " + getFiltered().length + " 条");
    });
  }

  renderTable();
})();
