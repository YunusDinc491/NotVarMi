# NotVarMı

Kişisel ders notları için React ve ASP.NET Core uygulaması. Site [notvarmi.bid](https://notvarmi.bid/) adresinde yayındadır. Yeni bir oturumda önce [devir notunu](DEVIR_NOTU.md), ardından [faz planını](FAZ_PLANI.md) ve [ilerleme kaydını](ILERLEME.md) okuyun.

## Yerelde çalıştırma

Gereksinimler: .NET 10 SDK, güncel Node.js ve PowerShell 7. `NotVarMi.sln` Visual Studio'da açılabilir. Yerel geliştirme SQLite ve yerel dosyaları kullanır; canlı site ayrı bulut verilerini kullanır.

1. İlk kez başka bir bilgisayarda kuruyorsanız proje kökünde `pwsh -File scripts/setup-accounts.ps1` komutunu çalıştırın ve iki hesap için şifreleri gizli istemlere girin. Script mevcut hesap dosyasının üzerine yazmaz. Bu bilgisayarda hesap ayarları zaten oluşturulmuştur.
2. Bir terminalde proje kökünde `dotnet run --project server/NotVarMi.Api --launch-profile http` çalıştırın. API `http://localhost:5101` adresinde açılır.
3. Ayrı bir terminalde `cd client`, ardından ilk kurulumda `npm ci` ve `npm run dev` çalıştırın. Vite'ın gösterdiği yerel adresi açın.

Kullanıcı adları `yunusdinc` ve `misafir`dir. Parola özetleri `server/NotVarMi.Api/appsettings.Local.json` içinde, geliştirme oturum anahtarları `.keys` klasöründe tutulur; bu dosyalar Git'e eklenmez. Yerel SQLite verileri API klasöründeki `notvarmi.local.db` dosyasında, yüklenen dosyalar `.uploads` klasöründedir; bunlar Git'e eklenmez. Bunları silmek yerel verileri veya oturumları etkiler. Verileri taşımak veya yedeklemek için veritabanı ve `.uploads` birlikte korunmalıdır. İlk veritabanında başlangıç dersleri bulunur. Faz 1 SQLite şeması açılışta korunarak Faz 2'ye yükseltilir. İleride yeni şema değişiklikleri için sürümlü geçiş mekanizması eklenmelidir.

## Dersler ve dosyalar

Yönetici ders ekleyebilir, adını değiştirebilir ve çöpe taşıyabilir; ders sayfasında dosya yükleyebilir ve metin notu ekleyip düzenleyebilir. PDF, PNG, JPEG, WebP, TXT ve yaygın Office belgeleri desteklenir; dosya başına sınır 95 MB'tır. PDF, resim ve metinler görüntülenebilir; dosyalar indirilebilir. Misafir görüntüleme ve indirme yapabilir, yönetim işlemleri yapamaz. Geri dönüşüm kutusu yalnızca yöneticiye gösterilir; öğeler geri getirilebilir veya onay sonrası kalıcı silinebilir. Bir ders çöpteyken dosyaları onunla korunur; daha önce ayrı silinmiş dosyalar ders geri geldiğinde yine çöpte kalır.

## Defterler

Her dersin bir defteri vardır. Yönetici ders sayfasında **Defteri aç → İçeriği düzenle** ile HTML, CSS ve JavaScript alanlarını düzenler; önizleme anlık güncellenir ve Kaydet ile içerik saklanır. Başlangıç derslerinde örnek anlatımlar bulunur. Misafir defteri okuyabilir ve etkileşimleri kullanabilir, düzenleyemez. Bir ders çöpe taşınırsa defteri de saklanır ve ders geri getirildiğinde geri gelir. Defterde indirme seçeneği yoktur.

İçerik güvenlik amacıyla `allow-scripts` yetkili, farklı kökenli sandbox iframe'de çalışır; ana uygulamaya, oturuma ve API'ye erişemez. Harici ağ bağlantıları, çevrimiçi kütüphaneler ve URL ile yüklenen resimler kapalıdır; kendi içindeki JavaScript, CSS, SVG ve `data:` resimleri kullanılabilir. Kaydedilmemiş değişikliklerde kapatmadan önce uyarı gösterilir; başka bir yerde güncellenmiş içerik eski sürümle ezilmez. Yerelde defter verileri SQLite veritabanındadır; `.uploads` ile birlikte yedeklenmelidir. Canlı defter verileri Neon'dadır.

Üretim yapılandırması ve açık kalan işler [yayın hazırlığı](YAYIN_HAZIRLIGI.md) dosyasındadır. Canlı ortamın temel akışları doğrulandı. Yerel veriler üretime veya başka bilgisayarlara otomatik aktarılmaz.
