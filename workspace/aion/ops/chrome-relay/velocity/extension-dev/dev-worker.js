// AION Track B dev service worker entry (built extension: src/dev/dev-worker.js).
// Loads the UNCHANGED worker (it registers its own listeners at import) and adds
// the dev native link. The open native port also keeps the MV3 worker alive.
import { __testing as worker } from '../background/service-worker.js';
import { createDevLink } from './dev-link.js';

const link = createDevLink({ chrome, run: (message) => worker.runChatGPTCommand(message) });
link.connect();
chrome.runtime.onStartup?.addListener(() => link.connect());
chrome.runtime.onInstalled?.addListener(() => link.connect());
