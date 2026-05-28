# 🎯 Angular 20 + Native Federation - Guia Definitivo

## 📋 **O que é @angular-architects/native-federation?**

Native Federation para Angular = **ESM Module Federation** nativo do browser, sem Webpack!

✅ **Vantagens sobre Full Bridge:**
- Zero bundler overhead
- Shared dependencies automático
- Velocidade máxima
- Tree-shaking perfeito
- Suporte TypeScript nativo

---

## 🏗️ **Arquitetura Recomendada**

```
Angular 20 MFE
├── src/
│   ├── bootstrap.ts         # Entry point dinâmico
│   ├── main.ts              # Bootstrap loader
│   ├── app/
│   │   ├── app.component.ts
│   │   └── remote-entry/    # Componente exposto
│   │       └── entry.component.ts
│   └── federation.manifest.json  # Config Native Fed
├── project.json             # Build config
└── package.json
```

---

## 🛠️ **Setup Passo-a-Passo**

### **1. Instalar Native Federation**

```bash
cd MFEs/angular/mfe-ng-20

# Instala Native Federation
npm install @angular-architects/native-federation --save

# Instala builder
npm install @angular-architects/native-federation-builder --save-dev
```

---

### **2. Configurar `federation.config.js`**

```javascript
// federation.config.js
const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'mfeNg20',
  
  exposes: {
    './Component': './src/app/remote-entry/entry.component.ts',
  },

  shared: {
    ...shareAll({ 
      singleton: true, 
      strictVersion: true, 
      requiredVersion: 'auto' 
    }),
  },

  // Shared externas (lodash, moment, etc via CDN)
  sharedMappings: ['@angular', 'rxjs', 'lodash', 'moment'],
});
```

---

### **3. Atualizar `angular.json`**

```json
{
  "projects": {
    "mfe-ng-20": {
      "architect": {
        "build": {
          "builder": "@angular-architects/native-federation:build",
          "options": {
            "target": "mfe-ng-20:build:production",
            "rebuildDelay": 0,
            "dev": false
          }
        },
        "serve": {
          "builder": "@angular-architects/native-federation:build",
          "options": {
            "target": "mfe-ng-20:serve:development",
            "rebuildDelay": 0,
            "dev": true,
            "port": 9410
          }
        }
      }
    }
  }
}
```

---

### **4. Criar `src/bootstrap.ts`**

```typescript
// src/bootstrap.ts
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
```

---

### **5. Atualizar `src/main.ts`**

```typescript
// src/main.ts
// Import dinâmico para permitir Native Federation carregar deps primeiro
import('./bootstrap')
  .catch(err => console.error(err));
```

---

### **6. Criar Remote Entry Component**

```typescript
// src/app/remote-entry/entry.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-remote-entry',
  template: `
    <div class="mfe-ng-20-container">
      <h2>Angular 20 MFE - Native Federation</h2>
      <p>Host: {{ host }}</p>
      <p>Props: {{ props | json }}</p>
      
      <!-- Seu conteúdo aqui -->
      <div class="content">
        <p>✅ Shared dependencies via Native Federation</p>
        <p>✅ Tree-shaking automático</p>
        <p>✅ Zero Webpack overhead</p>
      </div>
    </div>
  `,
  styles: [`
    .mfe-ng-20-container {
      padding: 20px;
      border: 2px solid #dd0031;
      border-radius: 8px;
      background: #fff;
    }
    
    .content {
      margin-top: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
    }
  `]
})
export class RemoteEntryComponent implements OnInit, OnDestroy {
  @Input() host: string = 'unknown';
  @Input() props: any = {};

  ngOnInit() {
    console.log('[Angular 20 NF] Component mounted', { host: this.host, props: this.props });
    
    // Emite evento BUS
    window.dispatchEvent(new CustomEvent('BUS', {
      detail: {
        id: 'ng-20',
        name: 'MOUNTED',
        at: new Date().toISOString()
      }
    }));
  }

  ngOnDestroy() {
    console.log('[Angular 20 NF] Component destroyed');
    
    window.dispatchEvent(new CustomEvent('BUS', {
      detail: {
        id: 'ng-20',
        name: 'UNMOUNTED',
        at: new Date().toISOString()
      }
    }));
  }
}
```

---

### **7. Criar Wrapper para Export**

```typescript
// src/app/remote-entry/wrapper.ts
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { RemoteEntryComponent } from './entry.component';
import { ApplicationRef, Injector } from '@angular/core';

let appRef: ApplicationRef | null = null;

export async function mount(container: HTMLElement, props: any = {}) {
  // Bootstrap Angular se necessário
  if (!appRef) {
    appRef = await createApplication({
      providers: [
        // Seus providers aqui
      ]
    });
  }

  // Cria custom element
  const RemoteElement = createCustomElement(RemoteEntryComponent, {
    injector: appRef.injector
  });

  // Registra custom element (apenas uma vez)
  if (!customElements.get('mfe-ng-20')) {
    customElements.define('mfe-ng-20', RemoteElement);
  }

  // Cria e insere elemento
  const element = document.createElement('mfe-ng-20') as any;
  element.host = props.host || 'native-shell';
  element.props = props;
  
  container.innerHTML = '';
  container.appendChild(element);

  return {
    destroy: () => {
      container.innerHTML = '';
    }
  };
}

export const render = mount; // Alias para compatibilidade
```

---

### **8. Atualizar Registry no Shell**

```javascript
// Shell: native-federation-shell-angular/app.js

const registry = [
  // ... outros MFEs
  
  {
    id: 'ng-20-nf',
    label: 'Angular 20 Native Federation',
    tagline: 'ESM puro + shared deps automático',
    doc: 'Angular 20 com @angular-architects/native-federation',
    remote: 'http://localhost:9410/remoteEntry.json', // Native Federation usa .json!
    mount: async (outlet, props) => {
      // Native Federation retorna módulo com export
      const mod = await import('http://localhost:9410/remoteEntry.json');
      const component = await mod.get('./Component');
      return component.mount(outlet, props);
    }
  }
];
```

---

## 🎯 **Build e Deploy**

### **Dev:**
```bash
npm run serve
# Roda em http://localhost:9410
# Expõe remoteEntry.json
```

### **Prod:**
```bash
npm run build
# Gera dist/ com:
# - remoteEntry.json (manifest)
# - chunks otimizados
# - shared deduplicated
```

---

## 📊 **Comparação Final**

| Aspecto | Full Bridge | Native Federation |
|---------|-------------|-------------------|
| **Bundler** | Múltiplos requests | ESM nativo |
| **Shared** | Manual (CDN) | Automático |
| **Build** | Webpack pesado | Esbuild rápido |
| **Tree-shaking** | Parcial | Perfeito |
| **Velocidade** | 🐢 Lento | 🚀 Rápido |
| **Bundle size** | Grande | Pequeno |
| **DX** | Complexo | Simples |

---

## ✅ **Checklist de Migração**

- [ ] Instalar `@angular-architects/native-federation`
- [ ] Criar `federation.config.js`
- [ ] Atualizar `angular.json` (builder)
- [ ] Criar `bootstrap.ts` dinâmico
- [ ] Implementar `RemoteEntryComponent`
- [ ] Criar wrapper `mount()`
- [ ] Atualizar shell registry
- [ ] Testar em dev
- [ ] Build e deploy

---

## 🔗 **Recursos**

- **Docs Oficiais:** https://www.angulararchitects.io/en/blog/the-microfrontend-revolution-part-2-module-federation-with-angular/
- **GitHub:** https://github.com/angular-architects/module-federation-plugin
- **Exemplos:** https://github.com/angular-architects/module-federation-plugin/tree/main/apps

---

**Pronto! Agora você tem Angular 20 nas MELHORES PRÁTICAS com Native Federation! 🚀**
