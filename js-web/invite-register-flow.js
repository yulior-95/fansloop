/**
 * 邀请码选填 · 校验与注册提交拦截（可复用于多个表单）
 */
(function (global) {
    var FL = global.FLInviteReward;
    if (!FL) return;

    function attachInviteField(opts) {
        var input = document.getElementById(opts.inputId);
        if (!input) return null;

        var validBox = opts.validBoxId ? document.getElementById(opts.validBoxId) : null;
        var errBox = opts.errBoxId ? document.getElementById(opts.errBoxId) : null;
        var hintEl = opts.hintId ? document.getElementById(opts.hintId) : null;
        var submitBtn = opts.submitBtnId ? document.getElementById(opts.submitBtnId) : null;
        var pendingInviter = null;
        var debounceTimer;

        if (hintEl) {
            FL.fetchConfig().then(function (cfg) {
                hintEl.textContent = FL.formatInviteRewardTip(cfg) + '。关联建立后不可自行解除。';
            });
        }

        function showValid(inv) {
            pendingInviter = inv;
            if (errBox) errBox.classList.remove('show');
            if (!validBox) return;
            validBox.classList.add('show');
            validBox.innerHTML =
                '<div class="mini-av" style="background-image:url(\'' + inv.inviterAvatar + '\')"></div>' +
                '<div><strong style="color:#fff;">' + inv.inviterName + '</strong> · 邀请码有效<br>' +
                '<span style="opacity:0.85;">注册成功后将建立永久关联，不可自行解除</span></div>';
        }

        function clearValid() {
            pendingInviter = null;
            if (validBox) validBox.classList.remove('show');
        }

        function validateCode(raw) {
            var code = (raw || '').trim();
            if (!code) {
                clearValid();
                if (errBox) errBox.classList.remove('show');
                return Promise.resolve(null);
            }
            return FL.resolveInviteCode(code).then(function (inv) {
                if (inv) showValid(inv);
                else {
                    clearValid();
                    if (errBox) {
                        errBox.textContent = '邀请码无效或已失效，请核对后重试（仍可跳过不填）';
                        errBox.classList.add('show');
                    }
                }
                return inv;
            });
        }

        input.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                validateCode(input.value);
            }, 320);
        });

        var ref = new URLSearchParams(location.search).get('ref');
        if (ref) {
            input.value = ref;
            validateCode(ref);
        }

        function beforeRegisterSubmit() {
            var code = input.value.trim();
            if (code && !pendingInviter) {
                return { ok: false, message: '请填写有效邀请码，或清空后注册' };
            }
            if (pendingInviter) {
                try {
                    sessionStorage.setItem('fl_pending_invite', JSON.stringify({
                        code: pendingInviter.code,
                        inviterUid: pendingInviter.inviterUid,
                        inviterName: pendingInviter.inviterName
                    }));
                } catch (ex) {}
                return {
                    ok: true,
                    redirect: 'modal-invite-bind-confirm.html?code=' + encodeURIComponent(pendingInviter.code)
                };
            }
            return { ok: true };
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', function (e) {
                var result = beforeRegisterSubmit();
                if (!result.ok) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    if (opts.onError && result.message) opts.onError(result.message);
                    return false;
                }
                if (result.redirect) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    location.href = result.redirect;
                    return false;
                }
            }, true);
        }

        return {
            getPending: function () { return pendingInviter; },
            validate: validateCode,
            beforeRegisterSubmit: beforeRegisterSubmit
        };
    }

    global.FL_attachInviteField = attachInviteField;

    if (document.getElementById('btnRegDone') && !document.getElementById('btnEmailRegDone')) {
        attachInviteField({
            inputId: 'regInviteCode',
            validBoxId: 'regInviteValid',
            errBoxId: 'regInviteErr',
            hintId: 'regInviteHint',
            submitBtnId: 'btnRegDone',
            onError: function (msg) {
                var err = document.getElementById('regErr');
                if (err) {
                    err.style.display = 'flex';
                    err.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i><div>' + msg + '</div>';
                }
            }
        });
    }
})(typeof window !== 'undefined' ? window : this);
