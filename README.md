# Fetchless

A lightweight and performant JavaScript library for HTTP request caching, with advanced features for data management and analysis.

## Features

### Core Features
- **Efficient Caching**: Cache HTTP requests to reduce network traffic and improve performance
- **Multiple Cache Strategies**: Choose between 'cache-first', 'network-first', and 'stale-while-revalidate'
- **TypeScript Support**: Full TypeScript support with typings included
- **Lightweight**: Small footprint with minimal dependencies
- **Easy Integration**: Simple API that works with any JavaScript project

### Advanced Features

#### Data Management
- **Time Travel Fetch**: Access historical data snapshots by specifying a timestamp
- **Freeze Mode**: Freeze data updates while users are viewing the interface
- **Auto-Fixer**: Automatically fix common API errors with fallback data
- **Fetch Intelligence Panel**: Analyze request patterns and detect inefficient fetching

#### Additional Capabilities
- **Prefetching**: Preload resources in the background
- **Request Deduplication**: Automatically combine identical concurrent requests
- **Interceptors**: Transform requests and responses with custom middleware
- **Retry with Backoff**: Automatically retry failed requests with exponential backoff
- **Persistent Cache**: Store cache in localStorage for persistence between sessions
- **Abortable Requests**: Cancel requests when they're no longer needed
- **Hooks for React**: Easily integrate with React applications

## Installation

```
npm install fetchless
```

## Basic Usage

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

## New Feature Showcase

### 1. Time Travel Fetch
Access historical data snapshots by specifying a timestamp.
```js
// Get data as it was at a specific date/time
const historicalData = await fetchless.get('https://api.example.com/data', {
  at: '2023-06-15T14:30:00Z'
});
```

### 2. Freeze Mode
Freeze data updates while users are viewing the interface.
```js
// Freeze data for a specific endpoint
fetchless.freeze('https://api.example.com/dashboard-data');

// Later, unfreeze when ready to receive updates again
fetchless.unfreeze('https://api.example.com/dashboard-data');
```

### 3. Auto-Fixer
Automatically fix common API errors with fallback data.
```js
// Configure auto-fixing for 404 errors
const response = await fetchless.get('https://api.example.com/users/123', {
  autoFix: (error, context) => {
    if (error.response?.status === 404) {
      return { id: null, name: 'Unknown User', error: true };
    }
    return null; // Can't fix other errors
  }
});
```

### 4. Fetch Intelligence Panel
Analyze request patterns and detect inefficient fetching.
```js
// Get intelligence about API usage
const intelligence = fetchless.getIntelligence();

// Find duplicate requests
const duplicates = intelligence.detectDuplicates();
console.log(duplicates);

// Get optimization suggestions
const suggestions = intelligence.suggestOptimizations();
console.log(suggestions);
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
  enableTimeTravel: true, // Enable time travel feature
  enableIntelligencePanel: true // Enable intelligence panel
});

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
```

### Prefetching Resources

```js
import { prefetch } from 'fetchless';

// Preload data that might be needed soon
prefetch('https://api.example.com/future-data');

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
});

// Later if you need to cancel the request
abort();
```

### React Integration

```js
import { useFetchless } from 'fetchless';
import React from 'react';

function UserProfile({ userId }) {
  const { data, loading, error } = useFetchless(`https://api.example.com/users/${userId}`);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}
```

### Cache Statistics

```js
import { defaultClient } from 'fetchless';

// Get cache statistics
const stats = defaultClient.getStats();
console.log(stats);
// { hits: 5, misses: 2, ratio: 0.71, size: 7 }

// Clear the cache if needed
defaultClient.clearCache();
```

## License

MIT
