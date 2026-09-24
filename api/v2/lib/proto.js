// ============================================================
// PROTOBUF BUILDER (port dari Python ProtoBuilder)
// ============================================================
export function encodeVarint(n) {
  if (n < 0) return Buffer.alloc(0);
  const bytes = [];
  while (true) {
    let byte = n & 0x7f;
    n >>>= 7;
    if (n) byte |= 0x80;
    bytes.push(byte);
    if (!n) break;
  }
  return Buffer.from(bytes);
}

export function createProtoField(fieldNum, value) {
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    // nested message
    const nested = buildProto(value);
    const header = (fieldNum << 3) | 2;
    return Buffer.concat([encodeVarint(header), encodeVarint(nested.length), nested]);
  } else if (typeof value === 'number') {
    const header = (fieldNum << 3) | 0;
    return Buffer.concat([encodeVarint(header), encodeVarint(value)]);
  } else if (typeof value === 'string' || Buffer.isBuffer(value)) {
    const encoded = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf-8');
    const header = (fieldNum << 3) | 2;
    return Buffer.concat([encodeVarint(header), encodeVarint(encoded.length), encoded]);
  }
  return Buffer.alloc(0);
}

export function buildProto(fields) {
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(createProtoField(parseInt(k), v));
  }
  return Buffer.concat(parts);
}
