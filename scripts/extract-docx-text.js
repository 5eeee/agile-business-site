/**
 * One-off: extract plain text from .docx (ZIP + word/document.xml)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

function extractDocx(docxPath) {
    if (!fs.existsSync(docxPath)) return { ok: false, error: 'not found: ' + docxPath };
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'docx-'));
    const zipPath = path.join(tmp, 'x.zip');
    fs.copyFileSync(docxPath, zipPath);
    try {
        execSync(`tar -xf "${zipPath.replace(/"/g, '\\"')}"`, { cwd: tmp, stdio: 'pipe' });
    } catch (e) {
        try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
        return { ok: false, error: String(e.message) };
    }
    const docXml = path.join(tmp, 'word', 'document.xml');
    if (!fs.existsSync(docXml)) {
        try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
        return { ok: false, error: 'no document.xml' };
    }
    let xml = fs.readFileSync(docXml, 'utf8');
    const texts = [];
    const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m;
    while ((m = re.exec(xml))) texts.push(m[1]);
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
    return { ok: true, text: texts.join(' ').replace(/\s+/g, ' ').trim() };
}

const files = process.argv.slice(2);
if (!files.length) {
    console.error('Usage: node extract-docx-text.js <file.docx> ...');
    process.exit(1);
}
for (const f of files) {
    console.log('\n=== ' + f + ' ===\n');
    const r = extractDocx(f);
    if (r.ok) console.log(r.text);
    else console.log('ERROR:', r.error);
}
