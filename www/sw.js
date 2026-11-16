// ============================================================
// SERVICE WORKER — faz o site abrir mesmo sem internet.
// Estratégia "rede primeiro": com internet, sempre pega a versão mais nova
// (e guarda uma cópia); sem internet, usa a cópia guardada.
// Por isso não é preciso mudar nada aqui a cada versão.
// Os dados do usuário NÃO ficam aqui: ficam no localStorage do navegador.
// ============================================================
const CACHE = 'habit-tracker';
const ARQUIVOS = [
  './', 'index.html',
  'pc/index.html', 'pc/estilo.css',
  'tablet/index.html', 'tablet/estilo.css',
  'celular/index.html', 'celular/estilo.css',
  'comum/tokens.css', 'comum/manifest.webmanifest',
  'comum/js/aparelho.js', 'comum/js/models.js', 'comum/js/habit-tracker.js', 'comum/js/routines.js', 'comum/js/home.js',
  'comum/icones/apple-touch-icon.png', 'comum/icones/icone-192.png', 'comum/icones/icone-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Só arquivos do próprio site (nada de servidor de sincronização ou outros sites)
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
