const directionBetween = (fromX, toX, epsilon = .5) => {
  const delta = toX - fromX;
  return Math.abs(delta) > epsilon ? (delta > 0 ? 1 : -1) : null;
};

const DEFAULT_CONTROL_OWNER = 'world';

export function actorControlAllows(actor, owner = DEFAULT_CONTROL_OWNER) {
  return !actor.controlOwner || actor.controlOwner === owner;
}

export function claimActorControl(actor, owner) {
  if (!owner || !actorControlAllows(actor, owner)) return false;
  actor.controlOwner = owner;
  return true;
}

export function releaseActorControl(actor, owner) {
  if (!owner || actor.controlOwner !== owner) return false;
  actor.controlOwner = null;
  return true;
}

function firstHorizontalDirection(actor, route) {
  for (const point of route) {
    const direction = directionBetween(actor.x, point.x);
    if (direction) return direction;
  }
  return null;
}

function normalizeRoute(points) {
  if (!Array.isArray(points)) return [];
  return points
    .filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.z))
    .map((point) => ({ x: point.x, z: point.z }));
}

export function stopActorRoute(actor, options = {}) {
  if (!actorControlAllows(actor, options.owner || DEFAULT_CONTROL_OWNER)) return false;
  actor.path.length = 0;
  actor.walking = false;
  actor.travelDir = null;
  actor.routeFacing = null;
  actor.afterMove = null;
  return true;
}

export function setActorRoute(actor, points, afterMove = null, options = {}) {
  if (!actorControlAllows(actor, options.owner || DEFAULT_CONTROL_OWNER)) return [];
  const route = normalizeRoute(points);
  const facing = options.facing === 'segment' ? 'segment' : 'journey';
  const hasJourneyDirection = Object.prototype.hasOwnProperty.call(options, 'journeyDirection');
  const direction = facing === 'segment'
    ? firstHorizontalDirection(actor, route)
    : hasJourneyDirection
      ? options.journeyDirection
      : directionBetween(actor.x, route.at(-1)?.x ?? actor.x, 24);

  actor.path = route;
  actor.afterMove = afterMove || null;
  actor.routeFacing = route.length ? facing : null;
  actor.travelDir = route.length && facing === 'journey' ? direction : null;
  if (direction) actor.dir = direction;

  if (!route.length && afterMove) {
    actor.afterMove = null;
    afterMove();
  }
  return route;
}

function syncSegmentDirection(actor) {
  if (actor.routeFacing !== 'segment') return;
  const target = actor.path[0];
  if (!target) return;
  const direction = directionBetween(actor.x, target.x);
  if (direction) actor.dir = direction;
}

export function updateActorRoute(actor, delta, options = {}) {
  if (!actor.path.length) {
    actor.walking = false;
    options.onIdle?.(actor);
    return;
  }

  const target = actor.path[0];
  const dx = target.x - actor.x;
  const dz = (target.z - actor.z) * 520;
  const metric = Math.hypot(dx, dz);
  const step = actor.speed * delta;
  actor.walking = true;
  actor.step += delta * (options.stepRate || 8.5);

  if (actor.routeFacing === 'journey' && actor.travelDir) actor.dir = actor.travelDir;
  else {
    const threshold = actor.routeFacing === 'journey' ? 18 : .5;
    const direction = directionBetween(actor.x, target.x, threshold);
    if (direction) actor.dir = direction;
  }

  if (metric <= step + 1) {
    actor.x = target.x;
    actor.z = target.z;
    actor.path.shift();
    if (!actor.path.length) {
      actor.walking = false;
      actor.travelDir = null;
      actor.routeFacing = null;
      const callback = actor.afterMove;
      actor.afterMove = null;
      if (callback) callback();
    } else syncSegmentDirection(actor);
    options.onMoving?.(actor);
    return;
  }

  actor.x += dx / metric * step;
  actor.z += dz / metric * step / 520;
  options.onMoving?.(actor);
}
