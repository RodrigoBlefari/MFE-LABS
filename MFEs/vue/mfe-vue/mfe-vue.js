import {
  defineCustomElement,
  h,
  ref,
  computed,
} from './node_modules/vue/dist/vue.runtime.esm-browser.prod.js';

const instances = new Map();
let elementDefined = false;

function ensureStylesheet() {
  if (document.querySelector('link[data-vue-mfe-style]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./mfe-vue.css', import.meta.url).href;
  link.dataset.vueMfeStyle = 'true';
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
  if (state.element?.isConnected) {
    state.element.remove();
  }
  if (state.detach && state.host?.isConnected) {
    state.host.remove();
  }
}

function defineVueElement() {
  if (elementDefined || customElements.get('vue-mf-card')) {
    elementDefined = true;
    return;
  }

  const VueMfeCard = defineCustomElement({
    props: {
      title: { type: String, default: 'Vue Operational Insights' },
      description: {
        type: String,
        default: 'Vue 3 rodando como Custom Element, perfeito para integracoes heterogeneas.',
      },
      tagline: {
        type: String,
        default: 'defineCustomElement + Composition API para maxima flexibilidade.',
      },
    },
    setup(props) {
      const pings = ref(0);
      const uptime = computed(() => `${(Math.random() * 0.5 + 99.5).toFixed(2)}%`);
      const incidents = computed(() => Math.floor(Math.random() * 3));

      const emitPing = () => {
        pings.value += 1;
        window.dispatchEvent(
          new CustomEvent('BUS', {
            detail: {
              type: 'VUE-PING',
              payload: {
                count: pings.value,
                source: 'Vue Custom Element',
              },
            },
          }),
        );
      };

      return {
        props,
        pings,
        uptime,
        incidents,
        emitPing,
      };
    },
    render() {
      const metrics = [
        ['Disponibilidade', this.uptime.value],
        ['Incidentes abertos', this.incidents.value],
        ['Eventos enviados', this.pings.value],
      ];

      return h('section', { class: 'vue-card' }, [
        h('span', { class: 'vue-badge' }, 'Vue Custom Element'),
        h('h2', null, this.props.title),
        h('p', null, this.props.description),
        h('p', { class: 'vue-tagline' }, this.props.tagline),
        h(
          'div',
          { class: 'vue-metrics' },
          metrics.map(([label, value]) =>
            h(
              'span',
              { class: 'vue-metric-row' },
              [h('strong', null, label), h('span', null, value)],
            ),
          ),
        ),
        h(
          'button',
          {
            type: 'button',
            onClick: this.emitPing,
          },
          'Emitir BUS (Vue)',
        ),
      ]);
    },
  });

  customElements.define('vue-mf-card', VueMfeCard);
  elementDefined = true;
}

export async function render(outlet, options = {}) {
  ensureStylesheet();
  defineVueElement();

  if (outlet && !(outlet instanceof Element)) {
    throw new Error('Vue remote requer um elemento host valido.');
  }

  const {
    appendTo = document.body,
    replace = true,
    title = 'Vue Operational Insights',
    description = 'Vue 3 rodando como Custom Element, perfeito para integracoes heterogeneas.',
    tagline = 'defineCustomElement + Composition API para maxima flexibilidade.',
  } = options;

  const hostProvided = outlet instanceof Element;
  const host = hostProvided ? outlet : createOutlet({ mountPoint: appendTo, append: true });
  const detach = !hostProvided;

  if (replace) {
    host.innerHTML = '';
  }

  const element = document.createElement('vue-mf-card');
  element.setAttribute('title', title);
  element.setAttribute('description', description);
  element.setAttribute('tagline', tagline);

  host.appendChild(element);

  const state = { host, element, detach, replace };
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
