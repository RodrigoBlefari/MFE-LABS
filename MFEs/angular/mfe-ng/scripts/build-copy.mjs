#!/usr/bin/env node
import { build } from 'esbuild';
import { copyFile, mkdir, rm } from 'node:fs/promises';

async function main() {
  await rm('dist', { recursive: true, force: true });
  await mkdir('dist', { recursive: true });

  await build({
    entryPoints: ['mfe-ng.js'],
    outfile: 'dist/mfe-ng.js',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    sourcemap: false,
    minify: false,
    treeShaking: false,
    legalComments: 'none',
  });

  await copyFile('mfe-ng.css', 'dist/mfe-ng.css');
  console.log('Bundled mfe-ng.js + copied mfe-ng.css -> dist/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
