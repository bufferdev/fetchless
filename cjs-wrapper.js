// CommonJS wrapper for fetchless
const fetchless = require('./dist/index.js');

// Expose all exports as module.exports
module.exports = {
  get: fetchless.get,
  post: fetchless.post,
  put: fetchless.put,
  del: fetchless.del,
  clearCache: fetchless.clearCache,
  getStats: fetchless.getStats,
  createClient: fetchless.createClient,
  Fetchless: fetchless.Fetchless
}; 