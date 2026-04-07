<template>
  <div v-if="m" class="detail-panel">
    <button class="close-btn" @click="store.clearSelect()">✕</button>
    <div class="flex gap-4">
      <img :src="m.cover" :alt="m.title" class="cover-img" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="rank-badge">#{{ m.rank }}</span>
          <h2 class="title-text">{{ m.title }}</h2>
        </div>
        <div class="star-row">
          <span class="star-display">{{ starsText }}</span>
          <span class="rating-num">{{ m.rating }}</span>
          <span class="votes-text">{{ votesText }}人评价</span>
        </div>
        <div class="info-grid">
          <div><span class="info-label">导演</span>{{ m.director }}</div>
          <div><span class="info-label">主演</span>{{ m.actors || '-' }}</div>
          <div><span class="info-label">年份</span>{{ m.year }}</div>
          <div><span class="info-label">国家</span>{{ m.country }}</div>
        </div>
        <div class="genre-row">
          <span v-for="g in m.genres" :key="g" class="genre-tag" :style="{background: genreColor(g)}">{{ g }}</span>
        </div>
        <div v-if="m.quote" class="quote-text">"{{ m.quote }}"</div>
        <a :href="m.link" target="_blank" rel="noopener" class="link-btn">豆瓣页面 →</a>
      </div>
    </div>
    <div v-if="sameDir.length" class="related-section">
      <div class="related-title">{{ dirName }} 的其他作品</div>
      <div class="related-list">
        <div v-for="r in sameDir" :key="r.rank" class="related-item" @click="store.select(r)">
          <span class="font-semibold">{{ r.title }}</span>
          <span class="star" style="font-size:12px">{{ r.rating }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMovieStore } from '@/stores/movies'
import { genreColor, stars } from '@/utils/colors'

const store = useMovieStore()
const m = computed(() => store.selectedMovie)
const starsText = computed(() => m.value ? stars(m.value.rating) : '')
const votesText = computed(() => {
  if (!m.value) return ''
  const v = m.value.votes
  return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toString()
})
const dirName = computed(() => m.value?.director?.split(' ')[0] || '')
const sameDir = computed(() => {
  if (!m.value || !dirName.value) return []
  return store.movies.filter(x => x.rank !== m.value.rank && x.director?.split(' ')[0] === dirName.value)
})
</script>

<style scoped>
.detail-panel { padding: 20px; position: relative; animation: slideIn .25s ease; }
@keyframes slideIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
.close-btn {
  position: absolute; top: 12px; right: 14px;
  background: none; border: none; font-size: 16px; cursor: pointer;
  color: var(--text-3); transition: color .15s;
}
.close-btn:hover { color: var(--text); }
.cover-img {
  width: 110px; height: 160px; object-fit: cover;
  border-radius: 10px; flex-shrink: 0; box-shadow: 0 4px 16px rgba(0,0,0,.1);
}
.rank-badge {
  background: var(--accent); color: #fff;
  padding: 2px 9px; border-radius: 99px; font-size: 12px; font-weight: 700;
}
.title-text {
  font-size: 16px; font-weight: 800; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.star-row { display: flex; align-items: baseline; gap: 6px; margin: 4px 0 8px; }
.star-display { color: var(--gold); font-size: 13px; }
.rating-num { font-size: 20px; font-weight: 800; color: var(--gold); }
.votes-text { font-size: 11px; color: var(--text-3); }
.info-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 3px 14px;
  font-size: 12px; color: var(--text-2); margin-bottom: 8px;
}
.info-label { color: var(--text-3); margin-right: 4px; }
.genre-row { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px; }
.genre-tag { padding: 2px 9px; border-radius: 99px; color: #fff; font-size: 11px; font-weight: 600; }
.quote-text {
  font-style: italic; font-size: 12px; color: var(--text-2);
  padding: 8px 10px; background: var(--surface-dim);
  border-radius: 8px; margin-bottom: 8px; line-height: 1.6;
}
.link-btn { display: inline-block; font-size: 12px; font-weight: 600; color: var(--accent); text-decoration: none; }
.link-btn:hover { text-decoration: underline; }
.related-section { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
.related-title { font-size: 12px; font-weight: 700; color: var(--text-2); margin-bottom: 6px; }
.related-list { display: flex; flex-direction: column; gap: 3px; }
.related-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 8px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: background .12s;
}
.related-item:hover { background: var(--accent-soft); }
</style>
