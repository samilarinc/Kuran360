#!/bin/bash

# Builds the App Store IPA on a Mac (Xcode, CocoaPods and fastlane installed). See docs/ios-release.md.
cd "$(dirname "$0")/.."

echo "Building iOS App Store IPA..."

OUTPUT_PATH="./builds/app-release.ipa"
mkdir -p builds

# The app imports the built shared library (msarinc-common/packages/*/dist), which is not in git
(cd msarinc-common && npm run build) || { echo "ERROR: msarinc-common build failed."; exit 1; }

# Signing certificate and provisioning profile come from EAS's credential store; the first run asks
# for the Apple Developer login to create them, so it is interactive (pass --non-interactive later).
# Build number is incremented remotely (eas.json: appVersionSource remote, autoIncrement).
EAS_NO_VCS=1 npx eas-cli build --platform ios --profile production --local --output "$OUTPUT_PATH" "$@"

if [ $? -eq 0 ]; then
  echo "----------------------------------------------------------"
  echo "SUCCESS: IPA created at: $OUTPUT_PATH"
  echo "Upload: npx eas-cli submit --platform ios --path $OUTPUT_PATH"
  echo "----------------------------------------------------------"
else
  echo "ERROR: Build failed."
  exit 1
fi
