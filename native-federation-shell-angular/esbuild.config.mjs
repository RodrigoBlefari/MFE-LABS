import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';

const outDir = new URL('./dist', import.meta.url).pathname;

await mkdir(outDir, { recursive: true });

await build({
  entryPoints: ['app.js'],
  outfile: join(outDir, 'app.bundle.js'),
  format: 'esm',
  bundle: true,
  splitting: false,
  sourcemap: true,
  target: ['es2022'],
  minify: true,
});

await Promise.all([
  copyFile('index.html', join(outDir, 'index.html')),
  copyFile('styles.css', join(outDir, 'styles.css')),
]);

console.log('esbuild: bundle gerado em dist/app.bundle.js');
