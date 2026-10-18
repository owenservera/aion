// Classic-script loader for the chatgpt.com content script.
//
// WHY THIS EXISTS: Chrome's manifest `content_scripts` entries cannot be ES modules, but content.js
// imports ../lib and ./correlate.js. This tiny classic script dynamic-imports it instead; every file in
// content.js's import closure is listed under `web_accessible_resources` in manifest.json (a Node test
// keeps that list honest). The import runs in the content script's isolated world.
//
// It does nothing else: content.js registers a port listener and acts only on commands from the extension.
(async () => {
  try {
    await import(chrome.runtime.getURL('src/chatgpt/content.js'));
  } catch (error) {
    console.warn('[aion-relay] content module failed to load:', error);
  }
})();
