import { BaseController } from '../core/base-controller.mjs';
import { resolveTextPortState } from '../core/text-state.mjs';
import { resolveWeatherState } from '../core/weather-state.mjs';
import { horizontalRevealTarget } from '../core/geometry.mjs';
import { interleaveSpeakerQueues, normalizeDialogueTurns } from '../core/dialogue-script.mjs';

export function textQueueFingerprint(queue = []) {
  return JSON.stringify(queue.map((item) => String(item ?? '')));
}

export class TextPortController extends BaseController {
  constructor(context) {
    super('textPort', context);
    this.ports = new Map();
    this.pendingRevealIds = new Set();
    this.ambientBubbleSessions = new Map();
    this.dialogueRuntimes = new Map();
    this.activeSceneId = null;
    this.boundPointer = (event) => this.handlePointer(event);
  }

  async mount() {
    await super.mount();
    this.layer = this.context.elements.textLayer;
    this.viewport = this.context.elements.sceneViewport;
    this.layer.addEventListener('pointerup', this.boundPointer);
    this.unsubscribeState = this.context.events.on('state:change', () => {
      if (this.context.currentSnapshot) this.reconcile(this.context.currentSnapshot);
    });
    this.unsubscribeLayout = this.context.events.on('layout:ready', () => {
      this.flushPendingReveals();
    });
  }

  async ready() {
    this.mark('ready');
  }

  createPort(object) {
    const element = document.createElement('button');
    const variant = object.variant || 'bubble';
    element.type = 'button';
    element.className = `v2-text-port v2-text-port--${variant}`;
    element.dataset.objectId = object.id;
    element.dataset.textPortId = object.id;
    element.dataset.requiresLayout = '1';
    element.setAttribute('aria-label', object.label || `${object.targetId || object.id} text`);
    element.setAttribute('aria-live', 'polite');
    this.layer.appendChild(element);
    const port = {
      object,
      element,
      queue: [],
      index: 0,
      visible: false,
      sourceField: '',
      overrideText: '',
      hasShown: false
    };
    this.ports.set(object.id, port);
    return port;
  }

  sync(port) {
    const stateController = this.context.controllers.get('state');
    const state = stateController.get() || {};
    if (port.object?.variant === 'weather') {
      port.weather = resolveWeatherState(state, port.object);
      port.queue = [`${port.weather.temperature}\n${port.weather.description}`];
      port.index = 0;
      port.sourceField = port.weather.sourceField;
      port.visible = true;
      port.hasRenderedState = true;
      this.render(port);
      return;
    }

    const source = stateController.source;
    const mayUseState = port.object.staticText || source !== 'degradedFallback' || port.object.allowDegradedFallback;
    const resolved = mayUseState
      ? resolveTextPortState(state, port.object)
      : { queue: [], index: 0, sourceField: '' };
    port.queue = resolved.queue;
    const resolvedIndex = port.queue.length ? resolved.index % port.queue.length : 0;
    port.index = resolvedIndex;
    port.sourceField = resolved.sourceField;
    if (!port.queue.length) port.visible = false;
    else if (this.isAmbientPort(port)) this.restoreAmbientSession(port, resolvedIndex);
    else if (!port.hasRenderedState) port.visible = port.object.initiallyVisible === true;
    if (port.visible && !this.isAmbientPort(port)) port.hasShown = true;
    port.hasRenderedState = true;
    this.render(port);
  }

  isAmbientPort(port) {
    if (!port || port.object?.variant === 'weather') return false;
    return this.dialogueGroupFor(port)?.mode !== 'conversation';
  }

  saveAmbientSession(port) {
    if (!this.isAmbientPort(port) || !port.queue.length) return;
    this.ambientBubbleSessions.set(port.object.id, {
      fingerprint: textQueueFingerprint(port.queue),
      index: port.index % port.queue.length,
      visible: Boolean(port.visible),
      hasShown: Boolean(port.hasShown)
    });
  }

  restoreAmbientSession(port, resolvedIndex = 0) {
    const fingerprint = textQueueFingerprint(port.queue);
    const saved = this.ambientBubbleSessions.get(port.object.id);
    if (saved?.fingerprint === fingerprint) {
      port.index = Math.max(0, Number(saved.index) || 0) % port.queue.length;
      port.visible = Boolean(saved.visible);
      port.hasShown = Boolean(saved.hasShown);
      return;
    }
    port.index = resolvedIndex;
    port.visible = port.object.initiallyVisible === true;
    port.hasShown = port.visible;
    this.saveAmbientSession(port);
  }

  render(port) {
    const text = port.overrideText || port.queue[port.index] || '';
    port.element.removeAttribute('data-layout-ready');
    if (port.object?.variant === 'weather') {
      const temperature = document.createElement('span');
      temperature.className = 'v2-weather__temperature';
      temperature.textContent = port.weather?.temperature || '';
      const description = document.createElement('span');
      description.className = 'v2-weather__description';
      description.textContent = port.weather?.description || '';
      port.element.replaceChildren(temperature, description);
    } else {
      port.element.textContent = text;
    }
    port.element.hidden = !port.visible || !text;
    port.element.dataset.stateField = port.sourceField || 'none';
    port.element.dataset.stateSource = this.context.controllers.get('state').source;
    port.element.dataset.visible = port.visible ? '1' : '0';
    if (!port.element.hidden && !this.context.isReconcilingScene) {
      this.context.controllers.get('layout')?.schedule('text-render');
    }
  }

  async reconcile(snapshot) {
    this.lastSnapshot = snapshot;
    if (snapshot.sceneId !== this.activeSceneId) {
      this.activeSceneId = snapshot.sceneId;
      this.pendingRevealIds.clear();
      this.dialogueRuntimes.clear();
    }
    const allowed = new Set(snapshot.allowedObjectIds);
    for (const [id, port] of this.ports) {
      if (!allowed.has(id)) {
        this.saveAmbientSession(port);
        port.element.remove();
        this.ports.delete(id);
        this.pendingRevealIds.delete(id);
      }
    }

    for (const id of snapshot.allowedObjectIds) {
      const object = this.context.manifest.objects[id];
      if (object?.kind !== 'textPort' || object.controller !== 'textPort') continue;
      const port = this.ports.get(id) || this.createPort(object);
      this.sync(port);
    }
    this.refreshActiveDialogues();
    this.mark('ready', snapshot.sceneId);
  }

  hide(id) {
    const port = this.ports.get(id);
    if (!port) return false;
    port.visible = false;
    this.pendingRevealIds.delete(id);
    this.render(port);
    this.saveAmbientSession(port);
    return true;
  }

  dialogueGroupFor(port) {
    const groupId = port?.object?.dialogueGroupId;
    if (!groupId) return null;
    return this.context.manifest?.dialogueGroups?.[groupId] || null;
  }

  dialogueTargetFor(group) {
    const targetId = group?.scriptTargetId;
    return targetId ? this.context.textTargetRegistry?.targets?.[targetId] || null : null;
  }

  dialogueRuntimeFor(groupId) {
    if (!this.dialogueRuntimes.has(groupId)) {
      this.dialogueRuntimes.set(groupId, {
        index: -1,
        activeMemberId: null,
        ended: false,
        lastAdvanceAt: Number.NEGATIVE_INFINITY
      });
    }
    return this.dialogueRuntimes.get(groupId);
  }

  conversationTurns(group) {
    const target = this.dialogueTargetFor(group);
    const stateController = this.context.controllers.get('state');
    const state = stateController?.get?.() || {};
    if (target && Array.isArray(state[target.field]) && state[target.field].length) {
      try {
        const turns = normalizeDialogueTurns(state[target.field], {
          speakers: target.speakers,
          maxTurns: target.maxTurns,
          maxTurnChars: target.maxTurnChars,
          maxChars: target.maxChars
        });
        if (turns.length) return { turns, sourceField: target.field };
      } catch (error) {
        console.warn(`[v2:textPort] Ignoring invalid dialogue state for ${group.id}: ${error.message}`);
      }
    }

    const speakers = group?.speakers || {};
    const order = Array.isArray(group?.legacySpeakerOrder)
      ? group.legacySpeakerOrder
      : Object.keys(speakers);
    const queues = Object.fromEntries(order.map((speaker) => [
      speaker,
      this.ports.get(speakers[speaker])?.queue || []
    ]));
    return {
      turns: interleaveSpeakerQueues(queues, order, {
        maxTurns: target?.maxTurns || 60,
        maxTurnChars: target?.maxTurnChars || 1000,
        maxChars: target?.maxChars || 12000
      }),
      sourceField: 'legacy:roundRobin'
    };
  }

  hideDialogueMembers(group) {
    (group?.members || []).forEach((memberId) => {
      const port = this.ports.get(memberId);
      if (!port) return;
      port.visible = false;
      port.overrideText = '';
      this.pendingRevealIds.delete(memberId);
      this.render(port);
    });
  }

  applyDialogueTurn(group, turn, runtime, sourceField) {
    const memberId = group?.speakers?.[turn.speaker];
    const activePort = this.ports.get(memberId);
    if (!activePort) return false;

    (group.members || []).forEach((candidateId) => {
      const port = this.ports.get(candidateId);
      if (!port) return;
      const active = candidateId === memberId;
      port.visible = active;
      port.overrideText = active ? turn.text : '';
      if (active) {
        port.hasShown = true;
        port.sourceField = sourceField;
        this.scheduleReveal(port);
      } else {
        this.pendingRevealIds.delete(candidateId);
      }
      this.render(port);
    });
    runtime.activeMemberId = memberId;
    return true;
  }

  nextDialogue(groupId) {
    const group = this.context.manifest?.dialogueGroups?.[groupId];
    if (!group || group.mode !== 'conversation' || group.ownerScene !== this.activeSceneId) return false;

    const runtime = this.dialogueRuntimeFor(groupId);
    const currentTime = this.context.now?.() ?? Date.now();
    const inputLockMs = Number.isFinite(group.inputLockMs) ? group.inputLockMs : 200;
    if (currentTime - runtime.lastAdvanceAt < inputLockMs) return false;
    runtime.lastAdvanceAt = currentTime;

    const { turns, sourceField } = this.conversationTurns(group);
    if (!turns.length) return false;

    if (runtime.ended) {
      runtime.index = -1;
      runtime.ended = false;
    }
    if (runtime.index >= turns.length - 1) {
      this.hideDialogueMembers(group);
      runtime.index = -1;
      runtime.activeMemberId = null;
      runtime.ended = true;
      return true;
    }

    runtime.index += 1;
    return this.applyDialogueTurn(group, turns[runtime.index], runtime, sourceField);
  }

  refreshActiveDialogues() {
    for (const [groupId, runtime] of this.dialogueRuntimes) {
      if (runtime.index < 0 || runtime.ended) continue;
      const group = this.context.manifest?.dialogueGroups?.[groupId];
      if (!group || group.ownerScene !== this.activeSceneId) continue;
      const { turns, sourceField } = this.conversationTurns(group);
      if (!turns.length || runtime.index >= turns.length) {
        this.hideDialogueMembers(group);
        runtime.index = -1;
        runtime.activeMemberId = null;
        runtime.ended = true;
        continue;
      }
      this.applyDialogueTurn(group, turns[runtime.index], runtime, sourceField);
    }
  }

  scheduleReveal(port) {
    const group = this.dialogueGroupFor(port);
    if (group) return;
    this.pendingRevealIds.add(port.object.id);
  }

  flushPendingReveals() {
    if (!this.pendingRevealIds.size || !this.viewport) return;
    if (document.body.dataset.scenePresentation !== 'panorama') {
      this.pendingRevealIds.clear();
      return;
    }

    const viewportRect = this.viewport.getBoundingClientRect();
    for (const id of [...this.pendingRevealIds]) {
      const port = this.ports.get(id);
      if (!port || port.element.hidden) {
        this.pendingRevealIds.delete(id);
        continue;
      }
      if (port.element.dataset.layoutReady !== '1') continue;
      const target = horizontalRevealTarget({
        viewportRect,
        elementRect: port.element.getBoundingClientRect(),
        scrollLeft: this.viewport.scrollLeft,
        scrollWidth: this.viewport.scrollWidth,
        clientWidth: this.viewport.clientWidth,
        padding: 16
      });
      if (Math.abs(target - this.viewport.scrollLeft) >= 1) this.viewport.scrollLeft = target;
      this.pendingRevealIds.delete(id);
    }
  }

  toggleNext(id) {
    const port = this.ports.get(id);
    const group = this.dialogueGroupFor(port);
    if (group?.mode === 'conversation') return this.nextDialogue(group.id);
    if (!port || !port.queue.length) return false;
    if (port.visible) {
      port.visible = false;
      this.pendingRevealIds.delete(id);
    } else {
      if (port.hasShown) {
        port.index = port.queue.length > 1 ? (port.index + 1) % port.queue.length : 0;
      }
      port.visible = true;
      port.hasShown = true;
      this.scheduleReveal(port);
    }
    this.render(port);
    this.saveAmbientSession(port);
    return true;
  }

  async handlePointer(event) {
    const element = event.target.closest?.('[data-text-port-id]');
    if (!element) return;
    event.preventDefault();
    event.stopPropagation();
    const port = this.ports.get(element.dataset.textPortId);
    if (port?.object.action) {
      try {
        await this.context.dispatch(port.object.action);
      } catch (error) {
        this.context.reportError(`textPort:${port.object.id}`, error);
      }
      return;
    }
    this.hide(element.dataset.textPortId);
  }

  async suspend(reason = 'suspend') {
    for (const port of this.ports.values()) {
      this.saveAmbientSession(port);
      port.element.remove();
    }
    this.ports.clear();
    this.pendingRevealIds.clear();
    this.dialogueRuntimes.clear();
    this.activeSceneId = null;
    this.mark('suspended', reason);
  }

  async destroy() {
    await this.suspend('destroy');
    this.ambientBubbleSessions.clear();
    this.layer.removeEventListener('pointerup', this.boundPointer);
    this.unsubscribeState?.();
    this.unsubscribeLayout?.();
    await super.destroy();
  }
}
