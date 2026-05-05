<template>
  <div class="app-shell" :class="{ 'sidebar-open': drawerOpen }">

    <!-- ── PC 侧边栏 ── -->
    <aside class="sidebar">
      <div class="logo">
        <el-icon size="22"><School /></el-icon>
        <span>学校管理系统</span>
      </div>
      <nav class="nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="active"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <span>Node.js + SQLite</span>
      </div>
    </aside>

    <!-- ── 移动端顶栏 ── -->
    <header class="mobile-header">
      <button class="menu-btn" @click="drawerOpen = true">
        <el-icon size="20"><Menu /></el-icon>
      </button>
      <span class="mobile-title">{{ currentTitle }}</span>
    </header>

    <!-- ── 移动端抽屉 ── -->
    <el-drawer v-model="drawerOpen" direction="ltr" size="240px" :show-close="false">
      <template #header>
        <div class="logo" style="padding:0">
          <el-icon size="20"><School /></el-icon>
          <span>学校管理系统</span>
        </div>
      </template>
      <nav class="nav drawer-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="active"
          @click="drawerOpen = false"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </el-drawer>

    <!-- ── 主内容区 ── -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const drawerOpen = ref(false)

const navItems = [
  { path: '/dashboard', label: '数据概览', icon: 'PieChart' },
  { path: '/students',  label: '学生管理', icon: 'User' },
  { path: '/scores',    label: '成绩管理', icon: 'DataLine' }
]

const currentTitle = computed(() => route.meta.title || '学校管理系统')
</script>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ── 侧边栏 ── */
.sidebar {
  width: var(--sidebar-w);
  background: #0f172a;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 20px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,.07);
}

.nav { padding: 12px 10px; flex: 1; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 2px;
  transition: all .15s;
}
.nav-item:hover  { background: rgba(255,255,255,.06); color: #e2e8f0; }
.nav-item.active { background: var(--primary); color: #fff; }

.sidebar-footer {
  padding: 16px 20px;
  color: #475569;
  font-size: 12px;
  border-top: 1px solid rgba(255,255,255,.06);
}

/* ── 移动端顶栏 ── */
.mobile-header {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 56px;
  background: #0f172a;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  z-index: 100;
}
.menu-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}
.mobile-title { color: #fff; font-size: 15px; font-weight: 600; }

/* ── 主内容 ── */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
}

/* ── 抽屉内导航 ── */
.drawer-nav .nav-item { color: #475569; }
.drawer-nav .nav-item.active { background: var(--primary); color: #fff; }

/* ── 响应式 ── */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .mobile-header { display: flex; }
  .main-content { padding: 72px 14px 20px; }
}
</style>
