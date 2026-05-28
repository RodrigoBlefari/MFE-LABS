#!/bin/bash

set -euo pipefail

echo "🚀 MFE-LABS - Build & Run Completo"
echo "=================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Build Angular 20 Native Federation (MFE)
echo ""
echo "📦 [1/4] Building Angular 20 Native Federation (MFE)..."
cd "$ROOT_DIR/MFEs/angular/mfe-ng-full"

if [ ! -d "node_modules/@angular-architects/native-federation" ]; then
  echo "   └─ Instalando dependências..."
  npm install
fi

echo "   └─ Building with Native Federation..."
npm run package

# 1.5 Build Angular 20 Shell (se existir)
if [ -d "$ROOT_DIR/angular-shell-20" ]; then
  echo ""
  echo "📦 [1.5/4] Building Angular 20 Shell (Host)..."
  cd "$ROOT_DIR/angular-shell-20"
  
  if [ ! -d "node_modules" ]; then
    echo "   └─ Instalando dependências..."
    npm install
  fi
  
  echo "   └─ Building Angular Shell..."
  npm run build
else
  echo ""
  echo "⏭️  [1.5/4] Angular 20 Shell não existe ainda (será criado futuramente)"
fi

# 2. Inicia todos os MFEs e Shell
echo ""
echo "🎯 [2/3] Iniciando MFEs e Shell..."
cd "$ROOT_DIR"
bash run-native-shell.sh &
RUN_PID=$!

echo "   └─ Shell iniciando em background (PID: $RUN_PID)"
echo "   └─ Aguardando 30 segundos para MFEs inicializarem..."
sleep 30

# 3. Cria túneis públicos (opcional)
echo ""
echo "🌐 [3/3] Criando túneis públicos..."

if command -v lt >/dev/null 2>&1 || command -v cloudflared >/dev/null 2>&1; then
  bash expose-public.sh &
  TUNNEL_PID=$!
  echo "   └─ Túneis iniciando em background (PID: $TUNNEL_PID)"
else
  echo "   └─ ⚠️  localtunnel ou cloudflared não instalado - pulando túneis"
  echo "   └─ Para instalar: npm install -g localtunnel"
fi

echo ""
echo "✅ TUDO PRONTO!"
echo "==============="
echo ""
echo "📊 Acesse:"
echo "   🏠 Localhost:  http://localhost:9100"
echo "   🌐 Público:    http://localhost:9100/?env=public"
echo ""
echo "🛑 Para parar tudo:"
echo "   kill $RUN_PID"
if [ -n "${TUNNEL_PID:-}" ]; then
  echo "   kill $TUNNEL_PID"
fi
echo "   ou use Ctrl+C"
echo ""
echo "📝 Logs:"
echo "   tail -f .run-logs/*.log"
echo ""

# Mantém script rodando
wait
