/**
 * Web · 积分悬浮气泡交互
 * - 拖拽移动，松手吸附左右侧
 * - 可收起到侧边（只露环）
 * - 避开 #createFabWrap（本页或同域 iframe 内）
 */
(function (global) {
    var STORAGE_KEY = 'gf_web_reward_dock_pos_v1';
    var MARGIN = 12;
    var COLLAPSE_RATIO = 0.62;
    var MOVE_THRESHOLD = 8;
    var FAB_GAP = 14;
    var FAB_SAFE = { w: 56, h: 56, right: 28, bottom: 28 };

    function clamp(v, min, max) {
        if (v < min) return min;
        if (v > max) return max;
        return v;
    }

    function readStore() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        } catch (e) {
            return null;
        }
    }

    function writeStore(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    function getCreateFabRects(iframeSelector) {
        var rects = [];
        var local = document.getElementById('createFabWrap');
        if (local && local.offsetParent !== null) {
            rects.push(local.getBoundingClientRect());
        }
        var sel = iframeSelector || '#frame';
        try {
            var iframe = document.querySelector(sel);
            var doc = iframe && iframe.contentDocument;
            var fab = doc && doc.getElementById('createFabWrap');
            if (fab) {
                var fr = iframe.getBoundingClientRect();
                var br = fab.getBoundingClientRect();
                rects.push({
                    left: fr.left + br.left,
                    top: fr.top + br.top,
                    right: fr.left + br.right,
                    bottom: fr.top + br.bottom,
                    width: br.width,
                    height: br.height
                });
            }
        } catch (e) {}
        return rects;
    }

    function rectsOverlap(a, b, pad) {
        var p = pad || 0;
        return !(
            a.right + p <= b.left ||
            a.left - p >= b.right ||
            a.bottom + p <= b.top ||
            a.top - p >= b.bottom
        );
    }

    /**
     * @param {HTMLElement} dock
     * @param {object} opts
     * @param {function} [opts.onActivate] 展开态点击回调（进商城）
     * @param {string} [opts.iframeSelector]
     * @param {HTMLElement} [opts.floatLayer]
     * @param {boolean} [opts.defaultRight]
     */
    function bindRewardDockInteract(dock, opts) {
        opts = opts || {};
        if (!dock) return null;

        var floatLayer = opts.floatLayer || document.getElementById('rewardFloatLayer');
        var isCollapsed = false;
        var isRightSide = opts.defaultRight !== false;
        var dragging = false;
        var pointerId = null;
        var startX = 0;
        var startY = 0;
        var startLeft = 0;
        var startTop = 0;
        var moved = false;

        function vw() {
            return window.innerWidth || 1024;
        }
        function vh() {
            return window.innerHeight || 768;
        }
        function dockW() {
            return dock.offsetWidth || (isCollapsed ? 56 : 220);
        }
        function dockH() {
            return dock.offsetHeight || 64;
        }

        function fabAvoidBottom() {
            var fabs = getCreateFabRects(opts.iframeSelector);
            var minBottomClear = FAB_SAFE.bottom + FAB_SAFE.h + FAB_GAP;
            fabs.forEach(function (r) {
                var fromBottom = vh() - r.bottom;
                var clear = fromBottom + r.height + FAB_GAP;
                if (clear > minBottomClear) minBottomClear = clear;
            });
            // 即使拿不到 fab，右下角预留创作球位
            if (isRightSide) {
                minBottomClear = Math.max(minBottomClear, FAB_SAFE.bottom + FAB_SAFE.h + FAB_GAP);
            }
            return minBottomClear;
        }

        function minTop() {
            return MARGIN + 8;
        }
        function maxTop() {
            var clear = isRightSide ? fabAvoidBottom() : MARGIN + 8;
            return Math.max(minTop(), vh() - dockH() - clear);
        }

        function expandedLeft() {
            return isRightSide ? vw() - dockW() - MARGIN : MARGIN;
        }
        function collapsedLeft() {
            var hidden = dockW() * COLLAPSE_RATIO;
            return isRightSide ? vw() - dockW() + hidden : -hidden;
        }

        function setPos(left, top, withTransition) {
            dock.style.right = 'auto';
            dock.style.bottom = 'auto';
            dock.style.transition = withTransition
                ? 'left 0.28s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.28s cubic-bezier(0.22, 0.61, 0.36, 1)'
                : 'none';
            dock.style.left = Math.round(left) + 'px';
            dock.style.top = Math.round(top) + 'px';
            if (floatLayer) {
                floatLayer.style.right = 'auto';
                floatLayer.style.bottom = 'auto';
                floatLayer.style.left = Math.round(left) + 'px';
                floatLayer.style.top = Math.round(top - 108) + 'px';
            }
        }

        function avoidFabOverlap(left, top) {
            var box = {
                left: left,
                top: top,
                right: left + dockW(),
                bottom: top + dockH()
            };
            var fabs = getCreateFabRects(opts.iframeSelector);
            if (!fabs.length && isRightSide) {
                var fake = {
                    left: vw() - FAB_SAFE.right - FAB_SAFE.w,
                    top: vh() - FAB_SAFE.bottom - FAB_SAFE.h,
                    right: vw() - FAB_SAFE.right,
                    bottom: vh() - FAB_SAFE.bottom
                };
                fabs = [fake];
            }
            fabs.forEach(function (fab) {
                if (!rectsOverlap(box, fab, FAB_GAP)) return;
                // 优先上移，避开创作球
                var lifted = fab.top - dockH() - FAB_GAP;
                if (lifted >= minTop()) {
                    top = lifted;
                    box.top = top;
                    box.bottom = top + dockH();
                } else if (!isRightSide) {
                    // 左侧一般无 fab；若仍冲突则再上移到顶
                    top = minTop();
                } else {
                    // 右侧仍冲突：改吸左侧
                    isRightSide = false;
                    left = isCollapsed ? collapsedLeft() : expandedLeft();
                    box.left = left;
                    box.right = left + dockW();
                }
            });
            return { left: left, top: clamp(top, minTop(), maxTop()) };
        }

        function placeByState(withTransition) {
            var top = clamp(parseFloat(dock.style.top) || maxTop(), minTop(), maxTop());
            var left = isCollapsed ? collapsedLeft() : expandedLeft();
            var fixed = avoidFabOverlap(left, top);
            left = isCollapsed
                ? (isRightSide ? collapsedLeft() : collapsedLeft())
                : (isRightSide ? expandedLeft() : expandedLeft());
            // recompute left after possible side flip
            left = isCollapsed ? collapsedLeft() : expandedLeft();
            top = fixed.top;
            fixed = avoidFabOverlap(left, top);
            setPos(fixed.left, fixed.top, withTransition);
            dock.classList.toggle('is-collapsed', isCollapsed);
            dock.classList.toggle('is-side-right', isRightSide);
            dock.classList.toggle('is-side-left', !isRightSide);
            dock.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
            var foldIcon = dock.querySelector('.rd-fold i');
            if (foldIcon) {
                foldIcon.className = isRightSide ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
            }
            writeStore({
                top: fixed.top,
                right: isRightSide,
                collapsed: isCollapsed
            });
        }

        function snapSide(withTransition) {
            var leftNow = parseFloat(dock.style.left) || 0;
            isRightSide = leftNow + dockW() / 2 >= vw() / 2;
            placeByState(withTransition);
        }

        function initPos() {
            var saved = readStore();
            dock.style.right = 'auto';
            dock.style.bottom = 'auto';
            if (saved && typeof saved.top === 'number') {
                isRightSide = !!saved.right;
                isCollapsed = !!saved.collapsed;
                setPos(isCollapsed ? collapsedLeft() : expandedLeft(), saved.top, false);
            } else {
                isRightSide = opts.defaultRight !== false;
                isCollapsed = false;
                setPos(expandedLeft(), maxTop(), false);
            }
            placeByState(false);
        }

        function setCollapsed(next) {
            isCollapsed = !!next;
            placeByState(true);
        }

        // fold button
        var foldBtn = dock.querySelector('.rd-fold');
        if (foldBtn) {
            foldBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                setCollapsed(true);
            });
        }

        dock.addEventListener('pointerdown', function (e) {
            if (e.button != null && e.button !== 0) return;
            if (e.target.closest && e.target.closest('.rd-fold')) return;
            pointerId = e.pointerId;
            try {
                dock.setPointerCapture(pointerId);
            } catch (err) {}
            dragging = false;
            moved = false;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseFloat(dock.style.left) || 0;
            startTop = parseFloat(dock.style.top) || 0;
            dock.classList.add('is-dragging');
        });

        dock.addEventListener('pointermove', function (e) {
            if (pointerId !== e.pointerId) return;
            var dx = e.clientX - startX;
            var dy = e.clientY - startY;
            if (!dragging && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
                dragging = true;
                moved = true;
            }
            if (!dragging) return;
            var hidden = isCollapsed ? dockW() * COLLAPSE_RATIO : 0;
            var nextLeft = clamp(startLeft + dx, -hidden, vw() - dockW() + hidden);
            var nextTop = clamp(startTop + dy, minTop(), vh() - dockH() - MARGIN);
            setPos(nextLeft, nextTop, false);
        });

        function endPointer(e) {
            if (pointerId !== e.pointerId) return;
            try {
                if (dock.hasPointerCapture(pointerId)) dock.releasePointerCapture(pointerId);
            } catch (err) {}
            dock.classList.remove('is-dragging');
            if (dragging) {
                snapSide(true);
            } else if (isCollapsed) {
                setCollapsed(false);
            } else if (typeof opts.onActivate === 'function') {
                opts.onActivate();
            }
            pointerId = null;
            dragging = false;
            setTimeout(function () {
                moved = false;
            }, 0);
        }

        dock.addEventListener('pointerup', endPointer);
        dock.addEventListener('pointercancel', endPointer);

        dock.addEventListener('click', function (e) {
            if (moved) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        window.addEventListener('resize', function () {
            placeByState(false);
        });

        // iframe 内创作球晚于加载
        var iframe = document.querySelector(opts.iframeSelector || '#frame');
        if (iframe) {
            iframe.addEventListener('load', function () {
                placeByState(true);
            });
        }

        initPos();

        return {
            placeByState: placeByState,
            setCollapsed: setCollapsed,
            refreshAvoidFab: function () {
                placeByState(true);
            }
        };
    }

    function ensureFoldButton(dock) {
        if (!dock || dock.querySelector('.rd-fold')) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rd-fold';
        btn.title = '收起到侧边';
        btn.setAttribute('aria-label', '收起到侧边');
        btn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        dock.appendChild(btn);
    }

    global.RewardDockInteract = {
        bind: bindRewardDockInteract,
        ensureFoldButton: ensureFoldButton,
        STORAGE_KEY: STORAGE_KEY
    };
})(typeof window !== 'undefined' ? window : this);
