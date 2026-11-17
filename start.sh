#!/usr/bin/env bash
set -euo pipefail

run() { /usr/bin/time -p "$@"; }
script_path="$(run realpath "$0")"
project_dir="${script_path%/*}"
cd "$project_dir"
web_dir="${OPENCODE_WEB_DIR:?OPENCODE_WEB_DIR must point to the worker metadata directory}"
build_dir="$project_dir/dist"

run npm install --ignore-scripts --no-audit --no-fund
run npm run build
run mkdir -p "$web_dir"
PROJECT_DIR="$project_dir" BUILD_DIR="$build_dir" run node --input-type=module -e 'import { writeFileSync } from "node:fs"; writeFileSync(`${process.env.OPENCODE_WEB_DIR}/deployment-output.json`, JSON.stringify({ project: process.env.PROJECT_DIR, directory: process.env.BUILD_DIR }));'
STATIC_DIR="$build_dir" PORT="${PORT:-3000}" run node server.mjs
