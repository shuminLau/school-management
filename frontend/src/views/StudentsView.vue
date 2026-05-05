<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">学生管理</h1>
        <p class="page-sub">共 {{ total }} 名学生</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openForm()">新增学生</el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="card toolbar">
      <el-input
        v-model="filterName"
        placeholder="搜索姓名..."
        :prefix-icon="Search"
        clearable
        style="width: 200px"
        @input="onFilter"
      />
      <el-select v-model="filterClass" placeholder="筛选班级" clearable style="width: 160px" @change="onFilter">
        <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="filterGender" placeholder="性别" clearable style="width: 120px" @change="onFilter">
        <el-option label="男" value="male" />
        <el-option label="女" value="female" />
      </el-select>
    </div>

    <!-- 表格 -->
    <div class="card table-wrap">
      <el-table :data="filtered" v-loading="loading" row-key="id" stripe>
        <el-table-column prop="id"         label="ID"   width="64" align="center" />
        <el-table-column prop="name"       label="姓名" min-width="100">
          <template #default="{ row }">
            <router-link :to="`/students/${row.id}`" class="name-link">{{ row.name }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="gender"     label="性别" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :class="row.gender === 'male' ? 'tag-male' : 'tag-female'" effect="plain">
              {{ row.gender === 'male' ? '男' : '女' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="class_name" label="班级"   min-width="120" />
        <el-table-column prop="created_at" label="创建时间" min-width="150" :formatter="fmtDate" />
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :icon="View"   @click="$router.push(`/students/${row.id}`)">详情</el-button>
            <el-button size="small" :icon="Edit"   type="primary" plain @click="openForm(row)">编辑</el-button>
            <el-button size="small" :icon="Delete" type="danger"  plain @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑学生' : '新增学生'"
      width="460px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="70px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="班级" prop="class_name">
          <el-input v-model="form.class_name" placeholder="如：高一(1)班" />
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
import { Plus, Search, Edit, Delete, View } from '@element-plus/icons-vue'
import { studentApi } from '@/api'

const students      = ref([])
const loading       = ref(false)
const saving        = ref(false)
const dialogVisible = ref(false)
const formRef       = ref()
const filterName    = ref('')
const filterClass   = ref('')
const filterGender  = ref('')

const form = ref({ id: null, name: '', gender: 'male', class_name: '' })

const rules = {
  name:       [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender:     [{ required: true, message: '请选择性别', trigger: 'change' }],
  class_name: [{ required: true, message: '请输入班级', trigger: 'blur' }]
}

const classList = computed(() => [...new Set(students.value.map(s => s.class_name))].sort())

const filtered = computed(() => {
  return students.value.filter(s => {
    const nameOk   = !filterName.value   || s.name.includes(filterName.value)
    const classOk  = !filterClass.value  || s.class_name === filterClass.value
    const genderOk = !filterGender.value || s.gender === filterGender.value
    return nameOk && classOk && genderOk
  })
})

const total = computed(() => filtered.value.length)

const fmtDate = (row, col, val) => val ? val.substring(0, 10) : '—'

const load = async () => {
  loading.value = true
  const res = await studentApi.list().finally(() => loading.value = false)
  students.value = res.data || []
}

const openForm = (row = null) => {
  if (row) {
    form.value = { id: row.id, name: row.name, gender: row.gender, class_name: row.class_name }
  } else {
    form.value = { id: null, name: '', gender: 'male', class_name: '' }
  }
  dialogVisible.value = true
}

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    const { id, ...data } = form.value
    if (id) {
      await studentApi.update(id, data)
      ElMessage.success('更新成功')
    } else {
      await studentApi.create(data)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确定删除学生「${row.name}」？关联成绩也将一并删除。`, '确认删除', {
    type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消',
    confirmButtonClass: 'el-button--danger'
  })
  await studentApi.remove(row.id)
  ElMessage.success('删除成功')
  load()
}

const onFilter = () => {}  // computed 自动响应

onMounted(load)
</script>

<style scoped>
.page { max-width: 1100px; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px;
}
.page-title { font-size: 22px; font-weight: 700; }
.page-sub   { color: var(--text-muted); font-size: 13px; margin-top: 4px; }

.toolbar {
  display: flex; gap: 12px; flex-wrap: wrap;
  padding: 16px; margin-bottom: 16px; align-items: center;
}
.table-wrap { overflow: hidden; }

.name-link {
  color: var(--primary); text-decoration: none; font-weight: 500;
}
.name-link:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .page-header { flex-direction: column; gap: 12px; }
  .toolbar { gap: 10px; }
}
</style>
