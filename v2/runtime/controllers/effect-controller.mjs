import { BaseController } from '../core/base-controller.mjs';

function hashSeed(value) {
  return [...String(value)].reduce((seed, char) => ((seed * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
}

function randomFactory(seed) {
  let value = seed || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export class EffectController extends BaseController {
  constructor(context) {
    super('effect', context);
    this.effects = new Map();
    this.timers = new Map();
  }

  async mount() {
    await super.mount();
    this.layer = this.context.elements.effectLayer;
  }

  async ready() {
    this.mark('ready');
  }

  createEffect(object) {
    const element = document.createElement('div');
    const type = object.effect?.type || 'sparkles';
    element.className = `v2-effect v2-effect--${type}`;
    element.dataset.objectId = object.id;
    element.dataset.effectId = object.id;
    element.dataset.requiresLayout = '1';
    element.setAttribute('aria-hidden', 'true');

    if (type === 'sparkles') this.fillSparkles(element, object);
    else if (type === 'jarSparkles') this.fillJarSparkles(element, object);
    else if (type === 'steam') this.fillSteam(element, object);
    else if (type === 'clockHands') this.fillClock(element, object);

    this.layer.appendChild(element);
    this.effects.set(object.id, element);
    return element;
  }

  fillSparkles(element, object) {
    const count = Number(object.effect?.count || 14);
    const random = randomFactory(hashSeed(object.id));
    for (let index = 0; index < count; index += 1) {
      const dot = document.createElement('i');
      dot.style.setProperty('--x', `${(random() * 100).toFixed(2)}%`);
      dot.style.setProperty('--y', `${(random() * 100).toFixed(2)}%`);
      dot.style.setProperty('--delay', `${(-random() * 4).toFixed(2)}s`);
      dot.style.setProperty('--duration', `${(2.2 + random() * 3.8).toFixed(2)}s`);
      dot.style.setProperty('--size', `${(1.5 + random() * 3.2).toFixed(2)}px`);
      element.appendChild(dot);
    }
  }

  fillJarSparkles(element, object) {
    const count = Number(object.effect?.count || 32);
    const random = randomFactory(hashSeed(object.id));
    const colors = [
      'rgba(255,221,132,.9)',
      'rgba(255,221,132,.88)',
      'rgba(255,178,218,.72)',
      'rgba(190,150,255,.68)',
      'rgba(164,205,255,.68)',
      'rgba(255,177,118,.72)'
    ];
    for (let index = 0; index < count; index += 1) {
      const dot = document.createElement('i');
      dot.style.setProperty('--x', `${(8 + random() * 84).toFixed(2)}%`);
      dot.style.setProperty('--y', `${(16 + random() * 74).toFixed(2)}%`);
      dot.style.setProperty('--size', `${(1.8 + random() * 1.4).toFixed(2)}px`);
      dot.style.setProperty('--duration', `${(3.6 + random() * 2.2).toFixed(2)}s`);
      dot.style.setProperty('--delay', `${(-random() * 4).toFixed(2)}s`);
      dot.style.setProperty('--color', colors[index % colors.length]);
      element.appendChild(dot);
    }
  }

  fillSteam(element, object) {
    const count = Number(object.effect?.count || 4);
    for (let index = 0; index < count; index += 1) {
      const wisp = document.createElement('i');
      wisp.style.setProperty('--index', String(index));
      wisp.style.setProperty('--delay', `${(-index * 0.72).toFixed(2)}s`);
      element.appendChild(wisp);
    }
  }

  fillClock(element, object) {
    ['hour', 'minute', 'second'].forEach((name) => {
      const hand = document.createElement('i');
      hand.className = `v2-clock-hand v2-clock-hand--${name}`;
      element.appendChild(hand);
    });
    const update = () => {
      const now = new Date();
      const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
      const minutes = now.getMinutes() + seconds / 60;
      const hours = (now.getHours() % 12) + minutes / 60;
      element.querySelector('.v2-clock-hand--hour').style.setProperty('--angle', `${hours * 30}deg`);
      element.querySelector('.v2-clock-hand--minute').style.setProperty('--angle', `${minutes * 6}deg`);
      element.querySelector('.v2-clock-hand--second').style.setProperty('--angle', `${seconds * 6}deg`);
    };
    update();
    this.timers.set(object.id, setInterval(update, 1000));
  }

  removeEffect(id) {
    this.effects.get(id)?.remove();
    this.effects.delete(id);
    const timer = this.timers.get(id);
    if (timer) clearInterval(timer);
    this.timers.delete(id);
  }

  async reconcile(snapshot) {
    this.lastSnapshot = snapshot;
    const allowed = new Set(snapshot.allowedObjectIds);
    for (const id of [...this.effects.keys()]) {
      if (!allowed.has(id)) this.removeEffect(id);
    }
    for (const id of snapshot.allowedObjectIds) {
      const object = this.context.manifest.objects[id];
      if (object?.kind !== 'effect' || object.controller !== 'effect') continue;
      if (!this.effects.has(id)) this.createEffect(object);
    }
    this.mark('ready', snapshot.sceneId);
  }

  async suspend(reason = 'suspend') {
    for (const id of [...this.effects.keys()]) this.removeEffect(id);
    this.mark('suspended', reason);
  }

  async destroy() {
    await this.suspend('destroy');
    await super.destroy();
  }
}
