/* SLAY RACING welcome tour, vehicle setting, settings card, contact buttons and the mobile "More" menu. */
(()=>{
const q=id=>document.getElementById(id),VK='slayMotoVehicle';
function setVeh(v){v=v==='car'?'car':'moto';try{localStorage.setItem(VK,v);}catch(e){}document.body.dataset.vehicle=v;
  document.querySelectorAll('[data-veh]').forEach(b=>b.classList.toggle('on',b.dataset.veh===v));const s=q('dgVeh');if(s)s.value=v==='car'?'Car':'Motorcycle';document.dispatchEvent(new Event('slayvehicle'));}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-veh]');if(b)setVeh(b.dataset.veh);});
setVeh(localStorage.getItem(VK)||'moto');
/* settings card + contact */
const nm=q('setName');if(nm){nm.value=localStorage.getItem('slayMotoName')||'';nm.onchange=()=>{try{localStorage.setItem('slayMotoName',nm.value.trim().slice(0,20)||'Rider');}catch(e){}SlayToast('Name saved.');};}
const C=window.SLAY_CONTACT||{},L=[];
if(C.email)L.push(['EMAIL','mailto:'+C.email]);if(C.instagram)L.push(['INSTAGRAM','https://instagram.com/'+C.instagram.replace(/^@/,'')]);
if(C.telegram)L.push(['TELEGRAM','https://t.me/'+C.telegram.replace(/^@/,'')]);if(C.whatsapp)L.push(['WHATSAPP','https://wa.me/'+C.whatsapp.replace(/\D/g,'')]);if(C.website)L.push(['WEBSITE',C.website]);
q('contactBtns').innerHTML=L.length?L.map(([l,u])=>`<a class="secondary-btn" href="${u}" target="_blank" rel="noopener">${l}</a>`).join(''):'<p class="legal">Contact details will be added soon.</p>';
/* tour */
const STEPS=[
 ['Welcome to SLAY RACING','<p>Your phone becomes a racing co-pilot: live speed, corner alerts, lap timing, drag runs and shareable records.</p><p class="wl">I drive a</p><div class="wchips"><button class="chip" data-veh="moto">MOTORCYCLE</button><button class="chip" data-veh="car">CAR</button></div><p class="wl">Show speed in</p><div class="wchips"><button class="chip" data-unit="kmh">KM/H</button><button class="chip" data-unit="mph">MPH</button></div>'],
 ['Turn on your location','<p>Everything runs on your phone’s GPS: speed, route, laps and drag times. Your position stays on your device. Only street names and weather are looked up online.</p><button class="primary-btn" id="wlLoc">ENABLE LOCATION</button><p class="legal" id="wlLocMsg"></p>'],
 ['Mount it. Calibrate it.','<ul class="wsteps"><li>Fix the phone firmly to the handlebar or dash. Keep the screen on and the battery topped up.</li><li>Motorcycle: open Co-pilot, hold the bike upright and tap CALIBRATE once. Then lean angle works.</li><li>Pair a helmet or car speaker for voice alerts. The buttons are made for gloves.</li></ul>'],
 ['Ride smart','<ul class="wsteps"><li>Race and Drag are for closed tracks and strips only.</li><li>Alerts are advisory. They cannot see the road, weather or traffic.</li><li>Never touch the phone while moving. Obey the law and drive to the conditions.</li></ul>']];
let step=0;
const m=document.createElement('div');m.className='modal-backdrop';m.id='welcomeModal';m.hidden=true;
m.innerHTML='<div class="modal welcome" role="dialog" aria-modal="true" aria-labelledby="wlTitle"><img class="wl-logo" src="assets/logo.webp" alt="SLAY"><p class="eyebrow" id="wlStep"></p><h2 id="wlTitle"></h2><div id="wlBody"></div><div class="wl-dots" id="wlDots"></div><div class="wl-actions"><button class="secondary-btn" id="wlBack">BACK</button><button class="primary-btn" id="wlNext">NEXT</button></div><button class="wl-skip" id="wlSkip">Skip tour</button></div>';
document.body.appendChild(m);
function draw(){const s=STEPS[step];q('wlStep').textContent='STEP '+(step+1)+' OF '+STEPS.length;q('wlTitle').textContent=s[0];q('wlBody').innerHTML=s[1];
  q('wlDots').innerHTML=STEPS.map((_,i)=>`<i class="${i===step?'on':''}"></i>`).join('');q('wlBack').style.visibility=step?'visible':'hidden';q('wlNext').textContent=step===STEPS.length-1?'LET’S GO':'NEXT';
  document.querySelectorAll('#welcomeModal [data-veh]').forEach(b=>b.classList.toggle('on',b.dataset.veh===document.body.dataset.vehicle));
  document.querySelectorAll('#welcomeModal [data-unit]').forEach(b=>b.classList.toggle('on',b.dataset.unit===SlayUnits.get()));
  const l=q('wlLoc');if(l)l.onclick=()=>getOrigin().then(o=>{q('wlLocMsg').textContent=o?'Location is on — you are ready.':'Location is off. You can turn it on later when you start.';});}
function open(i){step=i||0;draw();m.hidden=false;}
function close(){m.hidden=true;try{localStorage.setItem('slayMotoWelcome','1');}catch(e){}}
q('wlNext').onclick=()=>{if(step<STEPS.length-1){step++;draw();}else close();};q('wlBack').onclick=()=>{if(step){step--;draw();}};q('wlSkip').onclick=close;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden)close();});
['tourBtn','tourLink'].forEach(id=>{const e=q(id);if(e)e.onclick=ev=>{ev.preventDefault();open(0);};});
if(!localStorage.getItem('slayMotoWelcome')&&!/^#[cr]=/.test(location.hash))setTimeout(()=>open(0),1300);
/* mobile "More" menu */
const sh=document.createElement('div');sh.id='moreSheet';sh.className='sheet';sh.hidden=true;
sh.innerHTML='<a href="#recordsSection">RECORDS</a><a href="#condSection">ROAD &amp; WEATHER</a><a href="#aboutSection">ABOUT &amp; CONTACT</a><button type="button" id="moreTour">TAKE THE TOUR</button>';document.body.appendChild(sh);
q('moreBtn').onclick=e=>{e.stopPropagation();sh.hidden=!sh.hidden;};
document.addEventListener('click',e=>{if(!sh.hidden&&!(e.target.closest&&e.target.closest('#moreSheet,#moreBtn')))sh.hidden=true;});
sh.addEventListener('click',e=>{if(e.target.closest('a'))sh.hidden=true;if(e.target.id==='moreTour'){sh.hidden=true;open(0);}});
})();
