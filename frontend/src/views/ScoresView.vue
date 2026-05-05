<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">成绩管理</h1>
        <p class="page-sub">共 {{ filtered.length }} 条记录</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openForm()">添加成绩</el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="card toolbar">
      <el-select v-model="filterStudent" placeholder="筛选学生" clearable style="width:160px" @change="load">
        <el-option
          v-for="s in students"
          :key="s.id"
          :label="`${s.name}（${s.class_name}）`"
          :value="s.id"
        />
      </el-select>
      <el-select v-model="filterSubject" placeholder="筛选科目" clearable style="width:130px" @change="load">
        <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
      </el-select>
      <el-date-picker
        v-model="filterDate"
        type="date"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        placeholder="考试日期"
        clearable
        style="width:160px"
        @change="load"
      />
    </div>

    <!-- 成绩表格 -->
    <div class="card table-wrap">
      <el-table :data="filtered" v-loading="loading" stripe>
        <el-table-column prop="id"           label="ID"     width="64"  align="center" />
        <el-table-column prop="student_name" label="学生"   min-width="100">
          <template #default="{ row }">
            <router-link :to="`/students/${row.student_id}`" class="name-link">
              {{ row.student_name }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="class_name"   label="班级"   min-width="110" />
        <el-table-column prop="subject"      label="科目"   width="100" />
        <el-table-column prop="score"        label="分数"   width="90"  align="center">
          <template #default="{ row }">
            <span class="score-val" :class="scoreLevel(row.score)">{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column label="等级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="scoreLevelTag(row.score)" size="small">{{ scoreLevelText(row.score) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="exam_date" label="考试日期" min-width="120" />
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :icon="Edit"   type="primary" plain @click="openForm(row)">编辑</el-button>
            <el-button size="small" :icon="Delete" type="danger"  plain @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑成绩' : '添加成绩'"
      width="460px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="学生" prop="student_id">
          <el-select v-model="form.student_id" filterable placeholder="选择学生" style="width:100%">
            <el-option
              v-for="s in students"
              :key="s.id"
              :label="`${s.name}（${s.class_name}）`"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="科目" prop="subject">
          <el-select v-model="form.subject" allow-create filterable placeholder="选择或输入科目" style="width:100%">
            <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="分数" prop="score">
          <el-input-number v-model="form.score" :min="0" :max="150" style="width:100%" />
        </el-form-item>
        <el-form-item label="考试日期" prop="exam_date">
          <el-date-picker
            v-model="form.exam_date"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { studentApi, scoreApi } from '@/api'

const scores        = ref([])
const students      = ref([])
const loading       = ref(false)
const saving        = ref(false)
const dialogVisible = ref(false)
const formRef       = ref()
const filterStudent = ref('')
const filterSubject = ref('')
const filterDate    = ref('')

const subjects = ['语文','数学','英语','物理','化学','生物','历史','地理','政治']

const form = ref({ id: null, student_id: '', subject: '', score: 0, exam_date: '' })

const rules = {
  student_id: [{ required: true, message: '请选择学生' }],
  subject:    [{ required: true, message: '请选择科目' }],
  score:      [{ required: true, message: '请输入分数' }],
  exam_date:  [{ required: true, message: '请选择日期' }]
}

const filtered = computed(() => scores.value)

const scoreLevel     = v => v >= 100 ? 'excellent' : v >= 80 ? 'good' : v >= 60 ? 'normal' : 'poor'
const scoreLevelTag  = v => v >= 100 ? 'primary' : v >= 80 ? 'success' : v >= 60 ? 'warning' : 'danger'
const scoreLevelText = v => v >= 100 ? '优秀' : v >= 80 ? '良好' : v >= 60 ? '及格' : '不及格'

const load = async () => {
  loading.value = true
  const params = {}
  if (filterStudent.value) params.student_id = filterStudent.value
  if (filterSubject.value) params.subject     = filterSubject.value
  if (filterDate.value)    params.exam_date   = filterDate.value
  const res = await scoreApi.list(params).finally(() => loading.value = false)
  scores.value = res.data || []
}

const loadStudents = async () => {
  const res = await studentApi.list()
  students.value = res.data || []
}

const openForm = (row = null) => {
  if (row) {
    form.value = { id: row.id, student_id: row.student_id, subject: row.subject, score: row.score, exam_date: row.exam_date }
  } else {
    form.value = { id: null, student_id: '', subject: '', score: 0, exam_date: '' }
  }
  dialogVisible.value = true
}

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    const { id, ...data } = form.value
    if (id) {
      await scoreApi.update(id, data)
      ElMessage.success('更新成功')
    } else {
      await scoreApi.create(data)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

const remove = async (row) => {
  await ElMessageBox.confirm(
    `确定删除「${row.student_name}」的${row.subject}成绩（${row.score}分）？`,
    '确认删除',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  )
  await scoreApi.remove(row.id)
  ElMessage.success('删除成功')
  load()
}

onMounted(() => {
  load()
  loadStudents()
})
</script>

<style scoped>
.page { max-width: 1100px; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px;
}
.page-title { font-size: 22px; font-weight: 700; }
.page-sub   { color: var(--text-muted); font-size: 13px; margin-top: 4px; }

.toolbar    { display: flex; gap: 12px; flex-wrap: wrap; padding: 16px; margin-bottom: 16px; }
.table-wrap { overflow: hidden; }

.name-link { color: var(--primary); text-decoration: none; font-weight: 500; }
.name-link:hover { text-decoration: underline; }

.score-val           { font-weight: 700; font-size: 15px; }
.score-val.excellent { color: #2563eb; }
.score-val.good      { color: #16a34a; }
.score-val.normal    { color: #d97706; }
.score-val.poor      { color: #dc2626; }

@media (max-width: 600px) {
  .page-header { flex-direction: column; gap: 12px; }
}
</style>
