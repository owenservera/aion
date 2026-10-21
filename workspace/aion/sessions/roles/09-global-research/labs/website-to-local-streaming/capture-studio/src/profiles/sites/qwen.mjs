// Best-effort selectors for Qwen; the generic heuristic in src/capture/actions.mjs must work without this file.
export default {
  id: 'qwen',
  label: 'Qwen Chat',
  hosts: ['chat.qwen.ai', 'www.chat.qwen.ai', 'qwen.ai'],
  url: 'https://chat.qwen.ai/',
  composer: {
    selectors: [
      'textarea#chat-input',
      'div[contenteditable="true"]#chat-input',
      '#chat-input',
      'textarea[placeholder*="How can I help" i]',
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
      'button[id*="send" i]',
      'button[type="submit"]',
      '[aria-label*="Send" i]',
      'button[class*="send" i]',
    ],
  },
  assistant: {
    containerSelectors: [
      'div[id^="message-"].assistant',
      'div[class*="chat-assistant"]',
      'div[class*="markdown-content"]',
      'div[class*="assistant"] div[class*="content"]',
      '[data-role="assistant"]',
      'div[class*="markdown"]',
    ],
    streamingSelectors: [
      'button[aria-label*="Stop" i]',
      'button[id*="stop" i]',
      '[class*="streaming"]',
      '[class*="generating"]',
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
      '/api/v1/auths/',
    ],
    notes: 'Qwen Chat replies appear to arrive as SSE chunks from POST /api/v2/chat/completions; unverified against the current build.',
  },
};
