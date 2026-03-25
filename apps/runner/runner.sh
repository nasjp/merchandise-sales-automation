#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

# .env.production から環境変数を読み込み
set -a
source .env.production
set +a

export PATH="$HOME/.local/share/pnpm:$HOME/.volta/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

case "${1:-start}" in
  start)
    echo "starting runner (pid will be in logs/runner.lock)..."
    nohup pnpm --filter @merchandise/runner start >> logs/runner.log 2>&1 &
    echo "started. pid=$!"
    ;;
  stop)
    LOCK="$PROJECT_ROOT/logs/runner.lock"
    if [ -f "$LOCK" ]; then
      PID=$(cat "$LOCK")
      kill "$PID" 2>/dev/null && echo "stopped pid=$PID" || echo "process $PID not found"
      rm -f "$LOCK"
    else
      echo "no runner.lock found"
    fi
    ;;
  status)
    LOCK="$PROJECT_ROOT/logs/runner.lock"
    if [ -f "$LOCK" ]; then
      PID=$(cat "$LOCK")
      if kill -0 "$PID" 2>/dev/null; then
        echo "running (pid=$PID)"
      else
        echo "dead (stale lock, pid=$PID)"
      fi
    else
      echo "not running"
    fi
    ;;
  *)
    echo "usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
