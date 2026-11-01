import { useEffect, useMemo, useState } from 'react'
import './Notebook.css'

const same = (a, b) => a.html === b.html && a.css === b.css && a.javascript === b.javascript

function frameDocument(content) {
  const css = content.css.replace(/<\/style/gi, '<\\/style')
  const script = content.javascript.replace(/<\/script/gi, '<\\/script')
  // No same-origin permission: user scripts cannot reach the parent, cookies, storage or API.
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'"><style>${css}</style></head><body>${content.html}<script>${script}</script></body></html>`
}

export default function Notebook({ course, admin, request, onClose }) {
  const [saved, setSaved] = useState(null), [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false), [tab, setTab] = useState('html'), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const dirty = saved && draft && !same(saved, draft)
  const srcDoc = useMemo(() => draft ? frameDocument(draft) : '', [draft])
  useEffect(() => {
    let active = true
    request(`/courses/${course.id}/notebook/`).then(data => { if (active) { setSaved(data); setDraft(data) } }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [course.id, request])
  useEffect(() => {
    function preventLoss(event) { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', preventLoss)
    return () => window.removeEventListener('beforeunload', preventLoss)
  }, [dirty])
  function close() { if (!dirty || window.confirm('Kaydedilmemiş değişiklikler var. Defteri kapatmak istiyor musun?')) onClose() }
  function cancelEdit() {
    if (dirty && !window.confirm('Kaydedilmemiş değişikliklerden vazgeçilsin mi?')) return
    setDraft(saved); setEditing(false); setError('')
  }
  async function save() {
    setBusy(true); setError('')
    try {
      const result = await request(`/courses/${course.id}/notebook/`, { method: 'PUT', body: JSON.stringify(draft) })
      const next = { ...draft, version: result.version }; setSaved(next); setDraft(next); setEditing(false)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return <div className="notebook-view" role="dialog" aria-modal="true" aria-label={`${course.name} defteri`}>
    <header className="notebook-bar"><div className="notebook-bar-left"><button className="book-back" onClick={close} aria-label="Defteri kapat">←</button><div><span>DERS DEFTERİ</span><strong>{course.name}</strong></div></div><div className="notebook-actions">{admin && draft && (editing ? <><span className="save-state">{dirty ? 'Kaydedilmedi' : 'Değişiklik yok'}</span><button className="book-quiet" disabled={busy} onClick={cancelEdit}>Vazgeç</button><button className="book-primary" disabled={busy || !dirty} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button></> : <button className="book-quiet" onClick={() => setEditing(true)}>✎ İçeriği düzenle</button>)}<button className="book-close" onClick={close} aria-label="Defteri kapat">×</button></div></header>
    {error && <div className="book-error" role="alert">{error}</div>}
    {!draft ? <div className="book-loading">{error ? 'Defter açılamadı.' : 'Defter açılıyor…'}</div> : <div className={`book-stage ${editing ? 'is-editing' : ''}`}>
      {editing && <section className="book-editor" aria-label="Defter içerik düzenleyicisi"><div className="editor-heading"><div><p>İÇERİK DÜZENLEYİCİ</p><h2>Sayfanı oluştur</h2></div><span>Canlı önizleme →</span></div><p className="editor-help">Anlatım, çizim ve animasyon kodlarını ilgili alanlara ekle. Önizleme yazarken güncellenir.</p><div className="editor-tabs" role="tablist" aria-label="Kod bölümü">{[['html','HTML'],['css','CSS'],['javascript','JavaScript']].map(([key, label]) => <button role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} key={key} onClick={() => setTab(key)}>{label}</button>)}</div><textarea className="code-input" spellCheck="false" aria-label={`${tab} kodu`} value={draft[tab]} onChange={e => setDraft({ ...draft, [tab]: e.target.value })} /><div className="editor-foot"><span>Yalnızca kaydettiğinde diğerleri görür.</span><span>{draft[tab].length.toLocaleString('tr-TR')} / 200.000</span></div></section>}
      <div className="book-desk"><div className="book-cover"><div className="book-spine" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><div className="book-paper"><iframe title={`${course.name} defter içeriği`} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={srcDoc} /></div></div><div className="book-caption"><span>✳</span> KENDİ HIZINDA, KENDİ SAYFANDA</div></div>
    </div>}
  </div>
}
