const W = 1536;
const H = 1024;
const LAB_KEY = 'nw.doorStateLab.v2';
const SPEED_KEY = 'nw.doorStateLab.v3.moveSpeed';
const ACCEPTED_KEY = 'nw.nestward.doorAway.accepted.v1';

export const DOOR_AWAY_ACCEPTED = {
  point1: { x: 1337, z: 0.13283289537879497 },
  point2: { x: 1507, z: 0.20824666969097821 },
  moveSpeed: 1.2,
  outsideSpeedFactor: 0.9
};

const GUIDE_A = [[1248,444],[1249,332],[1255,270],[1272,216],[1300,174],[1338,149],[1380,143],[1418,157],[1448,192],[1468,242],[1476,310],[1477,398],[1475,474],[1464,530],[1437,573],[1400,600],[1350,607],[1304,590],[1271,557],[1253,516],[1248,444]];
const GUIDE_B = [[1470,203],[1474,280],[1475,370],[1475,465],[1468,528],[1457,570],[1445,605],[1448,628],[1470,649],[1490,686],[1505,724],[1518,754]];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeRead(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeWrite(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

function validAcceptedShape(value) {
  if (!value || !value.adjust || !value.point1 || !value.point2) return false;
  const { maskA, maskB, walk } = value.adjust;
  if (!Array.isArray(maskA) || !Array.isArray(maskB) || !Array.isArray(walk)) return false;
  if (maskA.length < 40 || maskB.length < 20 || walk.length < 20) return false;
  if (Math.abs(Number(value.point1.x) - DOOR_AWAY_ACCEPTED.point1.x) > 1) return false;
  if (Math.abs(Number(value.point1.z) - DOOR_AWAY_ACCEPTED.point1.z) > .002) return false;
  if (Math.abs(Number(value.point2.x) - DOOR_AWAY_ACCEPTED.point2.x) > 1) return false;
  if (Math.abs(Number(value.point2.z) - DOOR_AWAY_ACCEPTED.point2.z) > .002) return false;
  return true;
}

export function loadAcceptedDoorAwayCalibration() {
  const frozenRaw = safeRead(ACCEPTED_KEY);
  if (frozenRaw) {
    try {
      const frozen = JSON.parse(frozenRaw);
      if (validAcceptedShape(frozen)) return frozen;
    } catch { /* fall through to the lab snapshot */ }
  }

  const labRaw = safeRead(LAB_KEY);
  if (!labRaw) return null;
  try {
    const lab = JSON.parse(labRaw);
    if (!validAcceptedShape(lab)) return null;
    const speed = Number(safeRead(SPEED_KEY));
    const frozen = {
      version: 'door-away-accepted-v1',
      canvas: [W, H],
      maskBase: 'pixel-livewire-v1',
      guideA: GUIDE_A,
      guideB: GUIDE_B,
      adjust: clone(lab.adjust),
      point1: clone(lab.point1),
      point2: clone(lab.point2),
      moveSpeed: Number.isFinite(speed) ? speed : DOOR_AWAY_ACCEPTED.moveSpeed,
      outsideSpeedFactor: DOOR_AWAY_ACCEPTED.outsideSpeedFactor
    };
    safeWrite(ACCEPTED_KEY, JSON.stringify(frozen));
    return frozen;
  } catch {
    return null;
  }
}

function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  return canvas;
}

function stroke(context, item) {
  if (!item?.points?.length) return;
  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = Number(item.size) || 1;
  context.strokeStyle = '#fff';
  context.globalCompositeOperation = item.erase ? 'destination-out' : 'source-over';
  context.beginPath();
  context.moveTo(...item.points[0]);
  for (const point of item.points.slice(1)) context.lineTo(...point);
  if (item.points.length === 1) context.lineTo(item.points[0][0] + .01, item.points[0][1] + .01);
  context.stroke();
  context.restore();
}

async function loadIndoorImage() {
  const image = new Image();
  image.decoding = 'async';
  image.src = new URL('./assets/indoor-world.webp', import.meta.url).href;
  if (typeof image.decode === 'function') {
    try { await image.decode(); return image; } catch { /* onload fallback below */ }
  }
  if (image.complete && image.naturalWidth) return image;
  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('door-away indoor artwork failed to load'));
  });
}

function buildGradient(image) {
  const source = createCanvas();
  const context = source.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, W, H);
  const data = context.getImageData(0, 0, W, H).data;
  const gradient = new Uint8Array(W * H);
  const luminance = new Uint8Array(W * H);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    luminance[j] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
  }
  for (let y = 1; y < H - 1; y += 1) {
    for (let x = 1; x < W - 1; x += 1) {
      const i = y * W + x;
      const gx = -luminance[i-W-1] - 2*luminance[i-1] - luminance[i+W-1] + luminance[i-W+1] + 2*luminance[i+1] + luminance[i+W+1];
      const gy = -luminance[i-W-1] - 2*luminance[i-W] - luminance[i-W+1] + luminance[i+W-1] + 2*luminance[i+W] + luminance[i+W+1];
      gradient[i] = Math.min(255, Math.hypot(gx, gy) / 4);
    }
  }
  return gradient;
}

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
        const cost = (dx && dy ? 1.414 : 1) * (1.2 + 6 * (1 - edge) * (1 - edge) + lineDistance * .035);
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
  const path = [];
  if (previous[current] < 0) return [a, b];
  while (current >= 0) {
    path.push([current % width + minX, ((current / width) | 0) + minY]);
    if (current === start) break;
    current = previous[current];
  }
  path.reverse();
  return path;
}

function snapLoop(gradient, guides, closed = true) {
  const output = [];
  for (let index = 0; index < guides.length - 1; index += 1) {
    const part = liveWire(gradient, guides[index], guides[index + 1]);
    if (index) part.shift();
    output.push(...part);
  }
  if (closed && output.length && (output[0][0] !== output.at(-1)[0] || output[0][1] !== output.at(-1)[1])) output.push(output[0]);
  return output;
}

function fillPath(context, path) {
  context.clearRect(0, 0, W, H);
  context.save();
  context.fillStyle = '#fff';
  context.beginPath();
  context.moveTo(...path[0]);
  for (const point of path.slice(1)) context.lineTo(...point);
  context.closePath();
  context.fill();
  context.restore();
}

export async function buildAcceptedDoorAwayMasks(calibration) {
  if (!validAcceptedShape(calibration)) throw new Error('door-away accepted calibration is incomplete');
  const image = await loadIndoorImage();
  const gradient = buildGradient(image);

  const baseA = createCanvas();
  const baseB = createCanvas();
  fillPath(baseA.getContext('2d'), snapLoop(gradient, GUIDE_A, true));
  const bEdge = snapLoop(gradient, GUIDE_B, false);
  const bPath = [[W, GUIDE_B[0][1]], GUIDE_B[0], ...bEdge.slice(1), [W, GUIDE_B.at(-1)[1]]];
  fillPath(baseB.getContext('2d'), bPath);

  const maskA = createCanvas();
  const maskB = createCanvas();
  const walk = createCanvas();
  maskA.getContext('2d').drawImage(baseA, 0, 0);
  maskB.getContext('2d').drawImage(baseB, 0, 0);
  for (const item of calibration.adjust.maskA) stroke(maskA.getContext('2d'), item);
  for (const item of calibration.adjust.maskB) stroke(maskB.getContext('2d'), item);
  for (const item of calibration.adjust.walk) stroke(walk.getContext('2d'), item);
  return { maskA, maskB, walk };
}

function groundY(scene, z) {
  return scene.wallBottom + z * (scene.floorBottom - scene.wallBottom);
}

function toZ(scene, y) {
  return Math.max(.03, Math.min(.95, (y - scene.wallBottom) / (scene.floorBottom - scene.wallBottom)));
}

function actorDistance(scene, a, b) {
  return Math.hypot(b.x - a.x, groundY(scene, b.z) - groundY(scene, a.z));
}

const DIR8 = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];

export function createDoorAwayWalkPlanner(mask, scene, anchorPoint, step = 6) {
  const context = mask.getContext('2d', { willReadFrequently: true });
  const data = context.getImageData(0, 0, W, H).data;
  const columns = Math.floor(W / step) + 1;
  const rows = Math.floor(H / step) + 1;
  const valid = new Uint8Array(columns * rows);
  const nodes = [];
  for (let gy = 0; gy < rows; gy += 1) {
    const y = Math.min(H - 1, gy * step);
    for (let gx = 0; gx < columns; gx += 1) {
      const x = Math.min(W - 1, gx * step);
      const index = gy * columns + gx;
      if (data[(y * W + x) * 4 + 3] > 35) {
        valid[index] = 1;
        nodes.push(index);
      }
    }
  }

  const pointFor = (index) => ({ x: (index % columns) * step, z: toZ(scene, ((index / columns) | 0) * step) });
  const nearest = (point, subset = nodes) => {
    let best = -1;
    let bestDistance = Infinity;
    for (const index of subset) {
      const candidate = pointFor(index);
      const distance = actorDistance(scene, point, candidate);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    }
    return best;
  };
  const anchorIndex = nearest(anchorPoint);
  const seen = new Uint8Array(valid.length);
  const queue = anchorIndex >= 0 ? [anchorIndex] : [];
  const component = [];
  if (anchorIndex >= 0) seen[anchorIndex] = 1;
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    component.push(current);
    const x = current % columns;
    const y = (current / columns) | 0;
    for (const [dx, dy] of DIR8) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= columns || ny >= rows) continue;
      const next = ny * columns + nx;
      if (valid[next] && !seen[next]) {
        seen[next] = 1;
        queue.push(next);
      }
    }
  }

  const pathIndexes = (startIndex, goalIndex) => {
    if (startIndex < 0 || goalIndex < 0) return [];
    if (startIndex === goalIndex) return [startIndex];
    const previous = new Int32Array(valid.length);
    previous.fill(-2);
    const open = [startIndex];
    previous[startIndex] = -1;
    for (let head = 0; head < open.length; head += 1) {
      const current = open[head];
      if (current === goalIndex) break;
      const x = current % columns;
      const y = (current / columns) | 0;
      for (const [dx, dy] of DIR8) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= columns || ny >= rows) continue;
        const next = ny * columns + nx;
        if (!valid[next] || previous[next] !== -2 || !seen[next]) continue;
        previous[next] = current;
        open.push(next);
      }
    }
    if (previous[goalIndex] === -2) return [];
    const path = [];
    for (let current = goalIndex; current >= 0; current = previous[current]) path.push(current);
    path.reverse();
    return path;
  };

  const thin = (indexes) => {
    if (!indexes.length) return [];
    const points = [];
    for (let index = 0; index < indexes.length; index += 3) points.push(pointFor(indexes[index]));
    const last = pointFor(indexes.at(-1));
    if (!points.length || points.at(-1).x !== last.x || points.at(-1).z !== last.z) points.push(last);
    return points;
  };

  return {
    ready: component.length > 0,
    componentSize: component.length,
    pathToAnchor(from) {
      if (!component.length) return [];
      const start = nearest(from, component);
      const indexes = pathIndexes(start, anchorIndex);
      const points = thin(indexes);
      if (!points.length || actorDistance(scene, points.at(-1), anchorPoint) > 2) points.push({ ...anchorPoint });
      return points;
    },
    randomPath(from, random = Math.random) {
      if (!component.length) return [];
      const start = nearest(from, component);
      if (start < 0) return [];
      const fromPoint = pointFor(start);
      const candidates = [];
      for (let tries = 0; tries < 120; tries += 1) {
        const candidate = component[(random() * component.length) | 0];
        const distance = actorDistance(scene, fromPoint, pointFor(candidate));
        if (distance > 45 && distance < 220) candidates.push(candidate);
      }
      const goal = candidates.length ? candidates[(random() * candidates.length) | 0] : component[(random() * component.length) | 0];
      return thin(pathIndexes(start, goal));
    }
  };
}
