// ============================================================
// QUAL VERSÃO ABRIR? (pc / tablet / celular)
// Escolhe pela largura da tela e troca sozinho se a janela mudar de tamanho.
//   até 720px  → celular/
//   721–1024px → tablet/
//   1025px+    → pc/
// Para forçar uma versão: abra com ?aparelho=pc (ou tablet, celular).
// Para voltar ao automático: ?aparelho=auto
// ============================================================
(function () {
  const VERSOES = ['pc', 'tablet', 'celular'];
  const KEY = 'habitTrackerAparelho';
  const atual = document.documentElement.dataset.device || null;   // null = página de entrada (www/index.html)
  const prefixo = atual ? '../' : '';

  const porLargura = (w) => (w <= 720 ? 'celular' : w <= 1024 ? 'tablet' : 'pc');

  let forcado = null;
  try {
    const p = new URLSearchParams(location.search).get('aparelho');
    if (p === 'auto') sessionStorage.removeItem(KEY);
    else if (VERSOES.includes(p)) sessionStorage.setItem(KEY, p);
    forcado = sessionStorage.getItem(KEY);
  } catch {}

  function irPara(versao) {
    if (versao === atual) return;
    location.replace(`${prefixo}${versao}/index.html${location.hash}`);
  }

  window.APARELHO = { atual, porLargura, irPara };
  irPara(forcado || porLargura(window.innerWidth));

  // Se a janela mudar de tamanho (ex.: PC → janela estreita), troca de versão
  let t = null;
  window.addEventListener('resize', () => {
    if (forcado) return;
    clearTimeout(t);
    t = setTimeout(() => irPara(porLargura(window.innerWidth)), 300);
  });
})();
