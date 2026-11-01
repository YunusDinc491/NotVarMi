import { useEffect, useState } from 'react'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(setUser).catch(() => {}).finally(() => setLoading(false)) }, [])
  async function login(event) {
    event.preventDefault(); setError('')
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-NotVarMi-Request': '1' }, body: JSON.stringify({ username, password }) })
      if (!response.ok) { setError(response.status === 429 ? 'Çok fazla deneme yaptın. Biraz sonra tekrar dene.' : 'Kullanıcı adı veya şifre yanlış.'); return }
      setUser(await response.json()); setPassword('')
    } catch { setError('Sunucuya ulaşılamadı.') }
  }
  async function logout() { try { const response = await fetch('/api/auth/logout', { method: 'POST', headers: { 'X-NotVarMi-Request': '1' } }); if (!response.ok && response.status !== 401) throw new Error(); setUser(null) } catch { setError('Çıkış yapılamadı. Bağlantını kontrol et.') } }
  if (loading) return <main className="center">Yükleniyor…</main>
  if (user) return <main className="shell"><header><span className="brand">notvarmı<span>.</span></span><button className="quiet" onClick={logout}>Çıkış yap</button></header><section className="welcome"><p className="eyebrow">KİŞİSEL ÇALIŞMA ALANIN</p><h1>Merhaba, {user.username}.</h1><p>Derslerin için sakin bir yer hazırlıyoruz.</p>{error && <p className="error" role="alert">{error}</p>}<p className="status">Dersler ve defterler bir sonraki fazda burada olacak.</p></section></main>
  return <main className="login-layout"><section className="intro"><span className="brand">notvarmı<span>.</span></span><div><p className="eyebrow">HER ŞEY BİR ARADA</p><h1>Notların için<br /><em>küçük bir yer.</em></h1><p>Derslerine, dosyalarına ve defterlerine istediğin yerden dön.</p></div><small>KENDİ HIZINDA ÖĞREN.</small></section><section className="form-area"><form onSubmit={login}><div className="icon">✳</div><p className="eyebrow">TEKRAR HOŞ GELDİN</p><h2>Giriş yap</h2><p>Çalışma alanına devam etmek için bilgilerini gir.</p><label>Kullanıcı adı<input autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required /></label><label>Şifre<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>{error && <p className="error" role="alert">{error}</p>}<button type="submit">Defterime git <span>→</span></button></form></section></main>
}
