/**
 * Frontend build for the desktop bundle.
 *
 * Tauri's beforeBuildCommand would normally be `a && b`, but chaining through
 * cmd.exe is blocked in some locked-down environments ("Zugriff verweigert").
 * Doing both steps in one Node process avoids spawning a shell at all.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const run = (label, args) => {
  process.stdout.write(`\n[build] ${label}\n`);
  execFileSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
};

// 1. Inline Three.js for the standalone HTML exporter.
run('three bundle', [resolve(root, 'scripts/build-three-bundle.mjs')]);

// 2. Build the web assets.
run('vite build', [resolve(root, 'node_modules/vite/bin/vite.js'), 'build']);

process.stdout.write('\n[build] frontend ready\n');
