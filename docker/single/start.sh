#!/bin/bash
set -euo pipefail
pids=()
shutdown() {
  trap - TERM INT
  for pid in "${pids[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  wait || true
}
trap shutdown TERM INT
gosu node node /work/apps/api/dist/server.js & pids+=("$!")
gosu node node /work/services/supplier/server.mjs & pids+=("$!")
gosu node node /work/services/internal-target/server.mjs & pids+=("$!")
gosu node node /work/services/resource-monitor/server.mjs & pids+=("$!")
nginx -g 'daemon off;' & pids+=("$!")
wait -n "${pids[@]}" || true
shutdown
exit 1
