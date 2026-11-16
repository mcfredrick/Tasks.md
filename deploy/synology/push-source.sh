#!/bin/sh
# Copies the committed source to the NAS project folder so Container Manager can
# build it. Usage: deploy/synology/push-source.sh user@nas [/volume1/docker/tasks-md]
set -eu

host="$1"
dest="${2:-/volume1/docker/tasks-md}"
cd "$(git rev-parse --show-toplevel)"

ssh "$host" "mkdir -p '$dest/src' '$dest/tasks' '$dest/config' '$dest/tailscale' && rm -rf '$dest/src'/* '$dest/src'/.[!.]*"
git archive HEAD | ssh "$host" "tar -x -C '$dest/src'"
# git archive leaves out submodules. The Dockerfile deletes this folder and
# clones the editor itself, so it only has to exist.
ssh "$host" "mkdir -p '$dest/src/frontend/src/components/Stacks-Editor'"

for f in docker-compose.yml serve.json; do
  if ssh "$host" "test -e '$dest/$f'"; then
    echo "Kept existing $dest/$f"
  else
    git show "HEAD:deploy/synology/$f" | ssh "$host" "cat > '$dest/$f'"
  fi
done
echo "Source copied to $host:$dest/src"
