const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "pages-web");
const files = [
  "home.html",
  "create.html",
  "discover.html",
  "subscriptions.html",
  "wallet.html",
  "settings.html",
  "messages.html",
  "notifications.html",
  "profile.html",
  "live-detail.html",
  "creator-income.html",
  "transactions.html"
];
const css = '<link rel="stylesheet" href="../css-web/host-live-pip-global.css">\n';
const js = '<script src="../js-web/host-live-pip-global.js"></script>\n';
const marker = "host-live-pip-global";

files.forEach(function (f) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) return;
  let s = fs.readFileSync(p, "utf8");
  if (s.includes(marker)) {
    console.log("skip", f);
    return;
  }
  if (s.includes("</body>")) {
    s = s.replace("</body>", css + js + "</body>");
    fs.writeFileSync(p, s, "utf8");
    console.log("patched", f);
  }
});
