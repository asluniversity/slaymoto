/* SLAY RACING drag: GPS-timed 0-100 km/h, splits, 1/8 and 1/4 mile. Closed courses only. */
(()=>{
const q=id=>document.getElementById(id),D=Math.PI/180;
const hav=(a,b)=>{const x=Math.sin((b[0]-a[0])*D/2)**2+Math.cos(a[0]*D)*Math.cos(b[0]*D)*Math.sin((b[1]-a[1])*D/2)**2;return 12742000*Math.asin(Math.sqrt(x));};
const KMLB=['0–50 km/h','0–100 km/h','0–150 km/h','0–200 km/h','100 m','1/8 mile','1/4 mile'],SPL=[];
function mkSpl(){const mph=SlayUnits.isMph(),K=1.609344;SPL.length=0;(mph?[30,60,100,130]:[50,100,150,200]).forEach(v=>SPL.push(['0–'+v+' '+(mph?'mph':'km/h'),'v',v*(mph?K:1)]));
  SPL.push(mph?['60 ft','d',18.288]:['100 m','d',100],['1/8 mile','d',201.17],['1/4 mile','d',402.34]);}
mkSpl();
let MODE=localStorage.getItem('slayMotoDragMode')==='cd'?'cd':'auto';const STILL=3,S={goT:0,st:'idle',smp:[],pts:[],sp:[],t0:0,last:null,pl:null,still:0,vmax:0,acc:0,fz:false,tk:[]};
const cx=150,cy=150,r=118,pt=(a,rr)=>[cx+rr*Math.sin(a*D),cy-rr*Math.cos(a*D)],f=n=>n.toFixed(1);
function tbl(){q('dgTable').innerHTML=SPL.map((s,i)=>`<div class="dg-row" id="dgr${i}"><span>${s[0]}</span><b id="dgt${i}">—</b><em id="dgx${i}">—</em></div>`).join('');}tbl();
let DM=240,MI=10,LS=40;function cfg(){const m=SlayUnits.isMph();DM=m?150:240;MI=m?5:10;LS=m?20:40;}const dang=v=>Math.max(0,Math.min(DM,v))*240/DM-120;
function dial(){cfg();const A=pt(-120,r),B=pt(120,r);
  let s=`<svg viewBox="22 22 256 212" role="img" aria-label="Speedometer"><path d="M${f(A[0])} ${f(A[1])}A${r} ${r} 0 1 1 ${f(B[0])} ${f(B[1])}" stroke="#222a31" stroke-width="10" fill="none"/><path id="dgArc" d="" stroke="#38bdf8" stroke-width="10" fill="none" style="filter:drop-shadow(0 0 6px #38bdf8)"/>`;
  for(let v=0;v<=DM;v+=MI){const m=v%(MI*2)===0,P=pt(dang(v),r-10),Q=pt(dang(v),r-10-(m?14:7));s+=`<line x1="${f(P[0])}" y1="${f(P[1])}" x2="${f(Q[0])}" y2="${f(Q[1])}" stroke="${m?'#fff':'#6b7782'}" stroke-width="${m?2:1}"/>`;}
  for(let v=0;v<=DM;v+=LS){const T=pt(dang(v),r-38);s+=`<text x="${f(T[0])}" y="${f(T[1]+4)}" fill="#d5dbe0" font-size="13" text-anchor="middle" font-family="sans-serif">${v}</text>`;}
  return s+`<g id="dgNeedle" transform="rotate(-120 150 150)" style="filter:drop-shadow(0 0 5px rgba(255,255,255,.7))"><path d="M146 150L150 46l4 104z" fill="#fff"/></g><circle cx="150" cy="150" r="11" fill="#000" stroke="#fff" stroke-width="4"/><text id="dgNum" x="150" y="206" text-anchor="middle" font-size="46" font-weight="800" font-style="italic" fill="#fff" font-family="sans-serif">0</text><text id="dgUnit" x="150" y="224" text-anchor="middle" font-size="11" letter-spacing="3" fill="#9aa7b2" font-family="sans-serif">KM/H</text></svg>`;}
q('dgDial').innerHTML=dial();q('dgUnit').textContent=SlayUnits.sl().toUpperCase();
function setV(v){const d=SlayUnits.spd(v),a=dang(d),A=pt(-120,r),B=pt(a,r);q('dgNeedle').setAttribute('transform',`rotate(${a} 150 150)`);
  q('dgArc').setAttribute('d',a<-119?'':`M${f(A[0])} ${f(A[1])}A${r} ${r} 0 ${a+120>180?1:0} 1 ${f(B[0])} ${f(B[1])}`);q('dgNum').textContent=d>=100?Math.round(d):d.toFixed(1);}
function applyUnits(){if(S.st==='run'||S.st==='cd')return;mkSpl();tbl();q('dgDial').innerHTML=dial();q('dgUnit').textContent=SlayUnits.sl().toUpperCase();setV(S.last?S.last.v:0);hist();}
document.addEventListener('slayunits',applyUnits);
function status(t,go){const e=q('dgStatus');e.textContent=t;e.classList.toggle('go',!!go);}
function clear(){SPL.forEach((_,i)=>{q('dgr'+i).classList.remove('hit');q('dgt'+i).textContent='—';q('dgx'+i).textContent='—';});}
function setMode(m){MODE=m;try{localStorage.setItem('slayMotoDragMode',m);}catch(e){}
  document.querySelectorAll('#dgMode [data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
  q('dgHint').textContent=m==='cd'?'When READY, tap START COUNTDOWN. You hear 3 · 2 · 1 · GO, then you move. Moving early is a false start.':'The timer starts by itself the moment GPS sees you move.';}
function beep(f,ms){try{const A=S.ac||(S.ac=new(window.AudioContext||window.webkitAudioContext)()),o=A.createOscillator(),g=A.createGain();o.frequency.value=f;g.gain.value=.25;o.connect(g);g.connect(A.destination);o.start();o.stop(A.currentTime+ms/1000);}catch(e){}if(navigator.vibrate)navigator.vibrate(ms>200?300:60);}
function ready(){if(MODE==='cd'){status('READY — TAP START COUNTDOWN',1);q('dgArm').disabled=false;q('dgArm').textContent='START COUNTDOWN';}else status('READY — GO!',1);}
function countdown(){if(S.st!=='ready'||S.goT)return;S.st='cd';q('dgArm').disabled=true;let n=3;q('dgLbl').textContent='GET READY';
  const step=()=>{if(S.st!=='cd')return;
    if(n>0){q('dgTime').textContent=n;status('COUNTDOWN — STAY STILL',1);beep(520,120);n--;S.ct=setTimeout(step,1000);}
    else{S.goT=Date.now();S.st='ready';q('dgTime').textContent='GO!';q('dgLbl').textContent='GO';status('GO! — MOVE NOW',1);beep(980,450);
      S.gw=setTimeout(()=>{if(S.st==='ready'&&S.goT){S.goT=0;q('dgTime').textContent='0.00';q('dgLbl').textContent='TIME';status('NO LAUNCH DETECTED');ready();}},12000);}};step();}
function falseStart(){clearTimeout(S.ct);S.st='ready';S.goT=0;q('dgTime').textContent='0.00';q('dgLbl').textContent='FALSE START';beep(200,500);ready();status('FALSE START — HOLD STILL AND TRY AGAIN');}
function arm(){if(S.st==='ready'&&MODE==='cd'){countdown();return;}if(['arming','ready','run','cd'].includes(S.st))return;
  Object.assign(S,{goT:0,st:'arming',smp:[],pts:[],sp:[],t0:0,last:null,pl:null,still:0,vmax:0,acc:0,fz:false,tk:[]});clear();
  S.wid=navigator.geolocation.watchPosition(onFix,e=>status('GPS: '+e.message),{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  S.iv=setInterval(tick,50);S.seen=0;S.hb=setInterval(heartbeat,1500);S.wd=setTimeout(()=>{if(!S.seen)status('NO GPS FIX — ALLOW LOCATION & GO OUTDOORS');},7000);lockScreen();status('WAITING FOR GPS LOCK…');q('dgArm').disabled=true;q('dgReset').disabled=false;q('dgLbl').textContent='TIME';q('dgTime').textContent='0.00';}
function heartbeat(){if((S.st==='arming'||S.st==='ready')&&Date.now()-(S.seen||0)>2500)navigator.geolocation.getCurrentPosition(onFix,()=>{},{enableHighAccuracy:true,maximumAge:0,timeout:5000});}
function stop(){clearTimeout(S.ct);clearTimeout(S.gw);navigator.geolocation.clearWatch(S.wid);clearInterval(S.iv);clearInterval(S.hb);clearTimeout(S.wd);releaseLock();}
function reset(){if(S.st==='run'){finish();return;}stop();S.st='idle';S.goT=0;trace();clear();status('PRESS ARM, THEN STAND STILL');q('dgArm').disabled=false;q('dgArm').textContent='ARM';q('dgReset').disabled=true;q('dgReset').textContent='RESET';setV(0);q('dgTime').textContent='0.00';q('dgLbl').textContent='TIME';}
function tick(){const n=Date.now();
  if(S.st==='run'&&S.last&&n-S.last.t>5000){finish();return;}
  if(S.st==='run'&&!S.fz)q('dgTime').textContent=((n-S.t0)/1000).toFixed(2);
  if(S.last&&S.st!=='done')setV(Math.max(0,S.last.v+(S.st==='run'?S.acc:0)*Math.min(1500,n-S.last.t)));}
function onFix(pos){const c=pos.coords,t=pos.timestamp,ll=[c.latitude,c.longitude];S.seen=Date.now();
  q('dgAcc').textContent='± '+SlayUnits.sm(c.accuracy);q('dgGps').textContent=c.accuracy<=8?'GPS STRONG':c.accuracy<=20?'GPS OK':'GPS WEAK';
  if(c.accuracy>50){if(S.st==='arming')status('GPS TOO WEAK (± '+Math.round(c.accuracy)+' m) — MOVE OUTDOORS');S.pl={ll,t};return;}
  let v=c.speed!=null&&c.speed>=0?c.speed*3.6:null;
  if(v==null&&S.pl&&t>S.pl.t){const d=hav(S.pl.ll,ll);v=d<Math.max(4,c.accuracy)?0:d/((t-S.pl.t)/1000)*3.6;}
  S.pl={ll,t};if(v==null)v=0;if(S.last&&t<=S.last.t)return;
  S.tk.push(t);if(S.tk.length>6)S.tk.shift();
  q('dgAcc').textContent='± '+SlayUnits.sm(c.accuracy);q('dgGps').textContent=c.accuracy<=8?'GPS STRONG':c.accuracy<=20?'GPS OK':'GPS WEAK';
  if(S.tk.length>1)q('dgHz').textContent=((S.tk.length-1)*1000/(S.tk[S.tk.length-1]-S.tk[0])).toFixed(1)+' Hz';
  const p={t,v,ll};
  if(S.st==='arming'){if(v<STILL){if(++S.still>=2){S.st='ready';ready();}else status('HOLD STILL…');}else{S.still=0;status('STAND STILL TO ARM…');}}
  else if(S.st==='cd'){if(v>=STILL)falseStart();}
  else if(S.st==='ready'&&v>=STILL&&MODE==='cd'&&!S.goT){S.st='arming';S.still=0;q('dgArm').disabled=true;q('dgArm').textContent='ARM';status('STAND STILL TO ARM…');}
  else if(S.st==='ready'&&v>=STILL){clearTimeout(S.gw);launch(p);S.last=p;return;}
  else if(S.st==='run'){run(p);if(S.st==='run')S.last=p;return;}
  S.last=p;setV(v);}
function launch(p){const L=S.last||{t:p.t-1000,v:0};S.smp=[L,p];S.st='run';S.vmax=p.v;S.vmT=p.t;S.acc=0;q('dgReset').disabled=false;q('dgReset').textContent='STOP & SAVE';status('GO!',1);q('dgLbl').textContent='TIME';rebuild();show();}
function rebuild(){const m=S.smp,P0=m[0],P1=m[1];let t0=(P0.t+P1.t)/2;
  if(m.length>2){const a=(m[2].v-P1.v)/(m[2].t-P1.t);if(a>0)t0=P1.t-P1.v/a;}
  t0=Math.min(P1.t,Math.max(P0.t,t0));S.t0=t0;const pts=[{t:t0,v:0,d:0,ll:P0.ll||P1.ll}];
  m.slice(1).forEach(p=>{const L=pts[pts.length-1];pts.push({t:p.t,v:p.v,ll:p.ll,d:L.d+(L.v+p.v)/2/3.6*(p.t-L.t)/1000});});S.pts=pts;}
function splits(){const p=S.pts;return SPL.map(([,k,T])=>{for(let i=1;i<p.length;i++){const A=p[i-1],B=p[i],a=k==='v'?A.v:A.d,b=k==='v'?B.v:B.d;
  if(a<T&&b>=T){const fr=(T-a)/(b-a);return{t:A.t+fr*(B.t-A.t)-S.t0,x:k==='v'?A.d+fr*(B.d-A.d):A.v+fr*(B.v-A.v)};}}return null;});}
function trace(){const c=q('dgTrack');if(!c||!window.SlayShape)return;const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);
  SlayShape.draw(g,S.pts.filter(p=>p.ll).map(p=>[p.ll[0],p.ll[1],p.v]),18,14,c.width-36,c.height-28,{lw:7});}
function show(){trace();const sp=S.sp=splits();sp.forEach((s,i)=>{if(!s)return;q('dgr'+i).classList.add('hit');q('dgt'+i).textContent=(s.t/1000).toFixed(2)+' s';q('dgx'+i).textContent=(SPL[i][1]==='v'?SlayUnits.sm(s.x):Math.round(SlayUnits.spd(s.x))+' '+SlayUnits.sl());});
  if(sp[1]&&!S.fz){S.fz=true;q('dgTime').textContent=(sp[1].t/1000).toFixed(2);q('dgLbl').textContent=SPL[1][0].toUpperCase();}}
function run(p){S.smp.push(p);rebuild();const m=S.pts,L=m[m.length-1],B=m[m.length-2];if(p.v>S.vmax+0.5)S.vmT=p.t;S.vmax=Math.max(S.vmax,p.v);S.acc=(p.v-B.v)/(p.t-B.t);
  if(S.smp.length<=4&&p.v<STILL){S.smp=[];S.st='ready';S.acc=0;ready();return;}
  show();if(L.d>=420||p.v>=240||(S.vmax>20&&p.v<S.vmax-8)||(S.vmax>20&&L.t-S.t0>4000&&p.t-S.vmT>4000)||L.t-S.t0>60000)finish();}
function finish(){if(S.st!=='run')return;S.st='done';stop();show();const L=S.pts[S.pts.length-1];
  if(!S.fz)q('dgTime').textContent=((L.t-S.t0)/1000).toFixed(2);
  setV(S.vmax);
  const rec={date:Date.now(),veh:q('dgVeh').value,u:SlayUnits.get(),lb:SPL.map(s=>s[0]),sp:S.sp.map(s=>s&&[+(s.t/1000).toFixed(3),+s.x.toFixed(1)]),vmax:S.vmax,dur:(L.t-S.t0)/1000,mode:S.goT?'cd':'auto',rt:S.goT?+Math.max(0,(S.t0-S.goT)/1000).toFixed(2):null,pts:S.pts.map(p=>[+((p.t-S.t0)/1000).toFixed(2),+p.v.toFixed(1),Math.round(p.d),p.ll?+p.ll[0].toFixed(6):0,p.ll?+p.ll[1].toFixed(6):0])};
  let l=JSON.parse(localStorage.getItem('slayMotoDrag')||'[]');l.unshift(rec);l=l.slice(0,10);
  for(;;){try{localStorage.setItem('slayMotoDrag',JSON.stringify(l));break;}catch(e){if(l.length<=1)break;l.pop();}}
  status('FINISHED — '+(S.sp[1]?SPL[1][0].toUpperCase()+' IN '+(S.sp[1].t/1000).toFixed(2)+' S':'TOP '+Math.round(SlayUnits.spd(S.vmax))+' '+SlayUnits.sl().toUpperCase()));
  q('dgArm').disabled=false;q('dgArm').textContent='ARM AGAIN';q('dgReset').disabled=false;q('dgReset').textContent='RESET';hist();showImg(rec);}
function path(r){return (r.pts||[]).filter(p=>p[3]).map(p=>[p[3],p[4],p[1]]);}
function hist(){const l=JSON.parse(localStorage.getItem('slayMotoDrag')||'[]');
  q('dgHist').innerHTML=l.map((r,i)=>`<div class="rh" data-i="${i}" tabindex="0">${window.SlayShape?`<img class="rh-th" alt="" src="${SlayShape.thumb(path(r))}">`:''}<div class="rh-m"><b>${r.sp[1]?r.sp[1][0].toFixed(2)+' s · '+((r.lb&&r.lb[1])||'0–100 km/h'):'top '+Math.round(SlayUnits.spd(r.vmax))+' '+SlayUnits.sl()}</b><span>${r.sp[6]?'1/4 mi '+r.sp[6][0].toFixed(2)+' s · ':''}${r.veh} · ${new Date(r.date).toLocaleDateString()}</span></div></div>`).join('');}
function img(r){const W=1080,H=1900,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  g.fillStyle='#05080d';g.fillRect(0,0,W,H);g.fillStyle='#38bdf8';g.font='700 40px sans-serif';g.fillText('SLAY RACING · DRAG RECORD',60,90);
  if(!window.__noLogo&&typeof LOGO!=='undefined'&&LOGO.complete&&LOGO.naturalWidth){const lw=72*LOGO.naturalWidth/LOGO.naturalHeight;g.drawImage(LOGO,W-60-lw,40,lw,72);}
  g.fillStyle='#8aa0b4';g.font='24px sans-serif';g.fillText(new Date(r.date).toLocaleString()+'  ·  '+r.veh.toUpperCase(),60,130);
  g.font='26px sans-serif';g.fillText(((r.lb&&r.lb[1])||'0–100 km/h').toUpperCase(),60,230);g.fillStyle='#fff';g.font='italic 800 170px sans-serif';const tx=r.sp[1]?r.sp[1][0].toFixed(2):'—';g.fillText(tx,60,390);
  const w=g.measureText(tx).width;g.fillStyle='#38bdf8';g.font='700 44px sans-serif';g.fillText(r.sp[1]?'s':'not reached',60+w+16,390);
  const mph=r.u==='mph',cv=v=>mph?v/1.609344:v,cells=SPL.map((s,i)=>[(r.lb&&r.lb[i])||KMLB[i],r.sp[i]?r.sp[i][0].toFixed(2)+' s  ·  '+(s[1]==='v'?(mph?Math.round(r.sp[i][1]*3.28084)+' ft':Math.round(r.sp[i][1])+' m'):Math.round(cv(r.sp[i][1]))+(mph?' mph':' km/h')):'—',!!r.sp[i]]);
  cells.push(['START',r.mode==='cd'?'3-2-1'+(r.rt!=null?'  ·  reaction ≈ '+r.rt.toFixed(2)+' s':''):'AUTO (GPS)',true]);
  cells.forEach(([l,v,ok],i)=>{const x=60+(i%2)*500,y=470+Math.floor(i/2)*92;g.fillStyle='#8aa0b4';g.font='20px sans-serif';g.fillText(l,x,y);g.fillStyle=ok?'#fff':'#4b555e';g.font='700 34px sans-serif';g.fillText(v,x,y+40);});
  g.fillStyle='#8aa0b4';g.font='20px sans-serif';g.fillText('YOUR PATH',60,880);
  const P=r.pts,pp=path(r);
  if(window.SlayShape&&pp.length>1){const m=SlayShape.draw(g,pp,60,910,960,330,{lw:10});
    if(m){const dot=(p,col)=>{g.beginPath();g.arc(m.X(p),m.Y(p),14,0,7);g.fillStyle=col;g.fill();g.lineWidth=4;g.strokeStyle='#05080d';g.stroke();};dot(pp[0],'#4fd18b');dot(pp[pp.length-1],'#e5554f');
      g.font='20px sans-serif';g.fillStyle='#fff';[[mph?18.288:100,mph?'60 ft':'100 m'],[201.17,'1/8 mi'],[402.34,'1/4 mi']].forEach(([d,lb])=>{const i=P.findIndex(x=>x[2]>=d);if(i>0&&P[i][3]){const p=[P[i][3],P[i][4]];g.beginPath();g.arc(m.X(p),m.Y(p),8,0,7);g.fillStyle='#fff';g.fill();g.fillText(lb,m.X(p)+12,m.Y(p)-12);}});}}
  const st=mph?25:50,T=r.dur||1,Vm=Math.max(mph?60:100,Math.ceil(cv(r.vmax)/st)*st),X=t=>60+t/T*960,Y=v=>1730-cv(v)/Vm*350,Yd=v=>1730-v/Vm*350;
  g.fillStyle='#8aa0b4';g.font='20px sans-serif';g.fillText('SPEED OVER TIME',60,1310);g.lineWidth=1;g.strokeStyle='rgba(138,160,180,.25)';
  for(let v=0;v<=Vm;v+=st){g.beginPath();g.moveTo(60,Yd(v));g.lineTo(1020,Yd(v));g.stroke();g.fillText(v,64,Yd(v)-6);}
  g.beginPath();P.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.lineWidth=5;g.strokeStyle='#38bdf8';g.stroke();
  if(r.sp[1]){g.setLineDash([8,8]);g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.moveTo(X(r.sp[1][0]),Yd(0));g.lineTo(X(r.sp[1][0]),Yd(Vm));g.stroke();g.setLineDash([]);}
  g.fillStyle='#8aa0b4';g.fillText('0 s',60,1760);g.textAlign='right';g.fillText(T.toFixed(1)+' s',1020,1760);g.textAlign='left';
  g.fillText('TOP SPEED '+Math.round(cv(r.vmax))+(mph?' MPH':' KM/H')+'  ·  GPS-TIMED, ABOUT ±0.2 S',60,1840);return c;}
function showImg(r){if(!r)return;window.__rec={type:'drag',rec:r};let u;try{u=img(r).toDataURL('image/png');}catch(e){window.__noLogo=1;u=img(r).toDataURL('image/png');}q('rideImg').src=u;q('dlImg').href=u;q('dlImg').download='slay-racing-drag.png';q('imgModal').hidden=false;}
q('dgHist').onclick=e=>{const d=e.target.closest('.rh');if(d)showImg(JSON.parse(localStorage.getItem('slayMotoDrag')||'[]')[d.dataset.i]);};
q('dgArm').onclick=arm;q('dgReset').onclick=reset;document.querySelectorAll('#dgMode [data-m]').forEach(b=>b.onclick=()=>{if(['arming','ready','run','cd'].includes(S.st))return;setMode(b.dataset.m);});setMode(MODE);hist();setV(0);
window.__slayDrag={fix:onFix,S,setMode,countdown};
})();
