// ============================================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================================
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS = ['D','S','T','Q','Q','S','S'];
const STORAGE_KEY = 'habitTrackerData_v1';
const APP_VERSION = '1.4.0';
const VIEWS = ['home', 'habits', 'routines', 'manage'];
const VIEW_TITLES = { home: 'Início', habits: 'Hábitos', routines: 'Rotinas', manage: 'Configurar' };   // mesma chave de antes: seus dados continuam
const PALETTE = ['#10b981','#06b6d4','#3b82f6','#6366f1','#a855f7','#ec4899','#f43f5e','#f59e0b'];

const today = new Date();
const TODAY = { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };

// Estado global (o formato é compatível com a versão anterior)
let state = {
  year: TODAY.y,
  activeMonth: TODAY.m,
  color: PALETTE[0],
  darkMode: null,            // null = segue o tema do sistema
  view: 'home',              // tela aberta: 'home' | 'habits' | 'routines' | 'manage'
  habits: [],                // lista de Habit   (ver models.js)
  routines: []               // lista de Routine (ver models.js)
};

// ============================================================
// AUXILIARES
// ============================================================
const $ = (id) => document.getElementById(id);
const genId = () => 'h' + Math.random().toString(36).slice(2, 9);
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const markKey = (y, m, d) => `${y}-${m}-${d}`;
const isToday = (y, m, d) => y === TODAY.y && m === TODAY.m && d === TODAY.d;
const isFuture = (y, m, d) => new Date(y, m, d) > new Date(TODAY.y, TODAY.m, TODAY.d);

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

/** Quantos dias do mês já "valem" para o cálculo de % (passado = todos, atual = até hoje, futuro = 0). */
function elapsedDays(y, m) {
  if (y < TODAY.y || (y === TODAY.y && m < TODAY.m)) return daysInMonth(y, m);
  if (y === TODAY.y && m === TODAY.m) return TODAY.d;
  return 0;
}

function countMonthMarks(habit, y, m) {
  const prefix = `${y}-${m}-`;
  return Object.keys(habit.marks || {}).filter(k => k.startsWith(prefix)).length;
}

/** Sequência atual: conta para trás a partir de hoje (se hoje ainda não foi marcado, começa de ontem). */
function currentStreak(habit) {
  const marks = habit.marks || {};
  const d = new Date(TODAY.y, TODAY.m, TODAY.d);
  if (!marks[markKey(d.getFullYear(), d.getMonth(), d.getDate())]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (marks[markKey(d.getFullYear(), d.getMonth(), d.getDate())]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Maior sequência de todos os tempos. */
function bestStreak(habit) {
  const times = Object.keys(habit.marks || {})
    .map(k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m, d).getTime(); })
    .sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  for (const t of times) {
    run = (prev !== null && Math.round((t - prev) / 86400000) === 1) ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

// ============================================================
// PERSISTÊNCIA (localStorage)
// ============================================================
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { console.error('Erro ao salvar', e); }
}

function normalizeState() {
  if (!Array.isArray(state.habits)) state.habits = [];
  state.habits.forEach(h => {
    if (!h.id) h.id = genId();
    if (!h.color) h.color = state.color || PALETTE[0];
    if (!h.marks || typeof h.marks !== 'object') h.marks = {};
    // Migração do formato antigo ("M-D", sem ano)
    const keys = Object.keys(h.marks);
    if (keys.some(k => !/^\d{4}-\d+-\d+$/.test(k))) {
      const fixed = {};
      keys.forEach(k => {
        if (/^\d{4}-\d+-\d+$/.test(k)) { fixed[k] = true; return; }
        const [m, d] = k.split('-').map(Number);
        if (!isNaN(m) && !isNaN(d)) fixed[markKey(state.year, m, d)] = true;
      });
      h.marks = fixed;
    }
  });
  state.habits = state.habits.map(h => h instanceof Habit ? h : new Habit(h));
  if (!Array.isArray(state.routines)) state.routines = [];
  state.routines = state.routines.map(r => r instanceof Routine ? r : new Routine(r));
  if (!VIEWS.includes(state.view)) state.view = 'home';
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (e) { console.error('Erro ao ler dados', e); }
  normalizeState();
  // Sempre abre no mês atual
  state.year = TODAY.y;
  state.activeMonth = TODAY.m;
}

// ============================================================
// TEMA
// ============================================================
const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)');
const isDark = () => state.darkMode === null || state.darkMode === undefined ? !!systemDark?.matches : state.darkMode;

const ICON_MOON = '<svg viewBox="0 0 24 24" width="19" height="19"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
const ICON_SUN = '<svg viewBox="0 0 24 24" width="19" height="19"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function applyTheme() {
  const dark = isDark();
  document.body.classList.toggle('dark', dark);
  $('darkToggle').innerHTML = dark ? ICON_SUN : ICON_MOON;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b0c12' : '#f4f5fb');
}

// ============================================================
// TOAST (aviso rápido, com "Desfazer" opcional)
// ============================================================
let toastTimer = null;
function toast(msg, action) {
  const el = $('toast');
  el.innerHTML = escapeHtml(msg);
  if (action) {
    const b = document.createElement('button');
    b.textContent = action.label;
    b.style.cssText = 'margin-left:12px;background:none;border:none;color:inherit;font-weight:800;text-decoration:underline;cursor:pointer;';
    b.onclick = () => { action.run(); el.classList.remove('show'); };
    el.appendChild(b);
    el.style.pointerEvents = 'auto';
  } else {
    el.style.pointerEvents = 'none';
  }
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), action ? 5000 : 2200);
}

// ============================================================
// SELETOR DE CORES (paleta + cor personalizada)
// ============================================================
function renderSwatches(container, selected, onPick) {
  container.innerHTML = '';
  PALETTE.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (c.toLowerCase() === String(selected).toLowerCase() ? ' selected' : '');
    b.style.background = c;
    b.title = c;
    b.onclick = () => { onPick(c); renderSwatches(container, c, onPick); };
    container.appendChild(b);
  });
  const isCustom = !PALETTE.some(c => c.toLowerCase() === String(selected).toLowerCase());
  const custom = document.createElement('label');
  custom.className = 'swatch custom' + (isCustom ? ' selected' : '');
  custom.title = 'Cor personalizada';
  if (isCustom) custom.style.background = selected;
  const input = document.createElement('input');
  input.type = 'color';
  input.value = /^#[0-9a-f]{6}$/i.test(selected) ? selected : PALETTE[0];
  input.oninput = (e) => { onPick(e.target.value); custom.style.background = e.target.value; };
  input.onchange = () => renderSwatches(container, input.value, onPick);
  custom.appendChild(input);
  container.appendChild(custom);
}

// ============================================================
// RENDERIZAÇÃO
// ============================================================
function renderGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  $('greeting').textContent = `${g}! Sua rotina, um dia de cada vez.`;
}

function renderHeader() {
  $('monthName').textContent = MONTHS[state.activeMonth];
  $('yearName').textContent = state.year;
  $('todayBtn').hidden = state.year === TODAY.y && state.activeMonth === TODAY.m;
}

function renderTabs() {
  const tabs = $('tabs');
  tabs.innerHTML = '';
  MONTHS.forEach((name, idx) => {
    const b = document.createElement('button');
    b.className = 'tab'
      + (idx === state.activeMonth ? ' active' : '')
      + (state.year === TODAY.y && idx === TODAY.m ? ' current' : '');
    b.textContent = name.slice(0, 3);
    b.title = `${name} ${state.year}`;
    b.onclick = () => goTo(state.year, idx);
    tabs.appendChild(b);
  });
  tabs.querySelector('.active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function renderStats() {
  const { year: y, activeMonth: m, habits } = state;
  const n = habits.length;
  const doneToday = habits.filter(h => h.marks[markKey(TODAY.y, TODAY.m, TODAY.d)]).length;
  const elapsed = elapsedDays(y, m);
  const possible = elapsed * n;
  const marked = habits.reduce((s, h) => s + countMonthMarks(h, y, m), 0);
  const pct = possible ? Math.round((marked / possible) * 100) : 0;
  const topStreak = habits.reduce((best, h) => {
    const s = currentStreak(h);
    return s > best.s ? { s, name: h.name } : best;
  }, { s: 0, name: '' });

  $('stats').innerHTML = `
    <div class="stat">
      <div class="stat-label">Hoje</div>
      <div class="stat-value">${doneToday}<small> / ${n}</small></div>
      <div class="progress"><span style="width:${n ? (doneToday / n) * 100 : 0}%"></span></div>
    </div>
    <div class="stat">
      <div class="stat-label">${MONTHS[m].slice(0, 3)} · conclusão</div>
      <div class="stat-value">${possible ? pct + '%' : '—'}</div>
      <div class="progress"><span style="width:${pct}%"></span></div>
    </div>
    <div class="stat">
      <div class="stat-label">Maior sequência atual</div>
      <div class="stat-value">${topStreak.s ? '🔥 ' + topStreak.s : '0'}<small> ${topStreak.s === 1 ? 'dia' : 'dias'}</small></div>
      <div class="habit-meta" style="margin-top:6px">${topStreak.s ? escapeHtml(topStreak.name) : 'Marque um hábito hoje'}</div>
    </div>`;
}

function renderTable() {
  const table = $('habitTable');
  const { year: y, activeMonth: m, habits } = state;
  const days = daysInMonth(y, m);
  const elapsed = elapsedDays(y, m);

  $('emptyState').hidden = habits.length > 0;
  table.hidden = habits.length === 0;
  if (!habits.length) { table.innerHTML = ''; renderFooter(); return; }

  // Cabeçalho
  let html = '<thead><tr><th class="name-col">Hábito</th>';
  for (let d = 1; d <= days; d++) {
    const wd = new Date(y, m, d).getDay();
    const cls = [wd === 0 || wd === 6 ? 'weekend' : '', isToday(y, m, d) ? 'today' : ''].join(' ');
    html += `<th class="${cls}"><div class="day-head"><span class="wd">${WEEKDAYS[wd]}</span><span class="dn">${d}</span></div></th>`;
  }
  html += '<th class="pct-col">%</th></tr></thead><tbody>';

  // Linhas
  habits.forEach(h => {
    const streak = currentStreak(h);
    const monthCount = countMonthMarks(h, y, m);
    const pct = elapsed ? Math.round((monthCount / elapsed) * 100) : null;
    html += `<tr data-id="${h.id}">
      <td class="name-col">
        <button class="habit-btn" data-edit="${h.id}" title="Editar hábito">
          <span class="habit-dot" style="background:${h.color}"></span>
          <span class="habit-info">
            <span class="habit-name">${escapeHtml(h.name)}</span>
            <span class="habit-meta"><span class="streak ${streak >= 3 ? 'hot' : ''}">🔥 ${streak}</span><span>${monthCount} no mês</span></span>
          </span>
        </button>
      </td>`;
    for (let d = 1; d <= days; d++) {
      const wd = new Date(y, m, d).getDay();
      const marked = !!h.marks[markKey(y, m, d)];
      const cls = [wd === 0 || wd === 6 ? 'weekend' : '', isToday(y, m, d) ? 'today' : ''].join(' ');
      html += `<td class="day ${cls}"><button class="cell${marked ? ' marked' : ''}${isFuture(y, m, d) ? ' future' : ''}"
        style="--c:${h.color}" data-id="${h.id}" data-day="${d}"
        aria-label="${escapeHtml(h.name)}, dia ${d}${marked ? ', feito' : ''}">${ICON_CHECK}</button></td>`;
    }
    html += `<td class="pct-col" style="color:${pct >= 70 ? h.color : ''}">${pct === null ? '—' : pct + '%'}</td></tr>`;
  });
  html += '</tbody>';
  table.innerHTML = html;
  renderFooter();
}

function renderFooter() {
  if (state.view === 'routines') return renderRoutinesFooter();
  if (state.view !== 'habits') {
    $('summary').textContent = `${state.habits.length} hábito${state.habits.length === 1 ? '' : 's'} · ${state.routines.length} rotina${state.routines.length === 1 ? '' : 's'} · v${APP_VERSION}`;
    return;
  }
  const total = state.habits.reduce((s, h) => s + countMonthMarks(h, state.year, state.activeMonth), 0);
  $('summary').textContent = `${total} marcações em ${MONTHS[state.activeMonth]} · ${state.habits.length} hábito${state.habits.length === 1 ? '' : 's'}`;
}

function scrollToToday() {
  $('tabs').querySelector('.active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  if (state.year !== TODAY.y || state.activeMonth !== TODAY.m) { $('tableWrap').scrollLeft = 0; return; }
  const th = document.querySelector('#habitTable thead th.today');
  const wrap = $('tableWrap');
  if (th) wrap.scrollLeft = Math.max(0, th.offsetLeft - wrap.clientWidth / 2);
}

function render() {
  applyTheme();
  renderGreeting();
  renderHeader();
  renderTabs();
  renderView();
}

/** Desenha a tela aberta (Início, Hábitos, Rotinas ou Configurar). */
function renderView() {
  const v = state.view;
  VIEWS.forEach(name => { $(name + 'View').hidden = name !== v; });
  document.querySelectorAll('[data-nav]').forEach(b => {
    b.classList.toggle('active', b.dataset.nav === v);
    b.setAttribute('aria-current', b.dataset.nav === v ? 'page' : 'false');
  });
  $('homeBtn').hidden = v === 'home';
  $('pageTitle').textContent = v === 'home' ? 'Habit Tracker' : VIEW_TITLES[v];
  if (v === 'home') renderHome();
  else if (v === 'habits') { renderStats(); renderTable(); }
  else if (v === 'routines') renderRoutines();
  else renderManage();
  renderFooter();
}

function setView(view) {
  if (!VIEWS.includes(view)) view = 'home';
  state.view = view;
  saveState();
  renderView();
  window.scrollTo({ top: 0 });
  requestAnimationFrame(view === 'habits' ? scrollToToday : view === 'routines' ? scrollWeekToToday : () => {});
}
const goHome = () => setView('home');

// ============================================================
// NAVEGAÇÃO
// ============================================================
function goTo(y, m) {
  if (m < 0) { y--; m = 11; }
  if (m > 11) { y++; m = 0; }
  state.year = y;
  state.activeMonth = m;
  saveState();
  render();
  requestAnimationFrame(scrollToToday);
}

// ============================================================
// AÇÕES DOS HÁBITOS
// ============================================================
function addHabit(name, color) {
  const habit = new Habit({ name, color });
  state.habits.push(habit);
  queueOp({ t: 'create', id: habit.id });
  state.color = color;
  saveState();
  render();
  toast(`Hábito “${habit.name}” criado`);
}

/** Marca/desmarca HOJE um hábito (usado na tela Início) */
function toggleHabitToday(id) {
  const h = state.habits.find(x => x.id === id);
  if (!h) return;
  const marked = h.toggle(TODAY.y, TODAY.m, TODAY.d);
  saveState();
  queueOp({ t: 'mark', id: h.id, date: keyToIso(markKey(TODAY.y, TODAY.m, TODAY.d)), marked });
  if (marked && navigator.vibrate) navigator.vibrate(12);
  renderView();
}

function toggleMark(habitId, day, cellEl) {
  const h = state.habits.find(x => x.id === habitId);
  if (!h) return;
  const key = markKey(state.year, state.activeMonth, day);
  if (h.marks[key]) delete h.marks[key];
  else h.marks[key] = true;
  saveState();
  queueOp({ t: 'mark', id: h.id, date: keyToIso(key), marked: !!h.marks[key] });
  // Atualiza só a célula (rápido) e depois os números
  if (cellEl) {
    cellEl.classList.toggle('marked', !!h.marks[key]);
    cellEl.classList.remove('pop'); void cellEl.offsetWidth; cellEl.classList.add('pop');
  }
  if (h.marks[key] && navigator.vibrate) navigator.vibrate(12);
  updateRow(h);
  renderStats();
  renderFooter();
}

/** Atualiza só os números de uma linha (sequência, contagem, %), sem redesenhar a grade. */
function updateRow(h) {
  const row = document.querySelector(`#habitTable tr[data-id="${h.id}"]`);
  if (!row) return renderTable();
  const streak = currentStreak(h);
  const monthCount = countMonthMarks(h, state.year, state.activeMonth);
  const elapsed = elapsedDays(state.year, state.activeMonth);
  const pct = elapsed ? Math.round((monthCount / elapsed) * 100) : null;
  const s = row.querySelector('.streak');
  s.textContent = `🔥 ${streak}`;
  s.classList.toggle('hot', streak >= 3);
  row.querySelector('.habit-meta span:last-child').textContent = `${monthCount} no mês`;
  const pctCell = row.querySelector('.pct-col');
  pctCell.textContent = pct === null ? '—' : pct + '%';
  pctCell.style.color = pct >= 70 ? h.color : '';
}

// ============================================================
// MODAL DE EDIÇÃO
// ============================================================
let editingId = null;
let editColor = null;

/** Abre a janela do hábito. Sem id = criar um novo. */
function openEdit(id) {
  const h = id ? state.habits.find(x => x.id === id) : null;
  if (id && !h) return;
  editingId = h ? h.id : null;
  editColor = h ? h.color : PALETTE[state.habits.length % PALETTE.length];
  $('editTitle').textContent = h ? 'Editar hábito' : 'Novo hábito';
  $('editNameInput').value = h ? h.name : '';
  $('editNameInput').placeholder = 'ex.: Beber 2L de água, Meditar';
  $('deleteHabitBtn').hidden = !h;
  $('editStats').hidden = !h;
  $('saveEditBtn').textContent = h ? 'Salvar' : 'Criar hábito';
  renderSwatches($('editSwatches'), editColor, c => editColor = c);
  $('editModal').hidden = false;
  setTimeout(() => $('editNameInput').focus(), 50);
  if (!h) return;
  const total = Object.keys(h.marks).length;
  $('editStats').innerHTML = `
    <div><b>🔥 ${currentStreak(h)}</b><span>Sequência atual</span></div>
    <div><b>${bestStreak(h)}</b><span>Melhor sequência</span></div>
    <div><b>${total}</b><span>Dias no total</span></div>`;
}

function closeEdit() {
  $('editModal').hidden = true;
  editingId = null;
}

function saveEdit() {
  const name = $('editNameInput').value.trim();
  if (!name) { toast('Dê um nome para o hábito'); $('editNameInput').focus(); return; }
  if (!editingId) { const c = editColor; closeEdit(); return addHabit(name, c); }
  const h = state.habits.find(x => x.id === editingId);
  if (!h) return closeEdit();
  h.name = name;
  h.color = editColor;
  saveState();
  queueOp({ t: 'update', id: h.id });
  closeEdit();
  render();
}

function deleteHabit() {
  const idx = state.habits.findIndex(x => x.id === editingId);
  if (idx < 0) return closeEdit();
  const [removed] = state.habits.splice(idx, 1);
  saveState();
  queueDelete(removed);
  closeEdit();
  render();
  toast(`“${removed.name}” excluído`, {
    label: 'Desfazer',
    run: () => { state.habits.splice(idx, 0, removed); saveState(); queueRestore(removed); render(); }
  });
}

// ============================================================
// BACKUP: EXPORTAR / IMPORTAR
// ============================================================
function exportData() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = `${TODAY.y}-${String(TODAY.m + 1).padStart(2, '0')}-${String(TODAY.d).padStart(2, '0')}`;
  a.href = url;
  a.download = `habit-tracker-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Backup exportado');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed || !Array.isArray(parsed.habits)) throw new Error('formato');
      const nR = Array.isArray(parsed.routines) ? parsed.routines.length : 0;
      if (!confirm(`Substituir seus dados atuais por este backup (${parsed.habits.length} hábitos, ${nR} rotinas)?`)) return;
      const old = state.habits;
      const oldRoutines = state.routines;
      state = Object.assign({ year: TODAY.y, activeMonth: TODAY.m, color: PALETTE[0], darkMode: null, view: state.view, habits: [], routines: [] }, parsed);
      normalizeState();
      // Se estiver conectado, o servidor também passa a ter exatamente os dados do backup
      old.forEach(queueDelete);
      oldRoutines.forEach(queueDelete);
      [...state.habits, ...state.routines].forEach(x => { x.id = genId(); delete x.sid; queueRestore(x); });
      state.year = TODAY.y; state.activeMonth = TODAY.m;
      saveState();
      render();
      toast('Backup importado com sucesso');
    } catch {
      toast('Arquivo inválido');
    }
  };
  reader.readAsText(file);
}

// ============================================================
// SINCRONIZAÇÃO COM O SERVIDOR
// Funciona offline: toda ação é salva no aparelho e entra numa fila;
// quando o servidor responde, a fila é enviada e os dados são atualizados.
// ============================================================
const SYNC_KEY = 'habitTrackerSync_v1';
let sync = { server: '', token: '', email: '', queue: [], lastSync: null };
let syncStatus = 'local';   // local | syncing | ok | offline | error
let syncing = false;
let opCounter = 0;

function loadSync() {
  try { Object.assign(sync, JSON.parse(localStorage.getItem(SYNC_KEY) || '{}')); } catch {}
  if (!Array.isArray(sync.queue)) sync.queue = [];
  const isNativeApp = !!window.Capacitor?.isNativePlatform?.();
  if (!sync.server && !isNativeApp && /^https?:$/.test(location.protocol)) {
    sync.server = location.origin;   // app aberto pelo próprio servidor (ex.: http://192.168.0.10:3000)
  }
}
function saveSync() {
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); } catch {}
}
const loggedIn = () => !!(sync.token && sync.server);

/** "2026-10-5" (mês começando em 0) → "2026-11-05" */
function keyToIso(key) {
  const [y, m, d] = key.split('-').map(Number);
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
/** "2026-11-05" → "2026-10-5" */
function isoToKey(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return markKey(y, m - 1, d);
}

function normalizeServer(url) {
  url = String(url || '').trim().replace(/\/+$/, '');
  if (url && !/^https?:\/\//i.test(url)) url = 'http://' + url;
  if (/^http:\/\/[^/:]+$/i.test(url)) url += ':3000';   // sem porta → 3000
  return url;
}

async function api(path, { method = 'GET', body, server = sync.server, token = sync.token, timeout = 8000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  let res;
  try {
    res = await fetch(server + '/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal
    });
  } catch {
    const err = new Error('Não foi possível falar com o servidor');
    err.network = true;
    throw err;
  } finally { clearTimeout(timer); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Erro ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function queueOp(op) {
  if (!loggedIn()) return;
  opCounter++;
  sync.queue.push(op);
  saveSync();
  scheduleSync();
}

// Toda operação leva "k" (tipo): 'habit' ou 'routine'
function queueDelete(item) {
  if (!loggedIn()) return;
  if (!item.sid) {
    // Ainda não chegou ao servidor: basta tirar da fila tudo que era dele
    sync.queue = sync.queue.filter(op => op.id !== item.id);
    saveSync();
    return;
  }
  queueOp({ t: 'delete', k: item.kind, id: item.id, sid: item.sid });
}

function queueRestore(item) {
  if (!loggedIn()) return;
  const pending = sync.queue.findIndex(op => op.t === 'delete' && op.id === item.id);
  if (pending >= 0) { sync.queue.splice(pending, 1); saveSync(); return; }   // exclusão nem foi enviada
  delete item.sid;
  queueOp({ t: 'restore', k: item.kind, id: item.id });
}

let syncTimer = null;
function scheduleSync(delay = 400) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, delay);
}

async function runOp(op) {
  if (op.k === 'routine') return runRoutineOp(op);
  const h = state.habits.find(x => x.id === op.id);
  switch (op.t) {
    case 'create': {
      if (!h || h.sid) return;
      const r = await api('/habits', { method: 'POST', body: { name: h.name, color: h.color } });
      h.sid = r.id;
      // Marcações feitas antes de o hábito chegar ao servidor
      const marks = Object.keys(h.marks);
      for (const k of marks) await api(`/habits/${h.sid}/marks/${keyToIso(k)}`, { method: 'PUT', body: { marked: true } });
      break;
    }
    case 'restore': {
      if (!h || h.sid) return;
      const list = await api('/habits/import', { method: 'POST', body: { habits: [h.toPayload()] } });
      h.sid = Math.max(...list.map(x => x.id));
      break;
    }
    case 'update':
      if (!h || !h.sid) return;
      await api(`/habits/${h.sid}`, { method: 'PATCH', body: { name: h.name, color: h.color } });
      break;
    case 'mark':
      if (!h || !h.sid) return;   // marcação vai junto quando o hábito for criado
      await api(`/habits/${h.sid}/marks/${op.date}`, { method: 'PUT', body: { marked: op.marked } });
      break;
    case 'delete': {
      const sid = op.sid || h?.sid;
      if (sid) await api(`/habits/${sid}`, { method: 'DELETE' });
      break;
    }
  }
}

async function runRoutineOp(op) {
  const r = state.routines.find(x => x.id === op.id);
  switch (op.t) {
    case 'create':
    case 'restore': {
      if (!r || r.sid) return;
      const res = await api('/routines', { method: 'POST', body: r.toPayload() });
      r.sid = res.id;
      break;
    }
    case 'update':
      if (!r || !r.sid) return;   // vai completa quando for criada
      await api(`/routines/${r.sid}`, { method: 'PATCH', body: r.toPayload() });
      break;
    case 'mark':
      if (!r || !r.sid) return;
      await api(`/routines/${r.sid}/done/${op.date}`, { method: 'PUT', body: { done: op.done } });
      break;
    case 'delete': {
      const sid = op.sid || r?.sid;
      if (sid) await api(`/routines/${sid}`, { method: 'DELETE' });
      break;
    }
  }
}

/** Troca os dados locais pelos do servidor (fonte da verdade). */
function applyServerHabits(list) {
  state.habits = list.map(s => Habit.fromServer(s, state.habits.find(h => h.sid === s.id)?.id));
  saveState();
}
function applyServerRoutines(list) {
  state.routines = list.map(s => Routine.fromServer(s, state.routines.find(r => r.sid === s.id)?.id));
  saveState();
}

async function syncNow() {
  if (!loggedIn() || syncing) return;
  syncing = true;
  setSyncStatus('syncing');
  try {
    // 1) envia a fila
    while (sync.queue.length) {
      try {
        await runOp(sync.queue[0]);
      } catch (e) {
        if (e.network || e.status === 401) throw e;
        console.warn('Operação descartada:', sync.queue[0], e.message);   // ex.: 404
      }
      sync.queue.shift();
      saveSync();
      saveState();
    }
    // 2) baixa o estado atual (ignora se o usuário mexeu enquanto baixava)
    const before = opCounter;
    const [list, routines] = await Promise.all([api('/habits'), api('/routines')]);
    if (before === opCounter && !sync.queue.length) {
      applyServerHabits(list);
      applyServerRoutines(routines);
      const scroll = $('tableWrap').scrollLeft;
      renderView();
      $('tableWrap').scrollLeft = scroll;
    }
    sync.lastSync = Date.now();
    saveSync();
    setSyncStatus('ok');
  } catch (e) {
    if (e.status === 401) {
      sync.token = ''; saveSync();
      setSyncStatus('local');
      toast('Sessão expirada. Entre de novo para sincronizar.');
    } else {
      setSyncStatus('offline');
    }
  } finally {
    syncing = false;
    if (sync.queue.length && syncStatus === 'ok') scheduleSync(200);
  }
}

function setSyncStatus(s) {
  syncStatus = loggedIn() ? s : 'local';
  const el = $('syncStatus');
  if (!el) return;
  const n = sync.queue.length;
  const map = {
    local:   ['', 'Salvo só neste aparelho · conectar ao servidor'],
    syncing: ['busy', 'Sincronizando…'],
    ok:      ['ok', `Sincronizado · ${sync.email}`],
    offline: ['warn', `Servidor fora do ar${n ? ` · ${n} alteraç${n === 1 ? 'ão' : 'ões'} na fila` : ''} · tentar de novo`],
    error:   ['warn', 'Erro ao sincronizar']
  };
  const [cls, text] = map[syncStatus] || map.local;
  el.className = 'sync-status ' + cls;
  el.querySelector('span').textContent = text;
}

// ---------- Janela "Conta e servidor" ----------
function openAccount() {
  $('optionsPanel').classList.remove('visible');
  const isIn = loggedIn();
  $('accountLoggedOut').hidden = isIn;
  $('accountLoggedIn').hidden = !isIn;
  $('serverInput').value = sync.server || '';
  $('accountEmail').textContent = sync.email || '';
  $('accountServer').textContent = sync.server || '';
  $('accountLast').textContent = sync.lastSync ? new Date(sync.lastSync).toLocaleString('pt-BR') : 'nunca';
  $('accountMsg').textContent = '';
  $('accountModal').hidden = false;
  if (!isIn) setTimeout(() => (sync.server ? $('emailInput') : $('serverInput')).focus(), 50);
}
const closeAccount = () => { $('accountModal').hidden = true; };

function accountMsg(text, ok) {
  const el = $('accountMsg');
  el.textContent = text;
  el.className = 'account-msg ' + (ok ? 'ok' : 'err');
}

async function testServer() {
  const server = normalizeServer($('serverInput').value);
  if (!server) return accountMsg('Digite o endereço do servidor');
  $('serverInput').value = server;
  accountMsg('Testando…', true);
  try {
    const r = await api('/health', { server, token: '', timeout: 5000 });
    if (!r.ok) throw new Error();
    accountMsg('Servidor encontrado ✓', true);
    return server;
  } catch {
    accountMsg('Não encontrei o servidor nesse endereço. Ele está ligado? O celular está no mesmo Wi-Fi?');
  }
}

async function doAuth(kind) {
  const server = normalizeServer($('serverInput').value);
  const email = $('emailInput').value.trim();
  const password = $('passwordInput').value;
  if (!server) return accountMsg('Digite o endereço do servidor');
  if (!email || !password) return accountMsg('Preencha email e senha');
  $('serverInput').value = server;
  accountMsg(kind === 'register' ? 'Criando conta…' : 'Entrando…', true);
  try {
    const r = await api('/auth/' + kind, { method: 'POST', body: { email, password }, server, token: '' });
    Object.assign(sync, { server, token: r.token, email: r.user.email, queue: [] });
    saveSync();
    await firstSync();
    $('passwordInput').value = '';
    closeAccount();
  } catch (e) {
    accountMsg(e.network ? 'Não consegui falar com o servidor. Confira o endereço e se ele está ligado.' : e.message);
  }
}

/** Primeiro login neste aparelho: junta os dados locais com os do servidor. */
async function firstSync() {
  const [serverList, serverRoutines] = await Promise.all([api('/habits'), api('/routines')]);
  const local = state.habits.filter(h => h.name);
  const localR = state.routines.filter(r => r.name);
  let list = serverList, routines = serverRoutines;
  if (local.length || localR.length) {
    const nServer = serverList.length + serverRoutines.length;
    const send = !nServer || confirm(
      `Sua conta já tem ${serverList.length} hábito(s) e ${serverRoutines.length} rotina(s) no servidor.\n\n` +
      `Enviar também os ${local.length} hábito(s) e ${localR.length} rotina(s) deste aparelho?\n\n` +
      `OK = enviar e juntar · Cancelar = usar só os do servidor`);
    if (send) {
      if (local.length) list = await api('/habits/import', { method: 'POST', body: { habits: local.map(h => h.toPayload()) } });
      for (const r of localR) await api('/routines', { method: 'POST', body: r.toPayload() });
      if (localR.length) routines = await api('/routines');
    }
  }
  state.habits = [];
  state.routines = [];
  applyServerHabits(list);
  applyServerRoutines(routines);
  sync.lastSync = Date.now();
  saveSync();
  render();
  setSyncStatus('ok');
  toast(`Conectado como ${sync.email}`);
}

function logout() {
  if (sync.queue.length && !confirm('Ainda há alterações que não chegaram ao servidor. Sair mesmo assim?')) return;
  sync.token = ''; sync.queue = [];
  [...state.habits, ...state.routines].forEach(x => delete x.sid);
  saveSync(); saveState();
  closeAccount();
  setSyncStatus('local');
  toast('Desconectado. Os dados continuam neste aparelho.');
}

// ============================================================
// EVENTOS
// ============================================================
function bindEvents() {
  $('newHabitBtn').onclick = () => openEdit(null);

  $('prevMonthBtn').onclick = () => goTo(state.year, state.activeMonth - 1);
  $('nextMonthBtn').onclick = () => goTo(state.year, state.activeMonth + 1);
  $('todayBtn').onclick = () => goTo(TODAY.y, TODAY.m);

  // Cliques na grade (delegação de eventos)
  $('habitTable').addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (cell) return toggleMark(cell.dataset.id, Number(cell.dataset.day), cell);
    const edit = e.target.closest('[data-edit]');
    if (edit) openEdit(edit.dataset.edit);
  });

  // Tema
  $('darkToggle').onclick = () => { state.darkMode = !isDark(); saveState(); applyTheme(); };
  systemDark?.addEventListener?.('change', () => { if (state.darkMode === null) applyTheme(); });

  // Menu de opções
  const panel = $('optionsPanel');
  $('optionsBtn').onclick = (e) => { e.stopPropagation(); panel.classList.toggle('visible'); };
  document.addEventListener('click', (e) => { if (!panel.contains(e.target)) panel.classList.remove('visible'); });
  $('exportBtn').onclick = () => { panel.classList.remove('visible'); exportData(); };
  $('importFileInput').onchange = (e) => {
    const f = e.target.files[0];
    if (f) importData(f);
    e.target.value = '';
    panel.classList.remove('visible');
  };

  // Modal
  $('saveEditBtn').onclick = saveEdit;
  $('cancelEditBtn').onclick = closeEdit;
  $('deleteHabitBtn').onclick = deleteHabit;
  $('editModal').addEventListener('click', (e) => { if (e.target.id === 'editModal') closeEdit(); });
  $('editNameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveEdit(); });

  // Navegação: menu lateral (PC) / barra de baixo (celular), botão Início e logo
  document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => setView(b.dataset.nav));
  $('homeBtn').onclick = goHome;
  $('brandBtn').onclick = goHome;
  // Qualquer elemento com data-go="tela" leva para essa tela (ex.: links da Início)
  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); setView(go.dataset.go); }
  });

  // Conta e sincronização
  $('accountBtn').onclick = openAccount;
  $('syncStatus').onclick = () => (loggedIn() && syncStatus !== 'ok') ? syncNow() : openAccount();
  $('closeAccountBtn').onclick = closeAccount;
  $('closeAccountBtn2').onclick = closeAccount;
  $('accountModal').addEventListener('click', (e) => { if (e.target.id === 'accountModal') closeAccount(); });
  $('testServerBtn').onclick = testServer;
  $('loginForm').addEventListener('submit', (e) => { e.preventDefault(); doAuth('login'); });
  $('registerBtn').onclick = () => doAuth('register');
  $('syncNowBtn').onclick = () => { syncNow(); closeAccount(); };
  $('logoutBtn').onclick = logout;
  window.addEventListener('online', () => scheduleSync(100));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleSync(100); });
  setInterval(() => { if (!document.hidden) syncNow(); }, 60000);

  // Atalhos de teclado (PC)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('accountModal').hidden) return closeAccount();
    if (e.key === 'Escape' && !$('editModal').hidden) return closeEdit();
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') goTo(state.year, state.activeMonth - 1);
    if (e.key === 'ArrowRight') goTo(state.year, state.activeMonth + 1);
    if (e.key.toLowerCase() === 'h') goTo(TODAY.y, TODAY.m);
  });
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', function init() {
  loadState();
  loadSync();
  bindEvents();
  render();
  setSyncStatus(loggedIn() ? 'syncing' : 'local');
  requestAnimationFrame(state.view === 'habits' ? scrollToToday : state.view === 'routines' ? scrollWeekToToday : () => {});
  if (loggedIn()) syncNow();
});
