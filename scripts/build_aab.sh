#!/bin/bash

# Run from the project root regardless of where the script is called from
cd "$(dirname "$0")/.."

echo "Building Android App Bundle (AAB) for Release..."

# Google Play expects this app's original upload key, which lives in EAS's
# remote credential store (not the local kuran360-release.keystore, which
# was generated locally and does NOT match). `eas build --local` fetches the
# real signing key from EAS at build time, so this always produces an AAB
# Google Play will accept. Needs `eas login` as the project owner (msarinc).
OUTPUT_PATH="./builds/app-release.aab"

# The app imports the built shared library (msarinc-common/packages/*/dist), which is not in git
(cd msarinc-common && npm run build) || { echo "ERROR: msarinc-common build failed."; exit 1; }

# Build from the working tree instead of a git clone: a clone would miss the msarinc-common
# submodule's built files and .env (see .easignore for what is left out)
EAS_NO_VCS=1 npx eas-cli build --platform android --profile production --local --non-interactive --output "$OUTPUT_PATH"

if [ $? -eq 0 ]; then
  echo "----------------------------------------------------------"
  echo "SUCCESS: AAB file created at:"
  echo "$OUTPUT_PATH"
  echo "----------------------------------------------------------"
else
  echo "ERROR: Build failed."
  exit 1
fi
