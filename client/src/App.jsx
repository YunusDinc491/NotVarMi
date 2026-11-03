import { useCallback, useEffect, useRef, useState } from "react";
import Notebook from "./Notebook";
import { exportNotebook } from "./notebookExport";
import "./App.css";

async function api(path, options = {}) {
  const previewMode =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("preview") === "workspace";
  if (previewMode) {
    if (path === "/courses/" && !options.method)
      return [
        { id: 1, name: "Isı Transferi" },
        { id: 2, name: "Akışkanlar Mekaniği" },
        { id: 3, name: "Termodinamik" },
      ];
    const courseId = Number(path.match(/^\/courses\/(\d+)\/?$/)?.[1]);
    if (courseId && !options.method)
      return {
        id: courseId,
        name: {
          1: "Isı Transferi",
          2: "Akışkanlar Mekaniği",
          3: "Termodinamik",
        }[courseId],
        files: [
          {
            id: courseId * 10,
            name: "Ders notları.pdf",
            contentType: "application/pdf",
            size: 1843200,
            createdAt: new Date().toISOString(),
          },
          {
            id: courseId * 10 + 1,
            name: "Chapter 1 Özeti.txt",
            contentType: "text/plain",
            size: 12288,
            createdAt: new Date().toISOString(),
          },
        ],
        contents: [
          { id: courseId * 10 + 2, name: "Ünite 3 — Isı Transferi.pdf", contentType: "application/pdf", size: 2457600, createdAt: new Date().toISOString(), isContent: true },
        ],
      };
    if (/^\/courses\/\d+\/notebooks\/$/.test(path) && !options.method)
      return [
        { id: 0, name: "Dersin temel kavramları" },
        { id: 100, name: "Ünite 3 Ders Notu" },
        { id: 101, name: "Chapter 2 — Örnekler" },
      ];
    if (/^\/courses\/\d+\/notebooks\/\d+$/.test(path) && !options.method)
      return { id: Number(path.split("/").at(-1)), name: "Ünite 3 Ders Notu", html: "<main><h1>Ünite 3 Ders Notu</h1><p>Defter içeriği önizlemesi</p></main>", css: "body{font:16px Arial;padding:32px;color:#222}", javascript: "", version: 0 };
    if (path === "/trash/" && !options.method)
      return { courses: [], files: [] };
  }
  const headers = { ...options.headers };
  if (options.method && options.method !== "GET")
    headers["X-NotVarMi-Request"] = "1";
  if (options.body && !(options.body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const response = await fetch(`/api${path}`, { ...options, headers });
  if (!response.ok) {
    let message =
      response.status === 401
        ? path === "/auth/login"
          ? "Kullanıcı adı veya şifre yanlış."
          : "Oturum süren dolmuş olabilir. Yeniden giriş yap."
        : response.status === 403
          ? "Bu işlem için yetkin yok."
          : [502, 503, 504].includes(response.status)
            ? "Sunucu hazırlanıyor olabilir. Biraz bekleyip tekrar dene."
            : "İşlem tamamlanamadı. Tekrar dene.";
    try {
      message = (await response.json()).message || message;
    } catch {
      /* Empty error response */
    }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}

function Login({ onLogin }) {
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      onLogin(
        await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        }),
      );
    } catch (error) {
      setError(
        error instanceof TypeError
          ? "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene."
          : error.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-layout">
      <section className="intro">
        <span className="brand">
          notvarmı<span>.</span>
        </span>
        <div>
          <h1>
            Yunus Dinç
            <br />
            <em>kişisel not defteridir.</em>
          </h1>
        </div>
      </section>
      <section className="form-area">
        <form onSubmit={submit}>
          <h2>Hoş Geldiniz</h2>
          <p>Çalışma alanına devam etmek için bilgilerini gir.</p>
          <label>
            Kullanıcı adı
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label>
            Şifre
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button disabled={busy} type="submit">
            {busy ? "Giriş yapılıyor…" : "Gel Bakalım"} <span>→</span>
          </button>
        </form>
      </section>
    </main>
  );
}

const formatSize = (size) =>
  size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`;
const fileIcon = (file) =>
  file.contentType.startsWith("image/")
    ? "▧"
    : file.contentType === "application/pdf"
      ? "▤"
      : "▱";

function TextPreview({ file }) {
  const [text, setText] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/files/${file.id}?preview=true`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error(); return response.text(); })
      .then(setText)
      .catch((err) => { if (err.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, [file.id]);
  return <pre className="file-viewer-text-content">{error ? "Not açılamadı." : text === null ? "Yükleniyor…" : text}</pre>;
}

function Workspace({ user, onLogout }) {
  const admin = user.role === "Admin";
  const previewMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("preview") === "workspace";
  const [courses, setCourses] = useState([]),
    [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dialog, setDialog] = useState(null);
  const [route, setRoute] = useState(window.location.pathname);
  const routeRef = useRef(route), dirtyNotebook = useRef(false), routeRequest = useRef(0);
  const courseRoute = route.match(/^\/ders\/(\d+)(?:\/defter\/(\d+))?\/?$/);
  const courseId = courseRoute ? Number(courseRoute[1]) : null;
  const notebookId = courseRoute?.[2] === undefined ? null : Number(courseRoute[2]);
  function navigate(path, skipGuard = false) {
    if (path === routeRef.current) return;
    if (!skipGuard && dirtyNotebook.current && !window.confirm("Kaydedilmemiş defter değişiklikleri var. Ayrılmak istiyor musun?")) return;
    dirtyNotebook.current = false;
    window.history.pushState(null, "", path + window.location.search);
    routeRef.current = path; setRoute(path);
  }
  useEffect(() => {
    function onPop() {
      if (dirtyNotebook.current && !window.confirm("Kaydedilmemiş defter değişiklikleri var. Ayrılmak istiyor musun?")) {
        window.history.pushState(null, "", routeRef.current + window.location.search);
        return;
      }
      dirtyNotebook.current = false;
      routeRef.current = window.location.pathname; setRoute(window.location.pathname);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const [previewFile, setPreviewFile] = useState(null);
  const [downloadBook, setDownloadBook] = useState(null);
  const input = useRef(null), contentInput = useRef(null);
  useEffect(() => {
    if (!previewFile) return;
    const onKeyDown = (event) => { if (event.key === "Escape") setPreviewFile(null); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [previewFile]);
  const refreshCourses = useCallback(
    async () => setCourses(await api("/courses/")),
    [],
  );
  const refreshCourse = useCallback(async (id) => {
    const [course, notebooks] = await Promise.all([
      api(`/courses/${id}`),
      api(`/courses/${id}/notebooks/`),
    ]);
    setSelected({ ...course, notebooks });
  }, []);
  async function createNotebook() {
    const name = window.prompt("Defter adı (ör. Chapter 1 Özeti):")?.trim();
    if (!name) return;
    await perform(async () => {
      await api(`/courses/${selected.id}/notebooks/`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      await refreshCourse(selected.id);
    });
  }
  async function downloadNotebook(format) {
    const book = downloadBook;
    await perform(async () => {
      const path = book.id === 0 ? `/courses/${selected.id}/notebook/` : `/courses/${selected.id}/notebooks/${book.id}`;
      const content = await api(path);
      await exportNotebook({ ...content, name: book.name }, format);
      setDownloadBook(null);
    });
  }
  useEffect(() => {
    const requestId = ++routeRequest.current;
    setError(""); setPreviewFile(null); setDialog(null);
    if (courseId !== null) {
      setSelected(null); setLoading(true);
      Promise.all([api(`/courses/${courseId}`), api(`/courses/${courseId}/notebooks/`)])
        .then(([course, notebooks]) => {
          if (requestId !== routeRequest.current) return;
          if (notebookId !== null && !notebooks.some((book) => book.id === notebookId)) throw new Error("Defter bulunamadı.");
          setSelected({ ...course, notebooks });
        })
        .catch((e) => { if (requestId === routeRequest.current) setError(e.message); })
        .finally(() => { if (requestId === routeRequest.current) setLoading(false); });
    } else {
      setSelected(null); setLoading(false);
      if (route !== "/") setError("Sayfa bulunamadı.");
    }
  }, [route, courseId, notebookId, admin]);
  useEffect(() => {
    refreshCourses().catch((e) => setError(e.message));
  }, [refreshCourses]);
  async function perform(action) {
    setError("");
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function askCourse(course = null) {
    setDialog({ kind: "course", value: course?.name ?? "", course });
  }
  async function saveDialog(event) {
    event.preventDefault();
    const current = dialog;
    await perform(async () => {
      if (current.kind === "course") {
        const path = current.course
          ? `/courses/${current.course.id}`
          : "/courses/";
        await api(path, {
          method: current.course ? "PUT" : "POST",
          body: JSON.stringify({ name: current.value }),
        });
        await refreshCourses();
        if (selected && current.course?.id === selected.id)
          await refreshCourse(selected.id);
      } else if (current.kind === "instructor") {
        await api(`/courses/${selected.id}/instructor`, {
          method: "PUT",
          body: JSON.stringify({ instructor: current.value }),
        });
        await refreshCourse(selected.id);
      } else if (current.file) {
        await api(`/files/${current.file.id}/text`, {
          method: "PUT",
          body: JSON.stringify({ text: current.text }),
        });
        await refreshCourse(selected.id);
      } else {
        const data = new FormData();
        data.append(
          "file",
          new Blob([current.text], { type: "text/plain" }),
          `${current.value.trim().replace(/\.txt$/i, "")}.txt`,
        );
        data.append("content", "false");
        await api(`/courses/${selected.id}/files`, {
          method: "POST",
          body: data,
        });
        await refreshCourse(selected.id);
      }
      setDialog(null);
    });
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 95 * 1024 * 1024) {
      setError("Dosya 95 MB sınırını aşıyor.");
      return;
    }
    await perform(async () => {
      const data = new FormData();
      data.append("file", file);
      data.append("content", "false");
      data.append("content", "false");
      await api(`/courses/${selected.id}/files`, {
        method: "POST",
        body: data,
      });
      await refreshCourse(selected.id);
    });
  }
  async function uploadContent(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Ders içeriği yalnızca PDF olabilir.");
      return;
    }
    if (file.size > 95 * 1024 * 1024) {
      setError("PDF 95 MB sınırını aşıyor.");
      return;
    }
    await perform(async () => {
      const data = new FormData();
      data.append("file", file);
      data.append("content", "true");
      await api(`/courses/${selected.id}/files`, { method: "POST", body: data });
      await refreshCourse(selected.id);
    });
  }
  async function moveCourse(course) {
    if (
      !window.confirm(
        `“${course.name}” dersi ve tüm içeriği kalıcı olarak silinecek. Emin misin? Bu işlem geri alınamaz.`,
      )
    )
      return;
    await perform(async () => {
      await api(`/courses/${course.id}`, { method: "DELETE" });
      navigate("/");
      await refreshCourses();
    });
  }
  async function moveFile(file) {
    if (!window.confirm(`“${file.name}” kalıcı olarak silinecek. Emin misin? Bu işlem geri alınamaz.`))
      return;
    await perform(async () => {
      await api(`/files/${file.id}`, { method: "DELETE" });
      await refreshCourse(selected.id);
    });
  }
  async function editNote(file) {
    await perform(async () => {
      const response = await fetch(`/api/files/${file.id}?preview=true`);
      if (!response.ok) throw new Error("Not açılamadı.");
      const text = await response.text();
      setDialog({ kind: "note", file, value: file.name, text });
    });
  }
  function home() {
    navigate("/");
  }
  return (
    <div className="workspace">
      <header className="topbar">
        <button className="brand brand-button" onClick={home}>
          notvarmı<span>.</span>
        </button>
        <div className="top-actions">
          <span className="user-chip">{admin ? "Yönetici" : "Misafir"}</span>
          <button className="text-button" onClick={onLogout}>
            Çıkış yap ↗
          </button>
        </div>
      </header>
      <main className="content">
        <div className="crumb">
          <button onClick={home}>Dersler</button>
          {selected && (
            <>
              {" "}
              <span>/</span> {selected.name}
            </>
          )}
        </div>
        {error && (
          <div className="notice" role="alert">
            {error}
            <button onClick={() => setError("")} aria-label="Kapat">
              ×
            </button>
          </div>
        )}
        {loading ? (
          <p className="muted">Yükleniyor…</p>
        ) : selected ? (
          <>
            <div className="heading">
              <div>
                <p className="eyebrow">DERSİNİN ALANI</p>
                <div className="course-title">
                  <h1>
                    {selected.name}
                    <span className="accent">.</span>
                  </h1>
                  {admin && (
                    <button className="course-rename" onClick={() => askCourse(selected)} aria-label="Ders adını değiştir" title="Ders adını değiştir">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
                    </button>
                  )}
                </div>
                <div className="course-instructor">
                  <p>{selected.instructor || "Hoca adı eklenmedi"}</p>
                  {admin && (
                    <button className="course-rename" onClick={() => setDialog({ kind: "instructor", value: selected.instructor || "" })} aria-label="Hoca adını değiştir" title="Hoca adını değiştir">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
                    </button>
                  )}
                </div>
              </div>
              {admin && (
                <div className="heading-actions">
                  <button
                    className="outline danger-link"
                    onClick={() => moveCourse(selected)}
                  >
                    Dersi sil
                  </button>
                </div>
              )}
            </div>
            <section className="notebook-banner">
              <div className="notebook-list-head">
                <div><p className="eyebrow">DERS DEFTERLERİ</p><h2>Defterler <span>{selected.notebooks?.length ?? 0}</span></h2></div>
                {admin && <button className="primary" onClick={createNotebook}>＋ Yeni defter</button>}
              </div>
              <div className="notebook-cards">
                {(selected.notebooks ?? []).map((book, index) => (
                  <article className="glass-notebook" key={book.id}>
                    <div className="glass-book-top"><span>{book.name}</span><span className="book-index">{String(index + 1).padStart(2, "0")}</span></div>
                    <button className="notebook-download" type="button" aria-label={`${book.name} defterini indir`} title="Defteri indir" disabled={busy} onClick={() => setDownloadBook(book)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 19h14"/></svg></button>
                    {admin && <button className="notebook-delete" type="button" aria-label={`${book.name} defterini sil`} title="Defteri sil" disabled={busy} onClick={() => { if (window.confirm(`“${book.name}” defteri kalıcı olarak silinecek. Devam edilsin mi?`)) perform(async () => { await api(`/courses/${selected.id}/notebooks/${book.id}`, { method: "DELETE" }); await refreshCourse(selected.id) }) }}>×</button>}
                    <div className="paper-stack"><span></span><span></span><span></span></div>
                    <div className="glass-book-bottom"><button onClick={() => navigate(`/ders/${selected.id}/defter/${book.id}`)}>Defteri aç →</button></div>
                  </article>
                ))}
                {!selected.notebooks?.length && <div className="empty">Henüz defter yok. “Yeni defter” ile bölüm bölüm oluşturabilirsin.</div>}
              </div>
              <section className="pdf-content-section">
                <div className="pdf-content-head">
                  <div><p className="eyebrow">DERS İÇERİKLERİ</p><h2>PDF içerikler <span>{selected.contents?.length ?? 0}</span></h2></div>
                  {admin && <><button className="outline" disabled={busy} onClick={() => contentInput.current?.click()}>＋ İçerik ekle</button><input ref={contentInput} type="file" hidden accept="application/pdf,.pdf" onChange={uploadContent} /></>}
                </div>
                <p className="helper">PDF’ler bu sayfada açılır pencerede görüntülenir.</p>
                <div className="pdf-content-list">
                  {(selected.contents ?? []).map(file => <button className="pdf-content-card" key={file.id} onClick={() => setPreviewFile(file)}><span className="file-symbol">▤</span><span><strong>{file.name}</strong><small>{formatSize(file.size)}</small></span><span className="pdf-open-mark">↗</span></button>)}
                  {!selected.contents?.length && <div className="empty">Henüz PDF içerik eklenmemiş.</div>}
                </div>
              </section>
            </section>
            <section className="files-section">
              <div className="section-title">
                <div>
                  <p className="eyebrow">DERS MATERYALLERİ</p>
                  <h2>
                    Notlar ve dosyalar <span>{selected.files.length}</span>
                  </h2>
                </div>
                {admin && (
                  <div className="heading-actions">
                    <button
                      className="outline"
                      disabled={busy}
                      onClick={() =>
                        setDialog({ kind: "note", value: "", text: "" })
                      }
                    >
                      ＋ Not ekle
                    </button>
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() => input.current?.click()}
                    >
                      ＋ Dosya yükle
                    </button>
                    <input
                      ref={input}
                      type="file"
                      hidden
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      onChange={upload}
                    />
                  </div>
                )}
              </div>
              <p className="helper">
                PDF, resim, metin ve Office dosyaları · Dosya başına en fazla 95
                MB
              </p>
              {[
                { title: "Notlar", files: selected.files.filter((file) => file.contentType === "text/plain") },
                { title: "PDF dosyaları", files: selected.files.filter((file) => file.contentType === "application/pdf") },
                { title: "Diğer dosyalar", files: selected.files.filter((file) => file.contentType !== "text/plain" && file.contentType !== "application/pdf") },
              ].filter((group) => group.files.length > 0).map((group) => (
              <div className="file-group" key={group.title}>
                <h3>{group.title}</h3>
                <div className="file-list">
                {group.files.sort((a, b) => a.name.localeCompare(b.name, "tr", { numeric: true, sensitivity: "base" })).map((file) => (
                  <div className="file-row" key={file.id}>
                    <span className="file-symbol">{fileIcon(file)}</span>
                    <div className="row-title">
                      <strong>{file.name}</strong>
                      <small>
                        {formatSize(file.size)} ·{" "}
                        {new Date(
                          file.createdAt +
                            (file.createdAt.endsWith("Z") ? "" : "Z"),
                        ).toLocaleDateString("tr-TR")}
                      </small>
                    </div>
                    {(file.contentType === "application/pdf" ||
                      file.contentType === "text/plain" ||
                      file.contentType.startsWith("image/")) && (
                      <button type="button" onClick={() => setPreviewFile(file)}>
                        Görüntüle
                      </button>
                    )}
                    <a href={`/api/files/${file.id}`} download>
                      İndir
                    </a>
                    {admin && file.contentType === "text/plain" && (
                      <button onClick={() => editNote(file)}>Düzenle</button>
                    )}
                    {admin && (
                      <button
                        className="danger-link"
                        onClick={() => moveFile(file)}
                      >
                        Sil
                      </button>
                    )}
                  </div>
                ))}
                </div>
              </div>
              ))}
              {!selected.files.length && (
                <div className="file-list">
                  <div className="empty">
                    Henüz bir dosya yok.{" "}
                    {admin && "İlk notunu veya dosyanı ekleyebilirsin."}
                  </div>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <div className="heading">
              <div>
                <p className="eyebrow">KENDİ HIZINDA ÖĞREN</p>
                <h1>
                  Dersler<span className="accent">.</span>
                </h1>
                <p>Bugün hangi derse göz atmak istersin?</p>
              </div>
              {admin && (
                <button className="primary" onClick={() => askCourse()}>
                  ＋ Yeni ders
                </button>
              )}
            </div>
            <div className="course-grid">
              {courses.map((course, index) => (
                <button
                  className={`course-card tone-${index % 4}`}
                  key={course.id}
                  onClick={() => navigate(`/ders/${course.id}`)}
                >
                  <span className="card-top">
                    <span className="course-icon">▥</span>
                    <span className="card-arrow">↗</span>
                  </span>
                  <span className="card-bottom">
                    <small>DERS {String(index + 1).padStart(2, "0")}</small>
                    <strong>{course.name}</strong>
                    <span>Notlara git →</span>
                  </span>
                </button>
              ))}
              {!courses.length && (
                <div className="empty">Henüz ders eklenmemiş.</div>
              )}
            </div>
            <div className="footer-note">
              <span>✳</span> Küçük adımlar, güzel başlangıçlar.
            </div>
          </>
        )}
      </main>
      {downloadBook && (
        <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDownloadBook(null); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="download-title">
            <div className="modal-head"><h2 id="download-title">Defteri indir</h2><button type="button" onClick={() => setDownloadBook(null)} aria-label="Kapat" disabled={busy}>×</button></div>
            <p>“{downloadBook.name}” için dosya biçimini seç.</p>
            <p className="download-help">PDF için açılan yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullan.</p>
            <div className="modal-actions"><button className="outline" type="button" disabled={busy} onClick={() => downloadNotebook('html')}>HTML indir</button><button className="primary" type="button" disabled={busy} onClick={() => downloadNotebook('pdf')}>PDF olarak kaydet</button></div>
          </div>
        </div>
      )}
      {previewFile && (
        <div className="file-viewer-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewFile(null); }}>
          <section className={`file-viewer${previewFile.contentType === "text/plain" ? " file-viewer-text" : ""}`} role="dialog" aria-modal="true" aria-label={`${previewFile.name} önizlemesi`}>
            <header className="file-viewer-header">
              <button type="button" autoFocus onClick={() => setPreviewFile(null)} aria-label="Önizlemeyi kapat" title="Kapat">×</button>
              <strong title={previewFile.name}>{previewFile.name}</strong>
            </header>
            {previewMode ? <div className="pdf-preview-placeholder"><div className="file-symbol">▤</div><h2>PDF önizlemesi</h2><p>Örnek arayüz önizlemesinde gerçek dosya bağlı değil. Gerçek yüklenen PDF burada açılır.</p></div> : previewFile.contentType === "text/plain" ? <TextPreview key={previewFile.id} file={previewFile} /> : <iframe className="file-viewer-content" title={`${previewFile.name} içeriği`} src={`/api/files/${previewFile.id}?preview=true`} />}
          </section>
        </div>
      )}
      {notebookId !== null && selected && selected.id === courseId && (
        <Notebook
          course={selected}
          initialNotebook={selected.notebooks.find((book) => book.id === notebookId)}
          admin={admin}
          request={api}
          onDirtyChange={(dirty) => { dirtyNotebook.current = dirty; }}
          onSelectBook={(book) => navigate(`/ders/${selected.id}/defter/${book.id}`, true)}
          onClose={() => navigate(`/ders/${selected.id}`, true)}
        />
      )}
      {dialog && (
        <div
          className="overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !busy) setDialog(null);
          }}
        >
          <form className="modal" onSubmit={saveDialog}>
            <div className="modal-head">
              <h2>
                {dialog.kind === "instructor" ? "Hoca adını düzenle" : dialog.kind === "note"
                  ? dialog.file
                    ? "Notu düzenle"
                    : "Yeni not"
                  : dialog.course
                    ? "Dersi düzenle"
                    : "Yeni ders"}
              </h2>
              <button
                type="button"
                onClick={() => setDialog(null)}
                aria-label="Kapat"
              >
                ×
              </button>
            </div>
            <label>
              {dialog.kind === "instructor" ? "Hoca adı" : dialog.kind === "note" ? "Not başlığı" : "Ders adı"}
              <input
                autoFocus
                maxLength={dialog.kind === "note" ? 150 : 100}
                value={dialog.value}
                disabled={!!dialog.file}
                onChange={(e) =>
                  setDialog({ ...dialog, value: e.target.value })
                }
                required={dialog.kind !== "instructor"}
              />
            </label>
            {dialog.kind === "note" && (
              <label>
                Notun
                <textarea
                  rows="8"
                  value={dialog.text}
                  onChange={(e) =>
                    setDialog({ ...dialog, text: e.target.value })
                  }
                  required
                />
              </label>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button
                className="outline"
                type="button"
                onClick={() => setDialog(null)}
              >
                Vazgeç
              </button>
              <button className="primary" disabled={busy} type="submit">
                {busy ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    if (
      import.meta.env.DEV &&
      new URLSearchParams(window.location.search).get("preview") === "workspace"
    ) {
      setUser({ username: "yunusdinc", role: "Admin" });
      setLoading(false);
      return;
    }
    api("/warmup").catch(() => {});
    api("/auth/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <main className="center">Yükleniyor…</main>;
  if (!user) return <Login onLogin={setUser} />;
  return (
    <Workspace
      user={user}
      onLogout={async () => {
        try {
          await api("/auth/logout", { method: "POST" });
          setUser(null);
        } catch {
          window.alert("Çıkış yapılamadı. Bağlantını kontrol et.");
        }
      }}
    />
  );
}
