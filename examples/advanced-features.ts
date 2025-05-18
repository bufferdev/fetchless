/**
 * Advanced Features Example
 * This file demonstrates how to use the advanced features of Fetchless
 */
import { Fetchless } from '../src/Fetchless';

// Create a client with all features enabled
const fetchless = Fetchless.createClient({
  enableTimeTravel: true,
  enableIntelligencePanel: true,
  maxAge: 5 * 60 * 1000, // 5 minutes
  strategy: 'cache-first'
});

/**
 * Example 1: Time Travel Fetch
 * Access historical data snapshots
 */
async function timeTravelExample() {
  console.log('---- Time Travel Example ----');
  
  // First, make a normal request to store in history
  const currentData = await fetchless.get('https://api.example.com/stock-price');
  console.log('Current price:', currentData.data.price);
  
  // Wait a moment to simulate time passing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Then, access the data as it was in the past
  const historicalData = await fetchless.get('https://api.example.com/stock-price', {
    at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
  });
  
  console.log('Price from yesterday:', historicalData.data.price);
}

/**
 * Example 2: Freeze Mode
 * Temporarily freeze data while user is viewing
 */
async function freezeModeExample() {
  console.log('---- Freeze Mode Example ----');
  
  const url = 'https://api.example.com/dashboard-data';
  
  // Make initial request
  const initialData = await fetchless.get(url);
  console.log('Initial dashboard data:', initialData.data);
  
  // User opens dashboard, freeze the data
  console.log('User opened dashboard, freezing data...');
  fetchless.freeze(url);
  
  // Even if we request new data, it will return the frozen version
  const frozenData = await fetchless.get(url);
  console.log('Data while frozen:', frozenData.data);
  
  // When user is done, unfreeze
  console.log('User closed dashboard, unfreezing data...');
  fetchless.unfreeze(url);
  
  // Now we'll get fresh data
  const freshData = await fetchless.get(url);
  console.log('Fresh data after unfreezing:', freshData.data);
}

/**
 * Example 3: Auto-Fixer
 * Automatically fix common API errors
 */
async function autoFixerExample() {
  console.log('---- Auto-Fixer Example ----');
  
  try {
    // Define auto-fix behavior
    const options = {
      autoFix: (error, context) => {
        // For 404 errors, return default user data
        if (error.response?.status === 404) {
          console.log('Auto-fixing 404 error with default user data');
          return { id: null, name: 'Unknown User', isDefault: true };
        }
        
        // For network errors, use last successful response
        if (!error.response && error.request) {
          console.log('Auto-fixing network error with cached data');
          return context.lastSuccessful || { error: true, offline: true };
        }
        
        return null; // Can't fix other errors
      }
    };
    
    // This will use auto-fix if the request fails
    const response = await fetchless.get('https://api.example.com/users/999', options);
    console.log('Response with auto-fix:', response.data);
  } catch (error) {
    console.log('Error could not be auto-fixed:', error.message);
  }
}

/**
 * Example 4: Fetch Intelligence Panel
 * Analyze request patterns and detect inefficiencies
 */
async function intelligencePanelExample() {
  console.log('---- Intelligence Panel Example ----');
  
  // Make several requests to simulate real usage
  await fetchless.get('https://api.example.com/users?page=1');
  await fetchless.get('https://api.example.com/users?page=1'); // Duplicate
  await fetchless.get('https://api.example.com/users?page=2');
  await fetchless.get('https://api.example.com/users?page=1'); // Duplicate
  await fetchless.get('https://api.example.com/products?category=1');
  await fetchless.get('https://api.example.com/products?category=2');
  
  // Get intelligence and analyze patterns
  const intelligence = fetchless.getIntelligence();
  
  // View request history
  const history = intelligence.getRequestHistory();
  console.log('Request history count:', history.length);
  
  // Detect duplicates
  const duplicates = intelligence.detectDuplicates();
  console.log('Detected duplicate requests:', duplicates);
  
  // Get optimization suggestions
  const suggestions = intelligence.suggestOptimizations();
  console.log('Optimization suggestions:', suggestions);
}

// Run all examples
export async function runAllExamples() {
  await timeTravelExample();
  await freezeModeExample();
  await autoFixerExample();
  await intelligencePanelExample();
}

// If this file is run directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
