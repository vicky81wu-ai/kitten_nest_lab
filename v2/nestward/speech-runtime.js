const PLAYBACKS = new Set(['manual', 'auto', 'hybrid']);

function normalizeLine(line, fallbackSpeaker, fallbackDuration) {
  if (typeof line === 'string') return { speaker: fallbackSpeaker, text: line, duration: fallbackDuration };
  return {
    speaker: line.speaker || fallbackSpeaker,
    text: String(line.text || ''),
    duration: Number.isFinite(line.duration) ? line.duration : fallbackDuration
  };
}

export class SpeechRuntime {
  constructor(scripts = {}) {
    this.scripts = new Map();
    this.cursors = new Map();
    this.active = null;
    Object.entries(scripts).forEach(([id, script]) => this.register(id, script));
  }

  register(id, script) {
    if (!id || !Array.isArray(script?.lines) || !script.lines.length) throw new TypeError('Speech scripts need an id and at least one line.');
    const playback = PLAYBACKS.has(script.playback) ? script.playback : 'manual';
    const defaultSpeaker = script.speaker || 'hubby';
    const defaultDuration = Number.isFinite(script.duration) ? script.duration : 4200;
    this.scripts.set(id, {
      id,
      playback,
      loop: script.loop !== false,
      participants: Array.isArray(script.participants) && script.participants.length
        ? [...new Set(script.participants)]
        : [defaultSpeaker],
      lines: script.lines.map((line) => normalizeLine(line, defaultSpeaker, defaultDuration))
    });
    if (!this.cursors.has(id)) this.cursors.set(id, 0);
    return this;
  }

  owns(actorId) {
    return Boolean(this.active?.scriptId && this.active.participants.includes(actorId));
  }

  snapshot() {
    if (!this.active) return null;
    return {
      scriptId: this.active.scriptId,
      speaker: this.active.speaker,
      text: this.active.text,
      visible: this.active.visible,
      playback: this.active.playback,
      participants: [...this.active.participants],
      transient: this.active.transient,
      nextAt: this.active.nextAt
    };
  }

  activate(id, now = 0, options = {}) {
    const script = this.scripts.get(id);
    if (!script) return null;
    if (options.restart) this.cursors.set(id, 0);
    this.active = {
      scriptId: id,
      playback: script.playback,
      participants: script.participants,
      transient: false,
      visible: false,
      speaker: script.participants[0],
      text: '',
      nextAt: 0
    };
    return this.#showNext(script, now);
  }

  advance(now = 0) {
    if (!this.active?.scriptId) return null;
    const script = this.scripts.get(this.active.scriptId);
    return script ? this.#showNext(script, now) : null;
  }

  close() {
    if (!this.active) return null;
    this.active.visible = false;
    this.active.nextAt = 0;
    return { type: 'hide', state: this.snapshot() };
  }

  ambient(text, speaker = 'hubby', duration = 4200, now = 0) {
    this.active = {
      scriptId: null,
      playback: 'auto',
      participants: [speaker],
      transient: true,
      visible: true,
      speaker,
      text: String(text),
      nextAt: now + duration
    };
    return { type: 'show', state: this.snapshot() };
  }

  tick(now = 0) {
    if (!this.active?.visible || !this.active.nextAt || now < this.active.nextAt) return null;
    if (this.active.transient) {
      this.active.visible = false;
      this.active.nextAt = 0;
      return { type: 'hide', state: this.snapshot() };
    }
    return this.advance(now);
  }

  #showNext(script, now) {
    let index = this.cursors.get(script.id) || 0;
    if (index >= script.lines.length) {
      if (!script.loop) {
        this.active.visible = false;
        this.active.nextAt = 0;
        return { type: 'hide', complete: true, state: this.snapshot() };
      }
      index = 0;
    }
    const line = script.lines[index];
    const nextIndex = index + 1;
    this.cursors.set(script.id, nextIndex);
    this.active.visible = true;
    this.active.speaker = line.speaker;
    this.active.text = line.text;
    this.active.nextAt = script.playback === 'manual' ? 0 : now + line.duration;
    this.active.lastLine = nextIndex >= script.lines.length;
    return { type: 'show', state: this.snapshot() };
  }
}

