const fs = require('fs');
const buf = fs.readFileSync('src/types/supabase.ts');
console.log('Length:', buf.length);
console.log('First 20 bytes:', Array.from(buf.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
