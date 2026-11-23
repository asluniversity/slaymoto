/* SLAY MOTO pro: Race mode (start/finish gates, laps) + Live co-pilot (corner warning, lean estimate) */
(()=>{
const q=id=>document.getElementById(id),G=9.81,D=Math.PI/180;
const hav=(a,b)=>{const x=Math.sin((b[0]-a[0])*D/2)**2+Math.cos(a[0]*D)*Math.cos(b[0]*D)*Math.sin((b[1]-a[1])*D/2)**2;return 12742000*Math.asin(Math.sqrt(x));};
const fmt=ms=>{const s=ms/1000,m=Math.floor(s/60);return m+':'+(s%60).toFixed(1).padStart(4,'0');};
/* ---------- RACE ---------- */
const map=L.map('raceMap').setView([30,20],2);
const tl=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'});
new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){tl.addTo(map);map.invalidateSize();o.disconnect();}},{rootMargin:'300px'}).observe(q('raceMap'));
const GATE=30,R={mode:'circuit',A:null,B:null,mk:{},run:false,laps:[],v:0,pts:[]};
function setPt(k,ll){R[k]=ll;if(R.mk[k])map.removeLayer(R.mk[k]);const col=k==='A'?'#4fd18b':'#e5554f';
  R.mk[k]=L.layerGroup([L.circle(ll,{radius:GATE,color:col,fillOpacity:.25}),L.circleMarker(ll,{radius:6,color:col,fillOpacity:1})]).addTo(map);
  map.flyTo(ll,Math.max(map.getZoom(),16));q('pt'+k).textContent=ll[0].toFixed(5)+', '+ll[1].toFixed(5);
  place(ll[0],ll[1]).then(n=>{if(n){q('pt'+k).textContent=n;R['n'+k]=n;}});}
map.on('click',e=>{if(R.run)return;setPt(R.mode==='circuit'||!R.A?'A':'B',[e.latlng.lat,e.latlng.lng]);});
const here=k=>getOrigin().then(o=>o?setPt(k,o):alert('Location unavailable. Allow location access.'));
q('setA').onclick=()=>here('A');q('setB').onclick=()=>here('B');
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{if(R.run)return;R.mode=b.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('on',x===b));q('rowB').hidden=R.mode==='circuit';});
R.sm=localStorage.getItem('slayMotoRaceStart')==='line'?'line':'now';
function setSm(m){R.sm=m;try{localStorage.setItem('slayMotoRaceStart',m);}catch(e){}document.querySelectorAll('[data-rs]').forEach(b=>b.classList.toggle('on',b.dataset.rs===m));
  q('rcHint').textContent=m==='now'?'The clock starts the moment you press START RACE.':'The clock starts when you cross the start line (30 m gate).';}
document.querySelectorAll('[data-rs]').forEach(b=>b.onclick=()=>{if(R.run)return;setSm(b.dataset.rs);});setSm(R.sm);
function rtrace(){const c=q('rcTrack');if(!c||!window.SlayShape)return;const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);SlayShape.draw(g,R.pts.map(x=>[x[0],x[1],x[2]]),18,14,c.width-36,c.height-28,{lw:6});}
function laps(){const best=Math.min(...R.laps);let s=R.s0||0;q('lapList').innerHTML=R.laps.map((t,i)=>{const e=R.lapIdx[i]||R.pts.length,P=R.pts.slice(s,e).map(x=>[x[0],x[1]]);s=e;
  const th=window.SlayShape&&P.length>1?`<img class="lap-th" alt="" src="${SlayShape.thumb(P,72,48)}">`:'';return `<li${t===best?' class="best"':''}>${th}<span>LAP ${i+1}</span><b>${fmt(t)}</b></li>`;}).join('');}
function tick(){const n=Date.now();q('rTime').textContent=R.t0?fmt(n-R.t0):'0:00.0';q('rLap').textContent=R.t0&&R.mode==='circuit'?fmt(n-R.lt0):'—';
  q('rLaps').textContent=R.laps.length;q('rDist').textContent=SlayUnits.dv(R.dist).toFixed(2);q('rSpeed').textContent=Math.round(SlayUnits.spd(R.v));}
function start(){
  if(!R.A||(R.mode==='p2p'&&!R.B)){q('raceMsg').textContent='Set '+(R.A?'a finish':'a start')+' point first.';return;}
  Object.assign(R,{run:true,laps:[],dist:0,prev:null,p:null,away:false,max:0,v:0,t0:0,lt0:0,pts:[],lapIdx:[],skip:undefined,s0:0,bt:'enter'});q('lapList').innerHTML='';if(R.sm==='now')R.t0=R.lt0=Date.now();rtrace();
  if(R.track)map.removeLayer(R.track);R.track=L.polyline([],{color:'#38bdf8',weight:4}).addTo(map);
  R.wid=navigator.geolocation.watchPosition(onR,e=>q('raceMsg').textContent='GPS: '+e.message,{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  R.iv=setInterval(tick,100);lockScreen();q('raceGo').textContent='STOP RACE';q('raceMsg').textContent=R.sm==='now'?'Race running — the clock has started.':'Armed — the clock starts when you cross the start line.';
}
function onR(pos){const c=pos.coords;if(c.accuracy>40){if(!R.t0||R.sm==='line')q('raceMsg').textContent='GPS weak (± '+Math.round(c.accuracy)+' m) — move outdoors.';return;}const ll=[c.latitude,c.longitude],t=pos.timestamp,d=hav(ll,R.A),dB=R.B?hav(ll,R.B):1e9;
  R.v=c.speed!=null&&c.speed>=0?c.speed*3.6:0;let tx=0,enter=0,exit=0,enterB=0,tB=0;
  if(R.p){const f=(dp,dc)=>R.p.t+(GATE-dp)/(dc-dp)*(t-R.p.t);
    enter=R.p.d>GATE&&d<=GATE;exit=R.p.d<=GATE&&d>GATE;if(enter||exit)tx=f(R.p.d,d);
    enterB=R.p.dB>GATE&&dB<=GATE;if(enterB)tB=f(R.p.dB,dB);}
  R.p={d,dB,t};
  if(!R.t0&&(enter||exit)){R.t0=R.lt0=tx;R.away=false;R.prev=null;R.bt=exit?'exit':'enter';q('raceMsg').textContent='Race running.';}
  if(!R.t0)return;
  if(R.prev){const dd=hav(R.prev,ll);if(dd>2){R.dist+=dd;R.prev=ll;}}else R.prev=ll;
  R.max=Math.max(R.max,R.v);R.track.addLatLng(ll);R.pts.push([ll[0],ll[1],R.v,t]);rtrace();
  if(d>GATE*2)R.away=true;
  if(R.sm==='now'&&R.skip===undefined){R.bt=d<=GATE?'exit':'enter';R.skip=true;}
  const ev=R.bt==='exit'?exit:enter;
  if(R.mode==='circuit'&&R.skip&&ev){R.skip=false;R.lt0=tx;R.away=false;R.s0=R.pts.length;q('raceMsg').textContent='Race running — lap timing started at the line.';}
  else if(R.mode==='circuit'&&!R.skip&&ev&&R.away&&tx-R.lt0>15000){R.laps.push(tx-R.lt0);R.lapIdx.push(R.pts.length);R.lt0=tx;R.away=false;laps();}
  if(R.mode==='p2p'&&enterB&&R.away)finish(tB);}
function finish(te){if(!R.run)return;R.run=false;navigator.geolocation.clearWatch(R.wid);clearInterval(R.iv);releaseLock();q('raceGo').textContent='START RACE';
  if(!R.t0){q('raceMsg').textContent='Race never started — you did not cross the start line.';return;}
  const total=(te||Date.now())-R.t0,avg=total>0?R.dist/1000/(total/3600000):0,k=Math.max(1,Math.ceil(R.pts.length/600));
  const pts=R.pts.filter((_,i)=>i%k===0||i===R.pts.length-1).map(x=>[+x[0].toFixed(5),+x[1].toFixed(5),Math.round(x[2]),+((x[3]-R.t0)/1000).toFixed(1)]);
  const rec={mode:R.mode,date:Date.now(),total,dist:R.dist,max:R.max,avg,laps:R.laps,A:R.nA,B:R.nB,li:R.lapIdx.map(i=>Math.round(i/k)),s0:Math.round((R.s0||0)/k),sm:R.sm,pts};
  let l=JSON.parse(localStorage.getItem('slayMotoRaces')||'[]');l.unshift(rec);l=l.slice(0,10);
  for(;;){try{localStorage.setItem('slayMotoRaces',JSON.stringify(l));break;}catch(e){if(l.length<=1)break;l.pop();}}
  q('raceMsg').textContent=`Finished: ${fmt(total)} · ${SlayUnits.dist(R.dist)} · avg ${Math.round(SlayUnits.spd(avg))} ${SlayUnits.sl()} · top ${Math.round(SlayUnits.spd(R.max))} ${SlayUnits.sl()}`+(R.laps.length?` · best lap ${fmt(Math.min(...R.laps))}`:'')+(R.mode==='circuit'&&R.laps.length&&!R.skip&&Date.now()-R.lt0>10000?` · unfinished lap ${fmt(Date.now()-R.lt0)} not counted`:'');
  hist();showRace(rec);}
function hist(){const l=JSON.parse(localStorage.getItem('slayMotoRaces')||'[]');
  q('raceHistory').innerHTML=l.map((r,i)=>`<div class="rh" data-i="${i}" tabindex="0"><img class="rh-th" alt="" src="${window.SlayShape?SlayShape.thumb(r.pts):''}"><div class="rh-m"><b>${r.mode==='circuit'?r.laps.length+' LAPS':'A → B'}</b><span>${fmt(r.total)} · ${SlayUnits.dist(r.dist)} · ${Math.round(SlayUnits.spd(r.avg))} ${SlayUnits.sl()} avg · ${new Date(r.date).toLocaleDateString()}</span></div></div>`).join('');}
q('raceHistory').onclick=e=>{const d=e.target.closest('.rh');if(d)showRace(JSON.parse(localStorage.getItem('slayMotoRaces')||'[]')[d.dataset.i]);};
function raceImage(r){
  const W=1080,H=1720,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),p=r.pts||[];
  g.fillStyle='#05080d';g.fillRect(0,0,W,H);g.fillStyle='#38bdf8';g.font='700 40px sans-serif';g.fillText('SLAY MOTO · RACE RECORD',60,90);if(LOGO.complete&&LOGO.naturalWidth){const lw=72*LOGO.naturalWidth/LOGO.naturalHeight;g.drawImage(LOGO,W-60-lw,40,lw,72);}
  g.fillStyle='#8aa0b4';g.font='24px sans-serif';g.fillText(new Date(r.date).toLocaleString()+'  ·  '+(r.mode==='circuit'?'CIRCUIT':'POINT TO POINT'),60,130);
  const vs=p.map(x=>x[2]),mn=Math.min(...vs),mx=Math.max(...vs)||1,col=v=>`hsl(${200-200*((v-mn)/((mx-mn)||1))},90%,55%)`;
  if(p.length>1){
    const la=p.map(x=>x[0]),ln=p.map(x=>x[1]),a0=Math.min(...la),a1=Math.max(...la),n0=Math.min(...ln),n1=Math.max(...ln),k=Math.cos((a0+a1)/2*D),w=(n1-n0)*k||1e-6,h=(a1-a0)||1e-6,s=Math.min(960/w,620/h),ox=(W-w*s)/2,oy=170+(620-h*s)/2;
    const X=x=>ox+(x[1]-n0)*k*s,Y=x=>oy+(a1-x[0])*s;g.lineCap='round';g.lineWidth=9;
    for(let i=1;i<p.length;i++){g.strokeStyle=col(p[i][2]);g.beginPath();g.moveTo(X(p[i-1]),Y(p[i-1]));g.lineTo(X(p[i]),Y(p[i]));g.stroke();}
    [[p[0],'#4fd18b'],[p[p.length-1],'#e5554f']].forEach(([x,cl])=>{g.beginPath();g.arc(X(x),Y(x),14,0,7);g.fillStyle=cl;g.fill();g.lineWidth=4;g.strokeStyle='#05080d';g.stroke();});
    for(let i=0;i<60;i++){g.fillStyle=col(mn+(mx-mn)*i/59);g.fillRect(60+i*8,830,8,14);}
    g.fillStyle='#8aa0b4';g.font='20px sans-serif';g.fillText(Math.round(SlayUnits.spd(mn))+' '+SlayUnits.sl(),60,870);g.textAlign='right';g.fillText(Math.round(SlayUnits.spd(mx))+' '+SlayUnits.sl(),540,870);g.textAlign='left';}
  [['TOTAL TIME',fmt(r.total)],['DISTANCE',SlayUnits.dist(r.dist)],['LAPS',r.mode==='circuit'?r.laps.length:'—'],['AVG SPEED',Math.round(SlayUnits.spd(r.avg))+' '+SlayUnits.sl()],['TOP SPEED',Math.round(SlayUnits.spd(r.max))+' '+SlayUnits.sl()],['BEST LAP',r.laps.length?fmt(Math.min(...r.laps)):'—']]
    .forEach(([l,v],i)=>{const x=60+(i%3)*330,y=930+Math.floor(i/3)*100;g.fillStyle='#8aa0b4';g.font='20px sans-serif';g.fillText(l,x,y);g.fillStyle='#eef7f6';g.font='700 40px sans-serif';g.fillText(v,x,y+46);});
  g.fillStyle='#8aa0b4';g.font='20px sans-serif';g.fillText('SPEED OVER TIME',60,1160);
  if(p.length>1){const T=p[p.length-1][3]||1,cx=x=>60+x/T*960,cy=v=>1400-v/mx*200;g.strokeStyle='rgba(138,160,180,.3)';g.lineWidth=1;g.strokeRect(60,1200,960,200);
    let cum=0;g.setLineDash([6,6]);r.laps.forEach(l=>{cum+=l/1000;g.beginPath();g.moveTo(cx(cum),1200);g.lineTo(cx(cum),1400);g.stroke();});g.setLineDash([]);
    g.beginPath();p.forEach((x,i)=>i?g.lineTo(cx(x[3]),cy(x[2])):g.moveTo(cx(x[3]),cy(x[2])));g.lineWidth=3;g.strokeStyle='#38bdf8';g.stroke();
    g.fillStyle='#8aa0b4';g.fillText('0:00',60,1430);g.textAlign='right';g.fillText(fmt(T*1000)+'  ·  top '+Math.round(SlayUnits.spd(mx))+' '+SlayUnits.sl(),1020,1430);g.textAlign='left';}
  if(r.li&&r.li.length&&r.laps.length){const L=r.laps,pp=r.pts||[],best=Math.min(...L);let s=r.s0||0;g.fillStyle='#8aa0b4';g.font='20px sans-serif';g.fillText('LAP SHAPES',60,1462);
    L.slice(0,6).forEach((l,i)=>{const e=r.li[i]||pp.length,seg=pp.slice(s,e),x=60+i*165,y=1476;s=e;g.fillStyle=l===best?'rgba(79,209,139,.16)':'rgba(255,255,255,.05)';g.fillRect(x,y,150,100);
      if(window.SlayShape&&seg.length>1)SlayShape.draw(g,seg.map(a=>[a[0],a[1],a[2]]),x+10,y+10,130,80,{lw:4});g.fillStyle=l===best?'#4fd18b':'#eef7f6';g.font='700 22px sans-serif';g.fillText('LAP '+(i+1)+'  '+fmt(l),x,y+130);});}
  else{g.fillStyle='#eef7f6';g.font='22px sans-serif';r.laps.slice(0,6).forEach((l,i)=>g.fillText('LAP '+(i+1)+'   '+fmt(l),60+(i%2)*330,1480+Math.floor(i/2)*34));}
  g.fillStyle='#8aa0b4';g.fillText('FROM  '+(r.A||'start point').slice(0,48),60,1690);if(r.mode==='p2p')g.fillText('TO      '+(r.B||'finish point').slice(0,48),560,1690);
  return c;}
function showRace(r){if(!r)return;window.__rec={type:'race',rec:r};const u=raceImage(r).toDataURL('image/png');q('rideImg').src=u;q('dlImg').href=u;q('dlImg').download='slay-moto-race.png';q('imgModal').hidden=false;}
q('raceGo').onclick=()=>R.run?finish():start();hist();window.__slayRace={R,onR,start,finish,setPt};document.addEventListener('slayunits',hist);
/* ---------- CO-PILOT ---------- */
const C={g:'#7dd3fc',y:'#e7d25b',o:'#e58b52',r:'#e5554f'};
const P={open:false,wid:null,prev:null,hp:null,w:0,lean:0,mL:0,mR:0};
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent),S={up:null,up0:null,ok:false,t:0,yaw:0,vote:0,sg:1,mag:0,last:0};
const nrm=v=>{const m=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/m,v[1]/m,v[2]/m];};
function gauge(p){const cx=150,cy=160,r=118,pt=(a,rr)=>[cx+rr*Math.sin(a*D),cy-rr*Math.cos(a*D)],f=n=>n.toFixed(1);
  const arc=(a,b,col)=>{const A=pt(a,r),B=pt(b,r);return `<path d="M${f(A[0])} ${f(A[1])}A${r} ${r} 0 0 1 ${f(B[0])} ${f(B[1])}" stroke="${col}" stroke-width="12" fill="none"/>`;};
  let s='<svg viewBox="34 22 232 158" role="img" aria-label="Lean angle gauge">'+arc(-60,-45,'#4b555e')+arc(-45,-30,'#a3adb5')+arc(-30,30,'#ffffff')+arc(30,45,'#a3adb5')+arc(45,60,'#4b555e');
  for(let a=-60;a<=60;a+=5){const m=a%10===0,A=pt(a,r-9),B=pt(a,r-9-(m?14:7));s+=`<line x1="${f(A[0])}" y1="${f(A[1])}" x2="${f(B[0])}" y2="${f(B[1])}" stroke="${m?'#ffffff':'#6b7782'}" stroke-width="${m?2:1}"/>`;}
  for(let a=-60;a<=60;a+=20){const T=pt(a,r-40);s+=`<text x="${f(T[0])}" y="${f(T[1]+4)}" fill="#d5dbe0" font-size="14" text-anchor="middle" font-family="sans-serif">${Math.abs(a)}</text>`;}
  const mk=k=>`<g id="${p}${k}" transform="rotate(0 150 160)" style="opacity:0"><path d="M150 38L144 26h12z" fill="#ffffff"/></g>`;
  return s+mk('MaxL')+mk('MaxR')+`<g id="${p}Needle" transform="rotate(0 150 160)" style="filter:drop-shadow(0 0 5px rgba(255,255,255,.75))"><path d="M145 160L150 46l5 114z" fill="#ffffff"/></g><circle cx="150" cy="160" r="12" fill="#000" stroke="#ffffff" stroke-width="4"/></svg>`;}
q('cpGauge').innerHTML=gauge('cp');q('pgGauge').innerHTML=gauge('pg');
q('pgNeedle').setAttribute('transform','rotate(28 150 160)');[['pgMaxR',34],['pgMaxL',-21]].forEach(([k,v])=>{q(k).setAttribute('transform',`rotate(${v} 150 160)`);q(k).style.opacity=1;});
const clp=v=>Math.max(-60,Math.min(60,v));
function show(l,src){const a=Math.round(Math.abs(l));q('cpLean').textContent=a+'°';q('cpSide').textContent=a<3?'UPRIGHT':(l>0?'RIGHT':'LEFT');
  q('cpG').textContent=Math.tan(Math.abs(l)*D).toFixed(2)+' g';{const on=a>=3;q('cpL').className='t'+(on&&l<0?' on':'')+(on&&l<0&&a>=45?' hot':'');q('cpR').className='t'+(on&&l>0?' on':'')+(on&&l>0&&a>=45?' hot':'');}q('cpNeedle').setAttribute('transform',`rotate(${clp(l)} 150 160)`);
  P.mR=Math.max(P.mR,l);P.mL=Math.max(P.mL,-l);
  [['cpMaxR',P.mR],['cpMaxL',-P.mL]].forEach(([k,v])=>{q(k).setAttribute('transform',`rotate(${clp(v)} 150 160)`);q(k).style.opacity=Math.abs(v)>3?1:0;});
  q('cpMax').textContent=`MAX L ${Math.round(P.mL)}° · MAX R ${Math.round(P.mR)}°`;q('cpSrc').textContent=src;}
function onMotion(e){const a=e.accelerationIncludingGravity,r=e.rotationRate;if(!a||a.x==null)return;
  const s=IOS?-1:1,ac=[a.x*s,a.y*s,a.z*s],t=performance.now();
  if(!S.up){S.up=nrm(ac);S.t=t;return;}
  const dt=Math.min(.1,(t-S.t)/1000);S.t=t;
  if(r&&r.alpha!=null){const w=[r.beta*D,r.gamma*D,r.alpha*D],u=S.up;
    const cx=[w[1]*u[2]-w[2]*u[1],w[2]*u[0]-w[0]*u[2],w[0]*u[1]-w[1]*u[0]];S.up=nrm([u[0]-cx[0]*dt,u[1]-cx[1]*dt,u[2]-cx[2]*dt]);
    S.yaw=S.yaw*.9+.1*(w[0]*S.up[0]+w[1]*S.up[1]+w[2]*S.up[2]);}
  const g=Math.hypot(ac[0],ac[1],ac[2])/G;if(g>.93&&g<1.07){const n=nrm(ac);S.up=nrm([S.up[0]*.97+n[0]*.03,S.up[1]*.97+n[1]*.03,S.up[2]*.97+n[2]*.03]);}
  if(S.up0&&t-S.last>80){S.last=t;const d=Math.max(-1,Math.min(1,S.up[0]*S.up0[0]+S.up[1]*S.up0[1]+S.up[2]*S.up0[2]));S.mag=Math.acos(d)/D;
    const ys=S.yaw<0?1:-1;if(Math.abs(P.w)>.06&&Math.abs(S.yaw)>.06)S.vote=Math.max(-20,Math.min(20,S.vote+((P.w>0)===(ys>0)?1:-1)));
    if(Math.abs(S.yaw)>.05)S.sg=ys*(S.vote<0?-1:1);show((S.mag<1.5?0:S.mag)*S.sg,'PHONE SENSOR');}}
async function startSensors(){Object.assign(S,{up:null,up0:null,ok:false,yaw:0,vote:0,sg:1,mag:0});
  try{if(typeof DeviceMotionEvent!=='undefined'&&DeviceMotionEvent.requestPermission){if(await DeviceMotionEvent.requestPermission()!=='granted')return;}
    addEventListener('devicemotion',onMotion);}catch(e){}}
function stopSensors(){removeEventListener('devicemotion',onMotion);S.ok=false;}
q('cpCal').onclick=()=>{if(!S.up){q('cpSrc').textContent='NO MOTION SENSOR — USING GPS ESTIMATE';return;}S.up0=S.up.slice();S.ok=true;S.mag=0;P.mL=P.mR=0;show(0,'PHONE SENSOR · CALIBRATED');};
function lean(c,t,spd){
  if(c.heading==null||isNaN(c.heading)||spd<8){P.lean*=.6;P.hp=null;return;}
  if(P.hp){const dt=(t-P.hp.t)/1000;if(dt>.3&&dt<3){const d=((c.heading-P.hp.h+540)%360)-180;P.w=P.w*.5+.5*(d/dt)*D;}}
  P.hp={h:c.heading,t};const raw=Math.atan((spd/3.6)*P.w/G)/D;P.lean=P.lean*.6+raw*.4;}
function onC(pos){const c=pos.coords;if(c.accuracy>50)return;const t=pos.timestamp;
  let spd=c.speed!=null&&c.speed>=0?c.speed*3.6:null;
  if(spd==null&&P.prev){const dt=(t-P.prev.t)/1000;if(dt>0)spd=hav(P.prev.ll,[c.latitude,c.longitude])/dt*3.6;}
  P.prev={ll:[c.latitude,c.longitude],t};if(spd==null)spd=0;
  lean(c,t,spd);q('cpSpeed').textContent=Math.round(SlayUnits.spd(spd));
  if(!S.ok)show(P.lean,'GPS ESTIMATE');
  if(Guide.hasRoute())Guide.update({lat:c.latitude,lng:c.longitude},spd);else{q('cpMsg').textContent='NO ROUTE · SPEED & LEAN ONLY';q('cpCorner').textContent='Plan a route to get corner warnings.';}}
Guide.onInfo(i=>{if(!P.open)return;q('copilot').style.setProperty('--c',C[i.l]);q('cpMsg').textContent=i.msg;
  if(i.off){q('cpCorner').innerHTML='<span class="cc-h">OFF ROUTE</span><span class="cc-s">Return to the planned route for corner warnings.</span>';return;}
  const tg=Math.round(i.allowed/5)*5,sc=Math.max(tg*1.4,1);q('cpTarget').textContent=Math.round(SlayUnits.spd(tg)/5)*5;q('cpBar').style.width=Math.min(100,i.spd/sc*100)+'%';q('cpTick').style.left=tg/sc*100+'%';
  if(i.cd!=null){const f=v=>Math.round(Math.atan((v/3.6)**2/(i.cr*G))/D),n=f(i.spd),tl=f(i.ct);
    q('cpCorner').innerHTML=`<span class="cc-h">CORNER IN <b>${SlayUnits.sm(i.cd)}</b></span><span class="cc-s">Slow to <b>${Math.round(SlayUnits.spd(i.ct)/5)*5}</b> ${SlayUnits.sl()}</span><span class="cc-r">At your speed <b class="${n>40?'bad':''}">~${n}° lean</b> · at target <b>~${tl}°</b></span>`;q('cpDist').style.width=Math.max(0,100-i.cd/480*100)+'%';}
  else{q('cpCorner').innerHTML='<span class="cc-h">ROAD AHEAD CLEAR</span>';q('cpDist').style.width='0%';}});
q('openCopilot').onclick=()=>{startSensors();P.open=true;P.mL=P.mR=0;P.prev=P.hp=null;Guide.reset();q('copilot').hidden=false;show(0,'CALIBRATE: HOLD BIKE UPRIGHT, THEN TAP CALIBRATE');
  q('cpMsg').textContent='WAITING FOR GPS…';lockScreen();try{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();}catch(e){}
  P.wid=navigator.geolocation.watchPosition(onC,e=>q('cpMsg').textContent='GPS: '+e.message,{enableHighAccuracy:true,maximumAge:0,timeout:20000});};
q('cpClose').onclick=()=>{stopSensors();P.open=false;navigator.geolocation.clearWatch(P.wid);q('copilot').hidden=true;releaseLock();try{document.fullscreenElement&&document.exitFullscreen();}catch(e){}};
})();
