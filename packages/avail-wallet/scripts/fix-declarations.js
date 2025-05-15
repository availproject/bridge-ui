#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const typesDir = path.resolve(__dirname, '../dist/types');
const destFile = path.resolve(__dirname, '../dist/index.d.ts');

// Ensure dist directory exists
if (!fs.existsSync(path.dirname(destFile))) {
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
}

try {
  // Read the generated index.d.ts file
  const indexDtsPath = path.join(typesDir, 'index.d.ts');
  let content = fs.readFileSync(indexDtsPath, 'utf8');
  
  // Remove CSS import
  content = content.replace(/import ["']\.\/styles\.css["'];(\r?\n|\r)?/g, '');
  
  // Write the modified content to the destination
  fs.writeFileSync(destFile, content);
  
  console.log('Successfully copied and modified declaration files');
  
  // Clean up types directory if needed
  // fs.rmSync(typesDir, { recursive: true, force: true });
  
} catch (error) {
  console.error('Error processing declaration files:', error);
  process.exit(1);
}