#!/usr/bin/env bash

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="${1:-$ROOT_DIR/docs/qc-reports}"
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
LOG_FILE="$REPORT_DIR/qc-regression-$TIMESTAMP.log"
SUMMARY_FILE="$REPORT_DIR/qc-regression-$TIMESTAMP.summary"

PASS_COUNT=0
FAIL_COUNT=0

mkdir -p "$REPORT_DIR"
: > "$LOG_FILE"
: > "$SUMMARY_FILE"

run_check() {
  local name="$1"
  local command="$2"

  {
    echo "============================================================"
    echo "CHECK: $name"
    echo "TIME:  $(date '+%Y-%m-%d %H:%M:%S')"
    echo "CMD:   $command"
    echo "------------------------------------------------------------"
  } >> "$LOG_FILE"

  if bash -lc "cd '$ROOT_DIR' && $command" >> "$LOG_FILE" 2>&1; then
    echo "[PASS] $name" | tee -a "$SUMMARY_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    local exit_code=$?
    echo "[FAIL] $name (exit=$exit_code)" | tee -a "$SUMMARY_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  echo >> "$LOG_FILE"
}

run_check "backend:test" "cd backend && npm run test:run"
run_check "frontend:test" "cd frontend && npm run test:run"
run_check "backend:build" "cd backend && npm run build"
run_check "frontend:build" "cd frontend && npm run build"
run_check "frontend:lint" "cd frontend && npm run lint"

{
  echo
  echo "Summary: PASS=$PASS_COUNT FAIL=$FAIL_COUNT"
  echo "Log: $LOG_FILE"
} | tee -a "$SUMMARY_FILE"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi

exit 0
