# MFE LABS • Enterprise Native Federation Framework

![Exemplo](ranking.png)

Framework laboratório para simular uma plataforma **enterprise** de Micro Frontends com:

- Native Federation (ESM puro)
- Shell Angular estático
- Governança de ambientes (`dev/hml/prod`)
- Contrato de shared dependencies
- Validação automática de compatibilidade
- Telemetria avançada de benchmark (fetch/eval/mount, mediana, p95, warm-up)

---

## 1) Visão executiva

Este repositório evoluiu de “demo de MFEs” para um **framework operacional** com práticas reais de empresa:

1. **Fase 1 — Environment Routing**
   - Manifestos de remotes por ambiente
   - Resolução dinâmica no shell

2. **Fase 2 — Dependency Governance**
   - Contrato formal de bibliotecas compartilhadas
   - Validador de compatibilidade entre grupos federados

3. **Fase 3 — Remote Governance / Security Policy**
   - Política por ambiente (HTTPS, hosts permitidos, headers esperados)
   - Relatório JSON para CI

4. **Fase 4 — Benchmark Profissional**
   - Métricas separadas de `fetch`, `eval`, `mount`
   - Warm-up automático
   - Mediana, P95 e agregados globais

---

## 2) Arquitetura

### Shell
- Pasta: `native-federation-shell-angular/`
- Sem bundler no runtime (ESM nativo)
- Import map + CSP rígida + Design System

### Remotos (MFEs)
- `MFEs/native-federation/mfe1`
- `MFEs/module-federation/remote-a`
- `MFEs/single-spa/mfe-a`
- `MFEs/angular/mfe-ng`
- `MFEs/angular/mfe-ng-full`
- `MFEs/react/mfe-react`
- `MFEs/vue/mfe-vue`

### Governança (root)
- `shared-dependencies.contract.json`
- `remote-governance.policy.json`
- `.run-scripts/validate-shared-deps.js`
- `.run-scripts/validate-remote-governance.js`
- `run-native-shell.sh`

---

## 3) Governança enterprise implementada

## 3.1 Manifestos por ambiente

Arquivos:
- `native-federation-shell-angular/remotes.dev.json`
- `native-federation-shell-angular/remotes.hml.json`
- `native-federation-shell-angular/remotes.prod.json`

O shell resolve automaticamente via:
1. `?env=` na URL
2. `localStorage` (`mfe-env`)
3. fallback `dev`

---

## 3.2 Contrato de shared dependencies

Arquivo: `shared-dependencies.contract.json`

Define:
- política `singleton`
- política `strictVersion`
- bibliotecas críticas (Angular/RxJS/Zone)
- grupos federados compatíveis
- remotos isolados para versões diferentes

Validação:
```bash
node .run-scripts/validate-shared-deps.js
```

---

## 3.3 Política de remotes por ambiente

Arquivo: `remote-governance.policy.json`

Define por ambiente:
- `requireHttps`
- `allowedHosts`
- `requiredHeaders`

Validação estática:
```bash
node .run-scripts/validate-remote-governance.js --env=dev --check-live=false
```

Validação live (HEAD + headers):
```bash
node .run-scripts/validate-remote-governance.js --env=hml --check-live=true
```

Relatório gerado:
- `.run-logs/remote-governance-report.<env>.json`

---

## 4) Benchmark avançado (telemetria “de verdade”)

No shell, a tabela de insights agora mostra:

- Média
- Melhor
- Pior
- **Mediana**
- **P95**
- **Fetch (avg)**
- **Eval (avg)**
- **Mount (avg)**
- Bundle

Regras importantes:
- primeira execução por MFE = **warm-up** (não entra na estatística)
- métricas mais confiáveis: **mediana e p95**

---

## 5) Execução local (modo completo)

### Opção recomendada (orquestra tudo)

```bash
bash run-native-shell.sh
```

Esse script agora:
1. valida shared deps
2. valida governança de remotes (`MFE_ENV`, default `dev`)
3. sobe MFEs
4. gera `mfe-versions.json`
5. sobe shell

Abrir:
- `http://localhost:9200`

---

### Rodar com ambiente explícito

```bash
MFE_ENV=dev bash run-native-shell.sh
```

---

## 6) Execução manual (caso precise depurar serviço específico)

```bash
# Native Federation
cd MFEs/native-federation/mfe1 && npm start

# Module Federation
cd MFEs/module-federation/remote-a && npm start

# Single-SPA
cd MFEs/single-spa/mfe-a && npm start

# Angular 15
cd MFEs/angular/mfe-ng && npm start

# Angular Full
cd MFEs/angular/mfe-ng-full && npm run serve

# React
cd MFEs/react/mfe-react && npm start

# Vue
cd MFEs/vue/mfe-vue && npm start

# Shell
cd native-federation-shell-angular && npm start
```

---

## 7) Pipeline sugerido (CI)

Passos mínimos:

```bash
node .run-scripts/validate-shared-deps.js
node .run-scripts/validate-remote-governance.js --env=hml --check-live=true
```

Se qualquer validação falhar, quebrar pipeline.

---

## 8) Troubleshooting rápido

- **MFE não carrega**: confirme porta e URL no manifesto do ambiente
- **Falha de governança**: revise `remote-governance.policy.json`
- **Ranking inconsistente**: gere mais amostras; compare mediana/p95
- **Diferença pequena entre MFEs**: em localhost isso é comum; observe mais `mount` + p95

---

## 9) Status atual do framework

✅ Environment manifests por ambiente  
✅ Contrato de shared dependencies  
✅ Validador de compatibilidade  
✅ Política de governança de remotes  
✅ Relatório para CI  
✅ Benchmark avançado (fetch/eval/mount + mediana + p95 + warm-up)

---

## 10) Próximos passos (roadmap)

- botão de benchmark automático (N execuções)
- export consolidado de benchmark em JSON
- score de conformidade por MFE
- gate de release por ambiente
