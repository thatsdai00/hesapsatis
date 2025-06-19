const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Function to recursively get all API route files
async function getApiRouteFiles(dir) {
  const files = await promisify(fs.readdir)(dir, { withFileTypes: true });
  
  const routeFiles = await Promise.all(files.map(async (file) => {
    const res = path.resolve(dir, file.name);
    if (file.isDirectory()) {
      return getApiRouteFiles(res);
    } else if (file.name === 'route.ts' || file.name === 'route.js') {
      return res;
    }
    return [];
  }));
  
  return routeFiles.flat();
}

// Function to fix API route files
async function fixApiRouteFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let newContent = content;
    
    // Fix unused variables
    const unusedVars = ['req', 'parseError', 'hashError', '_'];
    
    for (const varName of unusedVars) {
      // Find and remove unused variable declarations
      const varRegex = new RegExp(`(?:const|let|var)\\s+${varName}\\s*=\\s*[^;]+;?`, 'g');
      newContent = newContent.replace(varRegex, '');
      
      // Find and modify destructuring assignments
      const destructRegex = new RegExp(`({[^}]*?)\\b${varName}\\b([^}]*})`, 'g');
      newContent = newContent.replace(destructRegex, (match, pre, post) => {
        return pre + post;
      });
      
      // Clean up any trailing commas in destructuring
      newContent = newContent.replace(/,\s*}/g, ' }');
      newContent = newContent.replace(/,\s*,/g, ',');
    }
    
    // Replace 'any' type with 'unknown'
    newContent = newContent.replace(/: any(?![a-zA-Z0-9_])/g, ': unknown');
    
    if (newContent !== content) {
      await writeFile(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing API route file ${filePath}:`, error);
    return false;
  }
}

async function main() {
  try {
    // Get all API route files
    const routeFiles = await getApiRouteFiles(path.resolve('src/app/api'));
    console.log(`Found ${routeFiles.length} API route files`);
    
    let fixedCount = 0;
    
    for (const file of routeFiles) {
      const fixed = await fixApiRouteFile(file);
      if (fixed) {
        fixedCount++;
        console.log(`Fixed ${file}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} API route files`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 