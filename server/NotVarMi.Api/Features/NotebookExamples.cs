using NotVarMi.Api.Data;

namespace NotVarMi.Api.Features;

internal static class NotebookExamples
{
    public static Notebook ForCourse(Course course)
    {
        var isHeat = course.Name.Equals("Heat Transfer", StringComparison.OrdinalIgnoreCase);
        var isFluid = course.Name.Equals("Fluid Mechanics", StringComparison.OrdinalIgnoreCase);
        var title = isHeat ? "Isı nasıl yolculuk eder?" : isFluid ? "Akışın izini sürmek" : "Bu defter senin.";
        var eyebrow = isHeat ? "01 / ISI TRANSFERİ" : isFluid ? "01 / AKIŞKANLAR MEKANİĞİ" : "01 / İLK SAYFA";
        var intro = isHeat ? "Sıcaklık farkı varsa enerji hareket eder. Bu küçük çizim, iletim yoluyla ısının sıcaktan soğuğa doğru aktarılmasını temsil eder." : isFluid ? "Akışkan parçacıkları hareket ederken bir hız alanı oluşturur. Çizimdeki hareketli noktalar, bir kanaldaki akış fikrini temsil eder." : "Bu sayfayı kendi ders anlatımın için düzenleyebilirsin. Metinler, çizimler ve küçük etkileşimler ekleyebilirsin.";
        var left = isHeat ? "SICAK" : isFluid ? "GİRİŞ" : "BAŞLA";
        var right = isHeat ? "SOĞUK" : isFluid ? "ÇIKIŞ" : "KEŞFET";
        var detail = isHeat ? "İletim, maddenin bütünü yer değiştirmeden enerji aktarılmasıdır. Gerçek ısı akışı malzeme, sıcaklık farkı ve geometriye bağlıdır." : isFluid ? "Bu çizim yalnızca kavramı görselleştirir. Gerçek akış davranışı hız, geometri ve akışkan özelliklerine bağlıdır." : "Düzenleme alanından HTML, CSS ve JavaScript ile bu örnek içeriği değiştirebilirsin.";
        return new Notebook
        {
            CourseId = course.Id,
            Html = $$"""
                <article class="lesson">
                  <div class="lesson-top"><span>{{eyebrow}}</span><span>NOTVARMI · DERS DEFTERİ</span></div>
                  <p class="overline">KÜÇÜK BİR BAKIŞ</p>
                  <h1>{{title}}</h1>
                  <p class="lead">{{intro}}</p>
                  <section class="figure" aria-label="Hareketli ders çizimi">
                    <div class="figure-top"><span>FİKİR ÇİZİMİ</span><button id="motion" type="button">Duraklat</button></div>
                    <div class="diagram"><span class="endpoint warm">{{left}}</span><div class="track"><i></i><i></i><i></i><i></i></div><span class="endpoint cool">{{right}}</span></div>
                    <p>Şekil 01 — Hareketi görmek için çizimi izle.</p>
                  </section>
                  <section class="explanation"><div class="index">01</div><div><h2>Temel fikir</h2><p>{{detail}}</p></div></section>
                  <aside><strong>Kendine bir soru sor</strong><p>Bu hareketin yönü veya hızı hangi koşullarda değişebilir?</p></aside>
                  <div class="page-end"><span>NOTLARINA YER AÇ</span><span>01</span></div>
                </article>
                """,
            Css = """
                * { box-sizing: border-box; }
                body { margin: 0; color: #29392f; font-family: Georgia, 'Times New Roman', serif; }
                .lesson { max-width: 730px; margin: 0 auto; padding: 38px 46px 60px; }
                .lesson-top, .page-end { display: flex; justify-content: space-between; gap: 20px; color: #98a095; font: 700 9px/1.5 Arial, sans-serif; letter-spacing: 1.5px; }
                .lesson-top { padding-bottom: 20px; border-bottom: 1px solid #e9e8dc; }
                .overline { margin: 54px 0 13px; color: #b68470; font: 700 10px Arial, sans-serif; letter-spacing: 2px; }
                h1 { font-weight: 400; font-size: clamp(35px, 5vw, 55px); line-height: 1.12; letter-spacing: -1px; margin: 0; }
                .lead { font: 16px/1.9 Georgia, serif; color: #6d796d; max-width: 570px; margin: 22px 0 35px; }
                .figure { background: #edf3e9; border-radius: 12px; padding: 21px 25px 18px; }
                .figure-top { display: flex; justify-content: space-between; align-items: center; font: 700 9px Arial, sans-serif; letter-spacing: 1.5px; color: #88a08b; }
                button { border: 1px solid #cfdecb; border-radius: 20px; padding: 7px 12px; background: #fff9; color: #638069; font: 11px Arial, sans-serif; cursor: pointer; }
                .diagram { display: flex; align-items: center; gap: 12px; padding: 48px 0; }
                .endpoint { font: 700 10px Arial, sans-serif; letter-spacing: 1px; color: #a46f5e; }
                .cool { color: #719598; }
                .track { position: relative; flex: 1; height: 34px; overflow: hidden; border-radius: 20px; background: linear-gradient(90deg,#dfad94,#e2ddd0,#b7d4d1); }
                .track i { position: absolute; left: -10px; top: 13px; width: 8px; height: 8px; border-radius: 50%; background: white; animation: flow 4s linear infinite; }
                .track i:nth-child(2) { animation-delay: 1s; } .track i:nth-child(3) { animation-delay: 2s; } .track i:nth-child(4) { animation-delay: 3s; }
                .paused .track i { animation-play-state: paused; } @keyframes flow { to { left: 100%; } }
                .figure > p { color: #8c9e8d; font: italic 11px Georgia, serif; margin: 0; }
                .explanation { display: flex; gap: 20px; margin: 45px 0 30px; }
                .index { color: #b3c4b0; font: 22px Georgia, serif; } h2 { margin: 0 0 10px; font-weight: 400; font-size: 23px; }
                .explanation p, aside p { color: #758075; font: 14px/1.8 Georgia, serif; margin: 0; }
                aside { border-left: 3px solid #dfb8a2; padding: 6px 0 6px 18px; }
                aside strong { font: 700 11px Arial, sans-serif; color: #aa7c6b; } aside p { margin-top: 8px; }
                .page-end { border-top: 1px solid #e9e8dc; margin-top: 70px; padding-top: 18px; }
                @media (max-width: 600px) { .lesson { padding: 28px 22px 45px; } .overline { margin-top: 38px; } .diagram { padding: 38px 0; gap: 8px; } .endpoint { font-size: 8px; } }
                @media (prefers-reduced-motion: reduce) { .track i { animation: none; } }
                """,
            Javascript = """
                const button = document.getElementById('motion');
                button?.addEventListener('click', () => {
                  const paused = document.body.classList.toggle('paused');
                  button.textContent = paused ? 'Devam et' : 'Duraklat';
                });
                """
        };
    }
}
