import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MFE {
  id: string;
  label: string;
  url: string;
  port: number;
  tagline: string;
  doc: string;
}

interface TelemetryEntry {
  count: number;
  total: number;
  last: number;
  best: number;
  worst: number;
  bundle: number;
  framework: string;
  exportContract: string;
  remoteEntryInfo: string;
  sharedRuntime: string;
  sharedDetails: string[];
}

interface TelemetryDisplay {
  mfe: MFE;
  entry: TelemetryEntry | null;
  avg: number;
}

type SortColumn = 'mfe' | 'framework' | 'remoteEntry' | 'sharedRuntime' | 'avg' | 'best' | 'worst' | 'count' | 'bundle' | 'score';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.css'
})
export class ShellLayoutComponent {
  readonly IMPORT_TIMEOUT_MS = 7000;
  readonly MOUNT_TIMEOUT_MS = 9000;
  readonly DESTROY_TIMEOUT_MS = 4000;
  readonly COLD_ROUNDS = 5;
  readonly WARM_ROUNDS = 5;
  
  readonly mfes = signal<MFE[]>([
    { 
      id: 'nf', 
      label: 'Native Federation', 
      url: 'http://localhost:9101/mfe1.js', 
      port: 9101,
      tagline: 'ESM puro e contrato simples',
      doc: 'MFE base usando módulos ES nativos com troca de eventos.'
    },
    { 
      id: 'mf', 
      label: 'Module Federation', 
      url: 'http://localhost:9301/remote-a.js', 
      port: 9301,
      tagline: 'Remote webpack com bridge',
      doc: 'Remote empacotado com webpack, consumido no shell via import dinâmico.'
    },
    { 
      id: 'ssa', 
      label: 'Single-SPA', 
      url: 'http://localhost:9302/mfe-a.js', 
      port: 9302,
      tagline: 'Adapter de lifecycle legado',
      doc: 'Compatibiliza bootstrap/mount/unmount com o shell atual.'
    },
    { 
      id: 'ng', 
      label: 'Angular 15 Element', 
      url: 'http://localhost:9310/mfe-ng.js', 
      port: 9310,
      tagline: 'Custom element leve',
      doc: 'Web component Angular com ciclo de vida controlado.'
    },
    { 
      id: 'ng-full', 
      label: 'Angular 20 Native Federation', 
      url: 'http://localhost:9400/mfe-ng-full.js', 
      port: 9400,
      tagline: 'ESM + Shared dependencies automático',
      doc: 'Angular 20 com @angular-architects/native-federation. Compartilhamento automático de dependências.'
    },
    { 
      id: 'react', 
      label: 'React 18', 
      url: 'http://localhost:9201/mfe-react.js', 
      port: 9201,
      tagline: 'Widget isolado de observabilidade',
      doc: 'Componente React com integração desacoplada no shell.'
    },
    { 
      id: 'vue', 
      label: 'Vue 3', 
      url: 'http://localhost:9001/mfe-vue.js', 
      port: 9001,
      tagline: 'Custom element com eventos',
      doc: 'Componente Vue com comunicação por evento e montagem segura.'
    },
  ]);

  readonly status = signal('Pronto para carregar MFEs');
  readonly loading = signal(false);
  readonly selectedMfes = signal<Set<string>>(new Set(this.mfes().map(m => m.id)));
  readonly telemetry = signal<Map<string, TelemetryEntry>>(new Map());
  readonly sortColumn = signal<SortColumn>('score');
  readonly sortAscending = signal(true);
  readonly showBenchmarkModal = signal(false);
  readonly benchmarkProgress = signal('');
  
  private bundleSizeCache = new Map<string, number>();
  private urlSizeCache = new Map<string, number>();
  private runtimeInsightsCache = new Map<string, any>();
  private activeLifecycle: any = null;

  readonly selectedCount = computed(() => this.selectedMfes().size);

  readonly telemetryDisplay = computed(() => {
    const allEntries: TelemetryDisplay[] = this.mfes().map((mfe) => {
      const entry = this.telemetry().get(mfe.id) || null;
      const avg = entry?.count ? entry.total / entry.count : 0;
      return { mfe, entry, avg };
    });

    // Sort by current sort state
    const column = this.sortColumn();
    const ascending = this.sortAscending();

    allEntries.sort((a, b) => {
      let valA: any, valB: any;
      switch (column) {
        case 'mfe':
          valA = a.mfe.label.toLowerCase();
          valB = b.mfe.label.toLowerCase();
          break;
        case 'framework':
          valA = (a.entry?.framework || '').toLowerCase();
          valB = (b.entry?.framework || '').toLowerCase();
          break;
        case 'remoteEntry':
          valA = (a.entry?.remoteEntryInfo || '').toLowerCase();
          valB = (b.entry?.remoteEntryInfo || '').toLowerCase();
          break;
        case 'sharedRuntime':
          valA = (a.entry?.sharedRuntime || '').toLowerCase();
          valB = (b.entry?.sharedRuntime || '').toLowerCase();
          break;
        case 'avg':
          valA = a.avg;
          valB = b.avg;
          break;
        case 'best':
          valA = a.entry?.best || 0;
          valB = b.entry?.best || 0;
          break;
        case 'worst':
          valA = a.entry?.worst || 0;
          valB = b.entry?.worst || 0;
          break;
        case 'count':
          valA = a.entry?.count || 0;
          valB = b.entry?.count || 0;
          break;
        case 'bundle':
          valA = a.entry?.bundle || 0;
          valB = b.entry?.bundle || 0;
          break;
        case 'score':
        default:
          valA = a.avg;
          valB = b.avg;
          break;
      }
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return ascending ? valA - valB : valB - valA;
    });

    return allEntries;
  });

  readonly globalStats = computed(() => {
    const entries = this.telemetryDisplay();
    const globalAvg = entries.reduce((sum, e) => sum + (e.avg || 0), 0) / entries.length || 0;
    const globalBest = Math.min(...entries.map(e => e.entry?.best || Infinity).filter(v => v !== Infinity));
    const globalWorst = Math.max(...entries.map(e => e.entry?.worst || 0));
    const totalBundle = entries.reduce((sum, e) => sum + (e.entry?.bundle || 0), 0);
    const totalMounts = entries.reduce((sum, e) => sum + (e.entry?.count || 0), 0);
    
    return {
      avg: globalAvg,
      best: globalBest === Infinity ? 0 : globalBest,
      worst: globalWorst,
      totalBundle,
      totalMounts
    };
  });

  toggleSelection(id: string) {
    const selected = new Set(this.selectedMfes());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedMfes.set(selected);
  }

  selectAll() {
    this.selectedMfes.set(new Set(this.mfes().map(m => m.id)));
  }

  selectNone() {
    this.selectedMfes.set(new Set());
  }

  sortBy(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortAscending.set(!this.sortAscending());
    } else {
      this.sortColumn.set(column);
      this.sortAscending.set(true);
    }
  }

  formatMs(value: number): string {
    return Number.isFinite(value) && value > 0 ? `${value.toFixed(1)} ms` : '--';
  }

  formatKb(bytes: number): string {
    return bytes > 0 ? `${(bytes / 1024).toFixed(1)} KB` : '--';
  }

  getPerformanceClass(avg: number): string {
    return avg > 1200 ? 'warn' : avg > 800 ? 'caution' : 'ok';
  }

  detectFrameworkFromSource(mfe: MFE, sourceText: string): string {
    const text = sourceText.toLowerCase();
    
    if (mfe.id === 'react') return 'React 18';
    if (mfe.id === 'vue') return 'Vue 3';
    if (mfe.id === 'ng-full') return 'Angular 20 Native Federation';
    if (mfe.id === 'ng') return 'Angular 15 (element)';
    if (mfe.id === 'ssa') return 'Single-SPA (Angular 15)';
    if (mfe.id === 'mf') return 'Webpack Module Federation';
    if (mfe.id === 'nf') return 'Native Federation (ESM)';
    
    return 'ESM Module';
  }

  async loadMfe(mfe: MFE) {
    this.status.set(`Carregando ${mfe.label}...`);
    this.loading.set(true);

    try {
      await this.clearStage();
      const outlet = document.getElementById('mfe-outlet');
      if (!outlet) throw new Error('Outlet não encontrado');

      const started = performance.now();
      await this.mountRemote(mfe, outlet);
      const duration = performance.now() - started;

      this.status.set(`${mfe.label} carregado com sucesso em ${this.formatMs(duration)}!`);
    } catch (error) {
      console.error(`Erro ao carregar ${mfe.label}:`, error);
      this.status.set(`Erro ao carregar ${mfe.label}. MFE rodando na porta ${mfe.port}?`);
    } finally {
      this.loading.set(false);
    }
  }

  async clearStage() {
    if (this.activeLifecycle?.destroy) {
      try {
        await this.withTimeout(
          this.activeLifecycle.destroy(),
          this.DESTROY_TIMEOUT_MS,
          'destroy stage'
        );
      } catch (err) {
        console.warn('[shell] falha ao destruir stage', err);
      }
    }
    this.activeLifecycle = null;
    
    const outlet = document.getElementById('mfe-outlet');
    if (outlet) {
      outlet.innerHTML = '';
      this.status.set('Palco limpo. Pronto para carregar MFEs.');
    }
  }

  clearCache() {
    this.bundleSizeCache.clear();
    this.urlSizeCache.clear();
    this.runtimeInsightsCache.clear();
    this.telemetry.set(new Map());
    this.status.set('Cache e telemetria limpos. Monte novamente para recalcular.');
  }

  async runBenchmark() {
    const selected = this.mfes().filter(m => this.selectedMfes().has(m.id));
    
    if (selected.length === 0) {
      this.status.set('Selecione ao menos 1 MFE para benchmark.');
      return;
    }

    this.showBenchmarkModal.set(true);
    this.loading.set(true);
    this.benchmarkProgress.set(`🔬 Iniciando benchmark: ${this.COLD_ROUNDS} cold + ${this.WARM_ROUNDS} warm runs por MFE...`);

    // Limpa cache antes de começar
    this.bundleSizeCache.clear();
    this.urlSizeCache.clear();
    this.runtimeInsightsCache.clear();
    this.telemetry.set(new Map());

    try {
      for (let i = 0; i < selected.length; i++) {
        const mfe = selected[i];
        const outlet = document.getElementById('mfe-outlet');
        if (!outlet) continue;

        this.benchmarkProgress.set(`🔬 [${i + 1}/${selected.length}] ${mfe.label} - Fase 1: Cache FRIO...`);

        // FASE 1: COLD CACHE
        const coldRuns: number[] = [];
        for (let run = 1; run <= this.COLD_ROUNDS; run++) {
          this.bundleSizeCache.clear();
          this.urlSizeCache.clear();
          this.runtimeInsightsCache.clear();
          
          await new Promise(resolve => setTimeout(resolve, 100));
          this.benchmarkProgress.set(`🔬 ${mfe.label} - Cold run ${run}/${this.COLD_ROUNDS}`);

          try {
            performance.mark(`${mfe.id}-cold-${run}-start`);
            await this.clearStage();
            await this.mountRemote(mfe, outlet);
            performance.mark(`${mfe.id}-cold-${run}-end`);
            
            performance.measure(
              `${mfe.id}-cold-${run}`,
              `${mfe.id}-cold-${run}-start`,
              `${mfe.id}-cold-${run}-end`
            );
            
            const measure = performance.getEntriesByName(`${mfe.id}-cold-${run}`)[0] as PerformanceMeasure;
            coldRuns.push(measure.duration);
            
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`[benchmark] Falha em ${mfe.label} cold run ${run}`, error);
            coldRuns.push(Infinity);
          }
        }

        // Aguarda GC
        this.benchmarkProgress.set(`${mfe.label} - Aguardando GC...`);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // FASE 2: WARM CACHE
        this.benchmarkProgress.set(`🔬 [${i + 1}/${selected.length}] ${mfe.label} - Fase 2: Cache QUENTE...`);
        const warmRuns: number[] = [];
        
        for (let run = 1; run <= this.WARM_ROUNDS; run++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          this.benchmarkProgress.set(`🔬 ${mfe.label} - Warm run ${run}/${this.WARM_ROUNDS}`);

          try {
            performance.mark(`${mfe.id}-warm-${run}-start`);
            await this.clearStage();
            await this.mountRemote(mfe, outlet);
            performance.mark(`${mfe.id}-warm-${run}-end`);
            
            performance.measure(
              `${mfe.id}-warm-${run}`,
              `${mfe.id}-warm-${run}-start`,
              `${mfe.id}-warm-${run}-end`
            );
            
            const measure = performance.getEntriesByName(`${mfe.id}-warm-${run}`)[0] as PerformanceMeasure;
            warmRuns.push(measure.duration);
            
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`[benchmark] Falha em ${mfe.label} warm run ${run}`, error);
            warmRuns.push(Infinity);
          }
        }

        console.log(`[benchmark] ${mfe.label}:`, { coldRuns, warmRuns });
      }

      performance.clearMarks();
      performance.clearMeasures();

      this.benchmarkProgress.set(`✅ Benchmark completo! ${selected.length} MFEs testados (${this.COLD_ROUNDS} cold + ${this.WARM_ROUNDS} warm cada).`);
      this.status.set('Benchmark científico concluído! Veja os resultados na tabela de telemetria.');
      
      setTimeout(() => {
        this.showBenchmarkModal.set(false);
      }, 3000);
      
    } catch (error) {
      console.error('[benchmark] Erro:', error);
      this.benchmarkProgress.set('❌ Erro durante benchmark.');
    } finally {
      this.loading.set(false);
    }
  }

  private async mountRemote(mfe: MFE, outlet: HTMLElement): Promise<void> {
    const bundleSizePromise = this.estimateRemoteBundleFootprint(mfe).catch(() => 0);
    const started = performance.now();

    const mod = await this.withTimeout(
      import(/* @vite-ignore */ mfe.url),
      this.IMPORT_TIMEOUT_MS,
      `import ${mfe.id}`
    );

    const insightPromise = this.inspectRemoteRuntime(mfe, mod).catch(() => null);
    
    const props = {
      host: 'angular-shell-20',
      name: mfe.id,
      id: mfe.id,
      outlet,
      replace: true,
    };

    let candidate = null;
    if (typeof mod.render === 'function') {
      candidate = await this.withTimeout(
        mod.render(outlet, props),
        this.MOUNT_TIMEOUT_MS,
        `render ${mfe.id}`
      );
    } else if (typeof mod.mount === 'function') {
      if (typeof mod.bootstrap === 'function') {
        await this.withTimeout(
          mod.bootstrap(props),
          this.MOUNT_TIMEOUT_MS,
          `bootstrap ${mfe.id}`
        );
      }
      candidate = await this.withTimeout(
        mod.mount(props),
        this.MOUNT_TIMEOUT_MS,
        `mount ${mfe.id}`
      );
    } else if (typeof mod.default === 'function') {
      candidate = await this.withTimeout(
        mod.default(outlet, props),
        this.MOUNT_TIMEOUT_MS,
        `default ${mfe.id}`
      );
    }

    const duration = performance.now() - started;
    const bundleSize = await bundleSizePromise;
    const insight = await insightPromise;
    
    console.log(`[shell] bundle ${mfe.id}: ${bundleSize} bytes (footprint estimado)`);
    
    this.updateTelemetry(mfe.id, duration, bundleSize, insight);
    this.activeLifecycle = this.normalizeLifecycle(mod, candidate, props);
  }

  private normalizeLifecycle(mod: any, candidate: any, props: any): any {
    if (typeof candidate === 'function') return { destroy: async () => candidate() };
    if (candidate && typeof candidate.destroy === 'function') return { destroy: async () => candidate.destroy() };
    if (candidate && typeof candidate.teardown === 'function') return { destroy: async () => candidate.teardown() };
    if (typeof mod.unmount === 'function') return { destroy: async () => mod.unmount(props) };
    return { destroy: async () => { if (props?.outlet) props.outlet.innerHTML = ''; } };
  }

  private updateTelemetry(id: string, duration: number, bundleSize: number, insight: any) {
    const telemetryMap = new Map(this.telemetry());
    const current = telemetryMap.get(id) || {
      count: 0,
      total: 0,
      last: 0,
      best: Infinity,
      worst: 0,
      bundle: bundleSize,
      framework: '--',
      exportContract: '--',
      remoteEntryInfo: '--',
      sharedRuntime: '--',
      sharedDetails: [],
    };

    current.count += 1;
    current.total += duration;
    current.last = duration;
    current.best = Math.min(current.best, duration);
    current.worst = Math.max(current.worst, duration);
    if (bundleSize > 0) current.bundle = bundleSize;
    if (insight?.framework) current.framework = insight.framework;
    if (insight?.exportContract) current.exportContract = insight.exportContract;
    if (insight?.remoteEntryInfo) current.remoteEntryInfo = insight.remoteEntryInfo;
    if (insight?.sharedRuntime) current.sharedRuntime = insight.sharedRuntime;
    if (Array.isArray(insight?.sharedDetails)) current.sharedDetails = insight.sharedDetails;

    telemetryMap.set(id, current);
    this.telemetry.set(telemetryMap);
  }

  private async estimateRemoteBundleFootprint(mfe: MFE): Promise<number> {
    const cacheKey = `${mfe.id}::${mfe.url}`;
    if (this.bundleSizeCache.has(cacheKey)) {
      return this.bundleSizeCache.get(cacheKey)!;
    }

    let entrySize = await this.probeUrlSize(mfe.url);
    let sourceText = '';
    
    try {
      const res = await fetch(mfe.url);
      if (res.ok) {
        sourceText = await res.text();
        if (!entrySize) {
          entrySize = new Blob([sourceText]).size;
        }
      }
    } catch {
      // noop
    }

    const referenced = new Set(this.extractHttpUrls(sourceText));
    referenced.delete(mfe.url);

    // Angular 20 Native Federation: adiciona arquivos da mesma pasta
    if (mfe.id === 'ng-full') {
      try {
        const base = new URL(mfe.url).origin;
        [`${base}/main.js`, `${base}/polyfills.js`, `${base}/styles.css`].forEach(u => referenced.add(u));
      } catch {
        // noop
      }
    }

    let refsSize = 0;
    for (const ref of referenced) {
      const size = await this.probeUrlSize(ref);
      refsSize += size;
    }

    const total = entrySize + refsSize;
    this.bundleSizeCache.set(cacheKey, total);
    return total;
  }

  private async probeUrlSize(url: string): Promise<number> {
    if (!url) return 0;
    if (this.urlSizeCache.has(url)) {
      return this.urlSizeCache.get(url)!;
    }

    let size = 0;
    try {
      // Tenta HEAD primeiro
      try {
        const headRes = await fetch(url, { method: 'HEAD' });
        const cl = headRes.headers.get('content-length');
        if (cl) {
          size = parseInt(cl, 10) || 0;
          if (size > 0) {
            this.urlSizeCache.set(url, size);
            return size;
          }
        }
      } catch {
        // HEAD pode falhar, continua com GET
      }

      // GET completo
      const getRes = await fetch(url);
      if (getRes.ok) {
        const cl2 = getRes.headers.get('content-length');
        if (cl2) {
          size = parseInt(cl2, 10) || 0;
        }
        if (!size) {
          const blob = await getRes.blob();
          size = blob.size || 0;
        }
      }
    } catch (err) {
      console.warn(`[probeUrlSize] Erro ao medir ${url}:`, err);
      size = 0;
    }

    this.urlSizeCache.set(url, size);
    return size;
  }

  private extractHttpUrls(text: string): string[] {
    if (typeof text !== 'string' || !text.trim()) return [];
    const matches = text.match(/https?:\/\/[^"'`\s)]+/g) || [];
    
    const validUrls = matches.filter(url => {
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        
        if (host === 'localhost' || host.includes('localhost')) return true;
        if (host.includes('esm.sh')) return true;
        if (host.includes('cdn.jsdelivr.net')) return true;
        if (host.includes('unpkg.com')) return true;
        
        // Ignora schemas XML, namespaces, documentação
        if (host.includes('schemas.') || host.includes('w3.org') || 
            host.includes('openoffice.org') || host.includes('oasis-open.org') ||
            host.includes('microsoft.com') || host.includes('purl.org')) return false;
        
        return false;
      } catch {
        return false;
      }
    });
    
    return [...new Set(validUrls)];
  }

  private async inspectRemoteRuntime(mfe: MFE, mod: any): Promise<any> {
    const key = `${mfe.id}::${mfe.url}`;
    if (this.runtimeInsightsCache.has(key)) {
      return this.runtimeInsightsCache.get(key);
    }

    let sourceText = '';
    try {
      const res = await fetch(mfe.url);
      if (res.ok) {
        sourceText = await res.text();
      }
    } catch {
      // noop
    }

    const framework = this.detectFrameworkFromSource(mfe, sourceText);
    const exportContract = this.detectExportContract(mod);
    const remoteEntryInfo = this.classifyRemoteEntry(mfe, mod, sourceText);
    
    let sharedRuntime = 'Self-contained entry';
    const sharedDetails: string[] = [];
    
    // Análise de dependências compartilhadas
    if (mfe.id === 'ssa' || mfe.id === 'ng') {
      sharedRuntime = 'Self-contained monolithic bundle';
      sharedDetails.push('Todas as dependências embedadas em arquivo único', 'Sem estratégia de compartilhamento');
    }

    const insight = { framework, exportContract, remoteEntryInfo, sharedRuntime, sharedDetails };
    this.runtimeInsightsCache.set(key, insight);
    return insight;
  }

  private detectExportContract(mod: any): string {
    if (!mod || typeof mod !== 'object') return '--';
    if (typeof mod.render === 'function') return 'render(outlet, props)';
    if (typeof mod.bootstrap === 'function' && typeof mod.mount === 'function') return 'bootstrap + mount';
    if (typeof mod.mount === 'function') return 'mount(props)';
    if (typeof mod.default === 'function') return 'default(outlet, props)';
    const names = Object.keys(mod).slice(0, 3);
    return names.length ? `exports: ${names.join(', ')}` : '--';
  }

  private classifyRemoteEntry(mfe: MFE, mod: any, sourceText: string): string {
    const file = (() => {
      try {
        const u = new URL(mfe.url);
        return u.pathname.split('/').pop() || mfe.url;
      } catch {
        return mfe.url;
      }
    })();

    const contract = this.detectExportContract(mod);
    const hasRuntimeChunks = sourceText.toLowerCase().includes('main.js') || 
                            sourceText.toLowerCase().includes('polyfills.js');

    if (file === 'remoteEntry.js') return `remoteEntry.js (MF classic) · ${contract}`;
    if (file.includes('mfe-ng-full.js') && hasRuntimeChunks) return `Bridge ${file} + chunks Angular runtime`;
    if (file.includes('remote-a.js')) return `Remote ${file} (MF adapter ESM)`;
    if (file.includes('mfe-a.js')) return `Remote ${file} (Single-SPA adapter)`;
    if (file.includes('mfe-ng.js')) return `Remote ${file} (Angular element entry)`;
    if (file.includes('mfe-react.js')) return `Remote ${file} (React custom element)`;
    if (file.includes('mfe-vue.js')) return `Remote ${file} (Vue custom element)`;
    if (file.includes('mfe1.js')) return `Remote ${file} (Native Federation ESM)`;
    return `${file} · ${contract}`;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, ctx: string): Promise<T> {
    let timer: any = null;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout (${ms}ms) em ${ctx}`)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
  }
}
