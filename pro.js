/* SLAY MOTO pro: Race mode (start/finish gates, laps) + Live co-pilot (corner warning, lean estimate) */
(()=>{
const q=id=>document.getElementById(id),G=9.81,D=Math.PI/180;
const hav=(a,b)=>{const x=Math.sin((b[0]-a[0])*D/2)**2+Math.cos(a[0]*D)*Math.cos(b[0]*D)*Math.sin((b[1]-a[1])*D/2)**2;return 12742000*Math.asin(Math.sqrt(x));};
const fmt=ms=>{const s=ms/1000,m=Math.floor(s/60);return m+':'+(s%60).toFixed(1).padStart(4,'0');};
/* ---------- RACE ---------- */
const map=L.map('raceMap').setView([30,20],2);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
const R={mode:'circuit',A:null,B:null,mk:{},run:false,laps:[],v:0};
function setPt(k,ll){R[k]=ll;if(R.mk[k])map.removeLayer(R.mk[k]);const col=k==='A'?'#4fd18b':'#e5554f';
  R.mk[k]=L.layerGroup([L.circle(ll,{radius:30,color:col,fillOpacity:.25}),L.circleMarker(ll,{radius:6,color:col,fillOpacity:1})]).addTo(map);
  map.flyTo(ll,Math.max(map.getZoom(),16));q('pt'+k).textContent=ll[0].toFixed(5)+', '+ll[1].toFixed(5);
  place(ll[0],ll[1]).then(n=>{if(n)q('pt'+k).textContent=n;});}
map.on('click',e=>{if(R.run)return;setPt(R.mode==='circuit'||!R.A?'A':'B',[e.latlng.lat,e.latlng.lng]);});
const here=k=>getOrigin().then(o=>o?setPt(k,o):alert('Location unavailable. Allow location access.'));
q('setA').onclick=()=>here('A');q('setB').onclick=()=>here('B');
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{if(R.run)return;R.mode=b.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('on',x===b));q('rowB').hidden=R.mode==='circuit';});
function laps(){const best=Math.min(...R.laps);q('lapList').innerHTML=R.laps.map((t,i)=>`<li${t===best?' class="best"':''}><span>LAP ${i+1}</span><b>${fmt(t)}</b></li>`).join('');}
function tick(){const n=Date.now();q('rTime').textContent=fmt(n-R.t0);q('rLap').textContent=R.mode==='circuit'?fmt(n-R.lt0):'—';
  q('rLaps').textContent=R.laps.length;q('rDist').textContent=(R.dist/1000).toFixed(2);q('rSpeed').textContent=Math.round(R.v);}
function start(){
  if(!R.A||(R.mode==='p2p'&&!R.B)){q('raceMsg').textContent='Set '+(R.A?'a finish':'a start')+' point first.';return;}
  Object.assign(R,{run:true,laps:[],dist:0,prev:null,away:false,max:0,v:0,t0:Date.now(),lt0:Date.now()});
  R.track=L.polyline([],{color:'#38bdf8',weight:4}).addTo(map);laps();
  R.wid=navigator.geolocation.watchPosition(onR,e=>q('raceMsg').textContent='GPS: '+e.message,{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  R.iv=setInterval(tick,100);lockScreen();q('raceGo').textContent='STOP RACE';q('raceMsg').textContent='Race running — cross the line to count.';
}
function onR(pos){const c=pos.coords;if(c.accuracy>40)return;const ll=[c.latitude,c.longitude];
  if(R.prev){const d=hav(R.prev,ll);if(d<=2)return;R.dist+=d;}R.prev=ll;
  R.v=c.speed!=null&&c.speed>=0?c.speed*3.6:0;R.max=Math.max(R.max,R.v);R.track.addLatLng(ll);
  if(hav(ll,R.A)>100)R.away=true;const n=Date.now();
  if(R.mode==='circuit'){if(R.away&&hav(ll,R.A)<30&&n-R.lt0>15000){R.laps.push(n-R.lt0);R.lt0=n;R.away=false;laps();}}
  else if(R.away&&hav(ll,R.B)<30)finish();}
function finish(){if(!R.run)return;R.run=false;navigator.geolocation.clearWatch(R.wid);clearInterval(R.iv);tick();releaseLock();
  const total=Date.now()-R.t0,avg=total>0?R.dist/1000/(total/3600000):0;
  const rec={mode:R.mode,date:Date.now(),total,dist:R.dist,max:R.max,avg,laps:R.laps};
  let l=JSON.parse(localStorage.getItem('slayMotoRaces')||'[]');l.unshift(rec);try{localStorage.setItem('slayMotoRaces',JSON.stringify(l.slice(0,10)));}catch(e){}
  q('raceGo').textContent='START RACE';q('raceMsg').textContent=`Finished: ${fmt(total)} · ${(R.dist/1000).toFixed(2)} km · avg ${Math.round(avg)} km/h · top ${Math.round(R.max)} km/h`+(R.laps.length?` · best lap ${fmt(Math.min(...R.laps))}`:'');hist();}
function hist(){const l=JSON.parse(localStorage.getItem('slayMotoRaces')||'[]');
  q('raceHistory').innerHTML=l.map(r=>`<div class="rh"><b>${r.mode==='circuit'?r.laps.length+' LAPS':'A → B'}</b><span>${fmt(r.total)} · ${(r.dist/1000).toFixed(2)} km · ${Math.round(r.avg)} km/h avg · ${new Date(r.date).toLocaleDateString()}</span></div>`).join('');}
q('raceGo').onclick=()=>R.run?finish():start();hist();
/* ---------- CO-PILOT ---------- */
const C={g:'#4fd18b',y:'#e7d25b',o:'#e58b52',r:'#e5554f'};
const P={open:false,wid:null,prev:null,hp:null,w:0,lean:0,mL:0,mR:0};
function lean(c,t,spd){
  if(c.heading==null||isNaN(c.heading)||spd<8){P.lean*=.6;P.hp=null;return;}
  if(P.hp){const dt=(t-P.hp.t)/1000;if(dt>.3&&dt<3){const d=((c.heading-P.hp.h+540)%360)-180;P.w=P.w*.5+.5*(d/dt)*D;}}
  P.hp={h:c.heading,t};const raw=Math.atan((spd/3.6)*P.w/G)/D;P.lean=P.lean*.6+raw*.4;
  P.mR=Math.max(P.mR,P.lean);P.mL=Math.max(P.mL,-P.lean);}
function onC(pos){const c=pos.coords;if(c.accuracy>50)return;const t=pos.timestamp;
  let spd=c.speed!=null&&c.speed>=0?c.speed*3.6:null;
  if(spd==null&&P.prev){const dt=(t-P.prev.t)/1000;if(dt>0)spd=hav(P.prev.ll,[c.latitude,c.longitude])/dt*3.6;}
  P.prev={ll:[c.latitude,c.longitude],t};if(spd==null)spd=0;
  lean(c,t,spd);q('cpSpeed').textContent=Math.round(spd);
  const a=Math.round(Math.abs(P.lean));q('cpLean').textContent=a+'°';q('cpSide').textContent=a<3?'UPRIGHT':(P.lean>0?'RIGHT':'LEFT');
  q('cpBike').style.transform=`rotate(${Math.max(-60,Math.min(60,P.lean))}deg)`;q('cpMax').textContent=`MAX L ${Math.round(P.mL)}° · MAX R ${Math.round(P.mR)}°`;
  if(Guide.hasRoute())Guide.update({lat:c.latitude,lng:c.longitude},spd);else{q('cpMsg').textContent='NO ROUTE · SPEED & LEAN ONLY';q('cpCorner').textContent='Plan a route to get corner warnings.';}}
Guide.onInfo(i=>{if(!P.open)return;q('copilot').style.setProperty('--c',C[i.l]);q('cpMsg').textContent=i.msg;
  if(i.off){q('cpCorner').textContent='Return to the planned route for corner warnings.';return;}
  q('cpTarget').textContent=Math.round(i.allowed/5)*5;
  if(i.cd!=null){const f=v=>Math.round(Math.atan((v/3.6)**2/(i.cr*G))/D),n=f(i.spd),tl=f(i.ct);
    q('cpCorner').innerHTML=`CORNER IN <b>${i.cd} m</b> — slow to <b>${Math.round(i.ct/5)*5}</b> km/h<br>At your speed: <b class="${n>40?'bad':''}">~${n}° lean</b> · at target: <b>~${tl}°</b>`;}
  else q('cpCorner').textContent='ROAD AHEAD CLEAR';});
q('openCopilot').onclick=()=>{P.open=true;P.mL=P.mR=0;P.prev=P.hp=null;Guide.reset();q('copilot').hidden=false;
  q('cpMsg').textContent='WAITING FOR GPS…';lockScreen();try{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();}catch(e){}
  P.wid=navigator.geolocation.watchPosition(onC,e=>q('cpMsg').textContent='GPS: '+e.message,{enableHighAccuracy:true,maximumAge:0,timeout:20000});};
q('cpClose').onclick=()=>{P.open=false;navigator.geolocation.clearWatch(P.wid);q('copilot').hidden=true;releaseLock();try{document.fullscreenElement&&document.exitFullscreen();}catch(e){}};
})();
