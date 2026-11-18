const CACHE='slay-moto-v10';
const CORE=['./','./index.html','./styles.css','./app.js','./guidance.js','./pro.js','./drag.js','./gate.js','./manifest.webmanifest','./assets/icon.svg','./assets/logo.webp','./assets/hero.webp'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return response;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
});
