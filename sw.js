var CACHE='sfer-v5';
var PREFIX='sfer-v';
var ASSETS=['./','index.html','manifest.webmanifest','icons/apple-touch-icon.png','icons/icon-192.png','icons/icon-512.png','engine.js','explain.js'];
// Install: bypass HTTP cache so the new set is always consistent (no old engine.js/explain.js mixed in).
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS.map(function(u){return new Request(u,{cache:'reload'});}));}).then(function(){return self.skipWaiting();}));});
// Activate: delete only OUR old caches; also remove all old beta caches (beta retired).
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return (k.indexOf(PREFIX)===0&&k!==CACHE)||k.indexOf('sfer-beta-')===0;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
// Fetch: network-first for page and scripts (fresh code online, cache offline); cache-first for the rest.
self.addEventListener('fetch',function(e){
  var req=e.request; if(req.method!=='GET')return;
  var url=new URL(req.url); if(url.origin!==location.origin)return;
  var fresh=req.mode==='navigate'||/\.(js|html|webmanifest)$/.test(url.pathname)||/\/$/.test(url.pathname);
  function put(res){if(res&&res.ok){var c=res.clone();caches.open(CACHE).then(function(x){x.put(req,c);});}return res;}
  function fromCache(){return caches.open(CACHE).then(function(c){return c.match(req,{ignoreSearch:true}).then(function(r){
    if(r)return r; if(req.mode==='navigate')return c.match('index.html'); return Response.error();});});}
  if(fresh){e.respondWith(fetch(req).then(put).catch(fromCache));}
  else{e.respondWith(fromCache().then(function(r){return (r&&r.type!=='error')?r:fetch(req).then(put);}));}
});
