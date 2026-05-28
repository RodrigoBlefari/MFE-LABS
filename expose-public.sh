#!/bin/bash

set -euo pipefail

# Script para expor MFEs via túnel público (cloudflared ou localtunnel)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Portas a expor
PORTS=(9001 9101 9201 9301 9302 9303 9310 9400)
TUNNEL_TOOL="${TUNNEL_TOOL:-auto}" # auto, cloudflared, localtunnel, ngrok

echo "🌐 [expose-public] Expondo MFEs publicamente..."

# Detecta ferramenta disponível
detect_tunnel_tool() {
  if [ "$TUNNEL_TOOL" != "auto" ]; then
    echo "$TUNNEL_TOOL"
    return
  fi
  
  # Verifica cloudflared local primeiro
  if [ -f "$ROOT_DIR/cloudflared.exe" ]; then
    echo "cloudflared-local"
  elif command -v cloudflared >/dev/null 2>&1; then
    echo "cloudflared"
  elif command -v lt >/dev/null 2>&1 || command -v npx >/dev/null 2>&1; then
    echo "localtunnel"
  elif command -v ngrok >/dev/null 2>&1; then
    echo "ngrok"
  else
    echo "none"
  fi
}

TOOL=$(detect_tunnel_tool)

if [ "$TOOL" = "none" ]; then
  echo "❌ Nenhuma ferramenta de túnel encontrada!"
  echo ""
  echo "Instale uma das opções:"
  echo "  1. Cloudflared (RECOMENDADO): https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
  echo "     Windows: choco install cloudflared"
  echo "     Mac: brew install cloudflared"
  echo ""
  echo "  2. Localtunnel: npm install -g localtunnel"
  echo ""
  echo "  3. ngrok: https://ngrok.com/download"
  exit 1
fi

echo "✅ Usando: $TOOL"

# Map de porta -> ID do MFE
declare -A PORT_TO_ID=(
  [9001]="vue"
  [9101]="nf"
  [9201]="react"
  [9301]="mf"
  [9302]="ssa"
  [9303]="extra"
  [9310]="ng"
  [9400]="ng-full"
)

declare -A PUBLIC_URLS

# Função para criar túnel com cloudflared
tunnel_cloudflared() {
  local port=$1
  local id=${PORT_TO_ID[$port]:-"port-$port"}
  
  echo "🔗 Criando túnel cloudflared para porta $port ($id)..."
  
  # Determina comando cloudflared (local ou global)
  local cf_cmd="cloudflared"
  if [ "$TOOL" = "cloudflared-local" ]; then
    cf_cmd="$ROOT_DIR/cloudflared.exe"
  fi
  
  # Inicia cloudflared em background e captura URL
  "$cf_cmd" tunnel --url "http://localhost:$port" > "$ROOT_DIR/.run-logs/tunnel-$port.log" 2>&1 &
  local pid=$!
  echo $pid > "$ROOT_DIR/.run-logs/tunnel-$port.pid"
  
  # Aguarda URL aparecer no log (aumentado para 60s por túnel)
  for i in {1..60}; do
    if [ -f "$ROOT_DIR/.run-logs/tunnel-$port.log" ]; then
      local url=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$ROOT_DIR/.run-logs/tunnel-$port.log" | head -n1)
      if [ -n "$url" ]; then
        PUBLIC_URLS[$port]="$url"
        echo "  ✅ $url"
        return 0
      fi
    fi
    sleep 1
  done
  
  echo "  ⚠️  Timeout aguardando URL (60s)"
  return 1
}

# Função para criar túnel com localtunnel
tunnel_localtunnel() {
  local port=$1
  local id=${PORT_TO_ID[$port]:-"port-$port"}
  local subdomain="mfe-$id-$(date +%s)"
  
  echo "🔗 Criando túnel localtunnel para porta $port ($id)..."
  
  # Tenta com subdomain fixo primeiro
  if command -v lt >/dev/null 2>&1; then
    lt --port $port --subdomain "$subdomain" > "$ROOT_DIR/.run-logs/tunnel-$port.log" 2>&1 &
  else
    npx localtunnel --port $port --subdomain "$subdomain" > "$ROOT_DIR/.run-logs/tunnel-$port.log" 2>&1 &
  fi
  
  local pid=$!
  echo $pid > "$ROOT_DIR/.run-logs/tunnel-$port.pid"
  
  # Aguarda URL
  for i in {1..30}; do
    if [ -f "$ROOT_DIR/.run-logs/tunnel-$port.log" ]; then
      local url=$(grep -oP 'https://[a-z0-9-]+\.loca\.lt' "$ROOT_DIR/.run-logs/tunnel-$port.log" | head -n1)
      if [ -n "$url" ]; then
        PUBLIC_URLS[$port]="$url"
        echo "  ✅ $url"
        return 0
      fi
    fi
    sleep 1
  done
  
  # Fallback: sem subdomain
  echo "  ⚠️  Tentando sem subdomain..."
  kill $pid 2>/dev/null || true
  
  if command -v lt >/dev/null 2>&1; then
    lt --port $port > "$ROOT_DIR/.run-logs/tunnel-$port.log" 2>&1 &
  else
    npx localtunnel --port $port > "$ROOT_DIR/.run-logs/tunnel-$port.log" 2>&1 &
  fi
  
  local pid=$!
  echo $pid > "$ROOT_DIR/.run-logs/tunnel-$port.pid"
  
  sleep 5
  local url=$(grep -oP 'https://[a-z0-9-]+\.loca\.lt' "$ROOT_DIR/.run-logs/tunnel-$port.log" | head -n1)
  if [ -n "$url" ]; then
    PUBLIC_URLS[$port]="$url"
    echo "  ✅ $url"
    return 0
  fi
  
  return 1
}

# Criar túneis para todas as portas
mkdir -p "$ROOT_DIR/.run-logs"

for port in "${PORTS[@]}"; do
  case "$TOOL" in
    cloudflared|cloudflared-local)
      tunnel_cloudflared "$port" || echo "  ❌ Falhou porta $port"
      ;;
    localtunnel)
      tunnel_localtunnel "$port" || echo "  ❌ Falhou porta $port"
      ;;
    ngrok)
      echo "⚠️  ngrok requer configuração manual para múltiplos túneis"
      echo "   Ver: https://ngrok.com/docs/agent/config/"
      ;;
  esac
done

echo ""
echo "📝 Gerando arquivos de configuração..."

# Gera JSON com URLs públicas para shell Vanilla
cat > "$ROOT_DIR/native-federation-shell-angular/remotes.public.json" << EOF
{
  "env": "public",
  "remotes": {
    "nf": "${PUBLIC_URLS[9101]:-http://localhost:9101}/mfe1.js",
    "mf": "${PUBLIC_URLS[9301]:-http://localhost:9301}/remote-a.js",
    "ssa": "${PUBLIC_URLS[9302]:-http://localhost:9302}/mfe-a.js",
    "ng": "${PUBLIC_URLS[9310]:-http://localhost:9310}/mfe-ng.js",
    "ng-full": "${PUBLIC_URLS[9400]:-http://localhost:9400}/mfe-ng-full.js",
    "react": "${PUBLIC_URLS[9201]:-http://localhost:9201}/mfe-react.js",
    "vue": "${PUBLIC_URLS[9001]:-http://localhost:9001}/mfe-vue.js"
  }
}
EOF

echo "✅ Arquivo gerado: native-federation-shell-angular/remotes.public.json"

# Gera JSON com URLs públicas para shell Angular 20
cat > "$ROOT_DIR/angular-shell-20/public/remotes.public.json" << EOF
{
  "env": "public",
  "remotes": {
    "nf": "${PUBLIC_URLS[9101]:-http://localhost:9101}/mfe1.js",
    "mf": "${PUBLIC_URLS[9301]:-http://localhost:9301}/remote-a.js",
    "ssa": "${PUBLIC_URLS[9302]:-http://localhost:9302}/mfe-a.js",
    "ng": "${PUBLIC_URLS[9310]:-http://localhost:9310}/mfe-ng.js",
    "ng-full": "${PUBLIC_URLS[9400]:-http://localhost:9400}/mfe-ng-full.js",
    "react": "${PUBLIC_URLS[9201]:-http://localhost:9201}/mfe-react.js",
    "vue": "${PUBLIC_URLS[9001]:-http://localhost:9001}/mfe-vue.js"
  }
}
EOF

echo "✅ Arquivo gerado: angular-shell-20/public/remotes.public.json"
echo ""
echo "🌐 URLs Públicas:"
for port in "${!PUBLIC_URLS[@]}"; do
  echo "  Porta $port: ${PUBLIC_URLS[$port]}"
done

echo ""
echo "🚀 Para usar as URLs públicas, acesse:"
echo "   http://localhost:9100/?env=public"
echo ""
echo "⚠️  Para parar os túneis:"
echo "   kill \$(cat $ROOT_DIR/.run-logs/tunnel-*.pid)"
