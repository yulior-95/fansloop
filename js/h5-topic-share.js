/**
 * H5 话题页分享 · 复用 H5ShareSheets（与首页/创作者主页一致）
 */
(function (global) {
    var SHARE_FRIENDS = [
        { id: 'f1', name: 'Ken', handle: '@ken_film', av: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80', chatUrl: 'messages-chat.html?peer=Ken&shared=topic' },
        { id: 'f2', name: 'Nova', handle: '@nova_room', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80', chatUrl: 'messages-chat.html?peer=Nova&shared=topic' },
        { id: 'f3', name: 'Mika', handle: '@mika_daily', av: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80', chatUrl: 'messages-chat.html?peer=Mika&shared=topic' }
    ];
    var SHARE_GROUPS = [
        { id: 'g1', name: '京都创作交流群', members: 128, chatUrl: 'messages-chat.html?group=kyoto-creators&shared=topic' },
        { id: 'g2', name: 'GOODFANS 创作者互助', members: 56, chatUrl: 'messages-chat.html?group=gf-creators&shared=topic' }
    ];

    var DEFAULT_META = {
        title: '# 富士山日出 · 热门话题',
        by: 'GOODFANS · 18.6K 帖',
        thumb: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&q=80',
        url: 'https://goodfans.io/t/mt-fuji-sunrise?ref=h5'
    };

    var metaOverride = null;
    var shareApi = null;

    function getMeta() {
        return metaOverride || DEFAULT_META;
    }

    function openShare(next) {
        metaOverride = next || null;
        if (shareApi && typeof shareApi.open === 'function') {
            shareApi.open();
            return;
        }
    }

    function metaFromPost(article) {
        if (!article) return DEFAULT_META;
        var text = article.querySelector('.text');
        var nm = article.querySelector('.head .nm');
        var snippet = text ? (text.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) : DEFAULT_META.title;
        return {
            title: snippet,
            by: (nm && nm.textContent ? nm.textContent.split('·')[0].trim() : '创作者') + ' · 富士山日出',
            thumb: DEFAULT_META.thumb,
            url: DEFAULT_META.url + '&post=demo'
        };
    }

    function initTopicShare() {
        if (!global.H5ShareSheets) return;
        var heroBtn = document.getElementById('tdH5BtnShare');
        if (!heroBtn) return;

        shareApi = global.H5ShareSheets.init({
            openBtn: heroBtn,
            overlayId: 'tdShareOverlay',
            mainSheetId: 'tdShareSheet',
            dmSheetId: 'tdShareDmSheet',
            groupSheetId: 'tdShareGroupSheet',
            mainCloseId: 'tdShareClose',
            openDmId: 'tdShareOpenDm',
            openGroupId: 'tdShareOpenGroup',
            thumbId: 'tdShareThumb',
            titleId: 'tdShareTitle',
            byId: 'tdShareBy',
            urlId: 'tdShareUrl',
            copyId: 'tdShareCopy',
            gridId: 'tdShareGrid',
            dmListId: 'tdShareDmList',
            dmSearchId: 'tdShareDmSearch',
            dmSendId: 'tdShareDmSend',
            dmHintId: 'tdShareDmHint',
            dmCloseId: 'tdShareDmClose',
            groupListId: 'tdShareGroupList',
            groupSearchId: 'tdShareGroupSearch',
            groupSendId: 'tdShareGroupSend',
            groupHintId: 'tdShareGroupHint',
            groupCloseId: 'tdShareGroupClose',
            getMeta: getMeta,
            friends: SHARE_FRIENDS,
            groups: SHARE_GROUPS
        });

        document.querySelectorAll('[data-h5-topic-share]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                openShare(metaFromPost(el.closest('.h5-td-post')));
            });
        });

        if (typeof global.FL_bindTopicDetailTabs === 'function') {
            global.FL_bindTopicDetailTabs(document);
        }
    }

    global.H5TopicShare = { open: openShare, init: initTopicShare };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTopicShare);
    } else {
        initTopicShare();
    }
})(typeof window !== 'undefined' ? window : this);
