from http.server import BaseHTTPRequestHandler
import json
import hmac
import hashlib
import requests
import random
import string
import secrets
import codecs
import base64
import time
from datetime import datetime
from urllib.parse import urlparse, parse_qs
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

# === KEYS ===
API_HEX_KEY = "2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3"
API_SECRET_KEY = "2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3"
AES_KEY = bytes([89, 103, 38, 116, 99, 37, 68, 69, 117, 104, 54, 37, 90, 99, 94, 56])
AES_IV = bytes([54, 111, 121, 90, 68, 114, 50, 50, 69, 51, 121, 99, 104, 106, 77, 37])

REGION_LANG = {
    "BD": "bn", "IND": "hi", "PK": "ur", "SG": "en", "ID": "id",
    "ME": "ar", "CIS": "ru", "TH": "th", "EU": "en", "US": "en",
    "SAC": "es", "LK": "en"
}

def generate_password():
    hex_part = ''.join(secrets.choice('0123456789ABCDEF') for _ in range(16))
    return f"Kyn_{hex_part}"

def generate_signature(payload: str) -> str:
    return hmac.new(API_SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()

def encrypt_api_payload(plain_hex: str) -> str:
    cipher = AES.new(AES_KEY, AES.MODE_CBC, AES_IV)
    padded_data = pad(bytes.fromhex(plain_hex), AES.block_size)
    return cipher.encrypt(padded_data).hex()

def encode_varint(n: int) -> bytes:
    if n < 0: return b''
    result = bytearray()
    while True:
        byte = n & 0x7F
        n >>= 7
        if n: byte |= 0x80
        result.append(byte)
        if not n: break
    return bytes(result)

def create_field(field_num: int, value) -> bytes:
    if isinstance(value, int):
        return encode_varint((field_num << 3) | 0) + encode_varint(value)
    elif isinstance(value, (str, bytes)):
        encoded_val = value.encode() if isinstance(value, str) else value
        return encode_varint((field_num << 3) | 2) + encode_varint(len(encoded_val)) + encoded_val
    return b''

def build_proto(fields_dict: dict) -> bytes:
    return b''.join(create_field(k, v) for k, v in fields_dict.items())

def register_guest(session):
    for attempt in range(5):
        password = generate_password()
        reg_payload = json.dumps({"app_id": 100067, "client_type": 2, "password": password, "source": 2}, separators=(',', ':'))
        headers = {
            "User-Agent": "GarenaMSDK/4.0.44(25028RN03A ;Android 15;ar;EG;app 1.132.1 2019121229;)",
            "Connection": "Keep-Alive",
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "Authorization": f"Signature {generate_signature(reg_payload)}",
            "Content-Type": "application/json; charset=utf-8",
            "Host": "100067.connect.garena.com",
        }
        try:
            resp = session.post(
                "https://100067.connect.garena.com/api/v2/oauth/guest:register",
                headers=headers,
                data=reg_payload,
                timeout=12,
                verify=False
            )
            data = resp.json()
            if resp.status_code == 200 and data.get("code") == 0:
                return data['data']['uid'], password
            if data.get("code") == 1006:
                time.sleep(1.8 + attempt * 0.7)
                continue
        except Exception:
            time.sleep(1.2)
    return None, None

def get_token(session, uid, password):
    for attempt in range(3):
        tok_payload = json.dumps({
            "client_id": 100067,
            "client_secret": API_HEX_KEY,
            "client_type": 2,
            "device_id": "02-344afb0e-593c-40b7-92f2-171972f74807",
            "password": password,
            "response_type": "token",
            "uid": uid,
        }, separators=(',', ':'))
        headers = {
            "User-Agent": "GarenaMSDK/4.0.44(25028RN03A ;Android 15;ar;EG;app 1.132.1 2019121229;)",
            "Connection": "Keep-Alive",
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "Authorization": f"Signature {generate_signature(tok_payload)}",
            "Content-Type": "application/json; charset=utf-8",
            "Host": "100067.connect.garena.com",
        }
        try:
            resp = session.post(
                "https://100067.connect.garena.com/api/v2/oauth/guest/token:grant",
                headers=headers,
                data=tok_payload,
                timeout=12,
                verify=False
            )
            data = resp.json()
            if resp.status_code == 200 and data.get("code") == 0:
                return data['data']['access_token'], data['data']['open_id']
            if data.get("code") == 1006:
                time.sleep(1.5)
                continue
        except Exception:
            time.sleep(1)
    return None, None

def major_register(session, name, access_token, open_id, lang):
    keystream = [0x30,0x30,0x30,0x32,0x30,0x31,0x37,0x30,0x30,0x30,0x30,0x30,0x32,0x30,0x31,0x37,0x30,0x30,0x30,0x30,0x30,0x32,0x30,0x31,0x37,0x30,0x30,0x30,0x30,0x30,0x32,0x30]
    field = codecs.decode(''.join(chr(ord(open_id[i]) ^ keystream[i % len(keystream)]) for i in range(len(open_id))).encode('unicode_escape').decode('utf-8'), 'unicode_escape').encode('latin1')
    
    proto = build_proto({1: name, 2: access_token, 3: open_id, 5: 102000007, 6: 4, 7: 1, 13: 1, 14: field, 15: lang, 16: 1, 17: 1})
    enc = bytes.fromhex(encrypt_api_payload(proto.hex()))
    
    headers = {
        "User-Agent": "UnityPlayer/2018.4.12f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)",
        "Accept-Encoding": "deflate, gzip",
        "X-GA-SV": "1789535859",
        "Authorization": "Bearer",
        "X-GA": "v1 1",
        "ReleaseVersion": "OB55",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Unity-Version": "2018.4.12f1",
        "Host": "loginbp.ppmainecoonghj.com"
    }
    try:
        session.post("https://loginbp.ppmainecoonghj.com/MajorRegister", headers=headers, data=enc, verify=False, timeout=10)
    except:
        pass

def major_login(session, access_token, open_id, lang):
    payload_parts = [
        b'\x1a\x132025-08-30 05:19:21"\tfree fire(\x01:\x081.114.13B2Android OS 9 / API-28 (PI/rel.cjw.20220518.114133)J\x08HandheldR\nATM MobilsZ\x04WIFI`\xb6\nh\xee\x05r\x03300z\x1fARMv7 VFPv3 NEON VMH | 2400 | 2\x80\x01\xc9\x0f\x8a\x01\x0fAdreno (TM) 640\x92\x01\rOpenGL ES 3.2\x9a\x01+Google|dfa4ab4b-9dc4-454e-8065-e70c733fa53f\xa2\x01\x0e105.235.139.91\xaa\x01\x02',
        lang.encode("ascii"),
        b'\xb2\x01 1d8ec0240ede109973f3321b9354b44d\xba\x01\x014\xc2\x01\x08Handheld\xca\x01\x10Asus ASUS_I005DA\xea\x01@afcfbf13334be42036e4f742c80b956344bed760ac91b3aff9b607a610ab4390\xf0\x01\x01\xca\x02\nATM Mobils\xd2\x02\x04WIFI\xca\x03 7428b253defc164018c604a1ebbfebdf\xe0\x03\xa8\x81\x02\xe8\x03\xf6\xe5\x01\xf0\x03\xaf\x13\xf8\x03\x84\x07\x80\x04\xe7\xf0\x01\x88\x04\xa8\x81\x02\x90\x04\xe7\xf0\x01\x98\x04\xa8\x81\x02\xc8\x04\x01\xd2\x04=/data/app/com.dts.freefireth-PdeDnOilCSFn37p1AH_FLg==/lib/arm\xe0\x04\x01\xea\x04_2087f61c19f57f2af4e7feff0b24d9d9|/data/app/com.dts.freefireth-PdeDnOilCSFn37p1AH_FLg==/base.apk\xf0\x04\x03\xf8\x04\x01\x8a\x05\x0232\x9a\x05\n2019118693\xb2\x05\tOpenGLES2\xb8\x05\xff\x7f\xc0\x05\x04\xe0\x05\xf3F\xea\x05\x07android\xf2\x05pKqsHT5ZLWrYljNb5Vqh//yFRlaPHSO9NWSQsVvOmdhEEn7W+VHNUK+Q+fduA3ptNrGB0Ll0LRz3WW0jOwesLj6aiU7sZ40p8BfUE/FI/jzSTwRe2\xf8\x05\xfb\xe4\x06\x88\x06\x01\x90\x06\x01\x9a\x06\x014\xa2\x06\x014\xb2\x06"GQ@O\x00\x0e^\x00D\x06UA\x0ePM\r\x13hZ\x07T\x06\x0cm\\V\x0ejYV;\x0bU5'
    ]
    raw = b''.join(payload_parts)
    raw = raw.replace(b'afcfbf13334be42036e4f742c80b956344bed760ac91b3aff9b607a610ab4390', access_token.encode())
    raw = raw.replace(b'1d8ec0240ede109973f3321b9354b44d', open_id.encode())
    
    encrypted = bytes.fromhex(encrypt_api_payload(raw.hex()))
    
    headers = {
        'User-Agent': "UnityPlayer/2018.4.12f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)",
        'Accept-Encoding': "deflate, gzip",
        'X-GA-SV': "1789535859",
        'Authorization': "Bearer",
        'X-GA': "v1 1",
        'ReleaseVersion': "OB55",
        'Content-Type': "application/x-www-form-urlencoded",
        'X-Unity-Version': "2018.4.12f1"
    }
    try:
        resp = session.post("https://loginbp.ppmainecoonghj.com/MajorLogin", headers=headers, data=encrypted, verify=False, timeout=12)
        if resp.status_code == 200:
            jwt_idx = resp.text.find("eyJ")
            if jwt_idx != -1:
                token = resp.text[jwt_idx:]
                dot_idx = token.find(".", token.find(".") + 1)
                if dot_idx != -1:
                    token = token[:dot_idx + 44]
                    payload_b64 = token.split('.')[1]
                    padding = '=' * (4 - len(payload_b64) % 4)
                    decoded = json.loads(base64.urlsafe_b64decode(payload_b64 + padding))
                    acc_id = decoded.get('account_id') or decoded.get('external_id')
                    if acc_id:
                        return {"account_id": str(acc_id), "jwt_token": token}
    except:
        pass
    return None

def create_account(region="ID", prefix="User"):
    session = requests.Session()
    session.headers.update({'Connection': 'keep-alive'})
    
    uid, password = register_guest(session)
    if not uid:
        return None
    
    access_token, open_id = get_token(session, uid, password)
    if not access_token:
        return None
    
    name = f"{prefix}{''.join(random.choices(string.ascii_uppercase, k=6))}"
    lang = REGION_LANG.get(region.upper(), "en")
    
    major_register(session, name, access_token, open_id, lang)
    login_data = major_login(session, access_token, open_id, lang)
    
    if login_data:
        return {
            "account_id": login_data["account_id"],
            "created_at": datetime.utcnow().isoformat(),
            "jwt_token": login_data["jwt_token"],
            "name": name,
            "password": password,
            "patterns": [],
            "rarity": "NORMAL",
            "rarity_reason": "",
            "rarity_score": 0,
            "region": region,
            "uid": int(uid)
        }
    return None

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            query = parse_qs(urlparse(self.path).query)
            region = query.get("region", ["ID"])[0].upper()
            count = min(int(query.get("count", ["1"])[0]), 5)
            prefix = query.get("prefix", ["User"])[0]
            
            accounts = []
            attempts = 0
            
            for i in range(count):
                attempts += 1
                acc = create_account(region, prefix)
                if acc:
                    accounts.append(acc)
                if i < count - 1:
                    time.sleep(1.2)
            
            response = {
                "accounts": accounts,
                "attempts_made": attempts,
                "success": len(accounts) > 0,
                "total_created": len(accounts),
                "total_requested": count
            }
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(response, indent=2).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "accounts": [],
                "attempts_made": 0,
                "success": False,
                "total_created": 0,
                "total_requested": 0,
                "error": str(e)
            }).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
