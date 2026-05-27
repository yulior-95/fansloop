/**
 * 平台活动 / 系统公告 · 图文详情弹窗数据与打开逻辑
 */
(function (global) {
    var PRESETS = {
        'growth-plan': {
            badge: '平台活动',
            title: '创作者增长计划 · 流量加权开启',
            time: '2026年5月27日 09:00',
            hero: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80',
            body: [
                'FansLoop 面向全体认证创作者开启「增长计划」：完成阶段性目标即可获得首页推荐加权、专属徽章与数据看板进阶权限。',
                '本期目标包含：发布 ≥3 条优质图文、直播累计 ≥2 小时、粉丝净增 ≥50。达标后 24 小时内自动发放权益。'
            ],
            bullets: ['目标周期：5月27日 – 6月10日', '奖励：流量加权 +7 天', '参与方式：无需报名，自动统计']
        },
        'spring-festival': {
            badge: '限时活动',
            title: '春季创作者节 · 500 USDT 奖池',
            time: '2026年5月27日 08:30',
            hero: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
            body: [
                '投稿主题 #SpringCreator 即可参与评选。平台将综合播放、互动与完读率选出 10 位创作者瓜分奖池。',
                '获奖作品将获得首页 Banner 曝光 48 小时，并收录至官方精选合集。'
            ],
            bullets: ['投稿截止：6月15日 23:59', '奖池：500 USDT（链上结算）', '题材：旅行 / 生活方式 / 摄影']
        },
        'maintenance-notice': {
            badge: '系统公告',
            title: '钱包与结算模块维护通知',
            time: '2026年5月27日 06:00',
            hero: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
            body: [
                '为提升链上结算稳定性，我们将于 <strong>5 月 28 日 02:00 – 04:00 (UTC+8)</strong> 进行维护。',
                '维护期间：充值、提现、收益结算将暂停；已到账资产不受影响，直播与内容浏览正常。'
            ],
            bullets: ['影响范围：钱包 · 充提 · 结算', '预计恢复：04:00 前', '紧急支持：help@fansloop.io']
        },
        'compliance-update': {
            badge: '合规公告',
            title: 'Web3 创作者合规指引更新',
            time: '2026年5月26日 10:30',
            hero: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80',
            body: [
                '根据最新监管要求，请已完成 KYC 的创作者在 6 月 1 日前完成「内容自查清单」确认。',
                '清单涵盖版权素材、敏感话题、打赏话术等 12 项，约 3 分钟可完成。未完成可能影响提现与推荐。'
            ],
            bullets: ['适用对象：全部认证创作者', '截止：2026-06-01', '入口：设置 → 安全与合规']
        },
        'apple-pay-bind': {
            badge: '账户服务',
            title: 'Apple Pay 绑定成功',
            time: '2026年4月25日',
            hero: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80',
            body: [
                '您已成功绑定 Apple Pay，可在订阅创作者、购买积分与 Pro 会员时使用快捷支付。',
                '单笔限额 500 USDT，如需提高限额请完成高级 KYC。'
            ],
            bullets: ['绑定设备：Safari · macOS', '默认币种：USDT', '可在设置中解绑']
        }
    };

    function openAnnouncement(id) {
        var data = PRESETS[id];
        var ovl = document.getElementById('nfOvlAnnouncement');
        if (!data || !ovl) return false;

        ovl.querySelector('#nfAnnBadge').textContent = data.badge || '平台公告';
        ovl.querySelector('#nfAnnTitle').textContent = data.title || '公告详情';
        ovl.querySelector('#nfAnnTime').textContent = data.time || '—';
        var hero = ovl.querySelector('#nfAnnHero');
        if (hero) {
            hero.src = data.hero || '';
            hero.alt = data.title || '';
            hero.style.display = data.hero ? '' : 'none';
        }
        var rich = ovl.querySelector('#nfAnnRich');
        if (rich) {
            rich.innerHTML = (data.body || []).map(function (p) {
                return '<p>' + p + '</p>';
            }).join('');
            if (data.bullets && data.bullets.length) {
                rich.innerHTML += '<ul class="nf-ann-bullets">' + data.bullets.map(function (b) {
                    return '<li>' + b + '</li>';
                }).join('') + '</ul>';
            }
        }
        ovl.classList.add('show');
        return true;
    }

    function getAnnouncementId(item) {
        return item ? item.getAttribute('data-nf-announcement-id') : '';
    }

    global.FL_nfAnnouncementPresets = PRESETS;
    global.FL_nfOpenAnnouncement = openAnnouncement;
    global.FL_nfGetAnnouncementId = getAnnouncementId;
})(typeof window !== 'undefined' ? window : this);
