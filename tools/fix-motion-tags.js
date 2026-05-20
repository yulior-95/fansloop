const fs = require("fs");
const path = require("path");
const files = [];
const pagesDir = path.join(__dirname, "..", "pages-web");
fs.readdirSync(pagesDir)
    .filter((f) => f.startsWith("kyc") && f.endsWith(".html"))
    .forEach((f) => files.push(path.join(pagesDir, f)));
files.push(path.join(__dirname, "..", "index.html"));
files.forEach((p) => {
        const f = path.basename(p);
        let s = fs.readFileSync(p, "utf8");
        const n = s.replace(/<motion\b/g, "<div").replace(/<\/motion>/g, "<" + "/div>");
        if (n !== s) {
            fs.writeFileSync(p, n, "utf8");
            console.log("fixed", f);
        }
    });
