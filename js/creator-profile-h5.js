/**
 * H5 创作者主页 · Tab 列表与跳转
 */
(function (global) {
    var UNSPLASH = 'https://images.unsplash.com/';
    var WORKS_TOTAL = 186;
    var VIDEOS_TOTAL = 42;
    var EXCLUSIVE_TOTAL = 36;
    var SHOWCASE_TOTAL = 11;
    var PAGE_SIZE = 18;

    var COVER_POOL = [
        'photo-1490806843957-31f4c9a91c65',
        'photo-1497636577773-f1231844b336',
        'photo-1514933651103-005eec06c04b',
        'photo-1493612276216-ee3925520721',
        'photo-1506905925346-21bda4d32df4',
        'photo-1469474968028-56623f02e42e',
        'photo-1524504388940-b1c1722653e1',
        'photo-1523580494863-6f3031224c94',
        'photo-1542642745-f03d8e3aa54c',
        'photo-1492684223066-81342ee5ff30',
        'photo-1516035069371-29a1b244cc32',
        'photo-1527482790814-241124f1c40f',
        'photo-1514222709107-a180c68d72b4',
        'photo-1512070679279-c7e7efd83c57',
        'photo-1517841905240-472988babdf9',
        'photo-1520975916090-3105956dac38',
        'photo-1551434678-e076c223a692',
        'photo-1493976040374-85c8e12f0c0e'
    ];

    var TITLE_SEEDS = [
        '富士山五合目 · 胶片晨雾',
        '京都祇园 · 樱花季长卷',
        '东京地铁里的色彩与故事',
        '河口湖延时 · 云海上涌',
        '箱根温泉街 · 雨夜霓虹',
        '凌晨五点的富士山 vlog',
        '和服街拍幕后 · 调色流程',
        '镰仓海岸 · 日落色温',
        '暗房冲洗 · 银盐显影',
        '旅行背包器材分享',
        '私房胶片 · 室内自然光',
        '东京塔 · 蓝调时刻'
    ];

    function pad2(n) {
        n = Number(n) || 0;
        return n < 10 ? '0' + n : String(n);
    }

    function formatLikes(i) {
        var v = ((i * 137) % 900) + 0.1;
        if (v > 500) return (v / 10).toFixed(0) + 'K';
        if (v > 100) return (v / 10).toFixed(1) + 'K';
        return String(Math.floor(v * 10));
    }

    function buildMediaCatalog(total, forcedKind, opts) {
        opts = opts || {};
        var idPrefix = opts.idPrefix || 'w';
        var out = [];
        for (var i = 0; i < total; i++) {
            var kind = forcedKind || (i % 3 === 0 ? 'video' : 'image');
            var item = {
                id: idPrefix + (i + 1),
                kind: kind,
                cover: COVER_POOL[i % COVER_POOL.length],
                likes: formatLikes(i),
                title: TITLE_SEEDS[i % TITLE_SEEDS.length]
            };
            if (kind === 'video') {
                item.duration = pad2((i % 8) + 1) + ':' + pad2((i * 11) % 60);
            } else {
                item.badge = ((i % 10) + 4) + ' 张';
            }
            if (opts.locked) item.locked = true;
            else if (i % 17 === 0 && i > 0) item.locked = true;
            out.push(item);
        }
        return out;
    }

    var TAB_DATA = {
        works: buildMediaCatalog(WORKS_TOTAL, 'image'),
        videos: buildMediaCatalog(VIDEOS_TOTAL, 'video', { idPrefix: 'v' }),
        exclusive: buildMediaCatalog(EXCLUSIVE_TOTAL, null, { idPrefix: 'e', locked: true }),
        showcase: [
            { go: 'digital-detail.html', cover: 'photo-1493976040374-85c8e12f0c0e', kind: '图片合集', price: '4.5 U', title: '富士山日出 · 4K 写真', sub: '不限 · 已售 86' },
            { go: 'digital-detail-video.html', cover: 'photo-1514525253161-7a46d19cd819', kind: '视频', price: '6.0 U', title: '城市夜色 · 延时短片', sub: '剩余 158' },
            { go: 'digital-detail-bundle.html', cover: 'photo-1516035069371-29a1b244cc32', kind: '图视包', price: '9.9 U', title: '旅拍花絮 · 图视包', sub: '限量 · 剩余 68' }
        ]
    };

    /* fix typo in showcase cover id */
    TAB_DATA.showcase[2].cover = 'photo-1516035069371-29a1b244cc32';

    function esc(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }

    function imgUrl(id) {
        return UNSPLASH + id + '?w=400&q=80';
    }

    function stashContent(item, creatorName, creatorAv) {
        try {
            global.sessionStorage.setItem('gf_content_detail', JSON.stringify({
                id: item.id || '',
                title: item.title || '',
                author: creatorName || '创作者',
                authorAv: creatorAv || '',
                image: imgUrl(item.cover),
                likes: item.likes || '0',
                comments: '0',
                desc: item.title || '创作者作品详情'
            }));
        } catch (e) { /* ignore */ }
    }

    function openWorkItem(item, creatorName, creatorAv, fromPage) {
        if (!item) return;
        if (item.locked) {
            stashContent(item, creatorName, creatorAv);
            global.location.href = 'content-detail.html?locked=1&from=' + encodeURIComponent(fromPage || 'creator-profile.html') +
                '&title=' + encodeURIComponent(item.title || '');
            return;
        }
        if (item.kind === 'video') {
            global.location.href = 'video-detail.html?from=' + encodeURIComponent(fromPage || 'creator-profile.html') +
                '&title=' + encodeURIComponent(item.title || '');
            return;
        }
        stashContent(item, creatorName, creatorAv);
        var q = 'from=' + encodeURIComponent(fromPage || 'creator-profile.html');
        if (item.id) q = 'id=' + encodeURIComponent(item.id) + '&' + q;
        global.location.href = 'content-detail.html?' + q;
    }

    function renderWorkItemHtml(item) {
        var html = '<div class="item cp-tab-item" role="button" tabindex="0" data-item-id="' + esc(item.id) + '" data-item-kind="' + esc(item.kind) + '">';
        html += '<img src="' + esc(imgUrl(item.cover)) + '" alt="" loading="lazy">';
        if (item.kind === 'video' && item.duration) {
            html += '<div class="duration"><i class="fa-solid fa-play"></i> ' + esc(item.duration) + '</div>';
        } else if (item.badge) {
            html += '<div class="duration"><i class="fa-solid fa-image"></i> ' + esc(item.badge) + '</div>';
        }
        if (item.locked) {
            html += '<div class="corner paid"><i class="fa-solid fa-lock" style="font-size:8px"></i> Pro</div>';
            html += '<div class="lock-overlay"><i class="fa-solid fa-lock"></i></div>';
        }
        html += '<div class="info"><span><i class="fa-solid fa-heart"></i> ' + esc(item.likes || '0') + '</span></div>';
        html += '<div class="cp-tab-item-title">' + esc(item.title) + '</div>';
        html += '</div>';
        return html;
    }

    function renderVideoGrid(items, opts) {
        opts = opts || {};
        if (!items.length && !opts.keepShell) {
            return '<div class="cp-tab-empty"><i class="fa-regular fa-folder-open"></i>暂无内容</div>';
        }
        var html = '<div class="video-grid" data-cp-grid="1">';
        items.forEach(function (item) {
            html += renderWorkItemHtml(item);
        });
        html += '</div>';
        if (opts.showLoader) {
            html += '<div class="cp-tab-load-hint" data-cp-load-hint="1"><i class="fa-solid fa-spinner fa-spin"></i> 加载中…</div>';
        } else if (opts.showEnd) {
            html += '<div class="cp-tab-load-hint is-end" data-cp-load-hint="1">已展示全部 ' + WORKS_TOTAL + ' 个作品</div>';
        }
        return html;
    }

    function renderShowcaseGrid(items) {
        if (!items.length) {
            return '<div class="cp-tab-empty"><i class="fa-regular fa-folder-open"></i>橱窗暂无商品</div>';
        }
        var html = '<div class="da-grid">';
        items.forEach(function (item) {
            html += '<div class="da-card" data-go="' + esc(item.go) + '">';
            html += '<div class="cover"><img src="' + esc(imgUrl(item.cover)) + '" alt="">';
            html += '<span class="kind">' + esc(item.kind) + '</span>';
            html += '<span class="price">' + esc(item.price) + '</span></div>';
            html += '<div class="meta"><div class="title">' + esc(item.title) + '</div>';
            html += '<div class="sub">' + esc(item.sub) + '</div></div></div>';
        });
        html += '</div>';
        return html;
    }

    function renderPaidList(items) {
        if (!items.length) {
            return '<div class="cp-tab-empty"><i class="fa-regular fa-folder-open"></i>暂无付费内容</div>';
        }
        var html = '<div class="cp-paid-list">';
        items.forEach(function (item) {
            html += '<div class="cp-paid-row" role="button" tabindex="0" data-go="' + esc(item.go) + '">';
            html += '<img class="thumb" src="' + esc(imgUrl(item.cover)) + '" alt="">';
            html += '<div class="body"><div class="ti">' + esc(item.title) + '</div>';
            html += '<div class="sub">' + esc(item.sub) + '</div></div>';
            html += '<span class="pr">' + esc(item.price) + '</span>';
            html += '<i class="fa-solid fa-chevron-right chev"></i></div>';
        });
        html += '</div>';
        return html;
    }

    function footerForTab(tabId) {
        if (tabId === 'showcase') {
            return { text: '进入完整橱窗可购买图片合集 / 视频 / 图视作品包 →', go: 'creator-showcase.html?from=profile' };
        }
        return null;
    }

    function initTabs(opts) {
        opts = opts || {};
        var tabsRoot = document.getElementById('cpTabs');
        var panel = document.getElementById('cpTabPanel');
        var footer = document.getElementById('cpTabFooter');
        var scrollRoot = document.querySelector('.app-content');
        if (!tabsRoot || !panel) return;

        var creatorName = opts.creatorName || '创作者';
        var creatorAv = opts.creatorAv || '';
        var fromPage = opts.fromPage || 'creator-profile.html';

        var activeTabId = 'works';
        var worksLoaded = 0;
        var worksLoading = false;
        var itemMap = {};

        ['works', 'videos', 'exclusive'].forEach(function (key) {
            (TAB_DATA[key] || []).forEach(function (it) {
                itemMap[it.id] = it;
            });
        });

        if (footer && global.DigitalH5Nav && DigitalH5Nav.bindClicks) {
            DigitalH5Nav.bindClicks(footer.parentElement || document);
        }

        function bindPanelInteractions(tabId) {
            if (global.DigitalH5Nav && DigitalH5Nav.bindClicks) {
                DigitalH5Nav.bindClicks(panel);
            }
            panel.querySelectorAll('.cp-paid-row').forEach(function (el) {
                el.addEventListener('click', function () {
                    var href = el.getAttribute('data-go');
                    if (href) {
                        global.location.href = href + (href.indexOf('?') >= 0 ? '&' : '?') + 'from=' + encodeURIComponent(fromPage);
                    }
                });
            });
        }

        function updateFooter(tabId) {
            if (!footer) return;
            var foot = footerForTab(tabId);
            if (foot) {
                footer.hidden = false;
                footer.textContent = foot.text;
                footer.setAttribute('data-go', foot.go);
            } else {
                footer.hidden = true;
            }
        }

        function appendWorksPage() {
            if (worksLoading || activeTabId !== 'works') return;
            var all = TAB_DATA.works;
            if (worksLoaded >= all.length) return;

            worksLoading = true;
            var hint = panel.querySelector('[data-cp-load-hint]');
            if (hint) hint.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 加载中…';

            global.setTimeout(function () {
                var grid = panel.querySelector('[data-cp-grid]');
                if (!grid) {
                    worksLoading = false;
                    return;
                }
                var next = Math.min(worksLoaded + PAGE_SIZE, all.length);
                var chunk = all.slice(worksLoaded, next);
                var frag = chunk.map(renderWorkItemHtml).join('');
                grid.insertAdjacentHTML('beforeend', frag);
                worksLoaded = next;
                worksLoading = false;

                if (hint) {
                    if (worksLoaded >= all.length) {
                        hint.className = 'cp-tab-load-hint is-end';
                        hint.innerHTML = '已展示全部 ' + all.length + ' 个作品';
                    } else {
                        hint.className = 'cp-tab-load-hint';
                        hint.innerHTML = '上滑加载更多（' + worksLoaded + ' / ' + all.length + '）';
                    }
                }
                ensureWorksFillViewport();
            }, 220);
        }

        function ensureWorksFillViewport() {
            if (!scrollRoot || activeTabId !== 'works') return;
            if (worksLoaded >= TAB_DATA.works.length || worksLoading) return;
            if (scrollRoot.scrollHeight <= scrollRoot.clientHeight + 48) appendWorksPage();
        }

        function renderWorksLazy(reset) {
            if (reset) worksLoaded = 0;
            var all = TAB_DATA.works;
            var firstEnd = Math.min(PAGE_SIZE, all.length);
            var slice = all.slice(0, firstEnd);
            worksLoaded = firstEnd;
            var atEnd = worksLoaded >= all.length;
            panel.innerHTML = renderVideoGrid(slice, {
                showLoader: !atEnd,
                showEnd: atEnd
            });
            if (!atEnd) {
                var hint = panel.querySelector('[data-cp-load-hint]');
                if (hint) {
                    hint.innerHTML = '上滑加载更多（' + worksLoaded + ' / ' + all.length + '）';
                }
            }
            bindPanelInteractions('works');
            global.requestAnimationFrame(ensureWorksFillViewport);
        }

        function onScroll() {
            if (activeTabId !== 'works') return;
            if (!scrollRoot) return;
            if (worksLoaded >= TAB_DATA.works.length) return;
            var nearBottom = scrollRoot.scrollTop + scrollRoot.clientHeight >= scrollRoot.scrollHeight - 100;
            if (nearBottom) appendWorksPage();
        }

        function render(tabId) {
            activeTabId = tabId;
            var data = TAB_DATA[tabId] || [];
            if (tabId === 'works') {
                renderWorksLazy(true);
            } else if (tabId === 'showcase') {
                panel.innerHTML = renderShowcaseGrid(data);
                bindPanelInteractions(tabId);
            } else if (tabId === 'videos' || tabId === 'exclusive') {
                panel.innerHTML = renderVideoGrid(data);
                bindPanelInteractions(tabId);
            } else {
                panel.innerHTML = renderVideoGrid(data);
                bindPanelInteractions(tabId);
            }
            updateFooter(tabId);
        }

        panel.addEventListener('click', function (e) {
            var el = e.target.closest('.cp-tab-item');
            if (!el) return;
            var id = el.getAttribute('data-item-id');
            var item = itemMap[id];
            if (!item) {
                item = {
                    id: id,
                    kind: el.getAttribute('data-item-kind'),
                    title: (el.querySelector('.cp-tab-item-title') || {}).textContent || ''
                };
            }
            openWorkItem(item, creatorName, creatorAv, fromPage);
        });

        panel.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var el = e.target.closest('.cp-tab-item');
            if (!el) return;
            e.preventDefault();
            el.click();
        });

        if (scrollRoot) {
            scrollRoot.addEventListener('scroll', onScroll, { passive: true });
        }

        function switchTab(tabId) {
            tabsRoot.querySelectorAll('.c-tab').forEach(function (t) {
                var on = t.getAttribute('data-cp-tab') === tabId;
                t.classList.toggle('active', on);
                t.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            render(tabId);
        }

        tabsRoot.querySelectorAll('.c-tab').forEach(function (t) {
            t.setAttribute('role', 'tab');
            t.setAttribute('tabindex', '0');
            t.addEventListener('click', function () {
                switchTab(t.getAttribute('data-cp-tab'));
            });
            t.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    switchTab(t.getAttribute('data-cp-tab'));
                }
            });
        });

        var showcaseCnt = document.getElementById('cpShowcaseCnt');
        if (showcaseCnt) showcaseCnt.textContent = String(SHOWCASE_TOTAL);

        var initial = 'works';
        try {
            var q = new URLSearchParams(global.location.search).get('tab');
            if (q === 'store') q = 'showcase';
            if (q && TAB_DATA[q]) initial = q;
        } catch (e) { /* ignore */ }
        switchTab(initial);
    }

    global.CreatorProfileH5 = {
        initTabs: initTabs,
        TAB_DATA: TAB_DATA,
        WORKS_TOTAL: WORKS_TOTAL,
        VIDEOS_TOTAL: VIDEOS_TOTAL,
        EXCLUSIVE_TOTAL: EXCLUSIVE_TOTAL
    };
})(typeof window !== 'undefined' ? window : this);
