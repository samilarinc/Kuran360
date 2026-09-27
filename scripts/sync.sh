#!/bin/bash

# Run from the project root regardless of where the script is called from
cd "$(dirname "$0")/.."

# Build
npx expo export --platform web

# Sync
rsync -avz --exclude='2025_ezan/' --exclude='sudais_all_verse/' --exclude='abdulsamad_all_verse/' dist/ user@server:quran/