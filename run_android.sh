#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 {debug|release}"
  exit 1
fi
# Convert first argument first letter to uppercase
TITLE_TYPE=$(echo "$1" | sed -E 's/^./\U&/')
echo "Building Android APK with build type: $TITLE_TYPE"

cd /home/samil/Documents/Samil/QuranApp/android && ./gradlew assemble$TITLE_TYPE --no-daemon && cd ..
adb install -r ./android/app/build/outputs/apk/$1/app-$1.apk
adb shell am start -n com.kuran360/.MainActivity
