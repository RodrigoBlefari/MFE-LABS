#!/usr/bin/env bash
# Display status of running processes and services

LOG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.run-logs"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║         MFE Labs - Status Report                         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check running processes
echo "📊 Processos em Execução:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

count=0
for pidfile in "$LOG_DIR"/*.pid; do
  [ -f "$pidfile" ] || continue
  pid=$(cat "$pidfile" 2>/dev/null || true)
  svc=$(basename "$pidfile" .pid)
  
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "✓ $svc (PID: $pid)"
    count=$((count + 1))
  else
    echo "✗ $svc (morto)"
  fi
done

if [ $count -eq 0 ]; then
  echo "  (nenhum processo em execução)"
fi

echo ""
echo "🌐 Serviços de Rede:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

declare -A services=(
  [Vue]="9001"
  [NativeF]="9101"
  [ModuleF]="9301"
  [SingleSPA]="9302"
  [Angular15]="9310"
  [Angular20]="9400"
  [React]="9201"
  [Shell]="8080"
)

for svc in "${!services[@]}"; do
  port="${services[$svc]}"
  if curl --silent --fail --max-time 1 "http://localhost:$port/" >/dev/null 2>&1; then
    echo "✓ $svc (localhost:$port)"
  else
    echo "✗ $svc (localhost:$port)"
  fi
done

echo ""
echo "📁 Logs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "$LOG_DIR" ]; then
  ls -lh "$LOG_DIR"/*.log 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
  echo ""
  echo "Tail de logs:"
  echo "  npm run logs       # Todos"
  echo "  npm run logs:shell # Shell"
  echo "  npm run logs:mfes  # MFEs"
else
  echo "  Nenhum log encontrado"
fi

echo ""
echo "🎯 Comandos Úteis:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  npm start              # Build + Start (recomendado)"
echo "  npm run start:dev      # Start sem build"
echo "  npm run health-check   # Verificar saúde"
echo "  npm run stop           # Parar tudo"
echo "  npm run clean          # Limpar node_modules"
echo "  npm run open:shell     # Abrir shell no navegador"
echo ""
