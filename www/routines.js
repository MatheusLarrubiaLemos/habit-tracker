// ============================================================
// ABA ROTINAS
// Hoje em destaque · Semana em blocos · Calendário do mês · Lista de rotinas
// ============================================================

let weekOffset = 0;            // 0 = semana atual, -1 = anterior, +1 = próxima
let editingRoutineId = null;   // rotina aberta na janela de edição (null = nova)
let routineDraft = null;       // cópia em edição
let openDayIso = null;         // dia aberto na janela do dia
let newRoutineForDay = null;   // se a nova rotina foi criada a partir de um dia

const todayIso = () => toIso(new Date(TODAY.y, TODAY.m, TODAY.d));
const isFutureIso = (iso) => iso > todayIso();
const ICON_CHECK_SM = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function routinesOn(iso) {
  return sortRoutines(state.routines.filter(r => r.isScheduledOn(iso)));
}

function longDate(iso) {
  const d = fromIso(iso);
  return `${WEEKDAY_NAMES[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()}`;
}

/** Botão de check de uma rotina num dia */
function checkHtml(r, iso, size = '') {
  const done = r.isDoneOn(iso);
  const future = isFutureIso(iso);
  return `<button class="r-check ${size}${done ? ' done' : ''}" style="--c:${r.color}"
    data-rid="${r.id}" data-date="${iso}" ${future ? 'disabled title="Ainda não chegou esse dia"' : ''}
    aria-label="${escapeHtml(r.name)}: ${done ? 'feita' : 'marcar como feita'}">${ICON_CHECK_SM}</button>`;
}

// ------------------------------------------------------------
// RENDER
// ------------------------------------------------------------
function renderRoutines() {
  renderTodayCard();
  renderWeek();
  renderCalendar();
  renderRoutineList();
  renderFooter();
}

function renderTodayCard() {
  const iso = todayIso();
  const list = routinesOn(iso);
  const done = list.filter(r => r.isDoneOn(iso)).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;
  const ring = 2 * Math.PI * 26;
  $('todayCard').innerHTML = `
    <div class="today-head">
      <div>
        <div class="today-label">Hoje</div>
        <div class="today-date">${longDate(iso)}</div>
        <div class="today-sub">${list.length
          ? (done === list.length ? 'Tudo feito por hoje! 🎉' : `${done} de ${list.length} rotina${list.length > 1 ? 's' : ''} feita${done === 1 ? '' : 's'}`)
          : 'Nenhuma rotina programada para hoje'}</div>
      </div>
      <svg class="ring" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
        <circle cx="32" cy="32" r="26" class="ring-bg"/>
        <circle cx="32" cy="32" r="26" class="ring-fg" stroke-dasharray="${ring}" stroke-dashoffset="${ring * (1 - pct / 100)}"/>
        <text x="32" y="37" text-anchor="middle">${pct}%</text>
      </svg>
    </div>
    <div class="today-list">
      ${list.map(r => `
        <div class="today-item${r.isDoneOn(iso) ? ' done' : ''}" style="--c:${r.color}">
          ${checkHtml(r, iso, 'lg')}
          <button class="today-name" data-edit-routine="${r.id}">
            <span>${escapeHtml(r.name)}</span>
            <small>${r.time ? r.time + ' · ' : ''}${r.everyDay ? 'todos os dias' : r.extraDates.includes(iso) ? 'só hoje' : r.scheduleLabel().split(' · ')[0]}</small>
          </button>
        </div>`).join('')}
      ${list.length ? '' : `<button class="ghost-btn" data-day="${iso}">+ Adicionar rotina hoje</button>`}
    </div>`;
}

function weekDates() {
  const base = new Date(TODAY.y, TODAY.m, TODAY.d + weekOffset * 7);
  base.setDate(base.getDate() - base.getDay());   // domingo
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(base); d.setDate(base.getDate() + i); return d; });
}

function renderWeek() {
  const dates = weekDates();
  const first = dates[0], last = dates[6];
  $('weekLabel').textContent = weekOffset === 0 ? 'Esta semana'
    : `${first.getDate()}/${first.getMonth() + 1} – ${last.getDate()}/${last.getMonth() + 1}`;
  $('weekGrid').innerHTML = dates.map(d => {
    const iso = toIso(d);
    const list = routinesOn(iso);
    const done = list.filter(r => r.isDoneOn(iso)).length;
    const cls = [iso === todayIso() ? 'today' : '', isFutureIso(iso) ? 'future' : '', list.length && done === list.length && !isFutureIso(iso) ? 'complete' : ''].join(' ');
    return `
      <div class="week-day ${cls}">
        <button class="week-head" data-day="${iso}" title="Abrir ${longDate(iso)}">
          <span class="wd">${WEEKDAY_SHORT[d.getDay()]}</span>
          <span class="dn">${d.getDate()}</span>
          ${list.length ? `<span class="wcount">${done}/${list.length}</span>` : ''}
        </button>
        <div class="week-items">
          ${list.map(r => `
            <div class="week-item${r.isDoneOn(iso) ? ' done' : ''}" style="--c:${r.color}">
              ${checkHtml(r, iso)}
              <span class="wi-name" title="${escapeHtml(r.name)}">${escapeHtml(r.name)}${r.time ? `<small>${r.time}</small>` : ''}</span>
            </div>`).join('') || '<div class="week-empty">—</div>'}
        </div>
      </div>`;
  }).join('');
}

function renderCalendar() {
  const y = state.year, m = state.activeMonth;
  $('calTitle').innerHTML = `${MONTHS[m]} <span class="year">${y}</span>`;
  const first = new Date(y, m, 1);
  const start = new Date(y, m, 1 - first.getDay());
  const cells = [];
  const weeks = Math.ceil((first.getDay() + daysInMonth(y, m)) / 7);
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const iso = toIso(d);
    const list = routinesOn(iso);
    const done = list.filter(r => r.isDoneOn(iso)).length;
    const outside = d.getMonth() !== m;
    const past = !isFutureIso(iso);
    const cls = [outside ? 'outside' : '', iso === todayIso() ? 'today' : '', d.getDay() === 0 || d.getDay() === 6 ? 'weekend' : '',
      past && list.length && done === list.length ? 'complete' : ''].join(' ');
    const shown = list.slice(0, 3);
    cells.push(`
      <button class="cal-day ${cls}" data-day="${iso}" aria-label="${longDate(iso)}: ${list.length} rotinas">
        <span class="cal-num">${d.getDate()}</span>
        <span class="cal-items">
          ${shown.map(r => `<span class="cal-chip${r.isDoneOn(iso) ? ' done' : ''}" style="--c:${r.color}"><i></i><em>${escapeHtml(r.name)}</em></span>`).join('')}
          ${list.length > 3 ? `<span class="cal-more">+${list.length - 3}</span>` : ''}
        </span>
        <span class="cal-dots">${list.map(r => `<i class="${r.isDoneOn(iso) ? 'done' : ''}" style="--c:${r.color}"></i>`).join('')}</span>
      </button>`);
  }
  $('calendar').innerHTML =
    WEEKDAY_SHORT.map(w => `<div class="cal-wd">${w}</div>`).join('') + cells.join('');
}

function renderRoutineList() {
  const list = sortRoutines(state.routines);
  $('routineList').innerHTML = list.length ? list.map(r => {
    const st = r.stats(30);
    return `
      <button class="routine-card" data-edit-routine="${r.id}" style="--c:${r.color}">
        <span class="rc-bar"></span>
        <span class="rc-info">
          <b>${escapeHtml(r.name)}</b>
          <small>${escapeHtml(r.scheduleLabel())}</small>
        </span>
        <span class="rc-stat">${st.pct === null ? '—' : st.pct + '%'}<small>30 dias</small></span>
      </button>`;
  }).join('') : `
    <div class="empty">
      <div class="empty-icon">🗓️</div>
      <h3>Nenhuma rotina ainda</h3>
      <p>Crie rotinas com dias certos, como “Estudar” às terças e quartas.</p>
    </div>`;
}

/** No celular a semana rola de lado: deixa o dia de hoje à vista */
function scrollWeekToToday() {
  const grid = $('weekGrid');
  const el = grid.querySelector('.week-day.today');
  if (el && grid.scrollWidth > grid.clientWidth) grid.scrollLeft = Math.max(0, el.offsetLeft - grid.offsetLeft - 8);
}

function renderRoutinesFooter() {
  const iso = todayIso();
  const list = routinesOn(iso);
  const done = list.filter(r => r.isDoneOn(iso)).length;
  $('summary').textContent = `${state.routines.length} rotina${state.routines.length === 1 ? '' : 's'} · hoje ${done}/${list.length} feitas`;
}

// ------------------------------------------------------------
// AÇÕES
// ------------------------------------------------------------
function toggleRoutine(rid, iso) {
  const r = state.routines.find(x => x.id === rid);
  if (!r || isFutureIso(iso)) return;
  const value = !r.isDoneOn(iso);
  r.setDone(iso, value);
  saveState();
  queueOp({ t: 'mark', k: 'routine', id: r.id, date: iso, done: value });
  if (value && navigator.vibrate) navigator.vibrate(12);
  renderRoutines();
  if (openDayIso) renderDayModal();
  const el = document.querySelector(`#routinesView .r-check[data-rid="${rid}"][data-date="${iso}"]`);
  if (el && value) el.classList.add('pop');
}

function changeRoutineSchedule(r) {
  saveState();
  queueOp({ t: 'update', k: 'routine', id: r.id });
  renderRoutines();
  if (openDayIso) renderDayModal();
}

// ------------------------------------------------------------
// JANELA DO DIA
// ------------------------------------------------------------
function openDay(iso) {
  openDayIso = iso;
  renderDayModal();
  $('dayModal').hidden = false;
}
function closeDay() { $('dayModal').hidden = true; openDayIso = null; }

function renderDayModal() {
  const iso = openDayIso;
  const list = routinesOn(iso);
  const others = sortRoutines(state.routines.filter(r => !r.isScheduledOn(iso)));
  $('dayTitle').textContent = longDate(iso) + (iso === todayIso() ? ' · hoje' : '');
  $('dayList').innerHTML = list.length ? list.map(r => `
    <div class="day-item${r.isDoneOn(iso) ? ' done' : ''}" style="--c:${r.color}">
      ${checkHtml(r, iso)}
      <span class="di-name"><b>${escapeHtml(r.name)}</b><small>${r.time ? r.time + ' · ' : ''}${r.extraDates.includes(iso) ? 'só neste dia' : escapeHtml(r.scheduleLabel().split(' · ')[0])}</small></span>
      <button class="di-remove" data-remove-rid="${r.id}" title="Tirar desta data (a programação continua)">Tirar</button>
    </div>`).join('') : '<p class="modal-text">Nenhuma rotina neste dia.</p>';
  $('dayAddRow').hidden = !others.length;
  $('dayAddSelect').innerHTML = others.map(r => `<option value="${r.id}">${escapeHtml(r.name)} (${escapeHtml(r.scheduleLabel())})</option>`).join('');
}

// ------------------------------------------------------------
// JANELA DA ROTINA (criar / editar)
// ------------------------------------------------------------
function openRoutine(id, forDayIso = null) {
  const r = id ? state.routines.find(x => x.id === id) : null;
  editingRoutineId = r ? r.id : null;
  newRoutineForDay = r ? null : forDayIso;
  routineDraft = r ? new Routine(r) : new Routine({ name: '', color: PALETTE[(state.routines.length + 2) % PALETTE.length], days: [] });
  $('routineTitle').textContent = r ? 'Editar rotina' : 'Nova rotina';
  $('routineNameInput').value = routineDraft.name;
  $('routineTimeInput').value = routineDraft.time;
  $('deleteRoutineBtn').hidden = !r;
  renderSwatches($('routineSwatches'), routineDraft.color, c => routineDraft.color = c);
  renderDayChips();
  if (r) {
    const st = r.stats(30);
    $('routineStats').innerHTML = `
      <div><b>${st.done}/${st.planned}</b><span>Feitas em 30 dias</span></div>
      <div><b>${st.pct === null ? '—' : st.pct + '%'}</b><span>Conclusão</span></div>
      <div><b>${Object.keys(r.done).length}</b><span>Total feitas</span></div>`;
    $('routineStats').hidden = false;
  } else {
    $('routineStats').hidden = true;
  }
  $('routineHint').textContent = forDayIso && !r ? `Sem dias marcados, ela entra só em ${longDate(forDayIso).toLowerCase()}.` : '';
  $('routineModal').hidden = false;
  setTimeout(() => $('routineNameInput').focus(), 50);
}
function closeRoutine() { $('routineModal').hidden = true; editingRoutineId = null; routineDraft = null; }

function renderDayChips() {
  $('dayChips').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d =>
    `<button type="button" class="day-chip${routineDraft.days.includes(d) ? ' on' : ''}" data-wd="${d}" title="${WEEKDAY_NAMES[d]}">${WEEKDAY_SHORT[d]}</button>`).join('');
}

function setDraftDays(days) {
  routineDraft.days = [...new Set(days)].sort();
  renderDayChips();
}

function saveRoutine() {
  const name = $('routineNameInput').value.trim();
  if (!name) { toast('Dê um nome para a rotina'); $('routineNameInput').focus(); return; }
  routineDraft.name = name.slice(0, 60);
  routineDraft.time = $('routineTimeInput').value || '';
  if (editingRoutineId) {
    const r = state.routines.find(x => x.id === editingRoutineId);
    Object.assign(r, { name: routineDraft.name, color: routineDraft.color, time: routineDraft.time, days: routineDraft.days });
    saveState();
    queueOp({ t: 'update', k: 'routine', id: r.id });
    toast('Rotina atualizada');
  } else {
    const r = new Routine({ ...routineDraft, id: undefined });
    if (newRoutineForDay) {
      // se foi criada a partir de um dia anterior a hoje, já vale a partir desse dia
      if (newRoutineForDay < r.startDate) r.startDate = newRoutineForDay;
      if (!r.isScheduledOn(newRoutineForDay)) r.addOn(newRoutineForDay);
    }
    state.routines.push(r);
    saveState();
    queueOp({ t: 'create', k: 'routine', id: r.id });
    toast(`Rotina “${r.name}” criada`);
  }
  closeRoutine();
  renderRoutines();
  if (openDayIso) renderDayModal();
}

function deleteRoutine() {
  const idx = state.routines.findIndex(x => x.id === editingRoutineId);
  if (idx < 0) return closeRoutine();
  const [removed] = state.routines.splice(idx, 1);
  saveState();
  queueDelete(removed);
  closeRoutine();
  renderRoutines();
  toast(`“${removed.name}” excluída`, {
    label: 'Desfazer',
    run: () => { state.routines.splice(idx, 0, removed); saveState(); queueRestore(removed); renderRoutines(); }
  });
}

// ------------------------------------------------------------
// EVENTOS
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Cliques dentro da aba Rotinas e da janela do dia (delegação)
  const onClick = (e) => {
    const check = e.target.closest('.r-check');
    if (check) return toggleRoutine(check.dataset.rid, check.dataset.date);
    const edit = e.target.closest('[data-edit-routine]');
    if (edit) return openRoutine(edit.dataset.editRoutine);
    const remove = e.target.closest('[data-remove-rid]');
    if (remove) {
      const r = state.routines.find(x => x.id === remove.dataset.removeRid);
      if (r) { r.removeFrom(openDayIso); changeRoutineSchedule(r); toast(`“${r.name}” tirada deste dia`); }
      return;
    }
    const day = e.target.closest('[data-day]');
    if (day) return openDay(day.dataset.day);
  };
  $('routinesView').addEventListener('click', onClick);
  $('dayModal').addEventListener('click', (e) => {
    if (e.target.id === 'dayModal') return closeDay();
    onClick(e);
  });

  $('newRoutineBtn').onclick = () => openRoutine(null);
  $('prevWeekBtn').onclick = () => { weekOffset--; renderWeek(); };
  $('nextWeekBtn').onclick = () => { weekOffset++; renderWeek(); };
  $('thisWeekBtn').onclick = () => { weekOffset = 0; renderWeek(); scrollWeekToToday(); };
  $('calPrevBtn').onclick = () => goTo(state.year, state.activeMonth - 1);
  $('calNextBtn').onclick = () => goTo(state.year, state.activeMonth + 1);
  $('calTodayBtn').onclick = () => goTo(TODAY.y, TODAY.m);

  // Janela do dia
  $('closeDayBtn').onclick = closeDay;
  $('dayAddBtn').onclick = () => {
    const r = state.routines.find(x => x.id === $('dayAddSelect').value);
    if (!r) return;
    r.addOn(openDayIso);
    changeRoutineSchedule(r);
    toast(`“${r.name}” adicionada neste dia`);
  };
  $('dayNewBtn').onclick = () => openRoutine(null, openDayIso);

  // Janela da rotina
  $('dayChips').addEventListener('click', (e) => {
    const chip = e.target.closest('.day-chip');
    if (!chip) return;
    const wd = Number(chip.dataset.wd);
    setDraftDays(routineDraft.days.includes(wd) ? routineDraft.days.filter(d => d !== wd) : [...routineDraft.days, wd]);
  });
  $('everyDayBtn').onclick = () => setDraftDays([0, 1, 2, 3, 4, 5, 6]);
  $('weekdaysBtn').onclick = () => setDraftDays([1, 2, 3, 4, 5]);
  $('clearDaysBtn').onclick = () => setDraftDays([]);
  $('saveRoutineBtn').onclick = saveRoutine;
  $('cancelRoutineBtn').onclick = closeRoutine;
  $('deleteRoutineBtn').onclick = deleteRoutine;
  $('routineNameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveRoutine(); });
  $('routineModal').addEventListener('click', (e) => { if (e.target.id === 'routineModal') closeRoutine(); });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('routineModal').hidden) closeRoutine();
    else if (!$('dayModal').hidden) closeDay();
  });
});
