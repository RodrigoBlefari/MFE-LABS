# Microfrontends Lab - Single-SPA, Module Federation and Native Federation (Angular friendly)

> Este pacote demonstra **tres shells** e **tres MFEs** organizados como projetos independentes (pasta `MFEs/`), simulando repositorios separados. Os exemplos utilizam ESM puro para facilitar comparacoes de carregamento e comunicacao. Em producao substitua pelos toolchains oficiais do framework.

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
- Native Federation shell: http://localhost:9200 (botoes carregam NF/MF/SSA ou o painel combinado)

### Multiplo carregamento e outlets dedicados
- Cada MFE expone `createOutlet()` para gerar containers autocontidos; `render`/`mount` aceitam `{ replace: false }` para coexistir com outros widgets.
- Remotos devolvem funcoes de teardown assinc, permitindo multiplas instancias simultaneas sem interferencia entre hosts.
- O shell nativo inclui uma acao "Mostrar os 3 juntos" que renderiza NF+MF+Single-SPA em slots dedicados, simulando dashboards compostos de bancos ou big techs.

## Build
Cada projeto gera artefatos estaticos em `dist/` via um script de copia padrao. Execute apos `npm install`:

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
- CSPs removem `'unsafe-inline'` em `script-src`, restringem `style-src` aos hosts das MFEs, bloqueiam `frame-ancestors`, `object-src` e `form-action` externos.
- Hashes SHA-256 autorizam apenas os estilos e scripts inline injetados pelo dev server (`serve`) durante desenvolvimento, evitando liberar `'unsafe-inline'`.
- Headers defensivos via `<meta http-equiv>`: `X-Content-Type-Options=nosniff`, `Permissions-Policy` restritiva e `referrer` limitado a `same-origin`.
- Single-SPA shell consome SystemJS com SRI + `crossorigin="anonymous"` e hosts validam dinamicamente o teardown antes de novos mounts.
- Remotos carregam CSS proprio (sem inline), exportam APIs idempotentes (`render`, `unmount`, `bootstrap/mount`) e nunca avaliam entrada de usuario.
- Scripts dos hosts normalizam funcoes de cleanup assinc, limpam slots compartilhados e impedem vazamento de listeners.
- `npm run build` copia somente artefatos finais, facilitando pipelines com scanners SAST/DAST e deploy sem tooling desnecessario.

## Deploy (boas praticas)
- Repos separados por micro app, pipelines independentes e versionamento semantico.
- Module Federation: hospede `remoteEntry.js` (ou arquivo remoto equivalente) com cache controlado; hosts leem manifests por ambiente.
- Native Federation: distribua `federation.manifest.json` por ambiente e valide integridade antes de hidratar remotos.
- Single-SPA: mantenha import-maps versionados; preferencialmente sirva MFEs via CDN com cache busting por hash.
- CORS: permita apenas origens host <-> remoto necessarias; associe com HTTPS e headers `Access-Control-Allow-Origin` especificos.
- Observabilidade: health-checks, logs e acordos de contrato entre times para tratar falhas cross-team rapidamente.
