// Measured selectors for deepseek; the generic heuristic in src/capture/actions.mjs remains the fallback.
export default {
  id: 'deepseek',
  label: 'DeepSeek',
  hosts: ['chat.deepseek.com'],
  url: 'https://chat.deepseek.com/',
  composer: {
    selectors: [
      'textarea#chat-input',
      'div[contenteditable="true"][role="textbox"]',
      'textarea[placeholder*="发送消息" i]',
      'textarea[placeholder*="Send" i]',
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'enter',
    buttonSelectors: [
      'div[role="button"][aria-label*="发送" i]',
      'button[aria-label*="Send" i]',
      'button[type="submit"]',
    ],
  },
  assistant: {
    containerSelectors: [
      '[data-message-author-role="assistant"]',
      'div.ds-markdown',
      'div[class*="markdown"]',
      'article',
      '[data-testid*="assistant" i]',
    ],
    streamingSelectors: [
      'button[aria-label*="stop" i]',
      '[role="button"][aria-label*="stop" i]',
      '[data-testid="stop-button"]',
      '[aria-busy="true"]',
    ],
    doneWhen: 'text-stable',
  },
  preflight: {
    authWallSelectors: [
      'a[href*="/sign_in"]',
      'a[href*="/login"]',
      'form[action*="login"]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: ['/api/v0/chat/completion', '/api/v0/chat/create_pow_challenge'],
    notes: 'The probe reached only the landing view and captured GET /api/v0/client/settings plus POST /api/v0/chat/create_pow_challenge; the completion stream path is inferred and unverified, and the composer may need an existing conversation.',
  },
};
