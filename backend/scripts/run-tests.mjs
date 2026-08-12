import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import console from 'node:console';
import process from 'node:process';

const [kind, source = 'src'] = process.argv.slice(2);
if (kind !== 'unit' && kind !== 'integration') {
  console.error('usage: node scripts/run-tests.mjs <unit|integration> [source]');
  process.exit(2);
}
if (kind === 'integration' && !process.env.TEST_DATABASE_URL) {
  console.error('TEST_DATABASE_URL is required for integration tests');
  process.exit(2);
}

function collect(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? collect(path) : [path];
  });
}

const integrationSuffix = '.integration.test.ts';
const files = collect(resolve(source))
  .filter((file) => file.endsWith('.test.ts'))
  .filter((file) =>
    kind === 'integration' ? file.endsWith(integrationSuffix) : !file.endsWith(integrationSuffix),
  );

if (files.length === 0) process.exit(0);
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...files], {
  env: process.env,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
