const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new Database(dbPath);

console.log('Opened database at:', dbPath);

// 1. Find Authenticated Role ID
const roleRow = db.prepare('SELECT id FROM up_roles WHERE type = ?').get('authenticated');
if (!roleRow) {
  console.error('Authenticated role not found!');
  process.exit(1);
}
const roleId = roleRow.id;
console.log('Authenticated Role ID:', roleId);

const permissions = [
  'api::student.student.createPortalAccess',
  'api::student.student.updatePortalAccessStatus'
];

for (const action of permissions) {
  // Check if exists
  const existing = db.prepare('SELECT id FROM up_permissions WHERE action = ? AND role_id = ?').get(action, roleId);
  if (existing) {
    console.log(`Permission ${action} already exists for role ${roleId}`);
  } else {
    // Insert
    const start = new Date().toISOString();
    db.prepare('INSERT INTO up_permissions (action, role_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run(action, roleId, start, start);
    console.log(`Inserted permission ${action} for role ${roleId}`);
  }
}

db.close();
console.log('Finished updating auth permissions directly via DB.');
