import test from 'node:test';
import assert from 'node:assert/strict';
import {
  coverBox,
  horizontalFocusTarget,
  horizontalRevealTarget,
  projectCoordinate
} from '../../v2/runtime/core/geometry.mjs';

test('coverBox projects a portrait image through object-fit cover', () => {
  const box = coverBox(
    { left: 10, top: 20, width: 390, height: 844 },
    { width: 852, height: 1846 }
  );
  assert.ok(box);
  assert.ok(Math.abs(box.width - 390) < 0.001);
  assert.ok(box.height > 844);
  assert.ok(box.top < 20);
});

test('center coordinates remain relative to the base image', () => {
  const placement = projectCoordinate({
    imageBox: { left: 0, top: -2, width: 390, height: 848 },
    stageRect: { left: 0, top: 0 },
    coordinate: { anchor: 'center', x: 0.5, y: 0.5, width: 0.2, height: 0.1 },
    elementSize: { width: 78, height: 84.8 }
  });
  assert.equal(placement.left, 156);
  assert.equal(placement.width, 78);
  assert.ok(Math.abs(placement.top - 379.6) < 0.001);
});

test('baselineTop keeps baseline copy fixed while taller text grows upward', () => {
  const placement = projectCoordinate({
    imageBox: { left: 0, top: 0, width: 400, height: 800 },
    stageRect: { left: 0, top: 0 },
    coordinate: { anchor: 'baselineTop', x: 0.3, y: 0.1, width: 0.4 },
    elementSize: { width: 160, height: 90 },
    baselineHeight: 50
  });
  assert.equal(placement.top, 40);
});

test('content-sized panorama bubbles center from their measured width', () => {
  const placement = projectCoordinate({
    imageBox: { left: 0, top: 0, width: 1200, height: 800 },
    stageRect: { left: 0, top: 0 },
    coordinate: { anchor: 'center', x: 0.6, y: 0.3 },
    elementSize: { width: 300, height: 80 }
  });
  assert.equal(placement.left, 570);
  assert.equal(placement.top, 200);
  assert.equal(placement.width, 0);
});

test('panorama reveal target keeps a newly opened bubble inside the viewport', () => {
  assert.equal(horizontalRevealTarget({
    viewportRect: { left: 0, right: 393 },
    elementRect: { left: -66, right: 54 },
    scrollLeft: 466,
    scrollWidth: 1278,
    clientWidth: 393,
    padding: 16
  }), 384);

  assert.equal(horizontalRevealTarget({
    viewportRect: { left: 0, right: 393 },
    elementRect: { left: 337, right: 540 },
    scrollLeft: 506,
    scrollWidth: 1278,
    clientWidth: 393,
    padding: 16
  }), 669);
});

test('panorama group focus centers one authored image coordinate and clamps its edges', () => {
  const centered = horizontalFocusTarget({
    focusX: 0.51,
    scrollWidth: 1278,
    clientWidth: 393
  });
  assert.ok(Math.abs(centered - 455.28) < 0.001);
  assert.equal(horizontalFocusTarget({ focusX: 0, scrollWidth: 1278, clientWidth: 393 }), 0);
  assert.equal(horizontalFocusTarget({ focusX: 1, scrollWidth: 1278, clientWidth: 393 }), 885);
  assert.equal(horizontalFocusTarget({ focusX: 'invalid', scrollWidth: 1278, clientWidth: 393 }), 442.5);
});
