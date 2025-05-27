const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package.json exports field resolution to fix compatibility issues
// This resolves issues with @rneui packages and Node.js standard library imports
config.resolver.unstable_enablePackageExports = false;

module.exports = config; 