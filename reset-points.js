const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'kids-points.db');
const db = new Database(dbPath);

console.log('Resetting all kids points to 0...');

// Reset all kids to have lifetime_points = 0 and redeemed_points = 0
const result = db.prepare(`
  UPDATE kids
  SET lifetime_points = 0, redeemed_points = 0
`).run();

console.log(`Updated ${result.changes} kids`);

// Show current state
const kids = db.prepare('SELECT id, name, lifetime_points, redeemed_points FROM kids').all();
console.log('\nCurrent state:');
kids.forEach(kid => {
  console.log(`  ${kid.name}: lifetime=${kid.lifetime_points}, redeemed=${kid.redeemed_points}`);
});

db.close();
console.log('\nDone! Refresh your app to see the changes.');
