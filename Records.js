/* SLAY RACING records: table of rides / races / drags (+ friends' results), personal bests, and a side-by-side comparison. */
(()=>{
const q=id=>document.getElementById(id),U=()=>window.SlayUnits;
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]');}catch(e){return [];}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const fmtT=ms=>{const s=ms/1000,m=Math.floor(s/60);return m+':'+(s%60).toFixed(1).padStart(4,'0');};
const KMLB=['0–50 km/h','0–100 km/h','0–150 km/h','0–200 km/h','100 m','1/8 mile','1/4 mile'];
let tab='drag',sel=[];
const KEYS={d:'slayMotoDrag',r:'slayMotoRides',m:'slayMotoRaces',f:'slayMotoFriends'};
function list(){
  if(tab==='drag')return get(KEYS.d).map((r,i)=>({r,i,key:'d'+i}));
  if(tab==='ride')return get(KEYS.r).map((r,i)=>({r,i,key:'r'+i}));
  const mine=get(KEYS.m).map((r,i)=>({r,i,key:'m'+i})),fr=get(KEYS.f).map((o,i)=>({r:{mode:o.m,total:o.tt,laps:o.lp||[],dist:o.d,avg:o.av,max:o.mx,date:o.dt,pts:(o.pa||[]).map(p=>[p[0],p[1],0,0])},i,key:'f'+i,friend:o.by}));
  return mine.concat(fr);}
const path=(t,r)=>t==='drag'?(r.pts||[]).filter(p=>p[3]).map(p=>[p[3],p[4],p[1]]):t==='ride'?(r.points||[]).map(p=>[p.lat,p.lng,p.v]):(r.pts||[]).map(p=>[p[0],p[1],p[2]]);
const sp=v=>Math.round(U().spd(v||0))+' '+U().sl();
function main(t,r){ // value used for PB (lower is better unless noted) and a label
  if(t==='drag')return r.sp&&r.sp[1]?{v:r.sp[1][0],lbl:r.sp[1][0].toFixed(2)+' s · '+((r.lb&&r.lb[1])||KMLB[1]),grp:r.u||'kmh',low:true}:{v:null,lbl:'top '+sp(r.vmax),grp:r.u||'kmh',low:true};
  if(t==='ride')return {v:r.distance,lbl:U().dist(r.distance)+' · '+fmtT(r.elapsed||0).replace(/\.\d$/,''),grp:'ride',low:false};
  const L=r.laps||[];return L.length?{v:Math.min(...L),lbl:'best lap '+fmtT(Math.min(...L)),grp:r.mode,low:true}:{v:r.total,lbl:'total '+fmtT(r.total),grp:r.mode,low:true};}
function sub(t,x){const r=x.r,d=new Date(r.date).toLocaleDateString();
  if(t==='drag')return (r.sp&&r.sp[6]?'1/4 mi '+r.sp[6][0].toFixed(2)+' s · ':'')+'top '+sp(r.vmax)+' · '+(r.veh||'')+' · '+d;
  if(t==='ride')return 'avg '+sp(r.avg)+' · max '+sp(r.max)+' · '+d;
  return (r.mode==='circuit'?(r.laps||[]).length+' laps':'A → B')+' · '+U().dist(r.dist)+' · avg '+sp(r.avg)+' · '+d;}
function render(){
  const L=list(),best={};
  L.forEach(x=>{const m=main(tab,x.r);x.m=m;if(m.v!=null){const b=best[m.grp];if(b==null||(m.low?m.v<b:m.v>b))best[m.grp]=m.v;}});
  q('recTable').innerHTML=L.length?L.map(x=>{const th=window.SlayShape?SlayShape.thumb(path(tab,x.r)):'',pb=x.m.v!=null&&x.m.v===best[x.m.grp]&&L.filter(y=>y.m.grp===x.m.grp&&y.m.v!=null).length>1;
    return `<label class="rec-row${sel.includes(x.key)?' sel':''}"><input type="checkbox" data-k="${x.key}" ${sel.includes(x.key)?'checked':''} aria-label="Select record"><img class="rh-th" alt="" src="${th}"><div class="rh-m"><b>${x.m.lbl}${pb?' <i class="pb">PB</i>':''}${x.friend?` <i class="fr">${x.friend}</i>`:''}</b><span>${sub(tab,x)}</span></div><button class="rec-del" data-del="${x.key}" aria-label="Delete record">✕</button></label>`;}).join(''):'<div class="empty-state">No records yet. Finish a run and it shows up here.</div>';
  q('recImportRow').hidden=tab!=='race';
  document.querySelectorAll('[data-rt]').forEach(b=>b.classList.toggle('on',b.dataset.rt===tab));
  compare();}
function who(x){return x.friend?x.friend:'You';}
function row(label,a,b,f,low,df){if(a==null||b==null)return `<tr><td>${label}</td><td>${a==null?'—':f(a)}</td><td>${b==null?'—':f(b)}</td><td>—</td></tr>`;
  const d=a-b,win=low===undefined?'':(d===0?'':((low?d<0:d>0)?'win':'lose'));
  return `<tr><td>${label}</td><td>${f(a)}</td><td>${f(b)}</td><td class="${win}">${low===undefined?'':(d>0?'+':'')+(df||f)(d)}</td></tr>`;}
function canvas(draw){const c=document.createElement('canvas');c.width=900;c.height=300;c.className='rec-canvas';draw(c.getContext('2d'));return c;}
function compare(){const box=q('recCompare');if(sel.length<2){box.hidden=true;box.innerHTML='';return;}
  const L=list(),A=L.find(x=>x.key===sel[0]),B=L.find(x=>x.key===sel[1]);if(!A||!B){box.hidden=true;return;}
  const a=A.r,b=B.r,u=U();let rows='',chart=null;
  if(tab==='drag'){const ua=a.u||'kmh',ub=b.u||'kmh';
    if(ua!==ub){box.hidden=false;box.innerHTML='<p class="legal">These two records use different units ('+(a.lb||KMLB)[1]+' vs '+(b.lb||KMLB)[1]+'). Pick two records made in the same unit.</p>';return;}
    const lb=a.lb||KMLB,mph=ua==='mph',cv=v=>mph?v/1.609344:v,tt=s=>s.toFixed(2)+' s';
    lb.forEach((l,i)=>{rows+=row(l,a.sp[i]?a.sp[i][0]:null,b.sp[i]?b.sp[i][0]:null,tt,true);});
    rows+=row('TOP SPEED',cv(a.vmax),cv(b.vmax),v=>Math.round(v)+(mph?' mph':' km/h'),false,v=>(Math.round(v*10)/10)+'');
    chart=canvas(g=>{const T=Math.max(a.dur||1,b.dur||1),Vm=Math.max(mph?60:100,Math.ceil(Math.max(cv(a.vmax),cv(b.vmax))/(mph?25:50))*(mph?25:50)),X=t=>50+t/T*820,Y=v=>270-cv(v)/Vm*240;
      g.fillStyle='#8aa0b4';g.font='16px sans-serif';g.strokeStyle='rgba(138,160,180,.25)';for(let v=0;v<=Vm;v+=(mph?25:50)){const y=270-v/Vm*240;g.beginPath();g.moveTo(50,y);g.lineTo(870,y);g.stroke();g.fillText(v,8,y+5);}
      [[a,'#38bdf8'],[b,'#ffffff']].forEach(([r,c])=>{g.beginPath();(r.pts||[]).forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.strokeStyle=c;g.lineWidth=4;g.stroke();});});}
  else if(tab==='race'){const ml=r=>(r.laps&&r.laps.length)?Math.min(...r.laps):null;
    rows+=row('TOTAL TIME',a.total,b.total,fmtT,true,v=>(v/1000).toFixed(1)+' s');rows+=row('BEST LAP',ml(a),ml(b),fmtT,true,v=>(v/1000).toFixed(2)+' s');
    rows+=row('LAPS',(a.laps||[]).length,(b.laps||[]).length,v=>v);rows+=row('AVG SPEED',a.avg,b.avg,sp,false,v=>Math.round(u.spd(v))+'');rows+=row('TOP SPEED',a.max,b.max,sp,false,v=>Math.round(u.spd(v))+'');rows+=row('DISTANCE',a.dist,b.dist,m=>u.dist(m));
    const n=Math.min((a.laps||[]).length,(b.laps||[]).length);for(let i=0;i<n;i++)rows+=row('LAP '+(i+1),a.laps[i],b.laps[i],fmtT,true,v=>(v/1000).toFixed(2)+' s');
    if(n>0)chart=canvas(g=>{const mx=Math.max(...a.laps.slice(0,n),...b.laps.slice(0,n)),bw=Math.min(60,780/n/2.6);g.fillStyle='#8aa0b4';g.font='16px sans-serif';
      for(let i=0;i<n;i++){const x=60+i*(820/n);[[a.laps[i],'#38bdf8',0],[b.laps[i],'#ffffff',bw+6]].forEach(([v,c,o])=>{const h=v/mx*220;g.fillStyle=c;g.fillRect(x+o,260-h,bw,h);});g.fillStyle='#8aa0b4';g.fillText('L'+(i+1),x+4,285);}});}
  else{rows+=row('DISTANCE',a.distance,b.distance,m=>u.dist(m));rows+=row('TIME',a.elapsed,b.elapsed,v=>fmtT(v).replace(/\.\d$/,''));rows+=row('AVG SPEED',a.avg,b.avg,sp,false,v=>Math.round(u.spd(v))+'');rows+=row('TOP SPEED',a.max,b.max,sp,false,v=>Math.round(u.spd(v))+'');}
  const th=x=>window.SlayShape?SlayShape.thumb(path(tab,x.r),110,72):'';
  box.hidden=false;box.innerHTML=`<div class="cmp-head"><div class="cmp-a"><img class="cmp-th" alt="" src="${th(A)}"><b>A · ${who(A)}</b><small>${new Date(a.date).toLocaleDateString()}</small></div><div class="cmp-b"><img class="cmp-th" alt="" src="${th(B)}"><b>B · ${who(B)}</b><small>${new Date(b.date).toLocaleDateString()}</small></div></div><table class="cmp-table"><thead><tr><th></th><th>A</th><th>B</th><th>A vs B</th></tr></thead><tbody>${rows}</tbody></table><div id="cmpChart"></div><p class="legal">Green means A is better. Times from GPS, about ±0.2 s (drag) or ±1 s (laps).</p>`;
  if(chart)q('cmpChart').appendChild(chart);}
function del(key){const t=key[0],i=+key.slice(1),k=KEYS[t],l=get(k);if(!confirm('Delete this record?'))return;l.splice(i,1);set(k,l);sel=sel.filter(s=>s!==key);
  ['dgHist','raceHistory','historyList'].forEach(()=>{});render();document.dispatchEvent(new Event('slayunits'));}
q('recTable').addEventListener('change',e=>{const c=e.target.closest('[data-k]');if(!c)return;const k=c.dataset.k;sel=sel.filter(s=>s!==k);if(c.checked)sel.push(k);if(sel.length>2)sel.shift();render();});
q('recTable').addEventListener('click',e=>{const d=e.target.closest('[data-del]');if(d){e.preventDefault();del(d.dataset.del);}});
document.querySelectorAll('[data-rt]').forEach(b=>b.onclick=()=>{tab=b.dataset.rt;sel=[];render();});
q('recImport').onclick=()=>{const v=q('recUrl').value.trim();if(!v)return;if(window.SlayShare.importUrl(v))q('recUrl').value='';else SlayToast('That does not look like a SLAY RACING result link.');};
document.addEventListener('slayfriends',render);document.addEventListener('slayunits',render);
new IntersectionObserver(e=>{if(e[0].isIntersecting)render();},{rootMargin:'200px'}).observe(q('recordsSection'));
render();
})();
