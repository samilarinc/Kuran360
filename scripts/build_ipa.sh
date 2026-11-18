#!/bin/bash

# Builds the App Store IPA. On a Mac (Xcode, CocoaPods and fastlane installed) it builds locally into
# ./builds; anywhere else (Linux) it builds on EAS's cloud Macs and the IPA is downloaded from
# expo.dev, or sent straight to App Store Connect with --auto-submit. See docs/ios-release.md.
cd "$(dirname "$0")/.."

echo "Building iOS App Store IPA..."

OUTPUT_PATH="./builds/app-release.ipa"
mkdir -p builds

# The app imports the built shared library (msarinc-common/packages/*/dist), which is not in git
(cd msarinc-common && npm run build) || { echo "ERROR: msarinc-common build failed."; exit 1; }

# Signing certificate and provisioning profile come from EAS's credential store; the first run asks
# for the Apple Developer login to create them, so it is interactive (pass --non-interactive later).
# Build number is incremented remotely (eas.json: appVersionSource remote, autoIncrement).
# EAS_NO_VCS=1 uploads the working tree (minus .easignore) so the cloud build also gets the
# msarinc-common dist files and .env.
if [ "$(uname)" = "Darwin" ]; then
  EAS_NO_VCS=1 npx eas-cli build --platform ios --profile production --local --output "$OUTPUT_PATH" "$@"
  STATUS=$?
  RESULT="IPA created at: $OUTPUT_PATH
Upload: npx eas-cli submit --platform ios --path $OUTPUT_PATH"
else
  EAS_NO_VCS=1 npx eas-cli build --platform ios --profile production "$@"
  STATUS=$?
  RESULT="Cloud build finished; download the IPA from the build page above.
Upload: npx eas-cli submit --platform ios --latest"
fi

if [ $STATUS -eq 0 ]; then
  echo "----------------------------------------------------------"
  echo "SUCCESS: $RESULT"
  echo "----------------------------------------------------------"
else
  echo "ERROR: Build failed."
  exit 1
fi
