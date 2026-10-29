import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const docsDir = path.resolve(rootDir, 'docs');
const publicDir = path.resolve(rootDir, 'public');

console.log('--- Running GitHub Pages Post-Build Optimization ---');

// 1. Ensure dist exists
if (!fs.existsSync(distDir)) {
  console.error('dist directory does not exist! Please run vite build first.');
  process.exit(1);
}

// 2. Add .nojekyll to dist to prevent GitHub Pages from ignoring assets
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
console.log('Added .nojekyll to dist/');

// 3. Create 404.html from index.html for SPA routing on GitHub Pages
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf-8');
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtml);
  console.log('Created dist/404.html for SPA route fallback');
}

// 4. Ensure mobile packages are in dist
const filesToEnsure = [
  'WageTicker.apk',
  'WageTicker.ipa',
  'WageTicker-Android-Studio-Project.zip',
  'wageticker-scriptable.js'
];

for (const file of filesToEnsure) {
  const src = path.join(publicDir, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to dist/`);
  }
}

// 5. Populate docs/ directory for users who deploy via "Branch: main /docs"
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Recursive copy helper
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(distDir, docsDir);
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
console.log('Copied built site to docs/ (enables GitHub Pages "/docs" branch deployment mode)');

// Also ensure WageTicker.apk is at root
const rootApk = path.join(rootDir, 'WageTicker.apk');
const publicApk = path.join(publicDir, 'WageTicker.apk');
if (fs.existsSync(publicApk)) {
  fs.copyFileSync(publicApk, rootApk);
  console.log('Synced WageTicker.apk to repository root for direct GitHub download');
}

console.log('GitHub Pages post-build completed successfully!');
