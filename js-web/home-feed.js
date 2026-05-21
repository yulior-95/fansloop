/**
 * 首页 Feed · 关注同步 / 弹幕弹窗 / 直播态
 */
(function () {
    function showToast(msg) {
        var host = document.getElementById("toastHostF");
        if (!host) return;
        var t = document.createElement("div");
        t.className = "toast-f";
        t.textContent = msg;
        host.appendChild(t);
        setTimeout(function () {
            if (t.parentNode) t.parentNode.removeChild(t);
        }, 2400);
    }

    window.FL_openDanmakuModal = function () {
        if (window.FL_openInteractionModal) {
            window.FL_openInteractionModal("danmaku-send-modal.html");
        }
    };

    window.addEventListener("message", function (e) {
        if (!e.data || e.data.type !== "fansloop-danmaku-sent") return;
        showToast("弹幕已发送：" + (e.data.text || ""));
    });

    var feedFollow = document.getElementById("feedFollow");
    var followed = {};

    function clonePostToFollow(card) {
        if (!feedFollow || !card) return;
        var creator = card.getAttribute("data-creator") || "";
        if (!creator || followed[creator]) return;
        followed[creator] = true;
        var empty = feedFollow.querySelector(".feed-follow-empty");
        if (empty) empty.remove();
        var clone = card.cloneNode(true);
        clone.classList.add("feed-follow-clone");
        var fb = clone.querySelector(".follow-dynamic");
        if (fb) {
            fb.dataset.following = "true";
            fb.textContent = "已关注 ✓";
            fb.style.background = "rgba(168,85,247,0.2)";
        }
        clone.querySelectorAll("[onclick*='FL_openInteractionModal']").forEach(function (el) {
            var oc = el.getAttribute("onclick") || "";
            if (oc.indexOf("comment-modal") >= 0 && card.getAttribute("data-post-type") === "live") {
                el.setAttribute("onclick", "FL_openDanmakuModal()");
            }
        });
        feedFollow.insertBefore(clone, feedFollow.firstChild);
    }

    document.querySelectorAll(".follow-dynamic").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            var on = btn.dataset.following === "true";
            var card = btn.closest(".post-card");
            if (!on) {
                btn.dataset.following = "true";
                btn.textContent = "已关注 ✓";
                btn.style.background = "rgba(168,85,247,0.2)";
                showToast("关注成功，已加入关注列表");
                clonePostToFollow(card);
                var tab = document.querySelector('#feedTabs .tab[data-feed="follow"]');
                if (tab) tab.click();
            } else {
                btn.dataset.following = "false";
                btn.textContent = "+ 关注";
                btn.style.background = "";
                var creator = card && card.getAttribute("data-creator");
                if (creator) {
                    followed[creator] = false;
                    feedFollow.querySelectorAll(".feed-follow-clone").forEach(function (c) {
                        if (c.getAttribute("data-creator") === creator) c.remove();
                    });
                    if (!feedFollow.querySelector(".post-card")) {
                        var p = document.createElement("p");
                        p.className = "feed-follow-empty";
                        p.style.cssText = "padding:32px 18px;text-align:center;font-size:13px;color:var(--t-tertiary)";
                        p.textContent = "关注创作者后，将在此展示其最新一条动态";
                        feedFollow.appendChild(p);
                    }
                }
                showToast("已取消关注");
            }
        });
    });
})();
