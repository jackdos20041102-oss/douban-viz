<template>
  <div class="card">
    <div class="card-head">
      <h3>年代均分走势</h3>
    </div>
    <div ref="wrap" class="chart-wrap" style="height:280px" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import { useMovieStore } from '@/stores/movies'
import { tip, tipHide } from '@/utils/bindTip'

const store = useMovieStore()
const wrap = ref(null)
let ro = null, lastW = 0

function draw() {
  const el = wrap.value
  if (!el || !store.allDecades.length) return
  const W = el.clientWidth, H = el.clientHeight
  const m = { top: 14, right: 16, bottom: 34, left: 40 }
  const w = W - m.left - m.right, h = H - m.top - m.bottom
  if (w < 40 || h < 40) return

  d3.select(el).selectAll('*').remove()

  const decades = store.allDecades.filter(d => d.decade >= 1930)
  const data = decades.map(d => {
    const movies = store.movies.filter(mv => mv.decade === d.decade)
    return { decade: d.decade, count: d.count, avgRating: d3.mean(movies, mv => mv.rating) }
  })

  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`)

  const x = d3.scalePoint().domain(data.map(d => d.decade)).range([0, w]).padding(0.3)
  const yR = d3.scaleLinear().domain([d3.min(data, d => d.avgRating) - 0.1, d3.max(data, d => d.avgRating) + 0.1]).range([h, 0])
  const yC = d3.scaleLinear().domain([0, d3.max(data, d => d.count) * 1.2]).range([h, 0])
  const rScale = d3.scaleSqrt().domain(d3.extent(data, d => d.count)).range([4, 18])

  g.append('g').call(d3.axisLeft(yR).ticks(5).tickSize(-w).tickFormat(d3.format('.2f')))
    .call(a => { a.select('.domain').remove(); a.selectAll('line').attr('stroke', '#f0f1f4'); a.selectAll('text').attr('fill', '#aaa').attr('font-size', 11) })

  const area = d3.area().x(d => x(d.decade)).y0(h).y1(d => yC(d.count)).curve(d3.curveMonotoneX)
  g.append('path').datum(data).attr('d', area).attr('fill', 'var(--accent)').attr('opacity', 0.07)

  const line = d3.line().x(d => x(d.decade)).y(d => yR(d.avgRating)).curve(d3.curveMonotoneX)
  g.append('path').datum(data).attr('d', line)
    .attr('fill', 'none').attr('stroke', 'var(--accent)').attr('stroke-width', 2.5)

  g.selectAll('.dot').data(data).join('circle')
    .attr('cx', d => x(d.decade)).attr('cy', d => yR(d.avgRating))
    .attr('r', d => rScale(d.count))
    .attr('fill', 'var(--accent)').attr('opacity', 0.18)
    .attr('stroke', 'var(--accent)').attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).transition().duration(120).attr('r', rScale(d.count) + 5).attr('opacity', 0.5).attr('stroke-width', 3)
      tip(`<div style="font-weight:700">${d.decade}s</div><div>均分 <b style="color:var(--gold)">${d.avgRating.toFixed(2)}</b></div><div><b>${d.count}</b> 部入围</div>`, event)
    })
    .on('mousemove', (event) => tip(null, event))
    .on('mouseout', function(_, d) {
      d3.select(this).transition().duration(200).attr('r', rScale(d.count)).attr('opacity', 0.18).attr('stroke-width', 2)
      tipHide()
    })
    .on('click', (_, d) => { store.highlightDecade = store.highlightDecade === d.decade ? null : d.decade })

  g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).tickFormat(d => d + 's'))
    .call(a => { a.select('.domain').attr('stroke', '#eee'); a.selectAll('text').attr('fill', 'var(--text-2)').attr('font-size', 11).attr('font-weight', 600) })

  g.append('text').attr('transform', 'rotate(-90)').attr('x', -h/2).attr('y', -28)
    .attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#bbb').text('均分')
}

function onResize() { const nw = wrap.value?.clientWidth || 0; if (nw !== lastW) { lastW = nw; draw() } }
onMounted(() => { draw(); lastW = wrap.value?.clientWidth || 0; ro = new ResizeObserver(onResize); if (wrap.value) ro.observe(wrap.value) })
onBeforeUnmount(() => ro?.disconnect())
watch(() => store.allDecades, draw)
</script>

<style scoped>
.chart-wrap { padding: 8px 10px 6px; overflow: hidden; }
</style>
