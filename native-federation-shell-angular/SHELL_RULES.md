# Native Federation Shell - Rules & Best Practices

## 🎯 Core Principles

### 0. **Safety-First Operations (File/System)**
- ✅ Sempre usar **path explícito e correto** em qualquer operação de arquivo
- ✅ Fazer buscas/edições **isoladas por pasta/arquivo** (evitar comandos abrangentes)
- ✅ Preferir comandos não-destrutivos e reversíveis
- ❌ Não usar `rm -rf` genérico na raiz/projeto inteiro
- ❌ Não executar remoções em lote sem validar alvo exato
- **Why:** evita travas, perda de artefatos e alterações acidentais em massa

#### Shell Integration Fallback (anti-trava)
- ✅ Se aparecer `Shell Integration Unavailable`, priorizar leitura/edição por arquivo (`read_file` + patch pontual)
- ✅ Executar comandos curtos, um por vez, com path explícito
- ✅ Evitar pipelines longos e listagens amplas em um único comando
- ✅ Validar em passos pequenos (sintaxe, IDs e diff)
- ✅ **Preferir Git Bash sempre** como shell principal
  - Caminho padrão: `C:\Program Files\Git\bin\bash.exe`
  - Fallback: `C:\Program Files\Git\usr\bin\bash.exe`
  - Exemplo de execução segura: `"C:\Program Files\Git\bin\bash.exe" -lc "<comando>"`
- ❌ Não repetir comando grande quando o output do terminal estiver instável
- **Why:** mantém previsibilidade da sessão e evita novo travamento

### 1. **No Auto-Mount on Boot**
- ✅ Renderize apenas os controles e cards
- ❌ Não carregue MFEs automaticamente na inicialização
- **Why:** Evita travamentos, reduz overhead inicial, deixa controle com usuário

### 2. **On-Demand Mounting**
- ✅ Monte MFEs apenas quando:
  - Usuário clica "Abrir no palco"
  - Usuário clica "Carregar previews"
- ❌ Não pre-carregue remotas
- **Why:** Melhor performance, UX previsível, debug facilitado

### 3. **Timeout + Fallback Strategy**
```js
const IMPORT_TIMEOUT_MS = 7000;      // Import da remota
const MOUNT_TIMEOUT_MS = 9000;       // lifecycle.mount()
const DESTROY_TIMEOUT_MS = 4000;     // Destruição segura
```
- ✅ Sempre encapsule promises em timeout
- ❌ Não finalize indefinidamente
- **Why:** Garante que travamentos não ficam eternos

### 4. **Lifecycle Normalization**
Suporte múltiplos contratos de lifecycle:
```js
- mod.render(outlet, props)        // Native Federation
- mod.mount(props) + mod.bootstrap()  // Single-SPA
- mod.default(outlet, props)       // Fallback genérico
- candidato.destroy()              // Cleanup
```
- ✅ Tentate em ordem de preferência
- ✅ Normalize para `{ destroy: async () => {...} }`
- **Why:** Compatibilidade com diferentes padrões MFE

### 5. **Clean State Management**
- ✅ Mantenha apenas:
  - `activeStage` (1 MFE ativo no palco)
  - `previewLifecycles` (Map de previews)
  - `selectedSet` (checkboxes do catálogo)
  - `telemetry` (métricas de tempo)
- ✅ Limpe com `clearStage()` / `clearPreviews()`
- ❌ Não acumule instâncias em memory
- **Why:** Evita memory leaks, mantém debug limpo

### 6. **Modal + BUS First Class**
- ✅ Modal centralizado para:
  - Docs (remote + contrato)
  - BUS (histórico de eventos)
  - Visão geral
- ✅ BUS track todos os events:
  ```js
  window.addEventListener('BUS', trackBus);
  ```
- ✅ Máx 80 logs, rotação FIFO
- **Why:** Observabilidade, debug facilitado, UX desacoplada

### 7. **Selective Preview Loading**
- ✅ Previews carregam **em paralelo** apenas MFEs selecionados
- ✅ Token de cancelamento (`previewLoadToken`) para não-reuso
- ✅ Each preview tem seu próprio outlet + status indicator
- **Why:** Controle fino, cancela operações antigas, UX responsiva

### 8. **Telemetry Tracking**
Para cada MFE:
```js
{ count, total, last } = telemetry.get(id)
avg = total / count
```
- ✅ Track import + mount time
- ✅ Exibir metadados reais por remote: **Framework**, **Export Contract**, **Shared/Runtime**
- ✅ Visual warning se avg > 1200ms
- **Why:** Debug performance, identifica gargalos

### 9. **Production-Like Remote Reality (sem atalhos fake)**
- ✅ Medição deve refletir **entry real publicado** + recursos reais carregados (chunks/shared/runtime)
- ✅ Evidenciar quando remote usa `render`, `mount`, `bootstrap+mount` ou `default`
- ✅ Evidenciar se há compartilhamento por CDN/runtime chunks ou bundle embedded
- ❌ Não mascarar bundle com métrica apenas do loader quando há dependências externas relevantes
- **Why:** laboratório precisa simular produção de verdade, sem distorcer experiência do shell

---

## 📋 HTML Structure

```
<modal-backdrop>         (hidden by default)
  <modal>
    <modal-title>
    <modal-content>

<shell-wrap>
  <header class="shell-header">        (Botões globais)
  <main class="shell-layout">
    <section class="main-stage">       (1 MFE ativo)
    <aside class="side-column">
      <quick-nav>                      (Botões de atalho)
      <telemetry-block>                (Tabela de métricas)
  <section class="catalog-panel">      (Cards + previews)
    <cards-grid>                       (MFE registry)
    <preview-grid>                     (On-demand previews)
```

- ✅ Painel único ativo no palco
- ✅ Previews em grid paralelo
- ✅ Sidebar com quick nav + telemetria
- **Why:** Responsivo, fácil debug visual, UX clara

---

## 🎨 CSS Principles

- **Web-first** (não mobile-first para este caso)
- **Compact layout** com `panel` classes
- **no-scroll on mount** = `body.modal-open` classe
- **Status indicators**: `loading`|`ok`|`error` classes
- **Accessibility**: `aria-live="polite"`, `role="dialog"`, labels

---

## 🔄 Workflow do Usuário

1. **Boot** → renderCards() + renderTelemetry() + renderQuickNav()
2. **Seleciona** → checkbox → `selectedSet.add(id)`
3. **Carrega previews** → loadPreviews() → monta em paralelo
4. **Clica card** → activateStage(id) → limpa anterior, monta novo
5. **Ver docs** → modal com remote URL
6. **Ver BUS** → modal com últimos 20 events
7. **Limpa palco** → clearStage() → destroys + outlet.innerHTML=""

---

## 🛡️ Error Handling

- ✅ Try/catch em mountRemote()
- ✅ Timeout garante falha rápida
- ✅ Status message user-friendly
- ✅ Console.warn/error para debug
- ✅ Fallback para elemento vazio ou mensagem

---

## 📌 DO's & DON'Ts

| ✅ DO | ❌ DON'T |
|------|---------|
| Use `withTimeout()` em promises | Aguarde infinitamente |
| Normalize lifecycle dinamicamente | Assuma um contrato único |
| Track telemetry por MFE | Fire-and-forget |
| Centralizar modal logic | Modals espalhados |
| Limpe previews antes de novo load | Acumule instâncias |
| Use `selectedSet` para state | Leia HTML checkboxes direto |
| Test com timeout curtos | Testes com valores reais |

---

## 🚀 Future Improvements

- [ ] Guardrail script para bloquear comandos destrutivos sem path explícito
- [ ] Checklist automático de operação segura antes de rotinas de build/run
- [ ] Persistent selectedSet (localStorage)
- [ ] Export telemetry em JSON
- [ ] Suporte a retry automático
- [ ] Cache de remotes bem-sucedidas
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts (Cmd+K, etc)

---

**Last Updated:** 2026-05-27  
**Version:** 2.0 (Rewrite)
