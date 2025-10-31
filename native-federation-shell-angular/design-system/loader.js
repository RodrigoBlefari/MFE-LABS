const DESIGN_SYSTEM_URL = new URL('../design-system.css', import.meta.url).href;

function hasLink(selector) {
  return Boolean(document.querySelector(selector));
}

export function ensureDesignSystem() {
  if (hasLink('link[data-design-system="native-fed"]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = DESIGN_SYSTEM_URL;
  link.dataset.designSystem = 'native-fed';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

export function ensureFontPreload() {
  if (hasLink('link[data-design-system-font="inter"]')) {
    return;
  }
  const googleFonts = document.createElement('link');
  googleFonts.rel = 'preconnect';
  googleFonts.href = 'https://fonts.googleapis.com';
  googleFonts.dataset.designSystemFont = 'inter';
  document.head.appendChild(googleFonts);

  const fontGstatic = document.createElement('link');
  fontGstatic.rel = 'preconnect';
  fontGstatic.href = 'https://fonts.gstatic.com';
  fontGstatic.crossOrigin = 'anonymous';
  fontGstatic.dataset.designSystemFont = 'inter';
  document.head.appendChild(fontGstatic);
}

export function ensureDesignTokens() {
  ensureFontPreload();
  ensureDesignSystem();
}
