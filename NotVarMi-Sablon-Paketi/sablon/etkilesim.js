(function(){
  const $=id=>document.getElementById(id); if(!$('ornekmesafe')) return;
  function upd(){
    const d=+$('ornekmesafe').value,t=+$('orneksure').value;
    $('vornekmesafe').textContent=d; $('vorneksure').textContent=t;
    $('ornekhiz').textContent=(d/t).toFixed(1);
    $('orneknokta').setAttribute('cx',90+540*d/100);
  }
  ['ornekmesafe','orneksure'].forEach(id=>$(id).addEventListener('input',upd)); upd();
})();
