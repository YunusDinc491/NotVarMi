import { useEffect, useMemo, useRef, useState } from 'react'
import './Notebook.css'

const LIMIT = 1_000_000
const same = (a, b) => a.html === b.html && a.css === b.css && a.javascript === b.javascript
const hasMath = content => /\\\(|\\\[|\$\$/.test(content.html)

// Defter içeriği ayrı kökenli (allow-same-origin olmayan) sandbox iframe'de çalışır: oturuma, depolamaya ve API'ye erişemez.
// Dış ağ kapalıdır; yalnızca uygulamanın kendi /vendor/ klasöründeki sabit dosyalar (MathJax, yazı tipleri, sayfalayıcı) yüklenebilir.
function frameDocument(content, origin) {
  const vendor = `${origin}/vendor/`
  const css = content.css.replace(/<\/style/gi, '<\\/style')
  const script = content.javascript.replace(/<\/script/gi, '<\\/script')
  const csp = `default-src 'none'; script-src 'unsafe-inline' ${vendor}; style-src 'unsafe-inline' ${vendor}; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'`
  const math = hasMath(content)
    ? `<script>window.MathJax={tex:{inlineMath:[['\\\\(','\\\\)']],displayMath:[['\\\\[','\\\\]'],['$$','$$']]},svg:{fontCache:'global'},options:{enableMenu:false}}</script><script defer src="${vendor}mathjax/tex-svg-full.js"></script>`
    : ''
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="${csp}"><link rel="stylesheet" href="${vendor}fonts/notebook-fonts.css"><link rel="stylesheet" href="${vendor}notebook/pager.css">${math}<style>${css}</style></head><body>${content.html}<script>${script}</script><script src="${vendor}notebook/pager.js"></script></body></html>`
}

// Tek parça bir .html dosyasını defterin HTML / CSS / JavaScript alanlarına böler.
// Dış bağlantılar (Google Fonts, CDN'den MathJax) atılır; bunları uygulama kendisi sağlar.
function splitHtmlFile(text) {
  const doc = new DOMParser().parseFromString(text, 'text/html')
  const css = [...doc.querySelectorAll('style')].map(s => s.textContent.trim()).filter(Boolean).join('\n\n')
  const javascript = [...doc.querySelectorAll('script:not([src])')]
    .map(s => s.textContent.trim())
    .filter(code => code && !/^window\.MathJax\s*=/.test(code))
    .join('\n\n')
  doc.querySelectorAll('style, script, link, meta, title, noscript, base').forEach(el => el.remove())
  return { html: doc.body.innerHTML.trim(), css, javascript }
}

export default function Notebook({ course, initialNotebook, admin, request, onClose }) {
  const [saved, setSaved] = useState(null), [draft, setDraft] = useState(null)
  const [books, setBooks] = useState([]), [activeBook, setActiveBook] = useState(null)
  const [editing, setEditing] = useState(false), [tab, setTab] = useState('html'), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false)
  const fileInput = useRef(null), frame = useRef(null)
  const dirty = saved && draft && !same(saved, draft)
  const srcDoc = useMemo(() => draft ? frameDocument(draft, window.location.origin) : '', [draft])
  const notebookPath = book => book?.id === 0 ? `/courses/${course.id}/notebook/` : `/courses/${course.id}/notebooks/${book.id}`

  useEffect(() => {
    let active = true
    request(`/courses/${course.id}/notebooks/`).then(list => {
      if (!active) return
      setBooks(list)
      const first = list.find(book => book.id === initialNotebook?.id) ?? list[0]
      if (!first) { setSaved(null); setDraft(null); return }
      setActiveBook(first)
      return request(notebookPath(first)).then(data => { if (active) { setSaved(data); setDraft(data) } })
    }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [course.id, request, initialNotebook?.id])

  async function openBook(book) {
    if (dirty && !window.confirm('Kaydedilmemiş değişiklikler var. Başka deftere geçilsin mi?')) return
    setActiveBook(book); setDraft(null); setSaved(null); setError(''); setNotice(''); setEditing(false)
    try { const data = await request(notebookPath(book)); setSaved(data); setDraft(data) }
    catch (e) { setError(e.message) }
  }
  async function addBook() {
    const name = window.prompt('Defter adı (ör. Ünite 5 Ders Notu):')?.trim()
    if (!name) return
    try { const book = await request(`/courses/${course.id}/notebooks/`, { method: 'POST', body: JSON.stringify({ name }) }); setBooks(list => [...list, book]); await openBook(book) }
    catch (e) { setError(e.message) }
  }
  useEffect(() => {
    function preventLoss(event) { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', preventLoss)
    return () => window.removeEventListener('beforeunload', preventLoss)
  }, [dirty])
  useEffect(() => {
    function onKey(event) {
      const t = event.target
      if (editing || (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (event.key === 'Escape' && !document.fullscreenElement) close()
      const command = { ArrowRight: 'next', PageDown: 'next', ArrowLeft: 'prev', PageUp: 'prev' }[event.key]
      // Sayfa çevirme komutu yalnızca bir yönlü ve veri taşımayan bir mesajdır; çerçeve kaynağı kontrol eder.
      if (command && frame.current?.contentWindow) { event.preventDefault(); frame.current.contentWindow.postMessage({ notvarmiPager: command }, '*') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  function close() {
    if (dirty && !window.confirm('Kaydedilmemiş değişiklikler var. Defteri kapatmak istiyor musun?')) return
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    onClose()
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }
  function cancelEdit() {
    if (dirty && !window.confirm('Kaydedilmemiş değişikliklerden vazgeçilsin mi?')) return
    setDraft(saved); setEditing(false); setError(''); setNotice('')
  }
  async function importFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const parts = splitHtmlFile(await file.text())
      const over = Object.entries(parts).filter(([, v]) => v.length > LIMIT).map(([k]) => k.toUpperCase())
      if (over.length) { setError(`${over.join(', ')} alanı ${LIMIT.toLocaleString('tr-TR')} karakter sınırını aşıyor.`); return }
      setDraft(d => ({ ...d, ...parts })); setError('')
      setNotice(`“${file.name}” içe aktarıldı: HTML ${parts.html.length.toLocaleString('tr-TR')}, CSS ${parts.css.length.toLocaleString('tr-TR')}, JS ${parts.javascript.length.toLocaleString('tr-TR')} karakter. Kontrol edip Kaydet'e bas.`)
    } catch { setError('Dosya okunamadı. Geçerli bir .html dosyası seç.') }
  }
  async function save() {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await request(notebookPath(activeBook), { method: 'PUT', body: JSON.stringify(draft) })
      const next = { ...draft, version: result.version }; setSaved(next); setDraft(next); setEditing(false)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return <div className="notebook-view" role="dialog" aria-modal="true" aria-label={`${course.name} defteri`}>
    <header className="nb-topbar">
      <div className="nb-topbar-left">
        <button className="nb-icon" onClick={close} aria-label="Defteri kapat" title="Derse dön">←</button>
        <div className="nb-heading">
          <span>{course.name}</span>
          {books.length > 1
            ? <select aria-label="Defter seç" value={activeBook?.id ?? ''} onChange={e => { const b = books.find(x => String(x.id) === e.target.value); if (b) openBook(b) }}>{books.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            : <strong>{activeBook?.name || 'Defter'}</strong>}
        </div>
      </div>
      <div className="nb-topbar-actions">
        {admin && draft && (editing
          ? <><span className="nb-save-state">{dirty ? 'Kaydedilmedi' : 'Değişiklik yok'}</span><button className="nb-quiet" disabled={busy} onClick={cancelEdit}>Vazgeç</button><button className="nb-primary" disabled={busy || !dirty} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button></>
          : <><button className="nb-quiet" onClick={addBook}>＋ Yeni defter</button><button className="nb-quiet" onClick={() => setEditing(true)}>✎ Düzenle</button></>)}
        <button className="nb-icon nb-fullscreen" onClick={toggleFullscreen} aria-label="Tam ekran" title="Tam ekran">⛶</button>
        <button className="nb-icon nb-close" onClick={close} aria-label="Defteri kapat" title="Kapat">×</button>
      </div>
    </header>
    {error && <div className="nb-message is-error" role="alert">{error}</div>}
    {notice && <div className="nb-message" role="status">{notice}</div>}
    {!draft ? <div className="nb-loading">{error ? 'Defter açılamadı.' : 'Defter açılıyor…'}</div> : <div className={`nb-stage ${editing ? 'is-editing' : ''}`}>
      {editing && <section className="nb-editor" aria-label="Defter içerik düzenleyicisi">
        <div className="nb-editor-head">
          <div><p>İÇERİK DÜZENLEYİCİ</p><h2>{activeBook?.name}</h2></div>
          <button className="nb-quiet" onClick={() => fileInput.current?.click()}>⇪ .html içe aktar</button>
          <input ref={fileInput} type="file" accept=".html,.htm,text/html" hidden onChange={importFile} />
        </div>
        <p className="nb-editor-help">Hazır bir defter dosyasını “.html içe aktar” ile yükleyebilirsin; HTML, CSS ve JavaScript alanlarına otomatik bölünür. Formüller (<code>\( \)</code>, <code>\[ \]</code>) ve defter yazı tipleri uygulama tarafından sağlanır. Her <code>&lt;section&gt;</code> bir sayfa olur.</p>
        <div className="nb-tabs" role="tablist" aria-label="Kod bölümü">{[['html', 'HTML'], ['css', 'CSS'], ['javascript', 'JavaScript']].map(([key, label]) => <button role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} key={key} onClick={() => setTab(key)}>{label}</button>)}</div>
        <textarea className="nb-code" spellCheck="false" aria-label={`${tab} kodu`} value={draft[tab]} onChange={e => setDraft({ ...draft, [tab]: e.target.value })} />
        <div className="nb-editor-foot"><span>Yalnızca kaydettiğinde diğerleri görür.</span><span className={draft[tab].length > LIMIT ? 'over' : ''}>{draft[tab].length.toLocaleString('tr-TR')} / {LIMIT.toLocaleString('tr-TR')}</span></div>
      </section>}
      <iframe ref={frame} className="nb-frame" title={`${course.name} defter içeriği`} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={srcDoc} />
    </div>}
  </div>
}
