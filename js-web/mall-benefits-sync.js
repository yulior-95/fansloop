/**
 * 积分商城 · 当前权益 Hero 动态渲染
 */
(function (global) {
    var DEV_ROW_HTML =
        '<div class="bp-row bp-row--dev">' +
        '<span class="dot"></span>' +
        '<div><div class="ti">积分加速卡 · +20% 收益</div>' +
        '<div class="exp">生效至 2026-05-04 14:32 · 可与每日上限提升叠加（受封顶规则约束）</div></div>' +
        '<span class="dev-glass-wrap dev-glass-wrap--pop-left dev-glass-wrap--layer-top bp-row-glass">' +
        '<span class="dev-glass-sphere" tabindex="0" aria-describedby="devBpRowTip">' +
        '<span class="dev-glass-sphere-shine"></span><span class="dev-glass-sphere-txt">To 研发</span></span>' +
        '<span class="dev-glass-pop dev-glass-pop--wide" id="devBpRowTip" role="tooltip">' +
        '<strong>当前权益条目 · 后台配置</strong><ol>' +
        '<li>积分商品名称</li><li>到期日期时间</li><li>商品显示说明</li>' +
        '<li>宽高保持不变，标题固定不动，下方内容支持上下滑动查看</li></ol></span></span></div>';

    function rowHtml(row) {
        var dotStyle = row.dot ? ' style="background:' + row.dot + '"' : '';
        var idAttr = row.id ? ' id="' + row.id + '"' : '';
        return '<div class="bp-row"' + idAttr + '>' +
            '<span class="dot"' + dotStyle + '></span>' +
            '<div><div class="ti">' + row.title + '</div>' +
            '<div class="exp">' + row.exp + '</div></div></div>';
    }

    function renderHero(containerId) {
        var box = document.getElementById(containerId || 'benefitViewCurrent');
        if (!box || !global.MallVouchersStore) return;
        var rows = global.MallVouchersStore.getBenefitHeroRows();
        var html = DEV_ROW_HTML;
        if (rows.length) {
            html += rows.map(rowHtml).join('');
        } else {
            html += '<div class="bp-row"><span class="dot"></span><div>' +
                '<div class="ti">暂无生效中的兑换权益</div>' +
                '<div class="exp">兑换成功后权益将显示在此处，请在有效期内使用</div></div></div>';
        }
        box.innerHTML = html;
    }

    function redeemToastMessage(voucher) {
        if (!voucher) return '兑换成功 · 权益已下发（原型演示）';
        var map = {
            ppv_trial: '兑换成功 · 试看券已入账，解锁付费内容时可选用',
            daily_cap_boost: '兑换成功 · 今日积分获取上限已提升',
            checkin_double: '兑换成功 · 下一次签到奖励将 ×2',
            invite_boost: '兑换成功 · 邀请返利 +' + (voucher.bonusPercent || 10) + '% 已生效',
            avatar_frame: '兑换成功 · 霓虹头像框已佩戴',
            comment_highlight: '兑换成功 · 评论高亮已生效，发表评论即可展示',
            tip_boost: '兑换成功 · 打赏加成卡已生效，打赏时可使用平台补贴',
            sub_discount: '兑换成功 · ' + voucher.name + ' 已放入券包，订阅时可选用',
            ppv_discount: '兑换成功 · ' + voucher.name + ' 已放入券包，解锁时可选用'
        };
        return map[voucher.type] || ('兑换成功 · ' + voucher.name + ' 已下发');
    }

    global.MallBenefitsSync = {
        renderHero: renderHero,
        redeemToastMessage: redeemToastMessage
    };

    document.addEventListener('fl-mall-benefits-changed', function () {
        renderHero('benefitViewCurrent');
    });
    document.addEventListener('fl-tip-boost-consumed', function () {
        renderHero('benefitViewCurrent');
    });
})(typeof window !== 'undefined' ? window : this);
