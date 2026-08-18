import { installDoorAwayIntegration } from './door-away-integration.js';
import { installDoorAwayFacingSync } from './door-away-facing.js';

installDoorAwayIntegration();
installDoorAwayFacingSync();
await import('./nestward-core.js');
