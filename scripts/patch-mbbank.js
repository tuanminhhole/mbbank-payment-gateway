/**
 * Post-install patch for mbbank library
 *
 * MB Bank frequently changes their API endpoints.
 * This script patches the compiled mbbank library to use the correct endpoints.
 *
 * Run: node scripts/patch-mbbank.js
 *
 * Last updated: March 2026
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'node_modules', 'mbbank', 'dist', 'index.js');

if (!fs.existsSync(filePath)) {
  console.log('⏭️ mbbank dist/index.js not found — skipping patch');
  console.log('   Make sure to run "npm install" first.');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');
let patched = 0;

/**
 * Known endpoint changes.
 * Add new entries here when MB Bank changes their API.
 */
const fixes = [
  {
    from: '/api/retail-web-internetbankingms/getCaptchaImage',
    to:   '/api/retail-internetbankingms/getCaptchaImage',
    desc: 'Captcha endpoint',
  },
  {
    from: '/api/retail-web-accountms/getBalance',
    to:   '/api/retail-accountms/accountms/getBalance',
    desc: 'Balance endpoint',
  },
];

for (const fix of fixes) {
  if (content.includes(fix.from)) {
    content = content.replaceAll(fix.from, fix.to);
    console.log(`✅ Patched ${fix.desc}: ${fix.from} → ${fix.to}`);
    patched++;
  } else {
    console.log(`⏭️ ${fix.desc}: already patched or not found`);
  }
}

if (patched > 0) {
  fs.writeFileSync(filePath, content);
  console.log(`\n✅ Done! ${patched} endpoint(s) patched.`);
} else {
  console.log('\nNo patches needed.');
}
