#!/bin/sh
# Runs Tasks.md without Docker, mirroring entrypoint.sh. Data lives outside the repo.
set -eu

REPO_DIR=$(cd "$(dirname "$0")" && pwd)
DATA_DIR=${DATA_DIR:-"$HOME/Code/tasks-md-data"}
TASKS_DIR="$DATA_DIR/tasks"
CONFIG_DIR="$DATA_DIR/config"
PORT=${PORT:-8080}

mkdir -p "$TASKS_DIR" "$CONFIG_DIR/stylesheets" "$CONFIG_DIR/images" "$CONFIG_DIR/sort"
if [ ! -f "$CONFIG_DIR/stylesheets/custom.css" ]; then
  echo "@import url(/stylesheets/color-themes/synthwave.css)" > "$CONFIG_DIR/stylesheets/custom.css"
fi

cd "$REPO_DIR/frontend"
npm run build -- --base=/
rm -f dist/stylesheets/custom.css
rm -rf "$REPO_DIR/backend/static"
mv dist "$REPO_DIR/backend/static"

cd "$REPO_DIR/backend"
cp -R "$CONFIG_DIR/stylesheets/." ./static/stylesheets/
cp -R ./static/stylesheets/. "$CONFIG_DIR/stylesheets/"

CONFIG_DIR="$CONFIG_DIR" TASKS_DIR="$TASKS_DIR" PORT="$PORT" exec node server.js
