/**
 * 账户资料浏览页 · 头像灯箱 / 保存 / 更换 · 邀请人行显隐
 */
(function () {
    var AVATAR_KEY = "fl_settings_avatar_v1";
    var DEFAULT_AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80";
    var INVITER = {
        uid: "luna",
        profileUrl: "creator-profile.html?user=luna"
    };

    function qs(sel, root) {
        return (root || document).querySelector(sel);
    }

    function getAvatarUrl() {
        try {
            return localStorage.getItem(AVATAR_KEY) || DEFAULT_AVATAR;
        } catch (e) {
            return DEFAULT_AVATAR;
        }
    }

    function setAvatarUrl(url) {
        try {
            localStorage.setItem(AVATAR_KEY, url);
        } catch (e) {}
    }

    function paintAvatars(url) {
        document.querySelectorAll("[data-settings-avatar]").forEach(function (el) {
            el.style.backgroundImage = "url('" + url.replace(/'/g, "\\'") + "')";
        });
    }

    function resolveInviteBound() {
        var p = new URLSearchParams(location.search);
        if (p.get("invite") === "none") return false;
        if (p.get("invite") === "bound") return true;
        try {
            var raw = localStorage.getItem("fl_invite_relation_v1");
            if (raw) {
                var o = JSON.parse(raw);
                return !!(o && o.bound);
            }
        } catch (e) {}
        return true;
    }

    function paintInviterRow() {
        var row = document.getElementById("inviterRow");
        if (!row) return;
        var bound = resolveInviteBound();
        row.hidden = !bound;
        var link = document.getElementById("inviterUidLink");
        if (link) {
            link.textContent = "@" + INVITER.uid;
            var href = INVITER.profileUrl;
            if (window.FL_navContextProfileUrl) {
                href = window.FL_navContextProfileUrl(href, "settings");
            } else {
                href += (href.indexOf("?") >= 0 ? "&" : "?") + "nav=settings";
            }
            link.href = href;
        }
    }

    function toast(msg) {
        var t = document.getElementById("settingsProfileToast");
        if (!t) return;
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(t._tm);
        t._tm = setTimeout(function () { t.classList.remove("show"); }, 2200);
    }

    function openLightbox() {
        var lb = document.getElementById("avatarLightbox");
        if (!lb) return;
        var img = qs("#avatarLightboxImg", lb);
        if (img) img.src = getAvatarUrl();
        lb.classList.add("open");
        lb.setAttribute("aria-hidden", "false");
    }

    function closeLightbox() {
        var lb = document.getElementById("avatarLightbox");
        if (!lb) return;
        lb.classList.remove("open");
        lb.setAttribute("aria-hidden", "true");
    }

    function saveAvatarToLocal() {
        var url = getAvatarUrl();
        var a = document.createElement("a");
        a.download = "goodfans-avatar.jpg";
        if (url.indexOf("data:") === 0) {
            a.href = url;
            a.click();
            toast("头像已保存到本地");
            return;
        }
        fetch(url)
            .then(function (r) { return r.blob(); })
            .then(function (blob) {
                a.href = URL.createObjectURL(blob);
                a.click();
                URL.revokeObjectURL(a.href);
                toast("头像已保存到本地");
            })
            .catch(function () {
                window.open(url, "_blank");
                toast("已在新标签页打开，可右键另存为");
            });
    }

    function bindAvatar() {
        var url = getAvatarUrl();
        paintAvatars(url);

        var ring = document.getElementById("settingsAvatarRing");
        var editBtn = document.getElementById("settingsAvatarEdit");
        var fileInput = document.getElementById("settingsAvatarFile");
        var lb = document.getElementById("avatarLightbox");

        if (ring) {
            ring.addEventListener("click", function (e) {
                if (e.target.closest("#settingsAvatarEdit")) return;
                openLightbox();
            });
            ring.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openLightbox();
                }
            });
        }

        if (editBtn && fileInput) {
            editBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                fileInput.click();
            });
            fileInput.addEventListener("change", function () {
                var file = fileInput.files && fileInput.files[0];
                if (!file) return;
                if (!/^image\//.test(file.type)) {
                    toast("请选择图片文件");
                    return;
                }
                var reader = new FileReader();
                reader.onload = function () {
                    var dataUrl = reader.result;
                    setAvatarUrl(dataUrl);
                    paintAvatars(dataUrl);
                    var img = qs("#avatarLightboxImg");
                    if (img) img.src = dataUrl;
                    toast("头像已更新");
                };
                reader.readAsDataURL(file);
                fileInput.value = "";
            });
        }

        if (lb) {
            lb.addEventListener("click", function (e) {
                if (e.target.matches("[data-avatar-close], .avatar-lb-backdrop")) closeLightbox();
            });
            document.addEventListener("keydown", function (e) {
                if (e.key === "Escape" && lb.classList.contains("open")) closeLightbox();
            });
            var btnSave = document.getElementById("btnAvatarSave");
            var btnChange = document.getElementById("btnAvatarChange");
            if (btnSave) btnSave.addEventListener("click", saveAvatarToLocal);
            if (btnChange && fileInput) {
                btnChange.addEventListener("click", function () {
                    fileInput.click();
                });
            }
        }
    }

    function paintAccountUid() {
        var uidEl = document.getElementById("settingsAccountUid");
        if (!uidEl) return;
        var user = window.GoodfansAuth && window.GoodfansAuth.getUser ? window.GoodfansAuth.getUser() : null;
        if (!user) {
            uidEl.textContent = "UID: —";
            return;
        }
        var publicUid = user.publicUid;
        if (!publicUid && window.FLUserRegistry && user.userId) {
            var acc = window.FLUserRegistry.getByUserId(user.userId);
            if (acc) publicUid = window.FLUserRegistry.resolvePublicUid(acc);
        }
        var joined = user.joinedAt ? " · 加入于 " + user.joinedAt : "";
        uidEl.textContent = "UID: " + (publicUid || "—") + joined;
    }

    function init() {
        paintInviterRow();
        paintAccountUid();
        bindAvatar();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.addEventListener("goodfans-auth-change", paintAccountUid);
})();
