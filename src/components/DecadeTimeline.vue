<template>
  <div class="card">
    <div class="card-head">
      <h3>年代-类型堆叠图</h3>
      <div class="flex gap-1 items-center flex-wrap">
        <span class="pill sm" :class="{active: !store.highlightDecade}" @click="store.highlightDecade = null">全部</span>
        <span v-for="d in mainDecades" :key="d" class="pill sm"
          :class="{active: store.highlightDecade === d}"
          @click="store.highlightDecade = store.highlightDecade === d ? null : d">{{ d }}s</span>
      </div>
    </div>
    <div ref="wrap" class="chart-wrap" style="height:280px" />
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
const mainDecades = computed(() => store.allDecades.filter(d => d.count >= 3).map(d => d.decade))

function draw() {
  const el = wrap.value
  if (!el || !store.movies.length) return
  const W = el.clientWidth, H = el.clientHeight
  const m = { top: 10, right: 14, bottom: 32, left: 36 }
  const w = W - m.left - m.right, h = H - m.top - m.bottom
  if (w < 40 || h < 40) return

  d3.select(el).selectAll('*').remove()

  const topGenres = store.allGenres.slice(0, 6).map(g => g.genre)
  const decades = store.allDecades.filter(d => d.decade >= 1930)

  const stacked = decades.map(dec => {
    const movies = store.movies.filter(mv => mv.decade === dec.decade)
    const row = { decade: dec.decade }
    topGenres.forEach(g => { row[g] = movies.filter(mv => mv.genres.includes(g)).length })
    return row
  })

  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`)

  const x = d3.scaleBand().domain(decades.map(d => d.decade)).range([0, w]).padding(0.15)
  const series = d3.stack().keys(topGenres)(stacked)
  const yMax = d3.max(series[series.length - 1], d => d[1])
  const y = d3.scaleLinear().domain([0, yMax * 1.1]).nice().range([h, 0])

  g.append('g').call(d3.axisLeft(y).ticks(4).tickSize(-w).tickFormat(''))
    .call(a => { a.select('.domain').remove(); a.selectAll('line').attr('stroke', '#f0f1f4') })

  series.forEach(s => {
    g.selectAll(`.bar-${s.key}`).data(s).join('rect')
      .attr('class', `bar-${s.key}`)
      .attr('x', d => x(d.data.decade)).attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1])).attr('width', x.bandwidth())
      .attr('fill', genreColor(s.key))
      .attr('opacity', d => (!store.highlightDecade || d.data.decade === store.highlightDecade) ? 0.8 : 0.12)
      .attr('rx', 2).style('cursor', 'pointer').style('transition', 'opacity .2s')
      .on('mouseover', function(event, d) {
        const dec = d.data.decade
        topGenres.forEach(ge => {
          g.selectAll(`.bar-${ge}`).transition().duration(120).attr('opacity', rd => rd.data.decade === dec ? 0.9 : 0.12)
        })
        tip(`<div style="font-weight:700">${dec}s · <span style="color:${genreColor(s.key)}">${s.key}</span></div><div>${d.data[s.key]} 部</div>`, event)
      })
      .on('mousemove', (event) => tip(null, event))
      .on('mouseout', function() {
        topGenres.forEach(ge => {
          g.selectAll(`.bar-${ge}`).transition().duration(200).attr('opacity', d => (!store.highlightDecade || d.data.decade === store.highlightDecade) ? 0.8 : 0.12)
        })
        tipHide()
      })
      .on('click', (_, d) => { store.highlightDecade = store.highlightDecade === d.data.decade ? null : d.data.decade })
  })

  g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).tickFormat(d => d + 's'))
    .call(a => { a.select('.domain').attr('stroke', '#eee'); a.selectAll('text').attr('fill', 'var(--text-2)').attr('font-size', 11).attr('font-weight', 600); a.selectAll('line').attr('stroke', '#eee') })

  const lw = topGenres.length * 52
  const legend = g.append('g').attr('transform', `translate(${w - lw}, -2)`)
  topGenres.forEach((ge, i) => {
    const lg = legend.append('g').attr('transform', `translate(${i * 52}, 0)`)
    lg.append('rect').attr('width', 8).attr('height', 8).attr('rx', 2).attr('fill', genreColor(ge))
    lg.append('text').attr('x', 11).attr('y', 8).attr('font-size', 10).attr('fill', 'var(--text-3)').text(ge)
  })
}

function onResize() { const nw = wrap.value?.clientWidth || 0; if (nw !== lastW) { lastW = nw; draw() } }
onMounted(() => { draw(); lastW = wrap.value?.clientWidth || 0; ro = new ResizeObserver(onResize); if (wrap.value) ro.observe(wrap.value) })
onBeforeUnmount(() => ro?.disconnect())
watch([() => store.movies, () => store.highlightDecade], draw)
</script>

<style scoped>
.chart-wrap { padding: 8px 10px 6px; overflow: hidden; }
.pill.sm { padding: 3px 10px; font-size: 11px; }
</style>
