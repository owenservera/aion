// Best-effort selectors for Claude; the generic heuristic in src/capture/actions.mjs must work without this file.
export default {
  id: 'claude',
  label: 'Claude',
  hosts: ['claude.ai', 'www.claude.ai'],
  url: 'https://claude.ai/new',
  composer: {
    selectors: [
      'div[contenteditable="true"].ProseMirror',
      'fieldset div[contenteditable="true"]',
      'div[aria-label="Write your prompt to Claude"]',
      '[data-testid="chat-input"]',
      '[contenteditable="true"]',
      '[role="textbox"]',
      'textarea',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'both',
    buttonSelectors: [
      'button[aria-label="Send Message"]',
      'button[aria-label="Send message"]',
      'button[data-testid="send-button"]',
      'fieldset button[type="submit"]',
      '[aria-label*="Send" i]',
      'button[type="submit"]',
    ],
  },
  assistant: {
    containerSelectors: [
      'div[data-testid="conversation-turn"] .font-claude-response',
      'div[data-testid="chat-message-content"]',
      'div.font-claude-message',
      'div.font-claude-response',
      'div[class*="prose"]',
      '[data-is-streaming]',
    ],
    streamingSelectors: [
      'button[aria-label="Stop response"]',
      'button[aria-label*="Stop" i]',
      '[data-is-streaming="true"]',
      'div[class*="streaming"]',
      'span[class*="animate"]',
      '[class*="thinking"]',
    ],
    doneWhen: 'marker-gone',
  },
  preflight: {
    authWallSelectors: [
      'a[href*="/login"]',
      'button[data-testid="login-with-google"]',
      'form[action*="login"]',
      'input[name="email"]',
      '[class*="login" i]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: [
      '/completion',
      '/chat_conversations/',
      '/api/organizations/',
      '/retry_completion',
    ],
    notes: 'Claude replies stream via SSE from POST /api/organizations/<org>/chat_conversations/<uuid>/completion; the completion URL also carries retry variants, so this is unverified against the current build.',
  },
};
