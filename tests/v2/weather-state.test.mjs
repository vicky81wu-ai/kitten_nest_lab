import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTemperature,
  resolveWeatherState,
  weatherAdvice
} from '../../v2/runtime/core/weather-state.mjs';

test('weather display reads registered fields and labels fallback honestly', () => {
  const object = {
    readFields: { temperature: ['windowTemp'], description: ['windowDesc'] },
    fallbackTemperature: '28℃',
    fallbackDescription: 'Cloudy · preview'
  };
  assert.deepEqual(resolveWeatherState({ windowTemp: '31℃', windowDesc: 'Sunny' }, object), {
    temperature: '31℃',
    description: 'Sunny',
    temperatureField: 'windowTemp',
    descriptionField: 'windowDesc',
    sourceField: 'windowTemp,windowDesc'
  });
  assert.equal(resolveWeatherState({}, object).description, 'Cloudy · preview');
});

test('weather advice remains deterministic for temperature and conditions', () => {
  assert.equal(parseTemperature('-2.5℃'), -2.5);
  assert.match(weatherAdvice({ temperature: '28℃', description: 'Cloudy' }), /喝水/);
  assert.match(weatherAdvice({ temperature: '18℃', description: 'Rain' }), /伞/);
});
