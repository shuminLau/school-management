// db.js - 数据库连接模块
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database', 'school.db');

const db = new Database(DB_PATH);

// 开启 WAL 模式，提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
