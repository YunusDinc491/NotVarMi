# NotVarMı — İlerleme Kaydı

## Oturuma yeniden başlarken

Önce FAZ_PLANI.md ve bu dosyayı oku; çalışma ağacını, Git durumunu ve en son kararları kontrol et. Uygulanmış bir işi varsayma; tamamlanmamış maddelerden devam et. Gizli bilgileri belgelere veya depoya yazma.

## 2 Kasım 2026 — Planlama başladı

- Kullanıcı React arayüzlü, ASP.NET Core/C# tabanlı, Visual Studio'da açılabilen kişisel ders sitesi istedi. Yayında Cloudflare kullanmak ve GitHub deposuna commit/push yapmak istiyor.
- İstenen özellikler: kullanıcı adı/şifre ile yönetici ve misafir girişi; Dersler ana sayfası; Heat Transfer ve Fluid Mechanics başlangıç dersleri; ders dosyaları; animasyonlu, okunabilir HTML defter; yöneticinin site üzerinden içerik yönetimi. Misafir dosyaları indirebilir, defteri sitede okuyabilir, değişiklik yapamaz.
- Hesap bilgileri kullanıcı tarafından iletildi. Güvenlik nedeniyle parolalar bu kayda ve kaynak koduna eklenmeyecek; ilk kurulumda güvenli yapılandırmadan sağlanacak.
- Çalışma klasörü inceleme sırasında boştu ve Git deposu değildi. Kullanıcının verdiği GitHub deposu henüz klonlanmadı veya değiştirilmedi.
- FAZ_PLANI.md oluşturuldu. Plan henüz kullanıcı tercihleriyle kesinleştirilmedi. Uygulama kodu ve üretim altyapısı henüz oluşturulmadı; commit/push yapılmadı.
- Mimari karar: Cloudflare'de React barındırma ile ayrı bir .NET API barındırma gereksinimi görüşülecek. Kalıcı dosya depolama ve veritabanı, maliyet, yedekleme, defter düzenleme yöntemi ve görsel tercihler henüz seçilmedi.
- Sonraki adım: toplu soruların yanıtlarını al, planı kesinleştir; ardından Faz 0 araç ve uzak depo incelemesine geç.

## 2 Kasım 2026 — Tercihler ve ilk teknik inceleme

- Kullanıcının Cloudflare hesabı ve notvarmi.bid alan adı var; ücretsiz katman tercih ediyor. .NET barındırma ve kalıcı veritabanı henüz seçilmedi. Ücret doğurabilecek etkinleştirmeler yapılmadı.
- Defterde HTML, CSS ve JavaScript ile animasyon ve çizim isteniyor. Yönetici düzenleyicisi ve sandbox içinde çalıştırma planlandı; ayrıcalıklı uygulama oturumundan izolasyon temel güvenlik şartıdır.
- Açık renkli, gerçek defter hissi veren, ekranı kaplayan animasyon ve mobil okunabilirlik seçildi. Yöneticiye özel geri dönüşüm kutusu istendi. Otomatik temizleme ve yedekleme tercihi açık.
- İçerik tahmini: ders başına bir defter, bir kitap PDF'i ve birkaç fotoğraf; video beklenmiyor. Dosya başına kesin sınır henüz seçilmedi.
- Yerel ortamda .NET SDK 10.0.403, Node.js 26.13.0 ve Git 2.56.0 bulundu. Visual Studio varlığı henüz bağımsız doğrulanmadı. GitHub `ls-remote` DNS çözümleme hatası verdi; uzak depo durumu ve erişim henüz doğrulanamadı. Henüz Git başlatılmadı ve kaynak koda başlanmadı.
- Ücretsiz yayın araştırmasında Render'ın ücretsiz sunucusunda kalıcı disk bulunmadığı ve ücretsiz PostgreSQL'in 30 günde sona erdiği görüldü. R2 ücretsiz Standard kotası 10 GB-ay; hizmet seçimleri ve hesap gereklilikleri yayın öncesinde tekrar doğrulanmalı.
- Sonraki adım: yedekleme/silme tercihlerini ve ücretsiz sunucu yaklaşımını netleştir; GitHub erişimini tekrar kontrol et; sonrasında Faz 1'e geç.

## 2 Kasım 2026 — Yedekleme kararı ve barındırma alternatifleri

- Kullanıcı indirilebilir tam yedeği ve geri dönüşüm kutusundaki öğelerin elle kalıcı olarak silininceye kadar tutulmasını onayladı.
- Render alternatifi istendi. Koyeb ücretsiz Docker web servisi, Azure App Service F1 ve Oracle Cloud Always Free araştırıldı; uyku, kota, sunucu yönetimi ve hesap koşulları faz planına kaydedildi. Sağlayıcı henüz seçilmedi.

## 2 Kasım 2026 — Sunucu seçimi

- Kullanıcı seçenekler arasından Render ücretsiz web servisiyle devam etmeyi seçti. Kalıcı veri ve dosyalar ücretsiz servisin geçici diskinde tutulmayacak; üretim veritabanı ve nesne deposu seçimi ayrıca doğrulanacak.

## 2 Kasım 2026 — Faz 1 başladı

- `NotVarMi.sln` ve .NET 10 ASP.NET Core projesi oluşturuldu. `client` altında Vite/React uygulaması kuruldu; Türkçe giriş ekranı, oturum açma/kapatma ve geçici karşılama ekranı eklendi. Dersler, defter, dosyalar ve yönetici işlemleri henüz uygulanmadı.
- API iki kullanıcıyı Admin ve Viewer rolleriyle tanıyor. ASP.NET Identity parola özetleri Git dışında `server/NotVarMi.Api/appsettings.Local.json` içinde oluşturuldu; düz metin parolalar kaynak kodunda yok. Çerez HttpOnly ve SameSite Strict; başarısız girişler sınırlandırılıyor. Geliştirme ortamı anahtarları Git dışındaki `.keys` klasöründe. Üretimde anahtar saklama, HTTPS ve Cloudflare üzerinden aynı kökenli API yönlendirmesi tasarlanıp doğrulanmalı; mevcut hali yayınlanmaya hazır değil.
- API `dotnet build NotVarMi.sln --no-restore` ile sıfır hata ve uyarıyla; React `npm run build` ile başarıyla derlendi. Yerel HTTP kontrolünde oturumsuz erişim 401, doğru yönetici ve misafir girişleri sırasıyla Admin/Viewer, yanlış parola 401 döndürdü. Henüz yöneticiye özel içerik uçları bulunmadığından rol bazlı değişiklik engeli test edilmedi; bu kontrol ilgili uçlarla birlikte zorunludur. Tarayıcıda görsel kontrol henüz yapılmadı.
- Sandbox ağ kısıtı nedeniyle npm kurulumu ve GitHub erişimi için izinli ağ yolu kullanıldı. `git ls-remote` başarılı ve boş sonuç verdi; uzak depoda henüz referans görünmüyor. Yerel Git deposu henüz başlatılmadı; commit veya push yapılmadı.
- Sonraki adım: Faz 1'in kalıcı veri modeli ve rol tabanlı güvenlik kontrollerini tamamla; yerel çalıştırma/üretim sırları için tekrarlanabilir kurulum hazırla; sonra Faz 2'ye geç. Gerçek barındırma/kalıcı depolama bağlantıları ve üretim güvenliği tamamlanmadan canlıya alma.

## 2 Kasım 2026 — Faz 1 yerel olarak tamamlandı

- EF Core ve SQLite ile geliştirme için kalıcı ders veri modeli eklendi. Yeni veritabanında Heat Transfer ve Fluid Mechanics ilk kez oluşturulur. Kayıtlar yeniden başlatma sonrasında korunur. `EnsureCreated` yalnızca ilk şemayı oluşturur; Faz 2'de şema değiştirilmeden önce EF geçişleri planlanmalı ve mevcut veriler korunmalı.
- Kimliği doğrulanmış hesaplar dersleri okuyabilir. Gerçek ders ekleme API'si yalnızca Admin rolüne açık; Viewer API üzerinden de 403 alıyor. Çapraz site form isteklerine karşı durum değiştiren API isteklerinde özel başlık zorunlu. Kullanıcı parolalarının yerel özetlerini güvenli biçimde yeniden oluşturmak için `scripts/setup-accounts.ps1` eklendi; mevcut ayarın üzerine yazmıyor. `README.md` yerel kurulum ve sınırlamaları açıklıyor.
- `dotnet build` ve `npm run build` başarılı. Geçici, sonradan silinen SQLite dosyasıyla kontroller: anonim okuma 401, eksik güvenlik başlığı 400, misafir okuma 200 ve yazma 403, yönetici yazma 201; eklenen kayıt sunucu yeniden başlatıldıktan sonra bulundu. Daha önce doğru/yanlış parola ve oturum kontrolleri doğrulandı. Tarayıcı görsel kontrolü henüz yapılmadı.
- EF paketinin getirdiği eski SQLite yerel paketinde güvenlik uyarısı görüldü; doğrudan SQLitePCLRaw.lib.e_sqlite3 2.1.14 bağımlılığı eklenerek uyarısız derleme sağlandı.
- Geliştirme veritabanı, hesap özetleri ve anahtarlar Git dışında. Üretimde henüz güvenli kalıcı veritabanı, nesne depolama, kalıcı oturum anahtarları ve Cloudflare üzerinden API yönlendirmesi bulunmadığından uygulama geliştirme dışı ortamda bilinçli olarak başlamaz. Faz 4'te bu koruma üretim altyapısı hazırlandıktan ve doğrulandıktan sonra kaldırılmalı.
- Sonraki faz: ders kartları ve detayları, ders/dosya yönetimi, yönetici geri dönüşüm kutusu; kalıcı depolama için yayın seçimini netleştir. Başlangıç parolaları yerel ayarda hazır olduğundan kullanıcının bu faz sonunda yapması zorunlu bir işlem yok.
- Yerel Git deposu kuruldu; gizli hesap ayarları, anahtarlar, yerel veritabanı ve derleme çıktıları dışlandı. Faz 1 kaynakları `82ec0a0` commit'iyle GitHub `main` dalına gönderildi.

## Çalışma biçimi tercihi

- Kullanıcı her aşama sonunda sonraki adımları, asistanın yapacaklarını ve kendisinin yapması zorunlu olanları ayrı görmek istiyor. Zorunlu olmayan işleri kullanıcıya yükleme; gerekli işlem yoksa açıkça söyle.
- Anlamlı ve kullanılabilir bir önizleme varsa paylaş, yoksa hazır olduğunda sun. Karar gerektiren soruları açılır soru aracıyla toplu sor. Kullanıcının isteğini iyileştirebilecek fikir veya düzeltmeleri gerekçeleriyle sun ve gerektiğinde tercihini sor.
- Her fazdan sonra bir sonraki fazın ne olduğunu söyle ve devam edilmesini isteyip istemediğini açılır soru ile sor.

## 2 Kasım 2026 — Faz 2 yerel olarak tamamlandı

- Dersler ana sayfası ve ders detayları yapıldı. Yönetici ders oluşturabilir, yeniden adlandırabilir ve çöpe taşıyabilir. Ders adları çöpteki derslerle de çakışamaz; ders geri getirilirken ad çakışması oluşmaz.
- Derslerde PDF, PNG, JPEG, WebP, TXT ve yaygın Office dosyaları yüklenebilir; dosya başına sınır 100 MB. PDF, resim ve metin dosyaları görüntülenebilir; tüm desteklenen dosyalar indirilebilir. Yönetici ayrıca metin notu oluşturup düzenleyebilir. Misafir yalnızca erişilebilir dosyaları görüntüler ve indirir. Defter alanı Faz 3'e kadar devre dışı.
- Yöneticiye özel geri dönüşüm kutusuna dersler ve dosyalar taşınabilir, geri getirilebilir veya onayla kalıcı silinebilir. Ders çöpteyken dosyaları dersle korunur; önceden ayrı silinmiş dosyalar ders geri geldiğinde çöpte kalır. Kalıcı silme önce veritabanından kaldırır; fiziksel silme hatasında artık dosyalar kalabilir, ileride güvenli bakım/yetim dosya temizleme gerektirir. Düzenlenen metinde yeni dosya önce yazılır, veritabanı güncellendikten sonra eski kopya silinir.
- Geliştirmede dosyalar `.uploads` içinde, kayıtlar yerel SQLite'ta saklanır ve Git dışıdır. Faz 1 şeması atomik SQLite işlemiyle yükseltilir; geçici eski veritabanında veri korunması doğrulandı. Gelecek değişiklikler için sürümlü geçiş sistemi geliştirilmelidir. Üretim için kalıcı servisler ve yedekleme Faz 4'e kalır; Render geçici diski ile yayın yapılmamalıdır.
- `dotnet build` ve `npm run build` başarıyla tamamlandı. Geçici dosya ve veritabanıyla misafir yükleme engeli (403), misafir dosya okuması, yönetici metin düzenleme, çöpteki dosyaya erişim engeli (404), ders/dosya geri getirme, kalıcı silme ve dosyaların temizlenmesi doğrulandı; test verileri silindi. Giriş, ders kartları ve ders sayfası tarayıcıda görsel olarak kontrol edildi.
- Yerel önizleme `http://127.0.0.1:5173/` adresinde API ve React geliştirme sunucuları açık olduğu sürece kullanılabilir; kalıcı veya herkese açık bir yayın değildir. Sunucular durursa README'deki yerel başlatma adımları kullanılır.
- Sıradaki Faz 3: ekranı kaplayan animasyonlu defter, örnek içerikler, HTML/CSS/JavaScript düzenleme ve çalıştırılabilir içeriğin uygulamadan güvenli izolasyonu. Bu faz sonunda kullanıcı için zorunlu işlem yok.

## 2 Kasım 2026 — Faz 3 yerel olarak tamamlandı

- Her ders için SQLite'ta tek defter modeli ve API'si eklendi. Mevcut dersler için başlangıç örnekleri bir kez kaydedilir; yeni dersler defterle birlikte oluşur. Heat Transfer ve Fluid Mechanics için Türkçe kavramsal açıklama ve duraklatılabilir hareketli çizim, diğer dersler için genel örnek hazırlanmıştır. Bunlar örnek içeriktir; gerçek ders materyalleri kullanıcıdan geldiğinde değiştirilecek.
- Defter tam ekran, spiralli, açılış animasyonlu ve mobil uyumlu bir okuma alanında gösterilir. Hareket azaltma tercihine uyulur. Yönetici HTML/CSS/JavaScript alanlarını canlı önizlemeyle düzenleyip kaydeder; kaydedilmemiş içerik için uyarı ve eski sürümün üzerine yazmayı engelleyen sürüm kontrolü vardır. Misafire düzenleme veya defter indirme düğmesi sunulmaz.
- Defter kodu `sandbox="allow-scripts"` ile ayrı kökenli iframe'de çalışır; `allow-same-origin` ve üst sayfaya erişim yoktur. CSP harici ağ, formlar ve dış kütüphaneleri engeller; gömülü SVG/data görselleri, CSS ve JavaScript kullanılabilir. Bu kısıtlama kullanıcıya bildirilmeli; ileride dış görsel/kütüphane ihtiyacı oluşursa güvenli kaynak yöntemi ayrıca tasarlanmalı.
- `dotnet build` ve `npm run build` başarılı. Geçici veritabanında anonim erişimin reddi, misafir okuma ve yazma reddi, yönetici kaydı, eski sürümle kayıt çatışması ve çöpe taşınıp geri getirilen dersin defterinin korunması kontrol edildi. Tarayıcıda açılış, düzenleyici ve örnek animasyonun duraklatılması doğrulandı. Geçici JavaScript ile ana sayfaya erişim ve API çağrısı denendi; ikisi de engellendi. Geçici içerik kaydedilmeden geri alındı.
- Yerel önizleme `http://127.0.0.1:5173/` adresindedir ve sunucular açık olduğu sürece çalışır. Henüz gerçek yayın yok. Sıradaki Faz 4: kalıcı üretim veritabanı ve özel dosya depolaması, tam yedek, Cloudflare/Render yayın ayarları, üretim güvenliği ve gerçek ortam kontrolü. Gerekli hesap işlemleri yalnızca gerçekten zorunlu olduklarında kullanıcıya bildirilecek.

## 2 Kasım 2026 — Faz 4 devam ediyor

- Kullanıcı Render hesabı olduğunu, Neon hesabı olmadığını ve gerekirse Cloudflare R2 etkinleştirmesini yapabileceğini söyledi. Cloudflare ve Render giriş ekranları uygulama içi tarayıcıda açıldı; oturum açık değildi. Neon kayıt sayfası açıldı; hizmet şartlarını kabul ederek hesap oluşturma işlemi kullanıcı tarafından yapılmalı. Şifre veya anahtarlar sohbet üzerinden istenmemeli.
- Üretim için Neon PostgreSQL ve Cloudflare R2/S3 uyumlu özel dosya deposu desteği, `Dockerfile`, `.dockerignore`, `render.yaml`, React/Cloudflare Worker yönlendirme dosyaları eklendi. Üretim PostgreSQL bağlantısında TLS sunucu sertifikası doğrulaması zorunlu. ASP.NET veri koruma anahtarları üretimde PostgreSQL'de saklanır; çerez Secure/HttpOnly/SameSite Strict. DB'de tutulan anahtarların ayrıca şifrelenmesi değerlendirilmelidir. Render ücretsiz servisi yerel verileri saklamak için kullanılmaz.
- Yönetici için ZIP yedeği eklendi: dersler, defterler, dosya bilgileri ve çöpteki öğeler JSON'a, dosyalar arşive dahil. Arşivde kimlik bilgileri veya oturum anahtarları yok. Büyük dosyalar akışla işlenir; eksik nesne arşiv başlamadan kontrol edilir. Eş zamanlı değişiklikler sırasında anlık görüntü/kurtarma garantisi henüz yok; otomatik geri yükleme uygulanmadı.
- Dosya sınırı Cloudflare ücretsiz katmanının istek boyutu için pay bırakarak 100 MB'tan 95 MB'a düşürüldü. Yerel dosya işlemleri yeni depolama soyutlamasıyla çalışır. Üretim R2 bağlantısı gerçek hesapla henüz denenmedi; yedek/kurtarma ve yerel verilerin PostgreSQL/R2'ye güvenli taşıma yolu tamamlanmadan Faz 4 bitmiş sayılmamalı. Mevcut yerel veriler yeni üretim veritabanına otomatik geçmez.
- .NET ve React derlemeleri, Docker imajı oluşturma ve gizli yerel dosyaların imajdan dışlanması doğrulandı. PostgreSQL için geçici Docker veritabanıyla üretim oturumu ve yeniden başlatma sonrası aynı çerezin geçerliliği test edildi; bu test zorunlu TLS sertifika doğrulaması eklenmeden önce, yerel TLS'siz ortamda yapıldı. Gerçek Neon TLS bağlantısı henüz sınanmadı. Worker statik yönlendirmesi, API hedef kontrolü, çerez ve no-store davranışı yerel taklitle kontrol edildi.
- Geçici veriyle yönetici yedek ZIP'inin metadata ve dosya içerdiği, misafir yedek isteğinin 403 olduğu ve yeni depolama soyutlaması üzerinden dosya görüntüleme/silmenin çalıştığı doğrulandı. Geçici test verileri ve PostgreSQL konteyneri temizlendi. AWS/R2 SDK ve TLS ayarlarının gerçek hizmette davranışı henüz doğrulanmadı.
- Ayrıntılı hazırlık ve bekleyen işlemler `YAYIN_HAZIRLIGI.md` dosyasında. Sonraki adım: gerekli hesap oturumları ve Neon üyeliğinden sonra özel R2 ve boş Neon veritabanını kur, gerçek sırları güvenli yoldan sağla; yedek geri yükleme ve yerel veriyi kayıpsız taşıma yolunu tamamla ve test et; Render/Cloudflare dağıt, gerçek ortamda tüm roller ve dosya/defter/yedek akışlarını doğrula. Faz 4 hâlâ devam ediyor, site canlı değil.

## 2 Kasım 2026 — Yedek geri yükleme hazırlığı

- Çevrimdışı `--restore-backup <yedek.zip>` aracı eklendi. Yalnızca boş bir hedef veritabanına aktarır, hedefte ders/dosya/defter varsa reddeder; ders kimliklerini yeniden eşler, defter ve çöp durumlarını korur. Yedek biçimi, dosya anahtarları, boyutlar ve desteklenen türler doğrulanır; dosyalar yeni nesne anahtarlarıyla aktarılır. Hata durumunda veritabanı işlemi geri alınır; nesne deposunda kullanılmayan kopyalar kalabilir ve dikkatli temizlik gerekir.
- Geçici yerel SQLite ve dosya deposuyla ZIP yedeğinden ders, değiştirilmiş defter ve çöpteki dosya geri yüklendi; dosya çöpten alınıp içeriği doğrulandı. Dolu hedefe geri yükleme reddedildi ve mevcut iki ders korundu. Gerçek Neon/R2'ye geri yükleme henüz test edilmedi.
- Uygulamanın ilk üretim açılışı örnek dersleri oluşturduğu için yerel veriler taşınacaksa geri yükleme ayrı boş Neon veritabanına ilk yayın/başlatmadan önce, API kapalıyken yapılmalıdır. `YAYIN_HAZIRLIGI.md` buna göre güncellendi.

## 2 Kasım 2026 — Hesap oturumları

- Kullanıcı Neon hesabını oluşturduğunu ve gerekli hesap oturumlarını açtığını bildirdi. Açık Chrome penceresi Neon'u gösteriyor; ancak bilgisayar kullanımı aracı Chrome'a erişim için onay almadığını bildirdi. Uygulama içi tarayıcıda açılan yeni Neon sekmesi hâlâ giriş ekranına yönlendi. Kullanıcıdan hesapları yeniden oluşturmadan, erişilebilir uygulama içi tarayıcıda Neon, Cloudflare ve Render oturumlarını açması açılır soruyla istendi. Parolalar veya anahtarlar sohbette istenmedi.
- Bu oturumlar erişilebilir olana kadar hesap panellerinde kaynak oluşturma, gerçek R2/Neon bağlantıları ve canlı yayın doğrulanmış değildir. Faz 4 devam ediyor; bekleyen kurulum ve veri taşıma adımları için `YAYIN_HAZIRLIGI.md` dosyasını oku.
