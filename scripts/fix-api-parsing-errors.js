const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// List of files with parsing errors
const apiRoutesToFix = [
  'src/app/api/admin/quick-access/[id]/route.ts',
  'src/app/api/admin/quick-access/route.ts',
  'src/app/api/admin/tickets/[id]/refund/route.ts',
  'src/app/api/auth/forgot-password/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/auth/reset-password/route.ts',
  'src/app/api/auth/verify-token/route.ts'
];

async function fixApiRouteFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let newContent = content;
    
    // Fix "Expression expected" errors
    // These are likely from trying to remove variables that are part of destructuring patterns
    // Let's fix them by properly handling the destructuring syntax
    
    const destructuringRegex = /(?:const|let|var)\s+{([^}]*)}\s*=\s*([^;]+);?/g;
    newContent = newContent.replace(destructuringRegex, (match, destructured, source) => {
      // Replace ", ," with ","
      let cleanDestructured = destructured.replace(/,\s*,/g, ',');
      
      // Remove trailing commas
      cleanDestructured = cleanDestructured.replace(/,\s*$/g, '');
      
      // Fix empty destructuring (e.g., "const { } = something")
      if (cleanDestructured.trim() === '') {
        return '';
      }
      
      return `const { ${cleanDestructured} } = ${source};`;
    });
    
    // Fix specific issues in verify-token route (special case)
    if (filePath.includes('verify-token')) {
      newContent = newContent.replace(/export async function GET\(\)\s*{/, 'export async function GET(req) {');
    }
    
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
    let fixedCount = 0;
    
    for (const routePath of apiRoutesToFix) {
      const fixed = await fixApiRouteFile(routePath);
      if (fixed) {
        fixedCount++;
        console.log(`Fixed parsing errors in ${routePath}`);
      } else {
        console.log(`No changes needed for ${routePath}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} API route files with parsing errors`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 