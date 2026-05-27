#!/usr/bin/env bash
# Stop all running MFE processes and shell

LOG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.run-logs"

echo "[stop-all] Parando todos os processos MFE e Shell..."

if [ ! -d "$LOG_DIR" ]; then
  echo "[stop-all] Nenhum Log_DIR encontrado em $LOG_DIR"
  exit 0
fi

killed=0
for pidfile in "$LOG_DIR"/*.pid; do
  [ -f "$pidfile" ] || continue
  pid=$(cat "$pidfile" 2>/dev/null || true)
  svc=$(basename "$pidfile" .pid)
  
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "[stop-all] Parando $svc (PID: $pid)"
    kill -TERM "$pid" 2>/dev/null || true
    
    # wait a bit then force kill if still alive
    sleep 2
    if kill -0 "$pid" 2>/dev/null; then
      echo "[stop-all] Force killing $svc (PID: $pid)"
      kill -9 "$pid" 2>/dev/null || true
    fi
    killed=$((killed + 1))
  fi
  rm -f "$pidfile" || true
done

echo "[stop-all] Parados $killed processos"
echo "[stop-all] Logs disponíveis em: $LOG_DIR"
exit 0
