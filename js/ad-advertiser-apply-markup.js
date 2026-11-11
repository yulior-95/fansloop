/**
 * 广告主申请页 · 共用结构（由 initApply 注入或内嵌于 STAGE_HTML）
 */
(function (global) {
    global.AD_APPLY_PREREQ_TIP =
        '<p><strong>申请需满足：</strong>已登录、KYC 已通过；填写主体名称与邮箱并同意协议。</p>' +
        '<p><strong>申请无需：</strong>广告账户余额、押金、创作者或上架商品（购套餐支付时再充值）。</p>';

    global.AD_APPLY_FORM_INNER =
        '<form id="adApplyForm" class="ad-form">' +
        '<div class="ad-field"><label for="adApplyCompany">投放主体名称</label>' +
        '<input id="adApplyCompany" name="companyName" required maxlength="120" placeholder="公司、品牌或您在本平台的常用名称"></div>' +
        '<div class="ad-field"><label for="adApplyEmail">联系邮箱</label>' +
        '<input id="adApplyEmail" name="contact" type="email" required placeholder="用于资质与投放通知"></div>' +
        '<div class="ad-field ad-field-check">' +
        '<label class="ad-agree-label">' +
        '<input type="checkbox" name="agreeTerms" value="1" required>' +
        '<span>我已阅读并同意 <button type="button" class="ad-link-btn" id="adTermsOpen">《广告主服务协议》</button></span>' +
        '</label></div>' +
        '<div class="ad-form-actions"><button type="submit" class="btn btn-primary" id="adApplySubmit">提交申请</button></div>' +
        '</form>' +
        '<div class="ad-terms-sheet" id="adTermsSheet" hidden role="dialog" aria-modal="true" aria-labelledby="adTermsSheetTitle">' +
        '<div class="ad-terms-sheet-mask" id="adTermsSheetClose"></div>' +
        '<div class="ad-terms-sheet-panel">' +
        '<div class="ad-terms-sheet-head"><h4 id="adTermsSheetTitle">广告主服务协议</h4>' +
        '<button type="button" class="ad-terms-sheet-x" id="adTermsSheetX" aria-label="关闭">&times;</button></div>' +
        '<div class="ad-terms-sheet-body" id="adTermsSheetBody"></div>' +
        '<div class="ad-terms-sheet-foot"><button type="button" class="btn btn-primary" id="adTermsSheetOk">我已知晓</button></div>' +
        '</div></div>' +
        '<div class="ad-block-sheet" id="adApplyBlockSheet" hidden role="alertdialog" aria-modal="true">' +
        '<div class="ad-terms-sheet-mask" id="adApplyBlockClose"></div>' +
        '<div class="ad-terms-sheet-panel ad-block-sheet-panel">' +
        '<div class="ad-terms-sheet-head"><h4>暂无法提交申请</h4></div>' +
        '<div class="ad-terms-sheet-body" id="adApplyBlockBody"></div>' +
        '<div class="ad-terms-sheet-foot ad-block-sheet-foot">' +
        '<button type="button" class="btn btn-secondary" id="adApplyBlockLater">稍后再说</button>' +
        '<button type="button" class="btn btn-primary" id="adApplyBlockGo">去完成</button>' +
        '</div></div></div>';
})(typeof window !== 'undefined' ? window : this);
