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

(function(){
  const cv=document.getElementById('sepCanvas'); if(!cv) return;
  const ctx=cv.getContext('2d');
  function col(t){ // mavi -> mor -> kırmızı
    const a=[96,165,250], b=[244,114,182], c=[251,113,133];
    let r,g,bl; if(t<0.5){const u=t/0.5;r=a[0]+(b[0]-a[0])*u;g=a[1]+(b[1]-a[1])*u;bl=a[2]+(b[2]-a[2])*u;}
    else{const u=(t-0.5)/0.5;r=b[0]+(c[0]-b[0])*u;g=b[1]+(c[1]-b[1])*u;bl=b[2]+(c[2]-b[2])*u;}
    const d=0.35+0.65*t; return [r*d,g*d,bl*d];
  }
  function draw(){
    const N=+document.getElementById('sepN').value, WL=+document.getElementById('sepW').value;
    document.getElementById('vsepN').textContent=N; document.getElementById('vsepW').textContent=WL.toFixed(1);
    const pad=30, maxW=cv.width-2*pad, maxH=cv.height-2*pad;
    let pw=maxW, ph=pw*WL; if(ph>maxH){ph=maxH;pw=ph/WL;}
    const ox=(cv.width-pw)/2, oy=(cv.height-ph)/2;
    ctx.fillStyle='#0f172a';ctx.fillRect(0,0,cv.width,cv.height);
    const nx=Math.round(pw/3), ny=Math.round(ph/3), th=[];
    for(let j=0;j<=ny;j++){th.push([]);const yy=WL*(j/ny);
      for(let i=0;i<=nx;i++){const xx=i/nx;let s=0;
        for(let n=1;n<=N;n+=2){ s+= (2/n)*Math.sin(n*Math.PI*xx)*Math.exp(n*Math.PI*(yy-WL))*(1-Math.exp(-2*n*Math.PI*yy))/(1-Math.exp(-2*n*Math.PI*WL)); }
        th[j].push(2/Math.PI*s);}}
    const img=ctx.createImageData(nx+1,ny+1);
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const t=Math.max(0,Math.min(1,th[j][i]));const c=col(t);const k=((ny-j)*(nx+1)+i)*4;img.data[k]=c[0];img.data[k+1]=c[1];img.data[k+2]=c[2];img.data[k+3]=255;}
    const tmp=document.createElement('canvas');tmp.width=nx+1;tmp.height=ny+1;tmp.getContext('2d').putImageData(img,0,0);
    ctx.imageSmoothingEnabled=true;ctx.drawImage(tmp,ox,oy,pw,ph);
    // izotermler (basit marching: işaret değişimi noktaları)
    ctx.fillStyle='rgba(255,255,255,.9)';
    for(let lev=0.1;lev<0.95;lev+=0.1){
      for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=th[j][i]-lev,b=th[j][i+1]-lev,c=th[j+1][i]-lev;
        if(a*b<0||a*c<0){ctx.fillRect(ox+i/nx*pw,oy+ph-j/ny*ph,1.6,1.6);}}
    }
    ctx.strokeStyle='#cbd5e1';ctx.lineWidth=2;ctx.strokeRect(ox,oy,pw,ph);
    ctx.fillStyle='#cbd5e1';ctx.font='15px "Patrick Hand", sans-serif';ctx.textAlign='center';
    ctx.fillText('θ = 1 (T₂)',ox+pw/2,oy-10);ctx.fillText('θ = 0',ox+pw/2,oy+ph+20);
    ctx.save();ctx.translate(ox-12,oy+ph/2);ctx.rotate(-Math.PI/2);ctx.fillText('θ = 0',0,0);ctx.restore();
    ctx.save();ctx.translate(ox+pw+20,oy+ph/2);ctx.rotate(-Math.PI/2);ctx.fillText('θ = 0',0,0);ctx.restore();
  }
  ['sepN','sepW'].forEach(id=>document.getElementById(id).addEventListener('input',draw));
  draw();
})();

(function(){
  const $=id=>document.getElementById(id); if(!$('ez')) return;
  const D=0.046,d=0.005,k=0.35,px=105/23;
  function upd(){
    const zmm=+$('ez').value, z=zmm/1000; $('vez').textContent=zmm.toFixed(1);
    const a=(D*D+d*d-4*z*z)/(2*D*d), R=Math.acosh(a)/(2*Math.PI*k);
    const cy=130+zmm*px; $('eWire').setAttribute('cy',cy); $('eZ').setAttribute('y2',cy);
    $('eZt').setAttribute('y',130+zmm*px/2+4); $('eZt').textContent= zmm>0?'z':'';
    const R0=Math.log(D/d)/(2*Math.PI*k);
    $('eR').textContent='(b) eksantrik: R′ = '+R.toFixed(2)+' m·K/W  (%'+((R0-R)/R0*100).toFixed(0)+' azalma)';
  }
  $('ez').addEventListener('input',upd); upd();
})();

(function(){
  const $=id=>document.getElementById(id); if(!$('gsSvg')) return;
  function col(t){const a=[96,165,250],b=[244,114,182],c=[251,113,133];let r,g,bl;
    if(t<.5){const u=t/.5;r=a[0]+(b[0]-a[0])*u;g=a[1]+(b[1]-a[1])*u;bl=a[2]+(b[2]-a[2])*u;}else{const u=(t-.5)/.5;r=b[0]+(c[0]-b[0])*u;g=b[1]+(c[1]-b[1])*u;bl=b[2]+(c[2]-b[2])*u;}
    const d=.35+.65*t;return `rgb(${(r*d)|0},${(g*d)|0},${(bl*d)|0})`;}
  function exact(x,y,W){let s=0;for(let n=1;n<=199;n+=2){s+=(2/n)*Math.sin(n*Math.PI*x)*Math.exp(n*Math.PI*(y-W))*(1-Math.exp(-2*n*Math.PI*y))/(1-Math.exp(-2*n*Math.PI*W));}return 2/Math.PI*s;}
  function upd(){
    const it=+$('gsIt').value,nx=+$('gsN').value; $('vgsIt').textContent=it; $('vgsN').textContent=nx;
    const NX=nx+2, ny=Math.max(2,Math.round(0.8*(nx+1))-1), NY=ny+2;
    const T=[];for(let j=0;j<NY;j++){T.push(new Array(NX).fill(0));}
    for(let i=1;i<NX-1;i++)T[NY-1][i]=1;
    for(let k=0;k<it;k++)for(let j=1;j<NY-1;j++)for(let i=1;i<NX-1;i++)T[j][i]=(T[j][i-1]+T[j][i+1]+T[j-1][i]+T[j+1][i])/4;
    const W=(ny+1)/(nx+1);
    let err=0;for(let j=1;j<NY-1;j++)for(let i=1;i<NX-1;i++){const e=Math.abs(T[j][i]-exact(i/(nx+1),j/(nx+1),W));if(e>err)err=e;}
    const cs=Math.min(660/NX,300/NY), ox=(720-cs*NX)/2, oy=(320-cs*NY)/2+5;
    let s='';
    for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){
      const bnd=(i==0||j==0||i==NX-1||j==NY-1), v=T[j][i];
      if(bnd&&((i==0||i==NX-1)&&(j==0||j==NY-1)))continue;
      const x=ox+i*cs,y=oy+(NY-1-j)*cs;
      s+=`<rect x="${x+1}" y="${y+1}" width="${cs-2}" height="${cs-2}" rx="4" fill="${col(Math.max(0,Math.min(1,v)))}" ${bnd?'opacity=".45"':''} stroke="${bnd?'#475569':'#cbd5e1'}" stroke-width="1"/>`;
      if(cs>26)s+=`<text x="${x+cs/2}" y="${y+cs/2+4}" fill="#fff" font-size="${Math.min(14,cs/3.2)}" text-anchor="middle" font-family="Patrick Hand, sans-serif">${bnd?v.toFixed(0):v.toFixed(3)}</text>`;
    }
    $('gsSvg').innerHTML=s;
    const ci=(nx+1)/2|0, cj=Math.round((ny+1)/2);
    $('gsNum').textContent=T[cj][ci].toFixed(3); $('gsEx').textContent=exact(ci/(nx+1),cj/(nx+1),W).toFixed(3);
    $('gsErr').textContent=err.toFixed(3);
  }
  ['gsIt','gsN'].forEach(id=>$(id).addEventListener('input',upd)); upd();
})();

function bladeSolve(k,hi,ho,Tio,Tii){
  const dx=0.001, Bo=ho*dx/k, Bi=hi*dx/k, N=21;
  const A=[...Array(N)].map(()=>new Array(N).fill(0)), C=new Array(N).fill(0);
  const s=(r,c,v)=>{A[r-1][c-1]+=v;};
  // node 1
  s(1,2,1);s(1,7,1);s(1,1,-(2+Bo));C[0]=-Bo*Tio;
  for(const n of [2,3,4,5]){s(n,n-1,1);s(n,n+1,1);s(n,n+6,2);s(n,n,-2*(Bo+2));C[n-1]=-2*Bo*Tio;}
  s(6,5,1);s(6,12,1);s(6,6,-(2+Bo));C[5]=-Bo*Tio;
  s(7,1,1);s(7,8,2);s(7,13,1);s(7,7,-4);
  for(const n of [8,9,10,11]){s(n,n-6,1);s(n,n+6,1);s(n,n-1,1);s(n,n+1,1);s(n,n,-4);}
  s(12,6,1);s(12,11,2);s(12,18,1);s(12,12,-4);
  s(13,7,1);s(13,14,2);s(13,19,1);s(13,13,-4);
  s(14,8,1);s(14,13,1);s(14,15,1);s(14,20,1);s(14,14,-4);
  s(15,9,2);s(15,14,2);s(15,16,1);s(15,21,1);s(15,15,-2*(3+Bi));C[14]=-2*Bi*Tii;
  for(const n of [16,17]){s(n,n-6,2);s(n,n-1,1);s(n,n+1,1);s(n,n,-2*(Bi+2));C[n-1]=-2*Bi*Tii;}
  s(18,12,1);s(18,17,1);s(18,18,-(2+Bi));C[17]=-Bi*Tii;
  s(19,13,1);s(19,20,1);s(19,19,-2);
  s(20,14,2);s(20,19,1);s(20,21,1);s(20,20,-4);
  s(21,15,1);s(21,20,1);s(21,21,-(2+Bi));C[20]=-Bi*Tii;
  // gauss elimination
  for(let i=0;i<N;i++){let p=i;for(let r=i+1;r<N;r++)if(Math.abs(A[r][i])>Math.abs(A[p][i]))p=r;
    [A[i],A[p]]=[A[p],A[i]];[C[i],C[p]]=[C[p],C[i]];
    for(let r=i+1;r<N;r++){const f=A[r][i]/A[i][i];if(!f)continue;for(let c=i;c<N;c++)A[r][c]-=f*A[i][c];C[r]-=f*C[i];}}
  const T=new Array(N).fill(0);
  for(let i=N-1;i>=0;i--){let v=C[i];for(let c=i+1;c<N;c++)v-=A[i][c]*T[c];T[i]=v/A[i][i];}
  const t=n=>T[n-1];
  const q=4*hi*((dx/2)*(t(21)-Tii)+(dx)*(t(15)-Tii)+dx*(t(16)-Tii)+dx*(t(17)-Tii)+(dx/2)*(t(18)-Tii));
  return {T,q};
}
(function(){
  const $=id=>document.getElementById(id);
  // Gauss-Seidel tablo
  if($('gsTable')){
    function upd(){
      const K=+$('gs4').value; $('vgs4').textContent=K;
      let x=[0,0,0,0],h='<tr><th>iterasyon</th><th>x₁</th><th>x₂</th><th>x₃</th><th>x₄</th><th>en büyük değişim</th></tr><tr><td>0 (tahmin)</td><td>0</td><td>0</td><td>0</td><td>0</td><td>–</td></tr>';
      for(let k=1;k<=K;k++){const o=x.slice();
        x[0]=x[1]/10-x[2]/5+3/5; x[1]=x[0]/11+x[2]/11-3*x[3]/11+25/11; x[2]=-x[0]/5+x[1]/10+x[3]/10-11/10; x[3]=-3*x[1]/8+x[2]/8+15/8;
        const d=Math.max(...x.map((v,i)=>Math.abs(v-o[i])));
        h+=`<tr><td>${k}</td>${x.map(v=>`<td>${v.toFixed(5)}</td>`).join('')}<td>${d.toExponential(1)}</td></tr>`;}
      h+='<tr><td><b>tam çözüm</b></td><td>1</td><td>2</td><td>−1</td><td>1</td><td></td></tr>';
      $('gsTable').innerHTML=h;
    }
    $('gs4').addEventListener('input',upd); upd();
  }
  // türbin kanadı
  if($('bladeSvg')){
    const pos=[];for(let c=0;c<6;c++)pos.push([c,0]);for(let c=0;c<6;c++)pos.push([c,1]);for(let c=0;c<6;c++)pos.push([c,2]);for(let c=0;c<3;c++)pos.push([c,3]);
    const S=72,ox=160,oy=52;
    function upd(){
      const k=+$('bk').value,hi=+$('bhi').value; $('vbk').textContent=k; $('vbhi').textContent=hi;
      const r=bladeSolve(k,hi,1000,1700,400), T=r.T, mn=Math.min(...T), mx=Math.max(...T);
      const X=c=>ox+c*S, Y=rw=>oy+rw*S;
      let s=`<path d="M${X(0)},${Y(0)} H${X(5)} V${Y(2)} H${X(2)} V${Y(3)} H${X(0)} Z" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5"/>`;
      s+=`<line x1="${X(0)}" y1="${Y(0)}" x2="${X(5)}" y2="${Y(0)}" stroke="#fb7185" stroke-width="4"/>`;
      s+=`<path d="M${X(2)},${Y(3)} V${Y(2)} H${X(5)}" fill="none" stroke="#60a5fa" stroke-width="4"/>`;
      s+=`<g stroke="#fde047" stroke-dasharray="5 4" stroke-width="1.5"><line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(3)}"/><line x1="${X(5)}" y1="${Y(0)}" x2="${X(5)}" y2="${Y(2)}"/><line x1="${X(0)}" y1="${Y(3)}" x2="${X(2)}" y2="${Y(3)}"/></g>`;
      T.forEach((v,i)=>{const [c,rw]=pos[i];const t=mx>mn?(v-mn)/(mx-mn):0.5;
        const col=`rgb(${(96+155*t)|0},${(165-52*t)|0},${(250-117*t)|0})`;
        s+=`<circle cx="${X(c)}" cy="${Y(rw)}" r="23" fill="${col}" stroke="#0f172a" stroke-width="2"/>`;
        s+=`<text x="${X(c)}" y="${Y(rw)+5}" fill="#0f172a" font-size="13" font-weight="700" text-anchor="middle" font-family="Nunito, sans-serif">${v.toFixed(1)}</text>`;
        s+=`<text x="${X(c)-26}" y="${Y(rw)-20}" fill="#cbd5e1" font-size="12" font-family="Patrick Hand, sans-serif">${i+1}</text>`;});
      s+=`<text x="${X(2.5)}" y="${Y(0)-34}" fill="#fb7185" font-size="14" text-anchor="middle" font-family="Patrick Hand, sans-serif">yanma gazları 1700 K, h₀ = 1000</text>`;
      s+=`<text x="${X(3.5)}" y="${Y(2)+34}" fill="#60a5fa" font-size="14" text-anchor="middle" font-family="Patrick Hand, sans-serif">kanal havası 400 K, hᵢ = ${hi}</text>`;
      s+=`<text x="${X(0)-12}" y="${Y(1.5)}" fill="#fde047" font-size="13" text-anchor="end" font-family="Patrick Hand, sans-serif">simetri</text>`;
      $('bladeSvg').innerHTML=s;
      $('bT1').textContent=T[0].toFixed(1); $('bq').textContent=r.q.toFixed(1);
    }
    ['bk','bhi'].forEach(id=>$(id).addEventListener('input',upd)); upd();
  }
})();