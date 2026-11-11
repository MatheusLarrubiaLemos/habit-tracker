// ============================================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================================
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS = ['D','S','T','Q','Q','S','S'];
const STORAGE_KEY = 'habitTrackerData_v1';   // mesma chave de antes: seus dados continuam
const PALETTE = ['#10b981','#06b6d4','#3b82f6','#6366f1','#a855f7','#ec4899','#f43f5e','#f59e0b'];

const today = new Date();
const TODAY = { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };

// Estado global (o formato é compatível com a versão anterior)
let state = {
  year: TODAY.y,
  activeMonth: TODAY.m,
  color: PALETTE[0],
  darkMode: null,            // null = segue o tema do sistema
  habits: []                 // { id, name, color, marks: { "AAAA-M-D": true } }  (M começa em 0)
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
  const total = state.habits.reduce((s, h) => s + countMonthMarks(h, state.year, state.activeMonth), 0);
  $('summary').textContent = `${total} marcações em ${MONTHS[state.activeMonth]} · ${state.habits.length} hábito${state.habits.length === 1 ? '' : 's'}`;
}

function scrollToToday() {
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
  renderStats();
  renderTable();
}

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
let newHabitColor = PALETTE[0];

function addHabit(name) {
  name = (name || '').trim();
  if (!name) { toast('Digite o nome do hábito'); $('habitNameInput').focus(); return; }
  state.habits.push({ id: genId(), name, color: newHabitColor, marks: {} });
  state.color = newHabitColor;
  // Próxima cor da paleta para o próximo hábito
  const i = PALETTE.indexOf(newHabitColor);
  if (i >= 0) newHabitColor = PALETTE[(i + 1) % PALETTE.length];
  renderSwatches($('addSwatches'), newHabitColor, c => newHabitColor = c);
  saveState();
  render();
  $('habitNameInput').value = '';
  toast(`“${name}” adicionado`);
}

function toggleMark(habitId, day, cellEl) {
  const h = state.habits.find(x => x.id === habitId);
  if (!h) return;
  const key = markKey(state.year, state.activeMonth, day);
  if (h.marks[key]) delete h.marks[key];
  else h.marks[key] = true;
  saveState();
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

function openEdit(id) {
  const h = state.habits.find(x => x.id === id);
  if (!h) return;
  editingId = id;
  editColor = h.color;
  $('editNameInput').value = h.name;
  renderSwatches($('editSwatches'), editColor, c => editColor = c);
  const total = Object.keys(h.marks).length;
  $('editStats').innerHTML = `
    <div><b>🔥 ${currentStreak(h)}</b><span>Sequência atual</span></div>
    <div><b>${bestStreak(h)}</b><span>Melhor sequência</span></div>
    <div><b>${total}</b><span>Dias no total</span></div>`;
  $('editModal').hidden = false;
  setTimeout(() => $('editNameInput').focus(), 50);
}

function closeEdit() {
  $('editModal').hidden = true;
  editingId = null;
}

function saveEdit() {
  const h = state.habits.find(x => x.id === editingId);
  if (!h) return closeEdit();
  const name = $('editNameInput').value.trim();
  if (!name) { toast('O nome não pode ficar vazio'); return; }
  h.name = name;
  h.color = editColor;
  saveState();
  closeEdit();
  render();
}

function deleteHabit() {
  const idx = state.habits.findIndex(x => x.id === editingId);
  if (idx < 0) return closeEdit();
  const [removed] = state.habits.splice(idx, 1);
  saveState();
  closeEdit();
  render();
  toast(`“${removed.name}” excluído`, {
    label: 'Desfazer',
    run: () => { state.habits.splice(idx, 0, removed); saveState(); render(); }
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
      if (!confirm(`Substituir seus dados atuais por este backup (${parsed.habits.length} hábitos)?`)) return;
      state = Object.assign({ year: TODAY.y, activeMonth: TODAY.m, color: PALETTE[0], darkMode: null, habits: [] }, parsed);
      normalizeState();
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
// EVENTOS
// ============================================================
function bindEvents() {
  $('addHabitForm').addEventListener('submit', (e) => { e.preventDefault(); addHabit($('habitNameInput').value); });

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

  // Atalhos de teclado (PC)
  document.addEventListener('keydown', (e) => {
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
(function init() {
  loadState();
  newHabitColor = PALETTE[state.habits.length % PALETTE.length];
  renderSwatches($('addSwatches'), newHabitColor, c => newHabitColor = c);
  bindEvents();
  render();
  requestAnimationFrame(scrollToToday);
})();
