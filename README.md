# Fetchless

A smart request library with caching, auto-fixing, and analytics capabilities.

## Features

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

## Installation

```
npm install fetchless
```

## Usage

```js
import { Fetchless } from 'fetchless';

// Create a client with advanced features enabled
const fetchless = Fetchless.createClient({
  enableTimeTravel: true,
  enableIntelligencePanel: true,
  maxAge: 300000, // 5 minutes cache
  strategy: 'cache-first' // or 'network-first', 'stale-while-revalidate'
});

// Use it like a regular fetch API
const response = await fetchless.get('https://api.example.com/data');
console.log(response.data);
```

## License

MIT
