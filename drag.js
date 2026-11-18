/* SLAY MOTO drag: GPS-timed 0-100 km/h, splits, 1/8 and 1/4 mile. Closed courses only. */
(()=>{
const q=id=>document.getElementById(id),D=Math.PI/180;
const hav=(a,b)=>{const x=Math.sin((b[0]-a[0])*D/2)**2+Math.cos(a[0]*D)*Math.cos(b[0]*D)*Math.sin((b[1]-a[1])*D/2)**2;return 12742000*Math.asin(Math.sqrt(x));};
const SPL=[['0–50 km/h','v',50],['0–100 km/h','v',100],['0–150 km/h','v',150],['0–200 km/h','v',200],['100 m','d',100],['1/8 mile','d',201.17],['1/4 mile','d',402.34]];
const S={st:'idle',smp:[],pts:[],sp:[],t0:0,last:null,pl:null,still:0,vmax:0,acc:0,fz:false,tk:[]};
const cx=150,cy=150,r=118,pt=(a,rr)=>[cx+rr*Math.sin(a*D),cy-rr*Math.cos(a*D)],f=n=>n.toFixed(1);
q('dgTable').innerHTML=SPL.map((s,i)=>`<div class="dg-row" id="dgr${i}"><span>${s[0]}</span><b id="dgt${i}">—</b><em id="dgx${i}">—</em></div>`).join('');
function dial(){const A=pt(-120,r),B=pt(120,r);
  let s=`<svg viewBox="22 22 256 212" role="img" aria-label="Speedometer"><path d="M${f(A[0])} ${f(A[1])}A${r} ${r} 0 1 1 ${f(B[0])} ${f(B[1])}" stroke="#222a31" stroke-width="10" fill="none"/><path id="dgArc" d="" stroke="#38bdf8" stroke-width="10" fill="none" style="filter:drop-shadow(0 0 6px #38bdf8)"/>`;
  for(let v=0;v<=240;v+=10){const m=v%20===0,P=pt(v-120,r-10),Q=pt(v-120,r-10-(m?14:7));s+=`<line x1="${f(P[0])}" y1="${f(P[1])}" x2="${f(Q[0])}" y2="${f(Q[1])}" stroke="${m?'#fff':'#6b7782'}" stroke-width="${m?2:1}"/>`;}
  for(let v=0;v<=240;v+=40){const T=pt(v-120,r-38);s+=`<text x="${f(T[0])}" y="${f(T[1]+4)}" fill="#d5dbe0" font-size="13" text-anchor="middle" font-family="sans-serif">${v}</text>`;}
  return s+`<g id="dgNeedle" transform="rotate(-120 150 150)" style="filter:drop-shadow(0 0 5px rgba(255,255,255,.7))"><path d="M146 150L150 46l4 104z" fill="#fff"/></g><circle cx="150" cy="150" r="11" fill="#000" stroke="#fff" stroke-width="4"/><text id="dgNum" x="150" y="206" text-anchor="middle" font-size="46" font-weight="800" font-style="italic" fill="#fff" font-family="sans-serif">0</text><text x="150" y="224" text-anchor="middle" font-size="11" letter-spacing="3" fill="#9aa7b2" font-family="sans-serif">KM/H</text></svg>`;}
q('dgDial').innerHTML=dial();
function setV(v){const a=Math.max(0,Math.min(240,v))-120,A=pt(-120,r),B=pt(a,r);q('dgNeedle').setAttribute('transform',`rotate(${a} 150 150)`);
  q('dgArc').setAttribute('d',a<-119?'':`M${f(A[0])} ${f(A[1])}A${r} ${r} 0 ${a+120>180?1:0} 1 ${f(B[0])} ${f(B[1])}`);q('dgNum').textContent=v>=100?Math.round(v):v.toFixed(1);}
function status(t,go){const e=q('dgStatus');e.textContent=t;e.classList.toggle('go',!!go);}
function clear(){SPL.forEach((_,i)=>{q('dgr'+i).classList.remove('hit');q('dgt'+i).textContent='—';q('dgx'+i).textContent='—';});}
function arm(){if(['arming','ready','run'].includes(S.st))return;
  Object.assign(S,{st:'arming',smp:[],pts:[],sp:[],t0:0,last:null,pl:null,still:0,vmax:0,acc:0,fz:false,tk:[]});clear();
  S.wid=navigator.geolocation.watchPosition(onFix,e=>status('GPS: '+e.message),{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  S.iv=setInterval(tick,50);lockScreen();status('WAITING FOR GPS LOCK…');q('dgArm').disabled=true;q('dgReset').disabled=false;q('dgLbl').textContent='TIME';q('dgTime').textContent='0.00';}
function stop(){navigator.geolocation.clearWatch(S.wid);clearInterval(S.iv);releaseLock();}
function reset(){stop();S.st='idle';clear();status('PRESS ARM, THEN STAND STILL');q('dgArm').disabled=false;q('dgArm').textContent='ARM';q('dgReset').disabled=true;setV(0);q('dgTime').textContent='0.00';q('dgLbl').textContent='TIME';}
function tick(){const n=Date.now();
  if(S.st==='run'&&!S.fz)q('dgTime').textContent=((n-S.t0)/1000).toFixed(2);
  if(S.last&&S.st!=='done')setV(Math.max(0,S.last.v+(S.st==='run'?S.acc:0)*Math.min(1500,n-S.last.t)));}
function onFix(pos){const c=pos.coords,t=pos.timestamp;if(c.accuracy>35)return;const ll=[c.latitude,c.longitude];
  let v=c.speed!=null&&c.speed>=0?c.speed*3.6:null;
  if(v==null&&S.pl&&t>S.pl.t)v=hav(S.pl.ll,ll)/((t-S.pl.t)/1000)*3.6;
  S.pl={ll,t};if(v==null)v=0;if(S.last&&t<=S.last.t)return;
  S.tk.push(t);if(S.tk.length>6)S.tk.shift();
  q('dgAcc').textContent='± '+Math.round(c.accuracy)+' m';q('dgGps').textContent=c.accuracy<=8?'GPS STRONG':c.accuracy<=20?'GPS OK':'GPS WEAK';
  if(S.tk.length>1)q('dgHz').textContent=((S.tk.length-1)*1000/(S.tk[S.tk.length-1]-S.tk[0])).toFixed(1)+' Hz';
  const p={t,v};
  if(S.st==='arming'){if(v<1.5){if(++S.still>=2){S.st='ready';status('READY — GO!',1);}else status('HOLD STILL…');}else{S.still=0;status('STAND STILL TO ARM…');}}
  else if(S.st==='ready'&&v>=1.5){launch(p);S.last=p;return;}
  else if(S.st==='run'){run(p);if(S.st==='run')S.last=p;return;}
  S.last=p;setV(v);}
function launch(p){const L=S.last||{t:p.t-1000,v:0};S.smp=[L,p];S.st='run';S.vmax=p.v;S.acc=0;status('GO!',1);rebuild();show();}
function rebuild(){const m=S.smp,P0=m[0],P1=m[1];let t0=(P0.t+P1.t)/2;
  if(m.length>2){const a=(m[2].v-P1.v)/(m[2].t-P1.t);if(a>0)t0=P1.t-P1.v/a;}
  t0=Math.min(P1.t,Math.max(P0.t,t0));S.t0=t0;const pts=[{t:t0,v:0,d:0}];
  m.slice(1).forEach(p=>{const L=pts[pts.length-1];pts.push({t:p.t,v:p.v,d:L.d+(L.v+p.v)/2/3.6*(p.t-L.t)/1000});});S.pts=pts;}
function splits(){const p=S.pts;return SPL.map(([,k,T])=>{for(let i=1;i<p.length;i++){const A=p[i-1],B=p[i],a=k==='v'?A.v:A.d,b=k==='v'?B.v:B.d;
  if(a<T&&b>=T){const fr=(T-a)/(b-a);return{t:A.t+fr*(B.t-A.t)-S.t0,x:k==='v'?A.d+fr*(B.d-A.d):A.v+fr*(B.v-A.v)};}}return null;});}
function show(){const sp=S.sp=splits();sp.forEach((s,i)=>{if(!s)return;q('dgr'+i).classList.add('hit');q('dgt'+i).textContent=(s.t/1000).toFixed(2)+' s';q('dgx'+i).textContent=Math.round(s.x)+(SPL[i][1]==='v'?' m':' km/h');});
  if(sp[1]&&!S.fz){S.fz=true;q('dgTime').textContent=(sp[1].t/1000).toFixed(2);q('dgLbl').textContent='0–100 KM/H';}}
function run(p){S.smp.push(p);rebuild();const m=S.pts,L=m[m.length-1],B=m[m.length-2];S.vmax=Math.max(S.vmax,p.v);S.acc=(p.v-B.v)/(p.t-B.t);
  if(S.smp.length<=4&&p.v<1.5){S.smp=[];S.st='ready';S.acc=0;status('READY — GO!',1);return;}
  show();if(L.d>=420||p.v>=240||(S.vmax>20&&p.v<S.vmax-8)||L.t-S.t0>60000)finish();}
function finish(){if(S.st!=='run')return;S.st='done';stop();show();const L=S.pts[S.pts.length-1];
  if(!S.fz)q('dgTime').textContent=((L.t-S.t0)/1000).toFixed(2);
  setV(S.vmax);
  const rec={date:Date.now(),veh:q('dgVeh').value,sp:S.sp.map(s=>s&&[+(s.t/1000).toFixed(3),+s.x.toFixed(1)]),vmax:S.vmax,dur:(L.t-S.t0)/1000,pts:S.pts.map(p=>[+((p.t-S.t0)/1000).toFixed(2),+p.v.toFixed(1),Math.round(p.d)])};
  let l=JSON.parse(localStorage.getItem('slayMotoDrag')||'[]');l.unshift(rec);l=l.slice(0,10);
  for(;;){try{localStorage.setItem('slayMotoDrag',JSON.stringify(l));break;}catch(e){if(l.length<=1)break;l.pop();}}
  status('FINISHED — '+(S.sp[1]?'0–100 IN '+(S.sp[1].t/1000).toFixed(2)+' S':'TOP '+Math.round(S.vmax)+' KM/H'));
  q('dgArm').disabled=false;q('dgArm').textContent='ARM AGAIN';hist();showImg(rec);}
function hist(){const l=JSON.parse(localStorage.getItem('slayMotoDrag')||'[]');
  q('dgHist').innerHTML=l.map((r,i)=>`<div class="rh" data-i="${i}" tabindex="0"><b>${r.sp[1]?r.sp[1][0].toFixed(2)+' s · 0–100':'top '+Math.round(r.vmax)+' km/h'}</b><span>${r.sp[6]?'1/4 mi '+r.sp[6][0].toFixed(2)+' s · ':''}${r.veh} · ${new Date(r.date).toLocaleDateString()}</span></div>`).join('');}
function img(r){const W=1080,H=1500,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  g.fillStyle='#05080d';g.fillRect(0,0,W,H);g.fillStyle='#38bdf8';g.font='700 40px sans-serif';g.fillText('SLAY MOTO · DRAG RECORD',60,90);
  if(!window.__noLogo&&typeof LOGO!=='undefined'&&LOGO.complete&&LOGO.naturalWidth){const lw=72*LOGO.naturalWidth/LOGO.naturalHeight;g.drawImage(LOGO,W-60-lw,40,lw,72);}
  g.fillStyle='#8aa0b4';g.font='24px sans-serif';g.fillText(new Date(r.date).toLocaleString()+'  ·  '+r.veh.toUpperCase(),60,130);
  g.font='26px sans-serif';g.fillText('0–100 KM/H',60,230);g.fillStyle='#fff';g.font='italic 800 170px sans-serif';const tx=r.sp[1]?r.sp[1][0].toFixed(2):'—';g.fillText(tx,60,390);
  const w=g.measureText(tx).width;g.fillStyle='#38bdf8';g.font='700 44px sans-serif';g.fillText(r.sp[1]?'s':'not reached',60+w+16,390);
  SPL.forEach((s,i)=>{const x=60+(i%2)*500,y=470+Math.floor(i/2)*92,v=r.sp[i];g.fillStyle='#8aa0b4';g.font='20px sans-serif';g.fillText(s[0],x,y);
    g.fillStyle=v?'#fff':'#4b555e';g.font='700 34px sans-serif';g.fillText(v?v[0].toFixed(2)+' s  ·  '+Math.round(v[1])+(s[1]==='v'?' m':' km/h'):'—',x,y+40);});
  const P=r.pts,T=r.dur||1,Vm=Math.max(100,Math.ceil(r.vmax/50)*50),X=t=>60+t/T*960,Y=v=>1370-v/Vm*420;
  g.fillStyle='#8aa0b4';g.font='20px sans-serif';g.fillText('SPEED OVER TIME',60,880);g.lineWidth=1;g.strokeStyle='rgba(138,160,180,.25)';
  for(let v=0;v<=Vm;v+=50){g.beginPath();g.moveTo(60,Y(v));g.lineTo(1020,Y(v));g.stroke();g.fillText(v,64,Y(v)-6);}
  g.beginPath();P.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.lineWidth=5;g.strokeStyle='#38bdf8';g.stroke();
  if(r.sp[1]){g.setLineDash([8,8]);g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.moveTo(X(r.sp[1][0]),Y(0));g.lineTo(X(r.sp[1][0]),Y(Vm));g.stroke();g.setLineDash([]);}
  g.fillStyle='#8aa0b4';g.fillText('0 s',60,1400);g.textAlign='right';g.fillText(T.toFixed(1)+' s',1020,1400);g.textAlign='left';
  g.fillText('TOP SPEED '+Math.round(r.vmax)+' KM/H  ·  GPS-TIMED, ABOUT ±0.2 S',60,1450);return c;}
function showImg(r){if(!r)return;let u;try{u=img(r).toDataURL('image/png');}catch(e){window.__noLogo=1;u=img(r).toDataURL('image/png');}q('rideImg').src=u;q('dlImg').href=u;q('dlImg').download='slay-moto-drag.png';q('imgModal').hidden=false;}
q('dgHist').onclick=e=>{const d=e.target.closest('.rh');if(d)showImg(JSON.parse(localStorage.getItem('slayMotoDrag')||'[]')[d.dataset.i]);};
q('dgArm').onclick=arm;q('dgReset').onclick=reset;hist();setV(0);
window.__slayDrag={fix:onFix,S};
})();
