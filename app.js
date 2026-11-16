/* SLAY MOTO — PWA ride tracker. GPS works on HTTPS or localhost. */
const $ = (id) => document.getElementById(id);
const state = {
  map:null, marker:null, track:null, route:null, watchId:null, timerId:null,
  startedAt:null, elapsedBeforePause:0, paused:false, points:[], distance:0,
  maxSpeed:0, currentSpeed:null, lastFix:null, deferredInstall:null
};

function initMap(){
  state.map = L.map('map',{zoomControl:false,scrollWheelZoom:true}).setView([52.52,13.405],12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19, attribution:'&copy; OpenStreetMap contributors'
  }).addTo(state.map);
  L.control.zoom({position:'bottomleft'}).addTo(state.map);
  state.track = L.polyline([],{color:'#38bdf8',weight:5,opacity:.95,lineCap:'round'}).addTo(state.map);
}
function setGps(connected,label){
  $('gpsDot').parentElement.classList.toggle('connected',connected);
  $('gpsLabel').textContent=label;
}
function formatTime(ms){
  const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  return [h,m,sec].map(v=>String(v).padStart(2,'0')).join(':');
}
function elapsedMs(){return state.elapsedBeforePause+(state.startedAt&&!state.paused?Date.now()-state.startedAt:0)}
function updateStats(){
  $('elapsed').textContent=formatTime(elapsedMs());
  $('distance').innerHTML=`${(state.distance/1000).toFixed(2)} <small>km</small>`;
  $('avgSpeed').innerHTML=`${state.distance&&elapsedMs()>0?Math.round((state.distance/1000)/(elapsedMs()/3600000)):'—'}${state.distance?` <small>km/h</small>`:''}`;
  $('liveSpeed').innerHTML=state.currentSpeed===null?'— <small>km/h</small>':`${Math.round(state.currentSpeed)} <small>km/h</small>`;
  $('maxSpeed').innerHTML=state.maxSpeed?`${Math.round(state.maxSpeed)} <small>km/h</small>`:'— <small>km/h</small>';
}
function haversine(a,b){
  const R=6371000,toRad=v=>v*Math.PI/180;
  const dLat=toRad(b.lat-a.lat),dLon=toRad(b.lng-a.lng);
  const x=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function onPosition(pos){
  const p={lat:pos.coords.latitude,lng:pos.coords.longitude,time:pos.timestamp,accuracy:pos.coords.accuracy,heading:pos.coords.heading,alt:pos.coords.altitude};
  if(p.accuracy>50){$('mapHint').textContent=`GPS accuracy ±${Math.round(p.accuracy)}m`;return;}
  const speed=pos.coords.speed;
  state.currentSpeed=speed===null?null:Math.max(0,speed*3.6);
  if(state.currentSpeed!==null)state.maxSpeed=Math.max(state.maxSpeed,state.currentSpeed);
  if(state.lastFix){
    const delta=haversine(state.lastFix,p);
    // Filter GPS jumps and stationary noise. Keep raw location samples only when plausible.
    const seconds=Math.max((p.time-state.lastFix.time)/1000,1);
    if(delta>Math.max(3,p.accuracy*.35)&&delta/seconds<75){state.distance+=delta;state.points.push(p);}
  }else state.points.push(p);
  state.lastFix=p;Guide.update(p,state.currentSpeed);showDetails(p);
  if(!state.marker){
    state.marker=L.circleMarker([p.lat,p.lng],{radius:8,color:'#05080d',weight:3,fillColor:'#38bdf8',fillOpacity:1}).addTo(state.map);
  }else state.marker.setLatLng([p.lat,p.lng]);
  state.track.setLatLngs(state.points.map(x=>[x.lat,x.lng]));
  state.map.setView([p.lat,p.lng],Math.max(state.map.getZoom(),15),{animate:true});
  $('mapHint').textContent=`GPS accuracy ±${Math.round(p.accuracy)}m`;
  setGps(true,'GPS CONNECTED');updateStats();
}
function onGpsError(err){
  const messages={1:'Location permission denied',2:'Position unavailable',3:'GPS request timed out'};
  $('mapHint').textContent=messages[err.code]||'GPS unavailable';
  setGps(false,'GPS UNAVAILABLE');
}
function startRide(){
  if(!('geolocation' in navigator)){alert('This browser does not support GPS location.');return;}
  if(!window.isSecureContext){alert('GPS requires HTTPS. Open this app through GitHub Pages, Netlify, or localhost.');return;}
  resetSession();Guide.reset();lockScreen();state.rideStart=Date.now();$('rideSection').scrollIntoView({behavior:'smooth'});['dStart','dNow','dHead','dAlt','dAcc'].forEach(i=>$(i).textContent='Locating…');
  state.startedAt=Date.now();state.paused=false;
  $('startBtn').disabled=true;$('pauseBtn').disabled=false;$('endBtn').disabled=false;
  $('rideState').classList.add('active');$('rideState').innerHTML='<i></i> RECORDING';
  $('mapHint').textContent='Acquiring GPS signal…';setGps(false,'CONNECTING TO GPS');
  state.watchId=navigator.geolocation.watchPosition(onPosition,onGpsError,{enableHighAccuracy:true,maximumAge:1000,timeout:20000});
  state.timerId=setInterval(updateStats,500);
  $('rideSection').scrollIntoView({behavior:'smooth',block:'start'});
}
function resetSession(){
  if(state.watchId!==null)navigator.geolocation.clearWatch(state.watchId);
  clearInterval(state.timerId);
  Object.assign(state,{watchId:null,timerId:null,startedAt:null,elapsedBeforePause:0,paused:false,points:[],distance:0,maxSpeed:0,currentSpeed:null,lastFix:null,startPlace:null,nowPlace:null,geoStart:0,lastGeo:0});
  state.track.setLatLngs([]);if(state.marker){state.map.removeLayer(state.marker);state.marker=null;}
  updateStats();
}
function pauseRide(){
  if(!state.paused){
    state.elapsedBeforePause+=Date.now()-state.startedAt;state.startedAt=null;state.paused=true;
    if(state.watchId!==null)navigator.geolocation.clearWatch(state.watchId);state.watchId=null;
    $('pauseBtn').textContent='RESUME RIDE';$('rideState').innerHTML='<i></i> PAUSED';$('mapHint').textContent='Ride paused';
  }else{
    state.startedAt=Date.now();state.paused=false;state.lastFix=null;
    state.watchId=navigator.geolocation.watchPosition(onPosition,onGpsError,{enableHighAccuracy:true,maximumAge:1000,timeout:20000});
    $('pauseBtn').textContent='PAUSE RIDE';$('rideState').innerHTML='<i></i> RECORDING';
  }
  updateStats();
}
function endRide(){
  if(!confirm('End this ride and save its summary?'))return;
  const ride={startPlace:state.startPlace,endPlace:state.nowPlace,startTime:state.rideStart,date:new Date().toISOString(),distance:state.distance,elapsed:elapsedMs(),avg:state.elapsedBeforePause||state.startedAt?(state.distance/1000)/(elapsedMs()/3600000):0,max:state.maxSpeed,points:state.points};
  saveRide(ride);
  if(state.watchId!==null)navigator.geolocation.clearWatch(state.watchId);clearInterval(state.timerId);
  state.watchId=null;state.timerId=null;state.startedAt=null;
  $('startBtn').disabled=false;$('pauseBtn').disabled=true;$('endBtn').disabled=true;$('pauseBtn').textContent='PAUSE RIDE';
  $('rideState').classList.remove('active');$('rideState').innerHTML='<i></i> RIDE SAVED';$('mapHint').textContent='Ride saved on this device';
  setGps(false,'GPS NOT CONNECTED');renderHistory();updateStats();releaseLock();Guide.reset();showRideImage(ride);
}
function renderHistory(){
  const rides=JSON.parse(localStorage.getItem('slayMotoRides')||'[]');
  $('historyList').innerHTML=rides.length?rides.map((r,i)=>`<article class="history-item" data-i="${i}" tabindex="0"><div><strong>Ride ${String(rides.length-i).padStart(2,'0')}</strong><small>${new Date(r.date).toLocaleString()}</small></div><div class="history-metrics"><span>${(r.distance/1000).toFixed(2)} km</span><span>${formatTime(r.elapsed)}</span><span>${Math.round(r.max||0)} km/h max</span></div></article>`).join(''):'<div class="empty-state">Your completed rides will appear here.</div>';
}
function locateMe(){
  if(!navigator.geolocation){alert('GPS is not supported.');return;}
  navigator.geolocation.getCurrentPosition(pos=>state.map.setView([pos.coords.latitude,pos.coords.longitude],16),onGpsError,{enableHighAccuracy:true,timeout:15000});
}
function openPlanner(){$('routeModal').hidden=false;$('destination').focus();}
async function findRoute(){
  const dest=$('destination').value.trim();if(!dest){$('routeMessage').textContent='Enter a destination first.';return;}
  $('routeMessage').textContent='Finding destination…';
  try{
    const q=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(dest)}`,{headers:{'Accept-Language':'en'}});
    if(!q.ok)throw new Error('Geocoding service unavailable');
    const results=await q.json();if(!results.length)throw new Error('Destination not found. Try a more specific address.');
    const target=[Number(results[0].lat),Number(results[0].lon)];
    const origin=await getOrigin();
    if(!origin){throw new Error('Start a ride or enable GPS first so we can use your current location as the route origin.');}
    $('routeMessage').textContent='Calculating route…';
    const r=await fetch(`https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${target[1]},${target[0]}?overview=full&geometries=geojson`);
    if(!r.ok)throw new Error('Routing service unavailable');
    const data=await r.json();if(!data.routes?.length)throw new Error('No route found.');
    const coords=data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);
    if(state.route)state.map.removeLayer(state.route);
    state.route=Guide.draw(coords,state.map);
    state.map.fitBounds(state.route.getBounds(),{padding:[35,35]});
    $('routeMessage').textContent=`Suggested route: ${(data.routes[0].distance/1000).toFixed(1)} km · ${Math.round(data.routes[0].duration/60)} min (estimate)`;$('startRouteBtn').hidden=false;
  }catch(e){$('routeMessage').textContent=e.message;}
}
function registerPwa(){
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferredInstall=e;$('installBtn').hidden=false;});
  $('installBtn').addEventListener('click',async()=>{if(!state.deferredInstall)return;state.deferredInstall.prompt();await state.deferredInstall.userChoice;state.deferredInstall=null;$('installBtn').hidden=true;});
}
$('startBtn').addEventListener('click',startRide);$('pauseBtn').addEventListener('click',pauseRide);$('endBtn').addEventListener('click',endRide);
$('locateBtn').addEventListener('click',locateMe);$('clearRouteBtn').addEventListener('click',()=>{Guide.clear();if(state.route){state.map.removeLayer(state.route);state.route=null;}});
$('planBtn').addEventListener('click',openPlanner);$('closeModal').addEventListener('click',()=>$('routeModal').hidden=true);$('cancelPlan').addEventListener('click',()=>$('routeModal').hidden=true);$('findRoute').addEventListener('click',findRoute);
$('clearHistoryBtn').addEventListener('click',()=>{if(confirm('Clear all saved rides from this device?')){localStorage.removeItem('slayMotoRides');renderHistory();}});
initMap();renderHistory();updateStats();registerPwa();

/* ---- v2 additions ---- */
function getOrigin(){return state.lastFix?Promise.resolve([state.lastFix.lat,state.lastFix.lng]):new Promise(res=>navigator.geolocation.getCurrentPosition(p=>res([p.coords.latitude,p.coords.longitude]),()=>res(null),{enableHighAccuracy:true,timeout:15000}));}
let wl=null;
async function lockScreen(){try{if('wakeLock' in navigator)wl=await navigator.wakeLock.request('screen');}catch(e){}}
function releaseLock(){try{wl&&wl.release();}catch(e){}wl=null;}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.startedAt&&!state.paused)lockScreen();});
function saveRide(ride){
  const k=Math.max(1,Math.ceil(ride.points.length/1500));
  ride.points=ride.points.filter((_,i)=>i%k===0||i===ride.points.length-1).map(p=>({lat:+p.lat.toFixed(6),lng:+p.lng.toFixed(6)}));
  let rides=JSON.parse(localStorage.getItem('slayMotoRides')||'[]');rides.unshift(ride);rides=rides.slice(0,30);
  for(;;){try{localStorage.setItem('slayMotoRides',JSON.stringify(rides));break;}catch(e){if(rides.length<=1)break;rides.pop();}}
}
function rideImage(r){
  const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  g.fillStyle='#05080d';g.fillRect(0,0,W,H);const pts=r.points||[];
  if(pts.length>1){
    const la=pts.map(p=>p.lat),ln=pts.map(p=>p.lng),a0=Math.min(...la),a1=Math.max(...la),n0=Math.min(...ln),n1=Math.max(...ln);
    const k=Math.cos((a0+a1)/2*Math.PI/180),w=(n1-n0)*k||1e-6,h=(a1-a0)||1e-6,s=Math.min(880/w,800/h),ox=(W-w*s)/2,oy=190+(800-h*s)/2;
    const X=p=>ox+(p.lng-n0)*k*s,Y=p=>oy+(a1-p.lat)*s;g.lineJoin=g.lineCap='round';
    [[24,'rgba(56,189,248,.16)'],[8,'#38bdf8']].forEach(([lw,col])=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(X(p),Y(p)):g.moveTo(X(p),Y(p)));g.lineWidth=lw;g.strokeStyle=col;g.stroke();});
    [[pts[0],'#4fd18b'],[pts[pts.length-1],'#e5554f']].forEach(([p,col])=>{g.beginPath();g.arc(X(p),Y(p),14,0,7);g.fillStyle=col;g.fill();g.lineWidth=4;g.strokeStyle='#05080d';g.stroke();});
  }
  g.fillStyle='#38bdf8';g.font='700 40px sans-serif';g.fillText('SLAY MOTO',70,100);if(LOGO.complete&&LOGO.naturalWidth){const lw=72*LOGO.naturalWidth/LOGO.naturalHeight;g.drawImage(LOGO,W-70-lw,40,lw,72);}
  g.fillStyle='#8aa0b4';g.font='26px sans-serif';g.fillText(new Date(r.date).toLocaleString(),70,145);g.fillStyle='#eef7f6';g.font='24px sans-serif';g.fillText('FROM  '+(r.startPlace||'—').slice(0,55),70,1270);g.fillText('TO      '+(r.endPlace||'—').slice(0,55),70,1310);
  const st=[['DISTANCE',(r.distance/1000).toFixed(2)+' km'],['TIME',formatTime(r.elapsed)],['AVG',Math.round(r.avg||0)+' km/h'],['MAX',Math.round(r.max||0)+' km/h']];
  st.forEach(([l,v],i)=>{const x=70+i*250;g.fillStyle='#8aa0b4';g.font='22px sans-serif';g.fillText(l,x,1150);g.fillStyle='#eef7f6';g.font='700 38px sans-serif';g.fillText(v,x,1200);});
  return c;
}
function showRideImage(r){if(!r)return;const url=rideImage(r).toDataURL('image/png');$('rideImg').src=url;$('dlImg').href=url;$('dlImg').download='slay-moto-ride.png';$('imgModal').hidden=false;}
$('closeImg').addEventListener('click',()=>$('imgModal').hidden=true);
$('historyList').addEventListener('click',e=>{const a=e.target.closest('.history-item');if(a)showRideImage(JSON.parse(localStorage.getItem('slayMotoRides')||'[]')[a.dataset.i]);});
$('profileSel').addEventListener('change',e=>Guide.setProfile(e.target.value));
$('voiceChk').addEventListener('change',e=>Guide.setVoice(e.target.checked));

/* ---- v3: location-aware ride details ---- */
async function place(lat,lng){try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&lat=${lat}&lon=${lng}`);const j=await r.json(),a=j.address||{};
  return [a.road,a.suburb||a.neighbourhood,a.city||a.town||a.village].filter(Boolean).join(', ')||j.display_name||null;}catch(e){return null;}}
function showDetails(p){
  const set=(i,v)=>$(i).textContent=v;
  set('dStartTime',state.rideStart?new Date(state.rideStart).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—');
  set('dHead',p.heading!=null&&!isNaN(p.heading)?['N','NE','E','SE','S','SW','W','NW'][Math.round(p.heading/45)%8]+' '+Math.round(p.heading)+'°':'—');
  set('dAlt',p.alt!=null?Math.round(p.alt)+' m':'—');set('dAcc','±'+Math.round(p.accuracy)+' m');
  if(!state.geoStart){state.geoStart=1;state.lastGeo=Date.now();place(p.lat,p.lng).then(v=>{state.startPlace=v;state.nowPlace=v;set('dStart',v||'Unknown');set('dNow',v||'Unknown');});}
  else if(Date.now()-state.lastGeo>30000){state.lastGeo=Date.now();place(p.lat,p.lng).then(v=>{if(v){state.nowPlace=v;set('dNow',v);}});}
}
$('startRouteBtn').addEventListener('click',()=>{$('routeModal').hidden=true;startRide();});

$('ctaStart').addEventListener('click',()=>{window.scrollTo({top:0,behavior:'smooth'});$('startBtn').click();});

const LOGO=new Image();LOGO.src='assets/logo.webp';
