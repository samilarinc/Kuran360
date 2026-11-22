#!/bin/bash
# Tests, builds and uploads the web app.
#
#   scripts/deploy.sh prod            the working tree → kuran360.com     (DEPLOY_TARGET in .env)
#   scripts/deploy.sh dev [ref]       a branch (default: origin/dev) → dev.kuran360.com (DEPLOY_DEV_TARGET)
#   ... --skip-tests                  upload without running the tests (emergencies only)
#
# The dev build is made in a temporary worktree, so uncommitted work in this checkout never reaches it.
# Nothing is uploaded unless the typecheck, unit tests and browser tests on the built site all pass.
set -e

cd "$(dirname "$0")/.."
MAIN="$(pwd)"

SKIP_TESTS=0
ARGS=()
for arg in "$@"; do
  if [ "$arg" = "--skip-tests" ]; then SKIP_TESTS=1; else ARGS+=("$arg"); fi
done
ENVIRONMENT="${ARGS[0]:-prod}"
REF="${ARGS[1]:-origin/dev}"

env_value() { grep -E "^$1=" "$MAIN/.env" 2>/dev/null | cut -d= -f2-; }

case "$ENVIRONMENT" in
  prod) TARGET_VAR=DEPLOY_TARGET ;;
  dev) TARGET_VAR=DEPLOY_DEV_TARGET ;;
  *) echo "Usage: scripts/deploy.sh prod|dev [ref] [--skip-tests]"; exit 1 ;;
esac
TARGET="$(env_value "$TARGET_VAR")"
if [ -z "$TARGET" ]; then
  echo "$TARGET_VAR is not set in .env (e.g. $TARGET_VAR=user@host:quran/)"
  exit 1
fi

if [ "$ENVIRONMENT" = "dev" ]; then
  git fetch origin --quiet
  BUILD_DIR="$(mktemp -d "${TMPDIR:-/tmp}/kuran360-deploy-XXXXXX")"
  cleanup() {
    # Keep failed browser tests' traces and page snapshots where they can be looked at
    if [ -d "$BUILD_DIR/test-results" ]; then rm -rf "$MAIN/test-results"; cp -r "$BUILD_DIR/test-results" "$MAIN/test-results"; fi
    git -C "$MAIN" worktree remove --force "$BUILD_DIR" >/dev/null 2>&1 || rm -rf "$BUILD_DIR"
  }
  trap cleanup EXIT
  git worktree add --detach --quiet "$BUILD_DIR" "$REF"
  echo "Building $REF ($(git -C "$BUILD_DIR" log -1 --format='%h %s' | cut -c1-80))"
  # Reuse the shared library, data files that aren't in git, and .env from this checkout
  rm -rf "$BUILD_DIR/msarinc-common" && ln -s "$MAIN/msarinc-common" "$BUILD_DIR/msarinc-common"
  cp -rln "$MAIN/public/." "$BUILD_DIR/public/" # a symlinked public breaks expo export
  cp "$MAIN/.env" "$BUILD_DIR/.env"
  WATCH="'$MAIN/msarinc-common'"
  # This checkout's node_modules only fits the ref when both lock files match; otherwise install its own
  if cmp -s "$MAIN/package-lock.json" "$BUILD_DIR/package-lock.json"; then
    ln -s "$MAIN/node_modules" "$BUILD_DIR/node_modules"
    WATCH="$WATCH, '$MAIN/node_modules'"
  else
    echo "Dependencies differ from this checkout, installing them..."
    (cd "$BUILD_DIR" && npm ci --no-audit --no-fund --loglevel=error)
  fi
  # The shared library lives outside the worktree; its imports (react-dom...) resolve from the worktree's packages
  cat >> "$BUILD_DIR/metro.config.js" <<METRO
module.exports.watchFolders = [$WATCH];
module.exports.resolver = { ...module.exports.resolver, nodeModulesPaths: ['$BUILD_DIR/node_modules'] };
METRO
  cd "$BUILD_DIR"
fi

if [ "$SKIP_TESTS" = 0 ]; then
  echo "Typecheck and unit tests..."
  npx tsc --noEmit
  npx jest
fi

npx expo export --platform web

if [ "$SKIP_TESTS" = 0 ]; then
  echo "Browser tests on the built site..."
  npx playwright test
else
  echo "WARNING: uploading without tests"
fi

# Media that lives only on the server (prayer times, recitations) is never uploaded from here
rsync -az --exclude='2025_ezan/' --exclude='*_all_verse/' --exclude='audio/' --exclude='hutbe/' dist/ "$TARGET"
echo "Uploaded to $ENVIRONMENT ($TARGET)"
