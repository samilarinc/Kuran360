module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['msarinc-common', 'dist'],
  overrides: [
    {
      files: ['public/service-worker.js'],
      env: { serviceworker: true },
    },
  ],
};
