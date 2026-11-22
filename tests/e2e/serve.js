/**
 * Serves the exported site (dist/) the way nginx does on the server: files as they are, any other
 * path falls back to index.html. The large media folders the deploy never uploads (prayer times,
 * recitations) are fetched from the live site so those screens work in tests.
 * Usage: node tests/e2e/serve.js [port]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../dist');
const PORT = Number(process.argv[2] || 4173);
const REMOTE = 'https://kuran360.com';
const REMOTE_DIRS = ['/2025_ezan/', '/sudais_all_verse/', '/abdulsamad_all_verse/'];

const TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
    '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
    '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.onnx': 'application/octet-stream',
};

const sendFile = (res, file) => {
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
};

http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (REMOTE_DIRS.some(dir => pathname.startsWith(dir))) {
        try {
            const remote = await fetch(REMOTE + pathname);
            res.writeHead(remote.status, { 'Content-Type': remote.headers.get('content-type') || 'application/octet-stream' });
            res.end(Buffer.from(await remote.arrayBuffer()));
        } catch {
            res.writeHead(502).end();
        }
        return;
    }
    const file = path.join(ROOT, pathname);
    if (file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isFile()) return sendFile(res, file);
    sendFile(res, path.join(ROOT, 'index.html'));
}).listen(PORT, () => console.log(`Serving dist/ on http://localhost:${PORT}`));
