export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const debugLog = [];
    try {
        debugLog.push('step 1: start');
        const crypto = await import('node:crypto');
        debugLog.push('step 2: crypto imported OK');
        const buf = Buffer.from('test', 'utf8');
        debugLog.push('step 3: Buffer OK, length=' + buf.length);
        const AES_KEY = Buffer.from([89, 103, 38, 116, 99, 37, 68, 69, 117, 104, 54, 37, 90, 99, 94, 56]);
        const AES_IV  = Buffer.from([54, 111, 121, 90, 68, 114, 50, 50, 69, 51, 121, 99, 104, 106, 77, 37]);
        const cipher = crypto.createCipheriv('aes-128-cbc', AES_KEY, AES_IV);
        debugLog.push('step 4: cipher created OK');
        debugLog.push('step 5: testing fetch...');
        const testResp = await fetch('https://100067.connect.garena.com/api/v2/oauth/guest:register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Test' },
            body: '{"test":1}'
        });
        debugLog.push('step 6: fetch OK, status=' + testResp.status);
        const text = await testResp.text();
        debugLog.push('step 7: response body=' + text.slice(0, 200));
        return res.status(200).json({ ok: true, node: process.version, debug_log: debugLog });
    } catch (e) {
        debugLog.push('ERROR: ' + e.message);
        debugLog.push('STACK: ' + (e.stack || '').slice(0, 500));
        return res.status(200).json({ ok: false, node: process.version, debug_log: debugLog });
    }
}
