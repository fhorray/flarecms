import fs from 'node:fs';
import { resolve, relative, dirname } from 'node:path';

function getFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents.map((dirent) => {
    const res = resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}

const clientRoot = resolve('src/client');
const files = getFiles(clientRoot).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

files.forEach(filePath => {
  const fileDir = dirname(filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Robust Multiline Regex for @/ imports
  // Matches (import|export) ... from '@/...'
  content = content.replace(/(import|export)([\s\S]*?)from\s+['"]@\/(.*?)['"]/g, (match, type, body, importPath) => {
    const targetPath = resolve(clientRoot, importPath);
    let relPath = relative(fileDir, targetPath).replace(/\\/g, '/');
    
    if (!relPath.startsWith('.')) {
      relPath = './' + relPath;
    }
    
    // We replace specifically the matched @/path part
    const fullPattern = `@/${importPath}`;
    return match.replace(fullPattern, relPath);
  });

  fs.writeFileSync(filePath, content);
});

console.log(`Aggressively fixed imports in ${files.length} files.`);
