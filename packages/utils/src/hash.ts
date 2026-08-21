const encoder = new TextEncoder();

// bufferLength must be a multiple of 4 to satisfy Int32Array constraints
let bufferLength = 2 * 1024;
let buffer = new ArrayBuffer(bufferLength);
let uint8View = new Uint8Array(buffer);
let int32View = new Int32Array(buffer);

export const hash = xxh;

/**
 * Returns an xxh hash of `input` formatted as a decimal string.
 */
// prettier-ignore
function xxh(input: string) {
  /* eslint-disable no-bitwise */

  // Worst-case scenario: full string of 2-byte characters
  const requiredLength = input.length * 2;
  if (requiredLength > bufferLength) {
    // buffer.resize() is only available in recent browsers, so we re-allocate
    // a new and views
    bufferLength = requiredLength + (4 - requiredLength % 4)
    buffer = new ArrayBuffer(bufferLength)

    uint8View = new Uint8Array(buffer)
    int32View = new Int32Array(buffer)
  }

  const length8 = encoder.encodeInto(input, uint8View).written;

  const seed = 0;
  const len = length8 | 0;
  let i = 0;
  let h = (seed + len | 0) + 0x165667B1 | 0;

  if (len < 16) {
    for (; (i + 3 | 0) < len; i = i + 4 | 0) {
      h = Math.imul(
        rotl32(h + Math.imul(int32View[i] | 0, 0xC2B2AE3D) | 0, 17) | 0,
        0x27D4EB2F
      );
    }
  } else {
    let v0 = seed + 0x24234428 | 0;
    let v1 = seed + 0x85EBCA77 | 0;
    let v2 = seed;
    let v3 = seed - 0x9E3779B1 | 0;

    for (; (i + 15 | 0) < len; i = i + 16 | 0) {
      v0 = Math.imul(rotl32(v0 + Math.imul(int32View[i + 0 | 0]  | 0, 0x85EBCA77) | 0, 13) | 0, 0x9E3779B1);
      v1 = Math.imul(rotl32(v1 + Math.imul(int32View[i + 4 | 0]  | 0, 0x85EBCA77) | 0, 13) | 0, 0x9E3779B1);
      v2 = Math.imul(rotl32(v2 + Math.imul(int32View[i + 8 | 0]  | 0, 0x85EBCA77) | 0, 13) | 0, 0x9E3779B1);
      v3 = Math.imul(rotl32(v3 + Math.imul(int32View[i + 12 | 0] | 0, 0x85EBCA77) | 0, 13) | 0, 0x9E3779B1);
    }

    h = (((
        rotl32(v0,  1) | 0 +
        rotl32(v1,  7) | 0) +
        rotl32(v2, 12) | 0) +
        rotl32(v3, 18) | 0)
    + len | 0;

    for (; (i + 3 | 0) < len; i = i + 4 | 0) {
      h = Math.imul(rotl32(h + Math.imul(int32View[i] | 0, 0xC2B2AE3D) | 0, 17) | 0, 0x27D4EB2F);
    }
  }

  for (; i < len; i = i + 1 | 0) {
    h = Math.imul(rotl32(h + Math.imul(uint8View[i] | 0, 0x165667B1) | 0, 11) | 0, 0x9E3779B1);
  }
  h = Math.imul(h ^ h >>> 15, 0x85EBCA77);
  h = Math.imul(h ^ h >>> 13, 0xC2B2AE3D);

  return ((h ^ h >>> 16) >>> 0).toString();
}

function rotl32(x: number, r: number) {
  return (x << r) | (x >>> (32 - r));
}
