#!/usr/bin/env node
import { build } from 'esbuild';
import { copyFile, mkdir, rm } from 'node:fs/promises';

async function main() {
  await rm('dist', { recursive: true, force: true });
  await mkdir('dist', { recursive: true });

  await build({
    entryPoints: ['mfe-vue.js'],
    outfile: 'dist/mfe-vue.js',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    sourcemap: false,
    minify: false,
    treeShaking: false,
    legalComments: 'none',
  });

  await copyFile('mfe-vue.css', 'dist/mfe-vue.css');
  console.log('Bundled mfe-vue.js + copied mfe-vue.css -> dist/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
