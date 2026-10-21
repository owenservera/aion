// Curated prior corpus: field examples across naming conventions with their semantic role.
// This is the transfer-learning seed for the role classifier (level 1 → level 2). It is NOT
// derived from the evaluation fixtures; it encodes widely shared web/API conventions.
// [name, kind, format|null, avgLen|null, uniqueness|null, extra]
export const ROLES = ['id', 'reference', 'timestamp', 'title', 'text', 'url', 'measure', 'category', 'flag', 'count', 'metadata'];

export const PRIOR_FIELDS = [
  // identifiers
  ['id', 'string', 'uuid', 36, 1], ['uuid', 'string', 'uuid', 36, 1], ['_id', 'string', 'hex_id', 24, 1], ['key', 'string', null, 12, 1],
  ['slug', 'string', null, 20, 1], ['message_id', 'string', 'uuid', 36, 1], ['itemId', 'string', 'token_id', 20, 1], ['guid', 'string', 'uuid', 36, 1],
  ['id', 'integer', null, null, 1], ['pk', 'integer', null, null, 1], ['uid', 'string', 'hex_id', 16, 1], ['record_id', 'string', null, 14, 1],
  ['msg_id', 'string', 'token_id', 24, 1], ['node_id', 'string', 'token_id', 20, 1], ['sku', 'string', null, 10, 1], ['code', 'string', null, 6, 0.95],
  // references (foreign keys)
  ['conversation_id', 'string', 'uuid', 36, 0.1], ['parent_id', 'string', 'uuid', 36, 0.4], ['user_id', 'string', 'uuid', 36, 0.2], ['authorId', 'string', 'token_id', 20, 0.3],
  ['thread_id', 'string', 'uuid', 36, 0.1], ['project_id', 'integer', null, null, 0.1], ['ownerId', 'string', 'uuid', 36, 0.2], ['list_id', 'string', 'hex_id', 24, 0.1],
  ['channelId', 'string', 'token_id', 18, 0.1], ['order_id', 'integer', null, null, 0.3], ['customer', 'string', 'token_id', 18, 0.3], ['ref', 'string', null, 12, 0.3],
  // timestamps
  ['created_at', 'string', 'iso_time', 20, 0.9], ['updatedAt', 'string', 'iso_time', 24, 0.9], ['timestamp', 'integer', 'epoch_ms', null, 0.95], ['create_time', 'number', 'epoch_s', null, 0.95],
  ['date', 'string', 'iso_time', 10, 0.6], ['published', 'string', 'iso_time', 20, 0.9], ['ts', 'integer', 'epoch_s', null, 0.9], ['time', 'string', 'iso_time', 19, 0.9],
  ['modified', 'string', 'iso_time', 20, 0.9], ['expires', 'string', 'iso_time', 20, 0.5], ['dueAt', 'string', 'iso_time', 20, 0.8], ['last_seen', 'integer', 'epoch_s', null, 0.9],
  // titles / labels
  ['title', 'string', null, 40, 0.95], ['name', 'string', null, 18, 0.9], ['label', 'string', null, 16, 0.8], ['headline', 'string', null, 60, 0.98],
  ['subject', 'string', null, 45, 0.95], ['displayName', 'string', null, 16, 0.9], ['caption', 'string', null, 50, 0.9], ['heading', 'string', null, 30, 0.95],
  // long text
  ['text', 'string', null, 400, 1], ['content', 'string', 'markdown', 900, 1], ['body', 'string', null, 600, 1], ['message', 'string', null, 200, 0.98],
  ['description', 'string', null, 180, 0.95], ['summary', 'string', null, 160, 0.98], ['parts', 'string', null, 500, 1], ['completion', 'string', null, 700, 1],
  ['snippet', 'string', null, 140, 0.98], ['excerpt', 'string', null, 150, 0.98], ['comment', 'string', null, 120, 0.98], ['answer', 'string', 'markdown', 800, 1],
  // urls
  ['url', 'string', 'url', 50, 0.95], ['href', 'string', 'url', 40, 0.9], ['link', 'string', 'url', 45, 0.95], ['image', 'string', 'url', 60, 0.9],
  ['avatar_url', 'string', 'url', 60, 0.8], ['permalink', 'string', 'url', 55, 1], ['src', 'string', 'url', 50, 0.9], ['thumbnail', 'string', 'url', 60, 0.95],
  // measures (continuous, volatile numbers)
  ['price', 'number', null, null, 0.8, { volatile: true }], ['value', 'number', null, null, 0.7, { volatile: true }], ['amount', 'number', null, null, 0.7], ['score', 'number', null, null, 0.6],
  ['cpu', 'integer', null, null, 0.5, { volatile: true }], ['temperature', 'number', null, null, 0.6, { volatile: true }], ['rate', 'number', null, null, 0.6], ['latency_ms', 'integer', null, null, 0.7, { volatile: true }],
  ['balance', 'number', null, null, 0.8], ['weight', 'number', null, null, 0.6], ['percent', 'number', null, null, 0.5], ['change', 'number', null, null, 0.7, { volatile: true }],
  // categories / enums
  ['status', 'string', null, 8, 0.05, { enum: true }], ['role', 'string', null, 9, 0.02, { enum: true }], ['type', 'string', null, 8, 0.03, { enum: true }], ['kind', 'string', null, 7, 0.03, { enum: true }],
  ['state', 'string', null, 8, 0.05, { enum: true }], ['category', 'string', null, 10, 0.1, { enum: true }], ['priority', 'string', null, 6, 0.05, { enum: true }], ['stop_reason', 'string', null, 8, 0.05, { enum: true }],
  ['plan', 'string', null, 5, 0.05, { enum: true }], ['model', 'string', null, 12, 0.05, { enum: true }], ['language', 'string', null, 6, 0.1, { enum: true }], ['content_type', 'string', null, 6, 0.02, { enum: true }],
  // flags
  ['done', 'boolean'], ['is_active', 'boolean'], ['completed', 'boolean'], ['read', 'boolean'], ['enabled', 'boolean'], ['archived', 'boolean'], ['hidden', 'boolean'], ['pinned', 'boolean'],
  // counts
  ['count', 'integer', null, null, 0.4], ['total', 'integer', null, null, 0.4], ['page', 'integer', null, null, 0.3], ['views', 'integer', null, null, 0.7],
  ['likes', 'integer', null, null, 0.6], ['n', 'integer', null, null, 0.4], ['index', 'integer', null, null, 0.6], ['output_tokens', 'integer', null, null, 0.7],
  ['position', 'integer', null, null, 0.6], ['seq', 'integer', null, null, 0.95], ['size', 'integer', null, null, 0.7], ['length', 'integer', null, null, 0.7],
  // metadata / protocol noise
  ['version', 'string', null, 3, 0.05, { enum: true }], ['_type', 'string', null, 8, 0.02, { enum: true }], ['object', 'string', null, 10, 0.01, { enum: true }], ['__typename', 'string', null, 10, 0.02, { enum: true }],
  ['etag', 'string', 'hex_id', 32, 0.9], ['cursor', 'string', null, 24, 1], ['nonce', 'string', 'hex_id', 16, 1], ['trace_id', 'string', 'hex_id', 32, 1],
  ['o', 'string', null, 6, 0.05, { enum: true }], ['p', 'string', 'pointer', 20, 0.3], ['op', 'string', null, 6, 0.05, { enum: true }], ['path', 'string', 'pointer', 20, 0.3],
];

export const PRIOR_ROLES = [
  ...Array(16).fill('id'), ...Array(12).fill('reference'), ...Array(12).fill('timestamp'), ...Array(8).fill('title'), ...Array(12).fill('text'), ...Array(8).fill('url'),
  ...Array(12).fill('measure'), ...Array(12).fill('category'), ...Array(8).fill('flag'), ...Array(12).fill('count'), ...Array(12).fill('metadata'),
];
