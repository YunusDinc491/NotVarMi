# NotVarMı Ders Defteri Yazım Rehberi

Bu rehber, NotVarMı sitesindeki ders defterlerinin (ör. "Isı Transferi Ders Notları") hangi tonda, hangi yapıda ve hangi teknik formatta yazılacağını tarif eder. Claude, Codex veya başka bir yapay zekâ ile çalışırken bu dosyayı ve `DEFTER_SABLONU.html` dosyasını birlikte ver. Çıktı tek bir `.html` dosyasıdır; sitede **Düzenle → .html içe aktar → Kaydet** ile yüklenir.

## 1. Çalışma şekli

Öğrenci (Yunus, makine mühendisliği) hocanın el yazısı ünite özetlerinin ekran görüntülerini sayfa sayfa gönderir. Ders kitabı (ör. Incropera 7. baskı) ünite ünite PDF olarak klasörde durur. Her sayfa için:

1. **Hocanın özetindeki her şey eksiksiz** anlatılır. Hiçbir başlık, formül veya not atlanmaz.
2. Özet kitabın ilgili bölümüyle karşılaştırılır. **Kitapta olup özette olmayan önemli bilgiler** eklenir.
3. Hocanın **eksik veya yanlış** yazdığı yerler (işaret hatası, eksik adım, gizli kabul, yanlış denklem numarası, tanımsız sembol) açıkça düzeltilir.
4. Özetteki çizimler anlaşılıp kitaptan bulunur ve gerekiyorsa yeniden çizilir (SVG); faydalıysa etkileşimli/animasyonlu yapılır.
5. Bölüm sonu problemleri **çözülmez**. Konu anlatım örnekleri (Example 3.1 vb.) için çözüm yazılmaz; çözmeye yarayan **anahtarlar ve tüyolar** verilir.
6. Öğrenci farklı üniteye geçince haber verir. Hoca bazen bölüm atlar; bu durum not edilir.

## 2. Ton ve dil

- **Türkçe**, öğretmen gibi anlatan, akıcı **paragraflar**. Kelime kelime alt alta madde yazılmaz; madde listesi sadece gerçekten liste olan şeyler için kullanılır.
- Amaç: öğrenci bir hafta sonra sınavdan önce açıp okuduğunda **neyin neden yazıldığını** anlayabilmeli.
- Kitaptaki terimler ve semboller aynen kullanılır (\(q''_x\), \(T_{s,1}\), \(T_{\infty}\), \(\dot q\) …). Türkçe karşılığı yanında verilir (ör. "taşınım (convection)").
- Gerçek hayattan **analojiler** kullanılır (sızıntısız boru, trafik ve köprüler, termal macun, gitar teli…).
- "Denk. 3.1", "Eq 3.2" gibi numaralarla anlatım yapılmaz; türetme adımları oklarla veya akış zinciriyle gösterilir. Kitap numarası sadece referans gerektiğinde, cümle içinde geçebilir.
- Sık sık **hatırlatma** satırı konur: öğrenci sekiz ders çalışıyor, formüldeki sembollerin ne olduğunu unutabilir.
- Her formülden sonra sembollerin anlamı ve birimleri **tek satırda** verilir (`terms`).

## 3. Kutu türleri (renk anlamı)

| Sınıf | Renk | Ne için |
|---|---|---|
| düz paragraf | — | Hocanın özetindeki içerik |
| `box ek` | yeşil | Kitaptan eklenen bilgi (başlık: "Kitaptan ek:") |
| `box dikkat` | kırmızı | Hocanın hatası/eksiği, gizli kabul, sık yapılan hata |
| `box acik` | kehribar | Açıklama, "neden?", analoji |
| `box sinav` | mavi | Sınav ipucu, soru çözme anahtarı, örnek anahtarı |
| `box hatir` / `p.hatir` | mor | Kısa hatırlatma (sembollerin anlamı vb.) |
| `mark` | sarı vurgu | Hocanın vurguladığı kilit ifade |

Kutu başlığı `<span class="k">…:</span>` ile yazılır. Kutular da paragraf halindedir.

## 4. Sayfa yapısı (HTML)

Defter tek bir `.html` dosyasıdır. Kök `<div class="page">`'dir; her `<section>` sitede **bir sayfa** olur ve sayfalar çevirme animasyonuyla dolaşılır.

```
<div class="page">
  <header> …ders adı, h1, legend… </header>
  <section id="icindekiler"> İçindekiler: her ünite için h3.toc-unit + .roadmap satırları (a href="#bolum-id") </section>
  <hr class="cut">
  <section id="u5-giris" data-chapter="Ünite 5 — …">   ← ünitenin ilk bölümü
    <div class="chapter"><small>Kitap Bölüm 5 · Hoca özeti s. …</small><b>Ünite 5 — …</b></div>
    <span class="src">Hoca özeti s. 2–3 · Kitap s. …</span>
    <h2>…</h2> … içerik …
  </section>
  <hr class="cut">
  <section id="u5-…"> … </section>
</div>
<script> …etkileşimli çizimlerin kodu… </script>
```

Kurallar:
- Her ünite tek defterin içinde, sırayla birbirinin devamıdır. Yeni ünite eklenince **İçindekiler** sayfasına o ünitenin başlığı ve satırları eklenir; ünitenin ilk bölümü `data-chapter` ve `.chapter` bandı taşır.
- Her bölüm `<span class="src">Hoca özeti s. X · Kitap s. Y</span>` ile başlar, sonra `<h2>` gelir. Alt başlıklar `<h3>`.
- Bir bölüm çok uzarsa ikiye bölünebilir (her biri ayrı sayfa olur).
- `id`'ler **bütün defterde benzersiz** olmalı. Yeni ünitede ünite önekini kullan: `u5-giris`, `u5-fig1`, `u5-slider-k` …
- İçindekiler satırları: `<span class="n">5.1</span><span><a href="#u5-…">Başlık</a></span><span class="st on">işlendi</span>`; işlenmeyen konu için `<span class="st">hoca özetinde yok</span>` veya `sırada`.

## 5. Formüller

- MathJax 3 sözdizimi: satır içi `\( … \)`, ayrı satır `\[ … \]`.
- Ayrı satır formül `<div class="eq">\[ … \]</div>`; **en önemli sonuç** formülleri `<div class="eq big">`.
- Formülün hemen altına semboller: `<p class="terms"><span>\(k\): ısı iletim katsayısı [W/m·K]</span><span>…</span></p>`
- Uzun formüller `\begin{aligned} … \\ … \end{aligned}` ile iki satıra bölünür (yatay taşma olmasın).
- Silinen terimler `\cancelto{0}{…}`, adlandırılmış parçalar `\underbrace{…}_{…}` ile gösterilir.
- HTML içinde `<` karakteri harf önünde kullanılmaz: matematikte `\lt`, `\gt` yaz (ör. `\(|x|\lt L\)`), yoksa HTML bozulur.
- Türetmeler adım adım: "neden sildik / neden sabit / hangi sınır koşulu" paragrafla açıklanır.

## 6. Çizimler ve etkileşim

- Çizimler satır içi **SVG** (`<div class="fig"><svg viewBox="0 0 720 H">…</svg><p class="cap">…</p></div>`). Kitap şekli yeniden çiziliyorsa açıklamada "Kitap Şekil X.Y" yazılır.
- Koyu zemin için renkler: metin `#cbd5e1`, ikincil `#94a3b8`, sıcak `#fb7185`, soğuk `#60a5fa`, ısı akışı `#34d399`, vurgu `#fde047`, pembe `#f472b6`, katı dolgu `#22304a`.
- Akan ısı oku: çizgiye `class="flow"` ver (kesikli çizgi animasyonu).
- Etkileşimli çizim: `<div class="controls"><label for="u5-k">k = <span id="v-u5-k"></span> W/m·K<input id="u5-k" type="range" …></label></div>` ve `<div class="readout">…</div>`. Kod sayfanın sonundaki `<script>` içinde, her çizim ayrı bir IIFE: `(function(){ const $=id=>document.getElementById(id); if(!$('u5-k')) return; … })();`
- Etkileşimli hesaplar kitaptaki örnek sonuçlarını varsayılan değerlerde vermeli (kontrol edilebilsin).
- Dış kütüphane, dış resim veya ağ isteği **kullanılmaz** (sitede engellidir). Gerekirse resim `data:` URI olarak gömülür.

## 7. Teknik ortam (site)

- Sitede MathJax 3.2.2 ve yazı tipleri (Shantell Sans 700 başlık, Nunito 400/600/700 gövde, Patrick Hand notlar) **uygulama tarafından** sağlanır. Dosyanın başındaki Google Fonts ve CDN MathJax satırları sadece dosyayı tek başına tarayıcıda açınca önizleme için durur; içe aktarmada otomatik atılır.
- CSS şablondaki gibi kalır (`DEFTER_SABLONU.html` içindeki `<style>`). Yeni bileşen gerekirse aynı renk değişkenleriyle (`--pink`, `--yellow`, `--muted` …) eklenir.
- Defter alanı en fazla 1.000.000 karakter (HTML, CSS, JS ayrı ayrı).
- Teslim: dersin **güncel birleşik defter dosyasının tamamı** (önceki üniteler + yeni ünite + güncellenmiş içindekiler). Öğrenci bu dosyayı içe aktarıp mevcut defterin yerine kaydeder.

## 8. Kontrol listesi (teslimden önce)

- [ ] Hocanın özetindeki her başlık ve formül var mı?
- [ ] Kitaptan önemli ekler ve hoca hatalarının düzeltmeleri kutularda mı?
- [ ] Her formülün altında sembol satırı var mı, ara ara hatırlatma var mı?
- [ ] Paragraflar akıcı mı, gereksiz madde listesi yok mu?
- [ ] Örnekler çözülmeden anahtarlarla mı verildi?
- [ ] İçindekiler güncel mi, bağlantılar doğru `id`'lere gidiyor mu, `id`'ler benzersiz mi?
- [ ] Dosya tarayıcıda açılınca formüller çiziliyor, çizimler çalışıyor, konsolda hata yok mu?
