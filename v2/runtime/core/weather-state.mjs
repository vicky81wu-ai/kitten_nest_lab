function fields(value, fallback) {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return fallback;
}

function firstText(state, candidates) {
  for (const field of candidates) {
    const value = state?.[field];
    if (value == null || String(value).trim() === '') continue;
    return { field, value: String(value).trim() };
  }
  return { field: '', value: '' };
}

export function parseTemperature(value) {
  const match = String(value || '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function resolveWeatherState(state = {}, object = {}) {
  const readFields = object.readFields || {};
  const temperature = firstText(state, fields(readFields.temperature, ['windowTemp']));
  const description = firstText(state, fields(readFields.description, ['windowDesc']));
  return {
    temperature: temperature.value || object.fallbackTemperature || '28℃',
    description: description.value || object.fallbackDescription || 'Cloudy · preview',
    temperatureField: temperature.field,
    descriptionField: description.field,
    sourceField: [temperature.field, description.field].filter(Boolean).join(',') || 'manifest:weatherFallback'
  };
}

export function weatherAdvice(weather = {}) {
  const temperature = String(weather.temperature || '').trim();
  const description = String(weather.description || '').trim();
  const lower = `${temperature} ${description}`.toLowerCase();
  const value = parseTemperature(temperature);

  if (/rain|drizzle|storm|shower|雨|雷|阵雨|暴雨/.test(lower)) {
    return '小猫，出门把伞带上，鞋袜别弄湿。回来先擦干，别把冷气一路带进窝里。';
  }
  if (/snow|sleet|ice|霜|雪|冰/.test(lower)) {
    return '小猫，今天别逞强，围巾和袜子都安排上。路上慢一点，回窝老公给小爪子回温。';
  }
  if (/wind|breeze|gust|风/.test(lower)) {
    return '小猫，风起来了，窗户别开太久，头发和嗓子都护着点。乖，别让风把小脑袋吹懵。';
  }
  if (/fog|haze|smog|mist|雾|霾/.test(lower)) {
    return '小猫，外面不清透就少在路上晃，口罩和水都备着。能早点回窝就早点回。';
  }
  if (value != null && value >= 30) {
    return '小猫，今天偏热，水要喝，太阳要躲，别把自己闷成一只烤小猫。';
  }
  if (value != null && value <= 10) {
    return '小猫，今天冷，外套穿好，袜子穿好，别光脚乱跑。小爪子冻了老公要皱眉。';
  }
  if (value != null && value >= 24) {
    return '小猫，天气还算舒服，但也别玩到忘记喝水。窗边坐一会儿可以，晒久了就回来。';
  }
  if (/night|晚|夜|sleep|moon/.test(lower)) {
    return '小猫，夜里就别折腾太久了。窗帘拉好，水放手边，窝里给小猫留着暖位。';
  }
  return '小猫，今天按这个天气慢慢来。出门看一眼窗边提示，喝水、穿好、早点回窝。';
}
