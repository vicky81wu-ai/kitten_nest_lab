(function exposeDialogueScript(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KittenNestDialogueScript = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDialogueScriptApi() {
  'use strict';

  function cleanSpeaker(value) {
    return String(value || '').trim().toLowerCase();
  }

  function dialogueOptions(options = {}) {
    const speakers = Array.isArray(options.speakers)
      ? options.speakers.map(cleanSpeaker).filter(Boolean)
      : [];
    return {
      speakers,
      maxTurns: Number.isFinite(options.maxTurns) ? Math.max(1, options.maxTurns) : 60,
      maxChars: Number.isFinite(options.maxChars) ? Math.max(1, options.maxChars) : 12000,
      maxTurnChars: Number.isFinite(options.maxTurnChars) ? Math.max(1, options.maxTurnChars) : 1000
    };
  }

  function assertSpeaker(speaker, options) {
    if (!speaker) throw new Error('Dialogue turn is missing a speaker.');
    if (options.speakers.length && !options.speakers.includes(speaker)) {
      throw new Error(`Unknown dialogue speaker @${speaker}. Allowed: ${options.speakers.map((id) => `@${id}`).join(', ')}`);
    }
  }

  function normalizeDialogueTurns(value, rawOptions = {}) {
    const options = dialogueOptions(rawOptions);
    if (!Array.isArray(value)) return [];
    const turns = [];
    let totalChars = 0;

    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const speaker = cleanSpeaker(item.speaker);
      const text = String(item.text || '').trim();
      if (!speaker || !text) continue;
      assertSpeaker(speaker, options);
      if (text.length > options.maxTurnChars) {
        throw new Error(`Dialogue turn for @${speaker} exceeds ${options.maxTurnChars} characters.`);
      }
      totalChars += text.length;
      if (totalChars > options.maxChars) {
        throw new Error(`Dialogue script exceeds ${options.maxChars} characters.`);
      }
      turns.push({ speaker, text });
      if (turns.length > options.maxTurns) {
        throw new Error(`Dialogue script exceeds ${options.maxTurns} turns.`);
      }
    }
    return turns;
  }

  function parseDialogueScript(value, rawOptions = {}) {
    const options = dialogueOptions(rawOptions);
    const source = String(value || '').replace(/\r\n?/g, '\n').trim();
    if (!source) throw new Error('Dialogue script is empty.');

    const turns = [];
    let speaker = '';
    let lines = [];

    function flush() {
      const text = lines.join('\n').trim();
      if (!speaker) {
        if (text) throw new Error('Dialogue text must start with a speaker marker such as @alex.');
        lines = [];
        return;
      }
      if (!text) throw new Error(`Dialogue turn for @${speaker} is empty.`);
      turns.push({ speaker, text });
      lines = [];
    }

    source.split('\n').forEach((line) => {
      const marker = line.match(/^\s*@([A-Za-z0-9_-]+)(?:\s+(.+))?\s*$/);
      if (!marker) {
        lines.push(line);
        return;
      }
      flush();
      speaker = cleanSpeaker(marker[1]);
      assertSpeaker(speaker, options);
      if (marker[2]) lines.push(marker[2]);
    });
    flush();

    return normalizeDialogueTurns(turns, options);
  }

  function serializeDialogueScript(value, options = {}) {
    return normalizeDialogueTurns(value, options)
      .map((turn) => `@${turn.speaker}\n${turn.text}`)
      .join('\n\n');
  }

  function interleaveSpeakerQueues(queues = {}, speakerOrder = [], rawOptions = {}) {
    const order = speakerOrder.map(cleanSpeaker).filter(Boolean);
    const normalizedQueues = Object.fromEntries(order.map((speaker) => [
      speaker,
      Array.isArray(queues[speaker])
        ? queues[speaker].map((text) => String(text || '').trim()).filter(Boolean)
        : []
    ]));
    const longest = order.reduce((max, speaker) => Math.max(max, normalizedQueues[speaker].length), 0);
    const turns = [];
    for (let index = 0; index < longest; index += 1) {
      order.forEach((speaker) => {
        const text = normalizedQueues[speaker][index];
        if (text) turns.push({ speaker, text });
      });
    }
    return normalizeDialogueTurns(turns, { ...rawOptions, speakers: order });
  }

  return {
    normalizeDialogueTurns,
    parseDialogueScript,
    serializeDialogueScript,
    interleaveSpeakerQueues
  };
});
