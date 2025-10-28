# Microfrontends Lab — Single‑SPA, Module Federation e Native Federation (Angular‑friendly)

> Este pacote demonstra **três shells** e **três MFEs** fora das pastas dos shells (pasta `MFEs/`), simulando **repos separados**. Os projetos são **demos ESM** leves (sem Angular CLI) para facilitar rodar rápido e comparar **carregamento** e **comunicação**. Para produção, substitua pelos scaffolds Angular oficiais.

## Estrutura
- `single-spa-shell-angular/` (porta 9000)
- `module-federation-shell-angular/` (porta 9100)
- `native-federation-shell-angular/` (porta 9200)
- `MFEs/single-spa/mfe-a/` (porta 9001)
- `MFEs/module-federation/remote-a/` (porta 9101)
- `MFEs/native-federation/mfe1/` (porta 9201)

## Rodando
Em seis terminais (ou em ordem, desde que todos fiquem ativos):

```bash
cd single-spa-shell-angular && npm i && npm start
cd MFEs/single-spa/mfe-a && npm i && npm start

cd module-federation-shell-angular && npm i && npm start
cd MFEs/module-federation/remote-a && npm i && npm start

cd native-federation-shell-angular && npm i && npm start
cd MFEs/native-federation/mfe1 && npm i && npm start
```

Abra:
- Single‑SPA: http://localhost:9000 (link **/a** carrega o MFE‑A)
- MF host:    http://localhost:9100 (botão carrega **Remote‑A**)
- NF shell:   http://localhost:9200 (NF/MF/SSA botões)

## Deploy (boas práticas)
- **Repos separados** por micro‑app; pipelines independentes; versionamento semântico.
- **MF**: hospede cada remote com `remoteEntry.js` público; host referencia por URL/manifesto.
- **NF**: use `federation.manifest.json` por ambiente; SSR iniciar com `fstart.mjs`.
- **Single‑SPA**: root-config com import-maps; MFEs servidos via CDN.
- **CORS**: libere só entre host↔remotes necessários. **Cache**: immutable para assets hashados; `no-store`/baixo TTL para entradas que mudam rápido.
- **Fallbacks** e observabilidade (RUM, logs). **Contracts** claros entre times.
