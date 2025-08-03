const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for serving static files from the sudais_all_verse directory
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add the sudais_all_verse directory to the Metro resolver
config.resolver.alias = {
    ...config.resolver.alias,
    '../../sudais_all_verse': path.resolve(__dirname, 'sudais_all_verse'),
};

module.exports = config;
