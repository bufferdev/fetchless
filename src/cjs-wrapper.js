// CommonJS wrapper for Fetchless
// This file allows the library to be used with require()

// Use the CommonJS compatibility in Node.js to load the ESM module
const fetchless = require('./dist/index.js');

// Re-export everything for CommonJS compatibility
module.exports = fetchless; 