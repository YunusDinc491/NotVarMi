# Yeni oturum için talimat

Bu paketi aç ve önce `BASLA.md`, bu dosya ve `referans/DEFTER_SAYFA_YAPISI.md` dosyalarını oku. `referans/heat-defter.html`, `heat-defter.css`, `heat-defter.js` ve ilgili yerel `vendor/` dosyaları görünüm ve çalışma örneğidir. Giriş, düzlem duvar, ısıl direnç ve örnek çözüm sayfalarını incele. Kaynaklara göre başka ders için **yeni ve ayrı** bir defter oluştur; örnek ısı transferi konularını, sayfa numaralarını veya örnek verileri yeni derse taşıma. Referans belgedeki mevcut Isı Transferi defterine ekleme ve proje yolları, bu bağımsız çalışma için uygulanmaz.

Hocanın verdiği PDF/fotoğraf ile kullanıcının sağladığı kitap sayfalarını oku. İçeriği Türkçe, adım adım ve samimi anlat; düz yazıyı hoca özetine, kitaptan tamamlamaları ve kendi sezgisel açıklamalarını uygun etiketli kutulara ayır. Kaynağı, sayfa numarasını, sayıları ve hocanın vurgusunu uydurma. Eksik veya okunamayan kaynakları belirt. Hoca yalnızca "çözün" dediyse tam çözüm yerine kurulum ipucu ver.

Mevcut `sablon/defter.css` görünümünü koru. Yeni içerikte her sayfayı `.page` içindeki ayrı bir `<section id="...">` olarak yaz; sayfaları `<hr class="cut">` ile ayır, içindekileri ekle ve `data-page` kullanma. Başlıklara formül koyma. Metin içi formülde `\( ... \)`, blok formülde `\[ ... \]` kullan. Sembolleri açıkla. Çizimleri mümkünse erişilebilir, özgün SVG olarak oluştur; hareket ve kaydırıcılar konuya uygun gerçek hesabı çalıştırsın. Her JS parçası bağımsız, eleman kontrolü yapan IIFE olsun. Kod yerel ve çevrimdışı çalışsın; dış ağ, CDN, fetch ve localStorage kullanma.

Önce ayrı bir klasörde çalış. Sitedeki veya canlı ortamdaki defteri kullanıcının açık isteği olmadan değiştirme. Önizlemede MathJax, fontlar ve sayfalayıcı için bu paketin `vendor` dosyalarını kullan; NotVarMı içe aktarması için CSS ve içerik JS'ini tek HTML içinde tut. İçerik betiği ve sayfalayıcı, içerikten sonra çalışsın. `olustur.mjs` ve küçük örnek, birleştirme sırasının çalışan örneğidir. Kaynakları ve `vendor` klasörünü yan yana tut; tek başına taşınabilir olduğu izlenimini verme.

Formülleri, örnek hesaplarını ve kontrol değerlerini doğrula. Önizlemeyi açıp sayfa çevirme, içindekiler, grafikler ve mobil görünümü kontrol et; yapı kontrolleri görsel kontrolün yerini tutmaz. Kullanıcıya açılabilir önizlemeyi ve dosyaları ver; çalıştıramadığın kontrolleri belirt. Kütüphane veya sayfalayıcı dosyalarını değiştirme.

Kullanıcının isteği:

> Yüklediğim hoca notları ve kitap sayfalarından bu paketteki görünüm ve anlatım biçiminde yeni bir ders defteri oluştur. Konuları anlaşılır şekilde açıkla, uygun yerlere formüller ve etkileşimli çizimler ekle. Önce ayrı bir canlı önizleme göster; mevcut sitemdeki defterleri değiştirme.
