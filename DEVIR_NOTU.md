# NotVarMı — Yeni oturum için devir notu

Son doğrulanan durum: 2 Kasım 2026. Site https://notvarmi.bid adresinde yayında; GitHub deposu https://github.com/YunusDinc491/NotVarM-.git, ana dal `main`.

## Önce bunları oku

Bu belge güncel özettir. Ardından `FAZ_PLANI.md`, `ILERLEME.md` ve ihtiyaç varsa `YAYIN_HAZIRLIGI.md` okunmalı. İlerleme kaydı kronolojiktir: eski bölümlerdeki “henüz yapılmadı” ifadeleri o tarihteki durumu anlatır; güncel durum için son bölümlere bak. Yeni çalışmadan önce Git çalışma ağacını, uzak dalı ve belgelerin güncelliğini kontrol et.

## Kullanıcının çalışma tercihleri

- Kullanıcı işin doğrudan yapılmasını ve ilerleme raporu verilmesini istiyor; ders anlatır gibi yönlendirme istemiyor. Hesap panellerindeki işlemleri kendisi yapmak istiyor: yalnızca gerçekten gerekli adımları kısa ve sıralı tarif et.
- Karar gerektiren soruları mümkünse açılır soruda toplu sor; önerini ve nedenini belirt. Daha iyi bir fikir veya düzeltme varsa kullanıcıya sun. Kullanıcının açık talimatlarına uy.
- Aşama sonunda yapılanları, asistanın sonraki işini ve kullanıcının zorunlu yapacağı bir şey varsa belirt; sonraki aşamaya geçilip geçilmeyeceğini sor. Anlamlı önizleme varsa göster.
- Güvenlik kontrollerine önem ver; kullanıcı güvenlik dışında gereksiz test altyapısı istemiyor. Kullanıcı commit ve GitHub'a push yetkisi verdi; mevcut değişiklikleri koru ve yayın sonrası durumu doğrula.

## Teknik durum

- Arayüz: `client/` içinde React/Vite; Cloudflare Worker statik dosyaları sunar ve `/api/*` isteklerini Render'a aktarır. Kaynak `client/worker.js`, yapılandırma `client/wrangler.jsonc`. Worker adı `notvarmi`, Cloudflare build kökü `client`; build `npm ci && npm run build`, deploy `npm run deploy`.
- API: `server/NotVarMi.Api/` altında ASP.NET Core/.NET 10; Render servisi `https://notvarmi.onrender.com`. Üretim veritabanı Neon PostgreSQL'de `notvarmi` şemasında; dosyalar özel Cloudflare R2 bucket'ında. Canlı ortam değişkenleri Render'da, Git deposunda değil.
- Yönetici ve misafir için giriş/rol ayrımı, dersler, dosyalar, notlar, geri dönüşüm kutusu, defter ve yönetici ZIP yedeği var. Her dersin HTML/CSS/JavaScript defteri ayrı sandbox iframe'de çalışır; harici ağ kaynakları engellidir. İndirilebilir yedek ve boş hedefe çevrimdışı geri yükleme aracı bulunur.
- Canlı HTTPS ve iki rol, misafir yetki sınırı, geçici dosya yükleme/okuma, defter ve yedek indirme doğrulandı. Gerçek Neon/R2 üzerinde geri yükleme ayrı boş hedefte henüz test edilmedi. Render ücretsiz servis uykuya geçebilir; dosya yükleme sınırı 95 MB. Yedekler elle indirilir.
- Cloudflare Git bağlantısı kullanıcı tarafından düzeltildi; GitHub push sonrası güncel ön yüzün otomatik yayınlandığı doğrulandı. Hem Render hem Cloudflare otomatik dağıtım yapabileceğinden push canlı siteyi etkileyebilir.

## Başka bilgisayarda dikkat

Git yalnızca kaynak kodunu ve bu belgeleri getirir. `appsettings.Local.json`, yerel SQLite veritabanı, `.uploads`, yerel oturum anahtarları, `node_modules`, derleme çıktıları ve tüm bulut sırları Git dışındadır. Canlı notlar ve dosyalar Git'te değil, Neon ve R2'dedir; depoyu çekmek onları yeni bilgisayarın yerel veritabanına kopyalamaz. Canlı siteye tarayıcıdan erişim için repo gerekmez.

Yerel çalıştırma için README'deki ilk kurulum adımlarını uygula. Yeni yerel hesap ayarları `scripts/setup-accounts.ps1` ile kullanıcıdan alınan şifrelerle oluşturulur; canlı hesaplardaki parolaları değiştirmez. Canlı Render/Cloudflare/Neon yapılandırması için ilgili hesaplara yetkili erişim gerekir. Şifreleri, bağlantı dizgelerini, R2 anahtarlarını ve yedekleri Git'e veya sohbete yazma.

Canlı verileri yerelde kullanmak ya da bir ortamı geri yüklemek istenirse önce güvenli yedek al, hedefin boş olduğunu doğrula ve `YAYIN_HAZIRLIGI.md` içindeki sınırlamaları incele; canlı veritabanını silme veya üzerine yazma. Kalıcı silme sırasında nesne deposu hataları kayıt silindikten sonra yutulabileceğinden fiziksel silme ayrıca doğrulanmadı; ilgili işlemi değiştirirken bu riski ele al.
