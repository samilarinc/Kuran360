#!/bin/bash

# Build
npx expo export --platform web

# Sync
rsync -avz dist/ samil@13.51.24.64:quran/