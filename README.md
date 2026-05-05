# 学校管理系统后端

Node.js + Express + SQLite 实现的学生与成绩管理系统。

## 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 启动服务（普通）
npm start

# 3. 开发模式（热重载）
npm run dev
```

服务默认运行在 http://localhost:3000

---

## 项目结构

```
school-management/
├── server.js                            # 入口，注册路由和中间件
├── db.js                                # SQLite 数据库连接
├── database/
│   └── init.js                          # 建表 + 插入示例数据
├── routes/
│   ├── students.js                      # 学生 CRUD
│   └── scores.js                        # 成绩 CRUD
├── school-management.postman_collection.json  # Postman 测试集合
└── package.json
```

---

## API 接口一览

### 学生管理

| 方法   | 路径                  | 说明               |
|--------|-----------------------|--------------------|
| GET    | /api/students         | 获取所有学生       |
| GET    | /api/students/:id     | 获取学生详情+成绩  |
| POST   | /api/students         | 新增学生           |
| PUT    | /api/students/:id     | 全量更新学生       |
| PATCH  | /api/students/:id     | 局部更新学生       |
| DELETE | /api/students/:id     | 删除学生           |

**查询参数：** `GET /api/students?class_name=高一(1)班`

**请求体示例（POST/PUT）：**
```json
{
  "name": "张三",
  "gender": "male",
  "class_name": "高一(1)班"
}
```

---

### 成绩管理

| 方法   | 路径                                    | 说明             |
|--------|-----------------------------------------|------------------|
| GET    | /api/scores                             | 获取所有成绩     |
| GET    | /api/scores/:id                         | 获取单条成绩     |
| GET    | /api/scores/student/:student_id/summary | 学生成绩统计     |
| POST   | /api/scores                             | 新增成绩         |
| PUT    | /api/scores/:id                         | 全量更新成绩     |
| PATCH  | /api/scores/:id                         | 局部更新成绩     |
| DELETE | /api/scores/:id                         | 删除成绩         |

**查询参数：** `GET /api/scores?student_id=1&subject=数学&exam_date=2024-03-01`

**请求体示例（POST/PUT）：**
```json
{
  "student_id": 1,
  "subject": "数学",
  "score": 95,
  "exam_date": "2024-03-01"
}
```

---

## Postman 测试

1. 打开 Postman → Import
2. 选择 `school-management.postman_collection.json`
3. 确保服务已启动（`npm start`）
4. 直接运行集合中任意请求

---

## 数据库说明

数据库文件自动生成于 `database/school.db`，首次启动时自动建表并插入3名示例学生和5条成绩记录。

**字段约束：**
- `gender`：只允许 `male` / `female`
- `score`：范围 0~150
- `exam_date`：格式 `YYYY-MM-DD`
- 删除学生时，关联成绩自动级联删除（`ON DELETE CASCADE`）
