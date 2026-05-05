// routes/students.js - 学生管理 CRUD 接口
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ─────────────────────────────────────────
// GET /api/students
// 获取所有学生（支持按班级筛选）
// Query: ?class_name=高一(1)班
// ─────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { class_name } = req.query;

    let stmt;
    let students;

    if (class_name) {
      stmt = db.prepare('SELECT * FROM students WHERE class_name = ? ORDER BY id');
      students = stmt.all(class_name);
    } else {
      stmt = db.prepare('SELECT * FROM students ORDER BY id');
      students = stmt.all();
    }

    res.json({
      code: 200,
      message: '获取成功',
      total: students.length,
      data: students
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/students/:id
// 获取单个学生详情（含成绩列表）
// ─────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) {
      return res.status(404).json({ code: 404, message: '学生不存在' });
    }

    const scores = db.prepare(
      'SELECT * FROM scores WHERE student_id = ? ORDER BY exam_date DESC'
    ).all(id);

    res.json({
      code: 200,
      message: '获取成功',
      data: { ...student, scores }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/students
// 新增学生
// Body: { name, gender, class_name }
// ─────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { name, gender, class_name } = req.body;

    // 参数校验
    if (!name || !gender || !class_name) {
      return res.status(400).json({ code: 400, message: '参数缺失：name、gender、class_name 均为必填' });
    }
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ code: 400, message: 'gender 只能为 male 或 female' });
    }

    const stmt   = db.prepare('INSERT INTO students (name, gender, class_name) VALUES (?, ?, ?)');
    const result = stmt.run(name, gender, class_name);

    const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      code: 201,
      message: '创建成功',
      data: newStudent
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /api/students/:id
// 更新学生信息（全量更新）
// Body: { name, gender, class_name }
// ─────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, class_name } = req.body;

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) {
      return res.status(404).json({ code: 404, message: '学生不存在' });
    }

    if (!name || !gender || !class_name) {
      return res.status(400).json({ code: 400, message: '参数缺失：name、gender、class_name 均为必填' });
    }
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ code: 400, message: 'gender 只能为 male 或 female' });
    }

    db.prepare(`
      UPDATE students SET name = ?, gender = ?, class_name = ? WHERE id = ?
    `).run(name, gender, class_name, id);

    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);

    res.json({ code: 200, message: '更新成功', data: updated });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/students/:id
// 局部更新学生信息
// Body: { name?, gender?, class_name? }
// ─────────────────────────────────────────
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fields  = req.body;

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) {
      return res.status(404).json({ code: 404, message: '学生不存在' });
    }

    const allowed = ['name', 'gender', 'class_name'];
    const updates = [];
    const values  = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        if (key === 'gender' && !['male', 'female'].includes(fields[key])) {
          return res.status(400).json({ code: 400, message: 'gender 只能为 male 或 female' });
        }
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: '没有可更新的字段' });
    }

    values.push(id);
    db.prepare(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    res.json({ code: 200, message: '更新成功', data: updated });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE /api/students/:id
// 删除学生（关联成绩级联删除）
// ─────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) {
      return res.status(404).json({ code: 404, message: '学生不存在' });
    }

    db.prepare('DELETE FROM students WHERE id = ?').run(id);

    res.json({ code: 200, message: '删除成功', data: { id: Number(id) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
