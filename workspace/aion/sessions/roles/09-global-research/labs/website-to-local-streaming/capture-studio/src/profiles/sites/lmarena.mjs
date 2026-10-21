// Best-effort selectors for LMArena; the generic heuristic in src/capture/actions.mjs must work without this file.
export default {
  id: 'lmarena',
  label: 'LMArena',
  hosts: ['lmarena.ai', 'chat.lmsys.org'],
  url: 'https://lmarena.ai/',
  composer: {
    selectors: [
      'textarea[data-testid="textbox"]',
      '#textbox',
      'textarea[placeholder*="message" i]',
      'div[contenteditable="true"][data-testid="textbox"]',
      '[contenteditable="true"]',
      '[role="textbox"]',
      'form textarea',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'both',
    buttonSelectors: [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send" i]',
      '#send-button',
      'form button[type="submit"]',
      '[role="button"][aria-label*="Send" i]',
      'button[type="submit"]',
    ],
  },
  assistant: {
    containerSelectors: [
      '[data-testid="chatbot"] .markdown',
      '[data-message-role="assistant"]',
      '.chatbot .prose',
      'main [class*="message" i] .markdown',
      'main .prose',
      '[class*="markdown"]',
      '.markdown',
    ],
    streamingSelectors: [
      '[data-testid="stop-button"]',
      'button[aria-label*="Stop" i]',
      '[class*="streaming" i]',
      '[class*="loading" i]',
      '[data-testid="chatbot"] [class*="cursor" i]',
    ],
    doneWhen: 'marker-gone',
  },
  preflight: {
    authWallSelectors: [
      '[data-testid="login-button"]',
      'a[href*="/login"]',
      'button[class*="login" i]',
      'form[action*="login"]',
      '[class*="sign-in" i]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: [
      '/api/stream/create-evaluation',
      '/api/stream/',
      '/api/chat',
    ],
    notes: 'LMArena may sit behind a Cloudflare interstitial and its evaluation calls are believed to stream as SSE (or Gradio SSE on chat.lmsys.org); transport and paths are unverified for the current build.',
  },
};
