import { useCallback, useEffect, useRef, useState } from 'react'
import Notebook from './Notebook'
import './App.css'

async function api(path, options = {}) {
  const headers = { ...options.headers }
  if (options.method && options.method !== 'GET') headers['X-NotVarMi-Request'] = '1'
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const response = await fetch(`/api${path}`, { ...options, headers })
  if (!response.ok) {
    let message = response.status === 401 ? 'Oturum süren dolmuş olabilir. Yeniden giriş yap.' : response.status === 403 ? 'Bu işlem için yetkin yok.' : 'İşlem tamamlanamadı. Tekrar dene.'
    try { message = (await response.json()).message || message } catch { /* Empty error response */ }
    throw new Error(message)
  }
  return response.status === 204 ? null : response.json()
}

function Login({ onLogin }) {
  const [username, setUsername] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try { onLogin(await api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })) }
    catch { setError('Giriş yapılamadı. Bilgilerini ve bağlantını kontrol et.') }
    finally { setBusy(false) }
  }
  return <main className="login-layout"><section className="intro"><span className="brand">notvarmı<span>.</span></span><div><p className="eyebrow">HER ŞEY BİR ARADA</p><h1>Notların için<br /><em>küçük bir yer.</em></h1><p>Derslerine, dosyalarına ve defterlerine istediğin yerden dön.</p></div><small>KENDİ HIZINDA ÖĞREN.</small></section><section className="form-area"><form onSubmit={submit}><div className="icon">✳</div><p className="eyebrow">TEKRAR HOŞ GELDİN</p><h2>Giriş yap</h2><p>Çalışma alanına devam etmek için bilgilerini gir.</p><label>Kullanıcı adı<input autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required /></label><label>Şifre<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>{error && <p className="error" role="alert">{error}</p>}<button disabled={busy} type="submit">{busy ? 'Giriş yapılıyor…' : 'Defterime git'} <span>→</span></button></form></section></main>
}

const formatSize = size => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`
const fileIcon = file => file.contentType.startsWith('image/') ? '▧' : file.contentType === 'application/pdf' ? '▤' : '▱'

function Workspace({ user, onLogout }) {
  const admin = user.role === 'Admin'
  const [courses, setCourses] = useState([]), [selected, setSelected] = useState(null), [trash, setTrash] = useState(null)
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [busy, setBusy] = useState(false), [dialog, setDialog] = useState(null)
  const [notebookOpen, setNotebookOpen] = useState(false)
  const input = useRef(null)
  const refreshCourses = useCallback(async () => setCourses(await api('/courses/')), [])
  const refreshCourse = useCallback(async id => setSelected(await api(`/courses/${id}`)), [])
  const refreshTrash = useCallback(async () => setTrash(await api('/trash/')), [])
  useEffect(() => { refreshCourses().catch(e => setError(e.message)).finally(() => setLoading(false)) }, [refreshCourses])
  async function perform(action) { setError(''); setBusy(true); try { await action() } catch (e) { setError(e.message) } finally { setBusy(false) } }
  function askCourse(course = null) { setDialog({ kind: 'course', value: course?.name ?? '', course }) }
  async function saveDialog(event) {
    event.preventDefault()
    const current = dialog
    await perform(async () => {
      if (current.kind === 'course') {
        const path = current.course ? `/courses/${current.course.id}` : '/courses/'
        await api(path, { method: current.course ? 'PUT' : 'POST', body: JSON.stringify({ name: current.value }) })
        await refreshCourses(); if (selected && current.course?.id === selected.id) await refreshCourse(selected.id)
      } else if (current.file) {
        await api(`/files/${current.file.id}/text`, { method: 'PUT', body: JSON.stringify({ text: current.text }) }); await refreshCourse(selected.id)
      } else {
        const data = new FormData(); data.append('file', new Blob([current.text], { type: 'text/plain' }), `${current.value.trim().replace(/\.txt$/i, '')}.txt`)
        await api(`/courses/${selected.id}/files`, { method: 'POST', body: data }); await refreshCourse(selected.id)
      }
      setDialog(null)
    })
  }
  async function upload(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return
    if (file.size > 95 * 1024 * 1024) { setError('Dosya 95 MB sınırını aşıyor.'); return }
    await perform(async () => { const data = new FormData(); data.append('file', file); await api(`/courses/${selected.id}/files`, { method: 'POST', body: data }); await refreshCourse(selected.id) })
  }
  async function moveCourse(course) {
    if (!window.confirm(`“${course.name}” dersi ve içindekiler geri dönüşüm kutusuna taşınsın mı?`)) return
    await perform(async () => { await api(`/courses/${course.id}`, { method: 'DELETE' }); setSelected(null); await refreshCourses() })
  }
  async function moveFile(file) {
    if (!window.confirm(`“${file.name}” geri dönüşüm kutusuna taşınsın mı?`)) return
    await perform(async () => { await api(`/files/${file.id}`, { method: 'DELETE' }); await refreshCourse(selected.id) })
  }
  async function editNote(file) {
    await perform(async () => { const response = await fetch(`/api/files/${file.id}?preview=true`); if (!response.ok) throw new Error('Not açılamadı.'); const text = await response.text(); setDialog({ kind: 'note', file, value: file.name, text }) })
  }
  async function trashAction(kind, item, permanent) {
    if (permanent && !window.confirm(`“${item.name}” kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)) return
    await perform(async () => { await api(`/trash/${kind}/${item.id}${permanent ? '' : '/restore'}`, { method: permanent ? 'DELETE' : 'POST' }); await refreshTrash(); await refreshCourses() })
  }
  function home() { setSelected(null); setTrash(null); setError('') }
  return <div className="workspace"><header className="topbar"><button className="brand brand-button" onClick={home}>notvarmı<span>.</span></button><div className="top-actions">{admin && <a className="text-button backup-link" href="/api/backup">↓ Yedek indir</a>}{admin && <button className="text-button" onClick={() => perform(async () => { setSelected(null); await refreshTrash() })}>♲ <span>Geri dönüşüm kutusu</span></button>}<span className="user-chip">{admin ? 'Yönetici' : 'Misafir'}</span><button className="text-button" onClick={onLogout}>Çıkış yap ↗</button></div></header>
    <main className="content"><div className="crumb"><button onClick={home}>Dersler</button>{selected && <> <span>/</span> {selected.name}</>}{trash && <> <span>/</span> Geri dönüşüm kutusu</>}</div>
    {error && <div className="notice" role="alert">{error}<button onClick={() => setError('')} aria-label="Kapat">×</button></div>}
    {loading ? <p className="muted">Yükleniyor…</p> : trash ? <><div className="heading"><div><p className="eyebrow">SAKİN OL, BURADALAR</p><h1>Geri dönüşüm kutusu<span className="accent">.</span></h1><p>Silinen dersleri ve dosyaları buradan geri getirebilirsin.</p></div></div><div className="trash-list">{trash.courses.map(item => <div className="trash-row" key={`c${item.id}`}><span className="file-symbol">▥</span><div className="row-title"><strong>{item.name}</strong><small>Ders ve içeriği</small></div><button onClick={() => trashAction('courses', item, false)}>Geri getir</button><button className="danger-link" onClick={() => trashAction('courses', item, true)}>Kalıcı sil</button></div>)}{trash.files.map(item => <div className="trash-row" key={`f${item.id}`}><span className="file-symbol">▤</span><div className="row-title"><strong>{item.name}</strong><small>{item.courseName} · Dosya</small></div><button onClick={() => trashAction('files', item, false)}>Geri getir</button><button className="danger-link" onClick={() => trashAction('files', item, true)}>Kalıcı sil</button></div>)}{!trash.courses.length && !trash.files.length && <div className="empty">Geri dönüşüm kutusu boş.</div>}</div></> : selected ? <><div className="heading"><div><p className="eyebrow">DERSİNİN ALANI</p><h1>{selected.name}<span className="accent">.</span></h1><p>Bu derse ait her şey bir arada.</p></div>{admin && <div className="heading-actions"><button className="outline" onClick={() => askCourse(selected)}>Düzenle</button><button className="outline danger-link" onClick={() => moveCourse(selected)}>Dersi sil</button></div>}</div><section className="notebook-banner"><div><span className="notebook-mark">▥</span></div><div><p className="eyebrow">BİR SONRAKİ SAYFA</p><h2>Defterin</h2><p>Bu dersin anlatımları için özel bir alan.</p></div><button className="outline" onClick={() => setNotebookOpen(true)}>Defteri aç →</button></section><section className="files-section"><div className="section-title"><div><p className="eyebrow">DERS MATERYALLERİ</p><h2>Notlar ve dosyalar <span>{selected.files.length}</span></h2></div>{admin && <div className="heading-actions"><button className="outline" disabled={busy} onClick={() => setDialog({ kind: 'note', value: '', text: '' })}>＋ Not ekle</button><button className="primary" disabled={busy} onClick={() => input.current?.click()}>＋ Dosya yükle</button><input ref={input} type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={upload} /></div>}</div><p className="helper">PDF, resim, metin ve Office dosyaları · Dosya başına en fazla 95 MB</p><div className="file-list">{selected.files.map(file => <div className="file-row" key={file.id}><span className="file-symbol">{fileIcon(file)}</span><div className="row-title"><strong>{file.name}</strong><small>{formatSize(file.size)} · {new Date(file.createdAt + (file.createdAt.endsWith('Z') ? '' : 'Z')).toLocaleDateString('tr-TR')}</small></div>{(file.contentType === 'application/pdf' || file.contentType === 'text/plain' || file.contentType.startsWith('image/')) && <a href={`/api/files/${file.id}?preview=true`} target="_blank" rel="noreferrer">Görüntüle</a>}<a href={`/api/files/${file.id}`} download>İndir</a>{admin && file.contentType === 'text/plain' && <button onClick={() => editNote(file)}>Düzenle</button>}{admin && <button className="danger-link" onClick={() => moveFile(file)}>Sil</button>}</div>)}{!selected.files.length && <div className="empty">Henüz bir dosya yok. {admin && 'İlk notunu veya dosyanı ekleyebilirsin.'}</div>}</div></section></> : <><div className="heading"><div><p className="eyebrow">KENDİ HIZINDA ÖĞREN</p><h1>Dersler<span className="accent">.</span></h1><p>Bugün hangi derse göz atmak istersin?</p></div>{admin && <button className="primary" onClick={() => askCourse()}>＋ Yeni ders</button>}</div><div className="course-grid">{courses.map((course, index) => <button className={`course-card tone-${index % 4}`} key={course.id} onClick={() => perform(() => refreshCourse(course.id))}><span className="card-top"><span className="course-icon">▥</span><span className="card-arrow">↗</span></span><span className="card-bottom"><small>DERS {String(index + 1).padStart(2, '0')}</small><strong>{course.name}</strong><span>Notlara git →</span></span></button>)}{!courses.length && <div className="empty">Henüz ders eklenmemiş.</div>}</div><div className="footer-note"><span>✳</span> Küçük adımlar, güzel başlangıçlar.</div></>}
    </main>{notebookOpen && selected && <Notebook course={selected} admin={admin} request={api} onClose={() => setNotebookOpen(false)} />}{dialog && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setDialog(null) }}><form className="modal" onSubmit={saveDialog}><div className="modal-head"><h2>{dialog.kind === 'note' ? dialog.file ? 'Notu düzenle' : 'Yeni not' : dialog.course ? 'Dersi düzenle' : 'Yeni ders'}</h2><button type="button" onClick={() => setDialog(null)} aria-label="Kapat">×</button></div><label>{dialog.kind === 'note' ? 'Not başlığı' : 'Ders adı'}<input autoFocus maxLength={dialog.kind === 'note' ? 150 : 100} value={dialog.value} disabled={!!dialog.file} onChange={e => setDialog({ ...dialog, value: e.target.value })} required /></label>{dialog.kind === 'note' && <label>Notun<textarea rows="8" value={dialog.text} onChange={e => setDialog({ ...dialog, text: e.target.value })} required /></label>}{error && <p className="error" role="alert">{error}</p>}<div className="modal-actions"><button className="outline" type="button" onClick={() => setDialog(null)}>Vazgeç</button><button className="primary" disabled={busy} type="submit">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button></div></form></div>}</div>
}

export default function App() {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true)
  useEffect(() => { api('/auth/me').then(setUser).catch(() => {}).finally(() => setLoading(false)) }, [])
  if (loading) return <main className="center">Yükleniyor…</main>
  if (!user) return <Login onLogin={setUser} />
  return <Workspace user={user} onLogout={async () => { try { await api('/auth/logout', { method: 'POST' }); setUser(null) } catch { window.alert('Çıkış yapılamadı. Bağlantını kontrol et.') } }} />
}
