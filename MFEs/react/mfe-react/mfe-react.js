import React, { useMemo, useState } from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import { createRoot } from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/client/+esm';

const instances = new Map();
let elementDefined = false;

function ensureStylesheet() {
  if (document.querySelector('link[data-react-mfe-style]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./mfe-react.css', import.meta.url).href;
  link.dataset.reactMfeStyle = 'true';
  document.head.appendChild(link);
}

export function createOutlet({ mountPoint = document.body, append = false } = {}) {
  const surface = document.createElement('div');
  surface.classList.add('mfe-surface');
  if (append && mountPoint instanceof Element) {
    mountPoint.appendChild(surface);
  }
  return surface;
}

function cleanup(state) {
  if (!state) return;
  if (state.root) {
    state.root.unmount();
  }
  if (state.element?.isConnected) {
    state.element.remove();
  }
  if (state.detach && state.host?.isConnected) {
    state.host.remove();
  }
}

function ReactCard({ title, description, tagline, color = '#0ea5e9' }) {
  const [pings, setPings] = useState(0);
  const [latency] = useState(() => (Math.random() * 80 + 20).toFixed(0));

  const health = useMemo(
    () => [
      ['Disponibilidade', `${(Math.random() * 0.4 + 99.2).toFixed(2)}%`],
      ['Latencia media', `${latency} ms`],
      ['Ultimo ping', pings ? `ha ${Math.max(1, (Math.random() * 4).toFixed(0))}s` : '--'],
    ],
    [latency, pings],
  );

  const emitPing = () => {
    const next = pings + 1;
    setPings(next);
    window.dispatchEvent(
      new CustomEvent('BUS', {
        detail: {
          type: 'REACT-PING',
          payload: {
            count: next,
            source: 'React Federation Widget',
          },
        },
      }),
    );
  };

  return React.createElement(
    'section',
    { className: 'react-card', style: { borderColor: color } },
    React.createElement(
      'span',
      { className: 'react-badge' },
      React.createElement('span', null, 'React Web Component'),
    ),
    React.createElement('h2', null, title),
    React.createElement('p', null, description),
    React.createElement('p', null, tagline),
    React.createElement(
      'div',
      { className: 'react-health' },
      ...health.map(([label, value]) =>
        React.createElement(
          'span',
          { key: label },
          React.createElement('strong', null, label),
          React.createElement('span', null, value),
        ),
      ),
      React.createElement(
        'span',
        null,
        React.createElement('strong', null, 'Eventos enviados'),
        React.createElement('span', null, pings),
      ),
    ),
    React.createElement(
      'button',
      { type: 'button', onClick: emitPing },
      'Emitir BUS (React)',
    ),
  );
}

function defineElement() {
  if (elementDefined || customElements.get('react-mf-card')) {
    elementDefined = true;
    return;
  }

  class ReactMfeElement extends HTMLElement {
    static observedAttributes = ['title', 'description', 'tagline', 'color'];

    constructor() {
      super();
      this._props = {};
      this._root = null;
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      this._props[name] = newValue;
      this.update();
    }

    connectedCallback() {
      if (!this._root) {
        this._root = createRoot(this);
      }
      this.update();
    }

    disconnectedCallback() {
      if (this._root) {
        this._root.unmount();
        this._root = null;
      }
    }

    update() {
      if (!this._root) return;
      const props = {
        title: this._props.title ?? this.title ?? 'React Observability Widget',
        description:
          this._props.description ??
          this.description ??
          'React 18 rodando como Web Component, ideal para integracoes Nx com Module Federation.',
        tagline:
          this._props.tagline ??
          this.tagline ??
          'Criado com ReactDOM.createRoot + Custom Elements para isolamento leve.',
        color: this._props.color ?? this.color ?? '#0ea5e9',
      };
      this._root.render(React.createElement(ReactCard, props));
    }
  }

  customElements.define('react-mf-card', ReactMfeElement);
  elementDefined = true;
}

export async function render(outlet, options = {}) {
  ensureStylesheet();
  defineElement();

  if (outlet && !(outlet instanceof Element)) {
    throw new Error('React remote requer um elemento host valido.');
  }

  const {
    appendTo = document.body,
    replace = true,
    title = 'React Observability Widget',
    description = 'React 18 rodando como Web Component, ideal para integracoes Nx com Module Federation.',
    tagline = 'Criado com ReactDOM.createRoot + Custom Elements para isolamento leve.',
    color = '#0ea5e9',
  } = options;

  const hostProvided = outlet instanceof Element;
  const host = hostProvided ? outlet : createOutlet({ mountPoint: appendTo, append: true });
  const detach = !hostProvided;

  if (replace) {
    host.innerHTML = '';
  }

  const element = document.createElement('react-mf-card');
  element.title = title;
  element.description = description;
  element.tagline = tagline;
  element.color = color;

  host.appendChild(element);

  const root = element._root ?? null;
  const state = { host, element, root, detach, replace };
  instances.set(host, state);

  return () => {
    cleanup(state);
    instances.delete(host);
  };
}

export function unmount(ctx = {}) {
  const target =
    ctx && ctx.host instanceof Element
      ? ctx.host
      : ctx && ctx.outlet instanceof Element
        ? ctx.outlet
        : null;

  if (target && instances.has(target)) {
    const state = instances.get(target);
    cleanup(state);
    instances.delete(target);
    return;
  }

  for (const state of instances.values()) {
    cleanup(state);
  }
  instances.clear();
}
