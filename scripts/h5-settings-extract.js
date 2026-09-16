/**
 * One-off helper: extract main column from pages-web settings HTML into H5 shell.
 * Usage: node scripts/h5-settings-extract.js <webFile> <startSubstring> <endSubstring>
 */
const fs = require('fs');
const path = require('path');

const [webRel, start, end] = process.argv.slice(2);
if (!webRel || !start) {
  console.error('Usage: node h5-settings-extract.js <webFile> <start> [end]');
  process.exit(1);
}
const webPath = path.join(__dirname, '..', webRel);
const html = fs.readFileSync(webPath, 'utf8');
const i0 = html.indexOf(start);
if (i0 < 0) {
  console.error('Start marker not found:', start);
  process.exit(1);
}
let i1 = html.length;
if (end) {
  const j = html.indexOf(end, i0);
  if (j < 0) {
    console.error('End marker not found:', end);
    process.exit(1);
  }
  i1 = j;
}
process.stdout.write(html.slice(i0, i1));
