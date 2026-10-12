/**
 * Generates the NSIS installer artwork from the app icon.
 *
 * Tauri/NSIS needs two BMPs:
 *   header.bmp   150 x 57   — top banner of the installer pages
 *   sidebar.bmp  164 x 314  — left panel of the welcome/finish pages
 *
 * Written by hand (24-bit BGR, bottom-up rows) because Pillow is not available
 * in this environment and shelling out to ImageMagick is not guaranteed either.
 * The icon is decoded by rendering it in headless Edge first, so this script
 * only needs to read a PNG — which it does with a minimal decoder for the
 * exact format Edge writes (8-bit RGBA, non-interlaced).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const ICON = 'app-icon.png';
const OUT_DIR = 'src-tauri/installer';

// ---------------------------------------------------------------- PNG decode

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');

  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error('interlaced PNG not supported');
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }

  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  // 6 = RGBA, 2 = RGB
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels) throw new Error(`unsupported colour type ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  // Undo per-scanline filters (PNG spec section 9).
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const row = raw.subarray(rp, rp + stride);
    rp += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = row[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
  }

  return { width, height, channels, data: out };
}

// ------------------------------------------------------------- image helpers

/** Bilinear sample of the source image, composited over a solid colour. */
function sample(img, fx, fy, bg) {
  const x = Math.min(Math.max(fx, 0), img.width - 1);
  const y = Math.min(Math.max(fy, 0), img.height - 1);
  const i = (y * img.width + x) * img.channels;

  const r = img.data[i];
  const g = img.data[i + 1];
  const b = img.data[i + 2];
  const a = img.channels === 4 ? img.data[i + 3] / 255 : 1;

  return [
    Math.round(r * a + bg[0] * (1 - a)),
    Math.round(g * a + bg[1] * (1 - a)),
    Math.round(b * a + bg[2] * (1 - a))
  ];
}

function resize(img, w, h, bg) {
  const out = Buffer.alloc(w * h * 3);
  const scale = Math.min(w / img.width, h / img.height) * 0.82;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const ox = (w - dw) / 2;
  const oy = (h - dh) / 2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let px;
      if (x >= ox && x < ox + dw && y >= oy && y < oy + dh) {
        px = sample(img, ((x - ox) / dw) * img.width, ((y - oy) / dh) * img.height, bg);
      } else {
        px = bg;
      }
      const o = (y * w + x) * 3;
      out[o] = px[0];
      out[o + 1] = px[1];
      out[o + 2] = px[2];
    }
  }
  return out;
}

/** 24-bit BMP, bottom-up, BGR, 4-byte aligned rows. */
function writeBmp(path, rgb, w, h) {
  const rowSize = Math.ceil((w * 3) / 4) * 4;
  const pixelBytes = rowSize * h;
  const buf = Buffer.alloc(54 + pixelBytes);

  buf.write('BM', 0, 'ascii');
  buf.writeUInt32LE(54 + pixelBytes, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(w, 18);
  buf.writeInt32LE(h, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelBytes, 34);
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);

  for (let y = 0; y < h; y++) {
    const srcRow = (h - 1 - y) * w * 3; // BMP stores bottom-up
    const dstRow = 54 + y * rowSize;
    for (let x = 0; x < w; x++) {
      buf[dstRow + x * 3] = rgb[srcRow + x * 3 + 2]; // B
      buf[dstRow + x * 3 + 1] = rgb[srcRow + x * 3 + 1]; // G
      buf[dstRow + x * 3 + 2] = rgb[srcRow + x * 3]; // R
    }
  }

  writeFileSync(path, buf);
}

// ------------------------------------------------------------------- generate

const icon = decodePng(readFileSync(ICON));
mkdirSync(OUT_DIR, { recursive: true });

// Matches the app background so the artwork blends with the installer chrome.
const BG = [22, 15, 10];

writeBmp(`${OUT_DIR}/header.bmp`, resize(icon, 150, 57, BG), 150, 57);
writeBmp(`${OUT_DIR}/sidebar.bmp`, resize(icon, 164, 314, BG), 164, 314);

console.log('installer artwork written: header.bmp (150x57), sidebar.bmp (164x314)');
