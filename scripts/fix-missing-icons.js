const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Files with missing icon imports
const filesToFix = [
  {
    path: 'src/app/admin/layout.tsx',
    missingIcons: ['FaHome', 'FaCog'],
    importStatement: "import { FaHome, FaCog } from 'react-icons/fa';"
  },
  {
    path: 'src/app/admin/settings/LinksSettingsForm.tsx',
    missingIcons: ['FaArrowUp', 'FaArrowDown'],
    importStatement: "import { FaArrowUp, FaArrowDown } from 'react-icons/fa';"
  },
  {
    path: 'src/app/admin/settings/page.tsx',
    missingIcons: ['FaCog'],
    importStatement: "import { FaCog } from 'react-icons/fa';"
  },
  {
    path: 'src/app/admin/users/page.tsx',
    missingIcons: ['FaCog'],
    importStatement: "import { FaCog } from 'react-icons/fa';"
  },
  {
    path: 'src/app/auth/AuthPage.tsx',
    missingIcons: ['FaGamepad'],
    importStatement: "import { FaGamepad } from 'react-icons/fa';"
  },
  {
    path: 'src/app/auth/forgot-password/page.tsx',
    missingIcons: ['FaGamepad'],
    importStatement: "import { FaGamepad } from 'react-icons/fa';"
  },
  {
    path: 'src/app/auth/reset-password/page.tsx',
    missingIcons: ['FaGamepad'],
    importStatement: "import { FaGamepad } from 'react-icons/fa';"
  },
  {
    path: 'src/app/kategori/[slug]/CategoryPageClient.tsx',
    missingIcons: ['FaHome'],
    importStatement: "import { FaHome } from 'react-icons/fa';"
  },
  {
    path: 'src/app/sayfa/[slug]/page.tsx',
    missingIcons: ['FaHome'],
    importStatement: "import { FaHome } from 'react-icons/fa';"
  },
  {
    path: 'src/app/urun/[slug]/ProductPageClient.tsx',
    missingIcons: ['FaHome'],
    importStatement: "import { FaHome } from 'react-icons/fa';"
  },
  {
    path: 'src/app/urun/[slug]/page.tsx',
    missingIcons: ['FaHome'],
    importStatement: "import { FaHome } from 'react-icons/fa';"
  }
];

async function fixMissingIconImports() {
  try {
    let fixedCount = 0;
    
    for (const fileInfo of filesToFix) {
      try {
        const filePath = fileInfo.path;
        const content = await readFile(filePath, 'utf8');
        
        // Check if any of the icons are actually used in the file
        const iconsUsed = fileInfo.missingIcons.filter(icon => content.includes(`<${icon}`) || content.includes(`${icon} `));
        
        if (iconsUsed.length === 0) {
          console.log(`No missing icons actually used in ${filePath}, skipping`);
          continue;
        }
        
        // Check if the import is already present
        if (content.includes(fileInfo.importStatement)) {
          console.log(`Import already exists in ${filePath}, skipping`);
          continue;
        }
        
        // Add the import after the last import statement
        const lines = content.split('\n');
        let lastImportIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        
        if (lastImportIndex !== -1) {
          lines.splice(lastImportIndex + 1, 0, fileInfo.importStatement);
          await writeFile(filePath, lines.join('\n'), 'utf8');
          console.log(`Fixed missing icon imports in ${filePath}`);
          fixedCount++;
        } else {
          console.log(`Could not find import statements in ${filePath}, skipping`);
        }
        
      } catch (error) {
        console.error(`Error fixing file ${fileInfo.path}:`, error);
      }
    }
    
    console.log(`Fixed ${fixedCount} files with missing icon imports`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixMissingIconImports(); 