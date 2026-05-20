const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "..", "pages-web", "create-live-host.html");
let s = fs.readFileSync(p, "utf8");
if (s.includes("devHostChatTip")) {
  console.log("already patched");
  process.exit(0);
}
const find = `<div class="card">
                    <div class="card-hd">
                        <span class="hd-l"><i class="fa-regular fa-comments" style="color:#C084FC"></i> 弹幕管理</span>
                        <span class="hd-r">悬停 · 删除 / 踢出</span>
                    </div>`;
const rep = `<div class="card host-chat-card">
                    <div class="card-hd">
                        <span class="hd-l"><i class="fa-regular fa-comments" style="color:#C084FC"></i> 弹幕管理</span>
                        <span class="hd-r-wrap">
                            <span class="hd-r">悬停 · 删除 / 踢出</span>
                            <span class="dev-glass-wrap dev-glass-wrap--align-end dev-glass-wrap--pop-below">
                                <span class="dev-glass-sphere" tabindex="0" aria-describedby="devHostChatTip">
                                    <span class="dev-glass-sphere-shine"></span>
                                    <span class="dev-glass-sphere-txt">To 研发</span>
                                </span>
                                <span class="dev-glass-pop" id="devHostChatTip" role="tooltip">
                                    1. 触发后台管理敏感词库的敏感词发言，整条脱敏展示<br>
                                    2. 动态效果从下往上，新的消息在下方<br>
                                    3. 支持对单条发言进行删除，或者对异常发言用户踢出直播间
                                </span>
                            </span>
                        </span>
                    </div>`;
s = s.replace(find, rep);
fs.writeFileSync(p, s, "utf8");
console.log("patched glass");
