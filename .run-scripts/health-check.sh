#!/usr/bin/env bash
# Health check for all running services

PORTS=(9001 9101 9200 9201 9301 9302 9303 9310 9400 8080)
SERVICES=(
  "vue:9001"
  "nf:9101"
  "mf:9301"
  "ssa:9302"
  "ng:9310"
  "ng-full:9400"
  "react:9201"
  "shell:8080"
)

echo "[health-check] Verificando status dos serviços..."
echo ""

healthy=0
total=${#SERVICES[@]}

for service in "${SERVICES[@]}"; do
  name=$(echo "$service" | cut -d: -f1)
  port=$(echo "$service" | cut -d: -f2)
  
  if curl --silent --fail --max-time 2 "http://localhost:$port/" >/dev/null 2>&1; then
    echo "✓ $name (localhost:$port) - OK"
    healthy=$((healthy + 1))
  else
    echo "✗ $name (localhost:$port) - DOWN"
  fi
done

echo ""
echo "[health-check] Resultado: $healthy/$total serviços online"
echo ""

if [ $healthy -eq $total ]; then
  echo "🟢 Todos os serviços estão rodando!"
  exit 0
else
  echo "🟡 Alguns serviços não estão respondendo. Verifique os logs:"
  echo "   npm run logs"
  exit 1
fi
