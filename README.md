# Fetchless

A lightweight and performant JavaScript library for HTTP request caching.

## Features

- **Efficient Caching**: Cache HTTP requests to reduce network traffic and improve performance
- **Multiple Cache Strategies**: Choose between 'cache-first', 'network-first', and 'stale-while-revalidate'
- **TypeScript Support**: Full TypeScript support with typings included
- **Lightweight**: Small footprint with minimal dependencies
- **Easy Integration**: Simple API that works with any JavaScript project

## Advanced Features

- **Prefetching**: Preload resources in the background
- **Request Deduplication**: Automatically combine identical concurrent requests
- **Interceptors**: Transform requests and responses with custom middleware
- **Retry with Backoff**: Automatically retry failed requests with exponential backoff
- **Persistent Cache**: Store cache in localStorage for persistence between sessions
- **Abortable Requests**: Cancel requests when they're no longer needed
- **Hooks for React**: Easily integrate with React applications

## Installation

```bash
npm install fetchless
```

## Basic Usage

```javascript
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

## Advanced Usage

### Creating a Custom Client

```javascript
import { Fetchless, createAdvancedClient } from 'fetchless';

// Standard client with custom configuration
const client = Fetchless.createClient({
  strategy: 'cache-first', // or 'network-first', 'stale-while-revalidate'
  maxAge: 60000, // Cache lifetime in milliseconds (1 minute)
  maxSize: 100 // Maximum number of entries in the cache
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

```javascript
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

```javascript
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

```javascript
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

```jsx
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

## Cache Statistics

```javascript
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