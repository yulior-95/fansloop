const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "..", "index-web.html");
let s = fs.readFileSync(p, "utf8");
if (s.includes("create-live-host.html")) {
  console.log("already patched");
  process.exit(0);
}
const d = "d" + "iv";
const block = [
  "        <" + d + ' class="frame-card">',
  "            <" + d + ' class="frame-head"><' + d + ' class="traffic"><span class="red"></span><span class="yellow"></span><span class="green"></span></' + d + "><" + d + ' class="url"><i class="fa-solid fa-lock"></i>fansloop.io/create-live-host.html</' + d + '><a class="open" href="pages-web/create-live-host.html" target="_blank">打开 <i class="fa-solid fa-up-right-from-square"></i></a></' + d + ">",
  '            <' + d + ' class="frame-body" style="min-height:720px"><iframe src="pages-web/create-live-host.html" loading="lazy"></iframe></' + d + ">",
  "            <" + d + ' class="frame-foot"><' + d + ' class="ti">主播直播中</' + d + "><" + d + ' class="desc">OBS 推流 · 礼物/弹幕自下而上 · 敏感词脱敏 · 删除/踢出 · To 研发玻璃球</' + d + "><" + d + ' class="meta"><span class="app">App-Shell</span><span>C02b</span></' + d + "></" + d + ">",
  "        </" + d + ">",
  "",
].join("\n");
const needle = '<iframe src="pages-web/create.html" loading="lazy"></iframe></' + d + ">";
const idx = s.indexOf(needle);
if (idx < 0) {
  console.error("anchor not found");
  process.exit(1);
}
const after = s.indexOf("</" + d + ">", idx + needle.length);
const endCard = s.indexOf("</" + d + ">", after + 5);
const insertAt = endCard + ("</" + d + ">").length;
s = s.slice(0, insertAt) + "\n\n" + block + s.slice(insertAt);
fs.writeFileSync(p, s, "utf8");
console.log("patched index-web");
