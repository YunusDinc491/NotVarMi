// The downloaded HTML includes the same local runtime as the notebook viewer.
export async function exportNotebook(book, format) {
  const [{ default: fonts }, { default: pagerCss }, { default: pager }, { default: mathjax }] = await Promise.all([
    import('../public/vendor/fonts/notebook-fonts.css?raw'),
    import('../public/vendor/notebook/pager.css?raw'),
    import('../public/vendor/notebook/pager.js?raw'),
    import('../public/vendor/mathjax/tex-svg-full.js?raw'),
  ])
  const safeStyle = value => value.replace(/<\/style/gi, '<\\/style')
  const safeScript = value => value.replace(/<\/script/gi, '<\\/script')
  const config = `window.MathJax={tex:{inlineMath:[['\\\\(','\\\\)']],displayMath:[['\\\\[','\\\\]'],['$$','$$']]},svg:{fontCache:'global'},options:{enableMenu:false}};`
  const print = format === 'pdf' ? `<script data-nv-runtime>window.addEventListener('message',async function(e){if(e.source!==parent||e.data!=='notvarmi-print')return;try{if(window.MathJax&&MathJax.startup)await MathJax.startup.promise;if(document.fonts)await document.fonts.ready;}catch(_){}window.print()},{once:true});parent.postMessage('notvarmi-print-ready','*');</script>` : ''
  const csp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'"
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>Defter</title><style data-nv-runtime>${safeStyle(fonts)}\n${safeStyle(pagerCss)}</style><style>${safeStyle(book.css)}</style><script data-nv-runtime>${config}</script><script data-nv-runtime>${safeScript(mathjax)}</script></head><body>${book.html}<script>${safeScript(book.javascript)}</script><script data-nv-runtime>${safeScript(pager)}</script>${print}</body></html>`
  if (format === 'html') {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = `${(book.name || 'defter').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_')}.html`
    document.body.appendChild(link); link.click(); link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60000)
    return
  }
  const frame = document.createElement('iframe')
  frame.hidden = true; frame.setAttribute('sandbox', 'allow-scripts allow-modals'); frame.title = 'PDF yazdırma'
  let timeout
  const cleanup = () => { clearTimeout(timeout); window.removeEventListener('message', ready); frame.remove() }
  const ready = event => {
    if (event.source !== frame.contentWindow || event.data !== 'notvarmi-print-ready') return
    window.removeEventListener('message', ready)
    frame.contentWindow.postMessage('notvarmi-print', '*')
    // Keep the isolated document alive while the browser's print dialog is open.
    window.addEventListener('afterprint', cleanup, { once: true })
    timeout = setTimeout(cleanup, 300000)
  }
  window.addEventListener('message', ready)
  frame.srcdoc = html; document.body.appendChild(frame)
  timeout = setTimeout(cleanup, 30000)
}
