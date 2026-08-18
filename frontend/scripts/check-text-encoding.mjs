import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceExtensions = new Set(['.css', '.html', '.js', '.json', '.mjs', '.ts', '.vue']);
const ignoredDirectories = new Set(['dist', 'node_modules']);
const mojibakePatterns = [
  /\u00c3./u,
  /\u00c2./u,
  /\u00e2(?:\u20ac|\u0153|\u2020|\u2021|\u02c6|\u2030|\u0160|\u2039|\u0152|\u017d|\u2122|\u0161|\u203a|\u017e|\u0178)/u,
  /\ufffd/u,
];
const failures = [];

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await inspect(path);
      continue;
    }
    if (!sourceExtensions.has(extname(entry.name))) continue;
    const content = await readFile(path, 'utf8');
    const lines = content.split(/\r?\n/u);
    for (const [index, line] of lines.entries()) {
      if (mojibakePatterns.some((pattern) => pattern.test(line))) {
        failures.push(`${relative(root, path)}:${index + 1}`);
      }
    }
  }
}

await inspect(root);

if (failures.length > 0) {
  throw new Error(`Potential mojibake found:\n${failures.join('\n')}`);
}
