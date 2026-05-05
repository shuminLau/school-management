// database/init.js - 数据库初始化，创建表结构
const db = require('../db');

function initDatabase() {
  // 创建 students 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      gender      TEXT    NOT NULL CHECK(gender IN ('male', 'female')),
      class_name  TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 创建 scores 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id  INTEGER NOT NULL,
      subject     TEXT    NOT NULL,
      score       REAL    NOT NULL CHECK(score >= 0 AND score <= 150),
      exam_date   TEXT    NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  // 插入示例数据（仅首次运行时）
  const count = db.prepare('SELECT COUNT(*) as cnt FROM students').get();
  if (count.cnt === 0) {
    const insertStudent = db.prepare(`
      INSERT INTO students (name, gender, class_name) VALUES (?, ?, ?)
    `);
    const insertScore = db.prepare(`
      INSERT INTO scores (student_id, subject, score, exam_date) VALUES (?, ?, ?, ?)
    `);

    const s1 = insertStudent.run('张三', 'male',   '高一(1)班');
    const s2 = insertStudent.run('李四', 'female', '高一(1)班');
    const s3 = insertStudent.run('王五', 'male',   '高一(2)班');

    insertScore.run(s1.lastInsertRowid, '数学', 95,  '2024-03-01');
    insertScore.run(s1.lastInsertRowid, '语文', 88,  '2024-03-01');
    insertScore.run(s2.lastInsertRowid, '数学', 102, '2024-03-01');
    insertScore.run(s2.lastInsertRowid, '英语', 118, '2024-03-01');
    insertScore.run(s3.lastInsertRowid, '数学', 76,  '2024-03-01');

    console.log('✅ 示例数据插入完成');
  }

  console.log('✅ 数据库初始化完成');
}

module.exports = initDatabase;
