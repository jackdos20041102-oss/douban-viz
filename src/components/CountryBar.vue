<template>
  <div class="card">
    <div class="card-head">
      <h3>产出国分布</h3>
      <select v-model="metric" class="ctrl">
        <option value="count">指标：数量</option>
        <option value="avgRating">指标：均分</option>
      </select>
    </div>
    <div ref="wrap" class="chart-wrap" style="height:300px" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import { useMovieStore } from '@/stores/movies'
import { tip, tipHide } from '@/utils/bindTip'

const store = useMovieStore()
const wrap = ref(null)
const metric = ref('count')
let ro = null, lastW = 0

const COLORS = ['#6366f1','#818cf8','#a78bfa','#c4b5fd','#8b5cf6','#7c3aed','#6d28d9','#5b21b6','#4c1d95','#3730a3']

function draw() {
  const el = wrap.value
  if (!el || !store.allCountries.length) return
  const W = el.clientWidth, H = el.clientHeight
  const m = { top: 6, right: 16, bottom: 4, left: 72 }
  const w = W - m.left - m.right, h = H - m.top - m.bottom
  if (w < 40 || h < 40) return

  d3.select(el).selectAll('*').remove()

  let data = store.allCountries.slice(0, 10).map(c => {
    const movies = store.movies.filter(mv => mv.mainCountry === c.country)
    return { country: c.country, count: c.count, avgRating: d3.mean(movies, mv => mv.rating) }
  })
  if (metric.value === 'avgRating') data = data.sort((a, b) => b.avgRating - a.avgRating)
  const val = d => metric.value === 'count' ? d.count : d.avgRating

  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`)

  const y = d3.scaleBand().domain(data.map(d => d.country)).range([0, h]).padding(0.22)
  const x = d3.scaleLinear().domain([0, d3.max(data, val) * 1.15]).nice().range([0, w])

  g.append('g').call(d3.axisLeft(y).tickSize(0))
    .call(a => { a.select('.domain').remove(); a.selectAll('text').attr('fill', 'var(--text)').attr('font-size', 12).attr('font-weight', 600) })

  const bars = g.selectAll('.bar').data(data).join('g')

  bars.append('rect')
    .attr('y', d => y(d.country)).attr('height', y.bandwidth())
    .attr('x', 0).attr('width', 0)
    .attr('fill', (_, i) => COLORS[i % COLORS.length])
    .attr('opacity', d => (!store.highlightCountry || d.country === store.highlightCountry) ? 0.8 : 0.15)
    .attr('rx', 4).style('cursor', 'pointer').style('transition', 'opacity .2s')
    .on('mouseover', function(event, d) {
      d3.select(this).transition().duration(120).attr('opacity', 1)
      g.selectAll('rect').filter(function() { return this !== event.target }).transition().duration(120).attr('opacity', 0.2)
      tip(`<div style="font-weight:700">${d.country}</div><div><b>${d.count}</b> 部 · 均分 <b style="color:var(--gold)">${d.avgRating.toFixed(2)}</b></div>`, event)
    })
    .on('mousemove', (event) => tip(null, event))
    .on('mouseout', function() {
      g.selectAll('rect').transition().duration(200).attr('opacity', d => (!store.highlightCountry || d.country === store.highlightCountry) ? 0.8 : 0.15)
      tipHide()
    })
    .on('click', (_, d) => { store.highlightCountry = store.highlightCountry === d.country ? null : d.country })
    .transition().duration(600).ease(d3.easeCubicOut).attr('width', d => x(val(d)))

  bars.append('text')
    .attr('y', d => y(d.country) + y.bandwidth() / 2).attr('x', d => x(val(d)) + 6)
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 11).attr('font-weight', 700).attr('fill', 'var(--text-2)')
    .text(d => metric.value === 'count' ? d.count : d.avgRating.toFixed(2))
}

function onResize() { const nw = wrap.value?.clientWidth || 0; if (nw !== lastW) { lastW = nw; draw() } }
onMounted(() => { draw(); lastW = wrap.value?.clientWidth || 0; ro = new ResizeObserver(onResize); if (wrap.value) ro.observe(wrap.value) })
onBeforeUnmount(() => ro?.disconnect())
watch([() => store.allCountries, metric, () => store.highlightCountry], draw)
</script>

<style scoped>
.chart-wrap { padding: 8px 10px 6px; overflow: hidden; }
</style>
