const CACHE='smv-shell-v4';
const ASSETS=['./Forum.html','./manifest.json','./logo.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==location.origin)return;if(/\.(?:js|html)$/.test(url.pathname)||url.pathname.endsWith('/')){event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));}else{event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));}});
