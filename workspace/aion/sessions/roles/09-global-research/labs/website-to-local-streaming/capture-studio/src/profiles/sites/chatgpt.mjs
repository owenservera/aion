// Best-effort selectors for ChatGPT; the generic heuristic in src/capture/actions.mjs must work without this file.
export default {
  id: 'chatgpt',
  label: 'ChatGPT',
  hosts: ['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com'],
  url: 'https://chatgpt.com/',
  composer: {
    selectors: [
      '#prompt-textarea',
      'form div[contenteditable="true"]',
      'div.ProseMirror[contenteditable="true"]',
      'textarea[data-id="root"]',
      '[contenteditable="true"]',
      '[role="textbox"]',
      'textarea',
      '[contenteditable="true"][id*="prompt" i]',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'both',
    buttonSelectors: [
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      '#composer-submit-button',
      'form button[type="submit"]',
      '[aria-label*="Send" i]',
      'button[type="submit"]',
    ],
  },
  assistant: {
    containerSelectors: [
      '[data-message-author-role="assistant"]',
      '[data-testid^="conversation-turn-"] .markdown',
      'div.agent-turn div.markdown',
      'article[data-testid^="conversation-turn"]',
      'main div.markdown',
      '[class*="markdown"]',
    ],
    streamingSelectors: [
      '[data-testid="stop-button"]',
      'button[aria-label="Stop streaming"]',
      'button[aria-label*="Stop" i]',
      '.result-streaming',
      '[class*="streaming"]',
      '[class*="loading"]',
    ],
    doneWhen: 'marker-gone',
  },
  preflight: {
    authWallSelectors: [
      '[data-testid="login-button"]',
      'a[href*="/auth/login"]',
      'button[data-testid="welcome-login"]',
      'form[action*="login"]',
      '[class*="login" i]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: [
      '/backend-api/conversation',
      '/backend-api/f/conversation',
      '/backend-api/conversation/init',
      '/backend-anon/conversation',
    ],
    notes: 'ChatGPT streams replies as server-sent events (SSE) over POST to /backend-api/conversation; payload shape changes often, so treat this as best-effort and unverified for the current build.',
  },
};
