// Config (same as encoder)
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:',.<>?/";
const BASE = ALPHABET.length;
const HEADER_SIZE = 2;
const OFFSET = 987654321n;

// Helper: convert base string to BigInt
function baseToInt(s) {
  let n = 0n;
  for (const ch of s) {
    n = n * BigInt(BASE) + BigInt(ALPHABET.indexOf(ch));
  }
  return n;
}

// Decoder function
function decodeSymbolicFullVarying(encoded, key = 13579n, headerSize = HEADER_SIZE, offset = OFFSET) {
  key = BigInt(key);
  offset = BigInt(offset);

  if (encoded.length < headerSize) throw new Error("Encoded string too short to contain header");

  // Step 1: read header to get data length
  const header = encoded.slice(0, headerSize);
  const dataLen = Number(baseToInt(header));

  if (headerSize + dataLen > encoded.length) throw new Error("Encoded string does not contain full data block");

  // Step 2: extract the actual data portion
  const dataStr = encoded.slice(headerSize, headerSize + dataLen);
  const expanded = baseToInt(dataStr);

  // Step 3: reverse math obfuscation
  const diff = expanded - offset;
  if (diff % key !== 0n) throw new Error("Decoding failed — wrong key or parameters");

  const original = diff / key;
  return original.toString(); // return as string for JSON
}

// Netlify function handler
export const handler = async (event) => {
  try {
    const { encoded, key = 13579 } = JSON.parse(event.body || "{}");
    const decoded = decodeSymbolicFullVarying(encoded, BigInt(key));
    return {
      statusCode: 200,
      body: JSON.stringify({ decoded }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message }),
    };
  }
};