# NotVarMı — Yayın hazırlığı

Durum: Render API'si yayınlandı ve Neon/R2 ile temel işlemler doğrulandı. Cloudflare Worker ve alan adı henüz yayınlanmadı; uçtan uca son kontrol bekliyor.

## Hedef mimari

- `notvarmi.bid`: Cloudflare Worker, React derlemesi ve `/api/*` isteklerinin Render'a HTTPS üzerinden yönlendirilmesi.
- Render ücretsiz Docker web servisi: ASP.NET Core API; boşta uyur ve yerel dosyaları kalıcı değildir.
- Ayrı Neon PostgreSQL veritabanı: dersler, defterler, dosya bilgileri ve oturum koruma anahtarları. Uygulama tabloları `notvarmi` şemasındadır; başka şemalardaki tablolar değiştirilmez. Üretim bağlantısı sunucu sertifikasını doğrulayacak şekilde TLS kullanır.
- Özel Cloudflare R2 bucket: yüklenen dosyalar. Bucket herkese açık yapılmaz; dosyalara API yetkilendirmesiyle erişilir.

Neon ücretsiz kota, R2 etkinleştirme koşulları ve Render bant genişliği sınırları kurulumda tekrar kontrol edilmeli. R2 abonelik etkinleştirmesi ve başka servislerin üyelik koşulları kullanıcı tarafından tamamlanır; şifreler, bağlantı adresleri, API anahtarları ve hesap özetleri sohbete veya Git'e yazılmaz.

## Dağıtım için hazırlanmış dosyalar

- `Dockerfile`, `.dockerignore`, `render.yaml`: API imajı ve Render ayarlarının şablonu. Yerel hesap dosyası, veritabanı ve yüklemeler imajdan dışlanır.
- `client/worker.js`, `client/wrangler.jsonc`: React dosyalarını sunan ve API isteklerini aynı kökenden Render'a aktaran Worker. Gizli olmayan `API_ORIGIN` değeri `https://notvarmi.onrender.com` olarak yapılandırıldı. Worker adı `notvarmi`; Git build için kök dizin `client`, build komutu `npm ci && npm run build`, deploy komutu `npm run deploy` kullanılabilir. Mevcut başka bir Worker ile isim çakışması varsa üzerine yazılmamalı.
- Üretim, SQLite yerine PostgreSQL; yerel klasör yerine R2 kullanır. İlk açılışta `notvarmi` şeması ve tabloları yoksa oluşturulur; diğer şemalardaki tablolar bu işlemi engellemez veya değiştirilmez. Uygulama tabloları kısmen mevcutsa sistem verileri korumak için otomatik değiştirmeden durur. Önceden kullanılmış veritabanında otomatik şema güncellemesi/taşıması garanti edilmez.

Render ortam değişkenleri `render.yaml` içinde listelenmiştir: `ConnectionStrings__Notes`, `Accounts__Admin__PasswordHash`, `Accounts__Viewer__PasswordHash`, `R2__Endpoint`, `R2__Bucket`, `R2__AccessKeyId`, `R2__SecretAccessKey`. PostgreSQL için Neon'un bağlantı URI'si veya Npgsql bağlantı dizgesi kullanılabilir. Hesap özetleri bu bilgisayardaki Git dışı `server/NotVarMi.Api/appsettings.Local.json` dosyasındadır; bunlar kullanıcı tarafından veya izinli, gizli bir yapılandırma yoluyla doğrudan Render'a aktarılmalı, Git'e eklenmemelidir. R2 anahtarları yalnızca ilgili bucket için nesne okuma/yazma yetkisiyle oluşturulmalıdır.

## Yedek ve mevcut yerel veri

Yönetici üst menüdeki **Yedek indir** düğmesiyle ZIP alabilir. ZIP içindeki `notvarmi-veriler.json`, dersleri, defterleri, dosya bilgilerini ve çöp durumunu; `dosyalar/` ise dosyaları içerir. Yedek özel ders içeriği içerdiğinden güvenli saklanmalıdır. Yedekleme sırasında içerik değiştirilmemesi önerilir; değişikliklerle eşzamanlı tutarlı anlık görüntü garantisi yoktur.

**Yerel önizleme verileri üretime otomatik aktarılmaz.** Yerelde oluşturulan ders veya dosyalar varsa yayın öncesi yedeği alınmalıdır. Bunun için çevrimdışı `--restore-backup <yedek.zip>` aracı eklendi: yalnızca boş hedef veritabanına aktarım yapar ve dolu hedefi değiştirmeyi reddeder. Araç API servisi kapalıyken, ayrılmış boş hedef ve özel dosya deposu yapılandırılarak çalıştırılmalıdır. Üretim sunucusu ilk açılışta örnek dersler eklediğinden, yerel veri aktarımı gerekiyorsa ilk yayından önce yapılmalıdır. Sırlar komut satırı argümanlarına veya Git'e yazılmadan ortam değişkenleriyle sağlanır. İçe aktarma sırasında hata olursa kullanılmayan nesneler depoda kalabilir; gerçek verilerle temizlikten önce kontrol gerekir. Araç yerel SQLite/dosya sistemi üzerinde gidiş-dönüş test edildi, Neon/R2 üzerinde henüz sınanmadı.

## Yayın öncesi doğrulama

1. Ayrılmış boş Neon veritabanı ve özel R2 bucket hazırlanır; test anahtarlarının kapsamı kontrol edilir.
2. Render servisi gerçek sırlarla yapılandırılır, bağlantı ve yeniden başlatma sonrası oturum doğrulanır. (Temel giriş, rol ve R2 dosya akışı doğrulandı; yeniden başlatma ve Worker üzerinden çerez kontrolü bekliyor.)
3. Cloudflare Worker derlenir ve alan adı bağlanır; HTTPS, aynı kökenli oturum ve statik/API yönlendirmesi kontrol edilir.
4. Yönetici/misafir girişleri; dosya yükleme, görüntüleme, indirme, çöp/geri getirme; defter yalıtımı; yedek arşivi ve gerçek depolama uçtan uca doğrulanır. Yerel veriler taşınacaksa önce boş hedefte aktarım ve geri yükleme kontrolü yapılır.
5. Kullanım ve maliyet sınırları, yedekleme sıklığı ve kurtarma yolu doğrulanmadan Faz 4 tamamlandı sayılmaz.
