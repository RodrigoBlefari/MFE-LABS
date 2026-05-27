#!/usr/bin/env node
import { build } from 'esbuild';
import { copyFile, mkdir, rm } from 'node:fs/promises';

async function main() {
  await rm('dist', { recursive: true, force: true });
  await mkdir('dist', { recursive: true });

  await build({
    entryPoints: ['mfe1.js'],
    outfile: 'dist/mfe1.js',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    sourcemap: false,
    minify: false,
    treeShaking: false,
    legalComments: 'none',
  });

  await copyFile('mfe1.css', 'dist/mfe1.css');
  console.log('Bundled mfe1.js + copied mfe1.css -> dist/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
