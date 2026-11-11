/** 申请页 · 研发玻璃球 markup（与 dev-glass-note.css 一致） */
(function (global) {
    global.AD_APPLY_GLASS_HTML =
        '<span class="dev-glass-wrap dev-glass-wrap--align-end dev-glass-wrap--pop-below dev-glass-wrap--layer-top">' +
        '<span class="dev-glass-sphere" tabindex="0" aria-describedby="adApplyPrereqTip">' +
        '<span class="dev-glass-sphere-shine"></span>' +
        '<span class="dev-glass-sphere-txt">说明</span></span>' +
        '<span class="dev-glass-pop dev-glass-pop--wide" id="adApplyPrereqTip" role="tooltip"></span></span>';
})(typeof window !== 'undefined' ? window : this);
