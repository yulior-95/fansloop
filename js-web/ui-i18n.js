/**
 * GOODFANS · 全站 UI 国际化运行时
 * - 语义键词典 + 中文原文反向索引自动翻译
 * - 排除 [data-i18n-exclude] 区域（如私信发送框）
 * - 回落链：当前语言 → en → zh-CN
 */
(function (global) {
    var LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'es', 'fr', 'de', 'pt-BR', 'ru', 'ar', 'hi', 'id', 'vi', 'th', 'tr', 'it'];

    function L(zh, tw, en, de, extra) {
        var o = { 'zh-CN': zh, 'zh-TW': tw || zh, en: en, de: de || en };
        if (extra) {
            Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
        }
        return o;
    }

    var S = {
        search_ph: L('搜索创作者、内容或话题…', '搜尋創作者、內容或話題…', 'Search creators, content or topics…', 'Creator, Inhalte oder Themen suchen…'),
        search_ph_short: L('搜索…', '搜尋…', 'Search…', 'Suchen…'),
        search_ph_msg: L('搜索会话、群聊、联系人…', '搜尋會話、群聊、聯絡人…', 'Search chats, groups, contacts…', 'Chats, Gruppen, Kontakte suchen…'),
        search_ph_chat: L('搜索聊天记录…', '搜尋聊天記錄…', 'Search chat history…', 'Chatverlauf suchen…'),
        recharge: L('充值', '充值', 'Top up', 'Aufladen'),
        settings: L('设置', '設定', 'Settings', 'Einstellungen'),
        home: L('首页', '首頁', 'Home', 'Start'),
        login: L('登录', '登入', 'Sign in', 'Anmelden'),
        signup: L('注册', '註冊', 'Sign up', 'Registrieren'),
        lang_title: L('界面语言', '介面語言', 'Language', 'Sprache'),
        cancel: L('取消', '取消', 'Cancel', 'Abbrechen'),
        confirm: L('确认', '確認', 'Confirm', 'Bestätigen'),
        save: L('保存', '儲存', 'Save', 'Speichern'),
        submit: L('提交', '提交', 'Submit', 'Absenden'),
        close: L('关闭', '關閉', 'Close', 'Schließen'),
        edit: L('编辑', '編輯', 'Edit', 'Bearbeiten'),
        done: L('完成', '完成', 'Done', 'Fertig'),
        new_badge: L('新', '新', 'New', 'Neu'),
        view_all: L('查看全部', '查看全部', 'View all', 'Alle anzeigen'),
        notifications: L('通知', '通知', 'Notifications', 'Benachrichtigungen'),
        messages: L('消息', '訊息', 'Messages', 'Nachrichten'),
        nav_aria: L('主导航', '主導航', 'Main navigation', 'Hauptnavigation'),
        sidebar_expand: L('展开侧栏', '展開側欄', 'Expand sidebar', 'Seitenleiste erweitern'),
        sidebar_collapse: L('收起侧栏', '收起側欄', 'Collapse sidebar', 'Seitenleiste einklappen'),

        nav_section_main: L('主导航', '主導航', 'Main', 'Hauptmenü'),
        nav_section_interact: L('互动', '互動', 'Social', 'Interaktion'),
        nav_section_assets: L('资产', '資產', 'Assets', 'Vermögen'),
        nav_section_personal: L('个人', '個人', 'Account', 'Profil'),
        nav_home: L('首页', '首頁', 'Home', 'Start'),
        nav_subscriptions: L('订阅', '訂閱', 'Subscriptions', 'Abos'),
        nav_discover: L('发现', '發現', 'Discover', 'Entdecken'),
        nav_create: L('创建内容', '創建內容', 'Create', 'Erstellen'),
        nav_messages: L('消息', '訊息', 'Messages', 'Nachrichten'),
        nav_notifications: L('通知', '通知', 'Notifications', 'Benachrichtigungen'),
        nav_wallet: L('钱包', '錢包', 'Wallet', 'Wallet'),
        nav_creator_income: L('创作者收入', '創作者收入', 'Creator income', 'Creator-Einnahmen'),
        nav_points_mall: L('积分商城', '積分商城', 'Points mall', 'Punkte-Shop'),
        nav_transactions: L('账变记录', '帳變記錄', 'Transactions', 'Transaktionen'),
        nav_profile: L('我的主页', '我的主頁', 'My profile', 'Mein Profil'),
        nav_settings: L('设置', '設定', 'Settings', 'Einstellungen'),
        pro_title: L('升级 Creator Pro', '升級 Creator Pro', 'Upgrade Creator Pro', 'Creator Pro upgraden'),
        pro_desc: L('解锁高级数据 / 优先推流', '解鎖進階數據 / 優先推流', 'Advanced analytics & priority streaming', 'Erweiterte Daten & Prioritäts-Streaming'),
        pro_upgrade: L('立即升级', '立即升級', 'Upgrade now', 'Jetzt upgraden'),
        member_tag: L('会员', '會員', 'Member', 'Mitglied'),

        set_nav_aria: L('设置导航', '設定導航', 'Settings navigation', 'Einstellungsnavigation'),
        set_grp_account: L('账户', '帳戶', 'Account', 'Konto'),
        set_nav_account: L('账户资料', '帳戶資料', 'Profile', 'Profil'),
        set_nav_security: L('账户安全', '帳戶安全', 'Security', 'Sicherheit'),
        set_nav_wallet: L('钱包与支付', '錢包與支付', 'Wallet & payments', 'Wallet & Zahlungen'),
        set_grp_experience: L('体验', '體驗', 'Experience', 'Erlebnis'),
        set_nav_notification: L('通知偏好', '通知偏好', 'Notifications', 'Benachrichtigungen'),
        set_nav_privacy: L('隐私设置', '隱私設定', 'Privacy', 'Datenschutz'),
        set_nav_display: L('外观语言', '外觀語言', 'Display & language', 'Anzeige & Sprache'),
        set_nav_global_access: L('跨国界无障碍', '跨國界無障礙', 'Global accessibility', 'Globale Barrierefreiheit'),
        set_grp_creator: L('创作者', '創作者', 'Creator', 'Creator'),
        set_nav_subscription: L('会员订阅设置', '會員訂閱設定', 'Subscription settings', 'Abo-Einstellungen'),
        set_grp_about: L('关于', '關於', 'About', 'Über'),
        set_nav_about: L('关于 GOODFANS', '關於 GOODFANS', 'About GOODFANS', 'Über GOODFANS'),
        set_nav_terms: L('条款与协议', '條款與協議', 'Terms & policies', 'AGB & Richtlinien'),
        set_nav_logout: L('退出登录', '登出', 'Sign out', 'Abmelden'),

        about_title: L('关于 GOODFANS', '關於 GOODFANS', 'About GOODFANS', 'Über GOODFANS'),
        about_tagline: L('面向加密原生用户与创作者的 Web3 内容订阅与打赏平台。', '面向加密原生用戶與創作者的 Web3 內容訂閱與打賞平台。', 'Web3 subscription & tipping for crypto-native fans and creators.', 'Web3-Abo & Trinkgeld für Krypto-Nutzer und Creator.'),
        about_copy_ver: L('复制版本', '複製版本', 'Copy version', 'Version kopieren'),
        about_check_update: L('检查更新', '檢查更新', 'Check for updates', 'Nach Updates suchen'),
        about_kpi_langs: L('支持语言', '支援語言', 'Languages', 'Sprachen'),
        about_kpi_usdt: L('统一结算资产', '統一結算資產', 'Settlement asset', 'Abrechnungswährung'),
        about_kpi_evm: L('多链钱包登录', '多鏈錢包登入', 'Multi-chain wallet login', 'Multi-Chain-Wallet-Login'),
        about_links_title: L('相关链接', '相關連結', 'Links', 'Links'),
        about_links_sub: L('帮助与反馈', '幫助與回饋', 'Help & feedback', 'Hilfe & Feedback'),
        about_support: L('联系客服', '聯繫客服', 'Contact support', 'Support kontaktieren'),
        about_support_sub: L('订单、充值、提现与账号问题', '訂單、充值、提現與帳號問題', 'Orders, top-up, withdrawals & account', 'Bestellungen, Aufladung, Auszahlungen & Konto'),
        about_feedback: L('提交产品反馈', '提交產品回饋', 'Send product feedback', 'Produktfeedback senden'),
        about_feedback_sub: L('功能建议、体验问题与 Bug 报告', '功能建議、體驗問題與 Bug 報告', 'Feature ideas, UX issues & bug reports', 'Funktionsideen, UX-Probleme & Bug-Reports'),
        about_changelog: L('更新日志', '更新日誌', 'Changelog', 'Änderungsprotokoll'),
        about_changelog_sub: L('近期版本变更记录', '近期版本變更記錄', 'Recent release notes', 'Aktuelle Versionshinweise'),
        about_legal: L('法律信息', '法律資訊', 'Legal', 'Rechtliches'),
        about_legal_sub: L('© 2024–2026 GOODFANS Labs. 保留所有权利。', '© 2024–2026 GOODFANS Labs. 保留所有權利。', '© 2024–2026 GOODFANS Labs. All rights reserved.', '© 2024–2026 GOODFANS Labs. Alle Rechte vorbehalten.'),
        fb_title: L('提交产品反馈', '提交產品回饋', 'Send product feedback', 'Produktfeedback senden'),
        fb_hint: L('感谢你帮助改进 GOODFANS，我们会认真阅读每一条反馈。', '感謝你幫助改進 GOODFANS，我們會認真閱讀每一條回饋。', 'Thanks for helping improve GOODFANS. We read every submission.', 'Danke, dass du GOODFANS verbesserst. Wir lesen jedes Feedback.'),
        fb_type_label: L('反馈类型', '回饋類型', 'Feedback type', 'Feedback-Typ'),
        fb_type_feature: L('功能建议', '功能建議', 'Feature idea', 'Funktionsidee'),
        fb_type_experience: L('体验问题', '體驗問題', 'UX issue', 'UX-Problem'),
        fb_type_bug: L('Bug 报告', 'Bug 報告', 'Bug report', 'Bug-Report'),
        fb_content_label: L('详细描述', '詳細描述', 'Details', 'Details'),
        fb_contact_label: L('联系邮箱', '聯繫郵箱', 'Contact email', 'Kontakt-E-Mail'),
        fb_contact_opt: L('（选填，便于回复）', '（選填，便於回覆）', '(optional, for replies)', '(optional, für Antworten)'),
        fb_screenshot_label: L('截图附件', '截圖附件', 'Screenshot', 'Screenshot'),
        fb_screenshot_opt: L('（选填）', '（選填）', '(optional)', '(optional)'),
        fb_upload: L('点击添加截图', '點擊添加截圖', 'Add screenshot', 'Screenshot hinzufügen'),
        fb_submit: L('提交反馈', '提交回饋', 'Submit feedback', 'Feedback senden'),
        fb_success_title: L('反馈已提交', '回饋已提交', 'Feedback submitted', 'Feedback gesendet'),
        fb_success_body: L('若留下邮箱，我们将在 24 小时内回复（原型演示）。', '若留下郵箱，我們將在 24 小時內回覆（原型演示）。', 'If you left an email, we will reply within 24 hours (prototype).', 'Bei Angabe einer E-Mail antworten wir innerhalb von 24 Stunden (Prototyp).'),
        fb_content_ph: L('请描述你的建议、遇到的问题或复现步骤…', '請描述你的建議、遇到的問題或復現步驟…', 'Describe your idea, issue or steps to reproduce…', 'Beschreibe deine Idee, das Problem oder Reproduktionsschritte…'),
        fb_contact_ph: L('name@example.com', 'name@example.com', 'name@example.com', 'name@example.com'),

        earn_title: L('收益与提现', '收益與提現', 'Earnings & withdrawals', 'Einnahmen & Auszahlungen'),
        earn_desc: L('管理创作者收益、分成比例与提现方式，查看待结算金额。', '管理創作者收益、分成比例與提現方式，查看待結算金額。', 'Manage creator earnings, revenue share and payout methods.', 'Creator-Einnahmen, Umsatzanteil und Auszahlungsmethoden verwalten.'),
        earn_income_detail: L('收入详情', '收入詳情', 'Income details', 'Einnahmedetails'),
        earn_withdraw_now: L('立即提现', '立即提現', 'Withdraw now', 'Jetzt auszahlen'),
        earn_balance_lbl: L('可提现余额', '可提現餘額', 'Available balance', 'Verfügbares Guthaben'),
        earn_pending: L('待结算', '待結算', 'Pending settlement', 'Ausstehende Abrechnung'),
        earn_split_title: L('平台分成', '平台分成', 'Revenue share', 'Umsatzaufteilung'),
        earn_split_sub: L('你的创作者等级决定平台抽成比例，等级越高分成越优', '你的創作者等級決定平台抽成比例，等級越高分成越優', 'Your creator level sets the platform fee; higher levels earn more.', 'Dein Creator-Level bestimmt die Plattformgebühr; höhere Level verdienen mehr.'),
        earn_creator_share: L('创作者实得 85%', '創作者實得 85%', 'Creator keeps 85%', 'Creator erhält 85%'),
        earn_platform_share: L('平台 15%', '平台 15%', 'Platform 15%', 'Plattform 15%'),
        earn_sub_income: L('订阅收入', '訂閱收入', 'Subscription income', 'Abo-Einnahmen'),
        earn_tip_income: L('打赏与礼物', '打賞與禮物', 'Tips & gifts', 'Trinkgeld & Geschenke'),
        earn_ppv_income: L('单篇购买收入', '單篇購買收入', 'Pay-per-post income', 'Einzelkauf-Einnahmen'),
        earn_payout_title: L('提现方式', '提現方式', 'Payout methods', 'Auszahlungsmethoden'),
        earn_payout_sub: L('配置默认收款地址与提现偏好', '配置預設收款地址與提現偏好', 'Configure default payout address and preferences.', 'Standard-Auszahlungsadresse und Einstellungen konfigurieren.'),
        earn_onchain_wallet: L('链上钱包（默认）', '鏈上錢包（預設）', 'On-chain wallet (default)', 'On-Chain-Wallet (Standard)'),
        earn_fiat_card: L('法币银行卡', '法幣銀行卡', 'Fiat bank card', 'Fiat-Bankkarte'),
        earn_auto_threshold: L('自动提现阈值', '自動提現閾值', 'Auto-withdraw threshold', 'Auto-Auszahlungsschwelle'),
        earn_auto_off: L('已关闭', '已關閉', 'Off', 'Aus'),
        earn_kyc: L('KYC 身份验证', 'KYC 身份驗證', 'KYC verification', 'KYC-Verifizierung'),
        earn_kyc_unverified: L('未验证', '未驗證', 'Unverified', 'Nicht verifiziert'),
        earn_kyc_pending: L('审核中', '審核中', 'Under review', 'In Prüfung'),
        earn_kyc_passed: L('已通过', '已通過', 'Verified', 'Verifiziert'),
        earn_kyc_failed: L('未通过', '未通過', 'Failed', 'Abgelehnt'),
        earn_recent_withdrawals: L('近期提现记录', '近期提現記錄', 'Recent withdrawals', 'Letzte Auszahlungen'),
        earn_save_payout: L('保存提现设置', '儲存提現設定', 'Save payout settings', 'Auszahlungseinstellungen speichern'),
        earn_onchain_btn: L('链上提现', '鏈上提現', 'On-chain withdraw', 'On-Chain-Auszahlung'),
        earn_tx_history: L('账变记录', '帳變記錄', 'Transactions', 'Transaktionen'),
        earn_sub_row: L('订阅收入（T+3）', '訂閱收入（T+3）', 'Subscriptions (T+3)', 'Abos (T+3)'),
        earn_live_tip_row: L('直播打赏（T+1）', '直播打賞（T+1）', 'Live tips (T+1)', 'Live-Trinkgeld (T+1)'),
        earn_ppv_row: L('单篇购买收入（3 天后到账）', '單篇購買收入（3 天後到帳）', 'Pay-per-post (3-day hold)', 'Einzelkäufe (3 Tage Haltefrist)'),
        earn_processing_row: L('处理中提现', '處理中提現', 'Withdrawal in progress', 'Auszahlung in Bearbeitung'),

        msg_title: L('消息', '訊息', 'Messages', 'Nachrichten'),
        msg_unread: L('未读', '未讀', 'unread', 'ungelesen'),
        msg_tab_all: L('全部', '全部', 'All', 'Alle'),
        msg_tab_dm: L('私聊', '私聊', 'Direct', 'Direkt'),
        msg_tab_group: L('群聊', '群聊', 'Groups', 'Gruppen'),
        msg_detail: L('详情', '詳情', 'Details', 'Details'),
        msg_group_notice: L('群公告', '群公告', 'Group notice', 'Gruppenankündigung'),
        msg_group_notify: L('群聊通知', '群聊通知', 'Group notifications', 'Gruppenbenachrichtigungen'),
        msg_recording: L('正在录音… 松开结束', '正在錄音… 鬆開結束', 'Recording… release to stop', 'Aufnahme… loslassen zum Beenden'),
        msg_first_sent: L('已发送首条私信', '已發送首條私信', 'First message sent', 'Erste Nachricht gesendet'),
        msg_dm_limit: L('未互关且未订阅时，暂不可继续发送；互关、订阅或获对方回复后可解除', '未互關且未訂閱時，暫不可繼續發送；互關、訂閱或獲對方回覆後可解除', 'Cannot send more until mutual follow, subscription or reply.', 'Weiteres Senden erst nach gegenseitigem Follow, Abo oder Antwort.'),
        msg_relation: L('关系', '關係', 'Relationship', 'Beziehung'),
        msg_not_mutual: L('未互相关注', '未互相關注', 'Not mutual follow', 'Kein gegenseitiges Follow'),
        msg_not_subscribed: L('未订阅创作者', '未訂閱創作者', 'Not subscribed', 'Nicht abonniert'),
        msg_total_tip: L('总打赏', '總打賞', 'Total tips', 'Gesamt-Trinkgeld'),
        msg_conv_settings: L('对话设置', '對話設定', 'Chat settings', 'Chat-Einstellungen'),
        msg_recv_notify: L('接收消息通知', '接收訊息通知', 'Message notifications', 'Nachrichtenbenachrichtigungen'),
        msg_pin_conv: L('置顶对话', '置頂對話', 'Pin chat', 'Chat anheften'),
        msg_chat_files: L('聊天文件', '聊天檔案', 'Chat files', 'Chat-Dateien'),
        msg_fans: L('粉丝', '粉絲', 'Fans', 'Fans'),
        msg_posts: L('作品', '作品', 'Posts', 'Beiträge'),
        msg_active: L('活跃', '活躍', 'Active', 'Aktiv'),
        msg_delete_conv: L('删除会话', '刪除會話', 'Delete chat', 'Chat löschen'),
        msg_new_dm: L('新建私聊', '新建私聊', 'New direct message', 'Neue Direktnachricht'),
        msg_group_manage: L('群管理', '群管理', 'Group management', 'Gruppenverwaltung'),
        msg_add_members: L('添加群成员', '添加群成員', 'Add members', 'Mitglieder hinzufügen'),
        msg_group_notice_badge: L('群公告', '群公告', 'Group notice', 'Gruppenankündigung'),
        msg_reject_all: L('全局拒绝', '全局拒絕', 'Reject all', 'Alle ablehnen'),
        msg_accept_all: L('批量同意', '批量同意', 'Accept all', 'Alle annehmen'),
        msg_ok: L('确定', '確定', 'OK', 'OK'),
        msg_confirm: L('确认', '確認', 'Confirm', 'Bestätigen'),
        msg_chat_files_title: L('聊天文件', '聊天檔案', 'Chat files', 'Chat-Dateien'),
        msg_pin_row: L('置顶对话', '置頂對話', 'Pin chat', 'Chat anheften'),
        msg_recv_notify_row: L('接收消息通知', '接收訊息通知', 'Message notifications', 'Nachrichtenbenachrichtigungen'),
        msg_not_mutual_row: L('未互相关注', '未互相關注', 'Not mutual follow', 'Kein gegenseitiges Follow'),
        msg_not_sub_row: L('未订阅创作者', '未訂閱創作者', 'Not subscribed', 'Nicht abonniert'),
        msg_total_tip_row: L('总打赏', '總打賞', 'Total tips', 'Gesamt-Trinkgeld'),
        msg_compose_title: L('新建私聊', '新建私聊', 'New direct message', 'Neue Direktnachricht'),
        msg_create_group: L('创建粉丝群', '創建粉絲群', 'Create fan group', 'Fan-Gruppe erstellen'),
        msg_search_invite_ph: L('搜索邀请、昵称…', '搜尋邀請、暱稱…', 'Search invites, names…', 'Einladungen, Namen suchen…'),
        msg_unread_count: L('未读', '未讀', 'unread', 'ungelesen'),

        home_rec: L('推荐', '推薦', 'For you', 'Für dich'),
        home_following: L('关注', '關注', 'Following', 'Folge ich'),
        home_live: L('直播', '直播', 'Live', 'Live'),
        home_follow_btn: L('关注', '關注', 'Follow', 'Folgen'),
        home_about: L('关于', '關於', 'About', 'Über'),
        home_service: L('服务', '服務', 'Terms', 'Nutzung'),
        home_privacy: L('隐私', '隱私', 'Privacy', 'Datenschutz'),

        account_title: L('账户资料', '帳戶資料', 'Profile', 'Profil'),
        account_edit: L('编辑资料', '編輯資料', 'Edit profile', 'Profil bearbeiten'),
        account_section_profile: L('账户资料', '帳戶資料', 'Profile', 'Profil'),
        account_nickname: L('昵称', '暱稱', 'Display name', 'Anzeigename'),
        account_bio: L('个人简介', '個人簡介', 'Bio', 'Bio'),
        account_region: L('所在地区', '所在地區', 'Region', 'Region'),
        account_tags: L('兴趣标签', '興趣標籤', 'Interests', 'Interessen'),
        account_kyc: L('KYC 身份验证', 'KYC 身份驗證', 'KYC verification', 'KYC-Verifizierung'),
        account_social: L('外链账号', '外鏈帳號', 'Linked accounts', 'Verknüpfte Konten'),
        account_invite: L('邀请拉新数据', '邀請拉新數據', 'Referral stats', 'Einladungsstatistik'),
        account_inviter: L('我的邀请人', '我的邀請人', 'My inviter', 'Mein Einlader'),

        verified: L('已验证', '已驗證', 'Verified', 'Verifiziert'),
        processing: L('处理中', '處理中', 'Processing', 'In Bearbeitung'),
        arrived: L('已到账', '已到帳', 'Completed', 'Abgeschlossen'),
        time_col: L('时间', '時間', 'Time', 'Zeit'),
        amount_col: L('金额', '金額', 'Amount', 'Betrag'),
        method_col: L('方式', '方式', 'Method', 'Methode'),
        status_col: L('状态', '狀態', 'Status', 'Status'),
        arrival_col: L('到账', '到帳', 'Arrival', 'Ankunft'),

        back: L('返回', '返回', 'Back', 'Zurück'),
        next: L('下一步', '下一步', 'Next', 'Weiter'),
        withdraw: L('提现', '提現', 'Withdraw', 'Auszahlen'),
        deposit: L('充值', '充值', 'Deposit', 'Einzahlen'),
        details: L('详情', '詳情', 'Details', 'Details'),
        copy: L('复制', '複製', 'Copy', 'Kopieren'),
        share: L('分享', '分享', 'Share', 'Teilen'),
        more: L('更多', '更多', 'More', 'Mehr'),
        all: L('全部', '全部', 'All', 'Alle'),
        loading: L('加载中…', '載入中…', 'Loading…', 'Laden…'),
        success: L('成功', '成功', 'Success', 'Erfolg'),
        failed: L('失败', '失敗', 'Failed', 'Fehlgeschlagen'),
        optional: L('选填', '選填', 'Optional', 'Optional'),
        required: L('必填', '必填', 'Required', 'Pflichtfeld'),
        wallet_title: L('钱包', '錢包', 'Wallet', 'Wallet'),
        discover_title: L('发现', '發現', 'Discover', 'Entdecken'),
        create_title: L('创建内容', '創建內容', 'Create', 'Erstellen'),
        subscriptions_title: L('订阅', '訂閱', 'Subscriptions', 'Abos'),
        transactions_title: L('账变记录', '帳變記錄', 'Transactions', 'Transaktionen'),
        notifications_title: L('通知中心', '通知中心', 'Notifications', 'Benachrichtigungen'),
        profile_title: L('我的主页', '我的主頁', 'My profile', 'Mein Profil'),
        live_now: L('正在直播', '正在直播', 'Live now', 'Jetzt live'),
        hot_topics: L('热门话题', '熱門話題', 'Hot topics', 'Trend-Themen'),
        recommended: L('推荐', '推薦', 'Recommended', 'Empfohlen'),
        following_tab: L('关注', '關注', 'Following', 'Folge ich'),
        go_live: L('开直播', '開直播', 'Go live', 'Live gehen'),
        publish: L('发布', '發布', 'Publish', 'Veröffentlichen'),
        draft: L('草稿', '草稿', 'Draft', 'Entwurf'),
        delete: L('删除', '刪除', 'Delete', 'Löschen'),
        upload: L('上传', '上傳', 'Upload', 'Hochladen'),
        download: L('下载', '下載', 'Download', 'Herunterladen'),
        filter: L('筛选', '篩選', 'Filter', 'Filter'),
        export: L('导出', '導出', 'Export', 'Exportieren'),
        import: L('导入', '導入', 'Import', 'Importieren'),
        search: L('搜索', '搜尋', 'Search', 'Suchen'),
        no_data: L('暂无数据', '暫無數據', 'No data yet', 'Noch keine Daten'),
        learn_more: L('了解更多', '了解更多', 'Learn more', 'Mehr erfahren'),
        contact_support: L('联系客服', '聯繫客服', 'Contact support', 'Support kontaktieren'),
        help_center: L('帮助中心', '幫助中心', 'Help center', 'Hilfezentrum'),
        security_center: L('安全中心', '安全中心', 'Security center', 'Sicherheitszentrum'),
        pay_password: L('支付密码', '支付密碼', 'Payment password', 'Zahlungspasswort'),
        bind_wallet: L('绑定钱包', '綁定錢包', 'Link wallet', 'Wallet verknüpfen'),
        unbind: L('解绑', '解綁', 'Unlink', 'Trennen'),
        verify: L('验证', '驗證', 'Verify', 'Verifizieren'),
        resend: L('重新发送', '重新發送', 'Resend', 'Erneut senden'),
        send_code: L('获取验证码', '獲取驗證碼', 'Get code', 'Code anfordern'),
        email: L('邮箱', '郵箱', 'Email', 'E-Mail'),
        password: L('密码', '密碼', 'Password', 'Passwort'),
        nickname: L('昵称', '暱稱', 'Nickname', 'Spitzname'),
        bio: L('个人简介', '個人簡介', 'Bio', 'Bio'),
        followers: L('粉丝', '粉絲', 'Followers', 'Follower'),
        posts: L('作品', '作品', 'Posts', 'Beiträge'),
        tips: L('打赏', '打賞', 'Tips', 'Trinkgeld'),
        gift: L('礼物', '禮物', 'Gift', 'Geschenk'),
        subscribe: L('订阅', '訂閱', 'Subscribe', 'Abonnieren'),
        subscribed: L('已订阅', '已訂閱', 'Subscribed', 'Abonniert'),
        unlock: L('解锁', '解鎖', 'Unlock', 'Freischalten'),
        free: L('免费', '免費', 'Free', 'Kostenlos'),
        paid: L('付费', '付費', 'Paid', 'Kostenpflichtig'),
        price: L('价格', '價格', 'Price', 'Preis'),
        total: L('合计', '合計', 'Total', 'Gesamt'),
        fee: L('手续费', '手續費', 'Fee', 'Gebühr'),
        balance: L('余额', '餘額', 'Balance', 'Guthaben'),
        history: L('历史记录', '歷史記錄', 'History', 'Verlauf'),
        pending_status: L('待处理', '待處理', 'Pending', 'Ausstehend'),
        completed: L('已完成', '已完成', 'Completed', 'Abgeschlossen'),
        cancelled: L('已取消', '已取消', 'Cancelled', 'Abgebrochen'),
        today: L('今天', '今天', 'Today', 'Heute'),
        yesterday: L('昨天', '昨天', 'Yesterday', 'Gestern'),
        this_week: L('本周', '本週', 'This week', 'Diese Woche'),
        this_month: L('本月', '本月', 'This month', 'Dieser Monat')
    };

    var ZH_TO_KEY = {};
    Object.keys(S).forEach(function (key) {
        var zh = S[key]['zh-CN'];
        if (zh && !ZH_TO_KEY[zh]) ZH_TO_KEY[zh] = key;
    });
    // 补充常见变体（页面上略有差异的原文）
    ['搜索创作者、内容或话题…', '搜索…'].forEach(function (zh, i) {
        if (!ZH_TO_KEY[zh]) ZH_TO_KEY[zh] = i === 0 ? 'search_ph' : 'search_ph_short';
    });

    function t(code, key) {
        var entry = S[key];
        if (!entry) return null;
        return entry[code] || entry.en || entry['zh-CN'] || null;
    }

    function tByZh(code, zhText) {
        var key = ZH_TO_KEY[zhText];
        return key ? t(code, key) : null;
    }

    function isExcluded(el) {
        return !!(el && el.closest && el.closest('[data-i18n-exclude]'));
    }

    function getDirectText(el) {
        var text = '';
        for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === 3) text += el.childNodes[i].textContent;
        }
        return text.trim();
    }

    function setDirectText(el, text) {
        var found = false;
        for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === 3) {
                el.childNodes[i].textContent = text;
                found = true;
                break;
            }
        }
        if (!found) {
            if (!el.children.length) el.textContent = text;
            else el.appendChild(document.createTextNode(text));
        }
    }

    function applyTextEl(el, code) {
        if (!el || isExcluded(el)) return;
        if (el.hasAttribute('data-i18n-global')) return;
        if (el.closest && el.closest('.dev-glass-wrap')) return;
        var src = el.getAttribute('data-i18n-src');
        if (!src) {
            src = el.childNodes.length && el.querySelector && el.querySelector('i, img, svg')
                ? getDirectText(el) : (el.textContent || '').trim();
            if (!src || src.length > 160) return;
            el.setAttribute('data-i18n-src', src);
        }
        var translated = tByZh(code, src);
        if (!translated) return;
        if (el.childNodes.length && el.querySelector && el.querySelector('i, img, svg')) {
            setDirectText(el, translated);
        } else {
            el.textContent = translated;
        }
    }

    var AUTO_SELECTORS = [
        '.app-sidebar .s-section',
        '.app-sidebar .s-item .lb',
        '.app-sidebar .s-pro-card h4',
        '.app-sidebar .s-pro-card p',
        '.app-sidebar .s-pro-card button',
        '.app-sidebar .s-member-tag',
        '.set-nav .group-ti',
        '.set-nav .nav-item > span:not(.ic):not(.arrow)',
        '.page-head h1',
        '.page-head .ph-l > p',
        '.crumb a',
        '.crumb .curr',
        '.ph-r .btn',
        '.ssh h3',
        '.ssh p',
        '.about-link-row .ti',
        '.about-link-row .sub',
        '.about-kpi .lbl',
        '.about-fb-hint',
        '.about-fb-field > label',
        '.about-fb-type',
        '.about-fb-success h4',
        '.about-fb-success p',
        '.earn-balance .lb',
        '.earn-pending > div:first-child',
        '.earn-pending .row .l',
        '.set-card .row-info .ti',
        '.set-card .row-info .sub',
        '.set-card .ssh h3',
        '.set-card .ssh p',
        '.iml-tabs .t',
        '.imi-section h4',
        '.imi-stats .k',
        '.im-dm-limit-banner .txt strong',
        '.im-dm-limit-banner .txt span',
        '.im-voice-rec',
        '.im-group-notice .badge',
        '.im-notif-inbox-head .tit',
        '.im-ctx-menu button',
        '.im-confirm-dialog h3',
        '.im-confirm-dialog .btn-secondary',
        '#imConfirmOk',
        '#imComposeTitle',
        '#imGcTitle',
        '#imInboxRejectAll',
        '#imInboxAcceptAll',
        '.imi-row',
        '.feed-tabs button',
        '.h-cta',
        'table th'
    ].join(',');

    function applyPlaceholders(code) {
        document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(function (el) {
            if (isExcluded(el)) return;
            var src = el.getAttribute('data-i18n-src-ph') || el.placeholder;
            if (!src) return;
            if (!el.getAttribute('data-i18n-src-ph')) el.setAttribute('data-i18n-src-ph', src);
            var translated = tByZh(code, src);
            if (translated) el.placeholder = translated;
        });
    }

    function applyAutoScan(code) {
        document.querySelectorAll(AUTO_SELECTORS).forEach(function (el) {
            applyTextEl(el, code);
        });
    }

    function resolveKey(key) {
        if (key === 'search') return 'search_ph';
        return key;
    }

    function applyMarked(code) {
        document.querySelectorAll('[data-i18n-global]').forEach(function (el) {
            if (isExcluded(el)) return;
            var k = resolveKey(el.getAttribute('data-i18n-global'));
            var v = t(code, k);
            if (v) el.textContent = v;
        });
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            if (isExcluded(el)) return;
            var k = el.getAttribute('data-i18n');
            var v = t(code, k);
            if (v) el.textContent = v;
        });
        document.querySelectorAll('[data-i18n-ph-global]').forEach(function (inp) {
            if (isExcluded(inp)) return;
            var k = resolveKey(inp.getAttribute('data-i18n-ph-global'));
            var v = t(code, k);
            if (v) inp.placeholder = v;
        });
        document.querySelectorAll('[data-i18n-title-global]').forEach(function (el) {
            if (isExcluded(el)) return;
            var k = el.getAttribute('data-i18n-title-global');
            var v = t(code, k);
            if (v) el.title = v;
        });
        document.querySelectorAll('[data-i18n-aria-global]').forEach(function (el) {
            if (isExcluded(el)) return;
            var k = el.getAttribute('data-i18n-aria-global');
            var v = t(code, k);
            if (v) el.setAttribute('aria-label', v);
        });
    }

    function applyHeader(code) {
        document.querySelectorAll('.h-search input[type="search"], .h-search input[type="text"]').forEach(function (inp) {
            if (isExcluded(inp)) return;
            var src = inp.getAttribute('data-i18n-src-ph') || inp.placeholder;
            if (!src) return;
            if (!inp.getAttribute('data-i18n-src-ph')) inp.setAttribute('data-i18n-src-ph', src);
            var v = tByZh(code, src) || t(code, 'search_ph');
            if (v) inp.placeholder = v;
        });
        document.querySelectorAll('.h-cta').forEach(function (btn) {
            applyTextEl(btn, code);
            if (!btn.getAttribute('data-i18n-src')) btn.setAttribute('data-i18n-src', '充值');
            var v = t(code, 'recharge');
            if (v) setDirectText(btn, v);
        });
    }

    function getLangCode() {
        if (global.GoodFansLang && global.GoodFansLang.getLang) {
            return global.GoodFansLang.getLang();
        }
        try {
            return localStorage.getItem('goodfans-ui-lang') || 'zh-CN';
        } catch (e) {
            return 'zh-CN';
        }
    }

    function applyPageSpecials(code) {
        var unread = document.getElementById('imUnreadHead');
        if (unread) {
            var n = (unread.textContent || '').match(/\d+/);
            var lbl = t(code, 'msg_unread_count') || '未读';
            unread.textContent = (n ? n[0] + ' ' : '') + lbl;
        }
        var msgTitle = document.querySelector('.iml-head h2');
        if (msgTitle && !msgTitle.querySelector('[data-i18n-src]')) {
            var icon = msgTitle.querySelector('i');
            var cnt = msgTitle.querySelector('.cnt');
            var lbl = t(code, 'msg_title') || '消息';
            msgTitle.textContent = '';
            if (icon) msgTitle.appendChild(icon);
            msgTitle.appendChild(document.createTextNode(lbl));
            if (cnt) msgTitle.appendChild(cnt);
        }
    }

    function applyAll(code) {
        code = code || getLangCode();
        applyMarked(code);
        applyHeader(code);
        applyPlaceholders(code);
        applyAutoScan(code);
        applyPageSpecials(code);
        document.documentElement.classList.toggle('fl-i18n-compact', code !== 'zh-CN' && code !== 'zh-TW');
        if (global.FL_applySidebarI18n) global.FL_applySidebarI18n(code);
    }

    document.addEventListener('goodfans-lang-change', function (e) {
        applyAll(e.detail && e.detail.code);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            applyAll();
        });
    } else {
        setTimeout(applyAll, 0);
    }

    global.FLI18n = {
        S: S,
        LANGS: LANGS,
        t: t,
        tByZh: tByZh,
        applyAll: applyAll,
        isExcluded: isExcluded
    };
})(window);
