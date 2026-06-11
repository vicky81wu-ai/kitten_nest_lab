const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const stage = $('#stage');
const stageWrap = $('#stageWrap');
const sceneA = $('#sceneA');
const sceneB = $('#sceneB');
const mask = $('#transitionMask');
const dragBadge = $('#dragBadge');
const sceneList = $('#sceneList');
const sceneCount = $('#sceneCount');
const configOutput = $('#configOutput');

const sceneIdInput = $('#sceneIdInput');
const panModeSelect = $('#panModeSelect');
const maxXInput = $('#maxXInput');
const maxYInput = $('#maxYInput');
const transitionSelect = $('#transitionSelect');

let activeIndex = 0;
let activeLayer = sceneA;
let passiveLayer = sceneB;
let isTransitioning = false;
let dragState = null;

function svgScene({ title, subtitle, a, b, c, wide = false }) {
  const vb = wide ? '0 0 1600 900' : '0 0 707 1536';
  const width = wide ? 1600 : 707;
  const height = wide ? 900 : 1536;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${width}" height="${height}">
      <defs>
        <radialGradient id="g1" cx="38%" cy="22%" r="66%"><stop offset="0%" stop-color="${a}"/><stop offset="58%" stop-color="${b}"/><stop offset="100%" stop-color="${c}"/></radialGradient>
        <linearGradient id="glass" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,.34)"/><stop offset=".42" stop-color="rgba(255,255,255,.04)"/><stop offset="1" stop-color="rgba(255,255,255,.18)"/></linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="18"/></filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#g1)"/>
      <circle cx="18%" cy="18%" r="18%" fill="rgba(255,255,255,.18)" filter="url(#soft)"/>
      <circle cx="78%" cy="32%" r="22%" fill="rgba(255,220,180,.22)" filter="url(#soft)"/>
      <circle cx="58%" cy="76%" r="31%" fill="rgba(255,185,220,.15)" filter="url(#soft)"/>
      <path d="M0 ${height * .68} C ${width * .22} ${height * .59}, ${width * .44} ${height * .77}, ${width} ${height * .61} L ${width} ${height} L0 ${height}Z" fill="rgba(30,18,24,.36)"/>
      <rect x="${width * .08}" y="${height * .1}" width="${width * .84}" height="${height * .78}" rx="38" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="4"/>
      <path d="M${width * .08} ${height * .18} C ${width * .32} ${height * .1}, ${width * .56} ${height * .22}, ${width * .92} ${height * .13}" stroke="url(#glass)" stroke-width="16" fill="none"/>
      <text x="50%" y="46%" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Arial" font-size="${wide ? 70 : 48}" font-weight="800" fill="rgba(255,255,255,.88)">${title}</text>
      <text x="50%" y="52%" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Arial" font-size="${wide ? 28 : 24}" fill="rgba(255,255,255,.68)">${subtitle}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

let scenes = [
  {
    id: 'coffee_001_base',
    label: '咖啡角远景 / 环境图',
    src: svgScene({ title: 'coffee_001_base', subtitle: '远景：环境、窗、咖啡热气', a: '#ffd2bf', b: '#b987a6', c: '#24162b' }),
    panMode: 'static',
    defaultPosition: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    maxMove: { x: 0, y: 0 },
    transition: 'soft-fade',
    effects: ['steam', 'sparkles', 'warm-light']
  },
  {
    id: 'coffee_002_lap_closeup',
    label: '坐到 Alex 腿上 / 第一人称近景',
    src: svgScene({ title: 'coffee_002_lap_closeup', subtitle: '近景：手臂环脖子、暖光靠近', a: '#ffe0c0', b: '#c97891', c: '#1d1322' }),
    panMode: 'pan-y',
    defaultPosition: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    maxMove: { x: 0, y: 90 },
    transition: 'zoom-blur',
    effects: ['steam', 'warm-light']
  },
  {
    id: 'wide_window_test_001',
    label: '横向大图 pan-x 测试',
    src: svgScene({ title: 'wide_window_test_001', subtitle: '横图：只允许左右拖动', a: '#a8d9ff', b: '#8069c8', c: '#171c33', wide: true }),
    panMode: 'pan-x',
    defaultPosition: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    maxMove: { x: 180, y: 0 },
    transition: 'light-sweep',
    effects: ['sparkles']
  },
  {
    id: 'rain_glass_test_001',
    label: '雨雾玻璃感测试',
    src: svgScene({ title: 'rain_glass_test_001', subtitle: '雨 / 雾 / 玻璃叠层', a: '#d7e8ff', b: '#6a7fb1', c: '#131b2a' }),
    panMode: 'pan-xy',
    defaultPosition: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    maxMove: { x: 80, y: 120 },
    transition: 'dream-ripple',
    effects: ['rain-fog', 'sparkles']
  }
];

function currentScene() {
  return scenes[activeIndex];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function canMove(scene, axis) {
  if (scene.panMode === 'static') return false;
  if (scene.panMode === 'pan-xy') return true;
  return scene.panMode === `pan-${axis}`;
}

function applySceneToLayer(layer, scene) {
  layer.style.backgroundImage = `url("${scene.src}")`;
  layer.style.backgroundPosition = `calc(50% + ${scene.position.x}px) calc(50% + ${scene.position.y}px)`;
  layer.style.backgroundSize = 'cover';
  layer.dataset.sceneId = scene.id;
}

function setEffects(scene) {
  $$('.effect').forEach(el => el.classList.remove('on'));
  if (scene.effects.includes('steam')) $('#effectSteam').classList.add('on');
  if (scene.effects.includes('sparkles')) $('#effectSparkles').classList.add('on');
  if (scene.effects.includes('warm-light')) $('#effectWarm').classList.add('on');
  if (scene.effects.includes('rain-fog')) $('#effectRainFog').classList.add('on');
}

function renderSparkles() {
  const box = $('#effectSparkles');
  box.innerHTML = '';
  Array.from({ length: 30 }).forEach((_, i) => {
    const dot = document.createElement('i');
    dot.style.setProperty('--x', `${8 + Math.random() * 84}%`);
    dot.style.setProperty('--y', `${8 + Math.random() * 84}%`);
    dot.style.setProperty('--s', `${1.8 + Math.random() * 3.6}px`);
    dot.style.setProperty('--t', `${2.2 + Math.random() * 3.4}s`);
    dot.style.setProperty('--d', `${Math.random() * -4}s`);
    box.appendChild(dot);
  });
}

function renderSceneList() {
  sceneCount.textContent = `${scenes.length} scenes`;
  sceneList.innerHTML = '';
  scenes.forEach((scene, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `sceneItem ${index === activeIndex ? 'on' : ''}`;
    item.innerHTML = `
      <span class="sceneThumb" style="background-image:url('${scene.src}')"></span>
      <span class="sceneMeta">
        <span class="sceneName">${scene.id}</span>
        <span class="sceneSmall">${scene.label}</span>
      </span>
      <span class="sceneFx">${scene.panMode}</span>
    `;
    item.addEventListener('click', () => goToScene(index, scene.transition));
    sceneList.appendChild(item);
  });
}

function renderForm() {
  const scene = currentScene();
  sceneIdInput.value = scene.id;
  panModeSelect.value = scene.panMode;
  maxXInput.value = scene.maxMove.x;
  maxYInput.value = scene.maxMove.y;
  transitionSelect.value = scene.transition;
  $$('.toggleGrid input').forEach(input => {
    input.checked = scene.effects.includes(input.value);
  });
  dragBadge.textContent = `${scene.panMode} · x:${Math.round(scene.position.x)} y:${Math.round(scene.position.y)}`;
}

function renderConfig() {
  const cleanScenes = scenes.map(({ src, ...scene }) => ({
    ...scene,
    src: src.startsWith('blob:') || src.startsWith('data:') ? '[local-or-placeholder-image]' : src
  }));
  configOutput.textContent = JSON.stringify({
    lab: 'nest-motion-lab',
    goal: 'static image + css overlays + transitions + panning rules',
    activeSceneId: currentScene().id,
    scenes: cleanScenes
  }, null, 2);
}

function renderAll() {
  applySceneToLayer(activeLayer, currentScene());
  setEffects(currentScene());
  renderSceneList();
  renderForm();
  renderConfig();
}

function runMask(type) {
  mask.className = 'transitionMask';
  void mask.offsetWidth;
  if (['warm-mask', 'light-sweep', 'dark-fade', 'dream-ripple'].includes(type)) {
    mask.classList.add(type);
    window.setTimeout(() => {
      mask.className = 'transitionMask';
    }, 980);
  }
}

function goToScene(nextIndex, transition = currentScene().transition) {
  if (isTransitioning || nextIndex === activeIndex) return;
  isTransitioning = true;
  const nextScene = scenes[nextIndex];
  const leaving = activeLayer;
  const entering = passiveLayer;

  applySceneToLayer(entering, nextScene);
  stage.className = `stage transition-${transition}`;
  leaving.classList.add('leaving');
  entering.classList.add('entering');
  runMask(transition);

  window.setTimeout(() => {
    leaving.className = 'sceneLayer';
    entering.className = 'sceneLayer active';
    activeIndex = nextIndex;
    activeLayer = entering;
    passiveLayer = leaving;
    stage.className = 'stage';
    setEffects(nextScene);
    renderSceneList();
    renderForm();
    renderConfig();
    isTransitioning = false;
  }, 940);
}

function updateCurrentConfigFromForm() {
  const scene = currentScene();
  const oldId = scene.id;
  scene.id = sceneIdInput.value.trim() || oldId;
  scene.panMode = panModeSelect.value;
  scene.maxMove.x = Number(maxXInput.value) || 0;
  scene.maxMove.y = Number(maxYInput.value) || 0;
  scene.transition = transitionSelect.value;
  scene.effects = $$('.toggleGrid input:checked').map(input => input.value);
  scene.position.x = clamp(scene.position.x, -scene.maxMove.x, scene.maxMove.x);
  scene.position.y = clamp(scene.position.y, -scene.maxMove.y, scene.maxMove.y);
  renderAll();
}

function beginDrag(event) {
  const scene = currentScene();
  if (scene.panMode === 'static' || isTransitioning) return;
  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: scene.position.x,
    originY: scene.position.y
  };
  activeLayer.classList.add('dragging');
  stage.setPointerCapture(event.pointerId);
}

function moveDrag(event) {
  if (!dragState) return;
  const scene = currentScene();
  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;
  if (canMove(scene, 'x')) scene.position.x = clamp(dragState.originX + dx, -scene.maxMove.x, scene.maxMove.x);
  if (canMove(scene, 'y')) scene.position.y = clamp(dragState.originY + dy, -scene.maxMove.y, scene.maxMove.y);
  applySceneToLayer(activeLayer, scene);
  renderForm();
  renderConfig();
}

function endDrag(event) {
  if (!dragState) return;
  try { stage.releasePointerCapture(event.pointerId); } catch (_) {}
  activeLayer.classList.remove('dragging');
  dragState = null;
}

$('#prevScene').addEventListener('click', () => {
  const next = (activeIndex - 1 + scenes.length) % scenes.length;
  goToScene(next, currentScene().transition);
});

$('#nextScene').addEventListener('click', () => {
  const next = (activeIndex + 1) % scenes.length;
  goToScene(next, currentScene().transition);
});

$('#coffeeWalkIn').addEventListener('click', () => {
  const from = scenes.findIndex(scene => scene.id === 'coffee_001_base');
  const to = scenes.findIndex(scene => scene.id === 'coffee_002_lap_closeup');
  if (activeIndex !== from && from >= 0) {
    goToScene(from, 'soft-fade');
    window.setTimeout(() => goToScene(to, 'zoom-blur'), 1040);
  } else if (to >= 0) {
    goToScene(to, 'zoom-blur');
    window.setTimeout(() => runMask('warm-mask'), 120);
  }
});

$('#applyConfig').addEventListener('click', updateCurrentConfigFromForm);
$('#resetPan').addEventListener('click', () => {
  const scene = currentScene();
  scene.position = { ...scene.defaultPosition };
  renderAll();
});

$$('.toggleGrid input').forEach(input => input.addEventListener('change', updateCurrentConfigFromForm));
panModeSelect.addEventListener('change', updateCurrentConfigFromForm);
transitionSelect.addEventListener('change', updateCurrentConfigFromForm);
maxXInput.addEventListener('change', updateCurrentConfigFromForm);
maxYInput.addEventListener('change', updateCurrentConfigFromForm);
sceneIdInput.addEventListener('change', updateCurrentConfigFromForm);

$$('.ratioBtn').forEach(button => {
  button.addEventListener('click', () => {
    stageWrap.className = `stageWrap ${button.dataset.ratio}`;
  });
});

$('#debugToggle').addEventListener('click', () => document.body.classList.toggle('debug'));

$('#copyConfig').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(configOutput.textContent);
    $('#copyConfig').textContent = '已复制';
    window.setTimeout(() => $('#copyConfig').textContent = '复制', 900);
  } catch (_) {
    $('#copyConfig').textContent = '复制失败';
    window.setTimeout(() => $('#copyConfig').textContent = '复制', 900);
  }
});

$('#imageUpload').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const idBase = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_\-]+/g, '_').toLowerCase();
  scenes.push({
    id: `local_${idBase || 'image'}_${Date.now().toString().slice(-5)}`,
    label: `本地导入：${file.name}`,
    src: url,
    panMode: 'pan-xy',
    defaultPosition: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    maxMove: { x: 140, y: 140 },
    transition: 'zoom-blur',
    effects: []
  });
  goToScene(scenes.length - 1, 'zoom-blur');
  event.target.value = '';
});

stage.addEventListener('pointerdown', beginDrag);
stage.addEventListener('pointermove', moveDrag);
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('lostpointercapture', endDrag);

renderSparkles();
renderAll();
