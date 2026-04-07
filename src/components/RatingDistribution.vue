<template>
  <div class="card">
    <div class="card-head">
      <h3>评分区间直方图</h3>
    </div>
    <div ref="wrap" class="chart-wrap" style="height:300px" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import { useMovieStore } from '@/stores/movies'
import { ratingColor } from '@/utils/colors'
import { tip, tipHide } from '@/utils/bindTip'

const store = useMovieStore()
const wrap = ref(null)
let ro = null, lastW = 0

function draw() {
  const el = wrap.value
  if (!el || !store.movies.length) return
  const data = store.filtered
  if (!data.length) return
  const W = el.clientWidth, H = el.clientHeight
  const m = { top: 12, right: 28, bottom: 40, left: 42 }
  const w = W - m.left - m.right, h = H - m.top - m.bottom
  if (w < 40 || h < 40) return

  d3.select(el).selectAll('*').remove()

  const bins = d3.bin().domain([8.3, 9.8]).thresholds(d3.range(8.3, 9.85, 0.1)).value(d => d.rating)(data)

  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`)

  const x = d3.scaleLinear().domain([8.3, 9.8]).range([0, w])
  const y = d3.scaleLinear().domain([0, d3.max(bins, b => b.length) * 1.15]).nice().range([h, 0])

  g.append('g').call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(''))
    .call(a => { a.select('.domain').remove(); a.selectAll('line').attr('stroke', '#f0f1f4') })

  g.selectAll('.rbar').data(bins).join('rect')
    .attr('class', 'rbar')
    .attr('x', b => x(b.x0) + 1).attr('width', b => Math.max(0, x(b.x1) - x(b.x0) - 2))
    .attr('y', h).attr('height', 0)
    .attr('fill', b => ratingColor((b.x0 + b.x1) / 2)).attr('opacity', 0.75).attr('rx', 3)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, b) {
      g.selectAll('.rbar').transition().duration(120).attr('opacity', 0.25)
      d3.select(this).transition().duration(120).attr('opacity', 1)
      const titles = b.slice(0, 5).map(m => m.title).join('、')
      tip(`<div style="font-weight:700">${b.x0.toFixed(1)} ~ ${b.x1.toFixed(1)}</div><div><b>${b.length}</b> 部</div><div style="font-size:12px;color:var(--text-3)">${titles}${b.length > 5 ? '…' : ''}</div>`, event)
    })
    .on('mousemove', (event) => tip(null, event))
    .on('mouseout', function() { g.selectAll('.rbar').transition().duration(200).attr('opacity', 0.75); tipHide() })
    .transition().duration(500).ease(d3.easeCubicOut)
    .attr('y', b => y(b.length)).attr('height', b => h - y(b.length))

  g.selectAll('.rlabel').data(bins.filter(b => b.length > 0)).join('text')
    .attr('x', b => (x(b.x0) + x(b.x1)) / 2).attr('y', b => y(b.length) - 4)
    .attr('text-anchor', 'middle').attr('font-size', 11).attr('font-weight', 600).attr('fill', 'var(--text-2)')
    .text(b => b.length)

  g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.format('.1f')))
    .call(a => { a.select('.domain').attr('stroke', '#eee'); a.selectAll('text').attr('fill', '#aaa').attr('font-size', 11) })

  g.append('text').attr('x', w/2).attr('y', h+32).attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', '#bbb').text('评分')
}

function onResize() { const nw = wrap.value?.clientWidth || 0; if (nw !== lastW) { lastW = nw; draw() } }
onMounted(() => { draw(); lastW = wrap.value?.clientWidth || 0; ro = new ResizeObserver(onResize); if (wrap.value) ro.observe(wrap.value) })
onBeforeUnmount(() => ro?.disconnect())
watch(() => store.filtered, draw)
</script>

<style scoped>
.chart-wrap { padding: 8px 10px 6px; overflow: hidden; }
</style>
