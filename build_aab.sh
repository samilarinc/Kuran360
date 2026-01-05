#!/bin/bash

echo "Building Android App Bundle (AAB) for Release..."

# Check if release signing is configured
if ! grep -q "MYAPP_RELEASE_STORE_FILE" android/gradle.properties 2>/dev/null; then
  echo "----------------------------------------------------------"
  echo "WARNING: Release signing not configured in android/gradle.properties."
  echo "The build will be signed with the DEBUG key and will be REJECTED by Google Play."
  echo "----------------------------------------------------------"
  sleep 2
fi

# Navigate to android directory and run bundleRelease
cd android && ./gradlew bundleRelease --no-daemon && cd ..

if [ $? -eq 0 ]; then
  echo "----------------------------------------------------------"
  echo "SUCCESS: AAB file created at:"
  echo "./android/app/build/outputs/bundle/release/app-release.aab"
  echo "----------------------------------------------------------"
else
  echo "ERROR: Build failed."
  exit 1
fi
