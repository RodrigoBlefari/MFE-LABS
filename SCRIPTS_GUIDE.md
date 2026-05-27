# 🚀 Scripts Guide - MFE Labs v2.0

## Visão Geral

O projeto utiliza scripts automatizados na raiz para gerenciar toda a simulação. **Não é necessário** entrar em cada diretório - tudo é orquestrado a partir da raiz.

---

## 📋 Scripts Disponíveis

### 🎯 Principais (Recomendado)

#### `npm start`
**Modo recomendado: Build completo + Start**
```bash
npm start
# Ou com flag:
BUILD_FIRST=1 npm start
```
- ✅ Constrói cada MFE (`npm run build`)
- ✅ Valida shared deps e governança
- ✅ Inicia todos os serviços (9 portas)
- ✅ Inicia Shell em foreground (8080)
- 📊 Telemetria com bundle size real

---

#### `npm run start:dev`
**Modo rápido: Skip build, usar server já existente**
```bash
npm run start:dev
# Ou com flag:
BUILD_FIRST=0 npm start
```
- ⚡ Ignora build, reutiliza dist
- 🚀 Mais rápido para iteração
- ⚠️ Use se você já fez build local

---

### 🔍 Monitoramento

#### `npm run health-check`
**Verifica se todos os 8 serviços estão respondendo**
```bash
npm run health-check
```
Saída esperada:
```
✓ vue (localhost:9001) - OK
✓ nf (localhost:9101) - OK
✓ mf (localhost:9301) - OK
✓ ssa (localhost:9302) - OK
✓ ng (localhost:9310) - OK
✓ ng-full (localhost:9400) - OK
✓ react (localhost:9201) - OK
✓ shell (localhost:8080) - OK
━━━━━━━━━━━━━━━━━━━
🟢 Todos os serviços online!
```

---

#### `npm run status`
**Relatório completo: processos + portas + logs**
```bash
npm run status
```
Mostra:
- PIDs dos processos em execução
- Status de cada serviço (✓ online / ✗ offline)
- Tamanho dos arquivos de log
- Comandos úteis de referência

---

### 📊 Logs

#### `npm run logs`
**Tail em tempo real de todos os logs**
```bash
npm run logs
# Ctrl+C para sair
```

#### `npm run logs:shell`
**Apenas logs do shell (onde vê telemetria)**
```bash
npm run logs:shell
```

#### `npm run logs:mfes`
**Apenas logs dos MFEs**
```bash
npm run logs:mfes
```

---

### 🛑 Parar / Limpar

#### `npm run stop`
**Para todos os processos em background**
```bash
npm run stop
```
- Graceful kill (-TERM) com timeout
- Force kill (-9) se necessário
- Remove .pid files

---

#### `npm run clean`
**Remove node_modules de todos os projeto**
```bash
npm run clean
```
- `npm run clean:mfes` - apenas MFEs
- `npm run clean:shell` - apenas Shell

---

### 🏗️ Build Explícito

#### `npm run build:all`
**Build todos MFEs + Shell separado**
```bash
npm run build:all
# Ou específico:
npm run build:mfes    # só MFEs
npm run build:shell   # só Shell
```

---

### 🔬 Validações

#### `npm run validate:deps`
**Verifica consitência de shared dependencies**
```bash
npm run validate:deps
```

#### `npm run validate:governance`
**Valida remotes contra remote-governance.policy**
```bash
npm run validate:governance
```

#### `npm run start:versions-only`
**Apenas gera `mfe-versions.json` e sai**
```bash
npm run start:versions-only
# Resulta em: native-federation-shell-angular/mfe-versions.json
```

---

### 🌐 Abrir no Navegador

#### `npm run open:shell`
**Abre http://localhost:8080 automaticamente**
```bash
npm run open:shell
```
- macOS: `open`
- Linux: `xdg-open`
- Windows: `start`

---

## 🎯 Fluxo Típico

### 1️⃣ Primeira Execução (Completa)
```bash
npm start
# Espera ~60-80s para build + start
# Browser abre automaticamente em localhost:8080
```

### 2️⃣ Verificar Saúde
Em outro terminal:
```bash
npm run health-check
```

### 3️⃣ Ver Telemetria
```bash
npm run logs:shell
# Ou abra DevTools do navegador (F12 > Console)
```

### 4️⃣ Parar quando Terminar
```bash
npm run stop
```

---

## 🔧 Variáveis de Ambiente

```bash
# Force build antes de start (default: 1)
BUILD_FIRST=1 npm start

# Build mode: 0 = skip, 1 = build+serve
BUILD_FIRST=0 npm start

# Apenas gera versões (não executa):
GENERATE_ONLY=1 npm start

# Ambiente dos remotes (default: dev)
MFE_ENV=dev npm start
```

---

## 📁 Estrutura de Logs

```
.run-logs/
├── nf.log           # Native Federation
├── mf.log           # Module Federation
├── ssa.log          # Single-SPA
├── ng.log           # Angular 15
├── ng-full.log      # Angular 20
├── react.log        # React 18
├── vue.log          # Vue 3
├── shell.log        # Shell (TELEMETRIA AQUI)
├── *.pid            # Process IDs (auto-deletado ao stop)
└── [timestamps]     # Rotação automática
```

---

## 🎯 Portas

| MFE | Porta | Script | Status |
|-----|-------|--------|--------|
| Native Federation | 9101 | `npm start` | npx serve |
| Module Federation | 9301 | `npm start` | npx serve |
| Single-SPA | 9302 | `npm start` | npx serve |
| Angular 15 | 9310 | `npm start` | npx serve |
| Angular 20 | 9400 | `npm run serve` | Dedicado |
| React 18 | 9201 | `npm start` | npx serve |
| Vue 3 | 9001 | `npm start` | npx serve |
| **Shell** | **8080** | `npm start` | dev-server |

---

## ⚙️ Troubleshooting

### "Port already in use"
```bash
# Kill portas conflitantes
npm run stop

# ou manualmente:
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows
kill -9 <PID>
```

### "Build failed"
```bash
# Limpar e tentar novamente
npm run clean
npm start
```

### "npm not found"
```bash
# Verifique Node/NPM instalados
node -v
npm -v

# Se não: instale Node LTS (18+)
```

### "Health-check todos offline"
```bash
# Verifique logs
npm run logs

# Se Build travou:
npm run stop
npm clean
npm start
```

---

## 📈 Bundle Metrics (Telemetria)

Após `npm start`, acesse:
**http://localhost:8080**

Tabela de telemetria mostra:
- **Média** (ms): Tempo médio de montagem
- **Melhor** (ms): Melhor tempo registrado
- **Pior** (ms): Pior tempo registrado  
- **Amostras**: Quantas vezes foi montado
- **Bundle**: Tamanho em KB (HEAD + GET fallback)

---

## 🚀 Quick Reference

```bash
# INICIAR
npm start                 # Recomendado (build + serve)
npm run start:dev        # Rápido (sem build)

# MONITORAR
npm run status           # Relatório completo
npm run health-check    # Verificar portas
npm run logs            # Ver logs em tempo real

# PARAR/LIMPAR
npm run stop            # Parar tudo
npm run clean           # Remover node_modules

# ABRIR
npm run open:shell      # Abrir localhost:8080
```

---

**Gerado em:** 2026-05-27 | **Versão:** 2.0.0
