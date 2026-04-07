<template>
  <div class="card">
    <div class="card-head">
      <h3>类型占比环形图</h3>
      <span class="hint-text">点击扇区筛选</span>
    </div>
    <div class="ring-layout">
      <div ref="wrap" class="ring-svg" />
      <div class="legend-list">
        <div v-for="item in legendData" :key="item.genre"
          class="legend-row"
          :class="{ dimmed: store.highlightGenre && store.highlightGenre !== item.genre, active: store.highlightGenre === item.genre }"
          @click="store.highlightGenre = store.highlightGenre === item.genre ? null : item.genre">
          <span class="legend-dot" :style="{ background: item.color }" />
          <span class="legend-name">{{ item.genre }}</span>
          <div class="legend-bar-wrap">
            <div class="legend-bar" :style="{ width: item.pct + '%', background: item.color }" />
          </div>
          <span class="legend-count">{{ item.count }}</span>
          <span class="legend-pct">{{ item.pctStr }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import { useMovieStore } from '@/stores/movies'
import { genreColor } from '@/utils/colors'
import { tip, tipHide } from '@/utils/bindTip'

const store = useMovieStore()
const wrap = ref(null)
let ro = null, lastW = 0

const legendData = computed(() => {
  const total = store.movies.length || 1
  const max = store.allGenres[0]?.count || 1
  return store.allGenres.slice(0, 14).map(g => ({
    genre: g.genre,
    count: g.count,
    color: genreColor(g.genre),
    pct: Math.round(g.count / max * 100),
    pctStr: (g.count / total * 100).toFixed(1),
  }))
})

function draw() {
  const el = wrap.value
  if (!el || !store.allGenres.length) return
  const W = el.clientWidth, H = el.clientHeight
  const R = Math.min(W, H) / 2 - 16
  if (R < 20) return
  const innerR = R * 0.44

  d3.select(el).selectAll('*').remove()
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
  const g = svg.append('g').attr('transform', `translate(${W / 2},${H / 2})`)

  const data = store.allGenres.slice(0, 14)
  const pie = d3.pie().value(d => d.count).padAngle(0.025).sort(null)
  const arc = d3.arc().innerRadius(innerR).outerRadius(R).cornerRadius(4)
  const arcHover = d3.arc().innerRadius(innerR - 3).outerRadius(R + 8).cornerRadius(4)

  const arcs = g.selectAll('.arc').data(pie(data)).join('g').attr('class', 'arc')

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => genreColor(d.data.genre))
    .attr('opacity', d => (!store.highlightGenre || d.data.genre === store.highlightGenre) ? 0.88 : 0.15)
    .attr('stroke', '#fff').attr('stroke-width', 2)
    .style('cursor', 'pointer').style('transition', 'opacity .2s')
    .on('mouseover', function(event, d) {
      arcs.selectAll('path').transition().duration(120).attr('opacity', 0.15)
      d3.select(this).transition().duration(150).attr('d', arcHover).attr('opacity', 1)
      const pct = (d.data.count / store.movies.length * 100).toFixed(1)
      const avgR = d3.mean(store.movies.filter(m => m.genres.includes(d.data.genre)), m => m.rating)
      tip(`<div style="font-weight:700;color:${genreColor(d.data.genre)}">${d.data.genre}</div><div><b>${d.data.count}</b> 部 · ${pct}%</div><div>均分 <b style="color:var(--gold)">${avgR?.toFixed(2) ?? '-'}</b></div>`, event)
    })
    .on('mousemove', (event) => tip(null, event))
    .on('mouseout', function() {
      arcs.selectAll('path').transition().duration(200).attr('d', arc)
        .attr('opacity', d => (!store.highlightGenre || d.data.genre === store.highlightGenre) ? 0.88 : 0.15)
      tipHide()
    })
    .on('click', (_, d) => { store.highlightGenre = store.highlightGenre === d.data.genre ? null : d.data.genre })

  g.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
    .attr('font-size', 22).attr('font-weight', 800).attr('fill', 'var(--accent)').text(store.movies.length)
  g.append('text').attr('text-anchor', 'middle').attr('y', 18)
    .attr('font-size', 10).attr('fill', 'var(--text-3)').text('部电影')
}

function onResize() { const nw = wrap.value?.clientWidth || 0; if (nw !== lastW) { lastW = nw; draw() } }
onMounted(() => { draw(); lastW = wrap.value?.clientWidth || 0; ro = new ResizeObserver(onResize); if (wrap.value) ro.observe(wrap.value) })
onBeforeUnmount(() => ro?.disconnect())
watch([() => store.allGenres, () => store.highlightGenre], draw)
</script>

<style scoped>
.ring-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  padding: 8px 16px 16px;
  align-items: center;
}
.ring-svg { height: 280px; }

.hint-text { font-size: 11px; color: var(--text-3); }

.legend-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.legend-row {
  display: grid;
  grid-template-columns: 10px 64px 1fr 28px 40px;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 7px;
  cursor: pointer;
  transition: background .12s, opacity .2s;
}
.legend-row:hover { background: var(--surface-dim); }
.legend-row.dimmed { opacity: 0.35; }
.legend-row.active { background: var(--accent-soft); }

.legend-dot {
  width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0;
}
.legend-name {
  font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.legend-bar-wrap {
  height: 6px; background: #f0f1f5; border-radius: 3px; overflow: hidden;
}
.legend-bar {
  height: 100%; border-radius: 3px; transition: width .3s;
}
.legend-count {
  font-size: 11px; font-weight: 700; color: var(--text-2); text-align: right;
}
.legend-pct {
  font-size: 11px; color: var(--text-3); text-align: right;
}
</style>
