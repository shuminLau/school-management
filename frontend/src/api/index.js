import axios from 'axios'
import { ElMessage } from 'element-plus'

const http = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 响应拦截器
http.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || '请求失败，请检查后端服务是否启动'
    ElMessage.error(msg)
    return Promise.reject(err)
  }
)

// ── 学生接口 ────────────────────────────────
export const studentApi = {
  list:   (params) => http.get('/students', { params }),
  get:    (id)     => http.get(`/students/${id}`),
  create: (data)   => http.post('/students', data),
  update: (id, data) => http.put(`/students/${id}`, data),
  patch:  (id, data) => http.patch(`/students/${id}`, data),
  remove: (id)     => http.delete(`/students/${id}`)
}

// ── 成绩接口 ────────────────────────────────
export const scoreApi = {
  list:    (params) => http.get('/scores', { params }),
  get:     (id)     => http.get(`/scores/${id}`),
  summary: (studentId) => http.get(`/scores/student/${studentId}/summary`),
  create:  (data)   => http.post('/scores', data),
  update:  (id, data) => http.put(`/scores/${id}`, data),
  patch:   (id, data) => http.patch(`/scores/${id}`, data),
  remove:  (id)     => http.delete(`/scores/${id}`)
}
