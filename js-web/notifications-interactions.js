/**
 * 通知中心 · 页内弹窗交互（不跳转新页）
 */
(function () {
    var SAVE_KEY = 'fl_nf_settings_v1';

    function toast(msg, type) {
        type = type || 'info';
        var host = document.getElementById('nfToastHost');
        if (!host) return;
        var el = document.createElement('div');
        el.className = 'nf-toast ' + type;
        var icon = type === 'ok' ? 'fa-circle-check' : type === 'err' ? 'fa-circle-xmark' : 'fa-circle-info';
        el.innerHTML = '<i class="fa-solid ' + icon + '"></i><span></span>';
        el.querySelector('span').textContent = msg;
        host.appendChild(el);
        setTimeout(function () { el.remove(); }, 2800);
    }

    function openOvl(id) {
        var o = document.getElementById(id);
        if (o) o.classList.add('show');
    }
    function closeOvl(id) {
        var o = document.getElementById(id);
        if (o) o.classList.remove('show');
    }
    function closeAllOvl() {
        document.querySelectorAll('.nf-overlay.show').forEach(function (o) {
            o.classList.remove('show');
        });
    }

    document.querySelectorAll('.nf-overlay').forEach(function (ovl) {
        ovl.addEventListener('click', function (e) {
            if (e.target === ovl) closeAllOvl();
        });
    });
    document.querySelectorAll('[data-nf-close]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-nf-close');
            if (id) closeOvl(id);
            else closeAllOvl();
        });
    });

    /* —— 通知设置弹窗 —— */
    function loadSettings() {
        try {
            return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }
    function saveSettings(data) {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
    }

    function syncSettingSwitches() {
        var saved = loadSettings();
        document.querySelectorAll('#nfOvlSettings [data-nf-setting]').forEach(function (sw) {
            var key = sw.getAttribute('data-nf-setting');
            var on = saved[key] !== false;
            sw.classList.toggle('on', on);
        });
    }

    document.getElementById('btnNfSettings')?.addEventListener('click', function () {
        document.getElementById('nfSettingsAlert')?.classList.remove('show', 'ok', 'err');
        syncSettingSwitches();
        openOvl('nfOvlSettings');
    });

    document.querySelectorAll('#nfOvlSettings [data-nf-setting]').forEach(function (sw) {
        sw.addEventListener('click', function (e) {
            e.stopPropagation();
            sw.classList.toggle('on');
        });
    });

    document.getElementById('btnNfSettingsSave')?.addEventListener('click', function (e) {
        var btn = document.getElementById('btnNfSettingsSave');
        var alertEl = document.getElementById('nfSettingsAlert');
        var fail = new URLSearchParams(location.search).get('saveFail') === '1' || e.shiftKey;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 保存中…';

        setTimeout(function () {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> 保存设置';

            if (fail) {
                if (alertEl) {
                    alertEl.className = 'nf-alert err show';
                    alertEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><span>保存失败：网络超时，请稍后重试（原型：URL 加 <code>?saveFail=1</code> 或 Shift+保存 模拟失败）</span>';
                }
                toast('通知设置保存失败', 'err');
                return;
            }

            var data = {};
            document.querySelectorAll('#nfOvlSettings [data-nf-setting]').forEach(function (sw) {
                data[sw.getAttribute('data-nf-setting')] = sw.classList.contains('on');
            });
            data.dndStart = document.getElementById('nfDndStart')?.value || '22:00';
            data.dndEnd = document.getElementById('nfDndEnd')?.value || '08:00';
            saveSettings(data);

            if (alertEl) {
                alertEl.className = 'nf-alert ok show';
                alertEl.innerHTML = '<i class="fa-solid fa-circle-check"></i><span>设置已保存，将按新规则推送通知。</span>';
            }
            toast('通知设置已保存', 'ok');
            setTimeout(function () { closeOvl('nfOvlSettings'); }, 900);
        }, 1100);
    });

    /* —— 日期分组：折叠 / 仅看本日 —— */
    var activeDayFilter = null;

    function getDaySections() {
        var list = document.querySelector('.nf-list');
        if (!list) return [];
        var sections = [];
        var cur = null;
        Array.prototype.forEach.call(list.children, function (node) {
            if (node.classList.contains('nf-day')) {
                cur = { day: node, items: [] };
                sections.push(cur);
            } else if (node.classList.contains('nf-item') && cur) {
                cur.items.push(node);
            }
        });
        return sections;
    }

    function applyDayFilter(dayKey) {
        var sections = getDaySections();
        sections.forEach(function (sec) {
            var key = sec.day.getAttribute('data-day');
            var match = !dayKey || key === dayKey;
            sec.day.classList.toggle('is-active', !!dayKey && key === dayKey);
            sec.items.forEach(function (item) {
                item.classList.toggle('nf-day-hidden', !!dayKey && key !== dayKey);
            });
        });
        document.querySelectorAll('.nf-day').forEach(function (d) {
            if (!dayKey) d.classList.remove('is-active');
        });
    }

    document.querySelectorAll('.nf-day').forEach(function (dayEl) {
        dayEl.addEventListener('click', function (e) {
            if (e.target.closest('button')) return;
            var key = dayEl.getAttribute('data-day');
            var collapsed = dayEl.classList.toggle('is-collapsed');
            var section = getDaySections().find(function (s) { return s.day === dayEl; });
            if (section) {
                section.items.forEach(function (item) {
                    item.style.display = collapsed ? 'none' : '';
                });
            }
            if (e.altKey && key) {
                activeDayFilter = activeDayFilter === key ? null : key;
                applyDayFilter(activeDayFilter);
                toast(activeDayFilter ? '仅显示：' + dayEl.textContent.split('·')[0].trim() : '已显示全部日期', 'info');
            }
        });
    });

    /* —— 标记已读（供外部 filter 脚本调用） —— */
    function markItemRead(item) {
        if (!item || !item.classList.contains('nf-item')) return;
        if (item.classList.contains('unread')) {
            item.classList.remove('unread');
            window.dispatchEvent(new CustomEvent('fl-nf-unread-changed'));
        }
    }

    /* —— 通知项操作（事件委托） —— */
    var ctx = { user: '', post: '', avatar: '' };

    function fillReplyModal() {
        document.getElementById('nfReplyTo').textContent = ctx.user || '用户';
        var ta = document.getElementById('nfReplyText');
        if (ta) ta.value = '';
    }

    document.querySelector('.nf-list')?.addEventListener('click', function (e) {
        var btn = e.target.closest('.nf-act button, .nf-act a');
        var item = e.target.closest('.nf-item');
        if (!btn || !item) {
            if (item && !e.target.closest('.nf-act') && !e.target.closest('button')) {
                if (tryOpenAnnouncement(item)) return;
                openDetailFromItem(item);
            }
            return;
        }
        e.stopPropagation();
        e.preventDefault();

        var label = (btn.textContent || '').replace(/\s+/g, ' ').trim();
        var av = item.querySelector('.av-mini');
        ctx.avatar = av ? getComputedStyle(av).backgroundImage.replace(/^url\(["']?|["']?\)$/g, '') : '';
        var nameEl = item.querySelector('.nf-text b');
        ctx.user = nameEl ? nameEl.textContent : '用户';
        ctx.post = item.querySelector('.nf-meta span')?.textContent || '相关动态';

        markItemRead(item);

        if (label.indexOf('感谢') >= 0) {
            btn.classList.add('is-done');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> 已感谢';
            toast('已向 ' + ctx.user + ' 发送感谢', 'ok');
            return;
        }
        if (label.indexOf('回复') >= 0) {
            fillReplyModal();
            openOvl('nfOvlReply');
            return;
        }
        if (label.indexOf('欢迎私信') >= 0) {
            document.getElementById('nfDmTo').textContent = ctx.user;
            document.getElementById('nfDmText').value = '感谢订阅！欢迎查看我的专属内容～';
            openOvl('nfOvlDm');
            return;
        }
        if (label.indexOf('主页') >= 0) {
            location.href = 'creator-profile.html';
            return;
        }
        if (label.indexOf('点赞') >= 0) {
            btn.classList.add('is-liked');
            btn.innerHTML = '<i class="fa-solid fa-heart"></i> 已赞';
            toast('已点赞评论', 'ok');
            return;
        }
        if (label.indexOf('立即观看') >= 0) {
            location.href = 'live-detail.html';
            return;
        }
        if (label.indexOf('查看预告') >= 0) {
            openDetailFromItem(item);
            return;
        }
        if (label.indexOf('取消提醒') >= 0) {
            item.remove();
            window.dispatchEvent(new CustomEvent('fl-nf-unread-changed'));
            toast('已取消直播预告提醒', 'ok');
            return;
        }
        if (label.indexOf('钱包') >= 0) {
            openOvl('nfOvlWallet');
            return;
        }
        if (label.indexOf('续费') >= 0 || label.indexOf('立即续费') >= 0) {
            openOvl('nfOvlRenew');
            return;
        }
        if (label.indexOf('查看详情') >= 0 || label.indexOf('查看活动') >= 0) {
            if (tryOpenAnnouncement(item)) return;
            openDetailFromItem(item);
            return;
        }
    });

    function tryOpenAnnouncement(item) {
        var id = window.FL_nfGetAnnouncementId ? window.FL_nfGetAnnouncementId(item) : item.getAttribute('data-nf-announcement-id');
        if (!id) return false;
        if (window.FL_nfOpenAnnouncement && window.FL_nfOpenAnnouncement(id)) return true;
        return false;
    }

    function openDetailFromItem(item) {
        if (tryOpenAnnouncement(item)) return;
        var typeTag = item.querySelector('.nf-meta span')?.textContent || '通知';
        document.getElementById('nfDetailTitle').textContent = item.querySelector('.nf-text')?.innerText?.slice(0, 80) || '通知详情';
        document.getElementById('nfDetailType').textContent = typeTag;
        document.getElementById('nfDetailTime').textContent = item.querySelector('.nf-meta')?.textContent?.replace(/\s+/g, ' ') || '—';
        document.getElementById('nfDetailBody').textContent = item.querySelector('.nf-text')?.innerText || '';
        var thumb = item.querySelector('.nf-thumb');
        var img = document.getElementById('nfDetailImg');
        if (img) {
            if (thumb) {
                img.src = getComputedStyle(thumb).backgroundImage.replace(/^url\(["']?|["']?\)$/g, '');
                img.style.display = '';
            } else {
                img.style.display = 'none';
            }
        }
        openOvl('nfOvlDetail');
    }

    document.getElementById('btnNfReplySend')?.addEventListener('click', function () {
        var text = (document.getElementById('nfReplyText')?.value || '').trim();
        if (!text) {
            toast('请输入回复内容', 'err');
            return;
        }
        closeOvl('nfOvlReply');
        toast('回复已发送给 ' + (ctx.user || '用户'), 'ok');
    });

    document.getElementById('btnNfDmSend')?.addEventListener('click', function () {
        closeOvl('nfOvlDm');
        toast('私信已发送', 'ok');
    });

    document.getElementById('btnNfLiveJoin')?.addEventListener('click', function () {
        closeOvl('nfOvlLive');
        toast('正在进入直播间（原型演示）', 'info');
    });

    document.getElementById('btnNfRenewConfirm')?.addEventListener('click', function () {
        closeOvl('nfOvlRenew');
        toast('续费成功，订阅权益已延长 30 天', 'ok');
    });

    document.getElementById('btnNfWalletGo')?.addEventListener('click', function () {
        closeOvl('nfOvlWallet');
        toast('钱包余额与流水可在资产页查看（原型不跳转）', 'info');
    });

    window.FL_nfToast = toast;
    window.FL_nfOpenDetail = openDetailFromItem;
})();
