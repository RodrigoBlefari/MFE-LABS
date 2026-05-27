#!/usr/bin/env node
import { build } from 'esbuild';
import { copyFile, mkdir, rm } from 'node:fs/promises';

async function main() {
  await rm('dist', { recursive: true, force: true });
  await mkdir('dist', { recursive: true });

  await build({
    entryPoints: ['remote-a.js'],
    outfile: 'dist/remote-a.js',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    sourcemap: false,
    minify: false,
    treeShaking: false,
    legalComments: 'none',
  });

  await copyFile('remote-a.css', 'dist/remote-a.css');
  console.log('Bundled remote-a.js + copied remote-a.css -> dist/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
