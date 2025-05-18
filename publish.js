/**
 * PUBLISH SCRIPT
 * This script runs the preparation and publishing steps for the fetchless library
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Terminal colors for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.blue}=== FETCHLESS PUBLICATION PROCESS ===${colors.reset}\n`);

try {
  // 1. Clean and prepare the project
  console.log(`${colors.yellow}1. Running preparation script...${colors.reset}`);
  require('./prepare-for-publish');
  console.log(`\n${colors.green}✓ Preparation completed${colors.reset}\n`);

  // 2. Build the project
  console.log(`${colors.yellow}2. Building the project...${colors.reset}`);
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`\n${colors.green}✓ Build completed${colors.reset}\n`);

  // 3. Run tests to verify everything works
  console.log(`${colors.yellow}3. Running tests...${colors.reset}`);
  execSync('npm test', { stdio: 'inherit' });
  console.log(`\n${colors.green}✓ Tests passed${colors.reset}\n`);

  // 4. Confirmation before publishing
  console.log(`${colors.blue}The package is ready to be published!${colors.reset}`);
  console.log(`${colors.yellow}Review the information:${colors.reset}`);
  
  // Read package.json to show current version
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  console.log(`- Package name: ${colors.green}${packageJson.name}${colors.reset}`);
  console.log(`- Version: ${colors.green}${packageJson.version}${colors.reset}`);
  console.log(`- Description: ${colors.green}${packageJson.description}${colors.reset}`);
  
  console.log(`\n${colors.blue}To publish, run:${colors.reset}`);
  console.log(`${colors.green}npm publish${colors.reset}`);
  console.log(`\n${colors.yellow}Note: Make sure you're logged in to npm with 'npm login' first.${colors.reset}`);

} catch (error) {
  console.error(`\n${colors.red}Error during publication process:${colors.reset}`);
  console.error(error);
  process.exit(1);
} 