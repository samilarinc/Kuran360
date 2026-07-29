#!/bin/bash

echo "Building Android APK for Release..."

# android/ is gitignored and regenerated from app.config.js (versionCode,
# versionName, signing config plugin, etc.) — sync it before building so the
# release always reflects the current config instead of a stale local copy.
echo "Syncing native android/ project from app.config.js (expo prebuild)..."
npx expo prebuild --platform android --no-install
if [ $? -ne 0 ]; then
  echo "ERROR: expo prebuild failed."
  exit 1
fi

# Check if release signing is configured
if ! grep -q "MYAPP_RELEASE_STORE_FILE" android/gradle.properties 2>/dev/null; then
  echo "----------------------------------------------------------"
  echo "WARNING: Release signing not configured in android/gradle.properties."
  echo "The build will be signed with the DEBUG key and will be REJECTED by Google Play."
  echo "----------------------------------------------------------"
  sleep 2
fi

# Navigate to android directory and run assembleRelease
cd android && ./gradlew assembleRelease --no-daemon && cd ..

if [ $? -eq 0 ]; then
  echo "----------------------------------------------------------"
  echo "SUCCESS: APK file created at:"
  echo "./android/app/build/outputs/apk/release/app-release.apk"
  echo "----------------------------------------------------------"
else
  echo "ERROR: Build failed."
  exit 1
fi
