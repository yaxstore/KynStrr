import crypto from 'crypto';
import { encryptApiPayload, generateSignature, generateUltraSecurePassword } from './crypto.js';
import { buildProto } from './proto.js';

const REGION_LANG = {
  BD: 'bn', IND: 'hi', PK: 'ur', SG: 'en', ID: 'id',
  ME: 'ar', CIS: 'ru', TH: 'th', EU: 'en', US: 'en',
  SAC: 'es', LK: 'en', VN: 'vi', TW: 'zh',
};

function log(step, data) {
  const time = new Date().toISOString();
  const msg = typeof data === 'string' ? data : JSON.stringify(data);
  console.log(`[${time}] [${step}] ${msg}`);
}

async function fetchWithTimeout(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export async function performMajorLogin(accessToken, openId, lang) {
  log('MAJOR_LOGIN', `start | lang=${lang}`);
  try {
    const parts = [
      Buffer.from('1a1320323032352d30382d33302030353a31393a3231220966726565206669726528013a08312e3131342e31334232416e64726f6964204f532039202f204150492d3238202850492f72656c2e636a772e32303232303531382e313134313333294a0848616e6468656c64520a41544d204d6f62696c735a045749464960b60a68ee0572033330307a1f41524d7637205646507633204e454f4e20564d48207c2032343030207c20328001c90f8a010f416472656e6f2028544d292036343092010d4f70656e474c20455320332e329a012b476f6f676c657c64666134616234622d396463342d343534652d383036352d653730633733336661353366a2010e3130352e3233352e3133392e3931aa0102', 'hex'),
      Buffer.from(lang, 'ascii'),
      Buffer.from('b2012031643865633032343065646531303939373366333332316239333534623434d0f00101ca020a41544d204d6f62696c73d2020457494649ca03203734323862323533646566633136343031386336303461316562626665626466e003a88102e803f6e501f003af13f80384078004e7f0018804a881029004e7f0019804a88102c80401d2043d2f646174612f6170702f636f6d2e6474732e667265656669726574682d506465446e4f696c4353466e3337703141485f464c673d3d2f6c69622f61726de00401ea045f32303837663631633139663537663261663465376665666630623234643964397c2f646174612f6170702f636f6d2e6474732e667265656669726574682d506465446e4f696c4353466e3337703141485f464c673d3d2f626173652e61706bf00403f804018a050232329a050a32303139313138363933b205094f70656e474c455332b805ff7fc00504e005f346ea0507616e64726f6964f205704b71734854355a4c5772596c6a4e62355671682f2f7946526c615048534f394e5753517356764f6d646845456e37572b56484e554b2b512b666475413370744e724742304c6c304c527a335757306a4f7765734c6a3661695537735a34307038426655452f46492f6a7a535477526532f805fbe4068806019006019a060134a2060134b2062247514f000e5e00440655410e504d0d13685a0754060c6d5c560e6a59563b0b5535', 'hex')
    ];

    let raw = Buffer.concat(parts).toString('hex');
    raw = raw.replace(
      '61666366626631333333346265343230333665346637343263383062393536333434626564373630616339316233616666396236303761363130616234333930',
      Buffer.from(accessToken).toString('hex')
    );
    raw = raw.replace(
      '3164386563303234306564653130393937336633333231623933353462343464',
      Buffer.from(openId).toString('hex')
    );
    const payloadBuf = Buffer.from(raw, 'hex');

    const encrypted = encryptApiPayload(payloadBuf.toString('hex'));

    const resp = await fetchWithTimeout('https://loginbp.ppmainecoonghj.com/MajorLogin', {
      method: 'POST',
      headers: {
        'User-Agent': 'UnityPlayer/2018.4.12f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)',
        'Accept-Encoding': 'deflate, gzip',
        'X-GA-SV': '1789535859',
        'Authorization': 'Bearer',
        'X-GA': 'v1 1',
        'ReleaseVersion': 'OB55',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Unity-Version': '2018.4.12f1',
      },
      body: encrypted,
    }, 15000);

    log('MAJOR_LOGIN', `HTTP=${resp.status}`);
    const text = await resp.text();
    log('MAJOR_LOGIN', `resp: ${text.slice(0, 300)}`);

    if (resp.status !== 200) return null;

    const jwtIdx = text.indexOf('eyJ');
    if (jwtIdx === -1) return null;

    let token = text.slice(jwtIdx);
    const firstDot = token.indexOf('.');
    const secondDot = token.indexOf('.', firstDot + 1);
    if (secondDot === -1) return null;
    token = token.slice(0, secondDot + 44);

    const payloadB64 = token.split('.')[1];
    const padding = '='.repeat((4 - (payloadB64.length % 4)) % 4);
    const decoded = JSON.parse(
      Buffer.from(payloadB64 + padding, 'base64').toString('utf-8')
    );

    const accountId = decoded.account_id || decoded.external_id;
    if (!accountId) return null;

    log('MAJOR_LOGIN', `SUCCESS | account_id=${accountId}`);
    return { account_id: String(accountId), jwt_token: token, decoded };
  } catch (e) {
    log('MAJOR_LOGIN', `EXCEPTION: ${e.message}`);
    return null;
  }
}

export async function generateGarenaAccount(region, prefix = 'Yax') {
  log('GEN_START', `region=${region} prefix=${prefix}`);
  try {
    const password = generateUltraSecurePassword();

    const regPayload = JSON.stringify({
      app_id: 100067,
      client_type: 2,
      password: password,
      source: 2,
    });
    const regSig = generateSignature(regPayload);

    const regResp = await fetchWithTimeout('https://100067.connect.garena.com/api/v2/oauth/guest:register', {
      method: 'POST',
      headers: {
        'User-Agent': 'GarenaMSDK/4.0.44(25028RN03A ;Android 15;ar;EG;app 1.132.1 2019121229;)',
        'Connection': 'Keep-Alive',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Authorization': `Signature ${regSig}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Cookie': 'datadome=oYpIhVco_RFvLHe_T9KFd5wuY0gcQuNfrlt4rHJY5QOkwv4TGt8gPMK32MbHuBdzJyfXnXlfzNZT_2tHr2kys8AMYT2~T71QP1S78_7Pdx4JLOXdSrflPT6cOX2vsyJh',
        'Host': '100067.connect.garena.com',
      },
      body: regPayload,
    }, 15000);

    log('STEP_1', `HTTP=${regResp.status}`);
    const regText = await regResp.text();

    if (regResp.status !== 200) return null;

    let regJson;
    try {
      regJson = JSON.parse(regText);
    } catch (e) {
      return null;
    }

    if (regJson.code !== 0) return null;

    const uid = regJson.data.uid;
    log('STEP_1', `uid=${uid}`);

    const tokPayload = JSON.stringify({
      client_id: 100067,
      client_secret: '2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3',
      client_type: 2,
      device_id: '02-344afb0e-593c-40b7-92f2-171972f74807',
      password: password,
      response_type: 'token',
      uid: uid,
    });

    const tokResp = await fetchWithTimeout('https://100067.connect.garena.com/api/v2/oauth/guest/token:grant', {
      method: 'POST',
      headers: {
        'User-Agent': 'GarenaMSDK/4.0.44(25028RN03A ;Android 15;ar;EG;app 1.132.1 2019121229;)',
        'Connection': 'Keep-Alive',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Authorization': `Signature ${generateSignature(tokPayload)}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Cookie': 'datadome=y23Z3X17pgkMHEt5zY8dqxC6BIf7WJMgC0RXNbqifHT7t9zajKe_hegFb1Ie9_7JixXpz7FRGVodOn~mWPk_NrqIIhUOXDYqKOahzoRQcyEy77GWEMcdA9_MqPJeM5qv',
        'Host': '100067.connect.garena.com',
      },
      body: tokPayload,
    }, 15000);

    log('STEP_2', `HTTP=${tokResp.status}`);
    const tokText = await tokResp.text();

    if (tokResp.status !== 200) return null;

    let tokJson;
    try {
      tokJson = JSON.parse(tokText);
    } catch (e) {
      return null;
    }

    if (tokJson.code !== 0) return null;

    const accessToken = tokJson.data.access_token;
    const openId = tokJson.data.open_id;

    const keystream = [
      0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30,
    ];
    const fieldBuf = Buffer.alloc(openId.length);
    for (let i = 0; i < openId.length; i++) {
      fieldBuf[i] = openId.charCodeAt(i) ^ keystream[i % keystream.length];
    }

    const name = `${prefix}${Math.floor(Math.random() * 90000) + 10000}`;
    const lang = REGION_LANG[region.toUpperCase()] || 'en';

    const proto = buildProto({
      1: name,
      2: accessToken,
      3: openId,
      5: 102000007,
      6: 4,
      7: 1,
      13: 1,
      14: fieldBuf,
      15: lang,
      16: 1,
      17: 1,
    });

    const encMajor = encryptApiPayload(proto.toString('hex'));

    const majResp = await fetchWithTimeout('https://loginbp.ppmainecoonghj.com/MajorRegister', {
      method: 'POST',
      headers: {
        'User-Agent': 'UnityPlayer/2018.4.12f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)',
        'Accept-Encoding': 'deflate, gzip',
        'X-GA-SV': '1789535859',
        'Authorization': 'Bearer',
        'X-GA': 'v1 1',
        'ReleaseVersion': 'OB55',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Unity-Version': '2018.4.12f1',
        'Host': 'loginbp.ppmainecoonghj.com',
      },
      body: encMajor,
    }, 15000);

    log('STEP_4', `HTTP=${majResp.status}`);

    const loginData = await performMajorLogin(accessToken, openId, lang);
    if (!loginData) return null;

    return {
      uid: String(uid),
      password: password,
      name: name,
      account_id: loginData.account_id,
      jwt_token: loginData.jwt_token,
      region: region.toUpperCase(),
      created_at: new Date().toISOString(),
    };
  } catch (e) {
    log('GEN_EXCEPTION', `${e.message}`);
    return null;
  }
}
