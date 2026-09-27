#!/bin/bash
# Build the web app and upload it to the server.
# The target (user@host:path) comes from DEPLOY_TARGET in .env, e.g. DEPLOY_TARGET=user@1.2.3.4:quran/
set -e

# Run from the project root regardless of where the script is called from
cd "$(dirname "$0")/.."

DEPLOY_TARGET="$(grep -E '^DEPLOY_TARGET=' .env 2>/dev/null | cut -d= -f2-)"
if [ -z "$DEPLOY_TARGET" ]; then
  echo "DEPLOY_TARGET is not set in .env (e.g. DEPLOY_TARGET=user@host:quran/)"
  exit 1
fi

# Build
npx expo export --platform web

# Sync
rsync -avz --exclude='2025_ezan/' --exclude='sudais_all_verse/' --exclude='abdulsamad_all_verse/' dist/ "$DEPLOY_TARGET"
