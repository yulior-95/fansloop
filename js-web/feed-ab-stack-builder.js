/**
 * 首页 A/B 方案 B · Feed 内容生成（抖音 Web 风叠加布局）
 */
(function (global) {
    var COUNT = 30;
    var CREATORS = [
        { name: '山野食光', av: 'photo-1487412720507-e7ab37603c6f', lv: 6, tags: ['摄影', '旅行'], verified: true },
        { name: 'Lens 旅记', av: 'photo-1438761681033-6461ffad8d80', lv: 8, tags: ['视频', '京都'], verified: true },
        { name: '夜雨听弦', av: 'photo-1500648767791-00dcc994a43e', lv: 7, tags: ['音乐', '现场'], verified: true },
        { name: '代码诗人', av: 'photo-1502685104226-ee32379fefbe', lv: 9, tags: ['科技', 'Web3'], verified: true },
        { name: '银盐时代', av: 'photo-1438761681033-6461ffad8d80', lv: 5, tags: ['胶片', '人像'], verified: false },
        { name: '咖啡店主', av: 'photo-1500648767791-00dcc994a43e', lv: 4, tags: ['生活', 'Vlog'], verified: false }
    ];
    var COVERS = [
        'photo-1490806843957-31f4c9a91c65',
        'photo-1506905925346-21bda4d32df4',
        'photo-1465847899084-d164df4dedc6',
        'photo-1522383225653-ed111181a951',
        'photo-1516280440614-37939bbacd81',
        'photo-1493612276216-ee3925520721',
        'photo-1502602898657-3e91760cbb34',
        'photo-1542435503-956c469947f6'
    ];
    var TEXTS = [
        '清晨五合目的云海，像被风轻轻吹散的奶油 ☁️',
        '京都樱花季隐秘机位整理 · GPS + 构图建议',
        '雨夜小提琴现场，全程不带预告 🎻',
        'Web3 创作者经济 AMA · 链上订阅与粉丝分层',
        '周末爵士夜直播预告 · 曲目单已整理好',
        '深夜咖啡馆问答 · 聊聊创作者如何定价',
        '富士山日出延时 · 4K 素材已上传会员区',
        '街头摄影一日 · 光影与构图实战记录'
    ];
    var HASHTAGS = ['#富士山', '#旅行摄影', '#爵士夜', '#Web3', '#直播预告', '#Vlog'];
    var LONG_TEXT_SAMPLE =
        '清晨五合目的云海，像被风轻轻吹散的奶油。凌晨从东京包车出发，三点半到五合目；零下四度的寒风里手指几乎握不住快门。' +
        '云海从深谷翻涌而上，金色光线只持续不到八分钟，却足以让人忘记所有疲惫。' +
        '下山后在便利店买了一罐热咖啡，坐在窗边翻看 RAW 原片，发现云层边缘有一束意外的彩虹。' +
        '如果你也计划冬季登富士，记得带足保暖层、备用电池，以及一颗愿意早起的心。' +
        '完整机位坐标、最佳季节与构图建议已整理在会员区；文末附上三脚架摆放示意与延时参数表，欢迎订阅获取。' +
        '拍摄当日风速较大，建议使用快门线并开启机身防抖，避免长曝光画面发虚。';
    var FEED_VIDEOS = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    ];

    var CREATOR_LIVE_HOST = {
        '山野食光': 'shanye',
        'Lens 旅记': 'lens',
        '夜雨听弦': 'yeyu',
        '代码诗人': 'codepoet',
        '银盐时代': 'yinyan',
        '咖啡店主': 'coffee',
        '夜间速写': 'nightsketch'
    };

    function liveDetailHref(creatorName, liveStatus) {
        if (liveStatus === 'ended') return 'live-detail-ab.html';
        var slug = CREATOR_LIVE_HOST[creatorName] || 'novaplay';
        if (global.LiveViewHost && global.LiveViewHost.buildLiveDetailUrl) {
            return global.LiveViewHost.buildLiveDetailUrl(slug, creatorName, 'home');
        }
        return 'live-detail-ab.html?host=' + encodeURIComponent(slug) +
            '&creator=' + encodeURIComponent(creatorName) + '&nav=home';
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function pick(arr, i) {
        return arr[i % arr.length];
    }

    function formatNum(n) {
        return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
    }

    function pickText(i) {
        if (i % 8 === 0) {
            return LONG_TEXT_SAMPLE;
        }
        var base = pick(TEXTS, i);
        if (i % 11 === 3) {
            return base + ' 完整版包含分轨试听、排练花絮与幕后采访，订阅者可下载 4K 母带。';
        }
        return base;
    }

    function wrapCaption(innerHtml, extraClass) {
        extraClass = extraClass || '';
        return (
            '<div class="post-text post-text--clampable' + extraClass + '">' +
            '<div class="post-text-inner">' + innerHtml + '</div>' +
            '<button type="button" class="post-text-toggle" hidden aria-expanded="false">' +
            '<span class="post-text-toggle-more">更多</span>' +
            '<span class="post-text-toggle-less">收起</span>' +
            '</button></div>'
        );
    }

    function resolveSlideType(i, stackKind) {
        if (stackKind === 'live') {
            return { type: 'live', liveStatus: i % 2 === 0 ? 'live' : 'ended' };
        }
        if (stackKind === 'follow') {
            return { type: i % 3 === 1 ? 'video' : 'image' };
        }
        if (stackKind === 'rec' && i === 4) return { type: 'subscribe-locked' };
        if (stackKind === 'rec' && i === 9) return { type: 'ppv-locked', ppvPrice: 5 };
        var m = i % 10;
        if (m === 2) return { type: 'live', liveStatus: 'live' };
        if (m === 8) return { type: 'live', liveStatus: 'ended' };
        if (m === 5) return { type: 'live-preview', previewVariant: 'image' };
        if (m === 1 || m === 4 || m === 7) return { type: 'video' };
        return { type: 'image' };
    }

    function buildMediaStage(type, coverId, i, guest, previewVariant, liveStatus, creator, ppvPrice) {
        liveStatus = liveStatus || 'live';
        var url = 'https://images.unsplash.com/' + coverId + '?w=1400&q=85';
        var c = creator || pick(CREATORS, i);

        if (type === 'subscribe-locked') {
            var subBtn = guest
                ? '<button type="button" class="pc-sub" onclick="location.href=\'modal-login-main.html\'"><i class="fa-solid fa-crown"></i> 登录后订阅</button>'
                : '<button type="button" class="pc-sub btn-open-subscribe" data-creator="' + esc(c.name) + '" data-plan="16" data-av="https://images.unsplash.com/' + c.av + '?w=100"><i class="fa-solid fa-crown"></i> 立即订阅</button>';
            return (
                '<div class="paid-cover feed-paid-cover" style="background-image:url(\'' + url + '\')">' +
                '<span class="pc-tag"><i class="fa-solid fa-crown"></i> 订阅专属</span>' +
                '<div class="pc-blur-mask" aria-hidden="true"></div>' +
                '<div class="pc-content">' +
                '<div class="pc-lock"><i class="fa-solid fa-lock"></i></div>' +
                '<h4>订阅后解锁全部内容</h4>' +
                '<p>@' + esc(c.name) + ' · 16 USDT/月起</p>' +
                '<div class="pc-ctas">' + subBtn + '</div></div></div>'
            );
        }

        if (type === 'ppv-locked') {
            ppvPrice = ppvPrice || 5;
            var wl = global.FLRiskWhitelistStore;
            if (!guest && wl && wl.isCurrentUserContentWhitelisted && wl.isCurrentUserContentWhitelisted()) {
                return '<img class="feed-img-zoom" src="' + url + '" alt="已解锁">';
            }
            var unlockBtn = guest
                ? '<button type="button" class="pc-sub" onclick="location.href=\'modal-login-main.html\'"><i class="fa-solid fa-lock-open"></i> 登录后购买</button>'
                : '<button type="button" class="pc-sub btn-open-ppv" data-post-id="ab-ppv-' + i + '" data-price="' + ppvPrice + '" data-creator="' + esc(c.name) + '"><i class="fa-solid fa-bolt"></i> ' + ppvPrice + ' USDT 解锁</button>';
            return (
                '<div class="paid-cover feed-paid-cover" style="background-image:url(\'' + url + '\')">' +
                '<span class="pc-tag pc-tag--ppv"><i class="fa-solid fa-tag"></i> 按篇付费</span>' +
                '<div class="pc-blur-mask"></div>' +
                '<div class="pc-content"><div class="pc-lock"><i class="fa-solid fa-lock"></i></div>' +
                '<h4>购买后查看完整内容</h4><p>' + ppvPrice + ' USDT · @' + esc(c.name) + '</p>' +
                '<div class="pc-ctas">' + unlockBtn + '</div></div></div>'
            );
        }

        if (type === 'live-preview' && previewVariant !== 'text') {
            return '<img class="feed-img-zoom" src="' + url + '" alt="直播预告">';
        }
        if (type === 'live-preview' && previewVariant === 'text') {
            return '<div style="width:100%;height:100%;background:linear-gradient(145deg,#1a1030,#0f172a);"></div>';
        }

        if (type === 'live') {
            var ended = liveStatus === 'ended';
            var hostSlug = CREATOR_LIVE_HOST[c.name] || 'novaplay';
            var overlay = ended
                ? '<div class="post-media-live-overlay feed-live-overlay--ended"><span class="tag tag-live-ended"><i class="fa-solid fa-circle"></i> 已结束</span></div>'
                : '<div class="post-media-live-overlay"><span class="tag tag-danger"><span class="live-pulse"></span>直播中</span>' +
                  '<span class="feed-live-enter-hint"><i class="fa-solid fa-play"></i> 点击进入</span></div>';
            return (
                '<div class="feed-live-tap' + (ended ? ' is-ended' : '') + '" data-live-status="' + liveStatus + '"' +
                ' data-creator="' + esc(c.name) + '"' +
                (ended ? '' : ' data-host-slug="' + hostSlug + '"') +
                ' role="button" tabindex="0">' +
                '<img class="feed-live-cover" src="' + url + '" alt="">' + overlay + '</div>'
            );
        }

        if (type === 'video') {
            var videoSrc = FEED_VIDEOS[i % FEED_VIDEOS.length];
            return (
                '<div class="feed-video-wrap">' +
                '<video class="feed-stack-video ab-feed-video" playsinline muted loop preload="metadata" poster="' + url + '">' +
                '<source src="' + videoSrc + '" type="video/mp4"></video>' +
                '<div class="feed-video-play-overlay"><i class="fa-solid fa-play"></i></div></div>'
            );
        }

        return '<img class="feed-img-zoom" src="' + url + '" alt="">';
    }

    function buildTopLeft(c, i, opts) {
        var guest = !!opts.guest;
        var type = opts.type;
        var liveStatus = opts.liveStatus;
        var verified = c.verified
            ? ' <span class="fl-badge fl-badge--creator" title="认证创作者"><i class="fa-solid fa-palette"></i></span>'
            : '';
        var followBtn = guest
            ? '<button type="button" class="ab-follow-btn" onclick="location.href=\'modal-login-main.html\'">+ 关注</button>'
            : '<button type="button" class="ab-follow-btn follow-dynamic" data-following="' + (i % 3 === 0 ? 'true' : 'false') + '">' + (i % 3 === 0 ? '已关注' : '+ 关注') + '</button>';
        var subLine = 'LV ' + c.lv + ' · ' + (c.tags || []).slice(0, 2).join(' / ');
        var badge = '';
        if (type === 'live' && liveStatus !== 'ended') {
            badge = '<span class="ab-type-badge ab-type-badge--live"><span class="pulse"></span> 直播中</span>';
        } else if (type === 'subscribe-locked') {
            badge = '<span class="ab-type-badge"><i class="fa-solid fa-crown"></i> 订阅专属</span>';
        } else if (type === 'ppv-locked') {
            badge = '<span class="ab-type-badge"><i class="fa-solid fa-tag"></i> 按篇付费</span>';
        }

        return (
            '<div class="ab-creator-row">' +
            '<div class="ab-creator-av av-link" style="background-image:url(\'https://images.unsplash.com/' + c.av + '?w=120\')"' +
            (guest ? '' : ' onclick="location.href=\'creator-profile.html\'" title="查看主页"') + '></div>' +
            '<div class="ab-creator-meta">' +
            '<div class="ab-creator-name-line">' +
            '<span class="ab-creator-name av-link"' + (guest ? '' : ' onclick="location.href=\'creator-profile.html\'"') + '>' + esc(c.name) + verified + '</span>' +
            followBtn +
            '</div>' +
            '<span class="ab-creator-sub">' + esc(subLine) + '</span>' +
            '</div></div>' + badge
        );
    }

    function buildCaption(i, type, guest, previewVariant, liveStatus) {
        var tags = '<span class="hashtag">' + pick(HASHTAGS, i) + '</span> <span class="hashtag">' + pick(HASHTAGS, i + 1) + '</span>';
        var text = pickText(i);
        if (type === 'live') {
            return wrapCaption((liveStatus === 'ended' ? '📺 ' : '🎻 ') + esc(text));
        }
        if (type === 'subscribe-locked') {
            return wrapCaption(
                '<span class="teaser-label"><i class="fa-solid fa-eye-slash"></i> 摘要预览</span>' +
                esc('雨夜小提琴排练室幕后 · 完整 4K 花絮仅对订阅者开放。') + '<br>' + tags,
                ' post-text--teaser'
            );
        }
        if (type === 'ppv-locked') {
            return wrapCaption(
                '<span class="teaser-label"><i class="fa-solid fa-tag"></i> 付费摘要</span>' +
                esc('京都樱花季隐秘机位 · 含 GPS 与 12 张 RAW 原图。') + '<br>' + tags,
                ' post-text--teaser'
            );
        }
        return wrapCaption(esc(text) + '<br>' + tags);
    }

    function buildRail(i, guest, type, liveStatus) {
        var likes = 400 + i * 67;
        var comments = 20 + i * 11;
        var guestCls = guest ? ' guest-act' : '';
        var liveOngoing = type === 'live' && liveStatus !== 'ended';
        var commentAttr = guest ? ' data-guest-act="1"' : ' data-fl-modal="comment-modal.html"';
        var shareAttr = guest ? ' data-guest-act="1"' : ' data-fl-modal="share-modal.html"';
        var giftClick = guest ? " onclick=\"location.href='modal-login-main.html'\"" : ' onclick="FL_openGiftModal(this)"';
        var danmakuClick = guest ? " onclick=\"location.href='modal-login-main.html'\"" : ' onclick="FL_openDanmakuModal()"';

        var extra = liveOngoing
            ? '<button type="button" class="ab-rail-btn' + guestCls + '"' + danmakuClick + '><i class="fa-regular fa-comment-dots"></i><span>弹幕</span></button>'
            : '<button type="button" class="ab-rail-btn bookmark-act' + guestCls + '" role="button"><i class="fa-regular fa-bookmark"></i><span>收藏</span></button>';

        return (
            '<button type="button" class="ab-rail-btn like-act' + guestCls + '" role="button">' +
            '<i class="fa-regular fa-heart"></i><span class="lc">' + formatNum(likes) + '</span></button>' +
            '<button type="button" class="ab-rail-btn' + guestCls + '"' + commentAttr + '>' +
            '<i class="fa-regular fa-comment"></i><span>' + comments + '</span></button>' +
            '<button type="button" class="ab-rail-btn tip-cta' + guestCls + '"' + giftClick + '>' +
            '<i class="fa-solid fa-gift"></i><span>打赏</span></button>' +
            '<button type="button" class="ab-rail-btn' + guestCls + '"' + shareAttr + '>' +
            '<i class="fa-solid fa-share"></i><span>分享</span></button>' +
            extra +
            '<button type="button" class="ab-rail-btn report-act' + guestCls + '" role="button" title="举报">' +
            '<i class="fa-regular fa-flag"></i><span>举报</span></button>'
        );
    }

    function buildSlide(i, stackKind, opts) {
        opts = opts || {};
        var guest = !!opts.guest;
        var resolved = resolveSlideType(i, stackKind);
        var type = resolved.type;
        var ppvPrice = resolved.ppvPrice || 5;
        var c = type === 'subscribe-locked' ? CREATORS[2] : (type === 'ppv-locked' ? CREATORS[1] : pick(CREATORS, i));
        var cover = type === 'subscribe-locked' ? COVERS[2] : (type === 'ppv-locked' ? COVERS[4] : pick(COVERS, i));
        var previewVariant = resolved.previewVariant;
        var liveStatus = resolved.liveStatus || 'live';

        return (
            '<div class="ab-feed-slide" data-post-type="' + type + '"' +
            ' data-feed-id="ab-' + stackKind + '-' + i + '"' +
            (type === 'live' ? ' data-live-status="' + liveStatus + '"' : '') +
            ' data-creator="' + esc(c.name) + '"' +
            (type === 'live' ? ' data-detail-href="' + liveDetailHref(c.name, liveStatus) + '"' : '') + '>' +
            '<div class="ab-feed-media-stage">' + buildMediaStage(type, cover, i, guest, previewVariant, liveStatus, c, ppvPrice) + '</div>' +
            '<div class="ab-feed-scrim ab-feed-scrim--top"></div>' +
            '<div class="ab-feed-scrim ab-feed-scrim--bottom"></div>' +
            '<div class="ab-feed-ol ab-feed-ol--tl">' + buildTopLeft(c, i, { guest: guest, type: type, liveStatus: liveStatus }) + '</div>' +
            '<div class="ab-feed-ol ab-feed-ol--bl">' + buildCaption(i, type, guest, previewVariant, liveStatus) + '</div>' +
            '<div class="ab-feed-ol ab-feed-ol--br">' + buildRail(i, guest, type, liveStatus) + '</div>' +
            '</div>'
        );
    }

    function fillTrack(trackId, stackKind, opts) {
        var track = document.getElementById(trackId);
        if (!track) return 0;
        var n = parseInt(track.getAttribute('data-build'), 10) || COUNT;
        var html = '';
        var R = global.FL_ContentReport;
        for (var j = 0; j < n; j++) {
            var fid = 'ab-' + stackKind + '-' + j;
            if (R && R.isReported(fid)) continue;
            html += buildSlide(j, stackKind, opts);
        }
        track.innerHTML = html;
        if (global.FL_applyPostTextClamp) {
            global.FL_applyPostTextClamp(track);
        }
        return n;
    }

    global.FL_buildAbFeedStacks = function (opts) {
        opts = opts || {};
        var guest = !!opts.guest;
        fillTrack('abFeedTrack', 'rec', { guest: guest });
        fillTrack('abFeedFollowTrack', 'follow', { guest: guest });
        fillTrack('abFeedLiveTrack', 'live', { guest: guest });
    };

    function autoBuild() {
        var track = document.getElementById('abFeedTrack');
        if (track && track.getAttribute('data-build') && !track.children.length) {
            global.FL_buildAbFeedStacks({ guest: document.body && document.body.classList.contains('is-guest-home') });
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoBuild);
    } else {
        autoBuild();
    }
})(window);
