#!/usr/bin/env bash
set -euo pipefail

run() { /usr/bin/time -p "$@"; }
script_path="$(run realpath "$0")"
project_dir="${script_path%/*}"
cd "$project_dir"
: "${CAPTURE_URL:?CAPTURE_URL must be set}" "${CAPTURE_DIR:?CAPTURE_DIR must be set}"
run mkdir -p "$CAPTURE_DIR"
run node capture.mjs
