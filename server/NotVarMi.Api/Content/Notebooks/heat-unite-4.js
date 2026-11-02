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