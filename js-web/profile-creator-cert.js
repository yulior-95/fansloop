/**
 * 个人主页 · 创作者官方认证（状态标签 + 申请弹窗）
 */
(function () {
    const STORAGE_KEY = 'fl_creator_cert_v1';

    function certStorageKey() {
        var uid = window.GoodfansAuth && window.GoodfansAuth.getUserId ? window.GoodfansAuth.getUserId() : 'default';
        return STORAGE_KEY + '_' + uid;
    }
    const tagWrap = document.getElementById('creatorCertTagWrap');
    const roleLine = document.getElementById('profileRoleLine');
    const roleBadge = document.querySelector('.ph-row .av-xl .role-badge');
    const sheet = document.getElementById('sheetCreatorCert');
    const toast = document.getElementById('pfToast');

    if (!tagWrap) return;

    const CREATOR_TYPES = [
        { id: 'photo', name: '摄影摄像', icon: 'fa-camera', grad: 'linear-gradient(135deg,#6366F1,#8B5CF6)' },
        { id: 'travel', name: '旅行出行', icon: 'fa-plane', grad: 'linear-gradient(135deg,#06B6D4,#3B82F6)' },
        { id: 'food', name: '美食饮品', icon: 'fa-utensils', grad: 'linear-gradient(135deg,#F59E0B,#EF4444)' },
        { id: 'fashion', name: '时尚美妆', icon: 'fa-wand-magic-sparkles', grad: 'linear-gradient(135deg,#EC4899,#A855F7)' },
        { id: 'music', name: '音乐舞蹈', icon: 'fa-music', grad: 'linear-gradient(135deg,#8B5CF6,#EC4899)' },
        { id: 'knowledge', name: '知识科普', icon: 'fa-book-open', grad: 'linear-gradient(135deg,#10B981,#059669)' },
        { id: 'life', name: '生活记录', icon: 'fa-house', grad: 'linear-gradient(135deg,#78716C,#57534E)' },
        { id: 'game', name: '游戏电竞', icon: 'fa-gamepad', grad: 'linear-gradient(135deg,#7C3AED,#4F46E5)' },
        { id: 'sport', name: '运动健身', icon: 'fa-dumbbell', grad: 'linear-gradient(135deg,#22C55E,#16A34A)' },
        { id: 'film', name: '影视娱乐', icon: 'fa-film', grad: 'linear-gradient(135deg,#F43F5E,#BE123C)' }
    ];

    let state = loadState();
    let wizardStep = 1;
    let selectedType = state.type || '';

    function loadState() {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('creator');
        if (fromUrl === 'none' || fromUrl === 'pending' || fromUrl === 'approved') {
            const s = { status: fromUrl, type: params.get('type') || 'photo' };
            if (params.get('reset') === '1') {
                try { localStorage.removeItem(certStorageKey()); } catch (e) { /* ignore */ }
            }
            return s;
        }
        try {
            const raw = localStorage.getItem(certStorageKey());
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return { status: 'none', type: '' };
    }

    function saveState() {
        try {
            localStorage.setItem(certStorageKey(), JSON.stringify(state));
        } catch (e) { /* ignore */ }
    }

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2600);
    }

    function getConditions() {
        const params = new URLSearchParams(window.location.search);
        const kycFail = params.get('kyc') === '0';
        const complianceFail = params.get('compliance') === '0';
        var kycOk = !kycFail;
        if (!kycFail && window.FLUserAssets) {
            kycOk = window.FLUserAssets.isKycApproved();
        } else if (!kycFail && window.GoodfansKycStore) {
            kycOk = window.GoodfansKycStore.isApproved();
        }
        return {
            kyc: kycOk,
            compliance: !complianceFail
        };
    }

    function allConditionsPass() {
        const c = getConditions();
        return c.kyc && c.compliance;
    }

    function renderTag() {
        const status = state.status;
        let html = '';

        if (status === 'approved') {
            html = '<span class="tag tag-purple" id="creatorCertTag"><i class="fa-solid fa-palette"></i>认证创作者</span>';
        } else if (status === 'pending') {
            html = '<span class="tag tag-creator-pending" id="creatorCertTag" title="审核中，请耐心等待"><i class="fa-solid fa-hourglass-half"></i>认证创作者审核中</span>';
        } else {
            html = '<button type="button" class="tag tag-creator-apply" id="creatorCertTag"><i class="fa-solid fa-certificate"></i>申请成为创作者</button>';
        }

        tagWrap.innerHTML = html;

        const el = document.getElementById('creatorCertTag');
        if (el && status === 'none') {
            el.addEventListener('click', openCertSheet);
        }

        if (roleLine) {
            if (status === 'approved') {
                roleLine.textContent = 'Creator · 0x7A3F...3F2C';
            } else if (status === 'pending') {
                roleLine.textContent = '创作者认证审核中 · 0x7A3F...3F2C';
            } else {
                roleLine.textContent = '用户 · 0x7A3F...3F2C';
            }
        }

        if (roleBadge) {
            roleBadge.classList.remove('role-badge--muted', 'role-badge--pending');
            var icon = roleBadge.querySelector('i');
            if (!icon) {
                icon = document.createElement('i');
                roleBadge.appendChild(icon);
            }
            if (status === 'approved') {
                icon.className = 'fa-solid fa-crown';
            } else if (status === 'pending') {
                roleBadge.classList.add('role-badge--pending');
                icon.className = 'fa-solid fa-hourglass-half';
            } else {
                roleBadge.classList.add('role-badge--muted');
                icon.className = 'fa-solid fa-user';
            }
        }
    }

    function renderTypeGrid() {
        const grid = document.getElementById('certTypeGrid');
        if (!grid) return;
        grid.innerHTML = CREATOR_TYPES.map(t => {
            const sel = selectedType === t.id ? ' selected' : '';
            return (
                '<label class="cert-type-card' + sel + '" data-type="' + t.id + '">' +
                '<input type="radio" name="certType" value="' + t.id + '"' + (sel ? ' checked' : '') + ' />' +
                '<div class="ic" style="background:' + t.grad + '"><i class="fa-solid ' + t.icon + '"></i></div>' +
                '<div class="nm">' + t.name + '</div></label>'
            );
        }).join('');

        grid.querySelectorAll('.cert-type-card').forEach(card => {
            card.addEventListener('click', () => {
                selectedType = card.getAttribute('data-type');
                grid.querySelectorAll('.cert-type-card').forEach(c => {
                    c.classList.toggle('selected', c.getAttribute('data-type') === selectedType);
                    const inp = c.querySelector('input');
                    if (inp) inp.checked = c.classList.contains('selected');
                });
                syncWizardButtons();
            });
        });
    }

    function renderConditions() {
        const list = document.getElementById('certCondList');
        if (!list) return;
        const c = getConditions();

        const items = [
            {
                key: 'kyc',
                pass: c.kyc,
                title: '实名认证',
                desc: c.kyc ? '已完成平台实名认证（KYC）' : '请先完成「设置 → 身份认证」中的实名认证',
                failHint: '不符合'
            },
            {
                key: 'compliance',
                pass: c.compliance,
                title: '内容合规',
                desc: c.compliance
                    ? '近期无账号/视频违规记录，且未发布低质或非原创内容'
                    : '存在近期违规或低质/非原创记录，暂不可提交认证',
                failHint: '不符合'
            }
        ];

        list.innerHTML = items.map(it => {
            const cls = it.pass ? 'pass' : 'fail';
            const st = it.pass ? '符合' : it.failHint;
            const ic = it.pass ? 'fa-circle-check' : 'fa-circle-xmark';
            return (
                '<div class="cert-cond ' + cls + '" data-cond="' + it.key + '">' +
                '<div class="cond-ic"><i class="fa-solid ' + ic + '"></i></div>' +
                '<div class="cond-body"><h4>' + it.title + '</h4><p>' + it.desc + '</p></div>' +
                '<span class="cond-st">' + st + '</span></div>'
            );
        }).join('');
    }

    function setWizardStep(step) {
        wizardStep = step;
        document.querySelectorAll('.cert-pane').forEach(p => {
            p.classList.toggle('active', Number(p.getAttribute('data-cert-step')) === step);
        });
        document.querySelectorAll('.cert-step-dot').forEach(d => {
            const n = Number(d.getAttribute('data-step'));
            d.classList.remove('active', 'done');
            if (n < step) d.classList.add('done');
            if (n === step) d.classList.add('active');
        });

        const btnBack = document.getElementById('certBtnBack');
        const btnNext = document.getElementById('certBtnNext');
        const btnSubmit = document.getElementById('certBtnSubmit');
        const btnDone = document.getElementById('certBtnDone');
        const footNote = document.getElementById('certFootNote');

        if (btnBack) btnBack.style.display = step === 2 ? '' : 'none';
        if (btnNext) btnNext.style.display = step === 1 ? '' : 'none';
        if (btnSubmit) {
            btnSubmit.style.display = step === 2 ? '' : 'none';
            btnSubmit.disabled = !allConditionsPass();
        }
        if (btnDone) btnDone.style.display = step === 3 ? '' : 'none';
        if (footNote) {
            footNote.textContent = step === 2 && !allConditionsPass()
                ? '请先满足全部认证条件后再提交'
                : '';
        }
        if (step === 2) renderConditions();
        syncWizardButtons();
    }

    function syncWizardButtons() {
        const btnNext = document.getElementById('certBtnNext');
        if (btnNext && wizardStep === 1) {
            btnNext.disabled = !selectedType;
        }
    }

    function openCertSheet() {
        if (!sheet || state.status !== 'none') return;
        selectedType = state.type || '';
        wizardStep = 1;
        renderTypeGrid();
        setWizardStep(1);
        sheet.classList.add('show');
        sheet.setAttribute('aria-hidden', 'false');
    }

    function closeCertSheet() {
        if (!sheet) return;
        sheet.classList.remove('show');
        sheet.setAttribute('aria-hidden', 'true');
    }

    function submitCert() {
        if (!allConditionsPass() || !selectedType) return;
        state.status = 'pending';
        state.type = selectedType;
        saveState();
        setWizardStep(3);
        setTimeout(() => {
            closeCertSheet();
            renderTag();
            showToast('认证申请已提交，请等待审核（机审 + 人工）');
        }, 1600);
    }

    function bindSheet() {
        if (!sheet) return;

        document.getElementById('certBtnClose')?.addEventListener('click', closeCertSheet);
        sheet.addEventListener('click', e => {
            if (e.target === sheet) closeCertSheet();
        });

        document.getElementById('certBtnBack')?.addEventListener('click', () => setWizardStep(1));
        document.getElementById('certBtnNext')?.addEventListener('click', () => {
            if (!selectedType) {
                showToast('请选择与您内容匹配的创作类型');
                return;
            }
            setWizardStep(2);
        });
        document.getElementById('certBtnSubmit')?.addEventListener('click', submitCert);
        document.getElementById('certBtnDone')?.addEventListener('click', closeCertSheet);

        document.getElementById('certDemoApprove')?.addEventListener('click', () => {
            state.status = 'approved';
            saveState();
            closeCertSheet();
            renderTag();
            showToast('原型：审核已通过，已展示「认证创作者」标识');
        });
        document.getElementById('certDemoReset')?.addEventListener('click', () => {
            state = { status: 'none', type: '' };
            selectedType = '';
            saveState();
            closeCertSheet();
            renderTag();
            showToast('原型：已重置为未认证状态');
        });
    }

    renderTag();
    bindSheet();

    const params = new URLSearchParams(window.location.search);
    if (params.get('cert') === 'open' && state.status === 'none') {
        setTimeout(openCertSheet, 300);
    }
    if (params.get('cert') === 'step2' && state.status === 'none') {
        selectedType = params.get('type') || 'photo';
        setTimeout(() => {
            openCertSheet();
            setWizardStep(2);
        }, 300);
    }
})();
