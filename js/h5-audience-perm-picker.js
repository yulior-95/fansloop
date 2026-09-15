/**
 * H5 发布页 · 「谁可以看」底部弹层（与 Web create-audience-visibility 一致）
 */
(function () {
    var OPTIONS = [
        {
            value: 'public',
            label: '所有人',
            sub: '对平台访客与粉丝公开展示（仍受付费/订阅档位约束）'
        },
        {
            value: 'fans',
            label: '仅粉丝',
            sub: '仅关注你的用户可在动态流与个人主页看到'
        },
        {
            value: 'subscribers',
            label: '仅订阅者',
            sub: '仅有效订阅会员可见；与「订阅专属」定价可同时生效'
        }
    ];

    var select = document.getElementById('permSelect');
    if (!select || select.dataset.permPickerReady === '1') return;

    var hint = document.getElementById('permHint');
    var audienceRow = document.getElementById('permAudienceRow');
    var audienceVal = document.getElementById('permAudienceVal');
    var trigger = document.getElementById('permTrigger');
    var triggerLabel = document.getElementById('permTriggerLabel');

    if (!trigger && !audienceRow) {
        trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'perm-trigger';
        trigger.id = 'permTrigger';
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.innerHTML = '<span class="perm-trigger-label" id="permTriggerLabel"></span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
        select.parentNode.insertBefore(trigger, select.nextSibling);
        triggerLabel = document.getElementById('permTriggerLabel');
    }

    select.classList.add('perm-select-native');
    select.innerHTML = OPTIONS.map(function (o) {
        return '<option value="' + o.value + '">' + o.label + '</option>';
    }).join('');

    var ovl = document.getElementById('permAudienceOvl');
    if (!ovl) {
        ovl = document.createElement('div');
        ovl.className = 'perm-ovl';
        ovl.id = 'permAudienceOvl';
        ovl.setAttribute('aria-hidden', 'true');
        ovl.innerHTML =
            '<div class="perm-sheet" role="dialog" aria-modal="true" aria-labelledby="permSheetTitle">' +
            '<div class="perm-sheet-hd">' +
            '<h3 id="permSheetTitle"><i class="fa-solid fa-eye"></i> 谁可以看</h3>' +
            '<button type="button" id="permSheetClose" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="perm-sheet-body" id="permSheetBody"></div>' +
            '<div class="perm-sheet-ft">' +
            '<button type="button" class="btn btn-secondary" id="permSheetCancel">取消</button>' +
            '<button type="button" class="btn btn-primary" id="permSheetConfirm"><i class="fa-solid fa-check"></i> 确定</button>' +
            '</div></div>';
        document.body.appendChild(ovl);
    }

    var body = ovl.querySelector('#permSheetBody');
    body.innerHTML = OPTIONS.map(function (o) {
        return '<label class="perm-opt" data-value="' + o.value + '">' +
            '<input type="radio" name="permAudiencePick" value="' + o.value + '">' +
            '<div><div class="perm-opt-ti">' + o.label + '</div><div class="perm-opt-sub">' + o.sub + '</div></div></label>';
    }).join('');

    var current = select.value || 'public';
    var pending = current;

    function labelFor(value) {
        var o = OPTIONS.filter(function (x) { return x.value === value; })[0];
        return o ? o.label : OPTIONS[0].label;
    }

    function syncUi(value) {
        body.querySelectorAll('.perm-opt').forEach(function (row) {
            var on = row.getAttribute('data-value') === value;
            row.classList.toggle('on', on);
            var input = row.querySelector('input[type="radio"]');
            if (input) input.checked = on;
        });
    }

    function renderField() {
        var label = labelFor(current);
        if (triggerLabel) triggerLabel.textContent = label;
        if (hint) hint.textContent = label;
        if (audienceVal) {
            audienceVal.innerHTML = label + ' <i class="fa-solid fa-chevron-right" style="font-size:10px;margin-left:6px;color:var(--text-tertiary)" aria-hidden="true"></i>';
        }
        select.value = current;
    }

    function openSheet() {
        pending = current;
        syncUi(pending);
        ovl.classList.add('open');
        ovl.setAttribute('aria-hidden', 'false');
    }

    function closeSheet() {
        ovl.classList.remove('open');
        ovl.setAttribute('aria-hidden', 'true');
    }

    function confirm() {
        current = pending;
        renderField();
        closeSheet();
        try {
            select.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (e) {
            var ev = document.createEvent('Event');
            ev.initEvent('change', true, true);
            select.dispatchEvent(ev);
        }
    }

    if (trigger) trigger.addEventListener('click', openSheet);
    if (audienceRow) {
        audienceRow.addEventListener('click', openSheet);
        audienceRow.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openSheet();
            }
        });
    }
    ovl.querySelector('#permSheetClose').addEventListener('click', closeSheet);
    ovl.querySelector('#permSheetCancel').addEventListener('click', closeSheet);
    ovl.querySelector('#permSheetConfirm').addEventListener('click', confirm);
    ovl.addEventListener('click', function (e) {
        if (e.target === ovl) closeSheet();
    });

    body.querySelectorAll('.perm-opt').forEach(function (row) {
        row.addEventListener('click', function (e) {
            if (e.target.tagName === 'INPUT') return;
            pending = row.getAttribute('data-value') || 'public';
            syncUi(pending);
        });
        var input = row.querySelector('input');
        if (input) {
            input.addEventListener('change', function () {
                if (input.checked) {
                    pending = input.value;
                    syncUi(pending);
                }
            });
        }
    });

    if (!OPTIONS.some(function (o) { return o.value === select.value; })) {
        select.value = 'public';
    }
    current = select.value;
    renderField();
    select.dataset.permPickerReady = '1';
})();
