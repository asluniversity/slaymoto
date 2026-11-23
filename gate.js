/* SLAY RACING location gate: before any location-based action, make sure location is on (explain, ask, guide). */
(()=>{
const q=id=>document.getElementById(id),UA=navigator.userAgent;
const IOS=/iP(hone|ad|od)/.test(UA)||(/Mac/.test(UA)&&navigator.maxTouchPoints>1),AND=/Android/.test(UA);
const SEL='#startBtn,#planBtn,#findRoute,#locateBtn,#setA,#setB,#raceGo,#dgArm,#openCopilot,#condGo';
const STEPS={
  ios:['Open Settings → Privacy & Security → Location Services and switch it On.','Scroll to Safari Websites (or your browser) and choose “While Using the App”, with Precise Location on.','In Safari tap the “aA” icon → Website Settings → Location → Allow.','Come back here and tap Try again.'],
  and:['Swipe down from the top of the screen and turn Location (GPS) on.','Tap the lock or ⋮ icon next to the address → Site settings → Location → Allow.','Set Location accuracy to Precise.','Come back here and tap Try again.'],
  gen:['Turn on Location in your device settings.','Allow location for this site in your browser’s site settings.','Come back here and tap Try again.']};
const T={
  ask:['Turn on your location','Slay Racing needs your live location to track your ride, time your laps and warn you before corners. Tap the button, then choose “Allow” (precise location).','ENABLE LOCATION',0],
  check:['Checking your location…','Looking for a GPS signal. This can take a few seconds outdoors.','CHECKING…',0],
  denied:['Location is blocked','Your browser or phone is blocking location for this site. Turn it on, then try again.','TRY AGAIN',1],
  unavail:['Can’t find your position','Location (GPS) looks switched off or the signal is weak. Turn it on and go somewhere with a clear view of the sky.','TRY AGAIN',1]};
let okAt=0,pending=null,tm=0;
const fresh=()=>Date.now()-okAt<5*60*1000;
const perm=()=>navigator.permissions&&navigator.permissions.query?navigator.permissions.query({name:'geolocation'}).then(p=>p.state,()=>'unknown'):Promise.resolve('unknown');
const probe=ms=>new Promise(res=>navigator.geolocation?navigator.geolocation.getCurrentPosition(()=>res({ok:1}),e=>res({ok:0,code:e.code}),{enableHighAccuracy:true,maximumAge:60000,timeout:ms}):res({ok:0,code:2}));
function show(k){const t=T[k];q('locTitle').textContent=t[0];q('locText').textContent=t[1];q('locGo').textContent=t[2];q('locGo').disabled=k==='check';
  q('locSteps').innerHTML=t[3]?(IOS?STEPS.ios:AND?STEPS.and:STEPS.gen).map(s=>`<li>${s}</li>`).join(''):'';q('locModal').hidden=false;}
const hide=()=>{clearTimeout(tm);q('locModal').hidden=true;};
async function ensure(){
  if(fresh())return true;const st=await perm();
  if(st==='denied'){show('denied');return false;}
  if(st==='granted'){tm=setTimeout(()=>show('check'),400);const r=await probe(8000);clearTimeout(tm);
    if(r.ok){okAt=Date.now();hide();return true;}show(r.code===1?'denied':'unavail');return false;}
  show('ask');return false;}
function resume(){const b=pending;pending=null;hide();if(b)setTimeout(()=>b.click(),60);}
document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest(SEL);if(!el||el.disabled||fresh())return;
  e.preventDefault();e.stopImmediatePropagation();pending=el;ensure().then(ok=>{if(ok)resume();});},true);
q('locGo').onclick=async()=>{show('check');const r=await probe(15000);
  if(r.ok){okAt=Date.now();resume();}else show(r.code===1?'denied':'unavail');};
q('locClose').onclick=()=>{pending=null;hide();};
try{navigator.permissions.query({name:'geolocation'}).then(p=>{p.onchange=()=>{if(p.state!=='granted')okAt=0;};});}catch(e){}
})();
