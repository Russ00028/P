const fs = require('fs');
const path = require('path');

// Simple static copy build: copies all files except node_modules and .git to dist/
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      // skip node build folders and git
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'functions') continue;
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// ensure clean
if (fs.existsSync(out)) {
  fs.rmSync(out, { recursive: true, force: true });
}

copyRecursive(root, out);
console.log('Built dist/');
