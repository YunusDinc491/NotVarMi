# NotVarMı defter şablon paketi

Bu paket, farklı derslerden NotVarMı görünümünde defter oluşturmak için hazırlanmıştır. İçindeki örnek, gerçek ders notu değil, şablon gösterimidir. Referans Isı Transferi defteri mevcut tasarımın ve anlatımın örneğidir; yeni derse konu veya kaynak olarak taşınmaz.

## Başka bir Codex oturumunda

1. ZIP dosyasını yükle; Codex'ten arşivi açmasını ve bu dosyayı, `YENI-OTURUM-TALIMATI.md` dosyasını ve `referans/DEFTER_SAYFA_YAPISI.md` dosyasını okumasını iste.
2. Hoca özetini ve varsa kitap sayfalarını ayrıca ver. Dosya adını veya yalnızca bir bağlantıyı vermek yerine kaynak içeriğine erişim sağla.
3. `YENI-OTURUM-TALIMATI.md` içindeki isteği gönder. Önce ayrı bir çalışma ve önizleme iste; sitedeki canlı defterin değiştirilmesini ayrıca istemedikçe yapma.

Yeni oturum, ZIP yüklemesini desteklemiyorsa arşivi açıp tüm klasörü kullanabileceği bir çalışma alanına koy. Yalnızca MD dosyası tasarımı çalıştırmak için yeterli değildir.

## Paket içeriği

- `ornek-onizleme.html`: formül, kutular, sayfalama ve çalışan kaydırıcı içeren küçük örnek.
- `referans-onizleme.html`: mevcut Isı Transferi defterinin tam tasarım referansı.
- `sablon/`: küçük örneğin HTML, CSS ve JS kaynakları. Yeni ders için CSS temel alınır, örnek HTML ve JS yeni içerikle değiştirilir.
- `referans/`: özgün defterin üç alanı ve ayrıntılı yapı belgesi. Gerçek örnek sayfaları ve etkileşimleri burada incelenir.
- `vendor/`: yerel yazı tipleri, MathJax ve sayfalayıcı; çevrimdışı çalışır. Lisanslar kendi klasörlerindedir.
- `olustur.mjs`: kaynakları iki önizleme HTML dosyasına birleştirir. Node.js gerekir: `node olustur.mjs`.

## Önizleme ve siteye aktarma

ZIP'i tamamen aç ve `ornek-onizleme.html` veya `referans-onizleme.html` dosyasını aç. `vendor` klasörü HTML dosyasıyla aynı konumda kalmalıdır. Tarayıcın yerel dosya erişimini kısıtlarsa klasörde `npx` veya internet gerektirmeyen bir yerel sunucu kullan: `python -m http.server 8000` ya da ortamındaki eşdeğer sunucu; sonra `http://localhost:8000` adresini aç.

Önizlemenin kök HTML dosyası, içerik CSS ve JS'ini tek dosyada taşır. NotVarMı'da **Düzenle → .html içe aktar → Kaydet** ile aktarılabilir: uygulama HTML/CSS/JS alanlarını ayırır ve yerel MathJax, yazı tipi ve sayfalayıcıyı kendisi sağlar. İçe aktarma üç alanın tamamını değiştirir; üzerinde çalışılmış deftere aktarmadan önce mevcut içeriği koru. Örnek veya referans dosyasını yanlışlıkla gerçek dersin üzerine kaydetme.

Bağımsız önizleme dosyası tek başına taşınabilir değildir: formüller ve sayfa çevirme için yanındaki `vendor` klasörü gerekir. Sunulan HTML dosyası sitede ayrı biçimde çalışır; sitede `vendor` dosyaları uygulamadan gelir. Dosya boyutu, formüller, hareketler ve mobil görünüm hedef ortamda kontrol edilmelidir.

## Son kontrol

Kaynak numaralarını ve sayıları uydurma; hoca, kitap ve ek açıklamayı ayır. Formüllerin dizildiğini, sayfaların ve içindekilerin çalıştığını, etkileşimlerin gerçek hesapları verdiğini ve mobilde taşma olmadığını test et. Test edemediğin adımları açıkça belirt.
