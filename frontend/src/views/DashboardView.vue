<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">数据概览</h1>
      <p class="page-sub">实时统计学生与成绩数据</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card" v-for="s in stats" :key="s.label" :style="{ '--accent': s.color }">
        <div class="stat-icon"><el-icon :size="24"><component :is="s.icon" /></el-icon></div>
        <div class="stat-body">
          <div class="stat-num">{{ s.value ?? '—' }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <!-- 班级分布 + 最近成绩 -->
    <div class="dash-grid">
      <div class="card dash-card">
        <div class="card-title">班级学生分布</div>
        <div v-if="classStats.length === 0" class="empty-tip">暂无数据</div>
        <div v-for="c in classStats" :key="c.class_name" class="class-row">
          <span class="class-name">{{ c.class_name }}</span>
          <div class="bar-wrap">
            <div class="bar" :style="{ width: (c.count / maxClassCount * 100) + '%' }"></div>
          </div>
          <span class="class-count">{{ c.count }} 人</span>
        </div>
      </div>

      <div class="card dash-card">
        <div class="card-title">最近成绩记录</div>
        <div v-if="recentScores.length === 0" class="empty-tip">暂无数据</div>
        <div v-for="s in recentScores" :key="s.id" class="score-row">
          <div>
            <div class="score-name">{{ s.student_name }}</div>
            <div class="score-meta">{{ s.class_name }} · {{ s.subject }} · {{ s.exam_date }}</div>
          </div>
          <div class="score-badge" :class="scoreLevel(s.score)">{{ s.score }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { studentApi, scoreApi } from '@/api'

const students     = ref([])
const scores       = ref([])
const recentScores = ref([])

const stats = computed(() => [
  { label: '学生总数', value: students.value.length, icon: 'User',     color: '#2563eb' },
  { label: '班级数量', value: classStats.value.length, icon: 'School', color: '#7c3aed' },
  { label: '成绩记录', value: scores.value.length,   icon: 'DataLine', color: '#059669' },
  { label: '平均分',   value: avgScore.value,         icon: 'TrendCharts', color: '#d97706' }
])

const avgScore = computed(() => {
  if (!scores.value.length) return '—'
  const avg = scores.value.reduce((s, r) => s + r.score, 0) / scores.value.length
  return avg.toFixed(1)
})

const classStats = computed(() => {
  const map = {}
  students.value.forEach(s => {
    map[s.class_name] = (map[s.class_name] || 0) + 1
  })
  return Object.entries(map)
    .map(([class_name, count]) => ({ class_name, count }))
    .sort((a, b) => b.count - a.count)
})

const maxClassCount = computed(() => Math.max(...classStats.value.map(c => c.count), 1))

const scoreLevel = (v) => v >= 100 ? 'excellent' : v >= 80 ? 'good' : v >= 60 ? 'normal' : 'poor'

onMounted(async () => {
  const [sRes, scRes] = await Promise.all([
    studentApi.list(),
    scoreApi.list()
  ])
  students.value     = sRes.data || []
  scores.value       = scRes.data || []
  recentScores.value = [...(scRes.data || [])].slice(0, 6)
})
</script>

<style scoped>
.dashboard { max-width: 1100px; }

.page-header { margin-bottom: 28px; }
.page-title  { font-size: 22px; font-weight: 700; color: var(--text); }
.page-sub    { color: var(--text-muted); margin-top: 4px; font-size: 13px; }

/* 统计卡片 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
  box-shadow: var(--shadow);
}
.stat-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 12%, white);
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.stat-num   { font-size: 24px; font-weight: 700; color: var(--text); }
.stat-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

/* 下方两列 */
.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.dash-card  { padding: 20px; }
.card-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 16px; }
.empty-tip  { color: var(--text-muted); font-size: 13px; text-align: center; padding: 24px 0; }

/* 班级条形图 */
.class-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.class-name { width: 90px; font-size: 13px; color: var(--text); flex-shrink: 0; }
.bar-wrap   { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.bar        { height: 100%; background: var(--primary); border-radius: 4px; transition: width .6s ease; }
.class-count { width: 40px; text-align: right; font-size: 12px; color: var(--text-muted); }

/* 成绩行 */
.score-row    { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }
.score-row:last-child { border-bottom: none; }
.score-name   { font-size: 13px; font-weight: 500; }
.score-meta   { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.score-badge  { font-size: 15px; font-weight: 700; min-width: 44px; text-align: right; }
.score-badge.excellent { color: #2563eb; }
.score-badge.good      { color: #16a34a; }
.score-badge.normal    { color: #d97706; }
.score-badge.poor      { color: #dc2626; }

@media (max-width: 900px) {
  .stat-grid { grid-template-columns: 1fr 1fr; }
  .dash-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .stat-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .stat-card { padding: 14px; }
  .stat-num  { font-size: 20px; }
}
</style>
