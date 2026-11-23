/* SLAY RACING share: GPX export, 9:16 story image, friend challenge / result links. */
(()=>{
const q=id=>document.getElementById(id),U=()=>window.SlayUnits;
const toast=window.SlayToast=m=>{let t=q('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t);}
  t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),3800);};
const b64=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=s=>JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))));
const name=()=>{let n=localStorage.getItem('slayMotoName');if(!n){n=(prompt('Your name (friends will see it):','')||'').trim().slice(0,20)||'Rider';try{localStorage.setItem('slayMotoName',n);}catch(e){}}return n;};
const fmt=ms=>{const s=ms/1000,m=Math.floor(s/60);return m+':'+(s%60).toFixed(1).padStart(4,'0');};
const dl=(n,b)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);};
/* ---------- data helpers ---------- */
function pts(type,r){
  if(type==='ride')return (r.points||[]).map(p=>({lat:p.lat,lng:p.lng,t:p.t?p.t*1000:null,v:p.v,ele:p.a}));
  if(type==='race')return (r.pts||[]).map(p=>({lat:p[0],lng:p[1],v:p[2],t:p[3]}));
  const t0=new Date(r.date).getTime()-(r.dur||0)*1000;return (r.pts||[]).filter(p=>p[3]).map(p=>({lat:p[3],lng:p[4],v:p[1],t:t0+p[0]*1000}));}
function gpx(type,r){const P=pts(type,r),n='SLAY RACING '+type+' '+new Date(r.date).toISOString().slice(0,16).replace('T',' ');
  const body=P.map(p=>`<trkpt lat="${p.lat}" lon="${p.lng}">${p.ele!=null?`<ele>${p.ele}</ele>`:''}${p.t?`<time>${new Date(p.t).toISOString()}</time>`:''}${p.v!=null?`<extensions><speed>${(p.v/3.6).toFixed(2)}</speed></extensions>`:''}</trkpt>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="SLAY RACING" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${n}</name><time>${new Date(r.date).toISOString()}</time></metadata><trk><name>${n}</name><trkseg>${body}</trkseg></trk></gpx>`;}
window.SlayShare={gpx,pts};
/* ---------- story 9:16 ---------- */
function story(type,r){const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),u=U();
  g.fillStyle='#05080d';g.fillRect(0,0,W,H);const gr=g.createRadialGradient(540,760,40,540,760,950);gr.addColorStop(0,'rgba(56,189,248,.24)');gr.addColorStop(1,'rgba(5,8,13,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);
  g.save();g.shadowColor='#38bdf8';g.shadowBlur=26;g.strokeStyle='#38bdf8';g.lineWidth=4;g.strokeRect(26,26,W-52,H-52);g.restore();
  if(typeof LOGO!=='undefined'&&LOGO.complete&&LOGO.naturalWidth&&!window.__noLogo){const h=110,w=h*LOGO.naturalWidth/LOGO.naturalHeight;g.drawImage(LOGO,(W-w)/2,90,w,h);}
  else{g.fillStyle='#fff';g.font='800 64px sans-serif';g.textAlign='center';g.fillText('SLAY RACING',W/2,170);g.textAlign='left';}
  let title,lab,val,sfx,P,cells;const sp=v=>Math.round(u.spd(v||0))+' '+u.sl();
  if(type==='ride'){title='RIDE RECORD';lab='DISTANCE';val=u.dv(r.distance).toFixed(2);sfx=u.du();P=(r.points||[]).map(p=>[p.lat,p.lng,p.v]);
    const e=r.elapsed||0,hh=Math.floor(e/3600000),mm=Math.floor(e%3600000/60000),ss=Math.floor(e%60000/1000);
    cells=[['TIME',String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0')],['AVG SPEED',sp(r.avg)],['TOP SPEED',sp(r.max)]];}
  else if(type==='race'){title=r.mode==='circuit'?'CIRCUIT RACE':'POINT TO POINT';const L=r.laps||[];lab=L.length?'BEST LAP':'TOTAL TIME';val=L.length?fmt(Math.min(...L)):fmt(r.total);sfx='';P=(r.pts||[]).map(p=>[p[0],p[1],p[2]]);
    cells=[['TOTAL TIME',fmt(r.total)],['LAPS',L.length||'—'],['DISTANCE',u.dist(r.dist)],['AVG SPEED',sp(r.avg)],['TOP SPEED',sp(r.max)]];}
  else{title='DRAG RECORD';const lb=r.lb||['0–50 km/h','0–100 km/h','0–150 km/h','0–200 km/h','100 m','1/8 mile','1/4 mile'];lab=lb[1].toUpperCase();val=r.sp[1]?r.sp[1][0].toFixed(2):'—';sfx=r.sp[1]?'s':'';
    P=(r.pts||[]).filter(p=>p[3]).map(p=>[p[3],p[4],p[1]]);const mph=r.u==='mph';
    cells=[0,2,3,5,6].filter(i=>r.sp[i]).slice(0,5).map(i=>[lb[i].toUpperCase(),r.sp[i][0].toFixed(2)+' s']);cells.push(['TOP SPEED',Math.round(mph?r.vmax/1.609344:r.vmax)+(mph?' mph':' km/h')]);}
  g.fillStyle='#38bdf8';g.font='700 34px sans-serif';g.textAlign='center';g.fillText(title,W/2,290);
  g.fillStyle='#8aa0b4';g.font='28px sans-serif';g.fillText(lab,W/2,370);
  g.fillStyle='#fff';g.font='italic 800 200px sans-serif';const vw=g.measureText(val).width;g.fillText(val,W/2-(sfx?30:0),560);
  if(sfx){g.fillStyle='#38bdf8';g.font='700 56px sans-serif';g.textAlign='left';g.fillText(sfx,W/2-30+vw/2+18,560);g.textAlign='center';}
  if(window.SlayShape&&P.length>1){const m=SlayShape.draw(g,P,80,640,920,640,{lw:12});if(m){[[P[0],'#4fd18b'],[P[P.length-1],'#e5554f']].forEach(([p,cl])=>{g.beginPath();g.arc(m.X(p),m.Y(p),16,0,7);g.fillStyle=cl;g.fill();g.lineWidth=5;g.strokeStyle='#05080d';g.stroke();});}}
  g.textAlign='left';cells.slice(0,6).forEach(([l,v],i)=>{const x=90+(i%3)*330,y=1360+Math.floor(i/3)*150;g.fillStyle='#8aa0b4';g.font='24px sans-serif';g.fillText(l,x,y);g.fillStyle='#fff';g.font='700 46px sans-serif';g.fillText(v,x,y+58);});
  g.textAlign='center';g.fillStyle='#8aa0b4';g.font='26px sans-serif';g.fillText(new Date(r.date).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}),W/2,1800);
  g.fillStyle='#38bdf8';g.font='700 30px sans-serif';g.fillText('#SLAYRACING  ·  '+(location.host||'slayracing'),W/2,1850);return c;}
window.SlayShare.story=story;
async function shareStory(){const X=window.__rec;if(!X)return;let c;try{c=story(X.type,X.rec);c.toDataURL();}catch(e){window.__noLogo=1;c=story(X.type,X.rec);}
  c.toBlob(async b=>{const f=new File([b],'slay-racing-story.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'SLAY RACING',text:'#SLAYRACING'});return;}catch(e){if(e&&e.name==='AbortError')return;}}
    dl('slay-racing-story.png',b);toast('Story image saved — post it from your gallery.');},'image/png');}
function exportGpx(){const X=window.__rec;if(!X)return;if(!pts(X.type,X.rec).length){toast('This record has no GPS track to export.');return;}
  dl('slay-racing-'+X.type+'-'+new Date(X.rec.date).toISOString().slice(0,10)+'.gpx',new Blob([gpx(X.type,X.rec)],{type:'application/gpx+xml'}));toast('GPX file saved.');}
/* ---------- friend links ---------- */
const base=()=>location.origin+location.pathname;
async function send(url,title,text){if(navigator.share){try{await navigator.share({title,text,url});return;}catch(e){if(e&&e.name==='AbortError')return;}}
  try{await navigator.clipboard.writeText(url);toast('Link copied — send it to your friend.');}catch(e){prompt('Copy this link and send it:',url);}}
function challenge(){const X=window.__slayRace;if(!X||!X.R.A){toast('Set your start point first (Race section).');return;}const R=X.R;
  if(R.mode==='p2p'&&!R.B){toast('Set the finish point too.');return;}
  const o={k:'c',m:R.mode,A:R.A.map(v=>+v.toFixed(5)),B:R.B?R.B.map(v=>+v.toFixed(5)):null,n:R.nA||'',by:name()};
  send(base()+'#c='+b64(o),'SLAY RACING challenge',o.by+' challenges you to beat their time on this course.');}
function resultLink(){const X=window.__rec;if(!X||X.type!=='race')return;const r=X.rec,k=Math.max(1,Math.ceil((r.pts||[]).length/40));
  const o={k:'r',by:name(),m:r.mode,tt:r.total,lp:r.laps||[],d:Math.round(r.dist),av:+r.avg.toFixed(1),mx:+r.max.toFixed(1),dt:r.date,pa:(r.pts||[]).filter((_,i)=>i%k===0).map(p=>[+p[0].toFixed(5),+p[1].toFixed(5)])};
  send(base()+'#r='+b64(o),'SLAY RACING result',o.by+' finished in '+fmt(r.total)+(o.lp.length?' · best lap '+fmt(Math.min(...o.lp)):'')+'. Can you beat it?');}
function importResult(o){let l=JSON.parse(localStorage.getItem('slayMotoFriends')||'[]');if(l.some(x=>x.dt===o.dt&&x.by===o.by))return false;l.unshift(o);l=l.slice(0,30);try{localStorage.setItem('slayMotoFriends',JSON.stringify(l));}catch(e){}document.dispatchEvent(new Event('slayfriends'));return true;}
function fromHash(h){try{if(h.startsWith('#c=')){const o=unb64(h.slice(3));if(o.k!=='c')return false;const X=window.__slayRace;
    document.querySelector('[data-mode="'+(o.m==='p2p'?'p2p':'circuit')+'"]').click();X.setPt('A',o.A);if(o.m==='p2p'&&o.B)X.setPt('B',o.B);
    toast('Challenge from '+(o.by||'a friend')+' loaded — go to the start line and press START RACE.');setTimeout(()=>q('raceSection').scrollIntoView({behavior:'smooth'}),400);return true;}
    if(h.startsWith('#r=')){const o=unb64(h.slice(3));if(o.k!=='r')return false;const added=importResult(o);toast(added?'Result from '+o.by+' saved — compare it in Records.':'That result is already saved.');setTimeout(()=>{const s=q('recordsSection');s&&s.scrollIntoView({behavior:'smooth'});},400);return true;}}catch(e){toast('That link could not be read.');}return false;}
window.SlayShare.fromHash=fromHash;window.SlayShare.importUrl=u=>{const i=u.indexOf('#');return i>=0&&fromHash(u.slice(i));};
if(location.hash.startsWith('#c=')||location.hash.startsWith('#r=')){const h=location.hash;setTimeout(()=>{fromHash(h);history.replaceState(null,'',location.pathname+location.search);},600);}
/* ---------- wiring ---------- */
q('shStory').onclick=shareStory;q('shGpx').onclick=exportGpx;q('shLink').onclick=resultLink;q('rcChallenge').onclick=challenge;
new MutationObserver(()=>{const m=q('imgModal');if(!m.hidden){const t=window.__rec&&window.__rec.type;q('shLink').hidden=t!=='race';}}).observe(q('imgModal'),{attributes:true,attributeFilter:['hidden']});
})();
