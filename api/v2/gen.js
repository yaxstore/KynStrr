import crypto from 'node:crypto';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const debugLog = [];

    try {
        const API_SECRET_KEY = "2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3";
        const cryptoMod = await import('node:crypto');

        function generateSignature(payload) {
            return cryptoMod.createHmac('sha256', API_SECRET_KEY).update(payload).digest('hex');
        }

        function generateSecurePassword() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let s = '';
            const bytes = cryptoMod.randomBytes(12);
            for (let i = 0; i < 12; i++) s += chars[bytes[i] % chars.length];
            return `Yax_${s}`;
        }

        const password = generateSecurePassword();
        debugLog.push('password=' + password);

        const regPayload = JSON.stringify({
            app_id: 100067,
            client_type: 2,
            password: password,
            source: 2
        });
        debugLog.push('payload=' + regPayload);

        const sig = generateSignature(regPayload);
        debugLog.push('signature=' + sig.slice(0, 20) + '...');

        const headers = {
            'User-Agent': 'GarenaMSDK/4.0.44(25028RN03A ;Android 15;ar;EG;app 1.132.1 2019121229;)',
            'Connection': 'Keep-Alive',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'Authorization': 'Signature ' + sig,
            'Content-Type': 'application/json; charset=utf-8',
            'Cookie': 'datadome=oYpIhVco_RFvLHe_T9KFd5wuY0gcQuNfrlt4rHJY5QOkwv4TGt8gPMK32MbHuBdzJyfXnXlfzNZT_2tHr2kys8AMYT2~T71QP1S78_7Pdx4JLOXdSrflPT6cOX2vsyJh',
            'Host': '100067.connect.garena.com'
        };

        debugLog.push('calling registerGuest...');
        const resp = await fetch('https://100067.connect.garena.com/api/v2/oauth/guest:register', {
            method: 'POST',
            headers: headers,
            body: regPayload
        });

        debugLog.push('status=' + resp.status);
        const text = await resp.text();
        debugLog.push('body=' + text.slice(0, 500));

        return res.status(200).json({ ok: true, debug_log: debugLog });
    } catch (e) {
        debugLog.push('ERROR: ' + e.message);
        debugLog.push('STACK: ' + (e.stack || '').slice(0, 500));
        return res.status(200).json({ ok: false, debug_log: debugLog });
    }
}
