// Best-effort selectors for MiniMax; the generic heuristic in src/capture/actions.mjs must work without this file.
export default {
  id: 'minimax',
  label: 'MiniMax Chat',
  hosts: ['chat.minimax.io', 'www.minimax.io'],
  url: 'https://chat.minimax.io/',
  composer: {
    selectors: [
      'textarea#chat-input',
      'textarea[placeholder*="message" i]',
      'div[contenteditable="true"][data-placeholder]',
      '[contenteditable="true"]',
      '[role="textbox"]',
      'form textarea',
      'textarea',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'both',
    buttonSelectors: [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send" i]',
      'form button[type="submit"]',
      '[class*="send" i][role="button"]',
      'button[type="submit"]',
      '[aria-label*="Send" i]',
    ],
  },
  assistant: {
    containerSelectors: [
      '[data-role="assistant"]',
      '[data-message-role="assistant"]',
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
      '[class*="auth" i] [role="button"]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: [
      '/v1/chat/completions',
      '/api/chat',
      '/completion/stream',
    ],
    notes: 'MiniMax chat is believed to stream replies as SSE over a POST chat-completion endpoint; exact path and framing are unverified.',
  },
};
