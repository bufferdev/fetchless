# Fetchless

A lightweight and performant JavaScript library for HTTP request caching.

<div align="center">
  <img src="https://img.shields.io/npm/v/fetchless.svg" alt="npm version">
  <img src="https://img.shields.io/npm/dm/fetchless.svg" alt="downloads">
  <img src="https://img.shields.io/github/license/bufferdev/fetchless.svg" alt="license">
</div>

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
  - [Creating a Custom Client](#creating-a-custom-client)
  - [Cache Strategies](#cache-strategies)
  - [Using Interceptors](#using-interceptors)
  - [Prefetching Resources](#prefetching-resources)
  - [Cancellable Requests](#cancellable-requests)
  - [React Integration](#react-integration)
  - [Cache Statistics and Management](#cache-statistics-and-management)
- [New Features (v1.3.0)](#new-features-v130)
  - [Time Travel Fetch](#time-travel-fetch)
  - [Freeze Mode](#freeze-mode)
  - [Auto-Fixer](#auto-fixer)
  - [Fetch Intelligence Panel](#fetch-intelligence-panel)
- [API Reference](#api-reference)
- [Configuration Options](#configuration-options)
- [Browser Compatibility](#browser-compatibility)
- [Performance Considerations](#performance-considerations)
- [Debugging](#debugging)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Fetchless is a powerful HTTP request caching library designed to optimize network performance and improve user experience in JavaScript applications. It provides smart caching mechanisms, request management, and analytics capabilities to help developers build faster and more efficient applications.

## Features

### Core Features
- **Efficient Caching**: Cache HTTP requests to reduce network traffic and improve performance
- **Multiple Cache Strategies**: Choose between 'cache-first', 'network-first', and 'stale-while-revalidate'
- **TypeScript Support**: Full TypeScript support with typings included
- **Lightweight**: Small footprint with minimal dependencies
- **Easy Integration**: Simple API that works with any JavaScript project

### Advanced Capabilities
- **Prefetching**: Preload resources in the background
- **Request Deduplication**: Automatically combine identical concurrent requests
- **Interceptors**: Transform requests and responses with custom middleware
- **Retry with Backoff**: Automatically retry failed requests with exponential backoff
- **Persistent Cache**: Store cache in localStorage for persistence between sessions
- **Abortable Requests**: Cancel requests when they're no longer needed
- **Hooks for React**: Easily integrate with React applications

### New Features (v1.3.0)
- **Time Travel Fetch**: Access historical data snapshots by specifying a timestamp
- **Freeze Mode**: Freeze data updates while users are viewing the interface
- **Auto-Fixer**: Automatically fix common API errors with fallback data
- **Fetch Intelligence Panel**: Analyze request patterns and detect inefficient fetching

## Installation

### NPM
```bash
npm install fetchless
```

### Yarn
```bash
yarn add fetchless
```

### CDN
```html
<script src="https://unpkg.com/fetchless@1.3.0/dist/fetchless.min.js"></script>
```

## Basic Usage

### Simple Request with Caching

```js
import { get } from 'fetchless';

// Simple GET request that will be cached
get('https://api.example.com/data')
  .then(response => {
    console.log(response.data);
  });

// Second request for the same URL will be served from cache
get('https://api.example.com/data')
  .then(response => {
    console.log(response.data); // Instant response from cache
  });
```

### Using Async/Await

```js
import { get } from 'fetchless';

async function fetchData() {
  try {
    // First request - from network
    const response = await get('https://api.example.com/data');
    console.log(response.data);
    
    // Second request - from cache
    const cachedResponse = await get('https://api.example.com/data');
    console.log(cachedResponse.data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

fetchData();
```

### Making POST, PUT, and DELETE Requests

```js
import { post, put, deleteRequest } from 'fetchless';

// POST request
post('https://api.example.com/users', { name: 'John', email: 'john@example.com' })
  .then(response => console.log(response.data));

// PUT request
put('https://api.example.com/users/1', { name: 'John Updated' })
  .then(response => console.log(response.data));

// DELETE request
deleteRequest('https://api.example.com/users/1')
  .then(response => console.log('User deleted'));
```

## Advanced Usage

### Creating a Custom Client

```js
import { Fetchless, createAdvancedClient } from 'fetchless';

// Standard client with custom configuration
const client = Fetchless.createClient({
  strategy: 'cache-first', // or 'network-first', 'stale-while-revalidate'
  maxAge: 60000, // Cache lifetime in milliseconds (1 minute)
  maxSize: 100, // Maximum number of entries in the cache
  enableTimeTravel: true, // Enable Time Travel feature
  enableIntelligencePanel: true // Enable Intelligence Panel
});

// Using the custom client
client.get('https://api.example.com/data')
  .then(response => console.log(response.data));

// Advanced client with additional features
const advancedClient = createAdvancedClient({
  persistCache: true,
  localStorage: window.localStorage,
  dedupeRequests: true,
  enableLogs: true,
  retryOptions: {
    maxRetries: 3,
    backoffFactor: 300, // Milliseconds
    retryStatusCodes: [408, 429, 500, 502, 503, 504]
  }
});
```

### Cache Strategies

#### Cache First
Prioritizes cached data, only fetching from the network when cache is empty or expired.

```js
import { get } from 'fetchless';

get('https://api.example.com/data', { strategy: 'cache-first' })
  .then(response => console.log(response.data));
```

#### Network First
Prioritizes fresh data from the network, falling back to cache when network fails.

```js
import { get } from 'fetchless';

get('https://api.example.com/data', { strategy: 'network-first' })
  .then(response => console.log(response.data));
```

#### Stale While Revalidate
Serves stale data from cache immediately while refreshing it in the background.

```js
import { get } from 'fetchless';

get('https://api.example.com/data', { strategy: 'stale-while-revalidate' })
  .then(response => console.log(response.data));
```

### Using Interceptors

```js
import { createAdvancedClient } from 'fetchless';

const client = createAdvancedClient();

// Add request interceptor
client.addRequestInterceptor((url, config) => {
  // Add authentication token to all requests
  return [url, { 
    ...config, 
    headers: { 
      ...config?.headers, 
      'Authorization': `Bearer ${getToken()}` 
    } 
  }];
});

// Add response interceptor
client.addResponseInterceptor((response) => {
  // Transform response data
  return {
    ...response,
    data: transformData(response.data)
  };
});

// Error interceptor
client.addErrorInterceptor((error) => {
  // Log errors
  console.error('Request failed:', error);
  
  // Rethrow the error to propagate it
  throw error;
});
```

### Prefetching Resources

```js
import { prefetch } from 'fetchless';

// Preload data that might be needed soon
prefetch('https://api.example.com/future-data');

// Preload with specific options
prefetch('https://api.example.com/user-profile', {
  headers: { 'Authorization': 'Bearer token' },
  maxAge: 120000 // Custom cache time of 2 minutes
});

// Later when you need it, it will be in the cache
get('https://api.example.com/future-data')
  .then(response => {
    console.log(response.data); // Instant response
  });
```

### Cancellable Requests

```js
import { abortableGet } from 'fetchless';

// Get an abortable request
const { promise, abort } = abortableGet('https://api.example.com/large-data');

// Use the promise as normal
promise.then(response => {
  console.log(response.data);
}).catch(error => {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
  } else {
    console.error('Request failed:', error);
  }
});

// Later if you need to cancel the request
abort();

// Abort with timeout
const { promise: timeoutPromise, abort: timeoutAbort } = abortableGet('https://api.example.com/data', {
  timeout: 5000 // Automatically abort after 5 seconds
});
```

### React Integration

```js
import { useFetchless } from 'fetchless';
import React from 'react';

function UserProfile({ userId }) {
  const { data, loading, error, refetch } = useFetchless(`https://api.example.com/users/${userId}`);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}

// With options
function ProductList() {
  const { data, loading } = useFetchless('https://api.example.com/products', {
    strategy: 'cache-first',
    maxAge: 300000, // 5 minutes
    initialData: [], // Default data while loading
    deps: [], // Dependencies array, similar to useEffect
    onSuccess: (data) => console.log('Data loaded:', data),
    onError: (error) => console.error('Failed to load:', error)
  });
  
  return (
    <ul>
      {loading ? 'Loading...' : data.map(product => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}
```

### Cache Statistics and Management

```js
import { defaultClient } from 'fetchless';

// Get cache statistics
const stats = defaultClient.getStats();
console.log(stats);
// { hits: 5, misses: 2, ratio: 0.71, size: 7 }

// Clear the cache
defaultClient.clearCache();

// Clear specific URL
defaultClient.clearCache('https://api.example.com/data');

// Clear cache with pattern
defaultClient.clearCache(/api\.example\.com\/users.*/);

// Get cache entries
const entries = defaultClient.getCacheEntries();
console.log(entries);
```

## New Features (v1.3.0)

### Time Travel Fetch

Access historical data snapshots by specifying a timestamp.

```js
import { Fetchless } from 'fetchless';

// Create client with Time Travel enabled
const client = Fetchless.createClient({
  enableTimeTravel: true,
  historyRetention: 7 * 24 * 60 * 60 * 1000 // Keep history for 7 days
});

// Make a regular request first (this will be stored in history)
await client.get('https://api.example.com/stock-price');

// Later, access historical data
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

// Get data as it was at a specific date/time
const historicalData = await client.get('https://api.example.com/stock-price', {
  at: yesterday.toISOString()
});

console.log('Price from yesterday:', historicalData.data.price);

// Compare with current data
const currentData = await client.get('https://api.example.com/stock-price');
console.log('Current price:', currentData.data.price);
console.log('Price change:', currentData.data.price - historicalData.data.price);
```

### Freeze Mode

Freeze data updates while users are viewing the interface.

```js
import { Fetchless } from 'fetchless';

const client = Fetchless.createClient();
const dashboardUrl = 'https://api.example.com/dashboard-data';

// User opens dashboard, freeze the data
console.log('User opened dashboard, freezing data...');
client.freeze(dashboardUrl);

// First request - this will be cached
const initialData = await client.get(dashboardUrl);

// Even if we request again, it will use the frozen version
// This ensures data consistency while user is viewing
const sameData = await client.get(dashboardUrl);
console.assert(sameData === initialData, 'Data should be frozen');

// When user is done, unfreeze
console.log('User closed dashboard, unfreezing data...');
client.unfreeze(dashboardUrl);

// Now we'll get fresh data
const freshData = await client.get(dashboardUrl);

// Advanced: Freeze multiple endpoints
client.freeze([
  'https://api.example.com/dashboard-data',
  'https://api.example.com/user-activity',
  'https://api.example.com/notifications'
]);

// Later, unfreeze all
client.unfreezeAll();
```

### Auto-Fixer

Automatically fix common API errors with fallback data.

```js
import { Fetchless } from 'fetchless';

const client = Fetchless.createClient();

// Basic usage - handles 404 errors
try {
  const response = await client.get('https://api.example.com/users/123', {
    autoFix: (error, context) => {
      if (error.response?.status === 404) {
        return { id: null, name: 'Unknown User', error: true };
      }
      return null; // Can't fix other errors
    }
  });
  
  console.log(response.data);
} catch (error) {
  console.error('Error could not be auto-fixed:', error);
}

// Complex example - handle network errors with last successful response
const options = {
  autoFix: (error, context) => {
    // For 404 errors, return default user data
    if (error.response?.status === 404) {
      return { id: null, name: 'Unknown User', isDefault: true };
    }
    
    // For network errors, use last successful response
    if (!error.response && error.request) {
      // Return the last successful response or fallback object
      return context.lastSuccessfulResponse?.data || 
        { error: true, offline: true, message: 'You are offline' };
    }
    
    // For rate limiting, try again later
    if (error.response?.status === 429) {
      throw new Error('Rate limited. Please try again in a few moments.');
    }
    
    return null; // Can't fix other errors
  }
};

// Using the auto-fix configuration
const response = await client.get('https://api.example.com/users/123', options);
```

### Fetch Intelligence Panel

Analyze request patterns and detect inefficient fetching.

```js
import { Fetchless } from 'fetchless';

// Create client with Intelligence Panel enabled
const client = Fetchless.createClient({
  enableIntelligencePanel: true
});

// Make several requests to simulate real usage
await client.get('https://api.example.com/users?page=1');
await client.get('https://api.example.com/users?page=1'); // Duplicate
await client.get('https://api.example.com/users?page=2');
await client.get('https://api.example.com/users?page=1'); // Duplicate
await client.get('https://api.example.com/products?category=1');
await client.get('https://api.example.com/products?category=2');

// Get intelligence and analyze patterns
const intelligence = client.getIntelligence();

// View request history
const history = intelligence.getRequestHistory();
console.log('Request history count:', history.length);

// Detect duplicates
const duplicates = intelligence.detectDuplicates();
console.log('Detected duplicate requests:', duplicates);

// Get optimization suggestions
const suggestions = intelligence.suggestOptimizations();
console.log('Optimization suggestions:', suggestions);

// Example suggestion output:
// [
//   {
//     suggestion: "You can group 3 requests to https://api.example.com/users",
//     urls: ["https://api.example.com/users?page=1", "https://api.example.com/users?page=2"]
//   },
//   {
//     suggestion: "This URL is called 3 times, consider increasing its cache duration",
//     urls: ["https://api.example.com/users?page=1"]
//   }
// ]
```

## API Reference

### Fetchless Class

#### Methods

| Method | Description |
|--------|-------------|
| `get(url, config?)` | Performs a GET request with caching |
| `post(url, data?, config?)` | Performs a POST request |
| `put(url, data?, config?)` | Performs a PUT request |
| `delete(url, config?)` | Performs a DELETE request |
| `getStats()` | Returns cache statistics |
| `clearCache(pattern?)` | Clears the cache, optionally by pattern |
| `freeze(url)` | Freezes data for specific URL |
| `unfreeze(url)` | Unfreezes data for specific URL |
| `unfreezeAll()` | Unfreezes all frozen URLs |
| `getIntelligence()` | Returns the intelligence panel |

#### Static Methods

| Method | Description |
|--------|-------------|
| `createClient(config?)` | Creates a new Fetchless client instance |

### Configuration Options

```js
const config = {
  // Cache strategy
  strategy: 'cache-first', // or 'network-first', 'stale-while-revalidate'
  
  // Cache lifetime in milliseconds
  maxAge: 300000, // 5 minutes
  
  // Maximum number of entries in the cache
  maxSize: 100,
  
  // Enable Time Travel feature
  enableTimeTravel: false,
  
  // Duration for which to keep history in milliseconds
  historyRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Enable Intelligence Panel
  enableIntelligencePanel: false,
  
  // Persist cache to localStorage
  persistCache: false,
  
  // Storage to use for persistence
  storage: window.localStorage,
  
  // Automatic request deduplication
  dedupeRequests: true,
  
  // Enable debug logs
  enableLogs: false,
  
  // Retry configuration
  retry: {
    maxRetries: 3,
    backoffFactor: 300, // Milliseconds
    retryStatusCodes: [408, 429, 500, 502, 503, 504]
  }
};
```

## Browser Compatibility

Fetchless works in all modern browsers and environments that support ES6:

- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 15+
- Opera 38+
- Node.js 10+

For older browsers, use a transpiler like Babel and appropriate polyfills.

## Performance Considerations

- **Cache Size**: Configure `maxSize` based on your application's memory constraints
- **Cache Duration**: Adjust `maxAge` for different types of data
- **Time Travel**: Enabling this feature increases memory usage
- **Prefetching**: Use sparingly for critical resources only
- **Request Deduplication**: Can significantly reduce network traffic in complex UIs

## Debugging

To enable debug logs:

```js
const client = Fetchless.createClient({
  enableLogs: true
});
```

You can also set specific log levels:

```js
const client = Fetchless.createClient({
  logLevel: 'verbose' // 'error', 'warn', 'info', 'verbose', 'debug'
});
```

## FAQ

### How does caching work with dynamic parameters?

Fetchless automatically generates cache keys based on the URL and parameters. Query parameters are included in the cache key.

### Can I use it with GraphQL?

Yes, Fetchless works with any HTTP-based API including GraphQL. For best results, create a custom client with interceptors for handling GraphQL requests.

### How do I handle authentication?

Use request interceptors to add authentication headers to all requests:

```js
client.addRequestInterceptor((url, config) => {
  return [url, { 
    ...config, 
    headers: { 
      ...config?.headers, 
      'Authorization': `Bearer ${getToken()}` 
    } 
  }];
});
```

### Does it work with Node.js?

Yes, Fetchless works in both browser and Node.js environments.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
