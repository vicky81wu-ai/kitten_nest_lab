import test from 'node:test';
import assert from 'node:assert/strict';
import { coverBox, projectCoordinate } from '../../v2/runtime/core/geometry.mjs';

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
