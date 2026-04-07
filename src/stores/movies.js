import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as d3 from 'd3'

export const useMovieStore = defineStore('movies', () => {
  const movies = ref([])
  const loading = ref(true)
  const selectedMovie = ref(null)
  const highlightGenre = ref(null)
  const highlightCountry = ref(null)
  const highlightDecade = ref(null)
  const searchText = ref('')

  async function loadAll() {
    loading.value = true
    const data = await fetch('/data/movies.json').then(r => r.json())
    data.forEach(d => {
      d.decade = d.year ? Math.floor(d.year / 10) * 10 : null
      d.mainCountry = d.country ? d.country.split(/\s+/)[0] : '未知'
      d.mainGenre = d.genres?.[0] || '其他'
      d.directorName = d.director ? d.director.split(/\s+/)[0] : '未知'
    })
    movies.value = data
    loading.value = false
  }

  function select(m) { selectedMovie.value = m }
  function clearSelect() { selectedMovie.value = null }

  const filtered = computed(() => {
    let list = movies.value
    if (highlightGenre.value) list = list.filter(m => m.genres.includes(highlightGenre.value))
    if (highlightCountry.value) list = list.filter(m => m.mainCountry === highlightCountry.value)
    if (highlightDecade.value) list = list.filter(m => m.decade === highlightDecade.value)
    if (searchText.value) {
      const q = searchText.value.toLowerCase()
      list = list.filter(m => m.title.toLowerCase().includes(q) || m.director.toLowerCase().includes(q))
    }
    return list
  })

  const allGenres = computed(() => {
    const map = {}
    movies.value.forEach(m => m.genres.forEach(g => { map[g] = (map[g] || 0) + 1 }))
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([g, c]) => ({ genre: g, count: c }))
  })

  const allCountries = computed(() => {
    const map = {}
    movies.value.forEach(m => { const c = m.mainCountry; map[c] = (map[c] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([c, n]) => ({ country: c, count: n }))
  })

  const allDecades = computed(() => {
    const map = {}
    movies.value.forEach(m => { if (m.decade) map[m.decade] = (map[m.decade] || 0) + 1 })
    return Object.entries(map).sort((a, b) => a[0] - b[0]).map(([d, n]) => ({ decade: +d, count: n }))
  })

  const directorNetwork = computed(() => {
    const dirMap = {}
    movies.value.forEach(m => {
      const d = m.directorName
      if (!dirMap[d]) dirMap[d] = []
      dirMap[d].push(m)
    })
    return Object.entries(dirMap)
      .filter(([, arr]) => arr.length >= 2)
      .map(([name, arr]) => ({ name, movies: arr, count: arr.length, avgRating: d3.mean(arr, m => m.rating) }))
      .sort((a, b) => b.count - a.count)
  })

  const stats = computed(() => {
    const m = movies.value
    if (!m.length) return null
    const years = m.filter(d => d.year).map(d => d.year)
    const minY = d3.min(years), maxY = d3.max(years)
    return {
      total: m.length,
      avgRating: d3.mean(m, d => d.rating),
      maxVotes: d3.max(m, d => d.votes),
      topRated: m[0],
      decades: allDecades.value.length,
      genres: allGenres.value.length,
      countries: allCountries.value.length,
      yearRange: minY && maxY ? `${minY}–${maxY}` : '-',
    }
  })

  return {
    movies, loading, selectedMovie, highlightGenre, highlightCountry, highlightDecade, searchText,
    loadAll, select, clearSelect,
    filtered, allGenres, allCountries, allDecades, directorNetwork, stats,
  }
})
