#!/usr/bin/env node
import { build } from 'esbuild';
import { copyFile, mkdir, rm } from 'node:fs/promises';

async function main() {
  await rm('dist', { recursive: true, force: true });
  await mkdir('dist', { recursive: true });

  await build({
    entryPoints: ['mfe-a.js'],
    outfile: 'dist/mfe-a.js',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    sourcemap: false,
    minify: false,
    treeShaking: false,
    legalComments: 'none',
  });

  await copyFile('mfe-a.css', 'dist/mfe-a.css');
  console.log('Bundled mfe-a.js + copied mfe-a.css -> dist/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
