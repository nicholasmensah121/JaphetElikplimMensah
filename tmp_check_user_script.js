const fs = require('fs');
const html = fs.readFileSync('user.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length === 0) {
  console.error('No inline script found');
  process.exit(1);
}
const script = scripts[0][1];
try {
  new Function(script);
  console.log('script parses fine');
} catch (e) {
  console.error(e);
  process.exit(1);
}
