export const CONTROLLER_LIFECYCLE = Object.freeze([
  'mount',
  'ready',
  'reconcile',
  'suspend',
  'destroy'
]);

export function assertControllerContract(id, controller) {
  const missing = CONTROLLER_LIFECYCLE.filter((method) => typeof controller?.[method] !== 'function');
  if (missing.length) {
    throw new Error(`Controller ${id} is missing lifecycle methods: ${missing.join(', ')}`);
  }
  return true;
}
