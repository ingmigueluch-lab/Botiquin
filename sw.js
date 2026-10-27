const C="botiquin-v5";
const F=["./","index.html","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png"];
// iOS no muestra respuestas "redirigidas" servidas por el service worker: se copian limpias.
function clean(r){if(!r||!r.redirected)return Promise.resolve(r);return r.blob().then(b=>new Response(b,{status:r.status,statusText:r.statusText,headers:r.headers}))}
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>fetch(u,{cache:"reload"}).then(clean).then(r=>{if(r&&r.ok)return c.put(u,r)}).catch(()=>{})))));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const req=e.request,u=new URL(req.url);
  if(req.method!=="GET"||u.origin!==location.origin||u.pathname.endsWith("meds.json"))return;
  if(req.mode==="navigate"){
    e.respondWith(
      Promise.race([fetch(req.url,{cache:"no-store"}),new Promise((_,rej)=>setTimeout(()=>rej(),5000))])
        .then(clean).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put("index.html",cp));return r}throw 0})
        .catch(()=>caches.open(C).then(c=>c.match("index.html").then(r=>r||c.match("./"))).then(clean).then(r=>r||fetch(req.url)))
    );return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r?clean(r):fetch(req).then(clean).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(req,cp))}return res})));
});
