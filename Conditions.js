/* SLAY MOTO road & weather: live weather (Open-Meteo) + nearest road info (OpenStreetMap/Overpass) -> a grip & safety estimate. */
(()=>{
const q=id=>document.getElementById(id),U=()=>window.SlayUnits,D=Math.PI/180;
const WMO={0:'Clear sky',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Freezing fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',56:'Freezing drizzle',57:'Freezing drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Rain showers',81:'Rain showers',82:'Violent showers',85:'Snow showers',86:'Snow showers',95:'Thunderstorm',96:'Thunderstorm, hail',99:'Thunderstorm, hail'};
const SURF={asphalt:'Asphalt',concrete:'Concrete',paved:'Paved',paving_stones:'Paving stones',sett:'Cobblestones',cobblestone:'Cobblestones',gravel:'Gravel',unpaved:'Unpaved',dirt:'Dirt',ground:'Dirt',sand:'Sand',grass:'Grass',compacted:'Compacted gravel',fine_gravel:'Fine gravel'};
const LOOSE=['sett','cobblestone','gravel','unpaved','dirt','ground','sand','grass','compacted','fine_gravel','paving_stones'];
const hav=(a,b)=>{const x=Math.sin((b[0]-a[0])*D/2)**2+Math.cos(a[0]*D)*Math.cos(b[0]*D)*Math.sin((b[1]-a[1])*D/2)**2;return 12742000*Math.asin(Math.sqrt(x));};
const compass=d=>['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8];
const to=(ms,ctl)=>setTimeout(()=>ctl.abort(),ms);
async function weather(lat,lng){const c=new AbortController(),t=to(9000,c);
  try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,is_day&hourly=precipitation_probability,precipitation,visibility&past_hours=3&forecast_hours=3&wind_speed_unit=kmh&timezone=auto`;
    const r=await fetch(u,{signal:c.signal});if(!r.ok)throw 0;return await r.json();}finally{clearTimeout(t);}}
async function road(lat,lng){const c=new AbortController(),t=to(9000,c);
  try{const qy=`[out:json][timeout:8];way(around:30,${lat},${lng})[highway];out tags geom 8;`;
    const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:'data='+encodeURIComponent(qy),headers:{'Content-Type':'application/x-www-form-urlencoded'},signal:c.signal});if(!r.ok)throw 0;
    const j=await r.json();let best=null,bd=1e9;(j.elements||[]).forEach(w=>{(w.geometry||[]).forEach(p=>{const d=hav([lat,lng],[p.lat,p.lon]);if(d<bd){bd=d;best=w;}});});return best?best.tags||{}:null;}finally{clearTimeout(t);}}
function analyse(w,rd,veh){const cur=w.current,h=w.hourly||{},moto=veh!=='car',R=[];let lvl=0;
  const add=(l,t)=>{R.push([l,t]);lvl=Math.max(lvl,l);};
  const i=(h.time||[]).indexOf((cur.time||'').slice(0,13)+':00'),past=i>0?(h.precipitation||[]).slice(Math.max(0,i-3),i).reduce((a,b)=>a+(b||0),0):0;
  const temp=cur.temperature_2m,rain=cur.precipitation||0,gust=cur.wind_gusts_10m||0,vis=i>=0&&h.visibility?h.visibility[i]:null,code=cur.weather_code;
  const next=i>=0?Math.max(0,...(h.precipitation_probability||[]).slice(i,i+3).map(x=>x||0)):0;
  let grip='DRY';
  if(temp<=1){grip='ICY RISK';add(2,'Freezing temperature — ice is possible on the road.');}
  else if(temp<=4){add(1,moto?'Cold tyres and possible ice patches. Ride gently.':'Possible ice patches on shaded or bridge sections.');}
  if(rain>2.5||code>=95){grip='WET';add(2,code>=95?'Thunderstorm in the area.':'Heavy rain — long braking distances and spray.');}
  else if(rain>0.1){grip=grip==='ICY RISK'?grip:'WET';add(1,'It is raining — the road is wet and slippery.');}
  else if(past>0.5){grip=grip==='ICY RISK'?grip:'DAMP';add(1,'It rained in the last hours — the road may still be damp.');}
  if([71,73,75,77,85,86].includes(code)){grip='ICY RISK';add(2,'Snow — not recommended.');}
  if(gust>=(moto?60:75))add(2,'Very strong gusts ('+Math.round(U().spd(gust))+' '+U().sl()+').');else if(gust>=(moto?40:55))add(1,'Strong gusts ('+Math.round(U().spd(gust))+' '+U().sl()+') — expect side pushes.');
  if(vis!=null){if(vis<1000)add(2,'Very low visibility (fog or heavy rain).');else if(vis<3000)add(1,'Reduced visibility.');}
  else if(code===45||code===48)add(2,'Fog.');
  if(!cur.is_day)add(1,'Night riding — shorter sight distance.');
  if(next>=60&&rain<=0.1)add(1,'Rain likely within 3 hours ('+next+'%).');
  if(rd){const s=rd.surface;if(s&&LOOSE.includes(s))add(moto?1:0,(SURF[s]||s)+' surface — less grip, especially when wet.');}
  if(!R.length)R.push([0,'No major issues detected for this spot right now.']);
  return {lvl,reasons:R,grip,temp,rain,gust,vis,next,past,code};}
function render(w,rd,place,A){const cur=w.current,u=U(),F=t=>Math.round(t*9/5+32),tp=t=>Math.round(t)+'°C'+(u.isMph()?' / '+F(t)+'°F':'');
  const V=['GOOD','CAUTION','RISKY'][A.lvl],C=['#4fd18b','#e7d25b','#e5554f'][A.lvl];
  const maxs=rd&&rd.maxspeed?(/mph/.test(rd.maxspeed)?parseFloat(rd.maxspeed)*1.609344:parseFloat(rd.maxspeed)):null;
  const roadTxt=rd?[rd.name||'Unnamed road',rd.highway?String(rd.highway).replace(/_/g,' '):null,rd.surface?(SURF[rd.surface]||rd.surface):'surface unknown',maxs&&isFinite(maxs)?'limit '+Math.round(u.spd(maxs))+' '+u.sl():'limit unknown'].filter(Boolean).join(' · '):'No road data nearby (OpenStreetMap)';
  const tile=(l,v,s)=>`<div class="ct"><small>${l}</small><b>${v}</b>${s?`<span>${s}</span>`:''}</div>`;
  q('condOut').hidden=false;q('condOut').innerHTML=`<div class="cond-verdict" style="--c:${C}"><b>${V}</b><span>${place||'Your location'} · ${WMO[cur.weather_code]||'—'}</span></div>
  <ul class="cond-why">${A.reasons.map(r=>`<li class="l${r[0]}">${r[1]}</li>`).join('')}</ul>
  <div class="cond-tiles">${tile('GRIP (ESTIMATE)',A.grip,'from weather, not measured')}${tile('TEMPERATURE',tp(cur.temperature_2m),'feels '+tp(cur.apparent_temperature))}
  ${tile('WIND',Math.round(u.spd(cur.wind_speed_10m))+' '+u.sl(),'gusts '+Math.round(u.spd(cur.wind_gusts_10m))+' · from '+compass(cur.wind_direction_10m))}${tile('RAIN',(cur.precipitation||0).toFixed(1)+' mm/h','next 3 h: '+A.next+'% chance')}
  ${tile('VISIBILITY',A.vis!=null?(u.isMph()?(A.vis/1609.344).toFixed(1)+' mi':(A.vis/1000).toFixed(1)+' km'):'—','')}${tile('ROAD HERE',rd&&rd.surface?(SURF[rd.surface]||rd.surface):'—',roadTxt)}</div>
  <p class="legal">Estimate from public weather and OpenStreetMap data. It cannot see oil, gravel, potholes or black ice. Always ride to what you see.</p>`;}
async function run(){const btn=q('condGo');btn.disabled=true;btn.textContent='CHECKING…';q('condErr').hidden=true;
  try{const o=await getOrigin();if(!o)throw new Error('loc');const [lat,lng]=o;
    const [wr,rr,pl]=await Promise.allSettled([weather(lat,lng),road(lat,lng),typeof place==='function'?place(lat,lng):Promise.resolve(null)]);
    if(wr.status!=='fulfilled'){throw new Error('weather');}
    const rd=rr.status==='fulfilled'?rr.value:null,veh=document.body.dataset.vehicle||'moto',A=analyse(wr.value,rd,veh);render(wr.value,rd,pl.status==='fulfilled'?pl.value:null,A);window.__cond=()=>render(wr.value,rd,pl.status==='fulfilled'?pl.value:null,A);}
  catch(e){q('condErr').hidden=false;q('condErr').textContent=e.message==='loc'?'We could not read your location. Turn on location and try again.':'The weather service did not answer. Check your connection and try again.';}
  btn.disabled=false;btn.textContent='CHECK AGAIN';}
q('condGo').onclick=run;document.addEventListener('slayunits',()=>{if(!q('condOut').hidden&&window.__cond)window.__cond();});
window.__condAnalyse=analyse;
})();
