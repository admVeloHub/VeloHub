import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(d) {
  for (const n of fs.readdirSync(d, { withFileTypes: true })) {
    if (n.name === 'node_modules' || n.name === '.git') continue;
    const p = path.join(d, n.name);
    if (n.isDirectory()) walk(p);
    else if (/\.(js|jsx|css)$/i.test(n.name)) {
      let t = fs.readFileSync(p, 'utf8');
      if (!t.includes('  * Referência')) continue;
      const next = t.split('  * Referência').join(' * Referência');
      if (next !== t) fs.writeFileSync(p, next, 'utf8');
    }
  }
}

walk(ROOT);
console.log('Feito');
