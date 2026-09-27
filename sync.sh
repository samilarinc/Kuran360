#!/bin/bash

# Build
npx expo export --platform web

# Sync
rsync -avz --exclude='2025_ezan/' --exclude='sudais_all_verse/' --exclude='abdulsamad_all_verse/' dist/ user@server:quran/