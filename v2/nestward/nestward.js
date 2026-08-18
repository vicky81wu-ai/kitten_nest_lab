import { installDoorAwayIntegrationV2 } from './door-away-integration-v2.js';
import { installDoorTransitionIntegration } from './door-transition-integration.js';

installDoorAwayIntegrationV2();
installDoorTransitionIntegration();
await import('./nestward-core.js');
