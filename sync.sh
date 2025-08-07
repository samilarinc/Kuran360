#!/bin/bash

# Build
npx expo export --platform web

# Sync
rsync -avz --exclude='sudais_all_verse/' --exclude='abdulsamad_all_verse/' dist/ samil@13.51.24.64:quran/