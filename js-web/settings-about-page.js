/**
 * 关于 FansLoop · 检查更新 / 复制版本 / 更新日志 / 反馈弹窗
 */
(function () {
    var VERSION = '2.4.1';
    var BUILD = '20260622';
    var CHANGELOG_KEY = 'fl_about_changelog_read';
    var FEEDBACK_KEY = 'fl_about_feedback_draft';

    var toastEl = document.getElementById('aboutToast');
    var verText = document.getElementById('aboutVerText');
    var buildText = document.getElementById('aboutBuildText');
    var updateBtn = document.getElementById('aboutCheckUpdate');
    var copyBtn = document.getElementById('aboutCopyVer');
    var feedbackOvl = document.getElementById('ovlAboutFeedback');

    var fbState = {
        type: 'feature',
        submitting: false,
        previewUrl: ''
    };

    function toast(msg, type) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.className = 'ab-toast show' + (type === 'err' ? ' err' : ' ok');
        clearTimeout(toast._tm);
        toast._tm = setTimeout(function () {
            toastEl.classList.remove('show');
        }, 2600);
    }

    if (verText) verText.textContent = 'v' + VERSION;
    if (buildText) buildText.textContent = 'Build ' + BUILD;

    function copyVersion() {
        var text = 'FansLoop v' + VERSION + ' (Build ' + BUILD + ')';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                toast('版本信息已复制', 'ok');
            }).catch(function () {
                toast('复制失败，请手动复制', 'err');
            });
        } else {
            toast(text, 'ok');
        }
    }

    function checkUpdate() {
        if (!updateBtn) return;
        var orig = updateBtn.innerHTML;
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 检查中…';
        setTimeout(function () {
            updateBtn.disabled = false;
            updateBtn.innerHTML = orig;
            toast('当前已是最新版本 v' + VERSION, 'ok');
        }, 1400);
    }

    function toggleChangelog(item) {
        var wasOpen = item.classList.contains('open');
        document.querySelectorAll('.about-ch-item').forEach(function (el) {
            el.classList.remove('open');
        });
        if (!wasOpen) item.classList.add('open');
    }

    function markChangelogRead() {
        try { localStorage.setItem(CHANGELOG_KEY, BUILD); } catch (e) { /* ignore */ }
        var badge = document.getElementById('aboutChangelogBadge');
        if (badge) badge.hidden = true;
    }

    function bindChangelog() {
        document.querySelectorAll('.about-ch-item').forEach(function (item) {
            var head = item.querySelector('.about-ch-head');
            if (!head) return;
            head.addEventListener('click', function () {
                toggleChangelog(item);
                markChangelogRead();
            });
            head.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleChangelog(item);
                    markChangelogRead();
                }
            });
        });
    }

    function setFbError(msg) {
        var err = document.getElementById('aboutFbErr');
        if (!err) return;
        if (msg) {
            err.textContent = msg;
            err.classList.add('show');
        } else {
            err.textContent = '';
            err.classList.remove('show');
        }
    }

    function validEmail(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    function revokeFbPreview() {
        if (fbState.previewUrl) {
            URL.revokeObjectURL(fbState.previewUrl);
            fbState.previewUrl = '';
        }
    }

    function clearFbPreview() {
        revokeFbPreview();
        var fileInput = document.getElementById('aboutFbFile');
        var preview = document.getElementById('aboutFbPreview');
        var upload = document.getElementById('aboutFbUpload');
        if (fileInput) fileInput.value = '';
        if (preview) preview.hidden = true;
        if (upload) upload.hidden = false;
    }

    function resetFeedbackForm() {
        fbState.type = 'feature';
        fbState.submitting = false;
        setFbError('');
        clearFbPreview();

        document.querySelectorAll('.about-fb-type').forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-fb-type') === 'feature');
        });

        var content = document.getElementById('aboutFbContent');
        var contact = document.getElementById('aboutFbContact');
        var count = document.getElementById('aboutFbCharCount');
        if (content) content.value = '';
        if (contact) contact.value = '';
        if (count) count.textContent = '0';

        var stepForm = document.getElementById('aboutFbStepForm');
        var stepDone = document.getElementById('aboutFbStepDone');
        var submitBtn = document.getElementById('aboutFbSubmit');
        var cancelBtn = document.getElementById('aboutFbCancel');
        if (stepForm) stepForm.hidden = false;
        if (stepDone) stepDone.hidden = true;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 提交反馈';
        }
        if (cancelBtn) cancelBtn.textContent = '取消';
    }

    function openFeedbackModal() {
        if (!feedbackOvl) return;
        resetFeedbackForm();
        feedbackOvl.classList.add('show');
        feedbackOvl.setAttribute('aria-hidden', 'false');
        var content = document.getElementById('aboutFbContent');
        if (content) content.focus();
    }

    function closeFeedbackModal() {
        if (!feedbackOvl) return;
        feedbackOvl.classList.remove('show');
        feedbackOvl.setAttribute('aria-hidden', 'true');
        clearFbPreview();
    }

    function makeTicketId() {
        var n = Math.floor(1000 + Math.random() * 9000);
        var d = new Date();
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return 'FB-' + y + m + day + '-' + n;
    }

    function submitFeedback() {
        if (fbState.submitting) return;

        var contentEl = document.getElementById('aboutFbContent');
        var contactEl = document.getElementById('aboutFbContact');
        var content = contentEl ? contentEl.value.trim() : '';
        var contact = contactEl ? contactEl.value.trim() : '';

        setFbError('');
        if (content.length < 10) {
            setFbError('请至少输入 10 个字的详细描述');
            if (contentEl) contentEl.focus();
            return;
        }
        if (contact && !validEmail(contact)) {
            setFbError('请输入有效的邮箱地址');
            if (contactEl) contactEl.focus();
            return;
        }

        var submitBtn = document.getElementById('aboutFbSubmit');
        fbState.submitting = true;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 提交中…';
        }

        setTimeout(function () {
            try {
                localStorage.setItem(FEEDBACK_KEY, JSON.stringify({
                    type: fbState.type,
                    content: content,
                    contact: contact,
                    at: Date.now()
                }));
            } catch (e) { /* ignore */ }

            var ticket = makeTicketId();
            var ticketEl = document.getElementById('aboutFbTicket');
            if (ticketEl) ticketEl.textContent = ticket;

            var stepForm = document.getElementById('aboutFbStepForm');
            var stepDone = document.getElementById('aboutFbStepDone');
            var cancelBtn = document.getElementById('aboutFbCancel');
            if (stepForm) stepForm.hidden = true;
            if (stepDone) stepDone.hidden = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> 完成';
            }
            if (cancelBtn) cancelBtn.textContent = '关闭';
            fbState.submitting = false;
        }, 1100);
    }

    function onFeedbackDone() {
        closeFeedbackModal();
        toast('感谢你的反馈！', 'ok');
    }

    function bindFeedbackModal() {
        if (!feedbackOvl) return;

        document.querySelectorAll('.about-fb-type').forEach(function (btn) {
            btn.addEventListener('click', function () {
                fbState.type = btn.getAttribute('data-fb-type') || 'feature';
                document.querySelectorAll('.about-fb-type').forEach(function (b) {
                    b.classList.toggle('active', b === btn);
                });
            });
        });

        var content = document.getElementById('aboutFbContent');
        var count = document.getElementById('aboutFbCharCount');
        if (content && count) {
            content.addEventListener('input', function () {
                count.textContent = String(content.value.length);
            });
        }

        var fileInput = document.getElementById('aboutFbFile');
        var preview = document.getElementById('aboutFbPreview');
        var previewImg = document.getElementById('aboutFbPreviewImg');
        var upload = document.getElementById('aboutFbUpload');
        var previewRm = document.getElementById('aboutFbPreviewRm');

        if (fileInput) {
            fileInput.addEventListener('change', function () {
                var file = fileInput.files && fileInput.files[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                    setFbError('仅支持图片格式截图');
                    fileInput.value = '';
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    setFbError('截图大小不能超过 5MB');
                    fileInput.value = '';
                    return;
                }
                setFbError('');
                revokeFbPreview();
                fbState.previewUrl = URL.createObjectURL(file);
                if (previewImg) previewImg.src = fbState.previewUrl;
                if (preview) preview.hidden = false;
                if (upload) upload.hidden = true;
            });
        }

        if (previewRm) {
            previewRm.addEventListener('click', function (e) {
                e.preventDefault();
                clearFbPreview();
            });
        }

        var closeBtn = document.getElementById('aboutFeedbackClose');
        var cancelBtn = document.getElementById('aboutFbCancel');
        var submitBtn = document.getElementById('aboutFbSubmit');

        function onCloseClick() {
            var stepDone = document.getElementById('aboutFbStepDone');
            if (stepDone && !stepDone.hidden) {
                onFeedbackDone();
            } else {
                closeFeedbackModal();
            }
        }

        if (closeBtn) closeBtn.addEventListener('click', onCloseClick);
        if (cancelBtn) cancelBtn.addEventListener('click', onCloseClick);
        if (submitBtn) {
            submitBtn.addEventListener('click', function () {
                var stepDone = document.getElementById('aboutFbStepDone');
                if (stepDone && !stepDone.hidden) {
                    onFeedbackDone();
                } else {
                    submitFeedback();
                }
            });
        }

        feedbackOvl.addEventListener('click', function (e) {
            if (e.target === feedbackOvl) onCloseClick();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape' || !feedbackOvl.classList.contains('show')) return;
            onCloseClick();
        });
    }

    function bindLinkRows() {
        document.querySelectorAll('[data-about-action]').forEach(function (el) {
            function go() {
                var action = el.getAttribute('data-about-action');
                if (action === 'support') {
                    location.href = 'transaction-contact.html';
                    return;
                }
                if (action === 'feedback') {
                    openFeedbackModal();
                }
            }
            el.addEventListener('click', go);
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    go();
                }
            });
        });
    }

    try {
        var read = localStorage.getItem(CHANGELOG_KEY);
        if (read === BUILD) {
            var badge = document.getElementById('aboutChangelogBadge');
            if (badge) badge.hidden = true;
        }
    } catch (e) { /* ignore */ }

    if (copyBtn) copyBtn.addEventListener('click', copyVersion);
    if (updateBtn) updateBtn.addEventListener('click', checkUpdate);
    bindChangelog();
    bindLinkRows();
    document.addEventListener('fansloop-lang-change', function () {
        if (window.FLI18n) window.FLI18n.applyAll();
    });

    bindFeedbackModal();
})();
