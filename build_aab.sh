#!/bin/bash

echo "Building Android App Bundle (AAB) for Release..."

# Google Play expects this app's original upload key, which lives in EAS's
# remote credential store (not the local kuran360-release.keystore, which
# was generated locally and does NOT match). `eas build --local` fetches the
# real signing key from EAS at build time, so this always produces an AAB
# Google Play will accept.
OUTPUT_PATH="./dist/app-release.aab"

npx eas-cli build --platform android --profile production --local --non-interactive --output "$OUTPUT_PATH"

if [ $? -eq 0 ]; then
  echo "----------------------------------------------------------"
  echo "SUCCESS: AAB file created at:"
  echo "$OUTPUT_PATH"
  echo "----------------------------------------------------------"
else
  echo "ERROR: Build failed."
  exit 1
fi
