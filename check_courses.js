const BetterSqlite3 = require('better-sqlite3');
const db = new BetterSqlite3('.tmp/data.db');
const courses = db.prepare('SELECT id, title, code FROM courses').all();
console.log(JSON.stringify(courses, null, 2));
db.close();
