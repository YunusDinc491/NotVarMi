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
