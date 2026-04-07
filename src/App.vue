<template>
  <div v-if="store.loading" class="loading-screen">
    <div class="loading-inner">
      <div class="loading-title">豆瓣电影 Top 250</div>
      <div class="loading-sub">数据可视化与交互探索</div>
      <div class="loading-bar"><div class="loading-bar-fill" /></div>
    </div>
  </div>

  <div v-else class="app-root">
    <header class="top-bar">
      <div class="top-left">
        <div class="brand">
          <span class="brand-icon">◉</span>
          <span class="brand-text">豆瓣 Top 250 可视化</span>
        </div>
        <nav class="nav-tabs">
          <button v-for="sec in sections" :key="sec.id"
            class="nav-tab" :class="{active: activeSection === sec.id}"
            @click="scrollTo(sec.id)">
            {{ sec.label }}
          </button>
        </nav>
      </div>
      <div class="top-right">
        <div class="search-wrap">
          <span class="search-icon">⌕</span>
          <input v-model="store.searchText" class="search-box" placeholder="搜索电影、导演…" />
        </div>
        <select class="filter-select" :value="store.highlightGenre || ''" @change="store.highlightGenre = $event.target.value || null">
          <option value="">全部类型</option>
          <option v-for="g in topGenres" :key="g.genre" :value="g.genre">{{ g.genre }}</option>
        </select>
        <select class="filter-select" :value="store.highlightCountry || ''" @change="store.highlightCountry = $event.target.value || null">
          <option value="">全部国家</option>
          <option v-for="c in topCountries" :key="c.country" :value="c.country">{{ c.country }}</option>
        </select>
        <select class="filter-select" :value="store.highlightDecade ? String(store.highlightDecade) : ''" @change="store.highlightDecade = $event.target.value ? +$event.target.value : null">
          <option value="">全部年代</option>
          <option v-for="d in store.allDecades" :key="d.decade" :value="String(d.decade)">{{ d.decade }}s</option>
        </select>
        <div v-if="hasFilter" class="active-filters">
          <span v-if="store.highlightGenre" class="ftag" @click="store.highlightGenre = null">{{ store.highlightGenre }} ✕</span>
          <span v-if="store.highlightCountry" class="ftag" @click="store.highlightCountry = null">{{ store.highlightCountry }} ✕</span>
          <span v-if="store.highlightDecade" class="ftag" @click="store.highlightDecade = null">{{ store.highlightDecade }}s ✕</span>
          <button class="ftag-clear" @click="clearAll">清除全部</button>
        </div>
        <div class="result-badge">{{ store.filtered.length }} / {{ store.movies.length }}</div>
      </div>
    </header>

    <main class="main-scroll" ref="mainRef">

      <section id="sec-overview" class="viz-section">
        <div class="sec-header">
          <div class="sec-title-group">
            <h2 class="sec-title">数据概览</h2>
            <p class="sec-desc">豆瓣评分 Top 250 影片核心指标一览</p>
          </div>
        </div>
        <StatCards />
        <ScatterExplore />
        <GenreRing />
      </section>

      <section id="sec-distribution" class="viz-section">
        <div class="sec-header">
          <div class="sec-title-group">
            <h2 class="sec-title">维度分析</h2>
            <p class="sec-desc">按国家、评分区间、年代等维度拆解数据分布特征</p>
          </div>
          <div class="sec-pills">
            <span v-for="g in topGenres" :key="g.genre" class="pill sm"
              :class="{active: store.highlightGenre === g.genre}"
              @click="store.highlightGenre = store.highlightGenre === g.genre ? null : g.genre">
              {{ g.genre }}
            </span>
          </div>
        </div>
        <div class="sec-grid col-5-5">
          <CountryBar />
          <RatingDistribution />
        </div>
        <div class="sec-grid col-5-5">
          <DecadeTimeline />
          <YearRatingTrend />
        </div>
      </section>

      <section id="sec-network" class="viz-section">
        <div class="sec-header">
          <div class="sec-title-group">
            <h2 class="sec-title">关系网络</h2>
            <p class="sec-desc">入选 2 部及以上作品的导演与影片的关联拓扑</p>
          </div>
        </div>
        <DirectorNetwork />
      </section>

      <section id="sec-ranking" class="viz-section">
        <div class="sec-header">
          <div class="sec-title-group">
            <h2 class="sec-title">完整排行</h2>
            <p class="sec-desc">支持多维排序与实时搜索的影片明细列表</p>
          </div>
        </div>
        <RankingTable />
      </section>

    </main>

    <transition name="panel">
      <aside v-if="store.selectedMovie" class="detail-aside">
        <MovieDetail />
      </aside>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useMovieStore } from '@/stores/movies'

import StatCards from '@/components/StatCards.vue'
import ScatterExplore from '@/components/ScatterExplore.vue'
import GenreRing from '@/components/GenreRing.vue'
import CountryBar from '@/components/CountryBar.vue'
import RatingDistribution from '@/components/RatingDistribution.vue'
import DecadeTimeline from '@/components/DecadeTimeline.vue'
import YearRatingTrend from '@/components/YearRatingTrend.vue'
import DirectorNetwork from '@/components/DirectorNetwork.vue'
import RankingTable from '@/components/RankingTable.vue'
import MovieDetail from '@/components/MovieDetail.vue'

const store = useMovieStore()
const mainRef = ref(null)
const activeSection = ref('sec-overview')

const sections = [
  { id: 'sec-overview', label: '数据概览' },
  { id: 'sec-distribution', label: '维度分析' },
  { id: 'sec-network', label: '关系网络' },
  { id: 'sec-ranking', label: '完整排行' },
]

const topGenres = computed(() => store.allGenres.slice(0, 12))
const topCountries = computed(() => store.allCountries.slice(0, 10))
const hasFilter = computed(() => store.highlightGenre || store.highlightCountry || store.highlightDecade)

function clearAll() {
  store.highlightGenre = null
  store.highlightCountry = null
  store.highlightDecade = null
  store.searchText = ''
}

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeSection.value = id
}

let observer = null
onMounted(() => {
  store.loadAll()
  observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio > 0.3) {
        activeSection.value = e.target.id
      }
    })
  }, { root: mainRef.value, threshold: [0.3] })

  setTimeout(() => {
    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
  }, 200)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.loading-screen {
  height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--bg);
}
.loading-inner { text-align: center; }
.loading-title { font-size: 24px; font-weight: 800; color: var(--text); margin-bottom: 6px; }
.loading-sub { font-size: 13px; color: var(--text-3); margin-bottom: 20px; }
.loading-bar { width: 200px; height: 3px; background: var(--border); border-radius: 2px; margin: 0 auto; overflow: hidden; }
.loading-bar-fill { width: 40%; height: 100%; background: var(--accent); border-radius: 2px; animation: loadPulse 1.2s ease infinite; }
@keyframes loadPulse { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }

.app-root { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

.top-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; height: 48px; flex-shrink: 0;
  background: var(--surface); border-bottom: 1px solid var(--border);
}
.top-left { display: flex; align-items: center; gap: 20px; }
.top-right { display: flex; align-items: center; gap: 10px; }

.brand { display: flex; align-items: center; gap: 8px; }
.brand-icon { font-size: 18px; color: var(--accent); }
.brand-text { font-size: 15px; font-weight: 800; color: var(--text); white-space: nowrap; }

.nav-tabs { display: flex; gap: 2px; }
.nav-tab {
  padding: 6px 14px; border-radius: 8px; border: none; background: transparent;
  font-size: 13px; font-weight: 600; color: var(--text-3);
  cursor: pointer; transition: all .15s; white-space: nowrap;
}
.nav-tab:hover { color: var(--text); background: var(--surface-dim); }
.nav-tab.active { color: var(--accent); background: var(--accent-soft); }

.search-wrap {
  position: relative; display: flex; align-items: center;
}
.search-icon {
  position: absolute; left: 8px; font-size: 14px; color: var(--text-3); pointer-events: none;
}
.search-box {
  padding: 5px 10px 5px 26px; border-radius: 8px; font-size: 12px;
  border: 1.5px solid var(--border); background: var(--surface-dim);
  color: var(--text); outline: none; width: 170px; transition: all .15s;
}
.search-box:focus { border-color: var(--accent); background: #fff; width: 210px; }
.search-box::placeholder { color: var(--text-3); }

.active-filters { display: flex; gap: 4px; align-items: center; }
.ftag {
  display: inline-flex; align-items: center; gap: 2px;
  padding: 2px 9px; border-radius: 99px;
  font-size: 11px; font-weight: 600;
  background: var(--accent-soft); color: var(--accent);
  cursor: pointer; transition: all .15s;
}
.ftag:hover { background: var(--accent); color: #fff; }
.ftag-clear {
  border: none; background: none; color: var(--text-3);
  font-size: 11px; cursor: pointer; text-decoration: underline;
  padding: 0 4px;
}
.ftag-clear:hover { color: var(--red); }
.filter-select {
  padding: 4px 8px; border-radius: 7px; border: 1.5px solid var(--border);
  font-size: 12px; color: var(--text); background: var(--surface-dim);
  outline: none; cursor: pointer; transition: border-color .15s;
}
.filter-select:focus { border-color: var(--accent); }

.result-badge {
  font-size: 11px; color: var(--text-3); white-space: nowrap;
  background: var(--surface-dim); padding: 2px 8px; border-radius: 6px;
}

.main-scroll {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  scroll-behavior: smooth;
}

.viz-section {
  padding: 28px 28px 12px;
  border-bottom: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 14px;
}
.viz-section:last-child { border-bottom: none; padding-bottom: 40px; }

.sec-header {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; margin-bottom: 2px;
}
.sec-title-group { display: flex; flex-direction: column; gap: 2px; }
.sec-title { font-size: 18px; font-weight: 800; color: var(--text); }
.sec-desc { font-size: 12px; color: var(--text-3); font-weight: 400; }
.sec-pills { display: flex; gap: 4px; flex-wrap: wrap; }
.pill.sm { padding: 3px 10px; font-size: 11px; }

.sec-grid { display: grid; gap: 14px; }
.col-6-4 { grid-template-columns: 1.6fr 0.4fr; }
.col-5-5 { grid-template-columns: 1fr 1fr; }

.detail-aside {
  position: fixed; top: 0; right: 0; bottom: 0; width: 380px;
  background: var(--surface); border-left: 1px solid var(--border);
  box-shadow: -6px 0 24px rgba(0,0,0,.06);
  overflow-y: auto; z-index: 200;
}
.panel-enter-active { transition: transform .25s ease; }
.panel-leave-active { transition: transform .2s ease; }
.panel-enter-from, .panel-leave-to { transform: translateX(100%); }
</style>
