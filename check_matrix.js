const BetterSqlite3 = require('better-sqlite3');
const db = new BetterSqlite3('.tmp/data.db');
const matrix = db.prepare('SELECT id, role, permissions FROM role_access_matrices').all();
console.log(JSON.stringify(matrix, null, 2));
db.close();
