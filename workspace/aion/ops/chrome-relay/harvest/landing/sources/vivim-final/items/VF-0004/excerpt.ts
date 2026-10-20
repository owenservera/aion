  },
  {
    id: 'coding_ide',
    name: 'Coding IDE',
    expectedCapabilities: {
      send_message: 'required',
      receive_message: 'required',
      code_execution: 'required',
      file_operations: 'extended',
      terminal: 'extended',
    },
    discoveryHints: {
      urlPatterns: ['ide', 'code', 'editor', 'playground'],
      domIndicators: [
        { selector: '.monaco-editor' },
        { selector: '[class*="code-editor"]' },
        { selector: 'textarea[class*="code"]' },
      ],
      interactiveElementPatterns: [
        { selector: '.monaco-editor textarea', action: 'type', priority: 1 },
        { selector: '[data-testid="run"]', action: 'click', priority: 2 },
      ],
    },
    projectionRules: {
      composer: {
        selector: '.monaco-editor textarea',
        mapping: { value: 'textContent' },
      },
      messageList: {
        selector: '[class*="message"], [role="log"] > *',
        mapping: { role: 'data-role', content: 'textContent' },
      },
    },
    parserExpectations: {
      responseFormat: 'json',
      parserArchetype: 'generic',
      fallbackStrategy: 'html_extract',
    },
  },
  {
    id: 'search_engine',
    name: 'Search Engine',
    expectedCapabilities: {
      search: 'required',
      results_display: 'required',
      result_click: 'optional',
    },
    discoveryHints: {
      urlPatterns: ['search', 'query', 'find'],
