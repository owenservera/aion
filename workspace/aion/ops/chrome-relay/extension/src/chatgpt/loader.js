// Classic-script loader for the chatgpt.com content scripts.
//
// WHY THIS EXISTS: Chrome's manifest `content_scripts` entries cannot be ES modules, but content.js
// imports ../lib and ./correlate.js, and receive.js imports ../providers/chatgpt and ../lib. This
// tiny classic script dynamic-imports them instead; every file in their import closures is listed
// under `web_accessible_resources` in manifest.json (a Node test keeps that list honest). The
// imports run in the content script's isolated world.
//
// It does nothing else: content.js registers a port listener and acts only on commands from the
// extension; receive.js registers the read-only conversation receive port and reads only this
// tab's DOM. Neither entry can be reached by the page.
(async () => {
  try {
    await import(chrome.runtime.getURL('src/chatgpt/content.js'));
  } catch (error) {
    console.warn('[aion-relay] content module failed to load:', error);
  }
  try {
    await import(chrome.runtime.getURL('src/chatgpt/receive.js'));
  } catch (error) {
    console.warn('[aion-relay] receive module failed to load:', error);
  }
})();
