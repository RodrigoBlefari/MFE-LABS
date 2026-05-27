#!/usr/bin/env node
import { build } from 'esbuild';
import { copyFile, mkdir, rm } from 'node:fs/promises';

async function main() {
  await rm('dist', { recursive: true, force: true });
  await mkdir('dist', { recursive: true });

  await build({
    entryPoints: ['mfe-react.js'],
    outfile: 'dist/mfe-react.js',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    sourcemap: false,
    minify: false,
    treeShaking: false,
    legalComments: 'none',
  });

  await copyFile('mfe-react.css', 'dist/mfe-react.css');
  console.log('Bundled mfe-react.js + copied mfe-react.css -> dist/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
