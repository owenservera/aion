// Best-effort selectors for Kimi; the generic heuristic in src/capture/actions.mjs must work without this file.
export default {
  id: 'kimi',
  label: 'Kimi',
  hosts: ['www.kimi.com', 'kimi.com', 'kimi.moonshot.cn'],
  url: 'https://www.kimi.com/',
  composer: {
    selectors: [
      'div[contenteditable="true"][data-lexical-editor]',
      '[class*="chat-input" i][contenteditable="true"]',
      '#chat-input',
      'div[contenteditable="true"]',
      '[role="textbox"]',
      'form textarea',
      'textarea',
    ],
    kind: 'contenteditable',
  },
  send: {
    strategy: 'both',
    buttonSelectors: [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send" i]',
      '[class*="send-button" i]',
      'form button[type="submit"]',
      'button[type="submit"]',
      '[role="button"][aria-label*="Send" i]',
    ],
  },
  assistant: {
    containerSelectors: [
      '[data-role="assistant"]',
      '[class*="segment-content" i]',
      '[class*="assistant" i] [class*="markdown" i]',
      'main [class*="message" i] .markdown',
      '[class*="markdown" i]',
      'main .prose',
    ],
    streamingSelectors: [
      'button[aria-label*="Stop" i]',
      '[data-testid="stop-button"]',
      '[class*="streaming" i]',
      '[class*="typing" i]',
      '[class*="loading" i]',
    ],
    doneWhen: 'marker-gone',
  },
  preflight: {
    authWallSelectors: [
      'a[href*="/login"]',
      '[class*="login" i] button',
      'form[action*="login"]',
      '[class*="sign-in" i]',
      '[class*="qrcode" i]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: [
      '/api/chat',
      '/completion/stream',
      '/apiv2/',
    ],
    notes: 'Kimi is believed to stream replies as SSE from a chat completion endpoint (with occasional WebSocket use in some builds); transport details are unverified.',
  },
};
