# 🏗️ MFE-LABS - Micro Frontend Laboratory

## 📋 **Visão Geral**

Laboratório completo de **Micro Frontends** com múltiplas estratégias de integração, shell universal e governança operacional. Este é um **Native Federation Híbrido** que consome MFEs de diferentes fontes e tecnologias.

**⚠️ Não é uma demo simples!** Este projeto simula um ambiente de **produção enterprise** real com:

- 🎯 **Shell Universal** (Vanilla JS) que consome qualquer padrão de MFE
- 🔧 **7 MFEs** em diferentes tecnologias e estratégias
- 📊 **Telemetria em tempo real** com ranking científico
- 🌐 **Túneis públicos** para testes em dispositivos reais
- 🤖 **Automação completa** (1 comando para subir tudo)
- 📏 **Governança** de remotes e shared dependencies

---

## 🎯 **O que é Native Federation Híbrido?**

Este projeto usa **Native Federation** como estratégia **principal**, mas o shell é **agnóstico** e consome MFEs de múltiplas fontes:

```
Shell Universal (Vanilla JS + importmap)
├── Native Federation (ESM puro)
├── Module Federation (Webpack remotes)
├── Single-SPA (lifecycle bootstrap/mount/unmount)
├── Angular Elements (Web Components)
├── Angular 20 Native Federation (@angular-architects/native-federation)
├── React 18 (custom elements)
└── Vue 3 (custom elements)
```

**Hybrid = O shell consome TODOS os padrões sem ser acoplado a nenhum!**

---

## 🏗️ **Arquitetura do Projeto**

### **Shell (Orquestrador Universal)**

**Localização:** `native-federation-shell-angular/`

**Tecnologia:** Vanilla JavaScript + HTML + CSS

**Responsabilidades:**
- ✅ Resolver manifest de remotes por ambiente (dev/hml/prod/public)
- ✅ Montar MFEs no "palco" (stage)
- ✅ Carregar previews em paralelo
- ✅ Coletar telemetria científica (cold/warm cache)
- ✅ Exibir ranking de performance
- ✅ Suportar comunicação via BUS (Custom Events)
- ✅ Detectar framework/bundle/runtime automaticamente

**Portas:**
- Shell: `9100`
- URLs públicas: `?env=public`

---

## 📦 **MFEs Disponíveis (Detalhado)**

### **1. Native Federation (ESM Puro)** 
**Path:** `MFEs/native-federation/`  
**Porta:** `9101`  
**Entry:** `mfe1.js`  
**Framework:** ESM Modules nativos do browser  
**Bundle:** ~6.7 MB (embedado)  
**Tempo:** ~27ms  

**O que faz:**
- MFE base usando ESM puro
- Export: `render(outlet, props)`
- Sem build tools (apenas JS vanilla)
- Demonstra a forma mais simples de MFE

**Dependências:**
- lodash, moment, dayjs, date-fns, ramda, mathjs, three, chart.js, echarts, xlsx (embedadas)

---

### **2. Module Federation (Webpack)**
**Path:** `MFEs/module-federation/`  
**Porta:** `9301`  
**Entry:** `remote-a.js`  
**Framework:** Webpack Module Federation  
**Bundle:** ~6.7 MB (embedado)  
**Tempo:** ~29ms  

**O que faz:**
- Remote federado via webpack
- Export: `mount(props)` + `unmount(props)`
- Demonstra integração clássica webpack MF

**Dependências:**
- Angular 15, lodash, moment, etc (todas embedadas no bundle)

---

### **3. Single-SPA (Lifecycle)**
**Path:** `MFEs/single-spa/`  
**Porta:** `9302`  
**Entry:** `mfe-a.js`  
**Framework:** Single-SPA + Angular 15  
**Bundle:** ~6.7 MB  
**Tempo:** ~27ms  

**O que faz:**
- Adapter Single-SPA completo
- Export: `bootstrap()`, `mount(props)`, `unmount(props)`
- Demonstra compatibilidade com ecosistema Single-SPA

**Dependências:**
- single-spa, Angular 15, lodash, moment, etc

---

### **4. Angular 15 Element**
**Path:** `MFEs/angular/mfe-ng/`  
**Porta:** `9310`  
**Entry:** `mfe-ng.js`  
**Framework:** Angular 15 (Web Component)  
**Bundle:** ~6.7 MB  
**Tempo:** ~27ms  

**O que faz:**
- Angular compilado como Custom Element
- `customElements.define('app-mfe-ng', ...)`
- Demonstra Web Components Angular

**Dependências:**
- @angular/core 15, @angular/elements (embedadas)

---

### **5. Angular 20 Native Federation** ⭐ **NOVO!**
**Path:** `MFEs/angular/mfe-ng-full/`  
**Porta:** `9400`  
**Entry:** `mfe-ng-full.js`  
**Framework:** Angular 20 + @angular-architects/native-federation  
**Bundle:** **40.9 KB** (98% menor que outros!)  
**Tempo:** ~52ms (múltiplos chunks otimizados)  

**O que faz:**
- Angular 20 com Native Federation REAL
- Export: `render(outlet, props)` via bootstrap dinâmico
- Shared dependencies via Native Federation
- Chunks separados: polyfills.js (34 KB) + bootstrap chunk (660 KB gzip)

**Dependências Compartilháveis:**
- @angular/core, @angular/common, rxjs, zone.js
- lodash, moment, dayjs, date-fns, etc (marcadas para sharing)

**Configuração:**
- `federation.config.js` - Config Native Federation
- `src/bootstrap.ts` - Bootstrap Angular
- `src/main.ts` - Dynamic import

**Como funciona:**
1. main.js (109 bytes) faz import dinâmico de bootstrap
2. Native Federation resolve dependências compartilhadas
3. Bootstrap carrega Angular e cria Custom Element
4. Shell monta o elemento no DOM

---

### **6. React 18**
**Path:** `MFEs/react/`  
**Porta:** `9201`  
**Entry:** `mfe-react.js`  
**Framework:** React 18  
**Bundle:** ~7.7 MB  
**Tempo:** ~32ms  

**O que faz:**
- MFE React isolado
- Export: `render(outlet, props)`
- Custom element wrapper
- Demonstra React em MFE

**Dependências:**
- react, react-dom, lodash, moment, etc

---

### **7. Vue 3**
**Path:** `MFEs/vue/`  
**Porta:** `9001`  
**Entry:** `mfe-vue.js`  
**Framework:** Vue 3  
**Bundle:** ~7.1 MB  
**Tempo:** ~33ms  

**O que faz:**
- MFE Vue isolado
- Export: `render(outlet, props)`
- Custom element wrapper
- Demonstra Vue em MFE

**Dependências:**
- vue, lodash, moment, etc

---

## ⚙️ **Pré-requisitos (O que REALMENTE precisa!)**

### **1. Git Bash (Windows) / Terminal Unix (Mac/Linux)**

**Windows:**
```bash
C:\Program Files\Git\bin\bash.exe
```

**Por que:** Scripts usam Bash syntax (loops, arrays, funções)

---

### **2. Node.js (via nvm)**

**Versões necessárias:**
- Node 16+ (Angular 15 MFEs)
- Node 20.19+ (Angular 20 Native Federation)
- Node 18+ (React/Vue)

**Instalar nvm:**

**Windows (nvm-windows):**
```powershell
# Download: https://github.com/coreybutler/nvm-windows/releases
choco install nvm
```

**Mac/Linux:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
```

**Usar:**
```bash
nvm install 20
nvm use 20
```

**Por que:** Cada MFE pode precisar de versão diferente de Node

---

### **3. npm (vem com Node)**

Versão: qualquer versão recente

---

### **4. localtunnel (Opcional - para túneis públicos)**

```bash
npm install -g localtunnel
```

**Alternativas:**
- `cloudflared` (Cloudflare Tunnel) - Recomendado!
- `ngrok`

**Por que:** Para expor MFEs publicamente e testar em dispositivos reais

---

### **5. Navegador Moderno**

- Chrome/Edge (recomendado)
- Firefox
- Safari

**Por que:** Usa ESM modules nativos, import maps, Custom Elements

---

## 🚀 **Como Executar (3 opções)**

### **Opção 1: Automação Completa (RECOMENDADO)**

```bash
bash run-all.sh
```

**O que faz:**
1. ✅ Build Angular 20 Native Federation
2. ✅ Build Angular 20 Shell (se existir)
3. ✅ Inicia todos os 7 MFEs
4. ✅ Inicia o Shell
5. ✅ Cria túneis públicos (se localtunnel instalado)

**Tempo:** ~2 minutos na primeira vez

---

### **Opção 2: Apenas MFEs + Shell**

```bash
bash run-native-shell.sh
```

**O que faz:**
1. Mata processos nas portas
2. Valida governança
3. Instala dependências (se necessário)
4. Builds MFEs
5. Inicia servidores
6. Gera mfe-versions.json

**Variáveis de ambiente:**
```bash
BUILD_FIRST=1 bash run-native-shell.sh   # Force rebuild
MFE_ENV=prod bash run-native-shell.sh    # Ambiente prod
```

---

### **Opção 3: Apenas Túneis Públicos**

```bash
# Primeiro, tenha MFEs rodando
bash run-native-shell.sh

# Em outro terminal
bash expose-public.sh
```

Gera 8 URLs públicas tipo:
- `https://mfe-vue-123.loca.lt`
- `https://mfe-react-456.loca.lt`
- etc

---

## 🌐 **URLs de Acesso**

### **Shell:**
```
http://localhost:9100              ← Localhost (rápido)
http://localhost:9100/?env=public  ← Túneis públicos (simula prod)
```

### **MFEs individuais:**
```
http://localhost:9001  ← Vue 3
http://localhost:9101  ← Native Federation
http://localhost:9201  ← React 18
http://localhost:9301  ← Module Federation
http://localhost:9302  ← Single-SPA
http://localhost:9310  ← Angular 15
http://localhost:9400  ← Angular 20 Native Federation ⭐
```

---

## 📊 **Ranking de Performance (Real)**

| MFE | Tempo Médio | Bundle | Estratégia |
|-----|-------------|--------|------------|
| **Angular 20 NF** ⭐ | **51.9ms** | **40.9 KB** | Native Federation |
| Native Federation | 27.4ms | 6754 KB | ESM embedado |
| Angular 15 Element | 27.4ms | 6764 KB | Web Component |
| Single-SPA | 27.7ms | 6765 KB | Lifecycle |
| Module Federation | 29.0ms | 6754 KB | Webpack |
| React 18 | 31.9ms | 7741 KB | Custom Element |
| Vue 3 | 32.9ms | 7094 KB | Custom Element |

**📌 Nota sobre Angular 20 NF:**
- Bundle **98% menor** (40 KB vs 6.7 MB)
- Tempo maior devido a múltiplos chunks otimizados
- Em produção com CDN edge, fica MUITO mais rápido (cache)

---

## 🔧 **Troubleshooting**

### **"Porta já em uso"**
```bash
# Os scripts matam automaticamente
# Mas se precisar manual:
netstat -ano | findstr :9100
taskkill /F /PID <PID>
```

### **"nvm: command not found"**
```bash
# Feche e abra o terminal
# Ou execute:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### **"Angular 20 não aparece no ranking"**
```bash
# Rebuilde específico:
cd MFEs/angular/mfe-ng-full
npm run package

# Reinicie:
# Ctrl+C no run-native-shell.sh
bash run-native-shell.sh

# Refresh browser: F5
```

### **"Túneis não funcionam"**
```bash
# Instale localtunnel:
npm install -g localtunnel

# Ou cloudflared (melhor):
# Windows: choco install cloudflared
# Mac: brew install cloudflared
```

### **"MFE falha ao carregar"**
```bash
# Veja logs:
cat .run-logs/mfe-ng-full.log

# Reinstale deps:
cd MFEs/angular/mfe-ng-full
rm -rf node_modules
npm install
```

---

## 📁 **Estrutura de Pastas**

```
MFE-LABS/
├── run-all.sh                          ← Automação completa ⭐
├── run-native-shell.sh                 ← MFEs + Shell
├── expose-public.sh                    ← Túneis públicos
│
├── MFEs/                               ← Todos os MFEs
│   ├── native-federation/              ← ESM puro
│   ├── module-federation/              ← Webpack MF
│   ├── single-spa/                     ← Single-SPA
│   ├── angular/
│   │   ├── mfe-ng/                     ← Angular 15 Element
│   │   └── mfe-ng-full/                ← Angular 20 NF ⭐
│   ├── react/                          ← React 18
│   └── vue/                            ← Vue 3
│
├── native-federation-shell-angular/    ← Shell Universal
│   ├── app.js                          ← Lógica principal
│   ├── index.html                      ← UI
│   ├── importmap.json                  ← Import maps
│   ├── remotes.dev.json                ← Remotes dev
│   ├── remotes.hml.json                ← Remotes hml
│   ├── remotes.prod.json               ← Remotes prod
│   └── remotes.public.json             ← Remotes público (gerado)
│
├── .run-logs/                          ← Logs de execução
├── .run-scripts/                       ← Scripts de validação
│
└── Documentação/
    ├── README.md                       ← Este arquivo
    ├── QUICK_START.md                  ← Guia rápido
    ├── ANGULAR_NATIVE_FEDERATION_GUIDE.md
    ├── PUBLIC_TUNNEL.md
    ├── ANGULAR_SHELL_IMPLEMENTATION.md
    ├── SCRIPTS_GUIDE.md
    └── BUNDLE_ANALYSIS.md
```

---

## 🎓 **Conceitos Implementados**

### **1. Native Federation Híbrido**
Shell agnóstico que consome múltiplas fontes sem acoplamento.

### **2. Telemetria Científica**
- Cold cache (5 runs)
- Warm cache (5 runs)
- Mediana, média, desvio padrão
- Ranking automático

### **3. Governança**
- `remote-governance.policy.json`
- `shared-dependencies.contract.json`
- Validação automática

### **4. Comunicação Cross-MFE**
- Custom Events (BUS)
- Histórico de eventos
- Debug visual

### **5. Bundle Analysis**
- Detecção automática de framework
- Análise de shared dependencies
- Footprint estimation

---

## 🚧 **Roadmap**

### **✅ Implementado:**
- [x] Shell Universal (Vanilla JS) - **PRODUÇÃO** ⭐
- [x] 7 MFEs em diferentes tecnologias
- [x] Angular 20 Native Federation (MFE)
- [x] Túneis públicos
- [x] Telemetria científica
- [x] Automação completa

### **🏗️ Em Desenvolvimento:**
- [x] **Shell Angular 20 (Host) - FUNDAÇÃO** 🏗️
  - Localização: `angular-shell-20/`
  - Projeto Angular 20 criado (zoneless + SSR)
  - Native Federation instalado como HOST
  - Shared dependencies configuradas
  - **Status:** Fundação completa, aguardando implementação
  - **Próximo:** Services, Adapters, UI Components (~3h)

### **🔮 Benefícios do Shell Angular 20:**
- ✅ Provê Angular runtime compartilhado
- ✅ Consome Single-SPA, Module Federation, Native Federation
- ✅ Zero duplicação de Angular entre MFEs
- ✅ Economia de ~85% no bundle total
- ✅ Type-safe com TypeScript
- ✅ Angular DI, lifecycle management, TestBed

---

## 📚 **Documentação Detalhada**

- **QUICK_START.md** - Início rápido
- **ANGULAR_NATIVE_FEDERATION_GUIDE.md** - Guia completo Native Federation
- **PUBLIC_TUNNEL.md** - Túneis públicos detalhado
- **ANGULAR_SHELL_IMPLEMENTATION.md** - Planejamento Shell Angular 20
- **SCRIPTS_GUIDE.md** - Todos os scripts
- **BUNDLE_ANALYSIS.md** - Análise de bundles

---

## 💡 **Casos de Uso**

### **1. Aprendizado**
Entender diferentes estratégias de MFE na prática.

### **2. Benchmarking**
Comparar performance entre tecnologias.

### **3. POC Enterprise**
Base para arquitetura MFE em produção.

### **4. Testes**
Testar integrações antes de implementar.

### **5. Demo**
Demonstrar capacidades para clientes/times.

---

## 🤝 **Contribuindo**

Este é um projeto de laboratório/estudos. Para contribuir:

1. Fork o projeto
2. Siga as regras em `native-federation-shell-angular/SHELL_RULES.md`
3. Teste com `bash run-all.sh`
4. Abra PR com descrição clara

---

## 📝 **Licença**

Este projeto é para fins educacionais e experimentais.

---

## 🎯 **Quick Commands**

```bash
# Executar tudo
bash run-all.sh

# Apenas MFEs
bash run-native-shell.sh

# Gerar túneis
bash expose-public.sh

# Build Angular 20 NF
cd MFEs/angular/mfe-ng-full && npm run package

# Ver logs
tail -f .run-logs/*.log

# Limpar tudo
killall node
rm -rf .run-logs/*.pid
```

---

**Desenvolvido para simular ambientes enterprise de Micro Frontends** 🚀

**Status:** ✅ Produção-Ready para estudos e POCs
