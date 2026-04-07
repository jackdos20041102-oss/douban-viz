<template>
  <div class="card">
    <div class="card-head">
      <h3>导演-影片关系网络</h3>
    </div>
    <div ref="wrap" class="chart-wrap" style="height:460px" />
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
let ro = null, sim = null, lastW = 0

function draw() {
  const el = wrap.value
  if (!el || !store.directorNetwork.length) return
  const W = el.clientWidth, H = el.clientHeight

  if (sim) sim.stop()
  d3.select(el).selectAll('*').remove()
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)

  const dirs = store.directorNetwork
  const nodes = [], links = []

  dirs.forEach(d => {
    nodes.push({ id: d.name, type: 'director', count: d.count, avg: d.avgRating })
    d.movies.forEach(m => {
      const mid = 'm' + m.rank
      if (!nodes.find(n => n.id === mid)) nodes.push({ id: mid, type: 'movie', movie: m })
      links.push({ source: d.name, target: mid })
    })
  })

  sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(48))
    .force('charge', d3.forceManyBody().strength(-70))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide().radius(d => d.type === 'director' ? 16 : 7))

  const g = svg.append('g')
  svg.call(d3.zoom().scaleExtent([0.3, 4]).on('zoom', e => g.attr('transform', e.transform)))

  const link = g.selectAll('.link').data(links).join('line')
    .attr('stroke', '#e2e5ec').attr('stroke-width', 1.5).attr('opacity', 0.5)

  const node = g.selectAll('.node').data(nodes).join('g').style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
      .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
    )

  node.filter(d => d.type === 'director').append('circle')
    .attr('r', d => 7 + d.count * 3)
    .attr('fill', 'var(--accent)').attr('stroke', '#fff').attr('stroke-width', 2).attr('opacity', 0.9)

  node.filter(d => d.type === 'director').append('text')
    .attr('dy', d => -(10 + d.count * 3)).attr('text-anchor', 'middle')
    .attr('font-size', 11).attr('font-weight', 700).attr('fill', 'var(--text)').text(d => d.id)

  node.filter(d => d.type === 'movie').append('circle')
    .attr('r', 5.5).attr('fill', d => genreColor(d.movie.mainGenre))
    .attr('stroke', '#fff').attr('stroke-width', 1.5).attr('opacity', 0.8)

  node.on('mouseover', (event, d) => {
    if (d.type === 'director') {
      const dm = dirs.find(x => x.name === d.id)
      tip(`<div class="t-title">${d.id}</div><div><b>${dm.count}</b> 部 · 均分 <b class="star">${dm.avgRating.toFixed(2)}</b></div><div style="margin-top:4px">${dm.movies.map(m => `<span style="color:${genreColor(m.mainGenre)}">${m.title}(${m.rating})</span>`).join('<br>')}</div>`, event)
    } else {
      const m = d.movie
      tip(`<div class="t-title">${m.title}</div><div class="star t-rating">${stars(m.rating)} ${m.rating}</div><div>${m.director} · ${m.year} · ${m.genres.join('/')}</div>`, event)
    }
  }).on('mouseout', tipHide)
    .on('click', (_, d) => { if (d.type === 'movie') store.select(d.movie) })

  sim.on('tick', () => {
    link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y)
    node.attr('transform', d => `translate(${d.x},${d.y})`)
  })
}

function onResize() { const nw = wrap.value?.clientWidth || 0; if (nw !== lastW) { lastW = nw; draw() } }
onMounted(() => { draw(); lastW = wrap.value?.clientWidth || 0; ro = new ResizeObserver(onResize); if (wrap.value) ro.observe(wrap.value) })
onBeforeUnmount(() => { ro?.disconnect(); if (sim) sim.stop() })
watch(() => store.directorNetwork, draw)
</script>

<style scoped>
.chart-wrap { padding: 4px; overflow: hidden; }
</style>
