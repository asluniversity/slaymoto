/* SLAY MOTO guidance: route geometry -> advisory speed profile, shown live as green/yellow/orange/red.
   Advisory only: derived from route curvature, not from road surface, traffic, weather or legal limits. */
const Guide=(()=>{
const P={calm:{lat:2.4,brake:2.2,cap:80},normal:{lat:3.0,brake:2.8,cap:100},sport:{lat:3.6,brake:3.4,cap:120}};
const STEP=8,R=6371000,rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
const COL={g:'#4fd18b',y:'#e7d25b',o:'#e58b52',r:'#e5554f'};
let prof='normal',voice=true,o=null,pts=[],rs=[],raw=[],lim=[],idx=0,last='g',lastSay=0;
const $=id=>document.getElementById(id);
const xy=(lat,lng)=>({x:rad(lng-o.lng)*R*Math.cos(rad(o.lat)),y:rad(lat-o.lat)*R});
function build(){const p=P[prof],n=pts.length;
  raw=rs.map(r=>Math.max(4,Math.min(p.cap/3.6,Math.sqrt(p.lat*r))));
  lim=raw.slice();for(let i=n-2;i>=0;i--)lim[i]=Math.min(lim[i],Math.sqrt(lim[i+1]**2+2*p.brake*STEP));}
function load(coords){
  o={lat:coords[0][0],lng:coords[0][1]};
  const q=coords.map(c=>xy(c[0],c[1]));pts=[];let carry=0,a=q[0];pts.push({x:a.x,y:a.y});
  for(let i=1;i<q.length;i++){const b=q[i],d=Math.hypot(b.x-a.x,b.y-a.y);if(!d)continue;
    let pos=STEP-carry;while(pos<=d){const t=pos/d;pts.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});pos+=STEP;}
    carry=d-(pos-STEP);a=b;}
  const n=pts.length,K=3;
  pts.forEach(p=>{p.lat=o.lat+deg(p.y/R);p.lng=o.lng+deg(p.x/(R*Math.cos(rad(o.lat))));});
  const rr=pts.map((p,i)=>{if(i<K||i>=n-K)return Infinity;const A=pts[i-K],C=pts[i+K];
    const a=Math.hypot(p.x-A.x,p.y-A.y),b=Math.hypot(C.x-p.x,C.y-p.y),c=Math.hypot(C.x-A.x,C.y-A.y);
    const ar=Math.abs((p.x-A.x)*(C.y-A.y)-(C.x-A.x)*(p.y-A.y))/2;return ar<1e-6?Infinity:a*b*c/(4*ar);});
  rs=rr.map((_,i)=>Math.min(...rr.slice(Math.max(0,i-2),i+3)));idx=0;build();
}
const cls=v=>v<40?'r':v<60?'o':v<80?'y':'g';
function draw(coords,map){
  load(coords);const g=L.featureGroup();let s=0;
  for(let i=1;i<=pts.length;i++){
    if(i===pts.length||cls(raw[i]*3.6)!==cls(raw[s]*3.6)){
      const seg=pts.slice(Math.max(0,s-1),i).map(p=>[p.lat,p.lng]);
      if(seg.length>1)L.polyline(seg,{color:COL[cls(raw[s]*3.6)],weight:6,opacity:.95,lineCap:'round'}).addTo(g);s=i;}}
  g.addTo(map);hud('g','ROUTE LOADED',null,null);return g;
}
function hud(l,msg,t,d){const h=$('hud');if(!h)return;h.hidden=false;h.style.setProperty('--c',COL[l]);
  $('hudTarget').textContent=t==null?'--':t;$('hudMsg').textContent=msg;$('hudDist').textContent=d==null?'':`CORNER IN ${d} m`;}
function say(t,l){if(navigator.vibrate)navigator.vibrate(l==='r'?[250,100,250]:[120]);
  if(voice&&'speechSynthesis' in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(t));}}
function update(p,spd){
  if(!pts.length)return;const c=xy(p.lat,p.lng);let best=-1,bd=1e12;
  const scan=(a,b)=>{for(let i=a;i<=b;i++){const d=(pts[i].x-c.x)**2+(pts[i].y-c.y)**2;if(d<bd){bd=d;best=i;}}};
  scan(Math.max(0,idx-10),Math.min(pts.length-1,idx+120));if(bd>2500)scan(0,pts.length-1);
  if(bd>3600){hud('o','OFF ROUTE',null,null);return;}
  idx=best;if(spd==null)return;
  const allowed=lim[idx]*3.6;let cd=null,ct=null;
  for(let j=idx;j<Math.min(pts.length,idx+60);j++)if(raw[j]*3.6<60){cd=(j-idx)*STEP;ct=Math.min(...raw.slice(j,j+9))*3.6;break;}
  const ratio=spd/allowed;let l=ratio<=1?'g':ratio<=1.12?'y':ratio<=1.3?'o':'r';
  if(cd!==null&&ct<40&&ratio>1.05)l='r';
  const msg={g:'SPEED OK',y:'EASE OFF',o:'SLOW DOWN',r:cd!==null?'CORNER AHEAD — BRAKE':'TOO FAST'}[l];
  hud(l,msg,Math.round(allowed/5)*5,cd);
  const now=Date.now();
  if((l==='o'||l==='r')&&(l!==last||now-lastSay>9000)){lastSay=now;say(l==='r'&&cd!==null?`Corner ahead. Slow to ${Math.round(ct/5)*5}`:'Slow down',l);}
  last=l;
}
function reset(){idx=0;last='g';}
function clear(){pts=[];rs=[];raw=[];lim=[];const h=$('hud');if(h)h.hidden=true;}
return{draw,update,reset,clear,setProfile:v=>{prof=v;if(pts.length)build();},setVoice:v=>{voice=v;}};
})();
