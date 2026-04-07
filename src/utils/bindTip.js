let el = null
function ensure() {
  if (!el) { el = document.createElement('div'); el.className = 'tooltip-box'; el.style.display = 'none'; document.body.appendChild(el) }
}
export function tip(html, event) {
  ensure()
  if (html != null) el.innerHTML = html
  el.style.display = 'block'
  const px = event.clientX + 16, py = event.clientY - 12
  requestAnimationFrame(() => {
    const w = el.offsetWidth, h = el.offsetHeight
    el.style.left = (px + w > window.innerWidth ? px - w - 24 : px) + 'px'
    el.style.top  = (py + h > window.innerHeight ? py - h : py) + 'px'
  })
}
export function tipHide() { if (el) el.style.display = 'none' }
