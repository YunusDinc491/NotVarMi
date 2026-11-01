# NotVarMı — Proje ve Faz Planı

Son güncelleme: 2 Kasım 2026. Durum: Faz 4 devam ediyor; gerçek hesap bağlantıları, kurtarma/taşıma ve canlı doğrulama henüz tamamlanmadı.

## Amaç ve kapsam

Kişisel ders notlarını ve dosyalarını tek yerde toplamak. Kullanıcı adı ve şifreyle girişten sonra “Dersler” başlıklı ana sayfada kare ders kartları gösterilir. Başlangıç dersleri Heat Transfer ve Fluid Mechanics'tir. Bir derste dosyalar/notlar ve web üzerinde okunabilen, animasyonlu bir defter bulunur. Düzenleme ayrı bir yönetim paneli yerine ilgili ekranlardaki yönetici kontrolleriyle yapılır. Arayüz React, sunucu ASP.NET Core/C# olacak; Visual Studio ile açılabilir bir çözüm hazırlanacak.

## Roller ve temel kurallar

- Yönetici dersleri, dosyaları ve defter içeriğini görüntüler ve düzenler; ekler ve siler.
- Misafir dersleri ve içerikleri görüntüler, dosyaları indirebilir; değişiklik yapamaz. Defter yalnızca site üzerinde görüntülenir ve indirme düğmesi sunulmaz. Web'de görüntülenen içerik teknik olarak tamamen kopyalamaya karşı korunamaz.
- İki başlangıç hesabı kullanıcı tarafından tanımlanmıştır. Şifreler kaynak koduna, bu belgelere veya Git'e yazılmayacak; güvenli yapılandırma ile ilk kurulumda verilecektir. Kullanıcı adında Türkçe karakter desteği korunacaktır.
- Yetki kontrolleri yalnızca arayüzde değil sunucuda ve dosya erişiminde de uygulanır. Şifreler güvenli özetlerle saklanır; oturum, giriş denemeleri ve yüklemeler için temel korumalar uygulanır.

## Mimari ve açık kararlar

React istemcisi API üzerinden ASP.NET Core'a bağlanır. Dersler, dosya bilgileri ve defter içeriği kalıcı bir veritabanında, yüklenen dosyalar kalıcı depolamada tutulur. Geliştirmede basit yerel depolama kullanılabilir; yayında kullanılan servis ve yedekleme kararı netleştirilecektir. Cloudflare statik React uygulamasını sunabilir; C# API için ayrıca uygun bir .NET sunucusu gerekir. Alternatif olarak Cloudflare önünde ayrı bir .NET sunucusu veya Cloudflare Workers için teknoloji değişikliği konuşulabilir; kullanıcının C# tercihi varsayılan olarak korunur. Barındırma ücretleri ve ücretsiz katman sınırları seçim aşamasında doğrulanır.

Kullanıcı JavaScript ile çizim ve animasyon istedi. Defterin HTML, CSS ve JavaScript içeriği yönetici tarafından düzenlenebilir olacak; defter ayrı kökende veya uygun biçimde kısıtlanmış, uygulama oturumuna ve yönetici işlemlerine erişemeyen sandbox iframe içinde çalıştırılacak. Dış kaynak ve mesajlaşma izinleri en dar ihtiyaçla belirlenecek; güvenlik testlerinde içeriğin ana uygulamaya erişemediği doğrulanacak. Misafire düzenleme sunulmayacak. Kimliği doğrulanmamış kişilerin dosyalara doğrudan erişmemesi gerekir.

Kullanıcı Cloudflare hesabına ve notvarmi.bid alan adına sahip, ücretsiz katmanları tercih ediyor. Mimari: Cloudflare'da React; Render ücretsiz .NET sunucusu; seçimleri henüz kesinleşmemiş ayrı kalıcı veritabanı ve özel nesne deposu. Cloudflare R2 Standard ücretsiz katmanında aylık 10 GB depolama ve işlem kotaları bulunur; hesap etkinleştirme koşulları ve güncel limitler kurulumda kontrol edilmeli. Render ücretsiz sunucusu uykuya geçebilir, yerel depolaması kalıcı değildir ve ücretsiz Render Postgres 30 gün sonra sona erer; dolayısıyla kalıcı veritabanı için ayrı bir hizmet gerekir. Ücretsiz katmanda masraf ve kullanılabilirlik garantisi verilmez. Kaynaklar: https://developers.cloudflare.com/r2/pricing/ ve https://render.com/docs/free .

Kullanıcı her derste en fazla bir defter, bir kitap PDF'i ve birkaç fotoğraf bekliyor; video öngörmüyor. Gerçekçi dosya boyutu sınırı seçilir ve kullanıcıya gösterilir. Tasarım açık renkli, gerçek defteri çağrıştıran, ekrana yayılan animasyonlu defter ve mobil uyumlu okuma alanı olacak. Arayüz Türkçe, ders adları serbest olacak.

Yöneticiye özel geri dönüşüm kutusunda silinen dersler ve dosyalar geri getirilebilir veya kesin silinebilir. Ders silindiğinde ilişkili içeriklerle birlikte taşınır; çakışmalar ve kalıcı silme işlemi açıkça ele alınır. Kullanıcı otomatik silme olmamasını ve yönetici tarafından dersler, defterler ve dosyalar dahil indirilebilen tam yedek seçeneğini onayladı.

Render'a alternatifler araştırıldı: Koyeb ücretsiz Docker web servisi, Azure App Service F1 ve Oracle Always Free sanal makinesi. Kullanıcı Render ücretsiz web servisini seçti; kalıcı veriler için ayrı servisler kullanılacak. Kaynaklar: https://www.koyeb.com/docs/reference/instances , https://learn.microsoft.com/en-us/azure/app-service/quickstart-dotnetcore , https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm .

## Fazlar

### Faz 0 — Kararlar ve temel hazırlık

- Kullanıcının yayınlama, depolama, içerik düzenleme, tasarım ve kapsam tercihlerini topla; bu planı güncelle.
- Mevcut araçları, .NET SDK, Node.js, Visual Studio ve Git erişimini incele. Uzak deponun durumunu kontrol et; var olan içeriği koru.
- Çözüm ve klasör düzenini, yapılandırma örneklerini, gizli bilgilerin Git dışında tutulmasını belirle.
- Bitiş ölçütü: alınan kararlar kayda geçmiş, uygulama ve yayınlama yolu netleşmiş.

### Faz 1 — Çalışan iskelet ve giriş

- Visual Studio çözümünü, ASP.NET Core API'yi ve React istemcisini kur; yerel geliştirme talimatlarını ekle.
- Kalıcı veri modeli ve başlangıç hesapları için güvenli yapılandırmayı oluştur; oturum açma/kapatma, yönetici/misafir rolleri ve sunucu tarafı yetkilendirmesini uygula.
- Giriş ekranı, oturum durumu, hatalar ve yetkisiz erişim durumlarını hazırla.
- Güvenlik odaklı doğrulama: doğru/yanlış giriş, misafirin yönetici işlemlerini API üzerinden de yapamaması ve gizli içeriğin oturumsuz erişilememesi.
- Bitiş ölçütü: iki rol güvenilir biçimde giriş yapabiliyor ve yetkileri ayrılıyor.

### Faz 2 — Dersler ve içerik yönetimi

- Ders kartları ve ders detay sayfasını hazırla; başlangıç derslerini ekle.
- Yöneticiye yerinde ders ekleme, adlandırma ve silme; dosya/not ekleme, görüntüleme, indirme ve kaldırma kontrolleri sağla. Yöneticiye özel geri dönüşüm kutusu, geri getirme ve onaylı kalıcı silme ekle.
- Desteklenen dosya türü ve boyut sınırlarını belirle, yüklemeleri doğrula ve dosyaları yetkili erişimle sun. Kullanıcı onayı gerektiren silme davranışını netleştir.
- Misafir görünümünü ve rol sınırlarını kontrol et; mobil düzen ve boş/hatalı durumları tamamla.
- Bitiş ölçütü: iki hesapla bir dersin dosyaları beklenen yetkilerle kullanılabiliyor.

### Faz 3 — Defter deneyimi ve düzenleme

- Ders detayından açılan, okunabilirliği ön planda tutan defter tasarımını ve akıcı açılış/sayfa geçişlerini oluştur; hareket azaltma tercihine ve küçük ekranlara uyum sağla.
- Örnek HTML anlatımı, çizim ve animasyon ekle. İçerik yapısını gelecekte kullanıcının vereceği anlatımlara uygun kur.
- Yönetici için HTML/CSS/JavaScript düzenleme ve önizleme yolunu uygula; çalıştırılabilir içeriği sandbox içinde ayır ve sınırları doğrula. Misafire yalnızca okuma göster.
- Bitiş ölçütü: her başlangıç dersinin defteri açılır, okunur ve yönetici içeriği güncelleyebilir.

### Faz 4 — Kalıcılık, yayın ve teslim

- Seçilen üretim veritabanı, dosya depolama ve yedekleme yolunu kur; yerel ve üretim ayarlarını ayır. Gizli anahtarları Git'e ekleme.
- Cloudflare ve seçilen .NET barındırmasını yapılandır; HTTPS, oturum, alan adları, CORS ve dosya erişimini gerçek ortamda doğrula.
- Güvenlik ve ana kullanıcı akışlarını uçtan uca kontrol et. Geçici test verilerini temizle; istenen örnek ders ve defter içeriklerini koru.
- Git durumunu incele, uygun noktada commit/push yap; erişim veya kimlik doğrulama engeli varsa açıkça kaydet. Kurulum, çalışma, içerik ekleme, yedekleme ve dağıtım talimatlarını teslim et.
- Bitiş ölçütü: erişilebilir çalışan uygulama, kalıcı veriler, doğrulanmış rol sınırları ve güncel belgeler.

## Her fazda çalışma biçimi

Önceki çalışmayı ve Git durumunu kontrol et; planı gerektiğinde alınan kararlarla güncelle. Yapılanları, doğrulamaları, sorunları ve sonraki adımları ILERLEME.md'ye işle. Kullanıcıya anlaşılır, kısa ilerleme raporları ver. Güvenlik dışında gereksiz test altyapısı kurma; temel işleyişi ve güvenlik sınırlarını doğrula. Kullanıcının dosyalarını, uzaktaki değişiklikleri ve gerçek verilerini koru.

Her çalışma veya faz sonunda sıradaki adımları açıkça belirt: asistanın yapacakları ve kullanıcı tarafından gerçekten yapılması zorunlu olanlar. Kullanıcıya gereksiz görev verme; gerekli bir iş yoksa bunu söyle. Uygun bir önizleme varsa sun, henüz anlamlı bir önizleme yoksa hazır olduğunda sun. Karar gerektiren soruları açılır soru aracıyla toplu sor; daha iyi bir fikir veya istenenlere ilişkin düzeltme önerisi varsa gerekçesini ve öneriyi kullanıcıya sun. Onay gerektirmeyen rutin tercihleri kullanıcıya yüklemeden uygula.
