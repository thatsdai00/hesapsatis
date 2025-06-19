const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// List of common unused imports/variables to remove
const unusedVars = [
  { file: 'src/components/admin/ProductRow.tsx', vars: ['CardContent', 'CardHeader', 'CardTitle'] },
  { file: 'src/components/admin/SalesOverviewPanel.tsx', fixAny: true },
  { file: 'src/components/admin/StockUploader.tsx', vars: ['useCallback'] },
  { file: 'src/components/auth/UserMenu.tsx', vars: ['FaShoppingCart'] },
  { file: 'src/components/dashboard/DashboardClient.tsx', vars: ['DashboardClientProps'] },
  { file: 'src/components/dashboard/NewTicketForm.tsx', vars: ['setValue'] },
  { file: 'src/components/products/ProductCard.tsx', vars: ['isInCart'] }
];

// Function to remove unused imports and variables
async function fixUnusedVars(filePath, varsToRemove, fixAnyType = false) {
  try {
    let content = await readFile(filePath, 'utf8');
    
    if (varsToRemove && varsToRemove.length > 0) {
      // Handle different types of imports
      varsToRemove.forEach(varName => {
        // Match import patterns like: import { X, Y, Z } from ...
        const importRegex = new RegExp(`import\\s+\\{([^}]*)\\}\\s+from\\s+['"][^'"]+['"]`, 'g');
        
        content = content.replace(importRegex, (match, importList) => {
          // Split the import list by comma and process
          const imports = importList.split(',').map(imp => imp.trim());
          const filteredImports = imports.filter(imp => {
            // Handle rename cases like: Original as Alias
            const baseName = imp.split(' as ')[0].trim();
            return baseName !== varName;
          });
          
          if (filteredImports.length === 0) {
            // If all imports are removed, remove the entire import statement
            return '';
          }
          
          return `import { ${filteredImports.join(', ')} } from ${match.split('from')[1].trim()}`;
        });
        
        // Remove destructured variables in function params or hooks
        const destructuringRegex = new RegExp(`\\{([^}]*)\\b${varName}\\b([^}]*)\\}`, 'g');
        content = content.replace(destructuringRegex, (match, before, after) => {
          // Check if there are other variables in the destructuring
          const parts = (before + after).split(',').filter(p => p.trim() && !p.trim().endsWith(varName) && !p.trim().startsWith(varName));
          
          if (parts.length === 0) {
            return '{}'; // Empty object if all variables are removed
          }
          
          return `{ ${parts.join(', ')} }`;
        });
      });
    }
    
    // Fix any types if needed
    if (fixAnyType) {
      // Replace 'any' with a more specific type like 'unknown'
      content = content.replace(/: any(\s|[,)])/g, ': unknown$1');
      content = content.replace(/as any(\s|[,)])/g, 'as unknown$1');
    }
    
    await writeFile(filePath, content, 'utf8');
    console.log(`Fixed unused variables in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Main function
async function main() {
  try {
    console.log('Starting to fix unused variables...');
    
    for (const item of unusedVars) {
      const filePath = path.resolve(__dirname, '..', item.file);
      if (fs.existsSync(filePath)) {
        await fixUnusedVars(filePath, item.vars, item.fixAny);
      } else {
        console.warn(`File not found: ${filePath}`);
      }
    }
    
    console.log('Finished fixing unused variables');
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 