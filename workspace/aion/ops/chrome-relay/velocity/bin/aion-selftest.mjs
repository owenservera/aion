#!/usr/bin/env node
import {runLocalSelftest} from '../src/selftest.mjs';
const report=runLocalSelftest({print:r=>process.stderr.write(`${r.state} ${r.suite} (${r.elapsed_ms}ms)\n`)});
process.stdout.write(JSON.stringify(report,null,2)+'\n');
process.exitCode=report.all_pass?0:1;
