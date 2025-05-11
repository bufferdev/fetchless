# Fetchless

A lightweight and performant JavaScript library for HTTP request caching.

## Features

- **Performant**: Automatic caching of requests for faster applications
- **Configurable**: Multiple caching strategies (cache-first, network-first, stale-while-revalidate)
- **Statistics**: Track cache performance for easy optimization
- **Transparent**: Uses the same API as standard HTTP clients
- **Extensible**: Easy to integrate into existing projects

## Installation

```bash
npm install fetchless
```

## Usage

### Basic Example

```typescript
import { Fetchless } from 'fetchless';

// Create an instance with default options
const client = Fetchless.createClient();

// Make a request (automatically cached)
const data = await client.get('https://api.example.com/data');
```

### Configuration

```typescript
import { Fetchless } from 'fetchless';

// Create an instance with custom options
const client = Fetchless.createClient({
  strategy: 'network-first',  // 'cache-first', 'network-first', 'stale-while-revalidate'
  maxAge: 60 * 1000,          // 1 minute (in milliseconds)
  maxSize: 100                // Maximum number of entries in the cache
});
```

### Cache Strategies

#### Cache First

Tries to serve from the cache first, only makes a network request if the cache is empty or expired.
```typescript
const client = Fetchless.createClient({ strategy: 'cache-first' });
```

#### Network First

Tries the network request first, uses the cache only if the network fails.
```typescript
const client = Fetchless.createClient({ strategy: 'network-first' });
```

#### Stale While Revalidate

Serves cached data immediately (even if stale) while refreshing the cache in the background.
```typescript
const client = Fetchless.createClient({ strategy: 'stale-while-revalidate' });
```

### Cache Management

```typescript
// Clear the cache
client.clearCache();

// Get cache statistics
const stats = client.getStats();
console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}, Ratio: ${stats.ratio}`);
```

## API

### `Fetchless.createClient(options)`

Creates an HTTP client with caching.

Options:
- `strategy`: Caching strategy to use (default: 'cache-first')
- `maxAge`: Cache lifetime in milliseconds (default: 5 minutes)
- `maxSize`: Maximum number of entries in the cache (default: 100)

### Client Methods

- `get(url, config)`: Makes a GET request with caching
- `post(url, data, config)`: Makes a POST request (not cached)
- `put(url, data, config)`: Makes a PUT request (not cached)
- `delete(url, config)`: Makes a DELETE request (not cached)
- `clearCache()`: Clears the cache
- `getStats()`: Returns cache usage statistics

## License

MIT 