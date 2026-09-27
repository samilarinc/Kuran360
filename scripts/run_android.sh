#!/bin/bash
# Build the Android app, install it on the connected device and launch it.
# Usage: ./scripts/run_android.sh {debug|release}
set -e

BUILD_TYPE="$1"
if [ "$BUILD_TYPE" != "debug" ] && [ "$BUILD_TYPE" != "release" ]; then
  echo "Usage: $0 {debug|release}"
  exit 1
fi

# Run from the project root regardless of where the script is called from
cd "$(dirname "$0")/.."

# android/ is gitignored and generated from app.config.js
if [ ! -d android ]; then
  echo "android/ not found, generating it with expo prebuild..."
  npx expo prebuild --platform android --no-install
fi

# First letter uppercase for the gradle task: debug -> Debug
GRADLE_TYPE="$(echo "$BUILD_TYPE" | sed -E 's/^./\U&/')"
echo "Building Android APK with build type: $GRADLE_TYPE"

(cd android && ./gradlew "assemble$GRADLE_TYPE" --no-daemon)
adb install -r "./android/app/build/outputs/apk/$BUILD_TYPE/app-$BUILD_TYPE.apk"
adb shell am start -n com.kuran360/.MainActivity
