/**
 * 直播场次元数据（创建页 → 观众页 / 主播端 原型同步）
 */
(function (global) {
    var KEY = "fansloop_live_session";
    var DEFAULT = {
        title: "深夜爵士 · 即兴钢琴",
        desc: "今晚即兴爵士，欢迎点歌；支持 USDT 打赏与礼物。",
        tags: ["爵士", "即兴钢琴", "深夜直播"],
        admins: []
    };

    function read() {
        try {
            var raw = localStorage.getItem(KEY);
            if (!raw) return Object.assign({}, DEFAULT);
            var o = JSON.parse(raw);
            return {
                title: o.title || DEFAULT.title,
                desc: o.desc || DEFAULT.desc,
                tags: Array.isArray(o.tags) && o.tags.length ? o.tags : DEFAULT.tags.slice(),
                admins: Array.isArray(o.admins) ? o.admins : []
            };
        } catch (e) {
            return Object.assign({}, DEFAULT);
        }
    }

    function write(o) {
        try {
            localStorage.setItem(KEY, JSON.stringify(o));
        } catch (e) {}
    }

    function collectTagsFromDom() {
        var tags = [];
        var root = document.getElementById("liveTagInput");
        if (!root) return tags;
        root.querySelectorAll(".tag-pill").forEach(function (pill) {
            var t = pill.textContent.replace(/×/g, "").trim().replace(/^#\s*/, "");
            if (t) tags.push(t);
        });
        return tags;
    }

    global.LiveMetaStore = {
        read: read,
        save: function (patch) {
            var cur = read();
            write(Object.assign(cur, patch || {}));
            return read();
        },
        saveFromCreateForm: function () {
            var title = document.getElementById("liveNowTitle");
            var desc = document.getElementById("liveNowDesc");
            return global.LiveMetaStore.save({
                title: (title && title.value.trim()) || DEFAULT.title,
                desc: (desc && desc.value.trim()) || DEFAULT.desc,
                tags: collectTagsFromDom().length ? collectTagsFromDom() : DEFAULT.tags.slice()
            });
        },
        getAdmins: function () {
            return read().admins.slice();
        },
        isAdmin: function (user) {
            return read().admins.indexOf(user) >= 0;
        },
        addAdmin: function (user) {
            if (!user) return read();
            var cur = read();
            if (cur.admins.indexOf(user) < 0) cur.admins.push(user);
            write(cur);
            return cur;
        },
        removeAdmin: function (user) {
            var cur = read();
            cur.admins = cur.admins.filter(function (u) { return u !== user; });
            write(cur);
            return cur;
        },
        applyToHostStage: function () {
            var m = read();
            var t = document.querySelector(".host-title");
            var s = document.querySelector(".host-sub");
            if (t) t.textContent = m.title;
            if (s) s.textContent = m.desc;
        },
        applyToIntroPanel: function () {
            var m = read();
            var titleEl = document.getElementById("ldIntroDesc");
            var descEl = document.getElementById("ldIntroBody");
            var tagsEl = document.getElementById("ldIntroTags");
            var playerTitle = document.querySelector(".live-player .bottom-overlay h2");
            if (playerTitle) playerTitle.textContent = m.title;
            if (descEl) {
                descEl.innerHTML =
                    escapeHtml(m.desc) +
                    "<br/><br/>礼物排行：<br/>🥇 WhaleX · 1,200 USDT<br/>🥈 BlockTrader · 412 USDT<br/>🥉 Aria · 188 USDT";
            }
            if (tagsEl) {
                tagsEl.innerHTML = m.tags
                    .map(function (tag) {
                        return '<span class="chip"># ' + escapeHtml(tag) + "</span>";
                    })
                    .join("");
            }
        }
    };

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }
})(typeof window !== "undefined" ? window : this);
