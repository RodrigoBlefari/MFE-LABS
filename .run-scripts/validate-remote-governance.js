const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const root = process.cwd();

function arg(name, fallback = null) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
}

const env = arg('env', process.env.MFE_ENV || 'dev');
const checkLive = arg('check-live', 'false') === 'true';
const manifestOverride = arg('manifest', null);

const policyPath = path.join(root, 'remote-governance.policy.json');
const remotesFile = manifestOverride || path.join(root, 'native-federation-shell-angular', `remotes.${env}.json`);
const outReport = path.join(root, '.run-logs', `remote-governance-report.${env}.json`);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function ensureLogsDir() {
  const dir = path.dirname(outReport);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function fail(msg, report) {
  report.errors.push(msg);
  console.error(`[remote-governance] ERROR: ${msg}`);
}

function headRequest(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const lib = u.protocol === 'https:' ? https : http;
      const req = lib.request(
        url,
        { method: 'HEAD', timeout: 4000 },
        (res) => {
          resolve({ ok: true, status: res.statusCode || 0, headers: res.headers || {} });
        },
      );
      req.on('error', (e) => resolve({ ok: false, error: e.message, status: 0, headers: {} }));
      req.on('timeout', () => {
        req.destroy(new Error('timeout'));
      });
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message, status: 0, headers: {} });
    }
  });
}

async function main() {
  const report = {
    env,
    remotesFile,
    checkLive,
    checkedAt: new Date().toISOString(),
    results: {},
    errors: [],
  };

  if (!fs.existsSync(policyPath)) {
    fail(`Policy file not found: ${policyPath}`, report);
  }
  if (!fs.existsSync(remotesFile)) {
    fail(`Remotes manifest not found: ${remotesFile}`, report);
  }
  if (report.errors.length) {
    ensureLogsDir();
    fs.writeFileSync(outReport, JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const policy = readJson(policyPath);
  const remotes = readJson(remotesFile);
  const envPolicy = policy?.environments?.[env];

  if (!envPolicy) {
    fail(`No environment policy found for env=${env}`, report);
  }
  if (!remotes?.remotes || typeof remotes.remotes !== 'object') {
    fail(`Invalid remotes payload in ${remotesFile}`, report);
  }
  if (report.errors.length) {
    ensureLogsDir();
    fs.writeFileSync(outReport, JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const ids = Object.keys(remotes.remotes);
  for (const id of ids) {
    const url = remotes.remotes[id];
    const r = { url, staticChecks: {}, liveChecks: null };
    report.results[id] = r;

    try {
      const u = new URL(url);
      const protocol = u.protocol;
      const host = u.hostname;

      const httpsOk = !envPolicy.requireHttps || protocol === 'https:';
      const hostOk = (envPolicy.allowedHosts || []).includes(host);

      r.staticChecks.requireHttps = httpsOk;
      r.staticChecks.allowedHost = hostOk;

      if (!httpsOk) fail(`[${id}] protocol must be https for env=${env}: ${url}`, report);
      if (!hostOk) fail(`[${id}] host not allowed (${host}) for env=${env}`, report);

      if (checkLive) {
        const head = await headRequest(url);
        r.liveChecks = head;
        if (!head.ok) {
          fail(`[${id}] HEAD failed: ${head.error || 'unknown error'}`, report);
        } else {
          const requiredHeaders = (envPolicy.requiredHeaders || []).map((h) => h.toLowerCase());
          const missing = requiredHeaders.filter((h) => !(h in (head.headers || {})));
          r.liveChecks.missingHeaders = missing;
          if (missing.length) {
            fail(`[${id}] missing required headers: ${missing.join(', ')}`, report);
          }
        }
      }
    } catch (e) {
      fail(`[${id}] invalid URL: ${url} (${e.message})`, report);
    }
  }

  ensureLogsDir();
  fs.writeFileSync(outReport, JSON.stringify(report, null, 2));

  if (report.errors.length) {
    console.error(`[remote-governance] FAILED with ${report.errors.length} error(s). Report: ${outReport}`);
    process.exit(1);
  }

  console.log(`[remote-governance] OK for env=${env}. Report: ${outReport}`);
}

main();
