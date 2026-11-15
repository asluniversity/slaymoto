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
function laps(){const best=Math.min(...R.laps);q('lapList').innerHTML=R.laps.map((t,i)=>`<li${t===best?' class="best"':''}><span>LAP ${i+1}</span><b>${fmt(t)}</b></li>`).join('');}
function tick(){const n=Date.now();q('rTime').textContent=R.t0?fmt(n-R.t0):'0:00.0';q('rLap').textContent=R.t0&&R.mode==='circuit'?fmt(n-R.lt0):'—';
  q('rLaps').textContent=R.laps.length;q('rDist').textContent=(R.dist/1000).toFixed(2);q('rSpeed').textContent=Math.round(R.v);}
function start(){
  if(!R.A||(R.mode==='p2p'&&!R.B)){q('raceMsg').textContent='Set '+(R.A?'a finish':'a start')+' point first.';return;}
  Object.assign(R,{run:true,laps:[],dist:0,prev:null,p:null,away:false,max:0,v:0,t0:0,lt0:0,pts:[]});q('lapList').innerHTML='';
  R.track=L.polyline([],{color:'#38bdf8',weight:4}).addTo(map);
  R.wid=navigator.geolocation.watchPosition(onR,e=>q('raceMsg').textContent='GPS: '+e.message,{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  R.iv=setInterval(tick,100);lockScreen();q('raceGo').textContent='STOP RACE';q('raceMsg').textContent='Armed — the clock starts when you cross the start line.';
}
function onR(pos){const c=pos.coords;if(c.accuracy>40)return;const ll=[c.latitude,c.longitude],t=pos.timestamp,d=hav(ll,R.A),dB=R.B?hav(ll,R.B):1e9;
  R.v=c.speed!=null&&c.speed>=0?c.speed*3.6:0;let tx=0,enter=0,exit=0,enterB=0,tB=0;
  if(R.p){const f=(dp,dc)=>R.p.t+(GATE-dp)/(dc-dp)*(t-R.p.t);
    enter=R.p.d>GATE&&d<=GATE;exit=R.p.d<=GATE&&d>GATE;if(enter||exit)tx=f(R.p.d,d);
    enterB=R.p.dB>GATE&&dB<=GATE;if(enterB)tB=f(R.p.dB,dB);}
  R.p={d,dB,t};
  if(!R.t0&&(enter||exit)){R.t0=R.lt0=tx;R.away=false;R.prev=null;q('raceMsg').textContent='Race running.';}
  if(!R.t0)return;
  if(R.prev){const dd=hav(R.prev,ll);if(dd>2){R.dist+=dd;R.prev=ll;}}else R.prev=ll;
  R.max=Math.max(R.max,R.v);R.track.addLatLng(ll);R.pts.push([ll[0],ll[1],R.v,t]);
  if(d>100)R.away=true;
  if(R.mode==='circuit'&&enter&&R.away&&tx-R.lt0>15000){R.laps.push(tx-R.lt0);R.lt0=tx;R.away=false;laps();}
  if(R.mode==='p2p'&&enterB&&R.away)finish(tB);}
function finish(te){if(!R.run)return;R.run=false;navigator.geolocation.clearWatch(R.wid);clearInterval(R.iv);releaseLock();q('raceGo').textContent='START RACE';
  if(!R.t0){q('raceMsg').textContent='Race never started — you did not cross the start line.';return;}
  const total=(te||Date.now())-R.t0,avg=total>0?R.dist/1000/(total/3600000):0,k=Math.max(1,Math.ceil(R.pts.length/600));
  const pts=R.pts.filter((_,i)=>i%k===0||i===R.pts.length-1).map(x=>[+x[0].toFixed(5),+x[1].toFixed(5),Math.round(x[2]),+((x[3]-R.t0)/1000).toFixed(1)]);
  const rec={mode:R.mode,date:Date.now(),total,dist:R.dist,max:R.max,avg,laps:R.laps,A:R.nA,B:R.nB,pts};
  let l=JSON.parse(localStorage.getItem('slayMotoRaces')||'[]');l.unshift(rec);l=l.slice(0,10);
  for(;;){try{localStorage.setItem('slayMotoRaces',JSON.stringify(l));break;}catch(e){if(l.length<=1)break;l.pop();}}
  q('raceMsg').textContent=`Finished: ${fmt(total)} · ${(R.dist/1000).toFixed(2)} km · avg ${Math.round(avg)} km/h · top ${Math.round(R.max)} km/h`+(R.laps.length?` · best lap ${fmt(Math.min(...R.laps))}`:'');
  hist();showRace(rec);}
function hist(){const l=JSON.parse(localStorage.getItem('slayMotoRaces')||'[]');
  q('raceHistory').innerHTML=l.map((r,i)=>`<div class="rh" data-i="${i}" tabindex="0"><b>${r.mode==='circuit'?r.laps.length+' LAPS':'A → B'}</b><span>${fmt(r.total)} · ${(r.dist/1000).toFixed(2)} km · ${Math.round(r.avg)} km/h avg · ${new Date(r.date).toLocaleDateString()}</span></div>`).join('');}
q('raceHistory').onclick=e=>{const d=e.target.closest('.rh');if(d)showRace(JSON.parse(localStorage.getItem('slayMotoRaces')||'[]')[d.dataset.i]);};
function raceImage(r){
  const W=1080,H=1640,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),p=r.pts||[];
  g.fillStyle='#05080d';g.fillRect(0,0,W,H);g.fillStyle='#38bdf8';g.font='700 40px sans-serif';g.fillText('SLAY MOTO · RACE RECORD',60,90);
  g.fillStyle='#8aa0b4';g.font='24px sans-serif';g.fillText(new Date(r.date).toLocaleString()+'  ·  '+(r.mode==='circuit'?'CIRCUIT':'POINT TO POINT'),60,130);
  const vs=p.map(x=>x[2]),mn=Math.min(...vs),mx=Math.max(...vs)||1,col=v=>`hsl(${200-200*((v-mn)/((mx-mn)||1))},90%,55%)`;
  if(p.length>1){
    const la=p.map(x=>x[0]),ln=p.map(x=>x[1]),a0=Math.min(...la),a1=Math.max(...la),n0=Math.min(...ln),n1=Math.max(...ln),k=Math.cos((a0+a1)/2*D),w=(n1-n0)*k||1e-6,h=(a1-a0)||1e-6,s=Math.min(960/w,620/h),ox=(W-w*s)/2,oy=170+(620-h*s)/2;
    const X=x=>ox+(x[1]-n0)*k*s,Y=x=>oy+(a1-x[0])*s;g.lineCap='round';g.lineWidth=9;
    for(let i=1;i<p.length;i++){g.strokeStyle=col(p[i][2]);g.beginPath();g.moveTo(X(p[i-1]),Y(p[i-1]));g.lineTo(X(p[i]),Y(p[i]));g.stroke();}
    [[p[0],'#4fd18b'],[p[p.length-1],'#e5554f']].forEach(([x,cl])=>{g.beginPath();g.arc(X(x),Y(x),14,0,7);g.fillStyle=cl;g.fill();g.lineWidth=4;g.strokeStyle='#05080d';g.stroke();});
    for(let i=0;i<60;i++){g.fillStyle=col(mn+(mx-mn)*i/59);g.fillRect(60+i*8,830,8,14);}
    g.fillStyle='#8aa0b4';g.font='20px sans-serif';g.fillText(mn+' km/h',60,870);g.textAlign='right';g.fillText(mx+' km/h',540,870);g.textAlign='left';}
  [['TOTAL TIME',fmt(r.total)],['DISTANCE',(r.dist/1000).toFixed(2)+' km'],['LAPS',r.mode==='circuit'?r.laps.length:'—'],['AVG SPEED',Math.round(r.avg)+' km/h'],['TOP SPEED',Math.round(r.max)+' km/h'],['BEST LAP',r.laps.length?fmt(Math.min(...r.laps)):'—']]
    .forEach(([l,v],i)=>{const x=60+(i%3)*330,y=930+Math.floor(i/3)*100;g.fillStyle='#8aa0b4';g.font='20px sans-serif';g.fillText(l,x,y);g.fillStyle='#eef7f6';g.font='700 40px sans-serif';g.fillText(v,x,y+46);});
  g.fillStyle='#8aa0b4';g.font='20px sans-serif';g.fillText('SPEED OVER TIME',60,1160);
  if(p.length>1){const T=p[p.length-1][3]||1,cx=x=>60+x/T*960,cy=v=>1400-v/mx*200;g.strokeStyle='rgba(138,160,180,.3)';g.lineWidth=1;g.strokeRect(60,1200,960,200);
    let cum=0;g.setLineDash([6,6]);r.laps.forEach(l=>{cum+=l/1000;g.beginPath();g.moveTo(cx(cum),1200);g.lineTo(cx(cum),1400);g.stroke();});g.setLineDash([]);
    g.beginPath();p.forEach((x,i)=>i?g.lineTo(cx(x[3]),cy(x[2])):g.moveTo(cx(x[3]),cy(x[2])));g.lineWidth=3;g.strokeStyle='#38bdf8';g.stroke();
    g.fillStyle='#8aa0b4';g.fillText('0:00',60,1430);g.textAlign='right';g.fillText(fmt(T*1000)+'  ·  top '+mx+' km/h',1020,1430);g.textAlign='left';}
  g.fillStyle='#eef7f6';g.font='22px sans-serif';r.laps.slice(0,6).forEach((l,i)=>g.fillText('LAP '+(i+1)+'   '+fmt(l),60+(i%2)*330,1480+Math.floor(i/2)*34));
  g.fillStyle='#8aa0b4';g.fillText('FROM  '+(r.A||'start point').slice(0,48),60,1600);if(r.mode==='p2p')g.fillText('TO      '+(r.B||'finish point').slice(0,48),560,1600);
  return c;}
function showRace(r){if(!r)return;const u=raceImage(r).toDataURL('image/png');q('rideImg').src=u;q('dlImg').href=u;q('dlImg').download='slay-moto-race.png';q('imgModal').hidden=false;}
q('raceGo').onclick=()=>R.run?finish():start();hist();
/* ---------- CO-PILOT ---------- */
const C={g:'#4fd18b',y:'#e7d25b',o:'#e58b52',r:'#e5554f'};
const P={open:false,wid:null,prev:null,hp:null,w:0,lean:0,mL:0,mR:0};
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent),S={up:null,up0:null,ok:false,t:0,yaw:0,vote:0,sg:1,mag:0,last:0};
const nrm=v=>{const m=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/m,v[1]/m,v[2]/m];};
function show(l,src){const a=Math.round(Math.abs(l));q('cpLean').textContent=a+'°';q('cpSide').textContent=a<3?'UPRIGHT':(l>0?'RIGHT':'LEFT');
  q('cpBike').style.transform=`rotate(${Math.max(-60,Math.min(60,l))}deg)`;P.mR=Math.max(P.mR,l);P.mL=Math.max(P.mL,-l);
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
  lean(c,t,spd);q('cpSpeed').textContent=Math.round(spd);
  if(!S.ok)show(P.lean,'GPS ESTIMATE');
  if(Guide.hasRoute())Guide.update({lat:c.latitude,lng:c.longitude},spd);else{q('cpMsg').textContent='NO ROUTE · SPEED & LEAN ONLY';q('cpCorner').textContent='Plan a route to get corner warnings.';}}
Guide.onInfo(i=>{if(!P.open)return;q('copilot').style.setProperty('--c',C[i.l]);q('cpMsg').textContent=i.msg;
  if(i.off){q('cpCorner').textContent='Return to the planned route for corner warnings.';return;}
  q('cpTarget').textContent=Math.round(i.allowed/5)*5;
  if(i.cd!=null){const f=v=>Math.round(Math.atan((v/3.6)**2/(i.cr*G))/D),n=f(i.spd),tl=f(i.ct);
    q('cpCorner').innerHTML=`CORNER IN <b>${i.cd} m</b> — slow to <b>${Math.round(i.ct/5)*5}</b> km/h<br>At your speed: <b class="${n>40?'bad':''}">~${n}° lean</b> · at target: <b>~${tl}°</b>`;}
  else q('cpCorner').textContent='ROAD AHEAD CLEAR';});
q('openCopilot').onclick=()=>{startSensors();P.open=true;P.mL=P.mR=0;P.prev=P.hp=null;Guide.reset();q('copilot').hidden=false;
  q('cpMsg').textContent='WAITING FOR GPS…';lockScreen();try{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();}catch(e){}
  P.wid=navigator.geolocation.watchPosition(onC,e=>q('cpMsg').textContent='GPS: '+e.message,{enableHighAccuracy:true,maximumAge:0,timeout:20000});};
q('cpClose').onclick=()=>{stopSensors();P.open=false;navigator.geolocation.clearWatch(P.wid);q('copilot').hidden=true;releaseLock();try{document.fullscreenElement&&document.exitFullscreen();}catch(e){}};
})();
