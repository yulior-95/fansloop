const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "..", "pages-web", "create-live-host.html");
let html = fs.readFileSync(p, "utf8");
const marker = '<div class="card-hd"><i class="fa-solid fa-gift"';
let s0 = html.indexOf(marker);
if (s0 < 0) throw new Error("gift not found");
s0 = html.lastIndexOf('<motion class="card">', s0);
if (s0 < 0) s0 = html.lastIndexOf('<div class="card">', html.indexOf(marker));
const end = html.indexOf("            </aside>", s0);
const replacement = `                <div class="card">
                    <div class="card-hd">
                        <span class="hd-l"><i class="fa-solid fa-gift" style="color:#FBBF24"></i> 礼物动态</span>
                        <span class="hd-r">新礼物自下而上</span>
                    </div>
                    <div class="feed-viewport">
                        <motion class="feed-scroll" id="giftFeedScroll">
                            <div class="feed-inner" id="giftFeedInner">
                                <motion class="gift-toast"><i class="fa-solid fa-gift"></i> Alex 送出 <b>星光 ×5</b> · 12 USDT</div>
                                <div class="gift-toast"><i class="fa-solid fa-gift"></i> Mika 送出 <b>火箭</b> · 28 USDT</motion>
                            </div>
                        </div>
                        <button type="button" class="feed-new-hint" id="giftFeedHint"><i class="fa-solid fa-arrow-down"></i> 新礼物</button>
                    </div>
                    <div class="host-mod-bar">
                        <button type="button" class="btn btn-secondary btn-sm" id="btnSimGift"><i class="fa-solid fa-plus"></i> 模拟礼物</button>
                    </div>
                </div>
                <div class="card">
                    <div class="card-hd">
                        <span class="hd-l"><i class="fa-regular fa-comments" style="color:#C084FC"></i> 弹幕管理</span>
                        <span class="hd-r">悬停 · 删除 / 踢出</span>
                    </div>
                    <div class="feed-viewport tall">
                        <div class="feed-scroll" id="chatFeedScroll">
                            <div class="feed-inner" id="chatFeedInner">
                                <div class="chat-line" data-id="c1" data-user="Nova">
                                    <div class="chat-main"><span class="u">Nova</span><span class="m">今晚音色太绝了！</span></div>
                                    <div class="chat-ops">
                                        <button type="button" class="chat-op" title="删除发言" data-act="del"><i class="fa-regular fa-trash-can"></i></button>
                                        <button type="button" class="chat-op danger" title="移出直播间" data-act="kick"><i class="fa-solid fa-user-slash"></i></button>
                                    </div>
                                </div>
                                <motion class="chat-line" data-id="c2" data-user="Ken">
                                    <div class="chat-main"><span class="u">Ken</span><span class="m">已订阅，求 Encore</span></div>
                                    <div class="chat-ops">
                                        <button type="button" class="chat-op" data-act="del"><i class="fa-regular fa-trash-can"></i></button>
                                        <button type="button" class="chat-op danger" data-act="kick"><i class="fa-solid fa-user-slash"></i></button>
                                    </div>
                                </div>
                                <div class="chat-line" data-id="c3" data-user="Yuki">
                                    <div class="chat-main"><span class="u">Yuki</span><span class="m">可以点《Autumn Leaves》吗</span></div>
                                    <div class="chat-ops">
                                        <button type="button" class="chat-op" data-act="del"><i class="fa-regular fa-trash-can"></i></button>
                                        <button type="button" class="chat-op danger" data-act="kick"><i class="fa-solid fa-user-slash"></i></button>
                                    </div>
                                </div>
                                <div class="chat-line is-system" data-id="c4" data-user="系统">
                                    <div class="chat-main"><span class="u">系统</span><span class="m">欢迎新订阅者 @River</span></div>
                                </div>
                                <div class="chat-line is-risk" data-id="c5" data-user="spam_bot">
                                    <div class="chat-main"><span class="u">spam_bot</span><span class="m">加微信低价票 xxxx（异常广告）</span></div>
                                    <div class="chat-ops">
                                        <button type="button" class="chat-op" data-act="del"><i class="fa-regular fa-trash-can"></i></button>
                                        <button type="button" class="chat-op danger" data-act="kick"><i class="fa-solid fa-user-slash"></i></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="feed-new-hint" id="chatFeedHint"><i class="fa-solid fa-arrow-down"></i> 新弹幕</button>
                    </div>
                    <div class="host-mod-bar">
                        <button type="button" class="btn btn-secondary btn-sm" id="btnSimChat"><i class="fa-solid fa-plus"></i> 模拟弹幕</button>
                        <button type="button" class="btn btn-secondary btn-sm" id="btnClearRisk"><i class="fa-solid fa-shield-halved"></i> 清除异常</button>
                    </div>
                </div>
`;
const closeDiv = "<" + "/div>";
html = html.slice(0, s0) + replacement.replace(/<motion\b/g, "<div").replace(/<\/motion>/g, closeDiv) + html.slice(end);
const footer = `

<div class="host-toast" id="hostToast" role="status"></div>

<div class="host-modal-backdrop" id="hostKickModal">
    <div class="host-modal" onclick="event.stopPropagation()">
        <h3><i class="fa-solid fa-user-slash" style="color:#F87171"></i> 移出直播间</h3>
        <p>确认将 <strong id="hostKickUserName">—</strong> 移出本场直播？移出后其发言将清除，且无法再发弹幕（原型）。</p>
        <div class="host-modal-actions">
            <button type="button" class="btn btn-secondary" id="hostKickCancel">取消</button>
            <button type="button" class="btn btn-primary" id="hostKickConfirm" style="background:linear-gradient(135deg,#DC2626,#EF4444)">确认移出</button>
        </div>
    </div>
</div>

<script src="../js-web/live-host.js"></script>
`;
if (!html.includes("live-host.js")) {
  html = html.replace("</body>", footer + "</body>");
}
html = html.replace(/<motion\b/g, "<div").replace(/<\/motion>/g, closeDiv);
fs.writeFileSync(p, html, "utf8");
console.log("patched");
