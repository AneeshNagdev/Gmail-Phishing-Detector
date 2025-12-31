const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'phishing.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_domain TEXT,
            reply_to_domain TEXT,
            link_domains TEXT,
            risk_score INTEGER,
            risk_level TEXT,
            flags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
    }
});

module.exports = db;
