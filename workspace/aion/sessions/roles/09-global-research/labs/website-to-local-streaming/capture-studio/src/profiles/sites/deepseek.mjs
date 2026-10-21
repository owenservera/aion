// Best-effort selectors for DeepSeek; the generic heuristic in src/capture/actions.mjs must work without this file.
export default {
  id: 'deepseek',
  label: 'DeepSeek',
  hosts: ['chat.deepseek.com', 'www.chat.deepseek.com'],
  url: 'https://chat.deepseek.com/',
  composer: {
    selectors: [
      'textarea#chat-input',
      '#chat-input',
      'textarea[placeholder*="Message" i]',
      'div[contenteditable="true"][data-lexical-editor="true"]',
      'div[contenteditable="true"]',
      '[role="textbox"]',
      'textarea',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'both',
    buttonSelectors: [
      'div[role="button"][aria-label*="Send" i]',
      'button[aria-label*="Send" i]',
      'button[data-testid="send-button"]',
      'div[class*="send"] button',
      '[aria-label*="Send" i]',
      'button[type="submit"]',
    ],
  },
  assistant: {
    containerSelectors: [
      'div[class*="ds-markdown"]',
      'div[class*="markdown"]',
      'div[data-message-author-role="assistant"]',
      'div[class*="_assistant"]',
      'div[class*="message"] div[class*="content"]',
      '[role="article"]',
    ],
    streamingSelectors: [
      'div[role="button"][aria-label*="Stop" i]',
      'button[aria-label*="Stop" i]',
      '[class*="streaming"]',
      '[class*="cursor"]',
      '[class*="loading"]',
      '[class*="typing"]',
    ],
    doneWhen: 'text-stable',
  },
  preflight: {
    authWallSelectors: [
      'div[class*="login" i] form',
      'form[action*="login"]',
      'button[class*="login" i]',
      'input[name="password"]',
      'a[href*="/sign_in"]',
      '[class*="login" i]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: [
      '/api/v0/chat/completion',
      '/api/v0/chat/',
      '/api/v0/users/',
    ],
    notes: 'DeepSeek streams replies over a fetch/SSE-style chunked response from POST /api/v0/chat/completion; unverified against the current build.',
  },
};
