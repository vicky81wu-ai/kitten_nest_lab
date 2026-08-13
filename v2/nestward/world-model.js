export const WORLD_HEIGHT = 1024;
export const TAU = Math.PI * 2;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (from, to, amount) => from + (to - from) * amount;
export const distance = (a, b) => Math.hypot(a.x - b.x, (a.z - b.z) * 520);

export function seededRandom(seed = 198) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const indoorObjects = [
  { id: 'bed', label: '床', x: 245, z: .31, w: 470, d: .21, hit: [0, 270, 470, 650], block: [0, 470, .04, .31], socket: { x: 430, z: .42 }, slots: { kitten: { x: 405, z: .44 }, hubby: { x: 470, z: .44 } } },
  { id: 'windowSeat', label: '窗边', x: 300, z: .2, w: 245, d: .12, hit: [185, 90, 410, 365], socket: { x: 470, z: .42 }, slots: { kitten: { x: 285, z: .42 }, hubby: { x: 350, z: .42 } } },
  { id: 'wardrobe', label: '衣柜', x: 535, z: .25, w: 235, d: .18, hit: [420, 105, 640, 560], block: [420, 640, .04, .3], socket: { x: 610, z: .43 } },
  { id: 'sofa', label: '沙发', x: 970, z: .3, w: 345, d: .2, hit: [790, 320, 1145, 590], block: [790, 1145, .04, .31], socket: { x: 810, z: .43 }, slots: { kitten: { x: 930, z: .47 }, hubby: { x: 1000, z: .47 } } },
  { id: 'coffeeTable', label: '茶几', x: 1000, z: .51, w: 265, d: .14, hit: [865, 490, 1130, 690], block: [865, 1130, .17, .4], socket: { x: 1000, z: .5 } },
  { id: 'desk', label: '小书桌', x: 1250, z: .32, w: 245, d: .18, hit: [1125, 330, 1370, 620], block: [1125, 1370, .04, .33], socket: { x: 1240, z: .39 } },
  { id: 'board', label: '留言墙', x: 1240, z: .11, w: 210, d: .03, hit: [1135, 170, 1350, 390], socket: { x: 1200, z: .39 } },
  { id: 'door', label: '院门', x: 1440, z: .26, w: 175, d: .12, hit: [1365, 135, 1535, 625], socket: { x: 1370, z: .39 }, direct: true }
];

const outdoorObjects = [
  { id: 'door', label: '回屋', x: 210, z: .31, w: 210, d: .15, hit: [90, 230, 310, 615], socket: { x: 360, z: .43 }, direct: true },
  { id: 'mailbox', label: '邮箱', x: 365, z: .41, w: 125, d: .12, hit: [300, 430, 435, 650], block: [300, 435, .04, .35], socket: { x: 455, z: .54 } },
  { id: 'bench', label: '树下长椅', x: 500, z: .36, w: 205, d: .16, hit: [405, 350, 610, 555], block: [405, 610, .04, .27], socket: { x: 515, z: .5 }, slots: { kitten: { x: 460, z: .5 }, hubby: { x: 510, z: .5 } } },
  { id: 'swing', label: '秋千', x: 710, z: .34, w: 210, d: .2, hit: [605, 260, 820, 560], socket: { x: 870, z: .19 }, slots: { hubbyPush: { x: 840, z: .19 } } },
  { id: 'garden', label: '花圃', x: 720, z: .53, w: 325, d: .18, hit: [550, 500, 885, 760], block: [550, 885, .26, .58], socket: { x: 610, z: .69 }, slots: { naili: { x: 760, z: .69 } } },
  { id: 'teaTable', label: '院子小桌', x: 965, z: .57, w: 250, d: .16, hit: [840, 520, 1110, 735], block: [840, 1110, .28, .55], socket: { x: 940, z: .68 }, slots: { hubbyServe: { x: 895, z: .67 } } },
  { id: 'fountain', label: '许愿喷泉', x: 1080, z: .38, w: 285, d: .2, hit: [935, 285, 1230, 625], block: [935, 1230, .03, .38], socket: { x: 1145, z: .52 } },
  { id: 'pond', label: '萤火池塘', x: 1360, z: .63, w: 350, d: .17, hit: [1180, 570, 1535, 875], block: [1180, 1536, .42, .79], socket: { x: 1135, z: .7 }, slots: { naili: { x: 1110, z: .74 } } },
  { id: 'bower', label: '藤架深处', x: 1370, z: .34, w: 300, d: .2, hit: [1220, 250, 1535, 570], block: [1220, 1536, .03, .24], socket: { x: 1290, z: .36 }, slots: { kitten: { x: 1325, z: .36 }, hubby: { x: 1390, z: .36 } } }
];

export const SCENES = {
  indoor: {
    id: 'indoor', width: 1536, cameraWidth: 1536, wallBottom: 465, floorBottom: 1024, bakedArt: true,
    walkBounds: { x1: 70, x2: 1466, z1: .08, z2: .94 },
    spawn: {
      player: { x: 650, z: .7 }, hubby: { x: 770, z: .66 }, naili: { x: 555, z: .79 }
    },
    entry: {
      fromOutdoor: { player: { x: 1345, z: .47 }, hubby: { x: 1270, z: .52 }, naili: { x: 1220, z: .64 } }
    },
    objects: indoorObjects,
    obstacles: [
      ...indoorObjects.flatMap((object) => object.block ? [{ x1: object.block[0], x2: object.block[1], z1: object.block[2], z2: object.block[3] }] : []),
      { x1: 640, x2: 805, z1: .04, z2: .31 },
      { x1: 0, x2: 215, z1: .43, z2: .98 },
      { x1: 1150, x2: 1536, z1: .46, z2: .98 }
    ]
  },
  outdoor: {
    id: 'outdoor', width: 1536, cameraWidth: 1536, wallBottom: 390, floorBottom: 1024, bakedArt: true,
    walkBounds: { x1: 70, x2: 1466, z1: .08, z2: .78 },
    spawn: {
      player: { x: 370, z: .58 }, hubby: { x: 470, z: .62 }, naili: { x: 535, z: .73 }
    },
    entry: {
      fromIndoor: { player: { x: 350, z: .58 }, hubby: { x: 455, z: .62 }, naili: { x: 525, z: .73 } }
    },
    objects: outdoorObjects,
    obstacles: [
      ...outdoorObjects.flatMap((object) => object.block ? [{ x1: object.block[0], x2: object.block[1], z1: object.block[2], z2: object.block[3] }] : []),
      { x1: 0, x2: 320, z1: .03, z2: .4 }
    ]
  }
};

export function groundY(scene, z) {
  return scene.wallBottom + z * (scene.floorBottom - scene.wallBottom);
}

export function groundZ(scene, y) {
  return clamp((y - scene.wallBottom) / (scene.floorBottom - scene.wallBottom), .03, .98);
}

export function actorScale(z) {
  return .72 + z * .31;
}

export function isBlocked(scene, point, paddingX = 30, paddingZ = .045) {
  const bounds = scene.walkBounds || { x1: 70, x2: scene.width - 70, z1: .08, z2: .96 };
  if (point.x < bounds.x1 || point.x > bounds.x2 || point.z < bounds.z1 || point.z > bounds.z2) return true;
  return scene.obstacles.some((obstacle) => point.x >= obstacle.x1 - paddingX
    && point.x <= obstacle.x2 + paddingX
    && point.z >= obstacle.z1 - paddingZ
    && point.z <= obstacle.z2 + paddingZ);
}

export function isInteractionSocketWalkable(scene, point) {
  return !isBlocked(scene, point, 8, .012);
}

export function nearestWalkable(scene, target) {
  const bounds = scene.walkBounds || { x1: 78, x2: scene.width - 78, z1: .1, z2: .95 };
  const point = { x: clamp(target.x, bounds.x1 + 8, bounds.x2 - 8), z: clamp(target.z, bounds.z1 + .02, bounds.z2 - .01) };
  if (!isBlocked(scene, point)) return point;
  for (let radius = 1; radius <= 10; radius += 1) {
    for (let index = 0; index < 20; index += 1) {
      const angle = index / 20 * TAU;
      const candidate = {
        x: point.x + Math.cos(angle) * radius * 46,
        z: point.z + Math.sin(angle) * radius * .055
      };
      if (!isBlocked(scene, candidate)) return candidate;
    }
  }
  return { x: scene.width * .5, z: Math.min(.72, bounds.z2 - .04) };
}

const gridKey = (x, z) => `${x}:${z}`;

export function findPath(scene, from, desiredTarget) {
  const target = nearestWalkable(scene, desiredTarget);
  const cellX = 54;
  const cellZ = .065;
  const columns = Math.ceil(scene.width / cellX);
  const rows = 14;
  const toCell = (point) => ({ x: clamp(Math.round(point.x / cellX), 1, columns - 1), z: clamp(Math.round(point.z / cellZ), 2, rows) });
  const toPoint = (cell) => ({ x: cell.x * cellX, z: cell.z * cellZ });
  const start = toCell(from);
  const goal = toCell(target);
  const valid = (cell) => cell.x > 0 && cell.x < columns && cell.z > 1 && cell.z <= rows && !isBlocked(scene, toPoint(cell), 18, .025);
  const open = [{ ...start, g: 0, f: 0, parent: null }];
  const best = new Map([[gridKey(start.x, start.z), 0]]);
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let end = null;
  let guard = 0;
  while (open.length && guard < 6000) {
    guard += 1;
    let bestIndex = 0;
    for (let index = 1; index < open.length; index += 1) if (open[index].f < open[bestIndex].f) bestIndex = index;
    const node = open.splice(bestIndex, 1)[0];
    if (Math.abs(node.x - goal.x) <= 1 && Math.abs(node.z - goal.z) <= 1) {
      end = node;
      break;
    }
    for (const [dx, dz] of directions) {
      const next = { x: node.x + dx, z: node.z + dz };
      if (!valid(next)) continue;
      if (dx && dz && (!valid({ x: node.x + dx, z: node.z }) || !valid({ x: node.x, z: node.z + dz }))) continue;
      const g = node.g + (dx && dz ? 1.414 : 1);
      const key = gridKey(next.x, next.z);
      if (best.has(key) && best.get(key) <= g) continue;
      best.set(key, g);
      const h = Math.hypot(goal.x - next.x, (goal.z - next.z) * 1.7);
      open.push({ ...next, g, f: g + h, parent: node });
    }
  }
  if (!end) return [target];
  const path = [];
  for (let node = end; node; node = node.parent) path.push(toPoint(node));
  path.reverse();
  path.shift();
  path.push(target);
  return simplifyPath([{ ...from }, ...path]).slice(1);
}

function simplifyPath(path) {
  if (path.length < 3) return path;
  const simplified = [path[0]];
  for (let index = 1; index < path.length - 1; index += 1) {
    const a = simplified[simplified.length - 1];
    const b = path[index];
    const c = path[index + 1];
    const cross = (b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x);
    if (Math.abs(cross) > .75) simplified.push(b);
  }
  simplified.push(path[path.length - 1]);
  return simplified;
}

export function pointInsideHit(object, point) {
  const [x1, y1, x2, y2] = object.hit;
  return point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2;
}
