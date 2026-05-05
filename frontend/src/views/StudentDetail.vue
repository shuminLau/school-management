<template>
  <div class="page">
    <!-- 返回 -->
    <div class="back-btn" @click="$router.push('/students')">
      <el-icon><ArrowLeft /></el-icon> 返回学生列表
    </div>

    <div v-if="loading" class="loading-wrap">
      <el-skeleton :rows="6" animated />
    </div>

    <template v-else-if="student">
      <!-- 学生信息卡 -->
      <div class="card info-card">
        <div class="avatar" :class="student.gender">
          {{ student.name.charAt(0) }}
        </div>
        <div class="info-body">
          <h2 class="stu-name">{{ student.name }}</h2>
          <div class="info-tags">
            <el-tag :class="student.gender === 'male' ? 'tag-male' : 'tag-female'" effect="plain" size="small">
              {{ student.gender === 'male' ? '男' : '女' }}
            </el-tag>
            <el-tag type="info" effect="plain" size="small">{{ student.class_name }}</el-tag>
            <el-tag type="info" effect="plain" size="small">ID: {{ student.id }}</el-tag>
          </div>
          <div class="info-meta">创建时间：{{ student.created_at?.substring(0, 10) }}</div>
        </div>
        <div class="info-actions">
          <el-button :icon="Edit" type="primary" plain size="small" @click="openEditStudent">编辑信息</el-button>
        </div>
      </div>

      <!-- 成绩统计 -->
      <div class="stat-row" v-if="summary">
        <div class="stat-mini card" v-for="s in miniStats" :key="s.label">
          <div class="mini-num" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="mini-label">{{ s.label }}</div>
        </div>
      </div>

      <!-- 成绩表格 -->
      <div class="card scores-card">
        <div class="scores-header">
          <span class="section-title">成绩记录</span>
          <el-button type="primary" :icon="Plus" size="small" @click="openScoreForm()">添加成绩</el-button>
        </div>

        <el-table :data="scores" stripe empty-text="暂无成绩记录">
          <el-table-column prop="subject"   label="科目"   width="120" />
          <el-table-column prop="score"     label="分数"   width="100" align="center">
            <template #default="{ row }">
              <span class="score-val" :class="scoreLevel(row.score)">{{ row.score }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="exam_date" label="考试日期" min-width="120" />
          <el-table-column label="等级" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="scoreLevelTag(row.score)" size="small">{{ scoreLevelText(row.score) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" align="center">
            <template #default="{ row }">
              <el-button size="small" :icon="Edit"   type="primary" plain @click="openScoreForm(row)">编辑</el-button>
              <el-button size="small" :icon="Delete" type="danger"  plain @click="removeScore(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <el-empty v-else description="学生不存在" />

    <!-- 编辑学生弹窗 -->
    <el-dialog v-model="studentDialog" title="编辑学生信息" width="440px" destroy-on-close>
      <el-form ref="stuFormRef" :model="stuForm" :rules="stuRules" label-width="70px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="stuForm.name" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="stuForm.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="班级" prop="class_name">
          <el-input v-model="stuForm.class_name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="studentDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveStudent">保存</el-button>
      </template>
    </el-dialog>

    <!-- 成绩弹窗 -->
    <el-dialog v-model="scoreDialog" :title="scoreForm.id ? '编辑成绩' : '添加成绩'" width="440px" destroy-on-close>
      <el-form ref="scoreFormRef" :model="scoreForm" :rules="scoreRules" label-width="80px">
        <el-form-item label="科目" prop="subject">
          <el-select v-model="scoreForm.subject" allow-create filterable placeholder="选择或输入科目" style="width:100%">
            <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="分数" prop="score">
          <el-input-number v-model="scoreForm.score" :min="0" :max="150" style="width:100%" />
        </el-form-item>
        <el-form-item label="考试日期" prop="exam_date">
          <el-date-picker
            v-model="scoreForm.exam_date"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scoreDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveScore">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Plus, ArrowLeft } from '@element-plus/icons-vue'
import { studentApi, scoreApi } from '@/api'

const route   = useRoute()
const id      = route.params.id

const student       = ref(null)
const scores        = ref([])
const summary       = ref(null)
const loading       = ref(false)
const saving        = ref(false)
const studentDialog = ref(false)
const scoreDialog   = ref(false)
const stuFormRef    = ref()
const scoreFormRef  = ref()

const subjects = ['语文','数学','英语','物理','化学','生物','历史','地理','政治']

const stuForm = ref({ name: '', gender: 'male', class_name: '' })
const stuRules = {
  name:       [{ required: true, message: '请输入姓名' }],
  gender:     [{ required: true, message: '请选择性别' }],
  class_name: [{ required: true, message: '请输入班级' }]
}

const scoreForm = ref({ id: null, subject: '', score: 0, exam_date: '' })
const scoreRules = {
  subject:   [{ required: true, message: '请选择科目' }],
  score:     [{ required: true, message: '请输入分数' }],
  exam_date: [{ required: true, message: '请选择日期' }]
}

const miniStats = computed(() => {
  if (!summary.value) return []
  const { overall } = summary.value
  return [
    { label: '考试次数', value: overall?.total_exams ?? 0,              color: '#2563eb' },
    { label: '平均分',   value: overall?.overall_avg?.toFixed(1) ?? '—', color: '#7c3aed' },
    { label: '最高分',   value: overall?.overall_max ?? '—',             color: '#16a34a' },
    { label: '最低分',   value: overall?.overall_min ?? '—',             color: '#dc2626' }
  ]
})

const scoreLevel     = v => v >= 100 ? 'excellent' : v >= 80 ? 'good' : v >= 60 ? 'normal' : 'poor'
const scoreLevelTag  = v => v >= 100 ? 'primary' : v >= 80 ? 'success' : v >= 60 ? 'warning' : 'danger'
const scoreLevelText = v => v >= 100 ? '优秀' : v >= 80 ? '良好' : v >= 60 ? '及格' : '不及格'

const load = async () => {
  loading.value = true
  try {
    const [detailRes, sumRes] = await Promise.all([
      studentApi.get(id),
      scoreApi.summary(id)
    ])
    student.value = detailRes.data
    scores.value  = detailRes.data.scores || []
    summary.value = sumRes.data
  } finally {
    loading.value = false
  }
}

const openEditStudent = () => {
  stuForm.value = { name: student.value.name, gender: student.value.gender, class_name: student.value.class_name }
  studentDialog.value = true
}

const saveStudent = async () => {
  await stuFormRef.value.validate()
  saving.value = true
  try {
    await studentApi.update(id, stuForm.value)
    ElMessage.success('更新成功')
    studentDialog.value = false
    load()
  } finally {
    saving.value = false
  }
}

const openScoreForm = (row = null) => {
  if (row) {
    scoreForm.value = { id: row.id, subject: row.subject, score: row.score, exam_date: row.exam_date }
  } else {
    scoreForm.value = { id: null, subject: '', score: 0, exam_date: '' }
  }
  scoreDialog.value = true
}

const saveScore = async () => {
  await scoreFormRef.value.validate()
  saving.value = true
  try {
    const { id: sid, ...data } = scoreForm.value
    if (sid) {
      await scoreApi.update(sid, { ...data, student_id: id })
      ElMessage.success('更新成功')
    } else {
      await scoreApi.create({ ...data, student_id: Number(id) })
      ElMessage.success('添加成功')
    }
    scoreDialog.value = false
    load()
  } finally {
    saving.value = false
  }
}

const removeScore = async (row) => {
  await ElMessageBox.confirm(`确定删除「${row.subject}」成绩 ${row.score} 分？`, '确认删除', {
    type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
  })
  await scoreApi.remove(row.id)
  ElMessage.success('删除成功')
  load()
}

onMounted(load)
</script>

<style scoped>
.page { max-width: 900px; }

.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--text-muted); font-size: 13px; cursor: pointer;
  margin-bottom: 20px;
  transition: color .15s;
}
.back-btn:hover { color: var(--primary); }

.loading-wrap { padding: 24px; }

/* 信息卡 */
.info-card {
  display: flex; align-items: center; gap: 20px;
  padding: 24px; margin-bottom: 16px; flex-wrap: wrap;
}
.avatar {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 700; flex-shrink: 0;
  color: #fff;
}
.avatar.male   { background: linear-gradient(135deg, #2563eb, #60a5fa); }
.avatar.female { background: linear-gradient(135deg, #db2777, #f472b6); }

.info-body { flex: 1; min-width: 0; }
.stu-name  { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
.info-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.info-meta { font-size: 12px; color: var(--text-muted); }
.info-actions { flex-shrink: 0; }

/* 迷你统计 */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.stat-mini {
  padding: 16px; text-align: center;
}
.mini-num   { font-size: 22px; font-weight: 700; }
.mini-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

/* 成绩卡 */
.scores-card   { overflow: hidden; }
.scores-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
}
.section-title { font-size: 14px; font-weight: 600; }

.score-val          { font-weight: 700; font-size: 15px; }
.score-val.excellent { color: #2563eb; }
.score-val.good      { color: #16a34a; }
.score-val.normal    { color: #d97706; }
.score-val.poor      { color: #dc2626; }

@media (max-width: 600px) {
  .stat-row   { grid-template-columns: 1fr 1fr; }
  .info-card  { padding: 16px; }
  .stu-name   { font-size: 17px; }
}
</style>
