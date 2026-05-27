#!/usr/bin/env bash
set -euo pipefail

# run-native-shell.sh
# Instala e inicia o MFE Native Federation (mfe1) em background e inicia o shell Native Federation em foreground.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/.run-logs"
mkdir -p "$LOG_DIR"

echo "[run-native-shell] Root: $ROOT_DIR"

echo "[run-native-shell] Validando contrato de shared dependencies..."
if ! node "$ROOT_DIR/.run-scripts/validate-shared-deps.js"; then
  echo "[run-native-shell] Falha na validação de shared dependencies. Abortando startup." >&2
  exit 3
fi

MFE_ENV="${MFE_ENV:-dev}"
echo "[run-native-shell] Validando governança de remotos (env=$MFE_ENV)..."
if ! node "$ROOT_DIR/.run-scripts/validate-remote-governance.js" --env="$MFE_ENV" --check-live=false; then
  echo "[run-native-shell] Falha na validação de governança de remotos. Abortando startup." >&2
  exit 4
fi

SHELL_DIR="$ROOT_DIR/native-federation-shell-angular"

if [ ! -d "$SHELL_DIR" ]; then
  echo "Erro: Shell não encontrado em $SHELL_DIR" >&2
  exit 2
fi

# portas comuns usadas pelos serviços (melhore conforme necessário)
PORTS=(9001 9101 9200 9201 9301 9302 9303 9310 9400)

kill_port() {
  local port=$1
  echo "[kill] Tentando liberar porta $port"
  # tentar fuser (Linux)
  if command -v fuser >/dev/null 2>&1; then
    fuser -k ${port}/tcp 2>/dev/null || true
  fi
  # tentar lsof
  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -t -i:${port} || true)
    if [ -n "$pids" ]; then
      echo "$pids" | xargs -r kill -9 || true
    fi
  fi
  # fallback para sistemas com ss
  if command -v ss >/dev/null 2>&1; then
    pid=$(ss -ltnp 2>/dev/null | grep -E ":${port}( |$)" | sed -n 's/.*pid=\([0-9]*\),.*/\1/p' | head -n1 || true)
    if [ -n "$pid" ]; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi
  # Windows (Git Bash): tentar netstat + taskkill
  if command -v netstat >/dev/null 2>&1 && command -v awk >/dev/null 2>&1; then
    line=$(netstat -ano 2>/dev/null | grep -E "[:.]${port} " | head -n1 || true)
    if [ -n "$line" ]; then
      pid=$(echo "$line" | awk '{print $NF}')
      if [ -n "$pid" ]; then
        taskkill //F //PID "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
      fi
    fi
  fi
}

echo "[run-native-shell] Liberando portas conhecidas..."
for p in "${PORTS[@]}"; do
  kill_port "$p"
done

# Helpers para nvm
load_nvm() {
  if [ -n "${NVM_DIR-}" ] && [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
    return 0
  fi
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    NVM_DIR="$HOME/.nvm"
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
    return 0
  fi
  return 1
}

ensure_nvm() {
  if load_nvm; then
    echo "[nvm] nvm carregado"
    return 0
  fi
  echo "[nvm] nvm não encontrado — instalando..."
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
  else
    echo "[nvm] curl ou wget não encontrado — não é possível instalar nvm automaticamente" >&2
    return 1
  fi
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh" || true
  if load_nvm; then
    echo "[nvm] nvm instalado e carregado"
    return 0
  fi
  echo "[nvm] Falha ao instalar nvm" >&2
  return 1
}

ensure_node_for_project() {
  local dir="$1"
  # precedence: .nvmrc -> package.json engines.node -> default lts
  local ver=""
  if [ -f "$dir/.nvmrc" ]; then
    ver=$(cat "$dir/.nvmrc" | tr -d ' \n\r')
  else
    if [ -f "$dir/package.json" ]; then
      ver=$(node -e 'const fs=require("fs"); try{const p=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); process.stdout.write((p.engines&&p.engines.node)||"")}catch(e){process.stdout.write("")}' "$dir/package.json" 2>/dev/null || true)
    fi
  fi
  # heuristica simples: se vazio -> lts/* ; se começar com non-digit, strip to digits
  if [ -z "$ver" ]; then
    ver="lts/*"
  else
    # extrai primeiro grupo numerico (ex: ^14.15.0 -> 14.15.0 ; >=14 -> 14)
    if [[ "$ver" =~ ([0-9]+(\.[0-9]+){0,2}) ]]; then
      ver="${BASH_REMATCH[1]}"
    else
      :
    fi
  fi

  echo "[nvm] Assegurando Node $ver para $dir"
  # tenta ativar binários já instalados pelo nvm diretamente ajustando PATH
  if [ -n "${NVM_DIR-}" ]; then
    # forma esperada: $NVM_DIR/versions/node/v<ver>
    candidate="$NVM_DIR/versions/node/v$ver"
    if [ ! -x "$candidate/bin/node" ]; then
      # se não existir diretório exato, tenta buscar por prefixo (major/minor)
      cand=$(ls -1 "$NVM_DIR/versions/node" 2>/dev/null | grep "^v$ver" | sort -V | tail -n1 || true)
      if [ -n "$cand" ]; then
        candidate="$NVM_DIR/versions/node/$cand"
      fi
    fi
    if [ -x "$candidate/bin/node" ]; then
      export PATH="$candidate/bin:$PATH"
      export NVM_BIN="$candidate/bin"
      export NVM_INC="$candidate/include/node"
      echo "[nvm] ativado $candidate (node $(node -v 2>/dev/null || echo '?'))"
      return 0
    else
      echo "[nvm] versão $ver não encontrada em $NVM_DIR/versions/node"
      # tenta instalar como fallback (pode demorar)
      if command -v nvm >/dev/null 2>&1; then
        echo "[nvm] instalando $ver via nvm (fallback)"
        nvm install "$ver" >/dev/null 2>&1 || nvm install "$ver" || true
        # tenta ativar após instalação
        if [ -x "$NVM_DIR/versions/node/v$ver/bin/node" ]; then
          export PATH="$NVM_DIR/versions/node/v$ver/bin:$PATH"
          export NVM_BIN="$NVM_DIR/versions/node/v$ver/bin"
          export NVM_INC="$NVM_DIR/versions/node/v$ver/include/node"
          echo "[nvm] ativado após instalação v$ver -> $(node -v 2>/dev/null || echo '?')"
          return 0
        fi
      fi
    fi
  fi
  # último recurso: não há nvm ou não foi possível ativar; avisa e segue
  echo "[nvm] não foi possível ativar Node $ver para $dir; continue com PATH atual"
}

if ! ensure_nvm; then
  echo "[run-native-shell] aviso: nvm não disponível, continuará sem gerenciamento de versões" >&2
  NVM_OK=0
else
  NVM_OK=1
  # não forçamos 'nvm use' globalmente (pode travar em alguns ambientes);
  # em vez disso, tentamos usar uma versão já instalada via NVM_DIR/versions
  echo "[nvm] nvm carregado (sem 'nvm use' automático)"
  if command -v node >/dev/null 2>&1; then
    echo "[nvm] node presente no PATH -> $(node -v)"
  else
    # tenta ativar o último node instalado pelo nvm (se houver)
    if [ -n "${NVM_DIR-}" ] && [ -d "$NVM_DIR/versions/node" ]; then
      last=$(ls -1 "$NVM_DIR/versions/node" | sort -V | tail -n1 2>/dev/null || true)
      if [ -n "$last" ] && [ -x "$NVM_DIR/versions/node/$last/bin/node" ]; then
        export PATH="$NVM_DIR/versions/node/$last/bin:$PATH"
        export NVM_BIN="$NVM_DIR/versions/node/$last/bin"
        export NVM_INC="$NVM_DIR/versions/node/$last/include/node"
        echo "[nvm] ativado node de $NVM_DIR/versions/node/$last -> $(node -v 2>/dev/null || echo '?')"
      else
        echo "[nvm] nenhum node instalado encontrado em $NVM_DIR/versions/node"
      fi
    else
      echo "[nvm] NVM_DIR ou versions não encontrados; node não está no PATH"
    fi
  fi
fi

echo "[run-native-shell] Scanning MFEs and starting any project with package.json/start script..."
STARTED=()
FAILED=()

install_deps_for_mfe() {
  local name="$1"
  local attempts=0

  if [ "$name" = "mfe-ng-full" ] || [ "$name" = "mfe-ng" ] || [ "$name" = "mfe-a" ]; then
    echo "[mfe:$name] Instalando deps com --legacy-peer-deps (compat Angular/Single-SPA)"
    until npm install --legacy-peer-deps >/dev/null 2>&1; do
      attempts=$((attempts + 1))
      echo "[mfe:$name] npm install --legacy-peer-deps falhou (tentativa $attempts)"
      if [ $attempts -ge 3 ]; then
        return 1
      fi
      sleep 1
    done
    return 0
  fi

  until npm ci >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    echo "[mfe:$name] npm ci falhou (tentativa $attempts) - tentando npm install"
    npm install >/dev/null 2>&1 || true
    if [ $attempts -ge 3 ]; then
      return 1
    fi
    sleep 1
  done
  return 0
}

shopt -s nullglob || true
for mfe_dir in "$ROOT_DIR"/MFEs/*/*; do
  if [ -d "$mfe_dir" ] && [ -f "$mfe_dir/package.json" ]; then
    name=$(basename "$mfe_dir")
    echo "[mfe] Preparando $name in $mfe_dir"

    # entra no diretório do MFE (no mesmo shell para que 'nvm use' tenha efeito)
    pushd "$mfe_dir" >/dev/null || continue

    # Se nvm estiver disponível, assegura a versão de node requerida pelo projeto
    if [ "${NVM_OK-0}" -eq 1 ]; then
      ensure_node_for_project "$mfe_dir"
    fi

    # tenta instalar e iniciar se existir script 'start'
    if grep -q '"start"' package.json 2>/dev/null; then
      echo "[mfe:$name] Instalando deps..."
      if ! install_deps_for_mfe "$name"; then
        echo "[mfe:$name] Falha ao instalar dependências após múltiplas tentativas"
        FAILED+=("$name")
      fi

      if [[ " ${FAILED[*]} " =~ " $name " ]]; then
        popd >/dev/null || true
        continue
      fi

      LOG_FILE="$LOG_DIR/${name}.log"
      echo "[mfe:$name] Iniciando (log: $LOG_FILE)"
      npm start > "$LOG_FILE" 2>&1 &
      pid=$!
      echo $pid > "$LOG_DIR/${name}.pid"

      # espera curto e verifica se o processo está vivo
      sleep 2
      if kill -0 "$pid" 2>/dev/null; then
        echo "[mfe:$name] Iniciado PID $pid"
        STARTED+=("$name")
      else
        echo "[mfe:$name] Falhou ao iniciar (PID not running) - ver $LOG_FILE"
        FAILED+=("$name")
      fi
      # health-check: tenta extrair porta do script de start e aguardar disponibilidade HTTP
      # extrai start script via node (estamos no diretório do MFE)
      start_cmd=$(node -e "try{const p=require('./package.json'); console.log((p.scripts&&p.scripts.start)||'') }catch(e){console.log('')}" 2>/dev/null || true)
      port=''
      if [[ "$start_cmd" =~ -l[[:space:]]*([0-9]{3,5}) ]]; then
        port="${BASH_REMATCH[1]}"
      elif [[ "$start_cmd" =~ --port[=[:space:]]*([0-9]{3,5}) ]]; then
        port="${BASH_REMATCH[1]}"
      elif [[ "$start_cmd" =~ -p[[:space:]]*([0-9]{3,5}) ]]; then
        port="${BASH_REMATCH[1]}"
      fi
      # se não detectou porta, tenta ler do log o primeiro http://localhost:PORT
      if [ -z "$port" ]; then
        port=$(grep -Eo "http://localhost:[0-9]{3,5}" "$LOG_FILE" | head -n1 | sed 's|http://localhost:||' || true)
      fi
      # se ainda vazio, tenta os PORTS conhecidos
      if [ -z "$port" ]; then
        for p in "${PORTS[@]}"; do
          if curl --silent --fail --max-time 2 "http://localhost:$p/" >/dev/null 2>&1; then
            port=$p
            break
          fi
        done
      fi
      if [ -n "$port" ]; then
        echo "[mfe:$name] Health-check -> polling http://localhost:$port/"
        attempts=0
        until curl --silent --fail --max-time 2 "http://localhost:$port/" >/dev/null 2>&1; do
          attempts=$((attempts+1))
          sleep 1
          if [ $attempts -ge 15 ]; then
            echo "[mfe:$name] health-check timed out after $attempts seconds (port $port); check $LOG_FILE"
            break
          fi
        done
        if [ $attempts -lt 15 ]; then
          echo "[mfe:$name] Health OK on port $port"
        fi
      else
        echo "[mfe:$name] Não foi possível detectar porta para health-check; consulte $LOG_FILE"
      fi
    else
      echo "[mfe:$name] Sem script 'start' — pulando"
    fi

    popd >/dev/null || true
  fi
done

echo "[run-native-shell] Resumo de inicio de MFEs:"
echo "  Iniciados: ${STARTED[*]:-none}"
echo "  Falhados: ${FAILED[*]:-none}"

echo "[run-native-shell] Gerando mapa de versões (mfe-versions.json)..."
# Map de nomes de pasta para ids do registry no shell
declare -A NAME_TO_ID=(
  [mfe1]=nf
  [remote-a]=mf
  [mfe-a]=ssa
  [mfe-ng]=ng
  [mfe-ng-full]=ng-full
  [mfe-react]=react
  [mfe-vue]=vue
)

VERSIONS_FILE="$SHELL_DIR/mfe-versions.json"
echo "{" > "$VERSIONS_FILE"
first=1
for pkg in "$ROOT_DIR"/MFEs/*/*/package.json; do
  [ -f "$pkg" ] || continue
  dir=$(basename "$(dirname "$pkg")")
  id=${NAME_TO_ID[$dir]:-}
  if [ -z "$id" ]; then
    id="$dir"
  fi

  # Node helper: tenta extrair versão do framework a partir de package.json (deps) ou dos arquivos .js
  # call the helper JS script to detect framework/version
  fw=$(node "$ROOT_DIR/.run-scripts/detect-framework.js" "$pkg" "$(dirname "$pkg")" 2>/dev/null || echo "--")

  # normalize whitespace/newlines into a single trimmed line
  fw=$(printf '%s' "$fw" | tr -d '\r' | tr '\n' ' ' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

  if [ "$first" -eq 1 ]; then
    first=0
  else
    echo "," >> "$VERSIONS_FILE"
  fi
  # escape double quotes and backslashes for safe JSON output
  esc_fw=$(printf '%s' "$fw" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '  "%s": "%s"' "$id" "$esc_fw" >> "$VERSIONS_FILE"
done
printf '\n}\n' >> "$VERSIONS_FILE"
echo "[run-native-shell] Wrote $VERSIONS_FILE"

# If requested, only generate versions file and exit (safe dry-run)
if [ "${GENERATE_ONLY-0}" = "1" ] || [ "${GENERATE_MFE_VERSIONS_ONLY-0}" = "1" ]; then
  echo "[run-native-shell] GENERATE_ONLY set -> exiting after generating $VERSIONS_FILE"
  exit 0
fi

echo "[run-native-shell] Iniciando shell Native Federation (em primeiro plano)..."
( 
  cd "$SHELL_DIR"
  if [ -f package.json ]; then
    echo "[shell] Instalando dependências (npm ci || npm install)..."
    npm ci || npm install || true
  fi
  echo "[shell] Logs: $LOG_DIR/shell.log"
  npm start 2>&1 | tee "$LOG_DIR/shell.log"
)

echo "[run-native-shell] Shell finalizado. Limpando processos em background..."
for pidfile in "$LOG_DIR"/*.pid; do
  [ -f "$pidfile" ] || continue
  pid=$(cat "$pidfile" 2>/dev/null || true)
  svc=$(basename "$pidfile" .pid)
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "Matando $svc PID: $pid"
    kill "$pid" 2>/dev/null || true
  fi
  rm -f "$pidfile" || true
done

echo "[run-native-shell] Concluído. Logs em $LOG_DIR"
