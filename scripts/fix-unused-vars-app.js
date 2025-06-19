const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Files with unused variables that need to be fixed
const filesToFix = [
  {
    path: 'src/app/admin/activity/page.tsx',
    unusedVars: ['trpc', 'format', 'handleDateChange']
  },
  {
    path: 'src/app/admin/custom-pages/page.tsx',
    unusedVars: ['Link']
  },
  {
    path: 'src/app/admin/layout.tsx',
    unusedVars: ['FaShoppingBag', 'FaWallet', 'isAdmin']
  },
  {
    path: 'src/app/admin/orders/page.tsx',
    unusedVars: ['FaRedo', 'FaCheck', 'FaTimes', 'OrderItem', 'Stock', 'Order', 'orderId']
  },
  {
    path: 'src/app/admin/page.tsx',
    unusedVars: ['formatPrice', 'AdminDashboardStats', 'trpcUtils']
  },
  {
    path: 'src/app/admin/products/page.simple.tsx',
    unusedVars: ['useState', 'FaUpload', 'FaEye', 'Image', 'Link']
  },
  {
    path: 'src/app/admin/settings/LinksSettingsForm.tsx',
    unusedVars: ['SiteSettingsType']
  },
  {
    path: 'src/app/admin/users/page.tsx',
    unusedVars: ['UserRole']
  },
  {
    path: 'src/app/api/categories/homepage/route.ts',
    unusedVars: ['serializeDecimals']
  },
  {
    path: 'src/app/api/products/featured/route.ts',
    unusedVars: ['serializeDecimals']
  },
  {
    path: 'src/app/auth/register/RegisterForm.tsx',
    unusedVars: ['router']
  },
  {
    path: 'src/app/auth/reset-password/page.tsx',
    unusedVars: ['verifyPasswordResetToken', 'resetPassword', 'router']
  },
  {
    path: 'src/app/dashboard/orders/page.tsx',
    unusedVars: ['session']
  },
  {
    path: 'src/app/dashboard/tickets/page.tsx',
    unusedVars: ['allStatuses']
  },
  {
    path: 'src/app/kategori/[slug]/CategoryPageClient.tsx',
    unusedVars: ['FaStar', 'FaSearch', 'formatPrice', 'useEffect', 'pathname']
  },
  {
    path: 'src/app/kategori/[slug]/page.tsx',
    unusedVars: ['parent']
  },
  {
    path: 'src/app/page.tsx',
    unusedVars: ['FaArrowRight', 'FaArrowLeft', 'ProductWithRelations', 'CategoryWithProducts', 'SliderType', 'CategoryWithCount', 'nextCategory', 'prevCategory']
  },
  {
    path: 'src/app/sayfa/[slug]/page.tsx',
    unusedVars: ['parent']
  },
  {
    path: 'src/app/urun/[slug]/ProductPageClient.tsx',
    unusedVars: ['productId']
  },
  {
    path: 'src/app/urun/[slug]/page.tsx',
    unusedVars: ['Product', 'parent', 'ProductPageContent']
  }
];

// Function to fix unused variables in a file
async function fixUnusedVars(fileInfo) {
  try {
    const filePath = fileInfo.path;
    const content = await readFile(filePath, 'utf8');
    let newContent = content;
    
    // Create a map for quick lookup
    const unusedVarsMap = {};
    for (const varName of fileInfo.unusedVars) {
      unusedVarsMap[varName] = true;
    }
    
    // Fix import statements with unused variables
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"][^'"]+['"];?/g;
    
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
    
    // Fix unused variable declarations
    for (const varName of fileInfo.unusedVars) {
      // Find and remove variable declarations
      const varDeclarationRegex = new RegExp(`(?:const|let|var)\\s+${varName}\\s*=\\s*[^;]+;`, 'g');
      newContent = newContent.replace(varDeclarationRegex, '');
      
      // Find and modify destructuring assignments
      const destructuringRegex = new RegExp(`({[^}]*?)\\b${varName}\\b([^}]*})`, 'g');
      newContent = newContent.replace(destructuringRegex, (match, pre, post) => {
        return pre + post;
      });
      
      // Clean up any trailing commas in destructuring
      newContent = newContent.replace(/,\s*}/g, ' }');
      newContent = newContent.replace(/,\s*,/g, ',');
      
      // Remove empty destructuring
      newContent = newContent.replace(/const\s*{\s*}\s*=\s*[^;]+;/g, '');
    }
    
    // Fix "any" type by changing to "unknown"
    newContent = newContent.replace(/: any(?![a-zA-Z0-9_])/g, ': unknown');
    
    if (newContent !== content) {
      await writeFile(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing unused variables in ${fileInfo.path}:`, error);
    return false;
  }
}

// Function to fix unescaped entities in React
async function fixUnescapedEntities(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Replace unescaped entities
    let newContent = content
      .replace(/([^\\]|^)'/g, '$1&apos;')  // Replace single quotes
      .replace(/([^\\]|^)"/g, '$1&quot;'); // Replace double quotes
    
    if (newContent !== content) {
      await writeFile(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing unescaped entities in ${filePath}:`, error);
    return false;
  }
}

async function main() {
  try {
    let fixedCount = 0;
    
    // Fix unused variables
    for (const fileInfo of filesToFix) {
      const fixed = await fixUnusedVars(fileInfo);
      if (fixed) {
        fixedCount++;
        console.log(`Fixed unused variables in ${fileInfo.path}`);
      } else {
        console.log(`No changes needed for ${fileInfo.path}`);
      }
    }
    
    // Fix unescaped entities in specific files
    const filesToFixEntities = [
      'src/app/admin/seo/page.tsx',
      'src/app/admin/settings/page.tsx'
    ];
    
    for (const filePath of filesToFixEntities) {
      const fixed = await fixUnescapedEntities(filePath);
      if (fixed) {
        console.log(`Fixed unescaped entities in ${filePath}`);
      } else {
        console.log(`No unescaped entities to fix in ${filePath}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} files with unused variables`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 