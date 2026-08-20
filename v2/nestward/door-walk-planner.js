import { WORLD_HEIGHT, groundY } from './world-model.js';

const DIR8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

const toZ = (scene, y) => Math.max(.03, Math.min(.95,
  (y - scene.wallBottom) / (scene.floorBottom - scene.wallBottom)));

const actorDistance = (scene, a, b) => Math.hypot(
  b.x - a.x,
  groundY(scene, b.z) - groundY(scene, a.z)
);

function readMaskAlpha(mask, width, height) {
  const surface = document.createElement('canvas');
  surface.width = width;
  surface.height = height;
  const context = surface.getContext('2d', { willReadFrequently: true });
  context.drawImage(mask, 0, 0, width, height);
  return context.getImageData(0, 0, width, height).data;
}

export function createDoorWalkPlanner(mask, scene, anchorPoint, step = 6) {
  const width = scene.width;
  const height = WORLD_HEIGHT;
  const data = readMaskAlpha(mask, width, height);
  const columns = Math.floor(width / step) + 1;
  const rows = Math.floor(height / step) + 1;
  const valid = new Uint8Array(columns * rows);
  const nodes = [];

  for (let gy = 0; gy < rows; gy += 1) {
    const y = Math.min(height - 1, gy * step);
    for (let gx = 0; gx < columns; gx += 1) {
      const x = Math.min(width - 1, gx * step);
      const index = gy * columns + gx;
      if (data[(y * width + x) * 4 + 3] > 35) {
        valid[index] = 1;
        nodes.push(index);
      }
    }
  }

  const pointFor = (index) => ({
    x: (index % columns) * step,
    z: toZ(scene, ((index / columns) | 0) * step)
  });
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
      const points = thin(pathIndexes(start, anchorIndex));
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
      const goal = candidates.length
        ? candidates[(random() * candidates.length) | 0]
        : component[(random() * component.length) | 0];
      return thin(pathIndexes(start, goal));
    }
  };
}
