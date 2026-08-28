const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  assetExts: [
    ...(config.resolver?.assetExts || []),
    'json',
    'wasm',
  ],
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    react: path.resolve(__dirname, 'node_modules/react'),
    'react-native': path.resolve(__dirname, 'node_modules/react-native'),
  },
  blockList: exclusionList([
    /msarinc-common\/packages\/.*\/node_modules\/react\/.*/,
    /msarinc-common\/packages\/.*\/node_modules\/react-native\/.*/,
    /msarinc-common\/packages\/.*\/node_modules\/react-is\/.*/,
    /msarinc-common\/packages\/.*\/node_modules\/react-devtools-core\/.*/,
  ]),
};

module.exports = mergeConfig(config, {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
});
