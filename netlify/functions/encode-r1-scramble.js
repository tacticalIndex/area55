import crypto from "crypto";

// Config
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:',.<>?/";
const BASE = ALPHABET.length;
const HEADER_SIZE = 2;
const OFFSET = 987654321n;

// Utility functions
function intToBase(n) {
  if (n === 0n) return ALPHABET[0];
  let s = "";
  while (n > 0n) {
    const r = n % BigInt(BASE);
    s = ALPHABET[Number(r)] + s;
    n = n / BigInt(BASE);
  }
  return s;
}

function intToBaseFixed(n, width) {
  const s = intToBase(n);
  if (s.length > width) throw new Error("Number too large to fit fixed width");
  return ALPHABET[0].repeat(width - s.length) + s;
}

function baseToInt(s) {
  let n = 0n;
  for (const ch of s) {
    n = n * BigInt(BASE) + BigInt(ALPHABET.indexOf(ch));
  }
  return n;
}

function deterministicPadding(seed, length) {
  let out = "";
  let counter = 0;
  while (out.length < length) {
    const hash = crypto.createHash("sha256").update(`${seed}|${counter}`).digest();
    for (const b of hash) {
      if (out.length >= length) break;
      out += ALPHABET[b % BASE];
    }
    counter++;
  }
  return out;
}

function encodeSymbolicFullVarying(num, key = 13579n, totalLength = 24, headerSize = HEADER_SIZE, offset = OFFSET) {
  num = BigInt(num);
  key = BigInt(key);
  offset = BigInt(offset);

  const expanded = num * key + offset;
  const dataStr = intToBase(expanded);
  const dataLen = dataStr.length;

  const header = intToBaseFixed(BigInt(dataLen), headerSize);
  const minTotal = headerSize + dataLen;
  if (totalLength < minTotal) throw new Error(`totalLength too small; must be >= ${minTotal}`);

  const padLen = totalLength - minTotal;
  let padding = "";
  if (padLen > 0) {
    const seed = `${key}:${num}:${offset}`;
    padding = deterministicPadding(seed, padLen);
  }

  return header + dataStr + padding;
}

// Netlify Function handler
export const handler = async (event) => {
  try {
    const { number, key = 13579, length = 7 } = JSON.parse(event.body || "{}");
    const encoded = encodeSymbolicFullVarying(number, BigInt(key), length);
    return {
      statusCode: 200,
      body: JSON.stringify({ encoded }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message }),
    };
  }
};