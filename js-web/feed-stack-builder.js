/**
 * Feed 竖滑内容生成 · 推荐 / 关注 / 直播各 30 条
 */
(function (global) {
    var COUNT = 30;
    var CREATORS = [
        { name: '山野食光', av: 'photo-1487412720507-e7ab37603c6f', lv: 6, tags: ['摄影', '旅行'], verified: true },
        { name: 'Lens 旅记', av: 'photo-1438761681033-6461ffad8d80', lv: 8, tags: ['视频', '京都'], verified: true, quality: true },
        { name: '夜雨听弦', av: 'photo-1500648767791-00dcc994a43e', lv: 7, tags: ['音乐', '现场'], verified: true },
        { name: '代码诗人', av: 'photo-1502685104226-ee32379fefbe', lv: 9, tags: ['科技', 'Web3'], verified: true },
        { name: '银盐时代', av: 'photo-1438761681033-6461ffad8d80', lv: 5, tags: ['胶片', '人像'], verified: false },
        { name: '咖啡店主', av: 'photo-1500648767791-00dcc994a43e', lv: 4, tags: ['生活', 'Vlog'], verified: false },
        { name: '夜间速写', av: 'photo-1502685104226-ee32379fefbe', lv: 6, tags: ['绘画', '直播'], verified: true }
    ];
    var COVERS = [
        'photo-1490806843957-31f4c9a91c65',
        'photo-1506905925346-21bda4d32df4',
        'photo-1465847899084-d164df4dedc6',
        'photo-1522383225653-ed111181a951',
        'photo-1516280440614-37939bbacd81',
        'photo-1493612276216-ee3925520721',
        'photo-1502602898657-3e91760cbb34',
        'photo-1542435503-956c469947f6',
        'photo-1493976040374-85c8e12f0c0e'
    ];
    var TEXTS = [
        '清晨五合目的云海，像被风轻轻吹散的奶油 ☁️ 35mm 定焦在零下 4℃ 拍了三小时。',
        '京都樱花季隐秘机位整理 · GPS + 构图建议 + 原图包。',
        '雨夜小提琴现场，全程不带预告，欢迎来听 🎻',
        'Web3 创作者经济 AMA · 链上订阅与粉丝分层运营。',
        '周末爵士夜直播预告 · 曲目单已整理好。',
        '深夜咖啡馆问答 · 聊聊创作者如何定价订阅内容。',
        '富士山日出延时 · 4K 素材已上传会员区。',
        '街头摄影一日 · 光影与构图实战记录。'
    ];
    var HASHTAGS = ['#富士山', '#旅行摄影', '#爵士夜', '#Web3', '#直播预告', '#Vlog'];
    var FEED_VIDEOS = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
    ];

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

    function detailHref(type, i) {
        if (type === 'live') return 'live-detail.html';
        if (type === 'video' && i % 5 === 1) return 'flow-unlock-paid.html';
        return 'topic-detail.html';
    }

    function buildDevGlass(tipId, tipText) {
        return (
            '<span class="dev-glass-wrap dev-glass-wrap--feed dev-glass-wrap--pop-below">' +
            '<span class="dev-glass-sphere" tabindex="0" aria-describedby="' + tipId + '">' +
            '<span class="dev-glass-sphere-shine"></span>' +
            '<span class="dev-glass-sphere-txt">To 研发</span></span>' +
            '<span class="dev-glass-pop" id="' + tipId + '" role="tooltip">' + tipText + '</span></span>'
        );
    }

    function metaGlassTip(type, previewVariant, liveStatus) {
        if (type === 'live' && liveStatus === 'ended') {
            return '直播已结束：封面展示回放占位；点击仅 Toast 提示，不跳转直播间';
        }
        if (type === 'live') return '展示内容含：正在直播、实时在线观看人数、兴趣标签';
        if (type === 'live-preview' && previewVariant === 'text') {
            return '直播预告（纯文字）：无封面图，仅文案 + 时间';
        }
        if (type === 'live-preview') return '直播预告（图文）：含封面图、计划开播时间、提醒按钮';
        if (type === 'subscribe-locked') return '订阅专属：未订阅展示 Teaser + 解锁墙；点击「立即订阅」打开订阅弹层（可选用积分兑换券）';
        if (type === 'ppv-locked') return '单篇付费：Teaser + 解锁墙；点击「支付解锁」打开单篇弹层（可选用试看券 / 单篇折扣券）';
        return '展示内容含：在线状态、创作者等级、兴趣标签';
    }

    function buildHead(c, i, opts) {
        opts = opts || {};
        var guest = opts.guest;
        var type = opts.type || 'image';
        var liveStatus = opts.liveStatus || 'live';
        var isLive = type === 'live';
        var liveEnded = isLive && liveStatus === 'ended';
        var previewVariant = opts.previewVariant;
        var stackKey = opts.stackKind || 'rec';
        var hours = (i % 23) + 1;
        var tipId = 'devFeedMetaTip_' + stackKey + '_' + i;
        var qualityGlass = buildDevGlass('devFeedQualityTip_' + stackKey + '_' + i, '后台标记');
        var quality = c.quality && !isLive && type !== 'live-preview'
            ? '<span class="tag-quality-wrap"><span class="tag tag-warning">优质</span>' + qualityGlass + '</span>'
            : '';
        var previewTag = type === 'live-preview' ? ' <span class="tag-preview">直播预告</span>' : '';
        var subOnlyTag = type === 'subscribe-locked' ? ' <span class="tag-sub-only">订阅专属</span>' : '';
        var ppvTag = type === 'ppv-locked' ? ' <span class="tag-ppv-only">单篇付费</span>' : '';
        var liveEndedTag = liveEnded ? ' <span class="tag tag-ended-head">已结束</span>' : '';
        var metaLive;
        if (liveEnded) {
            metaLive = '<span class="meta-live-ended"><i class="fa-solid fa-circle"></i>直播已结束</span><span class="dot">·</span>总观看 ' + formatNum(1200 + i * 89);
        } else if (isLive) {
            metaLive = '<span style="color:#fca5a5;font-weight:600">正在直播</span><span class="dot">·</span><i class="fa-regular fa-eye"></i> ' + formatNum(800 + i * 37) + ' 人实时观看';
        } else {
            metaLive = '<span class="meta-online"><i class="fa-solid fa-circle"></i>在线</span><span class="dot">·</span>创作者 LV ' + c.lv + '<span class="dot">·</span>' + hours + ' 小时前';
        }
        var tagHtml = (c.tags || []).map(function (t) {
            return '<span class="meta-tag">' + esc(t) + '</span>';
        }).join('');
        var metaGlass = buildDevGlass(tipId, metaGlassTip(type, previewVariant, liveStatus));
        var followBtn = guest
            ? '<button type="button" class="follow-btn" onclick="location.href=\'modal-login-main.html\'">+ 关注</button>'
            : '<button type="button" class="follow-btn follow-dynamic" data-following="' + (i % 3 === 0 ? 'true' : 'false') + '">' + (i % 3 === 0 ? '已关注' : '+ 关注') + '</button>';
        var subBtn = guest || isLive
            ? ''
            : (type === 'subscribe-locked' || i % 4 === 0
                ? '<button type="button" class="sub-btn btn-open-subscribe" data-creator="' + esc(c.name) + '" data-plan="16" data-av="https://images.unsplash.com/' + c.av + '?w=100">订阅</button>'
                : '');
        var verified = c.verified ? ' <i class="fa-solid fa-circle-check verified"></i>' : '';

        return (
            '<div class="post-head">' +
            '<div class="av av-md' + (guest ? '' : ' av-link') + '" style="background-image:url(\'https://images.unsplash.com/' + c.av + '?w=100\')"' +
            (guest ? '' : ' onclick="location.href=\'creator-profile.html\'" title="查看创作者主页"') + '></div>' +
            '<div class="pi-info"><div class="name">' + esc(c.name) + verified + quality + previewTag + subOnlyTag + ppvTag + liveEndedTag + '</div>' +
            '<div class="pi-meta-row"><div class="meta">' + metaLive + tagHtml + '</div>' + metaGlass + '</div></div>' +
            '<div class="pi-actions">' + followBtn + subBtn + '</div></div>'
        );
    }

    function feedImg(src, alt) {
        return '<img class="feed-img-zoom" src="' + src + '" alt="' + (alt || '') + '" title="点击放大 · 右键可保存">';
    }

    function resolveSlideType(i, stackKind) {
        if (stackKind === 'live') {
            return { type: 'live', liveStatus: i % 2 === 0 ? 'live' : 'ended' };
        }
        if (stackKind === 'follow') {
            return { type: i % 3 === 1 ? 'video' : 'image' };
        }
        if (stackKind === 'rec' && i === 3) {
            return { type: 'subscribe-locked' };
        }
        if (stackKind === 'rec' && i === 7) {
            return { type: 'ppv-locked', ppvPrice: 5 };
        }
        var m = i % 10;
        if (m === 2) return { type: 'live', liveStatus: 'live' };
        if (m === 9) return { type: 'live', liveStatus: 'ended' };
        if (m === 5) return { type: 'live-preview', previewVariant: 'image' };
        if (m === 6) return { type: 'live-preview', previewVariant: 'text' };
        if (m === 1 || m === 4 || m === 8) return { type: 'video' };
        return { type: 'image' };
    }

    function buildLivePreviewSchedule(i, c, previewVariant, guest) {
        var slots = [
            { t: '2026-05-23（周六）21:00 开播', s: '图文预告 · 请注意开播时间', icon: 'fa-clock' },
            { t: '2026-05-25（周三）20:30 开播', s: '纯文字预告 · 请注意开播时间', icon: 'fa-calendar-days' },
            { t: '2026-05-28（周六）19:00 开播', s: '图文预告 · 请注意开播时间', icon: 'fa-clock' }
        ];
        var slot = slots[i % slots.length];
        if (previewVariant === 'text') {
            slot = slots[1];
        }
        var previewId = 'feed-preview-' + i;
        var remindBtn = guest
            ? '<button type="button" class="lp-remind" onclick="location.href=\'modal-login-main.html\'"><i class="fa-regular fa-bell"></i> 预约提醒</button>'
            : '<button type="button" class="lp-remind" data-preview-id="' + previewId + '" data-preview-creator="' + esc(c.name) + '" data-preview-title="' + esc(pick(TEXTS, i).slice(0, 24)) + '" data-preview-time="' + esc(slot.t) + '"><i class="fa-regular fa-bell"></i> 预约提醒</button>';
        return (
            '<div class="live-preview-schedule">' +
            '<div class="lp-icon"><i class="fa-regular ' + slot.icon + '"></i></div>' +
            '<div class="lp-body"><div class="lp-t">' + esc(slot.t) + '</div><div class="lp-s">' + esc(slot.s) + '</div></div>' +
            remindBtn +
            '</div>'
        );
    }

    function buildPpvLockedMedia(c, coverId, i, guest, ppvPrice) {
        ppvPrice = ppvPrice || 5;
        var postId = 'feed-ppv-' + i;
        var postTitle = '京都樱花季隐秘机位 · 完整图集与 GPS';
        var url = 'https://images.unsplash.com/' + coverId + '?w=1200&q=80';
        var av = 'https://images.unsplash.com/' + c.av + '?w=100';
        var unlockBtn = guest
            ? '<button type="button" class="pc-buy" onclick="location.href=\'modal-login-main.html\'"><i class="fa-solid fa-bolt"></i> 登录后解锁</button>'
            : '<button type="button" class="pc-buy btn-open-ppv-unlock" data-creator="' + esc(c.name) + '" data-ppv-price="' + ppvPrice + '" data-post-id="' + postId + '" data-title="' + esc(postTitle) + '" data-av="' + av + '"><i class="fa-solid fa-bolt"></i> ' + ppvPrice + ' USDT 解锁</button>';
        var subBtn = guest
            ? ''
            : '<button type="button" class="pc-sub btn-open-subscribe" data-creator="' + esc(c.name) + '" data-plan="16" data-av="' + av + '"><i class="fa-solid fa-crown"></i> 订阅查看全部</button>';
        return (
            '<div class="paid-cover feed-paid-cover feed-paid-cover--ppv" style="background-image:url(\'' + url + '\')">' +
            '<span class="pc-tag pc-tag--ppv"><i class="fa-solid fa-tag"></i> 单篇 ' + ppvPrice + ' USDT</span>' +
            '<div class="pc-blur-mask" aria-hidden="true"></div>' +
            '<div class="pc-content">' +
            '<div class="pc-lock pc-lock--ppv"><i class="fa-solid fa-lock"></i></div>' +
            '<h4>单篇解锁后可永久查看</h4>' +
            '<p>@' + esc(c.name) + ' · 非订阅者需支付 <b>' + ppvPrice + ' USDT</b> 解锁本篇</p>' +
            '<div class="pc-ctas">' + unlockBtn + subBtn + '</div>' +
            '</div></div>'
        );
    }

    function buildSubscribeLockedMedia(c, coverId, i, guest) {
        var url = 'https://images.unsplash.com/' + coverId + '?w=1200&q=80';
        var t2 = 'https://images.unsplash.com/' + pick(COVERS, i + 2) + '?w=200&q=80';
        var t3 = 'https://images.unsplash.com/' + pick(COVERS, i + 4) + '?w=200&q=80';
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
            '<p>@' + esc(c.name) + ' 本月另有 <b>62</b> 条会员专享 · 16 USDT/月起</p>' +
            '<div class="pc-ctas">' + subBtn + '</div>' +
            '</div>' +
            '<div class="pc-blurred-thumbs" aria-hidden="true">' +
            '<span class="ti" style="background-image:url(\'' + t2 + '\')"></span>' +
            '<span class="ti" style="background-image:url(\'' + t3 + '\')"></span>' +
            '<span class="more-cnt">+60</span>' +
            '</div></div>'
        );
    }

    function buildMediaCenter(type, coverId, i, guest, previewVariant, liveStatus, creator, ppvPrice) {
        liveStatus = liveStatus || 'live';
        if (type === 'subscribe-locked') {
            return buildSubscribeLockedMedia(creator || pick(CREATORS, i), coverId, i, guest);
        }
        if (type === 'ppv-locked') {
            return buildPpvLockedMedia(creator || pick(CREATORS, i), coverId, i, guest, ppvPrice);
        }
        var url = 'https://images.unsplash.com/' + coverId + '?w=1200&q=80';
        if (type === 'live-preview') {
            if (previewVariant !== 'text') {
                return '<div class="post-media-wrap"><div class="post-media post-media--center">' + feedImg(url, '直播预告封面') + '</div></div>';
            }
            return '';
        }
        if (type === 'live') {
            var ended = liveStatus === 'ended';
            var overlay = ended
                ? '<div class="post-media-live-overlay feed-live-overlay--ended">' +
                  '<span class="tag tag-live-ended"><i class="fa-solid fa-circle"></i> 直播已结束</span>' +
                  '<span class="live-ended-summary">本场直播已结束 · 可查看创作者其他内容</span>' +
                  '</div>' +
                  '<div class="feed-live-ended-veil" aria-hidden="true"></div>'
                : '<div class="post-media-live-overlay">' +
                  '<span class="tag tag-danger"><span class="live-pulse"></span>直播中</span>' +
                  '<span class="live-viewers"><i class="fa-solid fa-eye"></i> ' + formatNum(800 + i * 37) + '</span>' +
                  '<span class="feed-live-enter-hint"><i class="fa-solid fa-play"></i> 点击进入直播间</span>' +
                  '</div>';
            return (
                '<div class="post-media-wrap"><div class="post-media post-media--center post-media--live feed-live-tap' +
                (ended ? ' is-ended' : '') + '" data-live-status="' + liveStatus + '" role="button" tabindex="0" title="' +
                (ended ? '直播已结束' : '进入直播间') + '">' +
                '<img class="feed-live-cover" src="' + url + '" alt="">' +
                overlay +
                '</div></div>'
            );
        }
        if (type === 'video') {
            var tipId = 'devFeedVideoAutoplayTip' + i;
            var videoSrc = FEED_VIDEOS[i % FEED_VIDEOS.length];
            return (
                '<div class="post-media-wrap">' +
                '<div class="post-media post-media--center post-media--video feed-video-wrap">' +
                '<video class="feed-stack-video" playsinline muted loop preload="metadata" poster="' + url + '">' +
                '<source src="' + videoSrc + '" type="video/mp4"></video>' +
                '<div class="post-media-play feed-video-play-overlay" aria-hidden="true"><i class="fa-solid fa-play"></i></div></div>' +
                '<span class="dev-glass-wrap dev-glass-wrap--feed dev-glass-wrap--pop-below">' +
                '<span class="dev-glass-sphere" tabindex="0" aria-describedby="' + tipId + '">' +
                '<span class="dev-glass-sphere-shine"></span>' +
                '<span class="dev-glass-sphere-txt">To 研发</span></span>' +
                '<span class="dev-glass-pop" id="' + tipId + '" role="tooltip">免费内容 / 已订阅用户，可以观看的用户刷到这里会自动播放视频；点击画面可暂停 / 继续播放</span>' +
                '</span></div>'
            );
        }
        if (type === 'image' && i % 5 === 0) {
            var u2 = 'https://images.unsplash.com/' + pick(COVERS, i + 2) + '?w=900&q=80';
            return (
                '<div class="post-media-wrap"><div class="post-media post-media--center grid-2">' +
                feedImg(url, '') + feedImg(u2, '') + '</div></div>'
            );
        }
        if (type === 'image') {
            return '<div class="post-media-wrap"><div class="post-media post-media--center">' + feedImg(url, '') + '</div></div>';
        }
        return '<div class="post-media-wrap"><div class="post-media post-media--center"><img src="' + url + '" alt=""></div></div>';
    }

    function buildActions(i, guest, type, liveStatus) {
        var likes = 400 + i * 67;
        var comments = 20 + i * 11;
        var guestCls = guest ? ' guest-act' : '';
        var liveOngoing = type === 'live' && liveStatus !== 'ended';
        var liveExtra = liveOngoing
            ? '<span class="a-btn' + guestCls + '" onclick="' + (guest ? "location.href='modal-login-main.html'" : 'FL_openDanmakuModal()') + '"><i class="fa-regular fa-comment"></i>实时弹幕</span>' +
              '<span class="a-btn tip-cta' + guestCls + '" onclick="' + (guest ? "location.href='modal-login-main.html'" : "FL_openInteractionModal('gift-modal.html')") + '"><i class="fa-solid fa-gift"></i>送礼</span>'
            : '<span class="a-btn tip-cta' + guestCls + '" onclick="' + (guest ? "location.href='modal-login-main.html'" : "FL_openInteractionModal('gift-modal.html')") + '"><i class="fa-solid fa-gift"></i>打赏</span>' +
              '<span class="a-btn bookmark-act' + guestCls + '" role="button"><i class="fa-regular fa-bookmark"></i><span>收藏</span></span>';
        var commentClick = guest ? '' : ' onclick="FL_openInteractionModal(\'comment-modal.html\')"';
        var shareClick = guest ? " onclick=\"location.href='modal-login-main.html'\"" : ' onclick="FL_openInteractionModal(\'share-modal.html\')"';

        return (
            '<div class="post-actions">' +
            '<span class="a-btn like-act' + guestCls + '" role="button"><i class="fa-regular fa-heart"></i><span class="lc">' + formatNum(likes) + '</span></span>' +
            '<span class="a-btn' + guestCls + '"' + commentClick + '><i class="fa-regular fa-comment"></i>' + comments + '</span>' +
            '<span class="a-btn' + guestCls + '"' + shareClick + '><i class="fa-solid fa-arrow-up-right-from-square"></i>分享</span>' +
            liveExtra +
            '</div>'
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
        var text = pick(TEXTS, i);
        var tags = '<span class="hashtag">' + pick(HASHTAGS, i) + '</span> <span class="hashtag">' + pick(HASHTAGS, i + 1) + '</span>';
        var previewVariant = resolved.previewVariant;
        var liveStatus = resolved.liveStatus || 'live';

        var bodyInner = '';
        if (type === 'live') {
            bodyInner += '<div class="post-text">' + (liveStatus === 'ended' ? '📺 ' : '🎻 ') + esc(text) + '</div>';
        } else if (type === 'live-preview') {
            bodyInner += '<div class="post-text">' + esc(text) + '<br>' + tags + '</div>';
            bodyInner += buildLivePreviewSchedule(i, c, previewVariant, guest);
        } else if (type === 'subscribe-locked') {
            bodyInner += '<div class="post-text post-text--teaser">' +
                '<span class="teaser-label"><i class="fa-solid fa-eye-slash"></i> 未订阅仅可见摘要</span><br>' +
                esc('雨夜小提琴排练室幕后 · 完整 4K 花絮、分轨试听与曲谱注释仅对订阅者开放。') + '<br>' + tags +
                '</div>';
        } else if (type === 'ppv-locked') {
            bodyInner += '<div class="post-text post-text--teaser">' +
                '<span class="teaser-label teaser-label--ppv"><i class="fa-solid fa-tag"></i> 单篇付费 · 未解锁仅可见摘要</span><br>' +
                esc('京都樱花季隐秘机位整理 · 含 GPS 坐标、最佳时段与 12 张 RAW 原图——完整图集需单篇解锁或订阅创作者。') + '<br>' + tags +
                '</div>';
        } else {
            bodyInner += '<div class="post-text">' + esc(text) + '<br>' + tags + '</div>';
        }
        bodyInner += buildMediaCenter(type, cover, i, guest, previewVariant, liveStatus, c, ppvPrice);

        return (
            '<div class="feed-stack-slide">' +
            '<article class="post-card post-card--immersive" data-post-type="' + type + '"' +
            (type === 'live' ? ' data-live-status="' + liveStatus + '"' : '') +
            (previewVariant ? ' data-preview-variant="' + previewVariant + '"' : '') +
            ' data-creator="' + esc(c.name) + '" data-detail-href="' + detailHref(type, i) + '">' +
            buildHead(c, i, { guest: guest, type: type, previewVariant: previewVariant, liveStatus: liveStatus, stackKind: stackKind }) +
            '<div class="post-card-body">' + bodyInner + '</div>' +
            buildActions(i, guest, type, liveStatus) +
            '</article></div>'
        );
    }

    function fillTrack(trackId, stackKind, opts) {
        var track = document.getElementById(trackId);
        if (!track) return 0;
        var n = parseInt(track.getAttribute('data-build'), 10) || COUNT;
        var html = '';
        for (var i = 0; i < n; i++) {
            html += buildSlide(i, stackKind, opts);
        }
        track.innerHTML = html;
        return n;
    }

    global.FL_buildFeedStacks = function (opts) {
        opts = opts || {};
        var guest = !!opts.guest;
        fillTrack('feedStackTrack', 'rec', { guest: guest });
        fillTrack('feedFollowStackTrack', 'follow', { guest: guest });
        fillTrack('feedLiveStackTrack', 'live', { guest: guest });
    };

    function autoBuild() {
        var track = document.getElementById('feedStackTrack');
        if (track && track.getAttribute('data-build') && !track.children.length) {
            global.FL_buildFeedStacks({ guest: document.body && document.body.classList.contains('is-guest-home') });
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoBuild);
    } else {
        autoBuild();
    }
})(window);
