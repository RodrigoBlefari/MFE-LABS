# Microfrontends Lab - Single-SPA, Module Federation and Native Federation (Angular friendly)

> Este pacote demonstra **tres shells** e **tres MFEs** alojados em pastas independentes (pasta `MFEs/`), simulando repositorios separados. Os exemplos utilizam ESM puro para facilitar a comparacao de carregamento e comunicacao. Em cenarios produtivos substitua pelos toolchains oficiais do framework escolhido.

## Estrutura
- `single-spa-shell-angular/` (porta 9000)
- `module-federation-shell-angular/` (porta 9100)
- `native-federation-shell-angular/` (porta 9200)
- `MFEs/single-spa/mfe-a/` (porta 9001)
- `MFEs/module-federation/remote-a/` (porta 9101)
- `MFEs/native-federation/mfe1/` (porta 9201)

## Rodando em desenvolvimento
Abra seis terminais (ou execute em sequencia, mantendo todos ativos):

```bash
cd single-spa-shell-angular && npm install && npm start
cd MFEs/single-spa/mfe-a && npm install && npm start

cd module-federation-shell-angular && npm install && npm start
cd MFEs/module-federation/remote-a && npm install && npm start

cd native-federation-shell-angular && npm install && npm start
cd MFEs/native-federation/mfe1 && npm install && npm start
```

Interfaces:
- Single-SPA shell: http://localhost:9000 (rota `#/a` carrega o MFE-A)
- Module Federation host: http://localhost:9100 (botao carrega Remote-A)
- Native Federation shell: http://localhost:9200 (botoes carregam NF/MF/SSA)

## Build
Cada projeto gera artefatos estaticos em `dist/` via um script de copia padrao. Execute sempre apos `npm install`:

```bash
cd single-spa-shell-angular && npm run build
cd module-federation-shell-angular && npm run build
cd native-federation-shell-angular && npm run build

cd MFEs/single-spa/mfe-a && npm run build
cd MFEs/module-federation/remote-a && npm run build
cd MFEs/native-federation/mfe1 && npm run build
```

Os arquivos em `dist/` podem ser publicados em CDNs distintas ou agregados por pipelines dedicados de cada equipe.

## Hardening de seguranca
- Metatags CSP nos shells restringem `script-src` e `connect-src` apenas aos hosts esperados (`localhost` das MFEs) e mantem estilos inline controlados.
- O shell Single-SPA referencia SystemJS do CDN via `integrity` (SRI) e `crossorigin="anonymous"`, reduzindo risco de supply chain comprometido.
- Cada host garante teardown antes de um novo `mount`, evitando vazamento de listeners ou elementos que poderiam servir de vetor XSS.
- Os remotos expõem APIs puras (`render`, `unmount`, `bootstrap/mount`) sem avaliar entradas de usuario nem expor globais desnecessarias.
- Os scripts de build produzem pastas limpas sem tooling de desenvolvimento, facilitando varreduras e revisao de deploy.

## Deploy (boas praticas)
- Repos separados por micro app, pipelines independentes e versionamento semantico.
- Module Federation: hospede `remoteEntry.js` (ou arquivo remoto equivalente) com cache controlado; host le URLs de manifesto por ambiente.
- Native Federation: distribua manifestos por ambiente (`federation.manifest.json`) e garanta verificacao de integridade antes de hidratar.
- Single-SPA: mantenha import-maps versionados; preferencialmente sirva MFEs via CDN com cache busting por hash.
- CORS: permita apenas origens host <-> remoto necessarias; combine com HTTPS e headers `Access-Control-Allow-Origin` especificos.
- Observabilidade: adicione health-checks, logging por MFE e contratos claros de comunicacao entre times.
