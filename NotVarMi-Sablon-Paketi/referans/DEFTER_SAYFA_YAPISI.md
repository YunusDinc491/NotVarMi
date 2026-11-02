# NotVarMı — Defter sayfa yapısı

Bu belge, sitedeki defterin devamını yazarken yapının birebir aynı kalması için hazırlandı. Referans defter **Isı Transferi Ders Notları**, referans sürüm `e6ee63c` (2 Kasım 2026). Referans dosyalar:

| Dosya | Görevi |
|---|---|
| `server/NotVarMi.Api/Content/Notebooks/heat-defter.html` | Defterin içeriği |
| `server/NotVarMi.Api/Content/Notebooks/heat-defter.css` | Defterin görünümü |
| `server/NotVarMi.Api/Content/Notebooks/heat-defter.js` | Etkileşimli çizimler |
| `client/public/vendor/notebook/pager.js`, `pager.css` | Sayfalara bölme, sayfa çevirme, içindekiler menüsü |
| `client/src/Notebook.jsx` | İçeriği iframe belgesine dönüştürme, içe aktarma |
| `server/NotVarMi.Api/Data/NotebookSeed.cs` | Dosyadaki defteri veritabanına ekleme |

Bu belgeyle kod çelişirse kod doğrudur. Yazmaya başlamadan önce `heat-defter.html` içinden yeni konuya en yakın bir sayfayı okuyup örnek al.

**Bugünkü boyut:** 24 sayfa, 2 ünite (3 ve 4), 866 formül, 20 şekil kutusu, 9 etkileşimli kontrol grubu. HTML yaklaşık 155.000 karakter; alan başına sınır 1.000.000.

---

## 1. Değişmez kurallar

1. Yeni içerik **aynı defterin devamıdır**: yeni dosya, yeni tema veya yeni kütüphane yok. Üniteler `heat-defter.*` dosyalarına eklenir.
2. Her `<section>` bir defter sayfasıdır. İçinde mutlaka bir `<h2>` olur ve `<h2>` içinde formül olmaz.
3. Sayfalar arasına `<hr class="cut">` konur; yeni bir ünitenin ilk sayfası `data-chapter` taşır.
4. Düz yazı **hocanın özetidir**. Kitaptan veya senden gelen her şey renkli bir kutuya girer. Bu ayrım defterin en önemli özelliğidir.
5. Formül `\( \)` ve `\[ \]` ile yazılır. Dışarıdan hiçbir şey yüklenemez: CDN, Google Fonts, URL'den resim çalışmaz.
6. Çizimler elle yazılmış SVG'dir (`viewBox="0 0 720 …"`); SVG yazısında LaTeX değil Unicode kullanılır (`T∞,1`, `h₁`, `q″`).
7. Renkler ve bileşenler aşağıdaki listeden seçilir. Yeni sınıf yalnızca mevcut bileşen gerçekten yetmiyorsa eklenir.
8. Yeni JavaScript mevcut koda dokunmadan dosyanın **sonuna**, korumalı bir IIFE olarak eklenir; id'ler defter genelinde benzersiz olur.

---

## 2. Çalışma zinciri

Defter üç metin alanı olarak saklanır: `html`, `css`, `javascript`. `Notebook.jsx` içindeki `frameDocument` bunları şu sırayla tek belgede birleştirir:

```text
<head>
  CSP meta etiketi
  /vendor/fonts/notebook-fonts.css      Shantell Sans 700, Nunito 400/600/700, Patrick Hand 400
  /vendor/notebook/pager.css
  MathJax yapılandırması + tex-svg-full.js (defer; yalnızca HTML alanında formül varsa)
  <style> css alanı </style>
</head>
<body>
  html alanı
  <script> javascript alanı </script>
  /vendor/notebook/pager.js             (içerik ve içerik betiğinden sonra çalışır)
</body>
```

Bu yüzden:

- İçerik `sandbox="allow-scripts"` iframe'inde çalışır: `localStorage`, çerez, `fetch` kullanılamaz. Durum saklanacak yer yoktur; çizimler her açılışta varsayılan değerle başlar.
- İzinli kaynaklar yalnızca satır içi kod, `/vendor/` dosyaları ve `data:`/`blob:` görsellerdir.
- Betik önce çalışır, sayfalayıcı öğeleri sonra sayfalara taşır, MathJax en son dizer. İçerik betiği öğeleri `getElementById` ile bulabilir; sayfa yapısına (`.nb-sheet`) bağımlı olamaz.
- MathJax sayfa yüklenirken bir kez çalışır. **JavaScript'in sonradan yazdığı metindeki LaTeX dizilmez**; orada Unicode kullan (örnek: Gauss-Seidel tablosundaki `x₁`).

Sayfalayıcı şunları sağlar, içerikten ayrıca yazılmaz: sayfa çevirme animasyonu, alt gezinme çubuğu, üstte ilerleme çubuğu, içindekiler menüsü, ok/PageUp/PageDown/Home/End tuşları, dokunmatik kaydırma, `#id` bağlantıları, yazdırma düzeni, hareket azaltma tercihi.

---

## 3. Defter iskeleti

```html
<div class="page">
  <header style="display:flex;flex-direction:column;gap:8px">
    <p class="sub">Isı Transferi · Incropera 7. baskı</p>
    <h1>Isı Transferi Ders Notları</h1>
    <div class="legend">…renk açıklamaları…</div>
  </header>

  <section id="icindekiler">…</section>            <!-- 1. sayfa: header + içindekiler -->

  <!-- ============ SAYFA 2–3 ============ -->
  <hr class="cut">
  <section id="giris" data-chapter="Ünite 3 — …">  <!-- ünitenin ilk sayfası -->
    <div class="chapter" id="ünite3">…</div>
    …
  </section>

  <!-- ============ SAYFA 4–5 ============ -->
  <hr class="cut">
  <section id="duzlem-duvar">…</section>

  <hr class="cut">
  <p class="box dikkat" style="margin-top:14px">…ünite sonu notu…</p>   <!-- isteğe bağlı -->

  <!-- ============ SAYFA 2 ============ -->
  <hr class="cut">
  <section id="neden-2b" data-chapter="Ünite 4 — …">…</section>
</div>
```

- Tek kök `<div class="page">` vardır, yeni içerik onun kapanış `</div>` etiketinden hemen önce eklenir.
- Yorumdaki `SAYFA` numarası **hoca özetinin** sayfasıdır, defter sayfası değil; her ünitede baştan başlar. Biçim: `<!-- ============ SAYFA 4–6 ============ -->`, aralıkta uzun tire `–`. Hoca sayfasına karşılık gelmeyen bölümde konu yazılır: `<!-- ============ DOĞRULUK (kitap 4.5.2) ============ -->`.
- Girinti 2 boşluk. `section` altı 4 boşluk. Paragraflar tek satırda yazılır, satır uzunluğu sınırı yoktur.
- Konular arasında boş satır bırakılabilir; başlıklardan önce çoğunlukla bırakılır.

### Sayfalara bölünme kuralı

`pager.js`, `.page` altındaki doğrudan çocukları gezer: `hr` atlanır, her yeni `section` yeni sayfa açar. `section` dışındaki öğeler bir önceki sayfaya eklenir. Sonuçları:

- `header`, ardından gelen ilk `section` ile aynı sayfadadır.
- Ünite sonu kutusu (`section` dışındaki `p.box`) bir önceki sayfanın sonuna düşer. `section` aralığı (`gap`) dışında kaldığı için `style="margin-top:14px"` gerekir.
- `data-page` özniteliğini kullanma: bir tane bile varsa sayfalayıcı yalnızca `data-page` taşıyan öğeleri sayfa sayar, geri kalan sayfalar kaybolur.
- Sayfanın yüksekliği sabit değildir; uzun sayfa kendi içinde kaydırılır (referansta en uzun sayfa `duzlem-duvar`, yaklaşık 100 satır HTML).

### Sayfaya ne kadar içerik?

Bir sayfa, kitabın bir alt bölümü veya hocanın 1–3 sayfalık tek konusudur. Çok uzun bir konu bölünür (4.2 → "Değişkenlere Ayırma" ve "4 Sınır Koşulunun Uygulanması"; 4.4 → 4.4, 4.4.1, 4.4.2, 4.4.3). Çok kısa bölüm de ayrı sayfa olabilir (`4.5.2` yalnızca tek kutudur).

---

## 4. Sayfa anatomisi

Her sayfa aynı sırayla başlar:

```html
<section id="isil-direnc">
  <span class="src">Hoca özeti s. 6 · Kitap 3.1.2, s. 114–115</span>
  <h2>3.1.2 Isıl Direnç</h2>
  <p>Bir önceki konuya bağlanan giriş paragrafı…</p>
  …
</section>
```

Ünitenin ilk sayfasında `.chapter` bandı `.src` etiketinden önce gelir.

Tipik akış:

1. **Giriş paragrafı:** önceki konuya bağlanır, ne yapılacağını söyler.
2. **Yol haritası veya şekil:** gerekiyorsa `.chain` ya da `.fig`.
3. **`<h3>` alt başlıkları:** adım adım türetme. Her adımda *cümle → formül → semboller satırı → kutu* ritmi.
4. **Sonuç formülü:** `.eq.big`.
5. **Fiziksel anlam:** `.box.acik`, örneğin analoji.
6. **Kitap tamamlaması:** `.box.ek`.
7. **Kapanış:** sayfa genellikle sınav kutusuyla biter (`.box.sinav`).

Başlık kuralları:

- `<h2>`: kitap numarası + konu (`3.1 Düzlem Duvar — Sıcaklık Dağılımı`), örnekte `Örnek 4.1 — Eksantrik Tel Yalıtımı`. Numarası olmayan konu da olabilir (`Neden 1-B'den 2-B'ye?`). Bu metin içindekiler menüsünde ve alt çubukta görünür, bu yüzden formül içermez ve fazla uzun olmaz.
- `<h3>`: anlatımı taşıyan cümle gibidir (`Genel ısı denkleminden başlıyoruz`, `Hocanın "why?" sorusu: Neden \(q\) sabit?`). Formül içerebilir. Örneklerde `Adım 1: …` biçimi kullanılır.
- `id`: ASCII, küçük harf, tireli konu adı (`duzlem-duvar`, `ornek-41`). Ünite bandının id'si: `ünite3`, `ünite4`.

---

## 5. Bileşenler

Parantez içindeki sayı referans defterdeki kullanım adedidir ve ne kadar sık kullanılması gerektiğini gösterir.

### Kaynak etiketi `.src` (23)

```html
<span class="src">Hoca özeti s. 12–13 · Kitap 3.5 ve 3.5.1, s. 144–148</span>
```

Her sayfada `<h2>` önünde bulunur. Biçim sabittir: `Hoca özeti s. X · Kitap <bölüm>, s. Y`. Ayraç orta nokta `·`. Sayfa numarası uydurulmaz; bilinmiyorsa yazılmaz.

### Ünite bandı `.chapter` (ünite başına 1)

```html
<section id="giris" data-chapter="Ünite 3 — Tek Boyutlu, Kararlı Rejimde İletim">
  <div class="chapter" id="ünite3"><small>Incropera Bölüm 3 · Hoca özeti s. 2–14</small><b>Ünite 3 — Tek Boyutlu, Kararlı Rejimde İletim</b></div>
```

`data-chapter` içindekiler menüsünde grup başlığı olur. Metni `.chapter b` ile aynıdır.

### Vurgu

| Öğe | Anlamı |
|---|---|
| `<mark>` (60) | Hocanın altını çizdiği, kitapta da önemli cümle. Sayfa başına birkaç tane, cümle parçası düzeyinde. |
| `<b>` (236) | Terim, tanım, anahtar sözcük. Kutu içinde kutunun rengini alır. |
| `<b class="r">` (1) | Gizli kabul gibi nadir kırmızı uyarı. |
| `<i>` (1) | Nadir, sözcük vurgusu. |

### Formül `.eq` (49) ve `.eq.big` (29)

```html
<div class="eq">\[ q''_x=-k\frac{dT}{dx} \]</div>
<div class="eq big">\[ q_x = \frac{kA}{L}\left(T_{s,1}-T_{s,2}\right) \]</div>
```

- `.eq`: ara adım, kendi satırında.
- `.eq.big`: pembe kesik çerçeve, **akılda kalması gereken sonuç**. Her ara adıma konmaz.
- Metin içi formül yalnızca `\( … \)`. Tek başına dolaşan `\[ … \]` yalnızca kutu içinde kullanılır (`p.box` içinde örnek var).

### Semboller satırı `.terms` (28)

Yeni sembol içeren formülün hemen altına gelir; sembol, anlam ve köşeli parantezde birim verir:

```html
<p class="terms"><span>\(q_x\): ısı hızı [W]</span><span>\(q''_x\): ısı akısı [W/m²]</span><span>\(A\): akışa <b>dik</b> alan [m²]</span></p>
```

### Renkli kutular

Yapı her zaman aynıdır: `<p class="box TÜR"><span class="k">Etiket:</span> metin…</p>`

| Sınıf | Renk | Kullanım | Tipik etiket | Adet |
|---|---|---|---|---|
| `box ek` | yeşil | Kitaptan tamamlama, hocanın atladığı | `Kitaptan ek:`, `Kitaptan ek, konu:`, `Kitaptan ek (3.5.3):`, `Kitabın yorumları:` | 38 |
| `box acik` | turuncu | Sezgi, analoji, fiziksel neden | `Analoji:`, `Fiziksel neden:`, `Formülü okumak:`, soru biçiminde başlık (`İşaret neden döndü?`) | 23 |
| `box sinav` | mavi | Sınav ipucu, soru çözme anahtarı | `Sınavda:`, `Soru çözme anahtarı:`, `Ezber kolaylığı:`, `Örnek 3.1, konu:` | 19 |
| `box dikkat` | kırmızı | Hocadaki hata, eksik, tuzak | `Küçük düzeltme:`, `Gizli kabul!`, `Eksik:`, `İşarete dikkat:`, `Hocanın notu:` | 14 |
| `hatir` | mor | Eski konu veya matematik hatırlatması | `Hatırlatma:` | 6 |

Etiket iki nokta ile biter (`Gizli kabul!` gibi ünlemli veya soru biçimli olanlar hariç). Kutu `<p>` olduğu için içine `<div>`, tablo veya liste konmaz. Kutu içinde `\[ \]` kullanılabilir.

> **`hatir` özel durumu:** referans defterde `<p class="hatir">` olarak, `box` sınıfı **olmadan** yazılmıştır; kenarlığı ve iç boşluğu yoktur, düz mor zeminli paragraf görünür. Tutarlılık için aynı biçimi kullan (bkz. Bölüm 14).

### Akış zinciri `.chain` (1)

Bir türetmenin yol haritası. Düğümler ve oklar sırayla gelir; son düğüm `.end`:

```html
<div class="chain">
  <span class="node">Genel ısı<br>denklemi</span>
  <span class="arr">1-B, \(\dot q=0\),<br>kararlı</span>
  <span class="node">\(T=C_1x+C_2\)</span>
  <span class="arr">Fourier<br>yasası</span>
  <span class="node end">\(q_x,\ q''_x\)</span>
</div>
```

Ok işaretini CSS ekler. Az kullanılır, büyük bir konunun başına uygundur.

### Tablo `.tw > table.t` (10)

```html
<div class="tw"><table class="t">
  <tr><th>Elektrik</th><th>Isı</th></tr>
  <tr><td>Akım \(i\) [A]</td><td>Isı transfer hızı \(q\) [W]</td></tr>
</table></div>
```

`.tw` dar ekranda yatay kaydırma sağlar, atlanmaz. Kitaptan eklenen satır: `<tr style="background:rgba(6,78,59,.28)">`. `thead`/`tbody` yazılmaz.

### Liste

Nadirdir (1 kez). Madde madde anlatım yerine paragraf ve `(1) … (2) …` sıralaması tercih edilir: `<ul style="margin:0;padding-left:22px">`.

### Şekil `.fig` (20)

```html
<div class="fig">
  <svg viewBox="0 0 720 300" role="img" aria-label="Şeklin kısa Türkçe anlatımı">…</svg>
  <div class="controls">…</div>                 <!-- etkileşimliyse -->
  <div class="readout">…</div>                  <!-- etkileşimliyse -->
  <p class="cap">Şeklin ne gösterdiği, kaydırıcıyla ne denenebileceği.</p>
</div>
```

`.cap` metni kitap şeklini kaynak gösterir (`Kitap Şekil 3.2'nin yeniden çizimi.`) ve yorumu da içerir. Hesaplanan tablo da `.fig` içinde durabilir (`.tw` + `.controls` + `.cap`).

### Kaydırıcı `.controls` (9) ve sonuç `.readout` (4)

```html
<div class="controls">
  <label for="sK">k = <span id="vK"></span> W/m·K<input id="sK" type="range" min="0.1" max="5" step="0.1" value="1.4"></label>
</div>
<div class="readout"><span>q″ = <b id="oFlux"></b> W/m²</span></div>
```

`label` hem metni hem `input`'u sarar. Değer `<span id="v…">`, sonuç `<b id="…">` içine betikle yazılır. Metinler boş bırakılır, betik doldurur. Bu alanlarda LaTeX değil Unicode kullanılır. Yazdırmada `.controls` gizlenir.

### Yalnızca ilk sayfada

| Öğe | Yapı |
|---|---|
| `.legend` | Renk açıklamaları; yeni kutu türü yoksa değişmez |
| `h3.toc-unit` | `<h3 class="toc-unit"><a href="#giris">Ünite 3 — …</a></h3>` |
| `.roadmap` | Üç sütun: `<span class="n">3.1</span><span><a href="#id">Konu</a></span><span class="st on">işlendi</span>` |

İşlenmeyen konu: bağlantı yok, durum `<span class="st">hoca özetinde yok</span>`.

---

## 6. Yazım dili

Defter, konuyu sıfırdan anlayıp sınava hazırlanacak bir öğrenci için yazılır. Hocanın özetini kopyalamaz, açar.

- **Dil ve hitap:** Türkçe, samimi ama ciddi. Okura "sen" diye hitap edilir (`düşün`, `aklında tut`, `kaydırıcıları oynat`). Anlatım "biz" kipindedir (`sildik`, `göreceğiz`, `dönüyoruz`). Bazen kişisel not: `Çözümleri yazmıyorum, ama…`
- **Hoca üçüncü tekil:** `Hoca … diyor`, `Hocanın çizdiği…`, `Hoca yazmamış; kitaptaki…`. Hocanın vurguladığı cümle `<mark>` ile işaretlenir.
- **Adım atlanmaz:** her cebirsel geçiş nedeniyle söylenir (`\(y\) ve \(z\) terimlerini sistem tek boyutlu olduğu için sildik`). Hocanın sorduğu "why?" soruları ayrı başlık olarak yanıtlanır.
- **Sezgi:** soyut kavram günlük hayata bağlanır (sızıntısız boru, köprü trafiği, dağ haritası) ve `.box.acik` içine yazılır.
- **Terimler:** Türkçe terim önce gelir, İngilizcesi parantezde verilir (`kararlı rejim (steady-state, SS)`, `sınır koşulu (BC)`). Hocanın kısaltmaları (HT, HD, SS) ilk geçtiği yerde açıklanır.
- **Sayılar:** ondalık ayırıcı **nokta** (`0.2 m`, `1.4 W/m·K`, `1526.0 K`). Birim sayıdan boşlukla ayrılır (`80 °C`, `420 W/m²`). Bileşik birimde `·` kullanılır. Değişkenin birimi köşeli parantezde verilir: `[W/m²]`.
- **Noktalama:** tire `—` yalnızca başlık ve ünite adında; anlatımda iki nokta, noktalı virgül veya yeni cümle tercih edilir. Aralık için `–` (`s. 112–114`).
- **Kaynak dürüstlüğü:** hocadan gelen ve kitaptan gelen ayrılır. Hocada hata varsa düzeltilir ve belirtilir (`Küçük düzeltme:`). Kapsam dışı kalan konu açıkça söylenir (`Hoca özetinde yok; sınav kapsamında olup olmadığını hocaya sor.`). Kitapta olmayan bilgi kitaptanmış gibi yazılmaz.
- **Örnek sorular:** hoca "çözün" dediyse tam çözüm yazılmaz, `.box.sinav` içinde devre veya kurulum anahtarı verilir. Hocanın işlediği örnek `Adım 1, Adım 2…` başlıklarıyla açılır. Küçük sayısal kontroller (`Örnek: L = 0.2 m … 4200 W olur`) doğrulanmış olmalı. Etkileşimli çözücü kitap sonucunu veriyorsa `.cap` içinde söylenir.

---

## 7. Formül yazımı

- MathJax 3.2.2, `tex-svg-full.js`. `cancelto`, `underbrace`, `boxed`, `dfrac`, `aligned` referansta kullanılıyor.
- Sınırlayıcı: `\( \)` ve `\[ \]`. `$$` teknik olarak açık ama defterde kullanılmıyor; tek `$` formül değildir.
- Kalıplar: `T_{s,1}`, `T_{\infty,1}`, `q''_x`, `\dot q`, `\rho c_p`, `R_{t,\text{cond}}`, `\Longrightarrow`, `\qquad`, `\text{sabit}`.
- Uzun denklem `aligned` ile bölünür. `.eq` zaten yatay kayar ama önce satır bölmeyi dene.
- HTML içinde `<` ve `>` yerine `\lt`, `\gt`, `\le`, `\ge` kullan. `&` işaretinden hemen sonra harf yazarken dikkat: `&times` gibi HTML varlığına dönüşebilir. `&\frac`, `&=` veya `& T` güvenlidir.
- `<h2>` içinde formül olmaz: sayfalayıcı başlığı MathJax dizmeden okur, menüde ham LaTeX görünür. `<h3>` içinde olabilir.

---

## 8. SVG çizimleri

**Tuval:** genişlik her zaman 720 (`viewBox="0 0 720 Y"`), yükseklik 250–430 arası, çoğunlukla 300. Görsel dosya yerine SVG tercih edilir. `role="img"` ve Türkçe `aria-label` zorunludur. Yazı tipi CSS'ten gelir (Patrick Hand), `font-family` yazılmaz.

**Palet** (anlam olarak sabit):

| Renk | Anlam |
|---|---|
| `#fb7185` | Sıcak, sıcaklık profili |
| `#60a5fa` | Soğuk |
| `#34d399` | Isı akışı, akış okları (`.flow`) |
| `#fde047` | Sayılar, ΔT, ölçü, simetri |
| `#f472b6` | Düğüm noktaları, kontrol hacmi, izoterm |
| `#cbd5e1` | Ana çizgi, kenar, direnç, etiket |
| `#94a3b8` | Eksen, ikincil yazı |
| `#475569`, `#334155` | Izgara, zayıf çizgi |
| `#22304a`, `#1e293b` | Katı dolgu |
| `#2c2a45`, `#3a2a35`, `#1f3a3a` | Kompozitte farklı katman dolguları |

**Yazı boyutu:** `font-size` 12–18, çoğunlukla 13–16. Tekrarlayan öznitelikler `<g>` üzerinde toplanır. SVG metninde `&lt;` kullanılır.

**Hazır kalıplar:**

- Hareketli akış: `<line class="flow" … stroke="#34d399" stroke-width="3"/>`. Hız `--spd` ile (`style="--spd:2.6s"`). `.flow` hareket azaltma ve yazdırmada otomatik durur. Ok ucu `polygon` veya `marker`.
- Direnç sembolü: `<path data-res="x1,y,x2"/>` yaz, `heat-defter.js` zigzag `d` üretir. `<g stroke="#cbd5e1" stroke-width="2.5" fill="none">` içine koy, düğümleri `<circle r="5" fill="#f472b6">` ile işaretle.
- `<defs>` içindeki `clipPath`, `marker`, gradient id'leri de defter geneldir. Dolu olanlar: `zc`, `hotc`, `dom`, `ah`, `ah2`, `ah3`, `ah4`, `blob`. Sıradaki ok için `ah5` kullan veya kendi önekini ver.
- Karmaşık grafik (ısı haritası) gerekirse `<canvas>` kullanılabilir (`sepCanvas`). `<canvas>` üzerinde dokunmatik sayfa çevirme kapalıdır.

---

## 9. JavaScript

Her etkileşimli çizim `heat-defter.js` sonuna eklenen ayrı bir IIFE'dir. Kısa, sıkıştırılmaya yakın bir yazım kullanılır; yorumlar Türkçe ve kısadır:

```js
(function(){
  const $=id=>document.getElementById(id); if(!$('rk')) return;
  function upd(){
    const k=+$('rk').value,h=+$('rh').value;
    $('vrk').textContent=k.toFixed(2);$('vrh').textContent=h;
    // hesapla, setAttribute ile SVG'yi güncelle, textContent ile sonucu yaz
  }
  ['rk','rh'].forEach(id=>$(id).addEventListener('input',upd));
  upd();
})();
```

Kurallar:

- **Koruma satırı şart:** `if(!$('…')) return;`. Tek `<script>` bloğu olduğu için yakalanmayan bir hata kendisinden **sonraki tüm IIFE'leri** durdurur.
- **Harici kütüphane yok**, ağ isteği yok, depolama yok. Düz DOM ve SVG öznitelikleri kullanılır.
- **`upd()` en sonda bir kez çağrılır**; varsayılan değerler kitabın sayısal örneğini vermelidir.
- **Çözüm gerçek olmalı:** çizim sahte değil, gerçek formülü hesaplar. Sonucu kitapla karşılaştırıp doğrula (türbin kanadı `T₁ = 1526.0 K`).
- **Yeni id'ler için ünite öneki kullan** (`u5…`). Değer gösterim id'si `v` ile başlar (`u5k` → `vu5k`). Mevcut öneklerle çakışma olmasın: `sT1`, `ch1`, `rk`, `gG`, `sep`, `ez`, `gs`, `gs4`, `bk`.
- Global ad eklemeyi önle. Referansta tek istisna `bladeSolve` işlevidir.
- Yeni `@keyframes` eklenirse `prefers-reduced-motion` altında kapatılır; en kolayı mevcut `.flow` sınıfını kullanmaktır.

---

## 10. CSS

`heat-defter.css` koyu temalıdır (`color-scheme: dark`) ve mevcut kuralları değiştirilmez. Yeni kural gerekirse dosyanın sonuna eklenir; önce `.fig`, `.box`, `.tw` ile çözülmeye çalışılır. Satır içi `style` yalnızca küçük istisnadır.

Değişkenler:

```css
--bg:#0b1120; --card:#172033; --well:rgba(15,23,42,.8); --line:#334155; --line2:rgba(51,65,85,.6);
--text:#e2e8f0; --muted:#94a3b8; --strong:#f1f5f9;
--pink:#f472b6; --pink-soft:#f9a8d4; --yellow:#fde047;
--hl-bg:rgba(250,204,21,.25); --hl-fg:#fef08a;
--accent:#fb7185; --flow:#34d399;
--f-title:'Shantell Sans','Nunito',cursive;   /* h1, h2, h3, kutu etiketi, tablo başlığı */
--f-body:'Nunito',system-ui,sans-serif;        /* gövde, 17px / 1.7 */
--f-note:'Patrick Hand','Nunito',cursive;      /* .src, .terms, .cap, .controls, SVG yazısı */
```

Başlık renkleri: `h1` ve `h2` pembe, `h3` sarı. Bu üç yazı tipi `/vendor/fonts/` içinde yalnızca latin ve latin-ext alt kümesiyle gömülüdür; Yunan harfi veya özel simgelerde tarayıcı başka yazı tipine düşebilir, bu yüzden formül dışında az kullan. Yeni ağırlık veya yazı tipi eklenmez.

`body.nb-paged` kuralları uygulama içindeki kart görünümünü kaldırır. Dosyalar tek başına açılırsa `.page` kart gibi görünür; bu fark normaldir.

---

## 11. Sayfalayıcı sınırları

- Sayfa başlığı, sayfadaki ilk `h1`/`h2`/`h3` metnidir. `.chapter b` başlık sayılmaz, bu yüzden her sayfada `<h2>` olmalı.
- Dokunmatik sayfa çevirme `input`, `canvas`, `.controls`, `.tw`, `.eq` üzerinde kapalıdır; yatay kayan öğeleri bu sınıflarla sar.
- `<a href="#id">` ilgili sayfaya çevirir. Sayfa içi başka bir öğeye de gider. Başka sayfaya atıf gerekirse bağlantı verilebilir; referansta atıflar çoğunlukla düz metindir (`3.5'te göreceğiz`).
- Alt çubuk içeriğin üstünde durur; `.nb-inner` 96 piksel alt boşluk bırakır.
- `pager.*` tüm defterleri etkiler. Yeni ünite için `pager.js` veya `pager.css` değiştirme.

---

## 12. Yeni ünite ekleme adımları

Aşağıdaki yerler birlikte güncellenir:

1. **`heat-defter.html` sonu:** `.page` kapanışından önce, varsa önce ünite sonu kutusu, sonra yeni sayfalar. Şablon: Ek A.
2. **`heat-defter.html` içindekiler:** `#icindekiler` içinde son `.roadmap` ile `<p class="sub">Başlıklara tıklayarak…</p>` arasına yeni `h3.toc-unit` ve `.roadmap`. Her alt bölüm için satır; işlenmeyen başlıklar `hoca özetinde yok` ile yine listelenir.
3. **`heat-defter.js` sonu:** yeni IIFE'ler. Şablon: Ek B.
4. **`heat-defter.css`:** genellikle değişmez.
5. **`ILERLEME.md`:** kısa kayıt (yapılan, doğrulama).

Üniteler kitap sırasıyla dizilir. Önceki bir ünite eklenecekse (`Ünite 2`) ilk sayfadan sonra araya girer; içindekiler de aynı sırayı izler.

**Başka bir ders** için: `Content/Notebooks/<ders>-defter.html/.css/.js` oluştur, CSS'i aynen kopyala, JS'te yalnızca `data-res` çizicisi gibi ortak parçaları al, `NotebookSeed.cs` içindeki `Items` listesine satır ekle (ders adları ve defter adı). `header` ve kaynak kitap satırı derse göre değişir, gerisi aynı kalır.

---

## 13. Siteye yayımlama

İki yol vardır ve **birbirini etkiler**. Depodaki `heat-defter.*` her iki yolda da kaynak dosya olarak güncel tutulmalıdır.

| | Yol A: dosya + push | Yol B: arayüzden içe aktarma |
|---|---|---|
| Adım | `heat-defter.*` değişir, commit, push, Render yeniden başlar, `NotebookSeed` çalışır | Defter → Düzenle → `.html içe aktar` → kontrol → Kaydet |
| Koşul | Kayıt `Version == 0` olmalı | Yönetici girişi |
| Etki | Yalnızca hiç düzenlenmemiş defteri günceller | HTML, CSS ve JS alanlarının **tamamını** değiştirir, `Version` artar |

**Dikkat edilecek noktalar:**

- Arayüzden bir kez kaydedilince `Version` 0'dan çıkar ve Yol A **hata vermeden hiçbir şey yapmaz**. Bu noktadan sonra güncelleme Yol B ile yapılır.
- Yol B, canlıdaki içeriğin üzerine yazar. Daha önce arayüzden elle düzeltme yapıldıysa, depodaki dosya bu düzeltmeleri içermez ve içe aktarma onları siler.
- Canlı sürüm yönetici girişiyle `/api/courses/<dersId>/notebooks/` adresinden görülebilir (`version`, `html` uzunluğu). Devam etmeden önce canlı içerik ile `heat-defter.*` karşılaştırılmalı. Bu belge yazılırken canlı defter görülmedi; yalnızca depodaki sürüm incelendi.
- Push canlı siteyi etkileyebilir (Render ve Cloudflare otomatik dağıtım).

**Yol B için tek parça dosya:** içe aktarıcı `<style>`, satır içi `<script>` ve `body` içeriğini alanlara böler; dış `link`/`script src` etiketlerini atar. Proje kökünde şununla üretilir (çıktıyı depoya ekleme):

```bash
node -e "const fs=require('fs'),d='server/NotVarMi.Api/Content/Notebooks/heat-defter.',r=e=>fs.readFileSync(d+e,'utf8');fs.writeFileSync('heat-defter-tek-dosya.html','<!doctype html><html lang=\"tr\"><head><meta charset=\"utf-8\"><style>\n'+r('css')+'\n</style></head><body>\n'+r('html')+'\n<script>\n'+r('js')+'\n</script></body></html>')"
```

---

## 14. Referanstaki bilinen tutarsızlıklar

Bunlar mevcut defterde durur. Ayrı bir karar verilmedikçe düzeltilmez.

| Konu | Durum | Yeni içerikte |
|---|---|---|
| `p.hatir` | `box` sınıfı yok, bu yüzden kenarlık ve boşluk yok; diğer kutulardan farklı görünür | Aynen `<p class="hatir">`. Düzeltilecekse 6 yerin tümü birlikte `box hatir` yapılır |
| Şekil renkleri | İki yerde `#8ab4ff`, çoğu yerde `#60a5fa` soğuk rengi | `#60a5fa` |
| `h2` adları | `4 Sınır Koşulunun Uygulanması` numara gibi başlıyor | Adet ile bölüm numarası karışmayacak şekilde yaz |
| İlk IIFE | `heat-defter.js` ilk blokta koruma satırı yok | Koruma satırı kullan |
| Eski dosya | `NotebookExamples.cs` açık renkli eski örnek defter biçimidir (`.lesson`, Georgia) | **Örnek alma**, yalnızca yeni dersin başlangıç içeriği içindir |

---

## 15. Teslim öncesi kontrol listesi

- [ ] Her `section`: benzersiz `id`, `.src`, formülsüz `h2`; aralarında `hr.cut`; üstte `SAYFA` yorumu
- [ ] Ünitenin ilk sayfasında `data-chapter` ve aynı metinli `.chapter`
- [ ] İçindekiler güncel, tüm bağlantılar var olan `id` değerlerine gidiyor
- [ ] Kitaptan gelen her bilgi kutuda, hocanın hataları `dikkat` ile belirtilmiş, kapsam dışı konular yazılmış
- [ ] Yeni sembollerin altında `.terms`, sonuç formülleri `.eq.big`
- [ ] Sayılar nokta ondalıklı, birimler boşluklu; sayısal örnekler elle kontrol edildi
- [ ] SVG: `viewBox` 720 genişlik, `aria-label`, paletten renk, Unicode etiket
- [ ] JS: koruma satırı, benzersiz önek, `upd()` çağrısı, varsayılan değer kitabı veriyor
- [ ] Dış kaynak yok (`http`, CDN, `@import`, `fetch`)
- [ ] Yinelenen id yok. Şu komut boş dönmeli:

```bash
grep -oE ' id="[^"]+"' server/NotVarMi.Api/Content/Notebooks/heat-defter.html | sort | uniq -d
```

- [ ] Tarayıcıda açıldı: konsol hatası yok, formüller dizildi (`mjx-merror` yok), sayfa sayısı doğru, içindekiler grubu görünüyor, kaydırıcılar çalışıyor, mobil genişlikte taşma yok
- [ ] Yayım yolu seçildi, canlı içerik ezilmiyor (Bölüm 13)

---

## Ek A — Yeni ünite HTML şablonu

Köşeli parantezler doldurulur. `.page` kapanışından hemen önce eklenir.

<!-- sablon:unite -->
```html

  <!-- ============ SAYFA 2–3 ============ -->
  <hr class="cut">
  <section id="yeni-giris" data-chapter="Ünite 5 — [Ünite adı]">
    <div class="chapter" id="ünite5"><small>Incropera Bölüm 5 · Hoca özeti s. 2–[X]</small><b>Ünite 5 — [Ünite adı]</b></div>
    <span class="src">Hoca özeti s. 2–3 · Kitap [bölüm], s. [Y]</span>
    <h2>[Konunun başlığı]</h2>

    <p>[Önceki üniteye bağlanan giriş.] Hoca burada <mark>[vurguladığı cümle]</mark> diyor. <b>[Terim]</b> ([İngilizcesi]) şu demektir: \(T=T(x,t)\).</p>
    <div class="eq">\[ [ara adım] \;\;\Longrightarrow\;\; \frac{dT}{dt}=0 \]</div>
    <p class="terms"><span>\(T\): sıcaklık [K]</span><span>\(t\): zaman [s]</span></p>

    <h3>[Adımı anlatan alt başlık]</h3>
    <p>[Neden bu adımı attığımız.] Sonuç:</p>
    <div class="eq big">\[ q=\frac{\Delta T}{R} \]</div>
    <p class="box acik"><span class="k">Analoji:</span> [Günlük hayattan sezgi.]</p>
    <p class="box ek"><span class="k">Kitaptan ek, [konu]:</span> [Hocanın atladığı, kitapta olan bilgi.]</p>
    <p class="box dikkat"><span class="k">Küçük düzeltme:</span> [Hocadaki hata veya gizli kabul.]</p>
    <p class="hatir"><span class="k">Hatırlatma:</span> [Eski konu veya matematik.]</p>

    <div class="tw"><table class="t">
      <tr><th>[Sütun]</th><th>[Sütun]</th></tr>
      <tr><td>[Değer]</td><td>\(q\) [W]</td></tr>
    </table></div>

    <div class="fig">
      <svg viewBox="0 0 720 260" role="img" aria-label="[Şeklin kısa anlatımı]">
        <rect x="250" y="30" width="220" height="170" fill="#22304a" stroke="#cbd5e1" stroke-width="2.5"/>
        <text x="360" y="22" text-anchor="middle" fill="#94a3b8" font-size="16">[etiket]</text>
        <line id="u5Line" x1="250" y1="60" x2="470" y2="140" stroke="#fb7185" stroke-width="4"/>
        <line class="flow" x1="270" y1="185" x2="440" y2="185" stroke="#34d399" stroke-width="4"/>
        <polygon points="440,176 460,185 440,194" fill="#34d399"/>
      </svg>
      <div class="controls">
        <label for="u5a">a = <span id="vu5a"></span> [birim]<input id="u5a" type="range" min="0" max="5" step="0.1" value="2"></label>
      </div>
      <div class="readout"><span>sonuç = <b id="u5Out"></b> [birim]</span></div>
      <p class="cap">Kitap Şekil [X]'in yeniden çizimi. [Kaydırıcıyla ne değişiyor?]</p>
    </div>

    <p class="box sinav"><span class="k">Sınavda:</span> [Kabuller, formül seçimi, tipik tuzak, hızlı kontrol.]</p>
  </section>

  <!-- ============ SAYFA 4 ============ -->
  <hr class="cut">
  <section id="yeni-konu">
    <span class="src">Hoca özeti s. 4 · Kitap [bölüm], s. [Y]</span>
    <h2>5.1 [Konu]</h2>
    <p>[Anlatım.]</p>
  </section>

  <hr class="cut">
  <p class="box dikkat" style="margin-top:14px"><span class="k">Ünite sonu:</span> [Özette olmayan bölümler ve sınav kapsamı notu. Gerek yoksa bu blok silinir.]</p>
```

İçindekiler eki (`#icindekiler` içine):

```html
    <h3 class="toc-unit"><a href="#yeni-giris">Ünite 5 — [Ünite adı]</a></h3>
    <div class="roadmap">
      <span class="n">5.0</span><span><a href="#yeni-giris">[Konu]</a></span><span class="st on">işlendi</span>
      <span class="n">5.1</span><span><a href="#yeni-konu">[Konu]</a></span><span class="st on">işlendi</span>
      <span class="n">5.2</span><span>[İşlenmeyen konu]</span><span class="st">hoca özetinde yok</span>
    </div>
```

## Ek B — Yeni çizim JavaScript şablonu

`heat-defter.js` dosyasının sonuna eklenir.

<!-- sablon:js -->
```js
(function(){
  const $=id=>document.getElementById(id); if(!$('u5a')) return;
  function upd(){
    const a=+$('u5a').value;
    $('vu5a').textContent=a.toFixed(1);
    $('u5Line').setAttribute('y2',60+a*25);
    $('u5Out').textContent=(a*2).toFixed(1);
  }
  ['u5a'].forEach(id=>$(id).addEventListener('input',upd));
  upd();
})();
```

## Ek C — Mevcut sayfa haritası

| Defter sayfası | `id` | Başlık |
|---|---|---|
| 1 | `icindekiler` | Isı Transferi Ders Notları (kapak + içindekiler) |
| 2 | `giris` | Ünite 3 başlangıcı: "1-B" ve "kararlı rejim" |
| 3 | `duzlem-duvar` | 3.1 Düzlem Duvar |
| 4 | `isil-direnc` | 3.1.2 Isıl Direnç |
| 5 | `kompozit` | 3.1.3 Kompozit Duvar |
| 6 | `temas-direnci` | 3.1.4 Temas Direnci |
| 7 | `alternatif` | 3.2 Alternatif İletim Analizi |
| 8 | `radyal` | 3.3 Radyal Sistemler |
| 9 | `isi-uretimi` | 3.5 Isı Üretimli İletim |
| 10 | `radyal-uretim` | Isı Üretimli Radyal Sistem |
| 11 | `neden-2b` | Ünite 4 başlangıcı: Neden 1-B'den 2-B'ye? |
| 12 | `alternatif-yaklasimlar` | 4.1 Alternatif Yaklaşımlar |
| 13 | `degisken-ayirma` | 4.2 Değişkenlere Ayırma |
| 14 | `sinir-kosullari` | 4 Sınır Koşulunun Uygulanması |
| 15 | `sekil-faktoru` | 4.3 İletim Şekil Faktörü |
| 16 | `ornek-41` | Örnek 4.1 |
| 17 | `sonlu-farklar` | 4.4 Sonlu Farklar |
| 18 | `dugum-agi` | 4.4.1 Düğüm Ağı |
| 19 | `sonlu-fark-formu` | 4.4.2 Sonlu Fark Formu |
| 20 | `enerji-dengesi` | 4.4.3 Enerji Dengesi |
| 21 | `cozum` | 4.5 Çözüm |
| 22 | `gauss-seidel` | Gauss-Seidel |
| 23 | `dogruluk` | 4.5.2 Doğruluk |
| 24 | `ornek-43` | Örnek 4.3 |

Örnek alınacak sayfalar: anlatım için `duzlem-duvar` (3), etkileşimli devre için `isil-direnc` (4), kurulum anahtarları için `kompozit` (5), adım adım örnek için `ornek-41` (16), kendi çözücüsü olan çizim için `ornek-43` (24).
