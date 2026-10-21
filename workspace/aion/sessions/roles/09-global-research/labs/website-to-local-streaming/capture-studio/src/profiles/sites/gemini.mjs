// Best-effort selectors for Gemini; the generic heuristic in src/capture/actions.mjs must work without this file.
export default {
  id: 'gemini',
  label: 'Gemini',
  hosts: ['gemini.google.com', 'www.gemini.google.com'],
  url: 'https://gemini.google.com/app',
  composer: {
    selectors: [
      'rich-textarea div[contenteditable="true"]',
      'rich-textarea .ql-editor[contenteditable="true"]',
      'div.ql-editor[contenteditable="true"]',
      'div[aria-label="Enter a prompt here"]',
      'textarea[aria-label*="prompt" i]',
      '[contenteditable="true"]',
      '[role="textbox"]',
      'textarea',
    ],
    kind: 'auto',
  },
  send: {
    strategy: 'both',
    buttonSelectors: [
      'button[aria-label="Send message"]',
      'button.send-button[aria-label*="Send" i]',
      'button[mattooltip*="Send"]',
      'button[class*="send-button"]',
      '[aria-label*="Send" i]',
      'button[type="submit"]',
    ],
  },
  assistant: {
    containerSelectors: [
      'model-response message-content .markdown',
      'model-response .response-container-content',
      'message-content[class*="model"]',
      'div.model-response-text',
      'div[class*="response-container"]',
      'div.markdown',
    ],
    streamingSelectors: [
      'button[aria-label="Stop response"]',
      'button[aria-label*="Stop" i]',
      '.response-container[class*="loading"]',
      '[class*="streaming"]',
      'progress',
      '[class*="loading"]',
    ],
    doneWhen: 'marker-gone',
  },
  preflight: {
    authWallSelectors: [
      'a[href*="accounts.google.com/ServiceLogin"]',
      'a[href*="/signin"]',
      'button[data-testid="sign-in"]',
      'form[action*="signin"]',
      '[class*="sign-in" i]',
    ],
    requiresAuth: true,
  },
  streamHints: {
    urlPatterns: [
      'StreamGenerate',
      'BardChatUi',
      '/_/BardChatUi/data/',
      'GenerateContent',
    ],
    notes: 'Gemini replies arrive as a chunked batchexecute POST to /_/BardChatUi/data/.../StreamGenerate whose body is a length-prefixed JSON array (not plain SSE), so this transport description is unverified.',
  },
};
