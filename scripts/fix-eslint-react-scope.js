const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Function to recursively get all .tsx and .jsx files
async function getComponentFiles(dir) {
  const files = await promisify(fs.readdir)(dir, { withFileTypes: true });
  
  const componentFiles = await Promise.all(files.map(async (file) => {
    const res = path.resolve(dir, file.name);
    if (file.isDirectory()) {
      return getComponentFiles(res);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.jsx')) {
      return res;
    }
    return [];
  }));
  
  return componentFiles.flat();
}

// Function to add React import if it doesn't exist
async function addReactImport(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Skip if React is already imported
    if (content.includes('import * as React from') || 
        content.includes('import React from') || 
        content.includes('import React,')) {
      console.log(`Skipping ${filePath} - React already imported`);
      return;
    }
    
    // Check if the file uses JSX (simplified check)
    const hasJSX = content.includes('<') && content.includes('/>') || content.includes('</');
    if (!hasJSX) {
      console.log(`Skipping ${filePath} - No JSX detected`);
      return;
    }
    
    let newContent;
    
    // Handle 'use client' directive
    if (content.includes("'use client'")) {
      newContent = content.replace(
        "'use client';", 
        "'use client';\n\nimport * as React from 'react';"
      );
    } else {
      // For files without 'use client'
      newContent = `import * as React from 'react';\n${content}`;
    }
    
    await writeFile(filePath, newContent, 'utf8');
    console.log(`Added React import to ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Main function
async function main() {
  try {
    const componentsDir = path.join(__dirname, '..', 'src', 'components');
    const files = await getComponentFiles(componentsDir);
    
    console.log(`Found ${files.length} component files to process`);
    
    for (const file of files) {
      await addReactImport(file);
    }
    
    console.log('Finished adding React imports');
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 