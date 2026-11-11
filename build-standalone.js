const fs = require('fs');
const path = require('path');

const dir = __dirname;
const read = (file) => fs.readFileSync(path.join(dir, file), 'utf8');

let html = read('index.html');
const css = read('doorpass.css');
const qr = read('qrcode.min.js');
const js = read('doorpass.js');

html = html.replace('<link rel="stylesheet" href="doorpass.css">', () => '<style>\n' + css + '\n</style>');
html = html.replace('<script src="qrcode.min.js"></script>', () => '<script>\n' + qr + '\n</script>');
html = html.replace('<script src="doorpass.js"></script>', () => '<script>\n' + js + '\n</script>');

const out = path.join(dir, 'DoorPass-standalone.html');
fs.writeFileSync(out, html);
console.log('Wrote ' + out + ' (' + Math.round(fs.statSync(out).size / 1024) + ' KB)');
