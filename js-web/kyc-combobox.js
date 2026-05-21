/**
 * KYC · 可搜索下拉框
 */
(function (global) {
    var COUNTRIES = [
        { code: "CN", label: "中国（大陆）" },
        { code: "HK", label: "中国香港" },
        { code: "MO", label: "中国澳门" },
        { code: "TW", label: "中国台湾" },
        { code: "US", label: "美国" },
        { code: "CA", label: "加拿大" },
        { code: "GB", label: "英国" },
        { code: "DE", label: "德国" },
        { code: "FR", label: "法国" },
        { code: "IT", label: "意大利" },
        { code: "ES", label: "西班牙" },
        { code: "NL", label: "荷兰" },
        { code: "CH", label: "瑞士" },
        { code: "SE", label: "瑞典" },
        { code: "NO", label: "挪威" },
        { code: "IE", label: "爱尔兰" },
        { code: "PT", label: "葡萄牙" },
        { code: "PL", label: "波兰" },
        { code: "RU", label: "俄罗斯" },
        { code: "TR", label: "土耳其" },
        { code: "AE", label: "阿联酋" },
        { code: "SA", label: "沙特阿拉伯" },
        { code: "IL", label: "以色列" },
        { code: "IN", label: "印度" },
        { code: "SG", label: "新加坡" },
        { code: "MY", label: "马来西亚" },
        { code: "TH", label: "泰国" },
        { code: "VN", label: "越南" },
        { code: "ID", label: "印度尼西亚" },
        { code: "PH", label: "菲律宾" },
        { code: "JP", label: "日本" },
        { code: "KR", label: "韩国" },
        { code: "AU", label: "澳大利亚" },
        { code: "NZ", label: "新西兰" },
        { code: "BR", label: "巴西" },
        { code: "MX", label: "墨西哥" },
        { code: "AR", label: "阿根廷" },
        { code: "ZA", label: "南非" },
        { code: "NG", label: "尼日利亚" },
        { code: "EG", label: "埃及" }
    ];

    function fuzzyMatch(label, q) {
        if (!q) return true;
        var t = label.toLowerCase();
        var s = q.toLowerCase().trim();
        if (t.indexOf(s) >= 0) return true;
        var py = label.replace(/（[^）]+）/g, "");
        return py.indexOf(q) >= 0;
    }

    function mount(root, options) {
        if (!root) return null;
        options = options || {};
        var items = options.items || COUNTRIES;
        var placeholder = options.placeholder || "请选择";
        var searchable = options.searchable !== false;
        var onChange = options.onChange || function () {};

        var native = root.querySelector("select") || document.createElement("select");
        native.className = "kyc-combobox-native";
        native.innerHTML = '<option value="">' + placeholder + "</option>";
        items.forEach(function (it) {
            var o = document.createElement("option");
            o.value = it.code;
            o.textContent = it.label;
            native.appendChild(o);
        });
        root.innerHTML = "";
        root.classList.add("kyc-combobox");
        root.appendChild(native);

        var trigger = document.createElement("div");
        trigger.className = "kyc-combobox-trigger";
        trigger.setAttribute("tabindex", "0");
        trigger.innerHTML =
            '<span class="kyc-combobox-value placeholder">' +
            placeholder +
            '</span><i class="fa-solid fa-chevron-down"></i>';

        var panel = document.createElement("div");
        panel.className = "kyc-combobox-panel";
        panel.innerHTML = searchable
            ? '<div class="kyc-combobox-search"><input type="text" placeholder="输入关键词筛选…" autocomplete="off"></div><ul class="kyc-combobox-list"></ul>'
            : '<ul class="kyc-combobox-list"></ul>';

        root.appendChild(trigger);
        root.appendChild(panel);

        var valueEl = trigger.querySelector(".kyc-combobox-value");
        var searchInp = panel.querySelector("input");
        var listEl = panel.querySelector("ul");
        if (!searchable && searchInp) searchInp = null;
        var focusedIdx = -1;

        function setValue(code, label) {
            native.value = code || "";
            if (code) {
                valueEl.textContent = label;
                valueEl.classList.remove("placeholder");
            } else {
                valueEl.textContent = placeholder;
                valueEl.classList.add("placeholder");
            }
            onChange(code, label);
        }

        function renderList(filter) {
            listEl.innerHTML = "";
            var matched = items.filter(function (it) {
                return fuzzyMatch(it.label, filter);
            });
            focusedIdx = -1;
            if (!matched.length) {
                var empty = document.createElement("li");
                empty.className = "empty";
                empty.textContent = "无匹配结果";
                listEl.appendChild(empty);
                return;
            }
            matched.forEach(function (it) {
                var li = document.createElement("li");
                li.textContent = it.label;
                li.dataset.code = it.code;
                if (native.value === it.code) li.classList.add("selected");
                li.addEventListener("click", function () {
                    setValue(it.code, it.label);
                    close();
                });
                listEl.appendChild(li);
            });
        }

        function open() {
            root.classList.add("open");
            renderList(searchInp ? searchInp.value : "");
            if (searchInp) {
                setTimeout(function () {
                    searchInp.focus();
                }, 30);
            }
        }
        function close() {
            root.classList.remove("open");
            if (searchInp) searchInp.value = "";
        }

        trigger.addEventListener("click", function () {
            if (root.classList.contains("open")) close();
            else open();
        });
        trigger.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
            }
        });
        if (searchInp) {
            searchInp.addEventListener("input", function () {
                renderList(searchInp.value);
            });
        }
        if (searchInp) searchInp.addEventListener("keydown", function (e) {
            var lis = listEl.querySelectorAll("li:not(.empty)");
            if (e.key === "ArrowDown") {
                e.preventDefault();
                focusedIdx = Math.min(focusedIdx + 1, lis.length - 1);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                focusedIdx = Math.max(focusedIdx - 1, 0);
            } else if (e.key === "Enter" && focusedIdx >= 0 && lis[focusedIdx]) {
                e.preventDefault();
                lis[focusedIdx].click();
                return;
            } else if (e.key === "Escape") {
                close();
                return;
            } else return;
            lis.forEach(function (li, i) {
                li.classList.toggle("focused", i === focusedIdx);
            });
        });

        document.addEventListener("click", function (e) {
            if (!root.contains(e.target)) close();
        });

        renderList("");
        return { setValue: setValue, getValue: function () { return native.value; }, open: open, close: close };
    }

    global.KycCombobox = {
        COUNTRIES: COUNTRIES,
        mount: mount
    };
})(window);
