<template>
  <div class="card" style="max-height:620px;display:flex;flex-direction:column">
    <div class="card-head">
      <h3>影片明细表</h3>
      <div class="flex gap-2 items-center">
        <input v-model="localSearch" class="search-input" style="width:180px" placeholder="在表中搜索…" />
        <select v-model="sortKey" class="ctrl">
          <option value="rank">排序：排名</option>
          <option value="rating">排序：评分</option>
          <option value="votes">排序：热度</option>
          <option value="year">排序：年份</option>
        </select>
      </div>
    </div>
    <div style="flex:1;overflow:auto">
      <table class="tbl">
        <thead>
          <tr>
            <th style="width:42px">#</th>
            <th>电影</th>
            <th style="width:70px">评分</th>
            <th style="width:80px">评价人数</th>
            <th style="width:180px">类型</th>
            <th style="width:80px">年份</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in sorted" :key="m.rank"
            :class="{'row-active': store.selectedMovie?.rank === m.rank}"
            @click="store.select(m)">
            <td class="rank-col">{{ m.rank }}</td>
            <td>
              <div class="movie-title">{{ m.title }}</div>
              <div class="movie-sub">{{ m.director }} · {{ m.country }}</div>
            </td>
            <td class="rating-col">{{ m.rating }}</td>
            <td class="votes-col">{{ formatVotes(m.votes) }}</td>
            <td>
              <div class="genre-tags">
                <span v-for="g in m.genres.slice(0,3)" :key="g" class="gtag"
                  :style="{background: genreColor(g)}"
                  @click.stop="store.highlightGenre = store.highlightGenre === g ? null : g">{{ g }}</span>
              </div>
            </td>
            <td class="year-col">{{ m.year || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMovieStore } from '@/stores/movies'
import { genreColor } from '@/utils/colors'

const store = useMovieStore()
const sortKey = ref('rank')
const localSearch = ref('')

function formatVotes(v) {
  if (v >= 10000) return (v / 10000).toFixed(1) + ' 万'
  return v.toLocaleString()
}

const sorted = computed(() => {
  let list = [...store.filtered]
  if (localSearch.value) {
    const q = localSearch.value.toLowerCase()
    list = list.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.director.toLowerCase().includes(q) ||
      m.country.toLowerCase().includes(q) ||
      m.genres.some(g => g.includes(q))
    )
  }
  if (sortKey.value === 'rating') return list.sort((a, b) => b.rating - a.rating)
  if (sortKey.value === 'votes') return list.sort((a, b) => b.votes - a.votes)
  if (sortKey.value === 'year') return list.sort((a, b) => (b.year || 0) - (a.year || 0))
  return list.sort((a, b) => a.rank - b.rank)
})
</script>

<style scoped>
.tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.tbl thead { position: sticky; top: 0; background: var(--surface-dim); z-index: 1; }
.tbl th {
  text-align: left; padding: 8px 12px; font-size: 12px; font-weight: 600;
  color: var(--text-3); border-bottom: 1px solid var(--border);
}
.tbl td { padding: 8px 12px; border-bottom: 1px solid #f5f5f7; }
.tbl tbody tr { cursor: pointer; transition: background .12s; }
.tbl tbody tr:hover { background: #f8f7ff; }
.row-active { background: var(--accent-soft) !important; }
.rank-col { font-weight: 700; color: var(--text-3); text-align: center; }
.movie-title { font-weight: 600; color: var(--text); line-height: 1.3; }
.movie-sub { font-size: 11px; color: var(--text-3); margin-top: 1px; }
.rating-col { font-weight: 700; color: var(--gold); font-size: 14px; }
.votes-col { color: var(--text-2); font-size: 12px; }
.year-col { color: var(--text-2); font-size: 12px; }
.genre-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.gtag {
  padding: 2px 10px; border-radius: 99px;
  color: #fff; font-size: 11px; font-weight: 600; white-space: nowrap;
  cursor: pointer; transition: opacity .15s;
}
.gtag:hover { opacity: 0.75; }
</style>
