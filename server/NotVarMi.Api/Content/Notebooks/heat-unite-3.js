(function(){
  const $=id=>document.getElementById(id);
  const X0=250,X1=470,YT=40,YB=225;
  const yOf=T=>YB-(T/150)*(YB-YT);
  function upd(){
    const T1=+$('sT1').value,T2=+$('sT2').value,k=+$('sK').value,L=+$('sL').value;
    $('vT1').textContent=T1;$('vT2').textContent=T2;$('vK').textContent=k.toFixed(1);$('vL').textContent=L.toFixed(2);
    const y1=yOf(T1),y2=yOf(T2);
    const l=$('profWall');l.setAttribute('x1',X0);l.setAttribute('y1',y1);l.setAttribute('x2',X1);l.setAttribute('y2',y2);
    $('pt1').setAttribute('cx',X0);$('pt1').setAttribute('cy',y1);$('pt2').setAttribute('cx',X1);$('pt2').setAttribute('cy',y2);
    const dir=Math.sign(T1-T2);
    const yf1=yOf(Math.min(150,Math.max(0,T1+(T1-T2)*0.35))), yf2=yOf(Math.max(0,Math.min(150,T2-(T1-T2)*0.35)));
    $('profFluid1').setAttribute('points',`40,${yf1} 200,${yf1} ${X0},${y1}`);
    $('profFluid2').setAttribute('points',`${X1},${y2} 520,${yf2} 690,${yf2}`);
    const lb1=$('lb1');lb1.setAttribute('x',X0-10);lb1.setAttribute('y',y1-8);lb1.textContent='Ts,1';
    const lb2=$('lb2');lb2.setAttribute('x',X1+10);lb2.setAttribute('y',y2-8);lb2.textContent='Ts,2';
    const slope=(T2-T1)/L, flux=k/L*(T1-T2);
    $('oSlope').textContent=slope.toFixed(0);$('oFlux').textContent=flux.toFixed(0);
    const q=$('qline'),mag=Math.abs(flux);
    q.style.setProperty('--spd', Math.max(0.15,Math.min(3,300/Math.max(mag,1)))+'s');
    q.style.animationDirection=dir<0?'reverse':'normal';
    q.style.opacity=mag<1?0.25:1;
    $('qhead').setAttribute('transform', dir<0?'translate(720,0) scale(-1,1)':'');
    $('qhead').style.opacity=mag<1?0:1;
  }
  ['sT1','sT2','sK','sL'].forEach(id=>$(id).addEventListener('input',upd));
  upd();
})();

(function(){
  // direnç sembolü (zigzag) çizici: data-res="x1,y,x2"
  document.querySelectorAll('path[data-res]').forEach(p=>{
    const [x1,y,x2]=p.dataset.res.split(',').map(Number);
    const w=x2-x1, a=x1+w*0.3, b=x1+w*0.7, n=6, st=(b-a)/n, h=9;
    let d=`M${x1},${y} H${a}`;
    for(let i=0;i<n;i++){ d+=` L${a+st*(i+0.5)},${y+(i%2?h:-h)}`; }
    d+=` L${b},${y} H${x2}`;
    p.setAttribute('d',d);
  });
  // etkileşimli ısıl devre
  const $=id=>document.getElementById(id);
  if(!$('ch1')) return;
  const yT=T=>220-T*1.8;
  function upd(){
    const h1=+$('ch1').value,k=+$('ck').value,L=+$('cL').value,h2=+$('ch2').value;
    $('vh1').textContent=h1;$('vck').textContent=k.toFixed(2);$('vcL').textContent=L.toFixed(2);$('vh2').textContent=h2;
    const R1=1/h1,R2=L/k,R3=1/h2,R=R1+R2+R3,q=100/R;
    const Ts1=100-q*R1,Ts2=Ts1-q*R2;
    $('cProf').setAttribute('d',`M30,${yT(100)} L140,${yT(100)} Q244,${yT(100)} 250,${yT(Ts1)} L450,${yT(Ts2)} Q456,${yT(0)} 560,${yT(0)} L690,${yT(0)}`);
    const a=$('cTs1');a.setAttribute('x',244);a.setAttribute('y',yT(Ts1)-8);a.textContent='Ts,1 = '+Ts1.toFixed(1)+' °C';
    const b=$('cTs2');b.setAttribute('x',456);b.setAttribute('y',yT(Ts2)-8);b.textContent='Ts,2 = '+Ts2.toFixed(1)+' °C';
    $('cD1').textContent='ΔT = '+(q*R1).toFixed(1)+' °C';$('cD2').textContent='ΔT = '+(q*R2).toFixed(1)+' °C';$('cD3').textContent='ΔT = '+(q*R3).toFixed(1)+' °C';
    $('cR').textContent=R.toFixed(3);$('cq').textContent=q.toFixed(1);$('cU').textContent=(1/R).toFixed(2);
    document.querySelector('#isil-direnc .flow').style.setProperty('--spd',Math.max(0.2,Math.min(3,60/q))+'s');
  }
  ['ch1','ck','cL','ch2'].forEach(id=>$(id).addEventListener('input',upd));
  upd();
})();

(function(){
  const $=id=>document.getElementById(id);
  // kritik yalıtım yarıçapı
  if($('rk')){
    const ri=0.005, rmax=0.08, X0=70, X1=690, Y0=230, Y1=30;
    const xr=r=>X0+(r-ri)/(rmax-ri)*(X1-X0);
    const tk=$('rcTicks'); let t='';
    [5,20,40,60,80].forEach(mm=>{const x=xr(mm/1000);t+=`<text x="${x}" y="247" text-anchor="middle">${mm}</text>`;});
    tk.innerHTML=t;
    function upd(){
      const k=+$('rk').value,h=+$('rh').value;
      $('vrk').textContent=k.toFixed(2);$('vrh').textContent=h;
      const N=160, pts=[];
      for(let i=0;i<=N;i++){const r=ri+(rmax-ri)*i/N;const c=Math.log(r/ri)/(2*Math.PI*k),v=1/(2*Math.PI*r*h);pts.push([r,c,v,c+v]);}
      const mx=Math.max(...pts.map(p=>p[3]))*1.05;
      const y=v=>Y0-v/mx*(Y0-Y1);
      const path=j=>'M'+pts.map(p=>xr(p[0]).toFixed(1)+','+y(p[j]).toFixed(1)).join(' L');
      $('rcC').setAttribute('d',path(3));$('rcCond').setAttribute('d',path(1));$('rcConv').setAttribute('d',path(2));
      const rcr=k/h;
      if(rcr>ri && rcr<rmax){
        const R=Math.log(rcr/ri)/(2*Math.PI*k)+1/(2*Math.PI*rcr*h);
        $('rcLine').setAttribute('x1',xr(rcr));$('rcLine').setAttribute('x2',xr(rcr));$('rcLine').style.opacity=1;
        $('rcDot').setAttribute('cx',xr(rcr));$('rcDot').setAttribute('cy',y(R));$('rcDot').style.opacity=1;
        const tx=$('rcTxt');tx.setAttribute('x',Math.min(xr(rcr)+8,560));tx.setAttribute('y',y(R)+22);tx.textContent='r_cr = k/h = '+(rcr*1000).toFixed(1)+' mm';
      } else {
        $('rcLine').style.opacity=0;$('rcDot').style.opacity=0;
        const tx=$('rcTxt');tx.setAttribute('x',90);tx.setAttribute('y',210);
        tx.textContent= rcr<=ri ? 'r_cr = '+(rcr*1000).toFixed(1)+' mm < rᵢ → her yalıtım kaybı azaltır' : 'r_cr grafiğin dışında';
      }
    }
    ['rk','rh'].forEach(id=>$(id).addEventListener('input',upd));upd();
  }
  // ısı üretimli duvar
  if($('gG')){
    const XL=200,XR=520,yT=T=>235-T*1.0;
    function upd(){
      const G=+$('gG').value,T1=+$('gT1s').value,T2=+$('gT2s').value;
      $('vgG').textContent=G;$('vgT1').textContent=T1;$('vgT2').textContent=T2;
      const f=s=>G*(1-s*s)+(T2-T1)/2*s+(T1+T2)/2;
      let d='';for(let i=0;i<=80;i++){const s=-1+2*i/80;d+=(i?' L':'M')+(XL+(s+1)/2*(XR-XL)).toFixed(1)+','+yT(f(s)).toFixed(1);}
      $('gProf').setAttribute('d',d);
      const a=$('gT1');a.setAttribute('x',XL-8);a.setAttribute('y',yT(T1)+5);a.textContent='Ts,1 = '+T1;
      const b=$('gT2');b.setAttribute('x',XR+8);b.setAttribute('y',yT(T2)+5);b.textContent='Ts,2 = '+T2;
      const sm=G>0?(T2-T1)/(4*G):(T2>T1?9:-9);
      const inside=Math.abs(sm)<1;
      if(inside){const x=XL+(sm+1)/2*(XR-XL),Tm=f(sm);$('gMax').setAttribute('cx',x);$('gMax').setAttribute('cy',yT(Tm));$('gMax').style.opacity=1;
        const t=$('gMaxT');t.setAttribute('x',x);t.setAttribute('y',yT(Tm)-12);t.textContent='Tmax = '+Tm.toFixed(1)+' °C';}
      else{$('gMax').style.opacity=0;$('gMaxT').textContent='';}
      // yüzey akıları (q″ ∝ -dT/dx): dT/ds = -2G s + (T2-T1)/2
      const dl=2*G+(T2-T1)/2, dr=-2*G+(T2-T1)/2; // s=-1 ve s=+1'de eğim
      $('gArrL').style.opacity= dl>0.01?1:0.12; $('gArrR').style.opacity= dr<-0.01?1:0.12;
      $('gqL').textContent= dl>0.01?'sola ısı':''; $('gqR').textContent= dr<-0.01?'sağa ısı':'';
    }
    ['gG','gT1s','gT2s'].forEach(id=>$(id).addEventListener('input',upd));upd();
  }
})();