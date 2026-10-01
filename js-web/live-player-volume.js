/**
 * 直播播放器 · 音量按钮 + 滑条浮层
 * FL_LivePlayerVolume.bind({ btn, player, pop, range, valEl, hintEl, videoEl, toast, storageKey })
 */
(function (global) {
    var DEFAULT_KEY = "fl_live_player_vol_v1";

    function readState(key) {
        try {
            var raw = localStorage.getItem(key || DEFAULT_KEY);
            if (!raw) return null;
            var o = JSON.parse(raw);
            if (!o || typeof o !== "object") return null;
            return {
                level: Math.max(0, Math.min(100, Number(o.level) || 80)),
                muted: !!o.muted
            };
        } catch (e) {
            return null;
        }
    }

    function writeState(key, state) {
        try {
            localStorage.setItem(
                key || DEFAULT_KEY,
                JSON.stringify({ level: state.level, muted: state.muted })
            );
        } catch (e) { /* ignore */ }
    }

    function iconClass(level, muted) {
        if (muted || level <= 0) return "fa-volume-xmark";
        if (level < 34) return "fa-volume-off";
        if (level < 67) return "fa-volume-low";
        return "fa-volume-high";
    }

    function updateRangeTrack(input, accent) {
        if (!input) return;
        accent = accent || "#FBBF24";
        var min = Number(input.min || 0);
        var max = Number(input.max || 100);
        var value = Number(input.value || min);
        var ratio = ((value - min) / Math.max(1, max - min)) * 100;
        input.style.background =
            "linear-gradient(90deg," + accent + " " + ratio + "%, rgba(255,255,255,0.2) " + ratio + "%)";
    }

    function bind(opts) {
        opts = opts || {};
        var btn = opts.btn;
        var player = opts.player;
        var pop = opts.pop;
        var range = opts.range;
        var valEl = opts.valEl;
        var hintEl = opts.hintEl;
        var videoEl = opts.videoEl;
        var storageKey = opts.storageKey || DEFAULT_KEY;
        var toastFn = typeof opts.toast === "function" ? opts.toast : null;
        var saved = readState(storageKey);
        var state = {
            level: saved ? saved.level : (opts.defaultLevel != null ? opts.defaultLevel : 80),
            muted: saved ? saved.muted : false,
            prevLevel: saved && saved.level > 0 ? saved.level : 80
        };

        function effectiveLevel() {
            return state.muted ? 0 : state.level;
        }

        function applyVideo() {
            if (!videoEl) return;
            var lv = effectiveLevel();
            videoEl.volume = Math.max(0, Math.min(1, lv / 100));
            videoEl.muted = lv <= 0;
            if (lv > 0 && videoEl.src && videoEl.paused) {
                videoEl.play().catch(function () { /* autoplay */ });
            }
        }

        function syncUi(skipToast) {
            var eff = effectiveLevel();
            var streamMuted = eff <= 0;
            if (player) {
                player.classList.toggle("is-muted", streamMuted);
                player.classList.toggle("is-stream-muted", streamMuted);
            }
            if (hintEl) hintEl.setAttribute("aria-hidden", streamMuted ? "false" : "true");
            if (range) {
                range.value = String(streamMuted ? 0 : state.level);
                updateRangeTrack(range, opts.rangeAccent);
            }
            if (valEl) valEl.textContent = eff + "%";
            if (btn) {
                btn.classList.toggle("is-muted-vol", streamMuted);
                btn.setAttribute("aria-pressed", streamMuted ? "true" : "false");
                btn.title = streamMuted ? "打开声音" : "音量";
                btn.innerHTML = '<i class="fa-solid ' + iconClass(state.level, state.muted) + '"></i>';
                if (global.FLWebIcons && global.FLWebIcons.refresh) {
                    global.FLWebIcons.refresh(btn);
                }
            }
            applyVideo();
            writeState(storageKey, state);
            if (typeof opts.onChange === "function") opts.onChange(state, skipToast);
        }

        function closePop() {
            if (!pop) return;
            pop.classList.remove("open");
            if (btn) {
                btn.classList.remove("is-active");
                btn.setAttribute("aria-expanded", "false");
            }
        }

        function openPop() {
            if (!pop) return;
            pop.classList.add("open");
            if (btn) btn.classList.add("is-active");
        }

        function togglePop() {
            if (!pop) return false;
            if (pop.classList.contains("open")) closePop();
            else openPop();
            if (btn) btn.setAttribute("aria-expanded", pop.classList.contains("open") ? "true" : "false");
            if (typeof opts.onPopToggle === "function") {
                opts.onPopToggle(pop.classList.contains("open"));
            }
            return true;
        }

        if (range) {
            range.addEventListener("input", function () {
                var v = Number(range.value || 0);
                state.level = v;
                if (v <= 0) {
                    state.muted = true;
                } else {
                    state.muted = false;
                    state.prevLevel = v;
                }
                syncUi(true);
            });
            updateRangeTrack(range, opts.rangeAccent);
        }

        if (btn) {
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                if (pop) {
                    togglePop();
                    return;
                }
                if (state.muted || state.level <= 0) {
                    state.muted = false;
                    state.level = state.prevLevel > 0 ? state.prevLevel : 80;
                    syncUi();
                    if (toastFn) toastFn("已恢复音量");
                } else {
                    state.prevLevel = state.level > 0 ? state.level : 80;
                    state.muted = true;
                    syncUi();
                    if (toastFn) toastFn("已静音");
                }
            });
        }

        if (pop) {
            pop.addEventListener("click", function (e) {
                e.stopPropagation();
            });
            global.document.addEventListener("click", closePop);
        }

        syncUi(true);

        return {
            getState: function () {
                return { level: state.level, muted: state.muted };
            },
            setState: function (next) {
                if (next.level != null) state.level = Math.max(0, Math.min(100, Number(next.level)));
                if (next.muted != null) state.muted = !!next.muted;
                syncUi(true);
            },
            closePop: closePop,
            syncUi: syncUi
        };
    }

    global.FL_LivePlayerVolume = {
        bind: bind,
        iconClass: iconClass,
        updateRangeTrack: updateRangeTrack
    };
})(window);
