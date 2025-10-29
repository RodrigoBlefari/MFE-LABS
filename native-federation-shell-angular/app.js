const pageGrid = document.getElementById('page-grid');
const pagePreview = document.getElementById('page-preview');
const pagePreviewError = document.getElementById('page-preview-error');
const primaryOutlet = document.getElementById('primary-outlet');
const primaryTitle = document.getElementById('primary-title');
const primarySummary = document.getElementById('primary-summary');
const primaryControls = document.getElementById('primary-controls');
const multiToggle = document.getElementById('multi-toggle');
const btnPanel = document.getElementById('btn-panel');
const btnSelectAll = document.getElementById('btn-select-all');
const btnSelectNone = document.getElementById('btn-select-none');
const insightFastest = document.getElementById('insight-fastest');
const insightSlowest = document.getElementById('insight-slowest');
const insightAverage = document.getElementById('insight-average');
const insightSamples = document.getElementById('insight-samples');
const insightBestPeak = document.getElementById('insight-best');
const insightsTableBody = document.getElementById('insights-table-body');
const insightsTableFoot = document.getElementById('insights-table-foot');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const closeModalButton = document.querySelector('[data-close-modal]');
const docOverviewButtons = document.querySelectorAll('[data-doc-overview]');
const btnScrollControls = document.getElementById('btn-scroll-controls');
const controlPanel = document.getElementById('control-panel');
const stageHeader = document.querySelector('.stage-header');
let primaryDocButton = null;
let primaryBusButton = null;

const primaryButtons = new Map();
const chipButtons = new Map();
const interactiveElements = new Set();
const metricsStore = new Map();
const layoutSlots = new Map();
const layoutClasses = {
  nf: 'slot--nf',
  mf: 'slot--mf',
  ssa: 'slot--ssa',
  ng: 'slot--ng',
  'ng-full': 'slot--ng-full',
  react: 'slot--react',
  vue: 'slot--vue',
};

// Medição e cache do tamanho dos bundles remotos
const bundleSizes = new Map();
async function fetchBundleSize(url) {
  try {
    // Tenta HEAD primeiro para pegar Content-Length
    const head = await fetch(url, { method: 'HEAD' });
    let len = parseInt(head.headers.get('content-length') || '0', 10);
    if (!len || Number.isNaN(len)) {
      // Fallback: GET e mede o ArrayBuffer
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      len = buf.byteLength;
    }
    bundleSizes.set(url, len);
    return len;
  } catch {
    return 0;
  }
}
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '--';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

const overviewDocumentation = `
  <article class="doc-article">
    <span class="doc-tag">Manifesto</span>
    <div class="doc-block">
      <h3>Missao</h3>
      <p>
        Este laboratorio demonstra como Native Federation entrega micro front-ends multi-stack sem bundler compartilhado,
        orquestrando Angular, React, Vue, Module Federation, Single-SPA e remotos ESM com pipelines esbuild.
      </p>
      <ul>
        <li>Carregamento dinamico via <code>import()</code> sobre ES Modules versionados.</li>
        <li>Telemetria de montagem (tempo, media, pior/melhor) registrada pelo shell.</li>
        <li>Lifecycle padronizado com <code>mount()</code>, <code>updateMetrics()</code> e <code>unmount()</code>.</li>
      </ul>
    </div>
    <div class="doc-block">
      <h3>Arquitetura &amp; pipeline</h3>
      <div class="doc-grid">
        <div>
          <h4>Shell Native Federation</h4>
          <ul>
            <li>ESM sem bundler, servindo <code>app.js</code> e <code>styles.css</code> diretamente.</li>
            <li>Import map para dependencias Angular e servidores com CORS controlado.</li>
            <li>CSP rigida, headers <code>X-Content-Type-Options</code> e Permission-Policy minima.</li>
          </ul>
        </div>
        <div>
          <h4>MFEs</h4>
          <ul>
            <li>Angular CLI 17 (esbuild) para <code>mfe-ng-full</code> e Angular standalone Elements.</li>
            <li>Vue 3 <code>defineCustomElement</code>, React 18 <code>createRoot</code>, Module Federation remoto e Single-SPA.</li>
            <li>Servicos estaticos expostos com <code>npm start</code>/<code>npm run serve</code> liberando apenas o host.</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="doc-block">
      <h3>Seguranca</h3>
      <ul>
        <li><code>Content-Security-Policy</code> restringindo <code>script-src</code>, <code>style-src</code> e <code>connect-src</code>.</li>
        <li>Servidores controlam <code>Access-Control-Allow-Origin</code> e Cross-Origin-Resource-Policy apenas para o shell.</li>
        <li>Desmontagem garantida via <code>unmount()</code> + limpeza do DOM, evitando memory leaks.</li>
      </ul>
    </div>
    <div class="doc-block">
      <h3>Boas praticas</h3>
      <ul>
        <li>Telemetria compartilhada com armazenamento de metricas por ID.</li>
        <li>Controles com <code>focus-visible</code> e regioes <code>aria-live</code> para acessibilidade.</li>
        <li>Documentacao embarcada para operacao, observabilidade e seguranca.</li>
      </ul>
    </div>
    <div class="doc-block">
      <h3>Estrutura de pastas</h3>
      <pre><code>MFF LABS/
|-- native-federation-shell-angular/
|   |-- app.js
|   |-- index.html
|   |-- styles.css
|   \\-- importmap.json
|-- MFEs/
|   |-- angular/
|   |   |-- mfe-ng/
|   |   \\-- mfe-ng-full/
|   |-- module-federation/remote-a/
|   |-- native-federation/mfe1/
|   |-- react/mfe-react/
|   |-- single-spa/mfe-a/
|   \\-- vue/mfe-vue/
\\-- shared/
</code></pre>
    </div>
    <div class="doc-block">
      <h3>Execucao do laboratorio</h3>
      <pre><code class="language-bash"># Angular full
cd MFEs/angular/mfe-ng-full
npm install
npm run package
npm run serve

# Shell Native Federation
cd native-federation-shell-angular
npm install
npm start</code></pre>
      <p>Inicie tambem React, Vue, Module Federation, Single-SPA e Native Federation com seus respectivos <code>npm start</code>.</p>
    </div>
  </article>
`;
const documentationById = {
  nf: `
    <article class="doc-article">
      <span class="doc-tag">Native Federation</span>
      <div class="doc-block">
        <h3>Resumo</h3>
        <p>Remote ESM orientado a eventos, exposto em <code>http://localhost:9201/mfe1.js</code> sem bundler compartilhado.</p>
      </div>
      <div class="doc-block">
        <h3>Stack tecnico</h3>
        <ul>
          <li>ES Modules puros servidos a partir de <code>MFEs/native-federation/mfe1/</code>.</li>
          <li>CSS desacoplado (<code>mfe1.css</code>) injetado durante o <code>render()</code>.</li>
          <li>Servidor local com <code>npm start</code> (serve --cors) liberando apenas <code>http://localhost:9200</code>.</li>
        </ul>
      </div>
      <div class="doc-block">
        <h3>Integracao com o shell</h3>
        <ul>
          <li>Carregado via <code>import('http://localhost:9201/mfe1.js')</code> e montado no outlet fornecido.</li>
          <li><code>render()</code> retorna <code>updateMetrics</code> e <code>destroy()</code>, usados pelo lifecycle unificado.</li>
          <li>Eventos <code>CustomEvent('BUS')</code> propagam telemetria para os demais MFEs.</li>
        </ul>
      </div>
      <div class="doc-block">
        <h3>Checklist de seguranca</h3>
        <ul>
          <li>Entrega apenas <code>application/javascript</code> e <code>text/css</code>.</li>
          <li>Sem dependencias globais - comunicacao via ES Modules e BUS.</li>
          <li>Desmontagem remove listeners e o no raiz, evitando vazamentos.</li>
        </ul>
      </div>
    </article>
  `,
  mf: `
    <article class="doc-article">
      <span class="doc-tag">Module Federation</span>
      <div class="doc-block">
        <h3>Resumo</h3>
        <p>Remote webpack 5 em <code>http://localhost:9101/remote-a.js</code> convertido em ES Module pelo bridge Native Federation.</p>
      </div>
      <div class="doc-block">
        <h3>Stack tecnico</h3>
        <ul>
          <li>Projeto em <code>MFEs/module-federation/remote-a/</code> com exposes ESM.</li>
          <li>Empacotado com webpack 5 + Module Federation, compartilhando dependencias de forma controlada.</li>
          <li>Servidor <code>npm start</code> habilita CORS apenas para o shell.</li>
        </ul>
      </div>
      <div class="doc-block">
        <h3>Integracao com o shell</h3>
        <ul>
          <li>Bridge converte <code>remote-a.js</code> em modulo nativo consumido com <code>import()</code>.</li>
          <li>O remote expoe <code>render()</code> e <code>unmount()</code> reaproveitando o runtime de Module Federation.</li>
          <li>Shell injeta metricas e garante desmontagem antes de uma nova montagem.</li>
        </ul>
      </div>
      <div class="doc-block">
        <h3>Operacao</h3>
        <pre><code class="language-bash">cd MFEs/module-federation/remote-a
npm install
npm start</code></pre>
      </div>
    </article>
  `,
  ssa: `
    <article class="doc-article">
      <span class="doc-tag">Single-SPA</span>
      <div class="doc-block">
        <h3>Resumo</h3>
        <p>Adapter Single-SPA em <code>http://localhost:9001/mfe-a.js</code>, provendo <code>bootstrap</code>, <code>mount</code> e <code>unmount</code>.</p>
      </div>
      <div class="doc-block">
        <h3>Stack tecnico</h3>
        <ul>
          <li>Fonte em <code>MFEs/single-spa/mfe-a/</code> com TypeScript e contratos Single-SPA.</li>
          <li>Exporta tambem <code>render()</code> adaptado para Native Federation.</li>
          <li>Scripts: <code>npm install</code> e <code>npm start</code> (porta 9001).</li>
        </ul>
      </div>
      <div class="doc-block">
        <h3>Integracao com o shell</h3>
        <ul>
          <li>Shell chama <code>bootstrap()</code> uma unica vez e reutiliza <code>mount()</code>/<code>unmount()</code>.</li>
          <li>Metrica de render e convertida e enviada de volta via <code>updateMetrics()</code>.</li>
          <li>Permite conviver com orquestracao Single-SPA legada durante a migracao.</li>
        </ul>
      </div>
    </article>
  `,
  ng: `
    <article class="doc-article">
      <span class="doc-tag">Angular Elements</span>
      <div class="doc-block">
        <h3>Resumo</h3>
        <p>Angular standalone + Signals convertido em Web Component (<code>mfe-ng</code> em <code>http://localhost:9301/mfe-ng.js</code>).</p>
      </div>
      <div class="doc-block">
        <h3>Stack tecnico</h3>
        <ul>
          <li>Fonte em <code>MFEs/angular/mfe-ng/</code> com <code>createApplication</code> e <code>@angular/elements</code>.</li>
          <li>Signals para metricas, estilos encapsulados e bundle esbuild.</li>
          <li>Servido via <code>npm start</code> (porta 9301).</li>
        </ul>
      </div>
      <div class="doc-block">
        <h3>Integracao com o shell</h3>
        <ul>
          <li>Registrado como <code>&lt;angular-webcomponent&gt;</code> e controlado via props <code>variant</code>/<code>metrics</code>.</li>
          <li><code>updateMetrics</code> usa Signals para refletir telemetria instantaneamente.</li>
          <li><code>unmount()</code> remove o custom element e listeners customizados.</li>
        </ul>
      </div>
    </article>
  `,
  'ng-full': `
    <article class="doc-article">
      <span class="doc-tag">Angular 17 CLI</span>
      <div class="doc-block">
        <h3>Resumo</h3>
        <p>Aplicacao Angular CLI completa empacotada como Web Component em <code>dist-webcomponent</code> (servida em <code>http://localhost:9400</code>).</p>
      </div>
      <div class="doc-block">
        <h3>Stack tecnico</h3>
        <ul>
          <li>Projeto em <code>MFEs/angular/mfe-ng-full/</code> usando <code>@angular-devkit/build-angular:application</code> (esbuild).</li>
          <li>Script <code>npm run package</code> construi e copia artefatos para <code>dist-webcomponent</code>.</li>
          <li>Servidor dedicado <code>npm run serve</code> aplica CORS e Cross-Origin-Resource-Policy.</li>
        </ul>
      </div>
      <div class="doc-block">
        <h3>Integracao com o shell</h3>
        <ul>
          <li>Bridge <code>mfe-ng-full.js</code> injeta <code>styles.css</code> e carrega <code>main.js</code>.</li>
          <li>Dependencias Angular sao embarcadas (sem <code>externalDependencies</code>) para evitar falhas de resolucao.</li>
          <li><code>destroy()</code> garante limpeza do custom element.</li>
        </ul>
      </div>
      <div class="doc-block">
        <h3>Operacao</h3>
        <pre><code class="language-bash">cd MFEs/angular/mfe-ng-full
npm install
npm run package
npm run serve</code></pre>
      </div>
    </article>
  `,
  react: `
    <article class="doc-article">
      <span class="doc-tag">React 18</span>
      <div class="doc-block">
        <h3>Resumo</h3>
        <p>Observability widget em React 18 convertido em Custom Element (<code>mfe-react</code> em <code>http://localhost:9302/mfe-react.js</code>).</p>
      </div>
      <div class="doc-block">
        <h3>Stack tecnico</h3>
        <ul>
          <li>Fonte em <code>MFEs/react/mfe-react/</code> com <code>ReactDOM.createRoot</code>.</li>
          <li>Telemetria reportada via props <code>updateMetrics</code>.</li>
          <li>Servidor local <code>npm start</code> (porta 9302) com <code>serve --cors</code>.</li>
        </ul>
      </div>
      <div class="doc-block">
        <h3>Integracao com o shell</h3>
        <ul>
          <li>Custom Element aceita <code>variant</code>, <code>metrics</code> e cor.</li>
          <li>Eventos BUS (<code>REACT-PING</code>) comunicam-se com o ecossistema.</li>
          <li><code>destroy()</code> chama <code>root.unmount()</code>, limpando listeners.</li>
        </ul>
      </div>
    </article>
  `,
  vue: `
    <article class="doc-article">
      <span class="doc-tag">Vue 3</span>
      <div class="doc-block">
        <h3>Resumo</h3>
        <p>Componente Vue 3 <code>defineCustomElement</code> estilizado com gradiente proprio (<code>mfe-vue.js</code> em <code>http://localhost:9303</code>).</p>
      </div>
      <div class="doc-block">
        <h3>Stack tecnico</h3>
        <ul>
          <li>Codigo em <code>MFEs/vue/mfe-vue/</code> usando Composition API e CSS dedicado.</li>
          <li>Exporta <code>render()</code> e <code>unmount()</code> compativeis com Native Federation.</li>
          <li>Servidor local <code>npm start</code> (porta 9303) com CORS habilitado.</li>
        </ul>
      </div>
      <div class="doc-block">
        <h3>Integracao com o shell</h3>
        <ul>
          <li>Slot sincroniza <code>metrics</code> por props reativas.</li>
          <li>Estilos carregados uma unica vez (bridge evita duplicidade no <code>&lt;head&gt;</code>).</li>
          <li>Eventos BUS (<code>VUE-PING</code>) alimentam o painel combinado.</li>
        </ul>
      </div>
    </article>
  `,
};
function getBusIntroHtml() {
  return `
    <div class="doc-block">
      <h3>O que é o BUS?</h3>
      <p>
        BUS é um “fio de comunicação” simples entre os blocos da página. Em vez de um bloco
        “chamar” o outro diretamente, ele apenas avisa: “aconteceu X”. Quem quiser, escuta e reage.
        Isso evita dependências fortes entre equipes e deixa tudo mais seguro e organizado.
      </p>
      <ul>
        <li>Sem ligações diretas: os blocos só enviam avisos curtos.</li>
        <li>Fácil de entender: cada aviso tem um pequeno conteúdo e um “de quem veio”.</li>
        <li>Seguro para crescer: times diferentes podem evoluir sem quebrar os outros.</li>
      </ul>
    </div>
  `;
}

function getBusLogHtml(id) {
  const items = (window.__busLogs || []).filter((e) => {
    const d = e?.detail || {};
    const tag = `${d.id || d.name || d.mfe || d.source || ''}`.toLowerCase();
    return !id || tag.includes(id.toLowerCase());
  }).slice(-12);
  const list = items.length
    ? items.map((e) => {
        const src = e?.detail?.id || e?.detail?.name || e?.detail?.mfe || e?.detail?.source || 'desconhecido';
        const data = JSON.stringify(e.detail, null, 2);
        return `<li><strong>${e.at}</strong> • ${src}<pre><code>${data}</code></pre></li>`;
      }).join('')
    : '<li>Nenhum aviso recebido ainda.</li>';
  return `
    <article class="doc-article">
      <span class="doc-tag">BUS</span>
      ${getBusIntroHtml()}
      <div class="doc-block">
        <h3>Últimos avisos recebidos</h3>
        <ul style="margin:0;display:grid;gap:10px;padding-left:18px;">${list}</ul>
        <p style="margin-top:12px;color:var(--text-muted)">Dica: clique no botão “BUS” do card para ver os avisos deste bloco.</p>
      </div>
    </article>
  `;
}

function enrichDocHtml(id, html) {
  const friendlyIntroById = {
    nf: 'Bloco leve que mostra como conectar partes da página sem amarrar times. Ele emite avisos simples que qualquer outro bloco pode escutar.',
    mf: 'Bloco empacotado por outra equipe que chega pronto. Aqui ele se comporta como qualquer outro, sem travar a página.',
    ssa: 'Bloco que já existia em páginas mais antigas. Aqui ele entra e sai sem atrapalhar quem usa o novo modelo.',
    ng: 'Bloco feito em Angular, encaixado como uma peça independente que pode entrar e sair da tela com segurança.',
    'ng-full': 'Aplicação Angular completa, entregue como um único bloco. Serve para casos mais robustos sem perder a integração.',
    react: 'Bloco feito em React, focado em visualização e dados. Ele mostra como integrar sem amarrar tudo num só projeto.',
    vue: 'Bloco feito em Vue, com botões e exemplos prontos. Conversa com os demais por avisos simples (BUS).',
    overview: 'Esta página demonstra como diversas peças visuais podem trabalhar juntas, sem ficarem dependentes umas das outras.'
  };

  const vantagensNF = `
    <div class="doc-block">
      <h3>Por que usar com Native Federation?</h3>
      <ul>
        <li>Times trabalham de forma independente, sem efeito cascata.</li>
        <li>Entrada/saída segura: o bloco entra, mostra e sai sem deixar sujeira.</li>
        <li>Entrega rápida: cada pedaço pode ser atualizado sem desligar o resto.</li>
        <li>Simples de observar: avisos (BUS) contam o que está acontecendo.</li>
      </ul>
    </div>
  `;

  const resumoLeigo = `
    <div class="doc-block">
      <h3>Em poucas palavras</h3>
      <p>${friendlyIntroById[id] || friendlyIntroById.overview}</p>
    </div>
  `;

  const busAjuda = `
    <div class="doc-block">
      <h3>Como este bloco conversa com os demais (BUS)</h3>
      <p>Ele pode avisar “aconteceu X” e os outros blocos decidem se precisam reagir.
      Você pode ver os avisos recebidos clicando no botão “BUS”.</p>
    </div>
  `;

  return `
    <article class="doc-article">
      <span class="doc-tag">${id === 'overview' ? 'Visão geral' : 'Documentação do bloco'}</span>
      ${resumoLeigo}
      ${html || ''}
      ${vantagensNF}
      ${getBusIntroHtml()}
      ${busAjuda}
    </article>
  `;
}

function getDocHtmlFor(id) {
  if (id === 'overview') return enrichDocHtml('overview', overviewDocumentation);
  return enrichDocHtml(id, documentationById[id] || '');
}
let lastFocusedElement = null;

function openModal(title, html) {
  try {
    lastFocusedElement = document.activeElement;
  } catch {}
  if (modalTitle) modalTitle.textContent = title || '';
  if (modalContent) modalContent.innerHTML = html || '';
  if (modalBackdrop) {
    modalBackdrop.hidden = false;
  }
  document.body.classList.add('modal-open');
  setTimeout(() => {
    (closeModalButton || modalBackdrop)?.focus?.();
  }, 0);
}

function closeModal() {
  if (modalBackdrop) {
    modalBackdrop.hidden = true;
  }
  document.body.classList.remove('modal-open');
  if (modalTitle) modalTitle.textContent = '';
  if (modalContent) modalContent.innerHTML = '';
  try {
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  } catch {}
}


function createMetricsSeed() {
  return {
    count: 0,
    total: 0,
    last: 0,
    average: 0,
    best: Number.POSITIVE_INFINITY,
    worst: 0,
  };
}

function getMetricsSnapshot(id) {
  const entry = metricsStore.get(id);
  if (!entry) {
    return {
      count: 0,
      total: 0,
      last: 0,
      average: 0,
      best: 0,
      worst: 0,
    };
  }
  return {
    count: entry.count,
    total: entry.total,
    last: entry.last,
    average: entry.average,
    best: entry.best === Number.POSITIVE_INFINITY ? 0 : entry.best,
    worst: entry.worst,
  };
}

function recordMetrics(id, duration) {
  const entry = metricsStore.get(id) ?? createMetricsSeed();
  const previousCount = entry.count;
  entry.count = previousCount + 1;
  entry.total += duration;
  entry.last = duration;
  entry.best = previousCount === 0 ? duration : Math.min(entry.best, duration);
  entry.worst = previousCount === 0 ? duration : Math.max(entry.worst, duration);
  entry.average = entry.total / entry.count;
  metricsStore.set(id, entry);
  return {
    count: entry.count,
    total: entry.total,
    last: entry.last,
    average: entry.average,
    best: entry.best,
    worst: entry.worst,
  };
}

function toMetricLabel(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '--';
  }
  return `${value.toFixed(1)} ms`;
}

function applyTelemetryBadges(id, metrics) {
  const btn = primaryButtons.get(id);
  if (btn) {
    if (metrics.count > 0) {
      btn.dataset.metric = toMetricLabel(metrics.average);
      btn.title = `Media: ${toMetricLabel(metrics.average)} | Ultimo: ${toMetricLabel(metrics.last)}`;
    } else {
      btn.removeAttribute('data-metric');
      btn.removeAttribute('title');
    }
  }
  const chip = chipButtons.get(id);
  if (chip) {
    if (metrics.count > 0) {
      chip.title = `Ultimo: ${toMetricLabel(metrics.last)} | Melhor: ${toMetricLabel(metrics.best)}`;
    } else {
      chip.removeAttribute('title');
    }
  }
}

function updateInsights() {
  if (!insightFastest || !insightSlowest || !insightAverage || !insightSamples || !insightBestPeak) {
    return;
  }

  const entries = registry
    .map((mfe) => ({
      id: mfe.id,
      label: mfe.label,
      metrics: metricsStore.get(mfe.id),
    }))
    .filter((entry) => entry.metrics && entry.metrics.count > 0);

  if (entries.length === 0) {
    insightFastest.textContent = '--';
    insightSlowest.textContent = '--';
    insightAverage.textContent = '--';
    insightSamples.textContent = '0';
    return;
  }

  const fastest = entries.reduce((best, current) =>
    current.metrics.average < best.metrics.average ? current : best,
  );
  const slowest = entries.reduce((worst, current) =>
    current.metrics.average > worst.metrics.average ? current : worst,
  );
  const totalSamples = entries.reduce((sum, entry) => sum + entry.metrics.count, 0);
  const totalTime = entries.reduce((sum, entry) => sum + entry.metrics.total, 0);
  const globalAverage = totalTime / totalSamples;
  const globalBest = entries.reduce((best, entry) => {
    const b = entry.metrics.best ?? Number.POSITIVE_INFINITY;
    return b > 0 && b < best ? b : best;
  }, Number.POSITIVE_INFINITY);

  insightFastest.textContent = `${fastest.label} · ${toMetricLabel(fastest.metrics.average)}`;
  insightSlowest.textContent = `${slowest.label} · ${toMetricLabel(slowest.metrics.average)}`;
  insightAverage.textContent = toMetricLabel(globalAverage);
  insightBestPeak.textContent = toMetricLabel(globalBest === Number.POSITIVE_INFINITY ? 0 : globalBest);
  insightSamples.textContent = String(totalSamples);

  updateInsightsTable();
}

function updateInsightsTable() {
  if (!insightsTableBody) return;

  // Constrói lista completa (todos MFEs), mesmo sem métricas ainda
  const full = registry.map((mfe) => {
    const m = metricsStore.get(mfe.id);
    return {
      id: mfe.id,
      label: mfe.label,
      metrics: m ?? {
        count: 0,
        total: 0,
        last: 0,
        average: 0,
        best: Number.POSITIVE_INFINITY,
        worst: 0,
      },
    };
  });

  // Ranking por média (sem dados vão para o final)
  const rows = full
    .slice()
    .sort((a, b) => {
      const avga = a.metrics?.count > 0 ? a.metrics.average : Number.POSITIVE_INFINITY;
      const avgb = b.metrics?.count > 0 ? b.metrics.average : Number.POSITIVE_INFINITY;
      return avga - avgb;
    })
    .map(({ id, label, metrics }) => {
      const reg = registryMap.get(id);
      const remote = reg?.remote;
      const bundle =
        remote && bundleSizes.has(remote) ? formatBytes(bundleSizes.get(remote)) : '--';
      const avg = toMetricLabel(metrics?.average);
      const best = toMetricLabel(
        metrics?.best === Number.POSITIVE_INFINITY ? 0 : metrics?.best,
      );
      const worst = toMetricLabel(metrics?.worst);
      const count = String(metrics?.count ?? 0);
      return `<tr>
        <td>${label}</td>
        <td>${avg}</td>
        <td>${best}</td>
        <td>${worst}</td>
        <td>${count}</td>
        <td>${bundle}</td>
      </tr>`;
    })
    .join('');

  insightsTableBody.innerHTML =
    rows || `<tr><td colspan="6" style="text-align:center;opacity:.7">Nenhum dado ainda.</td></tr>`;

  // Agregados globais para o rodapé
  const withData = full.filter((e) => e.metrics && e.metrics.count > 0);
  let globalAvg = '--';
  let globalBest = '--';
  let globalWorst = '--';
  let samples = '0';
  if (withData.length > 0) {
    const totalSamples = withData.reduce((s, e) => s + e.metrics.count, 0);
    const totalTime = withData.reduce((s, e) => s + e.metrics.total, 0);
    const best = withData.reduce((b, e) => {
      const v = e.metrics.best ?? Number.POSITIVE_INFINITY;
      return v > 0 && v < b ? v : b;
    }, Number.POSITIVE_INFINITY);
    const worst = withData.reduce((w, e) => Math.max(w, e.metrics.worst ?? 0), 0);
    globalAvg = toMetricLabel(totalTime / totalSamples);
    globalBest = toMetricLabel(best === Number.POSITIVE_INFINITY ? 0 : best);
    globalWorst = toMetricLabel(worst);
    samples = String(totalSamples);
  }

  // Média de bundle (apenas tamanhos já medidos)
  const measured = registry
    .map((r) => bundleSizes.get(r.remote))
    .filter((n) => typeof n === 'number' && n > 0);
  const avgBundle =
    measured.length > 0
      ? formatBytes(measured.reduce((a, b) => a + b, 0) / measured.length)
      : '--';

  if (insightsTableFoot) {
    insightsTableFoot.innerHTML = `
      <td>Resumo</td>
      <td>${globalAvg}</td>
      <td>${globalBest}</td>
      <td>${globalWorst}</td>
      <td>${samples}</td>
      <td>${avgBundle}</td>
    `;
  }
}

const registry = [
  {
    id: 'nf',
    label: 'NF - Event Stream',
    accent: '#10b981',
    accentAlt: '#34d399',
    description: 'Remote ESM nativo orientado a eventos com pipeline zero-bundler.',
    tagline: 'CustomEvent + contratos simples: integra Single-SPA e Module Federation sem acoplamento.',
    remote: 'http://localhost:9201/mfe1.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('nf') } = {}) => {
      const variant = compact ? 'compact' : 'full';
      const mod = await import('http://localhost:9201/mfe1.js');
      const result = await mod.render(outlet, {
        host: 'native-shell',
        name: 'mfe1-nf',
        replace: true,
        log: !compact,
        variant,
        metrics,
        title: compact ? 'Native Federation (NF)' : 'Native Federation - Event Stream',
        description: compact
          ? 'MFE ESM nativo emitindo eventos unificados.'
          : 'MFE ESM direto, ideal para times que desejam aderir a federacao sem empacotadores pesados.',
        tagline: compact
          ? 'CustomEvent API sem acoplamento.'
          : 'Emitido via CustomEvent - integracao agnostica com Module/Single-SPA.',
      });
      return createLifecycle(mod, result, () => ({
        host: 'native-shell',
        name: 'mfe1-nf',
        outlet,
      }));
    },
  },
  {
    id: 'mf',
    label: 'Remote-A - Module Federation',
    accent: '#1c78c0',
    accentAlt: '#8ed6fb',
    description: 'Remote webpack 5 exposto como ESM para catalogos omnichannel regulados.',
    tagline: 'Bridge MF + Native Federation com compartilhamento controlado de dependências.',
    remote: 'http://localhost:9101/remote-a.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('mf') } = {}) => {
      const variant = compact ? 'compact' : 'full';
      const mod = await import('http://localhost:9101/remote-a.js');
      const result = await mod.render(outlet, {
        host: 'native-shell',
        name: 'remote-a-mf',
        replace: true,
        log: !compact,
        variant,
        metrics,
        title: compact ? 'Remote-A (MF)' : 'Remote-A - Module Federation',
        description: compact
          ? 'Remote Federation integrado ao catalogo corporativo.'
          : 'Remote webpack exposto como ESM, pensado para catalogos financeiros e dashboards omnichannel.',
        tagline: compact
          ? 'webpack module federation remoto.'
          : 'Bridge MF + Native Federation - carregado sob demanda com isolamento leve.',
      });
      return createLifecycle(mod, result, () => ({
        host: 'native-shell',
        name: 'remote-a-mf',
        outlet,
      }));
    },
  },
  {
    id: 'ssa',
    label: 'MFE-A - Single-SPA',
    accent: '#f97316',
    accentAlt: '#fb923c',
    description: 'Lifecycle bootstrap/mount/unmount pronto para modernizar shells legados.',
    tagline: 'Adapter ESM que publica BUS e convive com MF/NF sem retrabalho.',
    remote: 'http://localhost:9001/mfe-a.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('ssa') } = {}) => {
      const variant = compact ? 'compact' : 'full';
      const mod = await import('http://localhost:9001/mfe-a.js');
      const baseProps = {
        name: '@org/mfe-a',
        host: 'native-shell',
        outlet,
        replace: true,
        log: !compact,
        variant,
        metrics,
        title: compact ? 'Single-SPA Widget' : 'Single-SPA - Orchestration Tile',
        description: compact
          ? 'Widget Single-SPA pronto para shells legados.'
          : 'Widget Single-SPA embalado como modulo ESM, ideal para shells legados evoluirem gradualmente.',
        tagline: compact
          ? 'Contrato mount/unmount padrao Single-SPA.'
          : 'Expose mount/unmount e deixe o shell decidir quem convive em tela.',
      };
      if (typeof mod.bootstrap === 'function') {
        await mod.bootstrap(baseProps);
      }
      const mountResult = typeof mod.mount === 'function' ? await mod.mount(baseProps) : null;
      return createLifecycle(mod, mountResult, () => baseProps);
    },
  },
  {
    id: 'ng',
    label: 'Angular - Web Component',
    accent: '#dd0031',
    accentAlt: '#f87171',
    description: 'Angular standalone + Signals empacotado como Custom Element leve.',
    tagline: 'createApplication + @angular/elements com telemetria nativa.',
    remote: 'http://localhost:9301/mfe-ng.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('ng') } = {}) => {
      const variant = compact ? 'compact' : 'full';
      const mod = await import('http://localhost:9301/mfe-ng.js');
      const result = await mod.render(outlet, {
        replace: true,
        variant,
        metrics,
        title: compact ? 'Angular Widget' : 'Angular Engagement Dashboard',
        description: compact
          ? 'Angular standalone registrado via createCustomElement.'
          : 'Web Component Angular standalone com Signals, ideal para orquestracao corporativa.',
        tagline: compact
          ? 'Signals + emissao de BUS.'
          : 'Empacotado com createApplication + @angular/elements.',
      });
      return createLifecycle(mod, result, () => ({
        host: 'native-shell',
        name: 'angular-webcomponent',
        outlet,
      }));
    },
  },
  {
    id: 'ng-full',
    label: 'Angular - Experience Platform',
    accent: '#dd0031',
    accentAlt: '#fca5a5',
    description: 'Aplicacao Angular CLI completa disponibilizada como Web Component federado.',
    tagline: 'CLI standalone + Angular Elements pronta para canais regulados.',
    remote: 'http://localhost:9400/mfe-ng-full.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('ng-full') } = {}) => {
      const mod = await import('http://localhost:9400/mfe-ng-full.js');
      const result = await mod.render(outlet, {
        baseUrl: 'http://localhost:9400/',
        variant: compact ? 'compact' : 'full',
        metrics,
      });
      return createLifecycle(mod, result, () => ({
        host: 'native-shell',
        name: 'angular-full-webcomponent',
        outlet,
      }));
    },
  },
  {
    id: 'react',
    label: 'React - Observability',
    accent: '#61dafb',
    accentAlt: '#38bdf8',
    description: 'React 18 encapsulado como Custom Element para painéis de observabilidade.',
    tagline: 'createRoot + Web Component com isolamento e telemetria de renderizacao.',
    remote: 'http://localhost:9302/mfe-react.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('react') } = {}) => {
      const variant = compact ? 'compact' : 'full';
      const mod = await import('http://localhost:9302/mfe-react.js');
      const result = await mod.render(outlet, {
        replace: true,
        log: !compact,
        variant,
        metrics,
        title: compact ? 'React Widget' : 'React Observability Widget',
        description: compact
          ? 'ReactDOM.createRoot encapsulado em Custom Element.'
          : 'React 18 rodando como Web Component, ideal para integracoes Nx com Module Federation.',
        tagline: compact
          ? 'Stateful e compatvel com orquestracao Native.'
          : 'Criado com ReactDOM.createRoot + Custom Elements para isolamento leve.',
        color: '#0ea5e9',
      });
      return createLifecycle(mod, result, () => ({
        host: 'native-shell',
        name: 'react-webcomponent',
        outlet,
      }));
    },
  },
  {
    id: 'vue',
    label: 'Vue - Operational Insights',
    accent: '#42b883',
    accentAlt: '#22c55e',
    description: 'Vue 3 defineCustomElement otimizado para portais híbridos.',
    tagline: 'Composition API + Custom Element com BUS integrado e métricas reais.',
    remote: 'http://localhost:9303/mfe-vue.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('vue') } = {}) => {
      const variant = compact ? 'compact' : 'full';
      const mod = await import('http://localhost:9303/mfe-vue.js');
      const result = await mod.render(outlet, {
        replace: true,
        variant,
        metrics,
        title: compact ? 'Vue Widget' : 'Vue Operational Insights',
        description: compact
          ? 'Vue Custom Element com Composition API.'
          : 'Vue 3 rodando como Custom Element, perfeito para integracoes heterogeneas.',
        tagline: compact
          ? 'defineCustomElement + emissao de BUS.'
          : 'defineCustomElement + Composition API para maxima flexibilidade.',
      });
      return createLifecycle(mod, result, () => ({
        host: 'native-shell',
        name: 'vue-webcomponent',
        outlet,
      }));
    },
  },
];

const registryMap = new Map(registry.map((m) => [m.id, m]));

let primaryKey = registry[0].id;
let primaryLifecycle = null;
const combinedLifecycles = new Map();
const selectedSet = new Set(registry.map((m) => m.id));

function registerInteractive(el) {
  interactiveElements.add(el);
}

function setLoading(isLoading) {
  interactiveElements.forEach((el) => {
    el.disabled = isLoading;
    if (isLoading) {
      el.classList.add('is-loading');
    } else {
      el.classList.remove('is-loading');
    }
  });
}

function createLifecycle(mod, candidate, getProps) {
  const updateMetrics =
    candidate && typeof candidate.updateMetrics === 'function'
      ? (metrics) => {
          try {
            candidate.updateMetrics(metrics);
          } catch (err) {
            console.error('Falha ao atualizar metricas do MFE', err);
          }
        }
      : () => {};

  const fallback = async () => {
    const props = getProps?.();
    if (props?.outlet instanceof Element) {
      props.outlet.innerHTML = '';
    }
  };

  if (typeof candidate === 'function') {
    return { teardown: async () => candidate(), updateMetrics };
  }

  if (candidate && typeof candidate.destroy === 'function') {
    return { teardown: async () => candidate.destroy(), updateMetrics };
  }

  if (candidate && typeof candidate.teardown === 'function') {
    return { teardown: async () => candidate.teardown(), updateMetrics };
  }

  if (mod && typeof mod.unmount === 'function') {
    return { teardown: async () => mod.unmount(getProps?.()), updateMetrics };
  }

  return { teardown: fallback, updateMetrics };
}

async function teardownPrimary() {
  if (primaryLifecycle?.teardown) {
    try {
      await primaryLifecycle.teardown();
    } catch (err) {
      console.error('Falha ao desmontar primario', err);
    }
    primaryLifecycle = null;
  }
  primaryOutlet.innerHTML = '';
}

async function clearCombined() {
  const tasks = Array.from(combinedLifecycles.values()).map((lifecycle) =>
    Promise.resolve()
      .then(() => lifecycle?.teardown && lifecycle.teardown())
      .catch((err) => console.error('Falha ao desmontar combinado', err)),
  );
  combinedLifecycles.clear();
  await Promise.all(tasks);
  pageGrid.innerHTML = '';
  pagePreviewError.textContent = '';
  pagePreviewError.removeAttribute('data-visible');
  pagePreview?.removeAttribute('data-error');
}

function updatePrimaryButtons() {
  primaryButtons.forEach((btn, id) => {
    btn.classList.toggle('active', id === primaryKey);
  });
}

function updateChips() {
  chipButtons.forEach((chip, id) => {
    chip.classList.toggle('selected', selectedSet.has(id));
  });
}

async function mountPrimary(key) {
  const mfe = registryMap.get(key);
  if (!mfe) return;
  primaryKey = key;
  updatePrimaryButtons();

  // Atualiza cabeçalho do palco central e botão de docs
  if (primaryTitle) primaryTitle.textContent = mfe.label;
  if (primarySummary) primarySummary.textContent = mfe.description;
  if (stageHeader && !primaryDocButton) {
    primaryDocButton = document.createElement('button');
    primaryDocButton.type = 'button';
    primaryDocButton.className = 'ghost';
    primaryDocButton.textContent = 'Documentação do MFE';
    registerInteractive(primaryDocButton);
    stageHeader.appendChild(primaryDocButton);
  }
  if (stageHeader && !primaryBusButton) {
    primaryBusButton = document.createElement('button');
    primaryBusButton.type = 'button';
    primaryBusButton.className = 'ghost';
    primaryBusButton.textContent = 'BUS';
    registerInteractive(primaryBusButton);
    stageHeader.appendChild(primaryBusButton);
  }
  if (primaryDocButton) {
    primaryDocButton.onclick = () => openModal(mfe.label, getDocHtmlFor(mfe.id));
  }
  if (primaryBusButton) {
    primaryBusButton.onclick = () => openModal(`BUS · ${mfe.label}`, getBusLogHtml(mfe.id));
  }

  setLoading(true);
  try {
    await teardownPrimary();
    const start = performance.now();
    const lifecycle =
      (await mfe.mount(primaryOutlet, {
        compact: false,
        metrics: getMetricsSnapshot(mfe.id),
      })) ?? createLifecycle(null, null, null);
    const duration = performance.now() - start;
    primaryLifecycle = lifecycle;
    const metrics = recordMetrics(mfe.id, duration);
    primaryLifecycle.updateMetrics?.(metrics);
    applyTelemetryBadges(mfe.id, metrics);
    updateInsights();
  } catch (err) {
    console.error(`Falha ao carregar ${mfe.label} no painel principal`, err);
    primaryOutlet.innerHTML =
      '<p class="slot-placeholder"><strong>Erro:</strong> Não foi possível carregar este MFE. Consulte o console.</p>';
  } finally {
    setLoading(false);
    updatePrimaryButtons();
  }
}

async function renderCombinedPanel() {
  setLoading(true);
  try {
    await clearCombined();
    if (selectedSet.size === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Nenhum MFE selecionado. Escolha itens no seletor para preencher o painel.';
      pageGrid.appendChild(empty);
      return;
    }

    let hasUpdates = false;
    const tasks = Array.from(selectedSet).map(async (id) => {
      const mfe = registryMap.get(id);
      const slot = document.createElement('div');
      slot.className = `page-slot ${layoutClasses[id] || ''}`;
      slot.dataset.mfe = id;
      slot.style.setProperty('--slot-accent', mfe.accent);

      // Header
      const header = document.createElement('header');
      const title = document.createElement('span');
      title.className = 'slot-title';
      title.textContent = mfe.label;
      const actions = document.createElement('div');
      actions.className = 'slot-actions';
      const sizeBadge = document.createElement('span');
      sizeBadge.className = 'slot-bundle';
      sizeBadge.textContent = '...';
      if (bundleSizes.has(mfe.remote)) {
        sizeBadge.textContent = formatBytes(bundleSizes.get(mfe.remote));
      } else {
        void fetchBundleSize(mfe.remote)
          .then((len) => {
            sizeBadge.textContent = formatBytes(len);
            // Recalcula ranking/rodapé quando tamanho chegar
            updateInsightsTable();
          })
          .catch(() => (sizeBadge.textContent = '--'));
      }
const busBtn = document.createElement('button');
busBtn.type = 'button';
busBtn.className = 'slot-doc';
busBtn.textContent = 'BUS';
busBtn.addEventListener('click', () => openModal(`BUS · ${mfe.label}`, getBusLogHtml(id)));
registerInteractive(busBtn);

const docBtn = document.createElement('button');
docBtn.type = 'button';
docBtn.className = 'slot-doc';
docBtn.textContent = 'Documentação';
docBtn.addEventListener('click', () => openModal(mfe.label, getDocHtmlFor(id)));
registerInteractive(docBtn);

actions.appendChild(sizeBadge);
actions.appendChild(busBtn);
actions.appendChild(docBtn);
header.appendChild(title);
header.appendChild(actions);

      // Tagline
      const tagline = document.createElement('p');
      tagline.className = 'slot-tagline';
      tagline.textContent = mfe.tagline;

      // Body
      const body = document.createElement('div');
      body.className = 'slot-body';
      const placeholder = document.createElement('p');
      placeholder.className = 'slot-placeholder';
      placeholder.textContent = 'Renderização compacta. O conteúdo aparecerá aqui.';
      const surface = document.createElement('div');
      surface.className = 'slot-surface';

      body.appendChild(placeholder);
      body.appendChild(surface);
      slot.appendChild(header);
      slot.appendChild(tagline);
      slot.appendChild(body);
      pageGrid.appendChild(slot);

      try {
        const start = performance.now();
        const lifecycle =
          (await mfe.mount(surface, {
            compact: true,
            metrics: getMetricsSnapshot(id),
          })) ?? createLifecycle(null, null, null);
        const duration = performance.now() - start;
        combinedLifecycles.set(id, lifecycle);
        const metrics = recordMetrics(id, duration);
        lifecycle.updateMetrics?.(metrics);
        applyTelemetryBadges(id, metrics);
        slot.classList.add('is-active');
        hasUpdates = true;
      } catch (err) {
        console.error(`Falha ao carregar ${mfe.label} no painel combinado`, err);
        const errorMsg = document.createElement('p');
        errorMsg.className = 'slot-placeholder';
        errorMsg.innerHTML = `<strong>${mfe.label}</strong><br/>Não foi possível carregar este MFE agora.`;
        body.appendChild(errorMsg);
      }
    });

    await Promise.all(tasks);
    if (hasUpdates) {
      updateInsights();
    }

    if (combinedLifecycles.size !== selectedSet.size) {
      pagePreview?.setAttribute('data-error', 'true');
      pagePreviewError.textContent = 'Alguns MFEs não responderam. Recarregue ou verifique os serviços.';
      pagePreviewError.setAttribute('data-visible', 'true');
    }
  } finally {
    setLoading(false);
  }
}

function toggleSelection(id) {
  if (selectedSet.has(id)) {
    selectedSet.delete(id);
  } else {
    selectedSet.add(id);
  }
  updateChips();
  void renderCombinedPanel();
}

function buildMenus() {
  registry.forEach((mfe) => {
    const primaryBtn = document.createElement('button');
    primaryBtn.type = 'button';
    primaryBtn.className = 'nav-button';
    primaryBtn.textContent = mfe.label;
    primaryBtn.style.setProperty('--accent', mfe.accent);
    primaryBtn.addEventListener('click', () => void mountPrimary(mfe.id));
    primaryControls.appendChild(primaryBtn);
    primaryButtons.set(mfe.id, primaryBtn);
    registerInteractive(primaryBtn);

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'multi-chip';
    chip.textContent = mfe.label;
    chip.style.setProperty('--accent', mfe.accentAlt || mfe.accent);
    chip.addEventListener('click', () => toggleSelection(mfe.id));
    multiToggle.appendChild(chip);
    chipButtons.set(mfe.id, chip);
    registerInteractive(chip);
  });

  [btnPanel, btnSelectAll, btnSelectNone].forEach((btn) => registerInteractive(btn));

  btnPanel.addEventListener('click', () => void renderCombinedPanel());
  btnSelectAll.addEventListener('click', () => {
    registry.forEach((mfe) => selectedSet.add(mfe.id));
    updateChips();
    void renderCombinedPanel();
  });
  btnSelectNone.addEventListener('click', () => {
    selectedSet.clear();
    updateChips();
    void renderCombinedPanel();
  });
}

function init() {
  buildMenus();
  updatePrimaryButtons();
  updateChips();
  updateInsights();

  // Listeners de BUS/telemetria
  window.__busLogs = window.__busLogs || [];
  window.addEventListener('BUS', (event) => {
    const entry = { at: new Date().toLocaleTimeString(), detail: event.detail };
    window.__busLogs.push(entry);
    if (window.__busLogs.length > 50) window.__busLogs.shift();
    console.log('Shell NF recebeu BUS', event.detail);
  });

  // Modal: overview + fechar + backdrop + ESC
  docOverviewButtons.forEach((btn) =>
    btn.addEventListener('click', () => openModal('Manifesto Native Federation', getDocHtmlFor('overview'))),
  );
  closeModalButton?.addEventListener('click', closeModal);
  modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalBackdrop.hidden) closeModal();
  });

  // Scroll para painel de controles
  btnScrollControls?.addEventListener('click', () => {
    controlPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  void mountPrimary(primaryKey).then(() => renderCombinedPanel());
}

init();
