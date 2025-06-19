const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Files with any types that need to be fixed
const filesToFix = [
  'src/app/admin/products/page.simple.tsx',
  'src/app/admin/tickets/[id]/page.tsx',
  'src/app/checkout/page.tsx',
  'src/app/dashboard/tickets/[id]/page.tsx'
];

async function fixAnyTypes() {
  for (const filePath of filesToFix) {
    try {
      console.log(`Processing ${filePath}...`);
      const content = await readFile(filePath, 'utf8');
      const newContent = content.replace(/: any(?!\w)/g, ': unknown');
      
      if (newContent !== content) {
        await writeFile(filePath, newContent, 'utf8');
        console.log(`Fixed any types in ${filePath}`);
      } else {
        console.log(`No any types found in ${filePath}`);
      }
    } catch (error) {
      console.error(`Error fixing ${filePath}:`, error);
    }
  }
}

fixAnyTypes().catch(console.error); 