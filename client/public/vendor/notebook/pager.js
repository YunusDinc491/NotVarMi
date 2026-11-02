/* NotVarMı defter sayfalayıcısı.
   Defter içeriğini bölümlere (section) göre sayfalara ayırır, tam ekran gösterir ve
   sayfa çevirme animasyonuyla dolaştırır. Sandbox iframe içinde, içerik HTML'inden sonra çalışır.
   Sayfa sınırını elle belirlemek için öğelere data-page özniteliği verilebilir. */
(function () {
  'use strict'
  var body = document.body
  if (!body || body.querySelector('.nb-book')) return

  // 1) Kök ve sayfa gruplarını bul
  var root = body.querySelector('[data-notebook]') || body.querySelector('.page') || body
  var marked = root.querySelectorAll(':scope > [data-page]')
  var groups = []
  if (marked.length) {
    marked.forEach(function (el) { groups.push([el]) })
  } else {
    var current = [], hasSection = false
    Array.prototype.slice.call(root.children).forEach(function (el) {
      var tag = el.tagName
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK' || tag === 'META' || tag === 'TITLE') return
      if (tag === 'HR') return
      if (tag === 'SECTION' && hasSection) { groups.push(current); current = []; hasSection = false }
      current.push(el)
      if (tag === 'SECTION') hasSection = true
    })
    if (current.length) groups.push(current)
  }
  if (!groups.length) return

  // 2) Kitap yapısını kur (kök sınıfı her sayfada korunur, içerik CSS'i çalışmaya devam eder)
  body.classList.add('nb-paged')
  var bg = getComputedStyle(body).backgroundColor
  if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') bg = '#ffffff'
  var book = document.createElement('div')
  book.className = 'nb-book'
  var rootClass = root === body ? '' : root.className
  var rootId = root === body ? '' : root.id
  var sheets = groups.map(function (els, i) {
    var sheet = document.createElement('article')
    sheet.className = 'nb-sheet'
    sheet.style.backgroundColor = bg
    sheet.setAttribute('aria-hidden', i === 0 ? 'false' : 'true')
    var inner = document.createElement('div')
    inner.className = ('nb-inner ' + rootClass).trim()
    if (i === 0 && rootId) inner.id = rootId
    els.forEach(function (el) { inner.appendChild(el) })
    sheet.appendChild(inner)
    book.appendChild(sheet)
    var h = inner.querySelector('h1, h2, h3')
    sheet.dataset.title = h ? h.textContent.replace(/\s+/g, ' ').trim() : 'Sayfa ' + (i + 1)
    return sheet
  })
  if (root !== body && !root.children.length) root.remove()
  body.appendChild(book)
  if (sheets.length < 2) { sheets[0].classList.add('is-current'); return }

  // 3) Kontroller
  var ui = document.createElement('nav')
  ui.className = 'nb-nav'
  ui.setAttribute('aria-label', 'Defter sayfaları')
  ui.innerHTML =
    '<button type="button" class="nb-btn nb-prev" aria-label="Önceki sayfa">‹</button>' +
    '<button type="button" class="nb-where" aria-haspopup="true" aria-expanded="false"><span class="nb-num"></span><span class="nb-title"></span></button>' +
    '<button type="button" class="nb-btn nb-next" aria-label="Sonraki sayfa">›</button>'
  var toc = document.createElement('div')
  toc.className = 'nb-toc'
  toc.hidden = true
  toc.innerHTML = '<p>İçindekiler</p><ol></ol>'
  sheets.forEach(function (s, i) {
    var li = document.createElement('li')
    var b = document.createElement('button')
    b.type = 'button'
    b.innerHTML = '<span>' + (i + 1) + '</span>'
    b.appendChild(document.createTextNode(s.dataset.title))
    b.addEventListener('click', function () { closeToc(); go(i) })
    li.appendChild(b)
    toc.querySelector('ol').appendChild(li)
  })
  var bar = document.createElement('div')
  bar.className = 'nb-progress'
  bar.innerHTML = '<span></span>'
  body.appendChild(bar)
  body.appendChild(toc)
  body.appendChild(ui)

  var prevBtn = ui.querySelector('.nb-prev'), nextBtn = ui.querySelector('.nb-next'), where = ui.querySelector('.nb-where')
  var index = 0, busy = false
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function render() {
    ui.querySelector('.nb-num').textContent = (index + 1) + ' / ' + sheets.length
    ui.querySelector('.nb-title').textContent = sheets[index].dataset.title
    prevBtn.disabled = index === 0
    nextBtn.disabled = index === sheets.length - 1
    bar.firstChild.style.width = ((index + 1) / sheets.length * 100) + '%'
    toc.querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('active', i === index) })
  }
  function show(i) {
    sheets.forEach(function (s, j) {
      s.classList.toggle('is-current', j === i)
      s.setAttribute('aria-hidden', j === i ? 'false' : 'true')
    })
  }
  function go(target) {
    if (busy || target === index || target < 0 || target >= sheets.length) return
    var from = sheets[index], to = sheets[target], forward = target > index
    to.scrollTop = 0
    index = target
    render()
    if (reduce) { show(target); return }
    busy = true
    from.classList.remove('is-current')
    if (forward) {
      to.classList.add('is-current', 'nb-under')
      from.classList.add('nb-turn-out')
    } else {
      from.classList.add('nb-under-keep')
      to.classList.add('is-current', 'nb-turn-in')
    }
    var done = false
    function finish() {
      if (done) return
      done = true
      from.classList.remove('nb-turn-out', 'nb-under-keep')
      to.classList.remove('nb-under', 'nb-turn-in')
      show(target)
      busy = false
    }
    setTimeout(finish, 760)
  }
  function openToc() { toc.hidden = false; where.setAttribute('aria-expanded', 'true') }
  function closeToc() { toc.hidden = true; where.setAttribute('aria-expanded', 'false') }

  prevBtn.addEventListener('click', function () { go(index - 1) })
  nextBtn.addEventListener('click', function () { go(index + 1) })
  where.addEventListener('click', function () { toc.hidden ? openToc() : closeToc() })
  document.addEventListener('click', function (e) {
    if (!toc.hidden && !toc.contains(e.target) && !where.contains(e.target)) closeToc()
  })
  document.addEventListener('keydown', function (e) {
    var t = e.target
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(index + 1) }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(index - 1) }
    else if (e.key === 'Home') { go(0) }
    else if (e.key === 'End') { go(sheets.length - 1) }
    else if (e.key === 'Escape') { closeToc() }
  })
  // Ana uygulama (yalnızca üst pencere) ok tuşlarını "next/prev" komutu olarak iletebilir
  window.addEventListener('message', function (e) {
    if (e.source !== window.parent || !e.data || typeof e.data.notvarmiPager !== 'string') return
    if (e.data.notvarmiPager === 'next') go(index + 1)
    else if (e.data.notvarmiPager === 'prev') go(index - 1)
  })
  // Dokunmatik kaydırma: belirgin yatay hareket sayfa çevirir; kaydırıcı ve tuval üzerindeki hareketler hariç
  var sx = 0, sy = 0, tracking = false
  book.addEventListener('touchstart', function (e) {
    var t = e.target
    tracking = !(t.closest && t.closest('input, canvas, .controls, .tw, .eq'))
    if (!tracking) return
    sx = e.touches[0].clientX; sy = e.touches[0].clientY
  }, { passive: true })
  book.addEventListener('touchend', function (e) {
    if (!tracking) return
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) go(dx < 0 ? index + 1 : index - 1)
  }, { passive: true })

  show(0)
  render()
})()
