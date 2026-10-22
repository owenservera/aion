// Thin authenticated-server surface over the shared lifecycle runtime. No browser logic here.
import { json, object, problem, storageName, text } from './http.mjs';

export async function defaultConversationRuntime(options) {
  const { createConversationRuntime } = await import('../capture/conversation-runtime.mjs');
  return createConversationRuntime(options);
}

export function validateConversationBody(kind, body) {
  object(body);
  const fields = { connect: ['site', 'targetId', 'freshTab'], submit: ['key', 'prompt', 'confirm', 'expectedRevision'], reconcile: ['expectedRevision'], finish: ['closeTab'] }[kind];
  if (Object.keys(body).some((key) => !fields.includes(key))) throw problem(400, 'Unexpected request field');
  if (kind === 'connect') {
    text(body.site, 'site', 128);
    if (body.targetId !== undefined) text(body.targetId, 'targetId', 256);
    if (body.freshTab !== undefined && typeof body.freshTab !== 'boolean') throw problem(400, 'freshTab must be boolean');
  }
  if (kind === 'submit') {
    text(body.key, 'key', 200); text(body.prompt, 'prompt', 2000);
    if (body.confirm !== true) throw problem(400, 'Explicit confirm:true required');
  }
  if (kind === 'submit' || kind === 'reconcile') {
    if (!Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 0) throw problem(400, 'expectedRevision must be a nonnegative integer');
  }
  if (kind === 'finish' && body.closeTab !== undefined && typeof body.closeTab !== 'boolean') throw problem(400, 'closeTab must be boolean');
  return body;
}

export function createConversationApi({ runtime }) {
  return { async handle(req, res, url, body = {}) {
    const p = url.pathname;
    if (p !== '/api/v1/conversation-targets' && p !== '/api/v1/conversations' && !p.startsWith('/api/v1/conversations/')) return false;
    let methods, run;
    if (p === '/api/v1/conversation-targets') {
      methods = ['GET']; run = async () => json(res, 200, await runtime.targets());
    } else if (p === '/api/v1/conversations') {
      methods = ['GET', 'POST'];
      run = async () => req.method === 'GET'
        ? json(res, 200, { conversations: await runtime.list() })
        : json(res, 201, { conversation: await runtime.connect(validateConversationBody('connect', body)) });
    } else {
      const match = /^\/api\/v1\/conversations\/([^/]+)(?:\/(turns|reconcile|finish))?$/.exec(p);
      if (!match) { json(res, 404, { error: 'Unknown conversation endpoint' }); return true; }
      let id;
      try { id = storageName(decodeURIComponent(match[1]), 'conversation'); } catch { throw problem(400, 'Invalid conversation id'); }
      const kind = match[2] === 'turns' ? 'submit' : match[2];
      methods = kind ? ['POST'] : ['GET'];
      run = async () => json(res, kind === 'submit' ? 202 : 200, { conversation: kind ? await runtime[kind](id, validateConversationBody(kind, body)) : await runtime.get(id) });
    }
    if (!methods.includes(req.method)) {
      res.setHeader('allow', methods.join(', ')); json(res, 405, { error: `${methods.join(' or ')} required` }); return true;
    }
    await run(); return true;
  } };
}
