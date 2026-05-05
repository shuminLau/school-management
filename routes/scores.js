// routes/scores.js - 成绩管理 CRUD 接口
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ─────────────────────────────────────────
// GET /api/scores
// 获取所有成绩（支持多条件筛选）
// Query: ?student_id=1 & subject=数学 & exam_date=2024-03-01
// ─────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { student_id, subject, exam_date } = req.query;

    let sql    = `
      SELECT s.id, s.student_id, st.name AS student_name,
             st.class_name, s.subject, s.score, s.exam_date
      FROM scores s
      JOIN students st ON s.student_id = st.id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) { sql += ' AND s.student_id = ?'; params.push(student_id); }
    if (subject)    { sql += ' AND s.subject = ?';    params.push(subject); }
    if (exam_date)  { sql += ' AND s.exam_date = ?';  params.push(exam_date); }

    sql += ' ORDER BY s.exam_date DESC, s.id';

    const scores = db.prepare(sql).all(...params);

    res.json({
      code: 200,
      message: '获取成功',
      total: scores.length,
      data: scores
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/scores/:id
// 获取单条成绩详情
// ─────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const score = db.prepare(`
      SELECT s.id, s.student_id, st.name AS student_name,
             st.class_name, s.subject, s.score, s.exam_date
      FROM scores s
      JOIN students st ON s.student_id = st.id
      WHERE s.id = ?
    `).get(id);

    if (!score) {
      return res.status(404).json({ code: 404, message: '成绩记录不存在' });
    }

    res.json({ code: 200, message: '获取成功', data: score });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/scores/student/:student_id/summary
// 获取某学生的成绩统计（平均分、最高分、最低分）
// ─────────────────────────────────────────
router.get('/student/:student_id/summary', (req, res) => {
  try {
    const { student_id } = req.params;

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(student_id);
    if (!student) {
      return res.status(404).json({ code: 404, message: '学生不存在' });
    }

    const summary = db.prepare(`
      SELECT
        subject,
        COUNT(*)   AS exam_count,
        AVG(score) AS avg_score,
        MAX(score) AS max_score,
        MIN(score) AS min_score
      FROM scores
      WHERE student_id = ?
      GROUP BY subject
    `).all(student_id);

    const overall = db.prepare(`
      SELECT
        COUNT(*)   AS total_exams,
        AVG(score) AS overall_avg,
        MAX(score) AS overall_max,
        MIN(score) AS overall_min
      FROM scores
      WHERE student_id = ?
    `).get(student_id);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        student,
        by_subject: summary,
        overall
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/scores
// 新增成绩
// Body: { student_id, subject, score, exam_date }
// ─────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { student_id, subject, score, exam_date } = req.body;

    // 参数校验
    if (!student_id || !subject || score === undefined || !exam_date) {
      return res.status(400).json({
        code: 400,
        message: '参数缺失：student_id、subject、score、exam_date 均为必填'
      });
    }
    if (isNaN(score) || score < 0 || score > 150) {
      return res.status(400).json({ code: 400, message: 'score 必须在 0~150 之间' });
    }
    // 校验日期格式
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exam_date)) {
      return res.status(400).json({ code: 400, message: 'exam_date 格式应为 YYYY-MM-DD' });
    }

    // 确认学生存在
    const student = db.prepare('SELECT id FROM students WHERE id = ?').get(student_id);
    if (!student) {
      return res.status(404).json({ code: 404, message: '学生不存在' });
    }

    const result = db.prepare(`
      INSERT INTO scores (student_id, subject, score, exam_date) VALUES (?, ?, ?, ?)
    `).run(student_id, subject, score, exam_date);

    const newScore = db.prepare(`
      SELECT s.id, s.student_id, st.name AS student_name,
             st.class_name, s.subject, s.score, s.exam_date
      FROM scores s
      JOIN students st ON s.student_id = st.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ code: 201, message: '创建成功', data: newScore });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /api/scores/:id
// 更新成绩（全量）
// Body: { student_id, subject, score, exam_date }
// ─────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { student_id, subject, score, exam_date } = req.body;

    const existing = db.prepare('SELECT * FROM scores WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ code: 404, message: '成绩记录不存在' });
    }
    if (!student_id || !subject || score === undefined || !exam_date) {
      return res.status(400).json({ code: 400, message: '参数缺失' });
    }
    if (isNaN(score) || score < 0 || score > 150) {
      return res.status(400).json({ code: 400, message: 'score 必须在 0~150 之间' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exam_date)) {
      return res.status(400).json({ code: 400, message: 'exam_date 格式应为 YYYY-MM-DD' });
    }

    const student = db.prepare('SELECT id FROM students WHERE id = ?').get(student_id);
    if (!student) {
      return res.status(404).json({ code: 404, message: '学生不存在' });
    }

    db.prepare(`
      UPDATE scores SET student_id = ?, subject = ?, score = ?, exam_date = ? WHERE id = ?
    `).run(student_id, subject, score, exam_date, id);

    const updated = db.prepare(`
      SELECT s.id, s.student_id, st.name AS student_name,
             st.class_name, s.subject, s.score, s.exam_date
      FROM scores s
      JOIN students st ON s.student_id = st.id
      WHERE s.id = ?
    `).get(id);

    res.json({ code: 200, message: '更新成功', data: updated });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/scores/:id
// 局部更新成绩
// Body: { subject?, score?, exam_date? }
// ─────────────────────────────────────────
router.patch('/:id', (req, res) => {
  try {
    const { id }  = req.params;
    const fields  = req.body;

    const existing = db.prepare('SELECT * FROM scores WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ code: 404, message: '成绩记录不存在' });
    }

    const allowed = ['subject', 'score', 'exam_date'];
    const updates = [];
    const values  = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        if (key === 'score' && (isNaN(fields[key]) || fields[key] < 0 || fields[key] > 150)) {
          return res.status(400).json({ code: 400, message: 'score 必须在 0~150 之间' });
        }
        if (key === 'exam_date' && !/^\d{4}-\d{2}-\d{2}$/.test(fields[key])) {
          return res.status(400).json({ code: 400, message: 'exam_date 格式应为 YYYY-MM-DD' });
        }
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: '没有可更新的字段' });
    }

    values.push(id);
    db.prepare(`UPDATE scores SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare(`
      SELECT s.id, s.student_id, st.name AS student_name,
             st.class_name, s.subject, s.score, s.exam_date
      FROM scores s
      JOIN students st ON s.student_id = st.id
      WHERE s.id = ?
    `).get(id);

    res.json({ code: 200, message: '更新成功', data: updated });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE /api/scores/:id
// 删除成绩
// ─────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM scores WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ code: 404, message: '成绩记录不存在' });
    }

    db.prepare('DELETE FROM scores WHERE id = ?').run(id);

    res.json({ code: 200, message: '删除成功', data: { id: Number(id) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
