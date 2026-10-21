// Best-effort selectors for Z.ai; the generic heuristic in src/capture/actions.mjs must work without this file.
export default {
  id: 'zai',
  label: 'Z.ai',
  hosts: ['chat.z.ai', 'www.chat.z.ai', 'z.ai'],
  url: 'https://chat.z.ai/',
  composer: {
    selectors: [
      'textarea#chat-input',
      'div[contenteditable="true"]#chat-input',
      '#chat-input',
      'textarea[placeholder*="Send" i]',
      'div[contenteditable="true"]',
      '[role="textbox"]',
      'textarea',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'both',
    buttonSelectors: [
      'button#send-message-button',
      'button[aria-label*="Send" i]',
      'button[type="submit"]',
      'div[class*="send"] button',
      '[aria-label*="Send" i]',
      'button[class*="send" i]',
    ],
  },
  assistant: {
    containerSelectors: [
      'div[id^="message-"].chat-assistant',
      'div[class*="chat-assistant"]',
      'div[class*="markdown-prose"]',
      'div[class*="assistant"] div[class*="content"]',
      '[data-message-role="assistant"]',
      'div[class*="markdown"]',
    ],
    streamingSelectors: [
      'button[aria-label*="Stop" i]',
      'button[id*="stop" i]',
      '[class*="streaming"]',
      '[class*="is-generating"]',
      '[class*="loading"]',
      '[class*="typing"]',
    ],
    doneWhen: 'text-stable',
  },
  preflight: {
    authWallSelectors: [
      'form[action*="signin"]',
      'form[action*="login"]',
      'button[class*="login" i]',
      'input[name="password"]',
      'a[href*="/auth"]',
      '[class*="login" i]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: [
      '/api/v2/chat/completions',
      '/api/v2/chat',
      '/api/v1/models',
    ],
    notes: 'Z.ai appears to stream replies as SSE data frames from POST /api/v2/chat/completions; unverified against the current build.',
  },
};
