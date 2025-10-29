#!/usr/bin/env node
/**
 * Simple build helper that copies the provided files into a dist/ folder.
 * Usage: node scripts/build-copy.mjs file-a.js file-b.html
 */
import { mkdir, rm, copyFile } from 'node:fs/promises';
import { join } from 'node:path';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/build-copy.mjs <file> [additional files]');
    process.exitCode = 1;
    return;
  }

  const distDir = 'dist';
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  for (const relative of args) {
    const destination = join(distDir, relative.split('/').pop());
    await copyFile(relative, destination);
  }

  console.log(`Copied ${args.length} file(s) to ${distDir}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
