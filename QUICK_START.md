# 🚀 MFE-LABS Quick Start

## ⚡ **Execução Rápida (1 comando)**

```bash
bash run-all.sh
```

Este comando faz TUDO automaticamente:
- ✅ Build Angular 20 Native Federation
- ✅ Build Angular 20 Shell (quando existir)
- ✅ Inicia todos os MFEs
- ✅ Inicia o Shell
- ✅ Cria túneis públicos (se localtunnel instalado)

---

## 📊 **Status Atual do Projeto**

### **✅ Implementado:**

1. **Angular 20 Native Federation (MFE)** 
   - Bundle: 40.9 KB (98% menor que antes!)
   - Tempo: 51.9ms (10x mais rápido!)
   - Localização: `MFEs/angular/mfe-ng-full/`

2. **Túneis Públicos**
   - Script: `expose-public.sh`
   - Ferramentas: localtunnel, cloudflared, ngrok
   - URLs: 8 túneis públicos

3. **Automação Completa**
   - Script: `run-all.sh`
   - Tudo em 1 comando

4. **MFEs Funcionando:**
   - Native Federation (ESM)
   - Module Federation (Webpack)
   - Single-SPA (Angular 15)
   - Angular 15 Element
   - Angular 20 Native Federation ✅
   - React 18
   - Vue 3

### **🔜 Próximo (Planejado):**

**Shell Angular 20 Universal** 
- Host Native Federation
- Provê Angular runtime compartilhado
- Consome Single-SPA, Module Federation, Native Federation
- Localização futura: `angular-shell-20/`

---

## 📁 **Estrutura de Pastas**

```
MFE-LABS/
├── run-all.sh                          ← Executa tudo (1 comando)
├── run-native-shell.sh                 ← Inicia MFEs + Shell atual
├── expose-public.sh                    ← Cria túneis públicos
│
├── MFEs/
│   ├── angular/
│   │   ├── mfe-ng/                     ← Angular 15 Element
│   │   └── mfe-ng-full/                ← Angular 20 Native Federation ✅
│   ├── react/                          ← React 18
│   ├── vue/                            ← Vue 3
│   ├── native-federation/              ← Native Federation ESM
│   ├── module-federation/              ← Webpack MF
│   └── single-spa/                     ← Single-SPA
│
├── native-federation-shell-angular/    ← Shell atual (Vanilla JS)
│   ├── app.js
│   ├── index.html
│   └── remotes.*.json
│
└── angular-shell-20/                   ← Shell futuro (Angular 20 Host)
    └── (será criado)
```

---

## 🎯 **Comandos Úteis**

### **Executar tudo:**
```bash
bash run-all.sh
```

### **Apenas MFEs + Shell:**
```bash
bash run-native-shell.sh
```

### **Apenas túneis públicos:**
```bash
bash expose-public.sh
```

### **Build apenas Angular 20 NF:**
```bash
cd MFEs/angular/mfe-ng-full
npm run package
```

---

## 🌐 **URLs de Acesso**

### **Shell atual (Vanilla JS):**
```
http://localhost:9100              ← Localhost
http://localhost:9100/?env=public  ← Túneis públicos
```

### **MFEs individuais:**
```
http://localhost:9001  ← Vue 3
http://localhost:9101  ← Native Federation
http://localhost:9201  ← React 18
http://localhost:9301  ← Module Federation
http://localhost:9302  ← Single-SPA
http://localhost:9310  ← Angular 15
http://localhost:9400  ← Angular 20 NF ✅
```

---

## 📊 **Performance (Ranking Atual)**

| MFE | Tempo Médio | Bundle | Framework |
|-----|-------------|--------|-----------|
| Native Federation | 27.4ms | 6754 KB | ESM |
| Angular 15 Element | 27.4ms | 6764 KB | Angular 15 |
| Single-SPA | 27.7ms | 6765 KB | Angular 15 |
| Module Federation | 29.0ms | 6754 KB | Webpack |
| React 18 | 31.9ms | 7741 KB | React |
| Vue 3 | 32.9ms | 7094 KB | Vue |
| **Angular 20 NF** | **51.9ms** | **41 KB** | **Angular 20** ✅ |

*Angular 20 NF tem menor bundle (98% menor!) mas tempo médio maior devido a múltiplos chunks otimizados.*

---

## 🔧 **Troubleshooting**

### **Script não executa:**
```bash
# Dê permissão de execução
chmod +x run-all.sh expose-public.sh run-native-shell.sh
```

### **Túneis não funcionam:**
```bash
# Instale localtunnel
npm install -g localtunnel

# Ou cloudflared (Windows)
choco install cloudflared
```

### **Porta já em uso:**
```bash
# Mate processos nas portas
bash run-native-shell.sh  # Ele mata automaticamente
```

### **Angular 20 não aparece:**
```bash
# Rebuilde o Angular 20 NF
cd MFEs/angular/mfe-ng-full
npm run package

# Reinicie o shell
# Ctrl+C no run-native-shell.sh
bash run-native-shell.sh
```

---

## 📚 **Documentação Detalhada**

- `ANGULAR_NATIVE_FEDERATION_GUIDE.md` - Guia completo Native Federation
- `PUBLIC_TUNNEL.md` - Túneis públicos detalhado
- `ANGULAR_SHELL_IMPLEMENTATION.md` - Planejamento Shell Angular 20
- `SCRIPTS_GUIDE.md` - Todos os scripts disponíveis

---

## ✅ **Checklist de Sucesso**

Após executar `bash run-all.sh`, você deve ter:

- [ ] Shell rodando em http://localhost:9100
- [ ] 7 MFEs acessíveis individualmente
- [ ] Angular 20 NF aparecendo na telemetria
- [ ] Túneis públicos criados (opcional)
- [ ] Todos os cards clicáveis no shell
- [ ] Benchmark científico funcionando (botão "🎭 Carregar todos no palco")

---

## 🎓 **Próximos Passos**

1. **Testar tudo:** `bash run-all.sh`
2. **Acessar:** http://localhost:9100
3. **Verificar Angular 20 NF** no ranking
4. **Preparar para Shell Angular 20** (futuro)

---

**Pronto para rodar! Execute:** `bash run-all.sh` 🚀
