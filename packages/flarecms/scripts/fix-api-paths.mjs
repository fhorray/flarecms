import fs from 'node:fs';
import { resolve, dirname } from 'node:path';

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
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace apiFetch('/api/...') with apiFetch('/...')
  const newContent = content.replace(/apiFetch\((['"`])\/api\//g, (match, quote) => {
    changed = true;
    return `apiFetch(${quote}/`;
  });

  if (changed) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated API paths in: ${filePath}`);
  }
});

console.log('API path refactoring complete.');
