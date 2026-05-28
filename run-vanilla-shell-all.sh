#!/bin/bash

set -euo pipefail

echo "🚀 MFE-LABS - Shell Vanilla JS (Produção)"
echo "==========================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Build Angular 20 Native Federation (MFE)
echo ""
echo "📦 [1/3] Building Angular 20 Native Federation (MFE)..."
cd "$ROOT_DIR/MFEs/angular/mfe-ng-full"

if [ ! -d "node_modules/@angular-architects/native-federation" ]; then
  echo "   └─ Instalando dependências..."
  npm install
fi

echo "   └─ Building com Native Federation..."
npm run package

# 2. Inicia todos os MFEs e Shell Vanilla
echo ""
echo "🎯 [2/3] Iniciando MFEs e Shell Vanilla JS..."
cd "$ROOT_DIR"
bash run-native-shell.sh &
RUN_PID=$!

echo "   └─ Shell Vanilla iniciando em background (PID: $RUN_PID)"
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
echo "✅ SHELL VANILLA JS PRONTO!"
echo "============================"
echo ""
echo "🚀 Shell: Vanilla JavaScript (Produção)"
echo ""
echo "📊 Acesse:"
echo "   🏠 Localhost:  http://localhost:9100"
echo "   🌐 Público:    http://localhost:9100/?env=public"
echo ""
echo "✨ Features:"
echo "   ✅ Telemetria completa (cold/warm cache)"
echo "   ✅ Ranking automático de performance"
echo "   ✅ Previews em paralelo"
echo "   ✅ 7 MFEs disponíveis"
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
