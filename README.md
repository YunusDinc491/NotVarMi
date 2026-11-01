# NotVarMı

Kişisel ders notları için React ve ASP.NET Core uygulaması. Projenin kapsamı ve kalan işler için [faz planına](FAZ_PLANI.md), son durum için [ilerleme kaydına](ILERLEME.md) bakın.

## Yerelde çalıştırma

Gereksinimler: .NET 10 SDK, güncel Node.js ve PowerShell 7. `NotVarMi.sln` Visual Studio'da açılabilir. Bu faz yerel geliştirme içindir; üretim yapılandırması henüz tamamlanmamıştır.

1. İlk kez başka bir bilgisayarda kuruyorsanız proje kökünde `pwsh -File scripts/setup-accounts.ps1` komutunu çalıştırın ve iki hesap için şifreleri gizli istemlere girin. Script mevcut hesap dosyasının üzerine yazmaz. Bu bilgisayarda hesap ayarları zaten oluşturulmuştur.
2. Bir terminalde proje kökünde `dotnet run --project server/NotVarMi.Api --launch-profile http` çalıştırın. API `http://localhost:5101` adresinde açılır.
3. Ayrı bir terminalde `cd client`, ardından ilk kurulumda `npm ci` ve `npm run dev` çalıştırın. Vite'ın gösterdiği yerel adresi açın.

Kullanıcı adları `yunusdinc` ve `misafir`dir. Parola özetleri `server/NotVarMi.Api/appsettings.Local.json` içinde, geliştirme oturum anahtarları `.keys` klasöründe tutulur; bu dosyalar Git'e eklenmez. Yerel SQLite verileri API klasöründeki `notvarmi.local.db` dosyasında, yüklenen dosyalar `.uploads` klasöründedir; bunlar Git'e eklenmez. Bunları silmek yerel verileri veya oturumları etkiler. Verileri taşımak veya yedeklemek için veritabanı ve `.uploads` birlikte korunmalıdır. İlk veritabanında başlangıç dersleri bulunur. Faz 1 SQLite şeması açılışta korunarak Faz 2'ye yükseltilir. İleride yeni şema değişiklikleri için sürümlü geçiş mekanizması eklenmelidir.

## Dersler ve dosyalar

Yönetici ders ekleyebilir, adını değiştirebilir ve çöpe taşıyabilir; ders sayfasında dosya yükleyebilir ve metin notu ekleyip düzenleyebilir. PDF, PNG, JPEG, WebP, TXT ve yaygın Office belgeleri desteklenir; dosya başına sınır 100 MB'tır. PDF, resim ve metinler görüntülenebilir; dosyalar indirilebilir. Misafir görüntüleme ve indirme yapabilir, yönetim işlemleri yapamaz. Geri dönüşüm kutusu yalnızca yöneticiye gösterilir; öğeler geri getirilebilir veya onay sonrası kalıcı silinebilir. Bir ders çöpteyken dosyaları onunla korunur; daha önce ayrı silinmiş dosyalar ders geri geldiğinde yine çöpte kalır.

Üretime geçmeden önce kalıcı bir veritabanı ve özel dosya depolaması, güvenli HTTPS/aynı kökenli API erişimi, oturum anahtarları, gerçek ortam sırları ve yedekleme kurulmalıdır. API yanlışlıkla geçici üretim depolamasıyla açılmamak için şu anda geliştirme dışı ortamda başlamaz.
