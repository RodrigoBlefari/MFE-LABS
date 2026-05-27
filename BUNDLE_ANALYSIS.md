# 🔍 Análise de Bundling - MFE Labs

## Problema Identificado

**Bundles muito pequenos (~8KB) quando esperado > 100KB+**

Telemetria atual:
- Native Federation: 8.3 KB
- Module Federation: 8.0 KB  
- Single-SPA: 8.6 KB
- Angular 15 Element: 8.5 KB
- Angular 20 Full: **3.0 KB** ⚠️ (muito pequeno!)
- React 18: 10.4 KB
- Vue 3: 10.3 KB
- **Total: 57.2 KB** (deveria ser 500KB+)

## Causa Raiz

### ❌ Problema Principal: Importmap + CDN
O arquivo `importmap.json` está **apontando para CDN**:
```json
{
  "@angular/core": "https://cdn.jsdelivr.net/npm/@angular/core@17.3.0/...",
  "@angular/common": "https://cdn.jsdelivr.net/npm/@angular/common@17.3.0/...",
  "rxjs": "https://esm.sh/rxjs@7.8.1"
}
```

**Resultado:** Cada MFE importa do CDN, não bundla libs pesadas → bundles minúsculos

---

## 🛠️ Soluções

### Solução 1: **Bundlar Libs no MFE (Recomendado)**

#### Por MFE:
1. **Angular 15 + Angular 20** (stand-alone e shared)
   ```bash
   # Para Angular 15 (stand-alone, sem shared)
   ng build --prod --optimization --aot
   
   # No angular.json, adicionar:
   "vendorChunk": false,
   "extractCss": true,
   "buildOptimizer": true
   ```

2. **React 18**
   ```bash
   # Desabilitar tree-shaking em webpack
   webpack.config.js:
   optimization: { usedExports: false }
   
   # Build production
   npm run build
   ```

3. **Vue 3**
   ```bash
   # vue.config.js
   configureWebpack: {
     optimization: { usedExports: false }
   }
   npm run build
   ```

---

### Solução 2: **Servir Bundles Estáticos (localhost)**

Ao invés de CDN, colocar dist em servidor local:

```bash
# Para cada MFE
npm run build
# Copiar dist → /public/mfe/{id}/
# Servir em http://localhost:9{port}/dist/index.js
```

Atualizar `remotes.dev.json`:
```json
{
  "nf": "http://localhost:9101/dist/mfe1.js",
  "ng-15": "http://localhost:9310/dist/index.js",
  "ng-20": "http://localhost:9400/dist/index.js"
}
```

---

### Solução 3: **Forçar Dependências Pesadas no MFE**

Adicionar imports de libs não-utilizadas ao MFE para simular payload real:

**src/main.ts ou entry point:**
```typescript
// Força bundlagem mesmo com tree-shaking
import * as moment from 'moment';
import lodash from 'lodash';
import dayjs from 'dayjs';
import { parse } from 'date-fns';

// Dummy usage
window.__HEAVY_DEPS__ = { moment, lodash, dayjs, parse };
```

**package.json additional deps:**
```json
{
  "dependencies": {
    "moment": "^2.29.0",
    "lodash": "^4.17.21",
    "dayjs": "^1.11.10",
    "date-fns": "^3.0.0",
    "axios": "^1.6.0",
    "recharts": "^2.10.0"
  }
}
```

---

### Solução 4: **Desabilitar Shared Libraries (Importmap)**

Remover deps compartilhadas forçando cada MFE bundlar tudo:

```json
{
  "imports": {
    // ❌ REMOVER - deixar cada MFE bundlar
    // "@angular/core": "https://...",
    // "@angular/common": "https://..."
  }
}
```

Resulta em:
- (+) Tamanho real = 150-300 KB por MFE
- (-) Duplicação de código (RxJS, Angular em cada bundle)
- (✓) Simula cenário de **missing shared deps**

---

## 📋 Checklist para Simular Real-World

- [ ] Angular 15: Build com `--prod`, incluir todas as libs
- [ ] Angular 20: Usar shared OU full bundled (testar ambos)
- [ ] Single-SPA: Garantir all deps bundled
- [ ] React 18: Incluir recharts, axios, momentjs
- [ ] Vue 3: Incluir vue-router, pinia, day.js
- [ ] Native Federation: Manter leve como proxy
- [ ] Module Federation: Testar com/sem shared

---

## 🎯 Métricas Esperadas (Real-World)

| MFE | Expected | Atual | Gap |
|-----|----------|-------|-----|
| Angular 15 (standalone) | 180 KB | 8.5 KB | ↑ 180 KB |
| Angular 20 (app) | 250 KB | 3.0 KB | ↑ 250 KB |
| React 18 | 120 KB | 10.4 KB | ↑ 120 KB |
| Vue 3 | 100 KB | 10.3 KB | ↑ 100 KB |

---

## 🚀 Ação Imediata

1. Build cada MFE localmente: `npm run build`
2. Copiar dist → pasta `/dist` em cada MFE
3. Atualizar `remotes.dev.json` apontando para local
4. Re-testar com shell - bundles devem estar > 50 KB cada

---

**Gerado em:** 2026-05-27
