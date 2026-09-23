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

    var H5_DEMO_BENEFIT_ROWS = [
        { dot: '#FBBF24', title: '积分加速卡 · +20% 收益', exp: '至 2026-05-04 14:32 · 可与每日上限提升叠加（受封顶规则约束）' },
        { dot: '#A855F7', title: '付费内容试看券 · 剩余 2 次', exp: '解锁后 24h 内有效 · 适用于支持试看的创作者' },
        { dot: '#93C5FD', title: '每日上限提升卡 · 生效中', exp: '当日积分获取上限 50 → 100 · 次日 0 点恢复默认' },
        { dot: '#10B981', title: '连续签到翻倍卡 · 待使用', exp: '下一次签到奖励 ×2 · 须在 2026-05-12 前使用' },
        { dot: '#EC4899', title: '订阅 9 折券 · 1 张', exp: '至 2026-05-10 前于订阅收银台选用' },
        { dot: '#F59E0B', title: '打赏加成卡 · 剩余 1 次', exp: '平台额外 +10% 补贴创作者 · 单次打赏有效' }
    ];

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
        var isH5Mall = !!(global.document && global.document.querySelector('.pm-h5-wrap'));
        var html = isH5Mall ? '' : DEV_ROW_HTML;
        if (rows.length) {
            html += rows.map(rowHtml).join('');
        } else if (isH5Mall) {
            html += H5_DEMO_BENEFIT_ROWS.map(rowHtml).join('');
        } else {
            html += '<div class="bp-row bp-row--empty"><span class="dot"></span><div>' +
                '<div class="ti">暂无生效中的兑换权益</div>' +
                '<div class="exp">兑换成功后权益将显示在此处，请在有效期内使用</div></div></div>';
        }
        box.innerHTML = html;
    }

    function redeemToastMessage(voucher) {
        if (!voucher) return '兑换成功 · 权益已下发（原型演示）';
        var map = {
            ppv_trial: '兑换成功 · 试看券已入账，解锁付费内容时可选用',
            points_boost: '兑换成功 · 积分加速卡已生效，24h 内任务积分按倍率结算',
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
