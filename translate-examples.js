/**
 * EXAMPLE FILES TRANSLATOR
 * This script translates all example files from French to English
 */
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

// Path to examples directory
const examplesDir = path.join(__dirname, 'examples');

// Translation mapping for common French terms in comments and variable names
const translations = {
  // Comments & log messages
  'Exemple': 'Example',
  'Exemples': 'Examples',
  'Utilisation': 'Usage',
  'avancée': 'advanced',
  'Démonstration': 'Demonstration',
  'réponse': 'response',
  'requête': 'request',
  'requêtes': 'requests',
  'données': 'data',
  'résultat': 'result',
  'récupérer': 'retrieve',
  'afficher': 'display',
  'historique': 'history',
  'mise en cache': 'caching',
  'stratégie': 'strategy',
  'stratégies': 'strategies',
  'utilisateur': 'user',
  'configuration': 'configuration',
  'réparation': 'repair',
  'automatique': 'automatic',
  'intelligence': 'intelligence',
  'analyse': 'analysis',
  'panneau': 'panel',
  'statistiques': 'statistics',
  'geler': 'freeze',
  'dégeler': 'unfreeze',
  
  // Variable names
  'donnees': 'data',
  'resultat': 'result',
  'utilisateur': 'user',
  'historique': 'history',
  'reponse': 'response',
  'requete': 'request',
  'strategie': 'strategy'
};

// Function to translate a line of code or comment
function translateLine(line) {
  let translatedLine = line;
  
  Object.entries(translations).forEach(([french, english]) => {
    // Case-insensitive replacement for comments
    if (line.includes('//') || line.includes('/*') || line.includes('*')) {
      // For comments, do a more aggressive replacement
      const regex = new RegExp(french, 'gi');
      translatedLine = translatedLine.replace(regex, english);
    } else {
      // For code, only replace exact matches to avoid breaking code
      const regex = new RegExp(`\\b${french}\\b`, 'g');
      translatedLine = translatedLine.replace(regex, english);
    }
  });
  
  return translatedLine;
}

// Function to translate a file
function translateFile(filePath) {
  console.log(`${colors.yellow}Translating: ${path.basename(filePath)}${colors.reset}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const translatedLines = lines.map(line => translateLine(line));
    const translatedContent = translatedLines.join('\n');
    
    // Only write if there were changes
    if (content !== translatedContent) {
      fs.writeFileSync(filePath, translatedContent);
      console.log(`${colors.green}  ✓ Translated${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.blue}  ✓ No French content found${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}  ✗ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main function to translate all example files
function translateExamples() {
  console.log(`${colors.blue}=== TRANSLATING EXAMPLE FILES FROM FRENCH TO ENGLISH ===${colors.reset}\n`);
  
  try {
    // Ensure examples directory exists
    if (!fs.existsSync(examplesDir)) {
      console.error(`${colors.red}Examples directory not found at: ${examplesDir}${colors.reset}`);
      return;
    }
    
    // Get all files in the examples directory
    const files = fs.readdirSync(examplesDir);
    
    // Stats
    let totalFiles = 0;
    let translatedFiles = 0;
    
    // Process each file
    for (const file of files) {
      const filePath = path.join(examplesDir, file);
      
      // Skip directories and non-JS/TS files
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) continue;
      
      const ext = path.extname(file);
      if (ext !== '.js' && ext !== '.ts') continue;
      
      totalFiles++;
      if (translateFile(filePath)) {
        translatedFiles++;
      }
    }
    
    // Report results
    console.log(`\n${colors.blue}=== TRANSLATION COMPLETE ===${colors.reset}`);
    console.log(`${colors.green}Processed ${totalFiles} files${colors.reset}`);
    console.log(`${colors.green}Translated ${translatedFiles} files${colors.reset}`);
    
    if (translatedFiles > 0) {
      console.log(`\n${colors.yellow}Note: This script performs automated translation of common terms.${colors.reset}`);
      console.log(`${colors.yellow}You may want to review the translated files for any context-specific phrases.${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}An error occurred: ${error.message}${colors.reset}`);
  }
}

// Run the translation
translateExamples(); 