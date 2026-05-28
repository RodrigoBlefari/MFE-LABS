#!/bin/bash

set -euo pipefail

echo "⚡ MFE-LABS - Shell Angular 20 (Estudo)"
echo "========================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Função para matar processo em uma porta específica
kill_port() {
  local port=$1
  echo "   └─ Verificando porta $port..."
  
  if command -v lsof >/dev/null 2>&1; then
    # Unix/Mac usando lsof
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
      echo "   └─ Matando processo $pid na porta $port"
      kill -9 $pid 2>/dev/null || true
      sleep 1
    fi
  elif command -v netstat >/dev/null 2>&1; then
    # Windows usando netstat
    local pid=$(netstat -ano | grep ":$port " | awk '{print $5}' | head -n1)
    if [ -n "$pid" ] && [ "$pid" != "0" ]; then
      echo "   └─ Matando processo $pid na porta $port"
      taskkill //PID $pid //F 2>/dev/null || true
      sleep 1
    fi
  fi
}

# Limpa portas que serão usadas
echo ""
echo "🧹 Limpando portas em uso..."
kill_port 4200  # Shell Angular
kill_port 9100  # Shell Vanilla
kill_port 9001  # Vue
kill_port 9101  # Native Federation
kill_port 9201  # React
kill_port 9301  # Module Federation
kill_port 9302  # Single-SPA
kill_port 9310  # Angular 15
kill_port 9400  # Angular 20 Native Federation

# 1. Build Angular 20 Native Federation (MFE)
echo ""
echo "📦 [1/4] Building Angular 20 Native Federation (MFE)..."
cd "$ROOT_DIR/MFEs/angular/mfe-ng-full"

if [ ! -d "node_modules/@angular-architects/native-federation" ]; then
  echo "   └─ Instalando dependências..."
  npm install
fi

echo "   └─ Building com Native Federation..."
npm run package

# 2. Build Angular 20 Shell (HOST)
echo ""
echo "📦 [2/4] Building Angular 20 Shell (HOST)..."
cd "$ROOT_DIR/angular-shell-20"

if [ ! -d "node_modules" ]; then
  echo "   └─ Instalando dependências..."
  npm install
fi

echo "   └─ Building Shell Angular..."
npm run build

# 3. Inicia todos os MFEs (sem shell ainda)
echo ""
echo "🎯 [3/4] Iniciando MFEs em background..."
cd "$ROOT_DIR"
bash run-native-shell.sh &
MFE_PID=$!

echo "   └─ MFEs iniciando em background (PID: $MFE_PID)"
echo "   └─ Aguardando 30 segundos para MFEs inicializarem..."
sleep 30

# 3.5. Expõe MFEs via túneis públicos (Cloudflare)
echo ""
echo "🌐 [3.5/4] Expondo MFEs via túneis públicos..."
if [ -f "$ROOT_DIR/cloudflared.exe" ] || command -v cloudflared >/dev/null 2>&1; then
  bash "$ROOT_DIR/expose-public.sh" &
  TUNNEL_PID=$!
  echo "   └─ Túneis Cloudflare iniciando em background (PID: $TUNNEL_PID)"
  echo "   └─ Aguardando 15 segundos para túneis serem criados..."
  sleep 15
  
  # Verifica se remotes.public.json foi criado
  if [ -f "$ROOT_DIR/native-federation-shell-angular/remotes.public.json" ]; then
    echo "   └─ ✅ URLs públicas configuradas!"
    echo "   └─ Arquivo: native-federation-shell-angular/remotes.public.json"
  else
    echo "   └─ ⚠️  remotes.public.json não foi criado, usando localhost"
  fi
else
  echo "   └─ ⚠️  cloudflared não encontrado, usando apenas localhost"
  echo "   └─ Para expor publicamente, instale: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/"
fi

# 4. Inicia Shell Angular 20
echo ""
echo "🚀 [4/4] Iniciando Shell Angular 20..."
cd "$ROOT_DIR/angular-shell-20"

echo ""
echo "✅ SHELL ANGULAR 20 PRONTO!"
echo "==========================="
echo ""
echo "⚡ Shell: Angular 20 + Native Federation (Estudo)"
echo "🔗 Compartilhando runtime: @angular/core, rxjs, zone.js + 10 libs"
echo ""
echo "📊 Acesse:"
echo "   🏠 Shell Angular: http://localhost:4200"
echo "   🏠 Shell Vanilla: http://localhost:9100"
echo ""
echo "✨ Features:"
echo "   ✅ Angular 20 Host (Native Federation)"
echo "   ✅ Compartilha runtime com MFEs"
echo "   ✅ Lista de 7 MFEs disponíveis"
echo "   ✅ Carregamento simples (estudo)"
echo ""
echo "🛑 Para parar tudo:"
echo "   kill $MFE_PID"
echo "   Ctrl+C (shell Angular)"
echo ""
echo "📝 Logs dos MFEs:"
echo "   tail -f .run-logs/*.log"
echo ""

# Inicia o shell Angular (foreground)
npm start
