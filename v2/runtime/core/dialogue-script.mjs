import '../../../shared/dialogue-script.js';

const api = globalThis.KittenNestDialogueScript;

if (!api) throw new Error('Kitten Nest dialogue script parser failed to initialize');

export const {
  normalizeDialogueTurns,
  parseDialogueScript,
  serializeDialogueScript,
  interleaveSpeakerQueues
} = api;
