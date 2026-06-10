/**
 * FansLoop Web 交互演示 · 页面分组清单（yanshi-web.html 读取）
 *
 * 约定：每新增一个可演示的 pages-web/*.html（演示壳 yanshi-web.html 除外），
 * 请在本数组对应分组中追加 [文件名, 显示名称]，否则无法在顶部搜索与页面网格中找到。
 */
window.DEMO_PAGE_GROUPS = [
    ["访客优先 · 登录改版", [
        ["guest-home.html", "游客首页（默认落地）"],
        ["modal-email-forgot-password.html", "忘记密码 · 邮箱验证码"],
        ["login-modal-home-overlay.html", "首页触发登录遮罩"],
        ["modal-login-main.html", "登录/注册主弹窗"],
        ["modal-wallet-auth.html", "钱包授权 WC/插件"],
        ["modal-email-login.html", "邮箱登录 · 验证码"],
        ["modal-email-login-password.html", "邮箱登录 · 密码"],
        ["modal-email-unregistered-prompt.html", "邮箱未注册确认"],
        ["modal-email-register-code.html", "邮箱注册验证码"],
        ["onboarding-profile-complete.html", "完善信息（注册后）"],
        ["settings-security-binding.html", "设置 · 安全绑定"],
        ["modal-bind-email-conflict.html", "异常 · 邮箱已占用"],
        ["modal-bind-wallet-conflict.html", "异常 · 钱包已占用"]
    ]],
    ["钱包登录 / 注册", [
        ["login-errors.html", "登录错误状态合集"]
    ]],
    ["积分中心", [
        ["home.html", "首页 · 积分条"],
        ["home.html?pointsDrawer=open", "首页 · 积分抽屉"],
        ["home-points-ledger.html", "积分流水"],
        ["points-mall.html", "积分兑换商城"],
        ["modal-points-reward.html", "计时奖励弹窗"]
    ]],
    ["主场景", [
        ["home.html", "首页（已登录信息流）"],
        ["subscriptions.html", "订阅"],
        ["discover.html", "发现"],
        ["create.html", "创建内容"],
        ["create-live-host.html", "主播直播中"],
        ["messages.html", "消息 · IM（可交互）"],
        ["messages-requests.html", "消息 · 陌生人请求"],
        ["messages-interactions.html", "消息 · 互动聚合"],
        ["messages-compose.html", "消息 · 新建私信"],
        ["messages-group.html", "消息 · 粉丝群私域（常用语）"],
        ["messages-group-settings.html", "消息 · 群管理权限说明"],
        ["messages-group-create.html", "消息 · 创建群聊"],
        ["messages-group-invites.html", "消息 · 进群邀请全量"],
        ["messages-friend-notifications.html", "消息 · 好友通知全量"],
        ["messages-contacts.html", "消息 · 通讯录"],
        ["notifications.html", "通知"],
        ["bookmarks.html", "收藏"],
        ["profile.html", "个人主页"],
        ["settings.html", "设置总览"],
        ["wallet.html", "我的钱包"],
        ["wallet-list-full.html", "钱包 · 完整列表"]
    ]],
    ["话题 / 直播 / 创作者", [
        ["topics.html", "热门话题"],
        ["topic-detail.html", "话题详情"],
        ["live-detail.html", "直播详情"],
        ["live-all.html", "全部直播"],
        ["creator-profile.html", "创作者主页"]
    ]],
    ["创作发布 / 付费解锁", [
        ["create-publish-image.html", "发布 · 图文"],
        ["create-publish-video.html", "发布 · 视频"],
        ["create-publish-live.html", "创建直播 · OBS 推流 / 封面权限"],
        ["modal-live-obs-guide.html", "OBS 推流配置说明"],
        ["create-publish-paid.html", "发布 · 付费"],
        ["flow-unlock-paid.html", "付费解锁流程"],
        ["flow-subscribe-creator.html", "订阅创作者流程"]
    ]],
    ["交互弹窗", [
        ["gift-modal.html", "送礼"],
        ["share-modal.html", "分享"],
        ["comment-modal.html", "评论"],
        ["modal-wallet-tutorial.html", "钱包教程"],
        ["modal-poster-share.html", "海报分享"],
        ["modal-metamask-troubleshoot.html", "MetaMask 排错"],
        ["modal-login-help.html", "登录帮助"],
        ["modal-footer-troubleshoot.html", "页脚排错"]
    ]],
    ["设置中心", [
        ["settings-account.html", "账户资料"],
        ["settings-security.html", "账户安全"],
        ["settings-wallet.html", "钱包与支付"],
        ["settings-notification.html", "通知偏好"],
        ["settings-privacy.html", "隐私设置"],
        ["settings-display.html", "外观语言"]
    ]],
    ["充值 / 提现", [
        ["recharge.html", "USDT 充值"],
        ["recharge-timeout.html", "订单超时"],
        ["recharge-fiat.html", "法币充值"],
        ["recharge-fiat-bind.html", "绑定银行卡"],
        ["recharge-fiat-verify.html", "支付验证"],
        ["recharge-fiat-switch-card.html", "切换银行卡"],
        ["withdraw-fiat.html", "提现到银行卡"],
        ["withdraw-fiat-verify.html", "短信验证"],
        ["withdraw-fiat-verify-pwd.html", "资金密码"],
        ["withdraw-fiat-edit.html", "修改银行卡"],
        ["withdraw-fiat-success.html", "提现成功"],
        ["withdraw-usdt.html", "USDT 链上提现"]
    ]],
    ["收入 / 账变", [
        ["creator-income.html", "创作者收入"],
        ["transactions.html", "账变记录"],
        ["transactions-search.html", "高级搜索"],
        ["transactions-export.html", "导出报表"],
        ["transaction-detail.html", "交易详情"],
        ["transaction-share-poster.html", "分享海报"],
        ["transaction-more-menu.html", "更多菜单"],
        ["transaction-appeal.html", "发起申诉"],
        ["transaction-contact.html", "联系客服"]
    ]]
];
