// server.js - 应用入口
const express     = require('express');
const path        = require('path');
const initDatabase = require('./database/init');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── 中间件 ──────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志（开发调试用）
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ── 初始化数据库 ─────────────────────────
initDatabase();

// ── 路由注册 ─────────────────────────────
const studentsRouter = require('./routes/students');
const scoresRouter   = require('./routes/scores');

app.use('/api/students', studentsRouter);
app.use('/api/scores',   scoresRouter);

// ── 根路由：API 文档概览 ──────────────────
app.get('/', (_req, res) => {
  res.json({
    name:    '学校管理系统 API',
    version: '1.0.0',
    endpoints: {
      students: {
        'GET    /api/students':          '获取所有学生（?class_name= 筛选班级）',
        'GET    /api/students/:id':      '获取学生详情（含成绩）',
        'POST   /api/students':          '新增学生',
        'PUT    /api/students/:id':      '更新学生（全量）',
        'PATCH  /api/students/:id':      '更新学生（局部）',
        'DELETE /api/students/:id':      '删除学生'
      },
      scores: {
        'GET    /api/scores':                           '获取所有成绩（?student_id= &subject= &exam_date= 筛选）',
        'GET    /api/scores/:id':                       '获取单条成绩',
        'GET    /api/scores/student/:student_id/summary':'获取学生成绩统计',
        'POST   /api/scores':                           '新增成绩',
        'PUT    /api/scores/:id':                       '更新成绩（全量）',
        'PATCH  /api/scores/:id':                       '更新成绩（局部）',
        'DELETE /api/scores/:id':                       '删除成绩'
      }
    }
  });
});

// ── 托管前端静态文件（生产环境）────────────
const distPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(distPath));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── 404 处理（仅 API）────────────────────
app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// ── 全局错误处理 ─────────────────────────
app.use((err, _req, res, _next) => {
  console.error('未捕获错误：', err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

// ── 启动服务 ─────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 学校管理系统已启动`);
  console.log(`📡 服务地址：http://localhost:${PORT}`);
  console.log(`📖 API 文档：http://localhost:${PORT}/\n`);
});
