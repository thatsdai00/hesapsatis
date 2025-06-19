const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Files with ts-ignore that need to be fixed
const filesToFix = [
  'src/app/admin/quick-access/page.tsx'
];

async function fixTsComments(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Replace @ts-ignore with @ts-expect-error
    const newContent = content.replace(
      /\/\/ @ts-ignore/g,
      '// @ts-expect-error'
    );
    
    if (newContent !== content) {
      await writeFile(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing TS comments in ${filePath}:`, error);
    return false;
  }
}

async function main() {
  try {
    let fixedCount = 0;
    
    for (const filePath of filesToFix) {
      const fixed = await fixTsComments(filePath);
      if (fixed) {
        fixedCount++;
        console.log(`Fixed TS comments in ${filePath}`);
      } else {
        console.log(`No TS comments to fix in ${filePath}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} files with TS comments`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 