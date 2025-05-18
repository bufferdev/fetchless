// Un script simple pour tester l'écriture dans un fichier
const fs = require('fs');
const path = require('path');

// Chemin absolu du fichier de test
const testFile = 'C:/Users/Amir/Documents/fetchless-output.txt';
console.log(`Écriture dans le fichier: ${testFile}`);

// Écrire dans le fichier
try {
  fs.writeFileSync(testFile, 'Test d\'écriture dans un fichier\n');
  fs.appendFileSync(testFile, 'Ajout d\'une deuxième ligne\n');
  fs.appendFileSync(testFile, `Date actuelle: ${new Date().toISOString()}\n`);
  console.log('Écriture réussie!');
  
  // Lire le contenu
  const content = fs.readFileSync(testFile, 'utf8');
  console.log('Contenu du fichier:');
  console.log(content);
} catch (error) {
  console.error('Erreur lors de l\'écriture dans le fichier:', error);
} 