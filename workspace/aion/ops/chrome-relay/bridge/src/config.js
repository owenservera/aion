// AION Relay Bridge — host configuration.
//
// Everything the native host is allowed to decide about the outside world lives
// here, and every safety-relevant value has a default that is safe when unset:
// an unknown extension id refuses every message, an unset allowlist contains
// exactly the one configured session root, and the agent is spawned by
// ABSOLUTE path (see AGENT_PATH below).
//
// Nothing here reads the environment on import and nothing here touches the
// registry, the filesystem outside a stat, or Chrome. Registration is
// owner-gated; this file exists so that the gated step has one reviewable
// source of truth.

/** Chrome native host name. Must match native-host/manifest.template.json. */
export const ACP_HOST_NAME = 'com.aion.relay';

/** ACP protocol version this bridge speaks (ACP v1). */
export const ACP_PROTOCOL_VERSION = 1;

/**
 * Absolute path to the ACP agent binary.
 *
 * WHY ABSOLUTE, and WHY FORWARD SLASHES — both halves are load-bearing:
 *
 *  - `opencode` on PATH is a PowerShell `.ps1` shim. `spawn('opencode')` does
 *    not run a shim, so it fails with ENOENT on this host. The absolute `.exe`
 *    is the only spawn form that has been observed to work.
 *  - In a JavaScript string literal a backslash is an ESCAPE. A Windows path
 *    written as `"C:\Users\...\opencode.exe"` silently loses characters at
 *    every `\n`, `\t`, `\b`, `\v`, `\0` and `\xNN` it passes through — the
 *    string looks right in review and points somewhere else at runtime.
 *    Forward slashes are valid in every Windows API path call and cannot be
 *    mangled this way, so they are the only accepted form (enforced by
 *    validateConfig below).
 */
export const AGENT_PATH = 'C:/Users/VIVIM.inc/AppData/Roaming/npm/node_modules/@opencode/cli/bin/opencode.exe';

/** Arguments that turn the agent binary into an ACP server. */
export const AGENT_ARGS = Object.freeze(['acp']);

/**
 * The single working directory sessions may be created in unless the owner
 * explicitly allowlists more. cwd is a SAFETY property (BRIDGE-DESIGN.md
 * section 6): the host fixes it, never the extension.
 */
export const DEFAULT_SESSION_CWD = 'C:/0-BlackBoxProject-0/AION';

/** Timeouts. `promptTimeoutMs: 0` means "no timeout; cancel is the way out". */
export const DEFAULT_TIMEOUTS = Object.freeze({
  spawnMs: 15_000,
  requestMs: 30_000,
  initializeMs: 30_000,
  promptMs: 0,
});

export const CONFIG_ERROR = Object.freeze({
  MISSING_EXTENSION_ID: 'missing_extension_id',
  AGENT_PATH_NOT_ABSOLUTE: 'agent_path_not_absolute',
  AGENT_PATH_BACKSLASH: 'agent_path_backslash',
  SESSION_CWD_NOT_ABSOLUTE: 'session_cwd_not_absolute',
  SESSION_CWD_BACKSLASH: 'session_cwd_backslash',
  BAD_ALLOWED_CWD: 'bad_allowed_cwd',
  BAD_PROTOCOL_VERSION: 'bad_protocol_version',
  BAD_HOST_NAME: 'bad_host_name',
});

/**
 * Normalise a path for comparison only — never for the filesystem.
 *
 * Backslashes are converted (a config file may legitimately carry them) and a
 * trailing separator is dropped, but nothing is resolved, expanded or
 * canonicalised: this function must not touch the disk, because a comparison
 * helper that stats a caller-supplied string is a path-traversal primitive.
 */
export function normalizePathForCompare(input) {
  if (typeof input !== 'string' || input === '') return null;
  return input.replace(/\\/g, '/').replace(/\/+$/, '') || '/';
}

/** Is this an absolute path on this platform, in either separator style? */
export function isAbsolutePath(input) {
  if (typeof input !== 'string' || input === '') return false;
  const forward = input.replace(/\\/g, '/');
  if (forward.includes('\0')) return false;
  return forward.startsWith('/') || /^[A-Za-z]:\//.test(forward);
}

/**
 * Does this path contain a `..` traversal segment?
 *
 * Compared paths must be literal roots, never a way to spell one.
 */
export function hasTraversalSegment(input) {
  const forward = String(input).replace(/\\/g, '/');
  return forward.split('/').some((segment) => segment === '..');
}

/**
 * Build a configuration object.
 *
 * `expectedExtensionId` has NO default. An unset extension id is a refusal, not
 * a wildcard: the host cannot decide "any caller will do" and start dispatching
 * tasks to an ACP agent.
 */
export function createConfig(overrides = {}) {
  const src = overrides && typeof overrides === 'object' ? overrides : {};
  return Object.freeze({
    hostName: pickString(src.hostName, ACP_HOST_NAME),
    /** Chrome extension id, e.g. `abcdefghijklmnop...` (32 chars, no scheme). */
    expectedExtensionId: pickString(src.expectedExtensionId, ''),
    agentPath: pickString(src.agentPath, AGENT_PATH),
    agentArgs: Object.freeze(Array.isArray(src.agentArgs) ? [...src.agentArgs] : [...AGENT_ARGS]),
    /** The ONLY cwd a session may be created in by default. */
    sessionCwd: pickString(src.sessionCwd, DEFAULT_SESSION_CWD),
    /** Additional roots the owner has explicitly approved. Empty by default. */
    allowedCwds: Object.freeze(Array.isArray(src.allowedCwds) ? src.allowedCwds.slice() : []),
    protocolVersion: Number.isInteger(src.protocolVersion) ? src.protocolVersion : ACP_PROTOCOL_VERSION,
    maxFrameBytes: Number.isInteger(src.maxFrameBytes) && src.maxFrameBytes > 0 ? src.maxFrameBytes : undefined,
    timeouts: Object.freeze({
      ...DEFAULT_TIMEOUTS,
      ...(src.timeouts && typeof src.timeouts === 'object' ? src.timeouts : {}),
    }),
    /** Identifies the host in envelopes it emits (`producer_node`). */
    nodeId: pickString(src.nodeId, `native-host:${ACP_HOST_NAME}`),
    logLevel: pickString(src.logLevel, 'debug'),
  });
}

/**
 * Validate a configuration. Returns errors instead of throwing so a caller can
 * report all of them; `assertValidConfig` throws for the startup path.
 */
export function validateConfig(config) {
  const errors = [];
  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['config must be an object'] };
  }

  if (typeof config.expectedExtensionId !== 'string' || config.expectedExtensionId.trim() === '') {
    errors.push(`${CONFIG_ERROR.MISSING_EXTENSION_ID}: expectedExtensionId is required — an unset extension id refuses every message`);
  }

  if (typeof config.agentPath !== 'string' || config.agentPath === '') {
    errors.push(`${CONFIG_ERROR.AGENT_PATH_NOT_ABSOLUTE}: agentPath is required`);
  } else {
    if (config.agentPath.includes('\\')) {
      errors.push(`${CONFIG_ERROR.AGENT_PATH_BACKSLASH}: agentPath must use forward slashes ("${config.agentPath}") — a backslash path in a JS string literal silently loses characters at every \\n, \\t, \\b, \\v`);
    }
    if (!isAbsolutePath(config.agentPath)) {
      errors.push(`${CONFIG_ERROR.AGENT_PATH_NOT_ABSOLUTE}: agentPath must be absolute, got "${config.agentPath}" — "opencode" on PATH is a .ps1 shim and spawn() fails on it`);
    }
    if (hasTraversalSegment(config.agentPath)) {
      errors.push(`${CONFIG_ERROR.AGENT_PATH_NOT_ABSOLUTE}: agentPath must not contain a ".." segment`);
    }
  }

  if (typeof config.sessionCwd !== 'string' || config.sessionCwd === '') {
    errors.push(`${CONFIG_ERROR.SESSION_CWD_NOT_ABSOLUTE}: sessionCwd is required`);
  } else {
    if (config.sessionCwd.includes('\\')) {
      errors.push(`${CONFIG_ERROR.SESSION_CWD_BACKSLASH}: sessionCwd must use forward slashes`);
    }
    if (!isAbsolutePath(config.sessionCwd) || hasTraversalSegment(config.sessionCwd)) {
      errors.push(`${CONFIG_ERROR.SESSION_CWD_NOT_ABSOLUTE}: sessionCwd must be an absolute, traversal-free path`);
    }
  }

  if (!Array.isArray(config.allowedCwds)) {
    errors.push(`${CONFIG_ERROR.BAD_ALLOWED_CWD}: allowedCwds must be an array`);
  } else {
    for (const candidate of config.allowedCwds) {
      if (typeof candidate !== 'string' || !isAbsolutePath(candidate) || hasTraversalSegment(candidate)) {
        errors.push(`${CONFIG_ERROR.BAD_ALLOWED_CWD}: allowlist entry must be an absolute, traversal-free path, got ${JSON.stringify(candidate)}`);
      }
    }
  }

  if (config.protocolVersion !== ACP_PROTOCOL_VERSION) {
    errors.push(`${CONFIG_ERROR.BAD_PROTOCOL_VERSION}: protocolVersion must be ${ACP_PROTOCOL_VERSION}, got ${JSON.stringify(config.protocolVersion)}`);
  }

  if (typeof config.hostName !== 'string' || !/^[a-z0-9_.-]+$/.test(config.hostName)) {
    errors.push(`${CONFIG_ERROR.BAD_HOST_NAME}: hostName must match /^[a-z0-9_.-]+$/`);
  }

  return { valid: errors.length === 0, errors };
}

/** Throwing form of validateConfig, for the startup path. */
export function assertValidConfig(config) {
  const { valid, errors } = validateConfig(config);
  if (!valid) throw new Error(`invalid bridge config:\n  - ${errors.join('\n  - ')}`);
  return config;
}

/** Every cwd this host is willing to hand to ACP: the session root plus owner additions. */
export function allowedCwdSet(config) {
  const set = new Set();
  if (config && typeof config.sessionCwd === 'string') {
    const normalised = normalizePathForCompare(config.sessionCwd);
    if (normalised) set.add(normalised);
  }
  if (config && Array.isArray(config.allowedCwds)) {
    for (const candidate of config.allowedCwds) {
      const normalised = normalizePathForCompare(candidate);
      if (normalised) set.add(normalised);
    }
  }
  return set;
}

/**
 * Is this cwd permitted?
 *
 * EXACT match against the allowlist, never a prefix test: `C:/AION` must not
 * admit `C:/AION-evil`, and a prefix check is exactly the bug that turns a
 * write-path allowlist into a write-path hole.
 *
 * @returns {{ allowed: boolean, code?: string, reason?: string, cwd?: string }}
 */
export function assertCwdAllowed(config, requested) {
  const normalised = normalizePathForCompare(requested);
  if (!normalised) {
    return { allowed: false, code: CONFIG_ERROR.BAD_ALLOWED_CWD, reason: 'cwd must be a non-empty string' };
  }
  if (!isAbsolutePath(normalised) || hasTraversalSegment(normalised)) {
    return {
      allowed: false,
      code: CONFIG_ERROR.BAD_ALLOWED_CWD,
      reason: `cwd must be absolute and traversal-free, got "${requested}"`,
    };
  }
  const allowed = allowedCwdSet(config);
  if (allowed.has(normalised)) return { allowed: true, cwd: normalised };

  return {
    allowed: false,
    code: CONFIG_ERROR.BAD_ALLOWED_CWD,
    reason: `cwd "${normalised}" is not in the host's allowlist (${[...allowed].join(', ') || 'empty'})`,
  };
}

function pickString(value, fallback) {
  return typeof value === 'string' && value !== '' ? value : fallback;
}