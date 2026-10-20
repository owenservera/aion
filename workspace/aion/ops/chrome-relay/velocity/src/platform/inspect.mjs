// Standalone local design-seed inspection: no Bus, host, adapter or page calls.
import {readFileSync} from 'node:fs';
import {inspectPlatformSeed} from './semantics.mjs';
const defaultSeed = new URL('../../design/platform-semantic-seed.json', import.meta.url);
export function runPlatformInspect(args = [], {print = line => process.stdout.write(line + '\n'),
  readSeed = () => JSON.parse(readFileSync(defaultSeed, 'utf8'))} = {}) {
  if (!Array.isArray(args) || ![0, 1, 2].includes(args.length)
    || !['inspect','validate','--json',undefined].includes(args[0])
    || (args.length === 2 && args[1] !== '--json')
    || (args[0] === '--json' && args.length > 1)) {
    print(JSON.stringify({ok:false, code:'BAD_PLATFORM_COMMAND',
      usage:'aion platform [inspect|validate] [--json]'}));
    return 2;
  }
  try {
    const seed = readSeed();
    const info = inspectPlatformSeed(seed);
    if (args[0] === 'validate') {
      print(JSON.stringify(info.ok ? {
        ok:true, code:'SEED_VALID_DESIGN_ONLY', schema:info.schema,
        semantic_capabilities:info.semantic_capabilities.length,
        provider_examples:info.providers.length, execution_authority:false
      } : info));
    } else print(JSON.stringify(info));
    return info.ok ? 0 : 3;
  } catch (error) {
    print(JSON.stringify({ok:false,code:'PLATFORM_SEED_UNREADABLE',
      reason:error?.code ?? 'UNREADABLE_OR_INVALID_JSON'}));
    return 3;
  }
}
