    config: [
      {
        key: 'base_url',
        value: 'https://chatgpt.com',
      },
      {
        key: 'auth_type',
        value: 'email',
      },
    ],
  },
  {
    $schema: 'https://vivim.app/cap-store/v1/provider-manifest.schema.json',
    provider: {
      slug: 'claude',
      display_name: 'Claude',
      description: "Anthropic's Claude AI assistant",
      category: 'ai',
      provider_type: 'llm',
      website_url: 'https://claude.ai',
      documentation_url: 'https://docs.anthropic.com',
      auth_type: 'browser',
      has_multi_account: true,
      profile_strategy: 'per_account',
      fleet_config: {
        port_range: [9222, 9250],
        extra_args: ['--disable-features=Translate', '--no-first-run'],
      },
      capabilities: [
        'select_model',
        'send_message',
        'edit_message',
        'regenerate_response',
        'toggle_extended_thinking',
        'upload_file',
        'create_new_chat',
        'navigate_chat',
        'delete_chat',
        'rename_chat',
        'deep_research',
      ],
      accessTier: 'free',
    },
    endpoints: [
      {
        label: 'Landing',
        url: 'https://claude.ai',
        endpoint_type: 'landing',
        is_default: true,
      },
      {
        label: 'Chat',
        url: 'https://claude.ai/chat',
        endpoint_type: 'chat',
        selector: {
