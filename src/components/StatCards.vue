<template>
  <div class="stat-row">
    <div v-for="s in cards" :key="s.label" class="stat-item card">
      <div class="stat-icon" :style="{background: s.iconBg, color: s.color}">{{ s.icon }}</div>
      <div class="stat-body">
        <div class="stat-value" :style="{color: s.color}">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMovieStore } from '@/stores/movies'

const store = useMovieStore()
const cards = computed(() => {
  const s = store.stats
  if (!s) return []
  return [
    { icon: '▣', label: '收录影片', value: s.total + ' 部', color: 'var(--accent)', iconBg: 'var(--accent-soft)' },
    { icon: '★', label: '均分', value: s.avgRating.toFixed(2), color: 'var(--gold)', iconBg: '#fffbeb' },
    { icon: '◈', label: '类型覆盖', value: s.genres + ' 种', color: 'var(--green)', iconBg: '#ecfdf5' },
    { icon: '⊕', label: '国家/地区', value: s.countries + ' 个', color: '#8b5cf6', iconBg: '#f5f3ff' },
    { icon: '◐', label: '时间跨度', value: s.yearRange, color: '#06b6d4', iconBg: '#ecfeff' },
    { icon: '▲', label: '最高评分', value: s.topRated?.rating, color: '#ef4444', iconBg: '#fef2f2' },
  ]
})
</script>

<style scoped>
.stat-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.stat-item {
  padding: 14px 16px; display: flex; align-items: center; gap: 12px;
  transition: transform .12s, box-shadow .12s; cursor: default;
}
.stat-item:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.stat-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.stat-body { min-width: 0; }
.stat-value { font-size: 18px; font-weight: 800; line-height: 1.2; }
.stat-label { font-size: 11px; color: var(--text-3); margin-top: 2px; }
</style>
