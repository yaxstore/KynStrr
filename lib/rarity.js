const PATTERNS = {
  R4: [/(\d)\1{3,}/, 5],
  R3: [/(\d)\1\1(\d)\2\2/, 4],
  S5: [/(12345|23456|34567|45678|56789)/, 6],
  S4: [/(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/, 5],
  P6: [/^(\d)(\d)(\d)\3\2\1$/, 7],
  P4: [/^(\d)(\d)\2\1$/, 5],
  SPH: [/(69|420|1337|007)/, 6],
  SPM: [/(100|200|300|400|500|666|777|888|999)/, 4],
  QD: [/(1111|2222|3333|4444|5555|6666|7777|8888|9999|0000)/, 6],
  MH: [/^(\d{2,3})\1$/, 5],
  MM: [/(\d{2})0\1/, 4],
  GD: [/(1618|0618)/, 5],
  PAIR3: [/(\d)\1(\d)\2(\d)\3/, 3],
  PAIRX: [/(\d)\1.*(\d)\2.*(\d)\3/, 2],
  ALT: [/(\d)(\d)\1\2\1\2/, 3],
  ALT8: [/(\d)(\d)\1\2\1\2\1\2/, 4],
  TAIL0: [/0{4,}$/, 3],
  HEAD1: [/^1{2,}/, 2],
  BLOCK: [/(\d{2,3})\1{1,}/, 4],
  STEP2: [/(13579|2468|8642|97531)/, 4],
  MIX: [/(55|66|77|88|99){2,}/, 3],
  ULTRA_R4: [/(\d)\1{5,}/, 10],
  ULTRA_PAL: [/^(\d)(\d)(\d)\2\1$/, 8],
  ULTRA_MIRROR: [/^(\d{3})(\d{3})\1$/, 9],
  ULTRA_SEQ: [/(012345|123456|234567|345678|456789|987654|876543|765432|654321)/, 8],
  ULTRA_QUAD: [/(\d{4})\1/, 8],
  ULTRA_BINARY: [/^[01]+$/, 7],
  ULTRA_REPEAT: [/(\d{2})\1\1/, 7],
};

export function checkRarity(accountId, threshold = 6) {
  if (!accountId || accountId === 'N/A') {
    return { isRare: false, level: null, reason: '', score: 0, patterns: [] };
  }

  let score = 0;
  const patternsFound = [];

  for (const [ptype, [pattern, pts]] of Object.entries(PATTERNS)) {
    try {
      if (pattern.test(accountId)) {
        score += pts;
        patternsFound.push(ptype);
      }
    } catch (e) {}
  }

  const digits = accountId.split('').filter(c => /\d/.test(c)).map(Number);
  const dc = digits.length;

  if (dc > 0 && new Set(digits).size === 1 && dc >= 4) {
    const b = Math.min(dc * 2, 12);
    score += b;
    patternsFound.push(`UNIFORM(+${b})`);
  }

  if (dc >= 4) {
    const diffs = [];
    for (let i = 0; i < digits.length - 1; i++) diffs.push(digits[i + 1] - digits[i]);
    if (new Set(diffs).size === 1) {
      const b = Math.min(Math.abs(diffs[0]) * 2, 10);
      score += b;
      patternsFound.push(`ARITH(+${b})`);
    }
  }

  if (accountId.length <= 8 && /^\d+$/.test(accountId)) {
    const iv = parseInt(accountId, 10);
    if (iv < 1000000) { score += 8; patternsFound.push('LOW_ID(<1M)'); }
    else if (iv < 10000000) { score += 5; patternsFound.push('LOW_ID(<10M)'); }
    else if (iv < 100000000) { score += 3; patternsFound.push('LOW_ID(<100M)'); }
  }

  if (/^\d+$/.test(accountId)) {
    score += 2;
    patternsFound.push('CLEAN_DIGIT');
  }

  if (accountId.length >= 3 && accountId === accountId.split('').reverse().join('')) {
    score += 6;
    patternsFound.push('PALINDROME');
  }

  if (accountId.includes('888') || accountId.includes('999')) {
    score += 5;
    patternsFound.push('TRIPLE_EIGHT_NINE');
  }

  if (accountId.includes('0000')) {
    score += 7;
    patternsFound.push('QUAD_ZUY');
  }

  if (dc >= 2) {
    let rising = true, sinking = true;
    for (let i = 0; i < digits.length - 1; i++) {
      if (digits[i] >= digits[i + 1]) rising = false;
      if (digits[i] <= digits[i + 1]) sinking = false;
    }
    if (rising || sinking) {
      const b = Math.min(digits.length * 2, 10);
      score += b;
      patternsFound.push(`RISE_SINK(+${b})`);
    }
  }

  if (score >= threshold) {
    let level;
    if (score >= 20) level = 'LEGENDARY';
    else if (score >= 16) level = 'MYTHIC';
    else if (score >= 12) level = 'EPIC';
    else level = 'RARE';

    return {
      isRare: true,
      level,
      reason: `ID:${accountId} | Score:${score} | ${patternsFound.slice(0, 10).join(',')}`,
      score,
      patterns: patternsFound,
    };
  }

  return { isRare: false, level: null, reason: '', score, patterns: patternsFound };
}
