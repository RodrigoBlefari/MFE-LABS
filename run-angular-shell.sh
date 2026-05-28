#!/bin/bash

set -euo pipefail

echo "🚀 Angular 20 Host Shell - Native Federation"
echo "=============================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHELL_DIR="$ROOT_DIR/angular-shell-20"

# 1. Build Angular 20 Shell
echo ""
echo "📦 [1/2] Building Angular 20 Shell..."
cd "$SHELL_DIR"

if [ ! -d "node_modules" ]; then
  echo "   └─ Instalando dependências..."
  npm install
fi

echo "   └─ Building com Native Federation..."
npm run build

# 2. Serve
echo ""
echo "🚀 [2/2] Starting Angular 20 Shell..."
echo "   └─ Shell rodando em: http://localhost:4200"
echo ""
echo "📝 Nota: Este é o shell Angular 20 (em desenvolvimento)"
echo "   Para usar o shell Vanilla JS (produção): bash run-native-shell.sh"
echo ""

npm start
