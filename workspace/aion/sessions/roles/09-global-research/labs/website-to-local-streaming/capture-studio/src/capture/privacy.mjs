// Single-user local-PC capture policy. This is a fidelity preference, not an
// authorization boundary: never use it to authorize a browser send or bind a
// network listener. The user can opt back into the older filtered behavior.
import { redactUrl, redactHeaders, scrubText, scrubSecrets } from './redact.mjs';

export const CAPTURE_MODES = Object.freeze(['local-raw', 'filtered']);

export function captureMode(profile = null, env = process.env) {
  const requested = env.CAPTURE_STUDIO_CAPTURE_MODE ?? profile?.capture?.privacyMode ?? 'local-raw';
  if (!CAPTURE_MODES.includes(requested)) {
    throw new Error('Invalid CAPTURE_STUDIO_CAPTURE_MODE: expected local-raw or filtered');
  }
  return requested;
}

export function capturePrivacy(profile = null, env = process.env) {
  const mode = captureMode(profile, env);
  const localRaw = mode === 'local-raw';
  return {
    mode,
    localRaw,
    url: (value) => localRaw ? value : redactUrl(value),
    headers: (headers) => localRaw ? (headers ? { ...headers } : undefined) : redactHeaders(headers),
    text: (value) => localRaw ? { text: value, redactions: [] } : scrubText(value),
    bytes: (bytes) => localRaw ? { bytes, redactions: [] } : scrubSecrets(bytes),
  };
}

// Authentication to the local Studio UI can be restored without altering the
// capture fidelity. In local-PC mode there is no one-time token login step.
// Host/Origin validation and 127.0.0.1-only binding are separate invariants.
export function requireLocalUiToken(env = process.env) {
  const mode = env.CAPTURE_STUDIO_UI_AUTH ?? 'off';
  if (!['off', 'token'].includes(mode)) throw new Error('Invalid CAPTURE_STUDIO_UI_AUTH: expected off or token');
  return mode === 'token';
}
