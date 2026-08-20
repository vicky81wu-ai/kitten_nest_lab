#!/usr/bin/env node

// Build-time utility only. Runtime must consume the resulting static PNGs and
// must never rerun the Sobel/live-wire calibration pipeline on a phone.
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const W = 1536;
const H = 1024;
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_CALIBRATION = 'v2/nestward/assets/door/door-away-calibration.v1.json';
const DEFAULT_ARTWORK = 'v2/nestward/assets/indoor-world.webp';
const DEFAULT_OUTPUT_DIR = 'v2/nestward/assets/door';

class Heap {
  constructor() { this.items = []; }

  push(node) {
    let index = this.items.push(node) - 1;
    while (index) {
      const parent = (index - 1) >> 1;
      if (this.items[parent][0] <= node[0]) break;
      this.items[index] = this.items[parent];
      index = parent;
      this.items[index] = node;
    }
  }

  pop() {
    if (!this.items.length) return null;
    const root = this.items[0];
    const tail = this.items.pop();
    if (this.items.length) {
      this.items[0] = tail;
      let index = 0;
      for (;;) {
        const left = index * 2 + 1;
        const right = left + 1;
        let best = index;
        if (left < this.items.length && this.items[left][0] < this.items[best][0]) best = left;
        if (right < this.items.length && this.items[right][0] < this.items[best][0]) best = right;
        if (best === index) break;
        [this.items[index], this.items[best]] = [this.items[best], this.items[index]];
        index = best;
      }
    }
    return root;
  }

  get length() { return this.items.length; }
}

function resolveProjectPath(input) {
  return path.resolve(PROJECT_ROOT, input);
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function assertCalibration(value) {
  const errors = [];
  if (!Array.isArray(value?.canvas) || value.canvas[0] !== W || value.canvas[1] !== H) errors.push('canvas');
  if (value?.maskBase !== 'pixel-livewire-v1') errors.push('maskBase');
  if (!Array.isArray(value?.guideA) || value.guideA.length < 3) errors.push('guideA');
  if (!Array.isArray(value?.guideB) || value.guideB.length < 2) errors.push('guideB');
  for (const key of ['maskA', 'maskB', 'walk']) {
    if (!Array.isArray(value?.adjust?.[key])) errors.push(`adjust.${key}`);
  }
  if (errors.length) throw new Error(`Invalid Door calibration: ${errors.join(', ')}`);
}

async function buildGradient(artworkPath) {
  const { data, info } = await sharp(artworkPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== W || info.height !== H) {
    throw new Error(`Indoor artwork is ${info.width}x${info.height}; expected ${W}x${H}.`);
  }
  const luminance = new Uint8Array(W * H);
  const gradient = new Uint8Array(W * H);
  for (let pixel = 0, channel = 0; pixel < luminance.length; pixel += 1, channel += info.channels) {
    luminance[pixel] = (data[channel] * 77 + data[channel + 1] * 150 + data[channel + 2] * 29) >> 8;
  }
  for (let y = 1; y < H - 1; y += 1) {
    for (let x = 1; x < W - 1; x += 1) {
      const i = y * W + x;
      const gx = -luminance[i - W - 1] - 2 * luminance[i - 1] - luminance[i + W - 1]
        + luminance[i - W + 1] + 2 * luminance[i + 1] + luminance[i + W + 1];
      const gy = -luminance[i - W - 1] - 2 * luminance[i - W] - luminance[i - W + 1]
        + luminance[i + W - 1] + 2 * luminance[i + W] + luminance[i + W + 1];
      gradient[i] = Math.min(255, Math.hypot(gx, gy) / 4);
    }
  }
  return gradient;
}

// This is intentionally kept numerically identical to the repaired lab solver:
// Float64 distances prevent stale heap entries from being mistaken for current ones.
function liveWire(gradient, a, b, pad = 26) {
  const minX = Math.max(1, Math.floor(Math.min(a[0], b[0]) - pad));
  const maxX = Math.min(W - 2, Math.ceil(Math.max(a[0], b[0]) + pad));
  const minY = Math.max(1, Math.floor(Math.min(a[1], b[1]) - pad));
  const maxY = Math.min(H - 2, Math.ceil(Math.max(a[1], b[1]) + pad));
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const count = width * height;
  const distance = new Float64Array(count);
  distance.fill(Infinity);
  const previous = new Int32Array(count);
  previous.fill(-1);
  const heap = new Heap();
  const sx = Math.round(a[0]) - minX;
  const sy = Math.round(a[1]) - minY;
  const tx = Math.round(b[0]) - minX;
  const ty = Math.round(b[1]) - minY;
  const start = sy * width + sx;
  const target = ty * width + tx;
  distance[start] = 0;
  heap.push([0, start]);
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const vl = Math.max(1, Math.hypot(vx, vy));

  while (heap.length) {
    const [du, current] = heap.pop();
    if (du !== distance[current]) continue;
    if (current === target) break;
    const ux = current % width;
    const uy = (current / width) | 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;
        const nx = ux + dx;
        const ny = uy + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const gx = nx + minX;
        const gy = ny + minY;
        const gi = gy * W + gx;
        const px = gx - a[0];
        const py = gy - a[1];
        const lineDistance = Math.abs(px * vy - py * vx) / vl;
        const edge = gradient[gi] / 255;
        const cost = (dx && dy ? 1.414 : 1) * (1.2 + 6 * (1 - edge) * (1 - edge) + lineDistance * 0.035);
        const next = ny * width + nx;
        const candidate = du + cost;
        if (candidate < distance[next]) {
          distance[next] = candidate;
          previous[next] = current;
          heap.push([candidate, next]);
        }
      }
    }
  }

  let current = target;
  const output = [];
  if (previous[current] < 0) return [a, b];
  while (current >= 0) {
    output.push([current % width + minX, ((current / width) | 0) + minY]);
    if (current === start) break;
    current = previous[current];
  }
  output.reverse();
  return output;
}

function snapLoop(gradient, guides, closed = true) {
  const output = [];
  for (let index = 0; index < guides.length - 1; index += 1) {
    const part = liveWire(gradient, guides[index], guides[index + 1]);
    if (index) part.shift();
    output.push(...part);
  }
  if (closed && output.length && (output[0][0] !== output.at(-1)[0] || output[0][1] !== output.at(-1)[1])) {
    output.push(output[0]);
  }
  return output;
}

function svg(body) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`);
}

function pathData(points) {
  return points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');
}

function fillPath(points) {
  return svg(`<path d="${pathData(points)} Z" fill="#fff"/>`);
}

function strokePath(item) {
  if (!item?.points?.length) return null;
  const points = item.points;
  const tail = points.length === 1 ? [[points[0][0] + 0.01, points[0][1] + 0.01]] : [];
  return svg(`<path d="${pathData([...points, ...tail])}" fill="none" stroke="#fff" stroke-width="${Number(item.size) || 1}" stroke-linecap="round" stroke-linejoin="round"/>`);
}

async function bakeMask(outputPath, base, strokes) {
  const operations = [];
  if (base) operations.push({ input: base, blend: 'over' });
  for (const item of strokes) {
    const input = strokePath(item);
    if (input) operations.push({ input, blend: item.erase ? 'dest-out' : 'over' });
  }
  await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    }
  })
    .composite(operations)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
  const metadata = await sharp(outputPath).metadata();
  if (metadata.width !== W || metadata.height !== H || !metadata.hasAlpha) {
    throw new Error(`Baked ${path.basename(outputPath)} did not retain a ${W}x${H} alpha canvas.`);
  }
  return sha256(await readFile(outputPath));
}

const [calibrationArg = DEFAULT_CALIBRATION, artworkArg = DEFAULT_ARTWORK, outputArg = DEFAULT_OUTPUT_DIR] = process.argv.slice(2);
const calibrationPath = resolveProjectPath(calibrationArg);
const artworkPath = resolveProjectPath(artworkArg);
const outputDir = resolveProjectPath(outputArg);
const calibrationBytes = await readFile(calibrationPath);
const calibration = JSON.parse(calibrationBytes);
assertCalibration(calibration);
await mkdir(outputDir, { recursive: true });

const gradient = await buildGradient(artworkPath);
const aPath = snapLoop(gradient, calibration.guideA, true);
const bEdge = snapLoop(gradient, calibration.guideB, false);
const bPath = [[W, calibration.guideB[0][1]], calibration.guideB[0], ...bEdge.slice(1), [W, calibration.guideB.at(-1)[1]]];
const outputs = {
  maskA: path.join(outputDir, 'door-mask-a.v1.png'),
  maskB: path.join(outputDir, 'door-mask-b.v1.png'),
  walk: path.join(outputDir, 'door-walk.v1.png')
};

const hashes = {
  maskA: await bakeMask(outputs.maskA, fillPath(aPath), calibration.adjust.maskA),
  maskB: await bakeMask(outputs.maskB, fillPath(bPath), calibration.adjust.maskB),
  walk: await bakeMask(outputs.walk, null, calibration.adjust.walk)
};

console.log(JSON.stringify({
  calibration: path.relative(PROJECT_ROOT, calibrationPath),
  calibrationSha256: sha256(calibrationBytes),
  output: Object.fromEntries(Object.entries(outputs).map(([key, value]) => [key, path.relative(PROJECT_ROOT, value)])),
  hashes,
  paths: { maskA: aPath.length, maskB: bEdge.length },
  status: 'accepted-baked'
}, null, 2));
