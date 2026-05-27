const fs = require('fs');
const path = require('path');

const root = process.cwd();
const contractPath = path.join(root, 'shared-dependencies.contract.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function extractVersion(raw) {
  if (!raw) return null;
  const m = String(raw).match(/([0-9]+)(\.[0-9]+)?(\.[0-9]+)?/);
  if (!m) return null;
  const major = Number(m[1] || 0);
  const minor = Number((m[2] || '.0').slice(1));
  const patch = Number((m[3] || '.0').slice(1));
  return { major, minor, patch, raw: String(raw) };
}

function compare(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function fail(msg) {
  console.error(`[shared-deps] ERROR: ${msg}`);
  process.exitCode = 1;
}

function main() {
  if (!fs.existsSync(contractPath)) {
    fail(`Contract not found: ${contractPath}`);
    return;
  }

  const contract = readJson(contractPath);
  const libs = contract?.sharedPolicy?.libraries || [];
  const strict = !!contract?.sharedPolicy?.strictVersion;
  const groups = contract?.federationGroups || [];

  console.log('[shared-deps] Validating federation groups...');

  groups.forEach((group) => {
    const members = group.members || [];
    const rows = members.map((memberPath) => {
      const pkgPath = path.join(root, memberPath, 'package.json');
      if (!fs.existsSync(pkgPath)) {
        fail(`Missing package.json for member: ${memberPath}`);
        return { memberPath, deps: {} };
      }
      const pkg = readJson(pkgPath);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      return { memberPath, deps };
    });

    console.log(`\n[shared-deps] Group: ${group.name}`);

    libs.forEach((lib) => {
      const entries = rows
        .map((r) => ({
          memberPath: r.memberPath,
          declared: r.deps[lib] || null,
          parsed: extractVersion(r.deps[lib] || null),
        }))
        .filter((e) => e.declared);

      if (entries.length === 0) return;

      const majors = new Set(entries.map((e) => e.parsed?.major).filter((m) => Number.isFinite(m)));
      const baseline = entries[0].parsed;

      const line = entries
        .map((e) => `${e.memberPath}=${e.declared}`)
        .join(' | ');
      console.log(`  - ${lib}: ${line}`);

      if (majors.size > 1) {
        fail(`Major mismatch for ${lib} in group ${group.name}`);
        return;
      }

      if (strict && baseline) {
        entries.slice(1).forEach((e) => {
          if (!e.parsed) return;
          if (compare(baseline, e.parsed) !== 0) {
            fail(
              `Strict version mismatch for ${lib} in ${group.name}: ${entries[0].memberPath}=${entries[0].declared} vs ${e.memberPath}=${e.declared}`,
            );
          }
        });
      }
    });
  });

  if (!process.exitCode) {
    console.log('\n[shared-deps] OK: contract is compatible for declared federation groups.');
  }
}

main();
