/* SLAY MOTO units: km/h (default) or mph, switchable everywhere. Internally everything stays in km/h and metres. */
(()=>{
const KEY='slayMotoUnits',KM=1.609344,loc=(navigator.language||'').toLowerCase();
let u=localStorage.getItem(KEY)||(/^en-(us|gb)|^my/.test(loc)?'mph':'kmh');
const U=window.SlayUnits={
  get:()=>u,isMph:()=>u==='mph',
  spd:v=>u==='mph'?v/KM:v,toKmh:v=>u==='mph'?v*KM:v,sl:()=>u==='mph'?'mph':'km/h',
  dv:m=>u==='mph'?m/1609.344:m/1000,du:()=>u==='mph'?'mi':'km',
  dist:(m,n)=>U.dv(m).toFixed(n==null?2:n)+' '+U.du(),
  sm:m=>u==='mph'?Math.round(m*3.28084)+' ft':Math.round(m)+' m',
  set(x){u=x==='mph'?'mph':'kmh';try{localStorage.setItem(KEY,u);}catch(e){}paint();document.dispatchEvent(new Event('slayunits'));}
};
function paint(){
  document.querySelectorAll('.u-spd').forEach(e=>{const t=U.sl();e.textContent=e.hasAttribute('data-up')?t.toUpperCase():t;});
  document.querySelectorAll('.u-dst').forEach(e=>{e.textContent=U.du();});
  document.querySelectorAll('[data-unit]').forEach(b=>b.classList.toggle('on',b.dataset.unit===u));}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-unit]');if(b)U.set(b.dataset.unit);});
document.addEventListener('slayunits',()=>['updateStats','renderHistory'].forEach(n=>{try{window[n]&&window[n]();}catch(e){}}));
paint();
})();
