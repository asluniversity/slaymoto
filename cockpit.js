/* SLAY MOTO ride cockpit: one-screen dashboard (speed dial, alerts, trip stats, controls) for a phone on the handlebar. km/h or mph. */
(()=>{
const q=id=>document.getElementById(id),D=Math.PI/180,cx=150,cy=150,r=118;
const pt=(a,rr)=>[cx+rr*Math.sin(a*D),cy-rr*Math.cos(a*D)],f=n=>n.toFixed(1);
const C={g:'#38bdf8',y:'#e7d25b',o:'#e58b52',r:'#e5554f'};
let MAX=280,MI=10,LS=40,disp=0,arcCol=C.g,tgt=null,lastN='',lastA=-999;
const ang=v=>Math.max(0,Math.min(MAX,v))*240/MAX-120;
function build(){const m=SlayUnits.isMph();MAX=m?180:280;MI=m?5:10;LS=m?20:40;const A=pt(-120,r),B=pt(120,r);
  let s=`<svg viewBox="22 16 256 212" role="img" aria-label="Speedometer"><path d="M${f(A[0])} ${f(A[1])}A${r} ${r} 0 1 1 ${f(B[0])} ${f(B[1])}" stroke="#222a31" stroke-width="10" fill="none"/><path id="ckArc" d="" stroke="${arcCol}" stroke-width="10" fill="none"/>`;
  for(let v=0;v<=MAX;v+=MI){const mj=v%(MI*2)===0,a=ang(v),P=pt(a,r-10),Q=pt(a,r-10-(mj?14:7));s+=`<line x1="${f(P[0])}" y1="${f(P[1])}" x2="${f(Q[0])}" y2="${f(Q[1])}" stroke="${mj?'#fff':'#6b7782'}" stroke-width="${mj?2:1}"/>`;}
  for(let v=0;v<=MAX;v+=LS){const T=pt(ang(v),r-38);s+=`<text x="${f(T[0])}" y="${f(T[1]+4)}" fill="#d5dbe0" font-size="13" text-anchor="middle" font-family="sans-serif">${v}</text>`;}
  return s+`<g id="ckTgtG" transform="rotate(-120 150 150)" style="opacity:0"><path d="M150 28L143 15h14z" fill="#fff"/></g><g id="ckNeedle" transform="rotate(-120 150 150)" style="filter:drop-shadow(0 0 5px rgba(255,255,255,.7))"><path d="M146 150L150 46l4 104z" fill="#fff"/></g><circle cx="150" cy="150" r="11" fill="#000" stroke="#fff" stroke-width="4"/><text id="ckNum" x="150" y="204" text-anchor="middle" font-size="50" font-weight="800" font-style="italic" fill="#fff" font-family="sans-serif">0</text><text id="ckUnit" x="150" y="221" text-anchor="middle" font-size="10" letter-spacing="3" fill="#9aa7b2" font-family="sans-serif">${SlayUnits.sl().toUpperCase()}</text></svg>`;}
function mount(){q('ckDial').innerHTML=build();lastN='';lastA=-999;}
mount();
function draw(v){const a=ang(v),A=pt(-120,r),B=pt(a,r),ar=Math.round(a*10)/10,n=String(Math.round(v));
  if(ar!==lastA){lastA=ar;q('ckNeedle').setAttribute('transform',`rotate(${a.toFixed(2)} 150 150)`);
    q('ckArc').setAttribute('d',a<-119?'':`M${f(A[0])} ${f(A[1])}A${r} ${r} 0 ${a+120>180?1:0} 1 ${f(B[0])} ${f(B[1])}`);}
  if(n!==lastN){lastN=n;q('ckNum').textContent=n;}}
function fmt(ms){const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
setInterval(()=>{const v=SlayUnits.spd(state.currentSpeed==null?0:state.currentSpeed);disp+=(v-disp)*.35;if(Math.abs(v-disp)<.2)disp=v;draw(disp);
  q('ckArc').setAttribute('stroke',arcCol);
  const g=q('ckTgtG');if(tgt){g.setAttribute('transform',`rotate(${ang(SlayUnits.spd(tgt)).toFixed(1)} 150 150)`);g.style.opacity=1;}else g.style.opacity=0;},60);
function stats(){const ms=elapsedMs(),d=state.distance||0;
  if(!Guide.hasRoute()){tgt=null;arcCol=C.g;}
  q('ckDist').textContent=SlayUnits.dv(d).toFixed(2);q('ckTime').textContent=fmt(ms);
  q('ckAvg').textContent=ms>2000&&d>0?Math.round(SlayUnits.spd(d/1000/(ms/3600000))):'—';q('ckMax').textContent=state.maxSpeed?Math.round(SlayUnits.spd(state.maxSpeed)):'—';
  q('ckState').textContent=q('rideState').textContent.trim()||'READY';
  q('ckGps').textContent=state.lastFix&&state.lastFix.accuracy!=null?'GPS ± '+SlayUnits.sm(state.lastFix.accuracy):'GPS —';
  q('ckTgtLbl').textContent=tgt?'TARGET '+Math.round(SlayUnits.spd(tgt)/5)*5+' '+SlayUnits.sl().toUpperCase():'';
  q('cockpit').classList.toggle('live',!!state.startedAt&&!state.paused);}
setInterval(stats,250);stats();
q('ckPlan').onclick=()=>q('planBtn').click();
document.addEventListener('slayunits',()=>{mount();stats();});
Guide.onInfo(i=>{if(i.off){arcCol=C.o;tgt=null;return;}arcCol=C[i.l]||C.g;tgt=i.allowed||null;});
})();
