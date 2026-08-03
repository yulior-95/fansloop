(function () {
    document.getElementById("linkBack").href = window.KycFlowNav.hrefWithRet("kyc-intro.html");
    document.getElementById("linkBack").textContent = "返回";

    var country = "";
    var idType = "id_card";

    if (window.KycCombobox) {
        window.KycCombobox.mount(document.getElementById("countryCombo"), {
            onChange: function (code) {
                country = code;
                document.getElementById("btnToUpload").disabled = !country;
            }
        });
        var idCombo = window.KycCombobox.mount(document.getElementById("idTypeCombo"), {
            placeholder: "请选择证件类型",
            searchable: false,
            items: [
                { code: "id_card", label: "居民身份证" },
                { code: "passport", label: "护照" },
                { code: "driver", label: "驾驶证" },
                { code: "residence", label: "居留许可" }
            ],
            onChange: function (code) {
                idType = code || "id_card";
            }
        });
        if (idCombo) idCombo.setValue("id_card", "居民身份证");
    }

    var f = false;
    var b = false;
    var frontUrl = "";
    var backUrl = "";

    function setBar(n) {
        for (var i = 1; i <= 5; i++) {
            var el = document.getElementById("bar" + i);
            el.classList.remove("on", "done");
            if (i < n) el.classList.add("done");
            if (i === n) el.classList.add("on");
        }
    }

    function showStep(id, barN) {
        document.getElementById("stepCountry").classList.toggle("active", id === "stepCountry");
        document.getElementById("stepUpload").classList.toggle("active", id === "stepUpload");
        setBar(barN);
    }

    document.getElementById("btnToUpload").addEventListener("click", function () {
        showStep("stepUpload", 2);
    });

    function bindTile(tileId, previewId, flagSetter) {
        var tile = document.getElementById(tileId);
        var preview = document.getElementById(previewId);
        var input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.style.display = "none";
        tile.appendChild(input);

        function markDone(url) {
            flagSetter(true, url);
            tile.classList.add("ok");
            preview.classList.add("has-image");
            preview.innerHTML = '<img src="' + url + '" alt="" />';
            syncUpload();
        }

        tile.addEventListener("click", function () {
            input.click();
        });
        input.addEventListener("change", function () {
            var file = input.files && input.files[0];
            if (file && file.type.indexOf("image") === 0) {
                markDone(URL.createObjectURL(file));
            } else {
                markDone("https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=85");
            }
        });
    }

    function syncUpload() {
        document.getElementById("btnToFace").disabled = !(f && b);
    }

    bindTile("tileFront", "previewFront", function (ok, url) {
        f = ok;
        frontUrl = url;
    });
    bindTile("tileBack", "previewBack", function (ok, url) {
        b = ok;
        backUrl = url;
    });

    document.getElementById("btnToFace").addEventListener("click", function () {
        sessionStorage.setItem(
            "goodfans_kyc_draft",
            JSON.stringify({
                country: country,
                idType: idType,
                idCardFront: frontUrl,
                idCardBack: backUrl
            })
        );
        sessionStorage.removeItem("goodfans_kyc_face_token");
        if (window.GoodfansKycStore) {
            window.GoodfansKycStore.clearFaceDone();
            window.GoodfansKycStore.writeKyc({
                authStatus: "unverified",
                status: "none",
                stage: "face",
                rejectReason: null
            });
        }
        window.KycFlowNav.go("kyc-face-verify.html");
    });
})();
