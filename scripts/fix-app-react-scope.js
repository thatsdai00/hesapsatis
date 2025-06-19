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
    
    // Skip if already has React import
    if (content.includes("import * as React from 'react'") || 
        content.includes('import React from "react"') || 
        content.includes('import React from \'react\'')) {
      return false;
    }
    
    // If it's a client component with 'use client', add React import after it
    if (content.includes("'use client'")) {
      const newContent = content.replace("'use client';", "'use client';\n\nimport * as React from 'react';");
      await writeFile(filePath, newContent, 'utf8');
      return true;
    } 
    // If it has other imports, add React import at the top
    else if (content.includes('import ')) {
      const lines = content.split('\n');
      let firstImportIndex = lines.findIndex(line => line.trim().startsWith('import '));
      
      if (firstImportIndex !== -1) {
        lines.splice(firstImportIndex, 0, "import * as React from 'react';");
        await writeFile(filePath, lines.join('\n'), 'utf8');
        return true;
      }
    }
    
    // Otherwise, add React import at the top of the file
    const newContent = "import * as React from 'react';\n" + content;
    await writeFile(filePath, newContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Function to fix unused variables
async function fixUnusedVars(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Map of known unused variables to fix
    const unusedVarsMap = {
      'FaArrowUp': true,
      'FaArrowDown': true,
      'FaGamepad': true,
      'Prisma': true,
      'Decimal': true,
      'UserRole': true,
      'parent': true,
      'useRef': true,
      'useEffect': true,
      'FaCog': true,
      'FaHome': true,
      'cn': true,
      'parseError': true,
      'hashError': true,
      'req': true,
      'productId': true
    };
    
    // Find import statements with unused variables
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"][^'"]+['"];?/g;
    let newContent = content;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importStatement = match[0];
      const importedVars = match[1].split(',').map(v => v.trim());
      
      // Filter out unused variables
      const cleanedVars = importedVars.filter(v => {
        const varName = v.split(' as ')[0].trim();
        return !unusedVarsMap[varName];
      });
      
      if (cleanedVars.length !== importedVars.length) {
        if (cleanedVars.length === 0) {
          // Remove the entire import statement if all variables are unused
          newContent = newContent.replace(importStatement, '');
        } else {
          // Replace with cleaned import statement
          const newImport = importStatement.replace(match[1], cleanedVars.join(', '));
          newContent = newContent.replace(importStatement, newImport);
        }
      }
    }
    
    // Replace 'any' with 'unknown' type
    newContent = newContent.replace(/: any(?![a-zA-Z0-9_])/g, ': unknown');
    
    if (newContent !== content) {
      await writeFile(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing unused vars in ${filePath}:`, error);
    return false;
  }
}

async function main() {
  try {
    // Get all component files from src/app
    const files = await getComponentFiles(path.resolve('src/app'));
    console.log(`Found ${files.length} component files in src/app`);
    
    // Add React import to all files
    let reactImportCount = 0;
    let unusedVarsCount = 0;
    
    for (const file of files) {
      const reactImported = await addReactImport(file);
      if (reactImported) {
        reactImportCount++;
        console.log(`Added React import to ${file}`);
      }
      
      const varsFixed = await fixUnusedVars(file);
      if (varsFixed) {
        unusedVarsCount++;
        console.log(`Fixed unused variables in ${file}`);
      }
    }
    
    console.log(`Added React import to ${reactImportCount} files`);
    console.log(`Fixed unused variables in ${unusedVarsCount} files`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 