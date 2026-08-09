import { readFile } from 'node:fs/promises';
import { assertControllerContract } from '../v2/runtime/core/contracts.mjs';
import { assertManifest } from '../v2/runtime/core/manifest.mjs';
import { createControllers } from '../v2/runtime/controllers/index.mjs';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const manifest = await readJson('../v2/data/nest-manifest.v2.json');
const textTargets = await readJson('../data/text-targets.v1.json');
const validation = assertManifest(manifest, textTargets);
const context = {
  manifest,
  elements: {},
  events: { on: () => () => {}, emit: () => {} },
  setControllerStatus: () => {},
  controllerStatuses: new Map(),
  reportError: () => {}
};
const controllers = createControllers(context);

for (const [id, controller] of controllers) assertControllerContract(id, controller);

console.log(JSON.stringify({
  ok: true,
  manifestVersion: manifest.version,
  status: manifest.status,
  scenes: Object.keys(manifest.scenes),
  objects: Object.keys(manifest.objects).length,
  controllers: [...controllers.keys()],
  warnings: validation.warnings
}, null, 2));
