<template>
  <div class="card">
    <div class="card-head">
      <div>
        <h3>评分-热度散点图</h3>
      </div>
      <div class="flex gap-2 items-center">
        <select v-model="colorBy" class="ctrl">
          <option value="genre">着色：类型</option>
          <option value="country">着色：国家</option>
          <option value="decade">着色：年代</option>
        </select>
      </div>
    </div>
    <div ref="wrap" class="chart-wrap" style="height:500px" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import { useMovieStore } from '@/stores/movies'
import { genreColor, stars } from '@/utils/colors'
import { tip, tipHide } from '@/utils/bindTip'

const store = useMovieStore()
const wrap = ref(null)
const colorBy = ref('genre')
const margin = { top: 14, right: 56, bottom: 48, left: 56 }

const COUNTRY_C = { '美国': '#6366f1', '日本': '#ef4444', '英国': '#22c55e', '中国香港': '#f59e0b', '中国大陆': '#ec4899', '韩国': '#06b6d4', '中国台湾': '#8b5cf6' }
const DECADE_C  = { 1980: '#ec4899', 1990: '#6366f1', 2000: '#22c55e', 2010: '#f59e0b', 2020: '#06b6d4' }

function getColor(m) {
  if (colorBy.value === 'country') return COUNTRY_C[m.mainCountry] || '#94a3b8'
  if (colorBy.value === 'decade')  return DECADE_C[m.decade] || '#94a3b8'
  return genreColor(m.mainGenre)
}

let ro = null, lastW = 0

function draw() {
  const el = wrap.value
  if (!el || !store.movies.length) return
  const data = store.filtered
  if (!data.length) return
  const W = el.clientWidth, H = el.clientHeight
  const w = W - margin.left - margin.right, h = H - margin.top - margin.bottom
  if (w < 40 || h < 40) return

  d3.select(el).selectAll('*').remove()
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
  svg.append('defs').append('clipPath').attr('id', 'sc-clip').append('rect').attr('width', w).attr('height', h)
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleLinear().domain([8.3, 9.8]).range([0, w])
  const y = d3.scaleLog().domain([d3.min(data, d => d.votes) * 0.8, d3.max(data, d => d.votes) * 1.1]).range([h, 0])
  const rScale = d3.scaleSqrt().domain(d3.extent(data, d => d.votes)).range([4, 14])

  g.append('g').call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(d => d >= 1e6 ? (d/1e6).toFixed(0)+'M' : (d/1e3).toFixed(0)+'K'))
    .call(a => { a.select('.domain').remove(); a.selectAll('line').attr('stroke', '#f0f1f4'); a.selectAll('text').attr('fill', '#aaa').attr('font-size', 11) })

  g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(8))
    .call(a => { a.select('.domain').attr('stroke', '#eee'); a.selectAll('text').attr('fill', '#aaa').attr('font-size', 11); a.selectAll('line').attr('stroke', '#eee') })

  const cg = g.append('g').attr('clip-path', 'url(#sc-clip)')

  const brush = d3.brush().extent([[0, 0], [w, h]])
    .on('end', (event) => {
      if (!event.selection) { dots.attr('opacity', 0.8).attr('r', d => rScale(d.votes)); return }
      const [[bx0, by0], [bx1, by1]] = event.selection
      dots.attr('opacity', d => {
        const px = x(d.rating), py = y(d.votes)
        return (px >= bx0 && px <= bx1 && py >= by0 && py <= by1) ? 1 : 0.06
      })
      g.select('.brush-g').call(brush.move, null)
    })
  g.append('g').attr('class', 'brush-g').call(brush)
    .selectAll('.selection').attr('fill', 'var(--accent)').attr('fill-opacity', .05).attr('stroke', 'var(--accent)')

  const dots = cg.selectAll('.dot').data(data, d => d.rank).join('circle')
    .attr('cx', d => x(d.rating)).attr('cy', d => y(d.votes))
    .attr('r', 0).attr('fill', d => getColor(d))
    .attr('stroke', '#fff').attr('stroke-width', 1.5).attr('opacity', 0.8)
    .style('cursor', 'pointer')

  dots.transition().duration(500).ease(d3.easeCubicOut).attr('r', d => rScale(d.votes))

  dots
    .on('mouseover', function(event, d) {
      dots.transition().duration(120).attr('opacity', 0.12)
      d3.select(this).transition().duration(120).attr('r', rScale(d.votes) + 5).attr('stroke-width', 2.5).attr('opacity', 1)
      tip(`
        <div class="t-title">${d.title}</div>
        <div class="star t-rating">${stars(d.rating)} ${d.rating}</div>
        <div><span class="t-label">排名</span> #${d.rank}　<span class="t-label">评价</span> ${(d.votes/10000).toFixed(1)}万</div>
        <div><span class="t-label">导演</span> ${d.director}</div>
        <div><span class="t-label">类型</span> ${d.genres.join(' / ')}</div>
        <div><span class="t-label">年份</span> ${d.year}　${d.country}</div>
        ${d.quote ? `<div style="margin-top:4px;font-style:italic;color:var(--text-2)">"${d.quote}"</div>` : ''}
      `, event)
    })
    .on('mousemove', (event) => tip(null, event))
    .on('mouseout', function(_, d) {
      dots.transition().duration(200).attr('opacity', 0.8).attr('r', dd => rScale(dd.votes)).attr('stroke-width', 1.5)
      tipHide()
    })
    .on('click', (_, d) => store.select(d))

  g.append('text').attr('x', w/2).attr('y', h+38).attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', '#bbb').text('评分')
  g.append('text').attr('transform', 'rotate(-90)').attr('x', -h/2).attr('y', -42).attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', '#bbb').text('评价人数')
}

function onResize() {
  const el = wrap.value
  if (!el) return
  const nw = el.clientWidth
  if (nw !== lastW) { lastW = nw; draw() }
}

onMounted(() => {
  draw()
  lastW = wrap.value?.clientWidth || 0
  ro = new ResizeObserver(onResize)
  if (wrap.value) ro.observe(wrap.value)
})
onBeforeUnmount(() => ro?.disconnect())
watch([() => store.filtered, colorBy], draw)
</script>

<style scoped>
.chart-wrap { padding: 8px 10px 10px; overflow: hidden; }
</style>
