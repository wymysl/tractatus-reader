// One-time: generate site/icon-{192,512,180}.png — an open ink ring on
// paper, matching favicon.svg. Uses only node:zlib; no image dependencies.
//   node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
};

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      raw.writeUInt8(r, row + 1 + x * 4);
      raw.writeUInt8(g, row + 2 + x * 4);
      raw.writeUInt8(b, row + 3 + x * 4);
      raw.writeUInt8(255, row + 4 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8);  // bit depth
  ihdr.writeUInt8(6, 9);  // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const PAPER = [0xfa, 0xf8, 0xf4];
const INK = [0x1a, 0x1a, 0x1a];

function ring(size) {
  const c = size / 2, r = size * 0.3, w = size * 0.08;
  const gapAt = -Math.PI / 3, gapHalf = 0.22; // radians; mirrors favicon.svg
  return png(size, (x, y) => {
    const dx = x + 0.5 - c, dy = y + 0.5 - c;
    const dist = Math.hypot(dx, dy);
    let diff = Math.abs(Math.atan2(dy, dx) - gapAt);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    const inRing = Math.abs(dist - r) <= w / 2 && diff > gapHalf;
    return inRing ? INK : PAPER;
  });
}

for (const size of [192, 512, 180]) {
  await writeFile(new URL(`../site/icon-${size}.png`, import.meta.url), ring(size));
  console.log(`site/icon-${size}.png`);
}
