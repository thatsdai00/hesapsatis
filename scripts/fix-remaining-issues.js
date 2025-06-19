const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Fix the TS-expect-error comment issue
async function fixTsExpectError(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const newContent = content.replace(
      /\/\/ @ts-expect-error/g, 
      '// @ts-expect-error - API call needs validation'
    );
    
    if (newContent !== content) {
      await writeFile(filePath, newContent, 'utf8');
      console.log(`Fixed TS-expect-error comment in ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
    return false;
  }
}

// Fix parsing errors in seo and settings pages
async function fixParsingErrors(filePaths) {
  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath, 'utf8');
      const fileLines = content.split('\n');
      
      // Clean up quotes and apostrophes
      for (let i = 0; i < fileLines.length; i++) {
        // Replace unescaped quotes in JSX
        fileLines[i] = fileLines[i].replace(/(=\s*")([^"]*)(")/, (match, pre, content, post) => {
          return pre + content.replace(/"/g, '&quot;') + post;
        });
        
        // Replace unescaped apostrophes in JSX
        fileLines[i] = fileLines[i].replace(/(=\s*')([^']*)(')/, (match, pre, content, post) => {
          return pre + content.replace(/'/g, '&apos;') + post;
        });
        
        // Replace unescaped quotes in text content
        fileLines[i] = fileLines[i].replace(/>([^<]*)</g, (match, content) => {
          return '>' + content.replace(/"/g, '&quot;').replace(/'/g, '&apos;') + '<';
        });
      }
      
      const newContent = fileLines.join('\n');
      if (newContent !== content) {
        await writeFile(filePath, newContent, 'utf8');
        console.log(`Fixed parsing errors in ${filePath}`);
      }
    } catch (error) {
      console.error(`Error fixing ${filePath}:`, error);
    }
  }
}

// Fix any types
async function fixAnyTypes(filePaths) {
  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath, 'utf8');
      const newContent = content.replace(/: any(?!\w)/g, ': unknown');
      
      if (newContent !== content) {
        await writeFile(filePath, newContent, 'utf8');
        console.log(`Fixed any types in ${filePath}`);
      }
    } catch (error) {
      console.error(`Error fixing ${filePath}:`, error);
    }
  }
}

// Fix parsing errors in files with identifier expected issues
async function fixIdentifierExpectedErrors(filePaths) {
  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath, 'utf8');
      let newContent = content;
      
      // Fix destructuring issues
      newContent = newContent.replace(/{\s*,\s*}/g, '{}');
      newContent = newContent.replace(/,\s*,/g, ',');
      newContent = newContent.replace(/,\s*}/g, ' }');
      
      // Fix property assignment issues
      newContent = newContent.replace(/(\w+)\s*:/g, '"$1":');
      
      if (newContent !== content) {
        await writeFile(filePath, newContent, 'utf8');
        console.log(`Fixed identifier expected errors in ${filePath}`);
      }
    } catch (error) {
      console.error(`Error fixing ${filePath}:`, error);
    }
  }
}

async function main() {
  // Fix TS-expect-error comment
  await fixTsExpectError('src/app/admin/quick-access/page.tsx');
  
  // Fix parsing errors in pages
  await fixParsingErrors([
    'src/app/admin/seo/page.tsx',
    'src/app/admin/settings/page.tsx'
  ]);
  
  // Fix any types
  await fixAnyTypes([
    'src/app/admin/products/page.simple.tsx',
    'src/app/admin/tickets/[id]/page.tsx',
    'src/app/checkout/page.tsx',
    'src/app/dashboard/tickets/[id]/page.tsx'
  ]);
  
  // Fix identifier expected errors
  await fixIdentifierExpectedErrors([
    'src/app/admin/orders/page.tsx',
    'src/app/dashboard/orders/page.tsx',
    'src/app/page.tsx',
    'src/app/urun/[slug]/ProductPageClient.tsx'
  ]);
}

main(); 