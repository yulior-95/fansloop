/**
 * 用户资产页：多钱包行合并
 */
(function () {
  var M = window.AdminModal;
  if (!M) return;

  var tbody = document.getElementById("assetsTableBody");
  var filterUid = document.getElementById("filterAssetUid");

  var MOCK_ASSETS = [
    {
      uid: "882910",
      nickname: "小岛日和",
      pointsBalance: 12800,
      pointsFrozen: 200,
      updatedAt: "2026-06-20 14:32:18",
      wallets: [
        { network: "TRC20", address: "TXyz9a2f8K3mN1pQ7rS4tU6vW8xY0zAb" },
        { network: "ERC20", address: "0x71C7654321098abcdef1234567890A2f" }
      ]
    },
    {
      uid: "102938",
      nickname: "Alex Chen",
      pointsBalance: 402,
      pointsFrozen: 0,
      updatedAt: "2026-06-22 08:05:51",
      wallets: [{ network: "ERC20", address: "0xB1d2e3F404ee5678901234567890abcd" }]
    },
    {
      uid: "556677",
      nickname: "林小鹿",
      pointsBalance: 2100,
      pointsFrozen: 300,
      updatedAt: "2026-06-21 17:18:09",
      wallets: [
        { network: "TRC20", address: "TLa2f8K3mN1pQ7rS4tU6vW8xY0zAbCd" },
        { network: "BEP20", address: "0x9f3a2b1c4d5e6f708192a3b4c5d6e7f8091a2b3" }
      ]
    }
  ];

  function formatPoints(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function shortAddress(addr) {
    if (!addr || addr.length < 12) return addr || "—";
    return addr.slice(0, 6) + "…" + addr.slice(-4);
  }

  function getFilteredAssets() {
    var kw = filterUid ? String(filterUid.value || "").trim() : "";
    if (!kw) return MOCK_ASSETS;
    return MOCK_ASSETS.filter(function (u) {
      return u.uid.indexOf(kw) >= 0 || u.nickname.indexOf(kw) >= 0;
    });
  }

  function mergedCell(html, rowspan) {
    return '<td rowspan="' + rowspan + '" style="vertical-align:middle">' + html + "</td>";
  }

  function renderTable() {
    if (!tbody) return;
    var users = getFilteredAssets();
    if (!users.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无匹配记录</td></tr>';
      return;
    }

    var html = "";
    users.forEach(function (u) {
      var wallets = u.wallets && u.wallets.length ? u.wallets : [{ network: "—", address: "" }];
      var span = wallets.length;
      var uidCell =
        mergedCell(
          '<span class="js-uid-link" data-uid="' + M.esc(u.uid) + '">' + M.esc(u.uid) + "</span>",
          span
        );
      var nickCell = mergedCell(M.esc(u.nickname), span);
      var pointsCell = mergedCell(formatPoints(u.pointsBalance), span);
      var frozenCell = mergedCell(formatPoints(u.pointsFrozen), span);
      var updatedCell = mergedCell(M.esc(u.updatedAt), span);

      wallets.forEach(function (w, i) {
        html += '<tr data-uid="' + M.esc(u.uid) + '">';
        if (i === 0) {
          html += uidCell + nickCell;
        }
        html +=
          "<td>" +
          M.esc(w.network) +
          "</td>" +
          "<td><code style='font-size:12px' title='" +
          M.esc(w.address) +
          "'>" +
          M.esc(shortAddress(w.address)) +
          "</code></td>";
        if (i === 0) {
          html += pointsCell + frozenCell + updatedCell;
        }
        html += "</tr>";
      });
    });
    tbody.innerHTML = html;
  }

  var btnQuery = document.getElementById("btnAstQuery");
  if (btnQuery) {
    btnQuery.addEventListener("click", function () {
      renderTable();
      M.toast("已查询 " + getFilteredAssets().length + " 条用户（原型）");
    });
  }

  renderTable();
})();
