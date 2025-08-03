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

// Add asset extensions to support audio files
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'mp3',
  'wav',
  'aac',
  'm4a'
];

// Enable serving static files
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    return (req, res, next) => {
      // Serve audio files from sudais_all_verse directory
      if (req.url.startsWith('/sudais_all_verse/')) {
        const filePath = path.join(__dirname, req.url);
        const fs = require('fs');
        
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'audio/mpeg');
          return fs.createReadStream(filePath).pipe(res);
        }
      }
      
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
