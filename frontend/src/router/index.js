import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/students'
  },
  {
    path: '/students',
    name: 'Students',
    component: () => import('@/views/StudentsView.vue'),
    meta: { title: '学生管理', icon: 'User' }
  },
  {
    path: '/students/:id',
    name: 'StudentDetail',
    component: () => import('@/views/StudentDetail.vue'),
    meta: { title: '学生详情' }
  },
  {
    path: '/scores',
    name: 'Scores',
    component: () => import('@/views/ScoresView.vue'),
    meta: { title: '成绩管理', icon: 'DataLine' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '数据概览', icon: 'PieChart' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  document.title = `${to.meta.title || '学校管理'} — 学校管理系统`
})

export default router
