export const WORLD_HEIGHT = 1024;
export const TAU = Math.PI * 2;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (from, to, amount) => from + (to - from) * amount;
export const distance = (a, b) => Math.hypot(a.x - b.x, (a.z - b.z) * 520);

export const DOOR_CALIBRATION = {
  kittenIndoorA: { x: 1394, z: .167 },
  kittenOutdoorAnchor: { x: 153, z: .299 },
  kittenIndoorB: { x: 1241, z: .291 },
  hubbyIndoorExit: { x: 1466, z: .190 },
  hubbyIndoorArrival: { x: 1353, z: .159 },
  hubbyOutdoorEntry: { x: 197, z: .298 },
  hubbyOutdoorReturn: { x: 190, z: .330 },
  carryIndoorAnchor: { x: 1381, z: .202 },
  carryOutdoorAnchor: { x: 227, z: .338 },
  indoorHotspot: [[1365, 161], [1478, 159], [1483, 434], [1356, 400]],
  outdoorHotspot: [[112, 235], [275, 235], [275, 455], [112, 455]]
};

export const DOOR_AWAY_CALIBRATION = Object.freeze({
  point1: Object.freeze({ x: 1337, z: 0.13283289537879497 }),
  point2: Object.freeze({ x: 1507, z: 0.20824666969097821 }),
  // Naili clears the doorway before Hubby returns, so the two never settle on
  // the same threshold point after a walk.
  nailiReturnAnchor: Object.freeze({ x: 1220, z: 0.48 }),
  moveSpeed: 1.2,
  outsideSpeedFactor: 0.9,
  companionDelaySeconds: 2
});

export const DOOR_TRANSITION_CALIBRATION = Object.freeze({
  indoor: Object.freeze({
    kitten: Object.freeze({
      point1: Object.freeze({ x: 1389.0143540669856, z: 0.21818010630740092 }),
      point2: Object.freeze({ x: 1495.823923444976, z: 0.2435980176494252 })
    }),
    hubby: Object.freeze({
      point: Object.freeze({ x: 1360.5971291866026, z: 0.15156764899726935 })
    })
  }),
  outdoor: Object.freeze({
    kitten: Object.freeze({
      point: Object.freeze({ x: 137.18660287081337, z: 0.32225861470423944 })
    }),
    hubby: Object.freeze({
      point: Object.freeze({ x: 196.47081339712915, z: 0.28902842135450457 })
    })
  })
});

export function seededRandom(seed = 198) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const indoorObjects = [
  {
    id: 'bed', label: '床', x: 245, z: .31, w: 470, d: .21,
    hit: [0, 270, 470, 620],
    hitPolygons: [[[0, 286], [404, 286], [454, 588], [0, 588]]],
    block: [0, 430, .04, .26], socket: { x: 430, z: .42 }, interactionRadius: 190,
    slots: { kitten: { x: 405, z: .44 }, hubby: { x: 470, z: .44 } },
    mounts: {
      kittenSit: { objectId: 'bed', x: 292, z: .325, renderY: 570, pose: 'bed-sit', height: 188, facing: -1 },
      kittenLie: { objectId: 'bed', x: 248, z: .285, renderY: 474, pose: 'bed-lie', width: 310, facing: 1 },
      kittenLean: { objectId: 'bed', x: 300, z: .326, renderY: 568, pose: 'bed-lean', height: 184, facing: -1 },
      hubbySit: { objectId: 'bed', x: 222, z: .305, renderY: 566, pose: 'bed-sit', height: 218, facing: 1 },
      hubbyLean: { objectId: 'bed', x: 218, z: .304, renderY: 566, pose: 'bed-lean', height: 212, facing: 1 }
    }
  },
  { id: 'windowSeat', label: '窗边', x: 300, z: .2, w: 245, d: .12, hit: [185, 90, 410, 365], socket: { x: 470, z: .42 }, slots: { kitten: { x: 285, z: .42 }, hubby: { x: 350, z: .42 } } },
  {
    id: 'wardrobe', label: '衣柜', x: 535, z: .25, w: 235, d: .18,
    hit: [420, 105, 640, 530], hitPolygons: [[[430, 118], [634, 118], [634, 510], [430, 510]]],
    block: [440, 630, .04, .245], socket: { x: 610, z: .43 }, interactionRadius: 176
  },
  { id: 'sofa', label: '沙发', x: 970, z: .3, w: 345, d: .2, hit: [790, 320, 1145, 580], block: [800, 1135, .04, .27], socket: { x: 810, z: .43 }, slots: { kitten: { x: 930, z: .47 }, hubby: { x: 1000, z: .47 } } },
  { id: 'coffeeTable', label: '茶几', x: 1000, z: .51, w: 265, d: .14, hit: [865, 490, 1130, 650], block: [880, 1120, .18, .33], socket: { x: 1000, z: .5 } },
  {
    id: 'readingChair', label: '绿绒阅读椅', x: 720, z: .43, w: 210, d: .18,
    hit: [610, 425, 830, 715], block: [676, 764, .24, .43], socket: { x: 855, z: .56 }, interactionRadius: 182,
    visual: {
      asset: 'readingChair', x: 615, y: 430, width: 210, height: 291, backZ: .29, frontZ: .5,
      frontPolygons: [
        [[615, 545], [676, 548], [680, 675], [615, 690]],
        [[764, 548], [825, 545], [825, 690], [760, 675]]
      ]
    },
    mounts: {
      kittenSit: { objectId: 'readingChair', x: 720, z: .43, renderY: 681, pose: 'bed-sit', height: 231, facing: -1 },
      hubbySit: { objectId: 'readingChair', x: 720, z: .43, renderY: 681, pose: 'bed-sit', height: 265, facing: 1 }
    }
  },
  { id: 'desk', label: '小书桌', x: 1250, z: .32, w: 245, d: .18, hit: [1125, 330, 1370, 525], block: [1135, 1360, .04, .1], socket: { x: 1240, z: .39 } },
  { id: 'board', label: '留言墙', x: 1240, z: .11, w: 210, d: .03, hit: [1135, 170, 1350, 390], socket: { x: 1200, z: .39 } },
  {
    id: 'door', label: '院门', x: DOOR_CALIBRATION.kittenIndoorA.x, z: DOOR_CALIBRATION.kittenIndoorA.z, w: 175, d: .12,
    hit: [1356, 159, 1483, 434], hitPolygons: [DOOR_CALIBRATION.indoorHotspot],
    socket: { x: 1370, z: .39 }, interactionRadius: 1, direct: true
  }
];

const outdoorObjects = [
  {
    id: 'door', label: '回屋', x: DOOR_CALIBRATION.kittenOutdoorAnchor.x, z: DOOR_CALIBRATION.kittenOutdoorAnchor.z, w: 210, d: .15,
    hit: [112, 235, 275, 455], hitPolygons: [DOOR_CALIBRATION.outdoorHotspot],
    socket: { x: 360, z: .43 }, interactionRadius: 1, direct: true
  },
  { id: 'mailbox', label: '邮箱', x: 365, z: .41, w: 125, d: .12, hit: [300, 430, 435, 650], block: [300, 435, .04, .35], socket: { x: 455, z: .54 } },
  {
    id: 'bench', label: '树下长椅', x: 500, z: .36, w: 205, d: .16,
    hit: [405, 346, 610, 494], hitPolygons: [[[405, 346], [610, 346], [610, 494], [405, 494]]],
    socket: { x: 515, z: .5 }, slots: { kitten: { x: 460, z: .5 }, hubby: { x: 510, z: .5 } }
  },
  {
    id: 'swing', label: '秋千', x: 710, z: .34, w: 210, d: .2,
    hit: [605, 260, 820, 560], socket: { x: 870, z: .19 },
    hitPolygons: [[[605, 260], [820, 260], [820, 486], [605, 486]]],
    swingMount: { x: 754, renderY: 500, height: 135, facing: -1 },
    slots: { hubbyPush: { x: 840, z: .19 } }
  },
  {
    id: 'garden', label: '花圃', x: 720, z: .53, w: 325, d: .18,
    hit: [550, 500, 885, 760],
    hitPolygons: [[[550, 610], [746, 588], [790, 760], [550, 760]]],
    block: [550, 748, .42, .58], socket: { x: 610, z: .69 }, slots: { naili: { x: 760, z: .69 } }
  },
  {
    id: 'teaTable', label: '院子小桌', x: 965, z: .57, w: 250, d: .16,
    hit: [840, 520, 1110, 735],
    hitPolygons: [[[875, 596], [1088, 574], [1110, 735], [850, 735]]],
    block: [900, 1110, .36, .55], socket: { x: 940, z: .68 }, slots: { hubbyServe: { x: 895, z: .67 } }
  },
  {
    id: 'fountain', label: '许愿喷泉', x: 1080, z: .38, w: 285, d: .2,
    hit: [990, 286, 1190, 542],
    hitPolygons: [
      [[1060, 286], [1148, 286], [1170, 472], [1038, 472]],
      [[1000, 472], [1030, 454], [1086, 446], [1144, 454], [1180, 476], [1190, 505], [1170, 530], [1088, 542], [1012, 530], [990, 504]]
    ],
    block: [1055, 1195, .05, .275], socket: { x: 1145, z: .52 }, interactionRadius: 195
  },
  {
    id: 'gardenGate', label: '花园门', x: 786, z: .18, w: 150, d: .08,
    hit: [710, 250, 870, 455], hitPolygons: [[[744, 266], [834, 266], [834, 420], [744, 420]]],
    socket: { x: 790, z: .68 }, stateKey: 'gardenGateOpen', futureExit: 'orchardPath'
  },
  {
    id: 'pond', label: '萤火池塘', x: 1385, z: .67, w: 300, d: .14,
    hit: [1190, 610, 1535, 875],
    hitPolygons: [[[1270, 610], [1535, 570], [1535, 875], [1192, 875], [1192, 720]]],
    block: [1270, 1536, .57, .79], socket: { x: 1135, z: .7 }, slots: { naili: { x: 1110, z: .74 } }
  },
  {
    id: 'bower', label: '藤架深处', x: 1390, z: .3, w: 260, d: .17,
    hit: [1245, 260, 1535, 525], hitPolygons: [[[1260, 272], [1535, 250], [1535, 505], [1260, 505]]],
    block: [1270, 1536, .03, .2], socket: { x: 1290, z: .36 }, slots: { kitten: { x: 1325, z: .36 }, hubby: { x: 1390, z: .36 } }
  }
];

export const SCENES = {
  indoor: {
    id: 'indoor', width: 1536, cameraWidth: 1536, wallBottom: 465, floorBottom: 1024, bakedArt: true,
    walkBounds: { x1: 70, x2: 1466, z1: .08, z2: .94 },
    spawn: {
      player: { x: 650, z: .7 }, hubby: { x: 770, z: .66 }, naili: { x: 555, z: .79 }
    },
    entry: {
      fromOutdoor: {
        player: { ...DOOR_CALIBRATION.kittenIndoorA },
        hubby: { ...DOOR_CALIBRATION.hubbyIndoorArrival },
        naili: { x: 1220, z: .64 }
      }
    },
    doorway: {
      kittenA: DOOR_CALIBRATION.kittenIndoorA,
      kittenB: DOOR_CALIBRATION.kittenIndoorB,
      hubbyExit: DOOR_CALIBRATION.hubbyIndoorExit,
      hubbyArrival: DOOR_CALIBRATION.hubbyIndoorArrival,
      carryAnchor: DOOR_CALIBRATION.carryIndoorAnchor,
      hotspot: DOOR_CALIBRATION.indoorHotspot
    },
    objects: indoorObjects,
    actorHeights: { player: 257, hubby: 294, naili: 76 },
    foregroundLayers: [{
      id: 'bed-front', objectId: 'bed', z: .35,
      polygons: []
    }],
    obstacles: [
      ...indoorObjects.flatMap((object) => object.block ? [{ x1: object.block[0], x2: object.block[1], z1: object.block[2], z2: object.block[3] }] : []),
      { x1: 650, x2: 795, z1: .04, z2: .27 },
      { x1: 0, x2: 112, z1: .65, z2: .98 }
    ]
  },
  outdoor: {
    id: 'outdoor', width: 1536, cameraWidth: 1536, wallBottom: 390, floorBottom: 1024, bakedArt: true,
    walkBounds: { x1: 70, x2: 1466, z1: .08, z2: .78 },
    spawn: {
      player: { x: 370, z: .58 }, hubby: { x: 470, z: .62 }, naili: { x: 535, z: .73 }
    },
    entry: {
      fromIndoor: {
        player: { ...DOOR_CALIBRATION.kittenOutdoorAnchor },
        hubby: { ...DOOR_CALIBRATION.hubbyOutdoorEntry },
        naili: { x: 525, z: .73 }
      }
    },
    doorway: {
      kittenAnchor: DOOR_CALIBRATION.kittenOutdoorAnchor,
      hubbyEntry: DOOR_CALIBRATION.hubbyOutdoorEntry,
      hubbyReturn: DOOR_CALIBRATION.hubbyOutdoorReturn,
      carryAnchor: DOOR_CALIBRATION.carryOutdoorAnchor,
      hotspot: DOOR_CALIBRATION.outdoorHotspot
    },
    objects: outdoorObjects,
    actorHeights: { player: 156, hubby: 184, naili: 70 },
    obstacles: [
      ...outdoorObjects.flatMap((object) => object.block ? [{ x1: object.block[0], x2: object.block[1], z1: object.block[2], z2: object.block[3] }] : []),
      { x1: 990, x2: 1018, z1: .20, z2: .285 },
      { x1: 0, x2: 82, z1: .03, z2: .27 }
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

export function isBlocked(scene, point, paddingX = 20, paddingZ = .03) {
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
  if (object.hitPolygons?.length) {
    return object.hitPolygons.some((polygon) => {
      let inside = false;
      for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
        const [x1, y1] = polygon[index];
        const [x2, y2] = polygon[previous];
        const crosses = (y1 > point.y) !== (y2 > point.y)
          && point.x < (x2 - x1) * (point.y - y1) / (y2 - y1) + x1;
        if (crosses) inside = !inside;
      }
      return inside;
    });
  }
  const [x1, y1, x2, y2] = object.hit;
  return point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2;
}
