import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const base = dirname(fileURLToPath(import.meta.url));
const read = path => readFileSync(join(base, path), 'utf8');
function build(output, html, css, js) {
  // Bağlı vendor dosyaları yerel önizleme içindir. Site içe aktarırken link ve src scriptlerini kaldırır.
  const document = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NotVarMı defter önizlemesi</title><link rel="stylesheet" href="vendor/fonts/notebook-fonts.css"><link rel="stylesheet" href="vendor/notebook/pager.css"><script>window.MathJax={tex:{inlineMath:[['\\\\(','\\\\)']],displayMath:[['\\\\[','\\\\]'],['$$','$$']]},svg:{fontCache:'global'},options:{enableMenu:false}}</script><script defer src="vendor/mathjax/tex-svg-full.js"></script><style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style></head><body>\n${html}\n<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script><script src="vendor/notebook/pager.js"></script></body></html>`;
  writeFileSync(join(base, output), document);
}
build('ornek-onizleme.html', read('sablon/icerik.html'), read('sablon/defter.css'), read('sablon/etkilesim.js'));
build('referans-onizleme.html', read('referans/heat-defter.html'), read('referans/heat-defter.css'), read('referans/heat-defter.js'));
console.log('Örnek ve referans önizlemeleri oluşturuldu.');
