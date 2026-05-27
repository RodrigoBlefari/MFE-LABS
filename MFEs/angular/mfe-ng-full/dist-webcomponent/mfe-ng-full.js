const bundleRegistry = new Map();
const styleRegistry = new Set();
let heavyDepsPromise = null;

const HEAVY_DEP_URLS = [
  'https://esm.sh/lodash@4.17.21',
  'https://esm.sh/moment@2.30.1',
  'https://esm.sh/dayjs@1.11.13',
  'https://esm.sh/date-fns@4.1.0',
  'https://esm.sh/ramda@0.30.1',
  'https://esm.sh/mathjs@13.2.3',
  'https://esm.sh/three@0.168.0',
  'https://esm.sh/chart.js@4.4.4/auto',
  'https://esm.sh/echarts@5.5.1',
  'https://esm.sh/xlsx@0.18.5',
];

async function preloadHeavyDeps() {
  if (!heavyDepsPromise) {
    heavyDepsPromise = Promise.all(HEAVY_DEP_URLS.map((url) => import(url))).catch((err) => {
      heavyDepsPromise = null;
      throw err;
    });
  }
  return heavyDepsPromise;
}

function resolveHost(outlet) {
  if (outlet instanceof Element) {
    return outlet;
  }
  const surface = document.createElement('div');
  surface.className = 'mfe-surface';
  document.body.appendChild(surface);
  return surface;
}

async function ensureBundle(baseUrl) {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  if (!bundleRegistry.has(normalized)) {
    bundleRegistry.set(
      normalized,
      (async () => {
        const candidates = ['main.js', 'browser/main.js'];
        let lastError;
        for (const file of candidates) {
          try {
            return await import(/* @vite-ignore */ `${normalized}${file}`);
          } catch (err) {
            lastError = err;
          }
        }
        bundleRegistry.delete(normalized);
        throw lastError;
      })(),
    );
  }
  return bundleRegistry.get(normalized);
}

function ensureStylesheet(baseUrl) {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  if (styleRegistry.has(normalized)) {
    return;
  }
  const selector = `link[data-mfe-ng-full-style="${normalized}"]`;
  if (!document.querySelector(selector)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${normalized}styles.css`;
    link.dataset.mfeNgFullStyle = normalized;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
  styleRegistry.add(normalized);
}

export async function render(outlet, options = {}) {
  void preloadHeavyDeps();
  const host = resolveHost(outlet);
  const baseUrl = options.baseUrl ?? 'http://localhost:9400/';
  ensureStylesheet(baseUrl);
  await ensureBundle(baseUrl);
  await customElements.whenDefined('angular-full-mfe-card');

  const variant = options.variant ?? 'full';
  const metrics = options.metrics ?? {};

  const element = document.createElement('angular-full-mfe-card');
  element.variant = variant;
  element.metrics = metrics;
  host.appendChild(element);

  return {
    updateMetrics(next) {
      element.metrics = next ?? {};
    },
    destroy() {
      element.remove();
      if (!(outlet instanceof Element)) {
        host.remove();
      }
    },
  };
}

export function unmount(ctx = {}) {
  if (ctx && typeof ctx.destroy === 'function') {
    ctx.destroy();
  }
}
