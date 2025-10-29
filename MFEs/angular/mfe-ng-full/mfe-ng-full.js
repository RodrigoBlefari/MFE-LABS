const bundleRegistry = new Map();
const styleRegistry = new Set();

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
      import(/* @vite-ignore */ `${normalized}main.js`).catch((err) => {
        bundleRegistry.delete(normalized);
        throw err;
      }),
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
  const host = resolveHost(outlet);
  const baseUrl = options.baseUrl ?? 'http://localhost:9400/';
  ensureStylesheet(baseUrl);
  await ensureBundle(baseUrl);

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
