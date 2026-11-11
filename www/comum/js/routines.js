// ============================================================
// TELA AGENDA  (rotinas que se repetem + compromissos de uma vez só)
// Hoje em destaque · Semana em blocos · Calendário do mês
// Janelas: dia, rotina e compromisso
// (o arquivo continua se chamando routines.js por compatibilidade)
// ============================================================

let weekOffset = 0;            // 0 = semana atual, -1 = anterior, +1 = próxima
let editingRoutineId = null;   // rotina aberta na janela de edição (null = nova)
let routineDraft = null;       // cópia em edição
let openDayIso = null;         // dia aberto na janela do dia
let newRoutineForDay = null;   // se a nova rotina foi criada a partir de um dia
let editingApptId = null;      // compromisso aberto na janela (null = novo)
let apptColor = null;          // cor escolhida na janela do compromisso

const todayIso = () => toIso(new Date(TODAY.y, TODAY.m, TODAY.d));
const isFutureIso = (iso) => iso > todayIso();
const ICON_CHECK_SM = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_PIN = '<svg class="pin" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M12 2l2.6 6.3 6.8.6-5.2 4.5 1.6 6.6L12 16.6 6.2 20l1.6-6.6L2.6 8.9l6.8-.6z" fill="currentColor"/></svg>';

const isAppt = (item) => item.kind === 'appointment';

/** Só as rotinas de um dia (sem compromissos) */
function routinesOn(iso) {
  return sortAgenda(state.routines.filter(r => r.isScheduledOn(iso)));
}

function longDate(iso) {
  const d = fromIso(iso);
  return `${WEEKDAY_NAMES[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()}`;
}
function shortDate(iso) {
  const d = fromIso(iso);
  return `${WEEKDAY_SHORT[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()].slice(0, 3).toLowerCase()}`;
}

/** Texto curto que explica o item num dia: "compromisso", "todos os dias", "Ter, Qua", "só neste dia" */
function itemSubLabel(item, iso, soloLabel = 'só neste dia') {
  if (isAppt(item)) return 'compromisso';
  if (item.everyDay) return 'todos os dias';
  if (item.extraDates.includes(iso)) return soloLabel;
  return item.scheduleLabel().split(' · ')[0];
}

/** Botão de check de um item da agenda num dia (quadrado = rotina, redondo = compromisso) */
function checkHtml(item, iso, size = '') {
  const done = item.isDoneOn(iso);
  const future = isFutureIso(iso);
  return `<button class="r-check ${size}${done ? ' done' : ''}${isAppt(item) ? ' appt' : ''}" style="--c:${item.color}"
    data-kind="${item.kind}" data-id="${item.id}" data-date="${iso}" ${future ? 'disabled title="Ainda não chegou esse dia"' : ''}
    aria-label="${escapeHtml(item.name)}: ${done ? 'feito' : 'marcar como feito'}">${ICON_CHECK_SM}</button>`;
}

/** Atributo para abrir a edição do item ao tocar no nome */
const editAttr = (item) => isAppt(item) ? `data-edit-appt="${item.id}"` : `data-edit-routine="${item.id}"`;

// ------------------------------------------------------------
// RENDER
// ------------------------------------------------------------
function renderRoutines() {
  renderTodayCard();
  renderWeek();
  renderCalendar();
}

function renderTodayCard() {
  const iso = todayIso();
  const list = agendaOn(iso);
  const done = list.filter(r => r.isDoneOn(iso)).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;
  const ring = 2 * Math.PI * 26;
  $('todayCard').innerHTML = `
    <div class="today-head">
      <div>
        <div class="today-label">Hoje</div>
        <div class="today-date">${longDate(iso)}</div>
        <div class="today-sub">${list.length
          ? (done === list.length ? 'Tudo feito por hoje! 🎉' : `${done} de ${list.length} feito${done === 1 ? '' : 's'}`)
          : 'Nada na agenda hoje'}</div>
      </div>
      <svg class="ring" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
        <circle cx="32" cy="32" r="26" class="ring-bg"/>
        <circle cx="32" cy="32" r="26" class="ring-fg" stroke-dasharray="${ring}" stroke-dashoffset="${ring * (1 - pct / 100)}"/>
        <text x="32" y="37" text-anchor="middle">${pct}%</text>
      </svg>
    </div>
    <div class="today-list">
      ${list.map(r => `
        <div class="today-item${r.isDoneOn(iso) ? ' done' : ''}${isAppt(r) ? ' appt' : ''}" style="--c:${r.color}">
          ${checkHtml(r, iso, 'lg')}
          <button class="today-name" ${editAttr(r)}>
            <span>${isAppt(r) ? ICON_PIN + ' ' : ''}${escapeHtml(r.name)}</span>
            <small>${r.time ? r.time + ' · ' : ''}${itemSubLabel(r, iso, 'só hoje')}</small>
          </button>
        </div>`).join('')}
      ${list.length ? '' : `<button class="ghost-btn" data-day="${iso}">+ Adicionar algo hoje</button>`}
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
    const list = agendaOn(iso);
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
            <div class="week-item${r.isDoneOn(iso) ? ' done' : ''}${isAppt(r) ? ' appt' : ''}" style="--c:${r.color}">
              ${checkHtml(r, iso)}
              <span class="wi-name" title="${escapeHtml(r.name)}${isAppt(r) ? ' (compromisso)' : ''}">${escapeHtml(r.name)}${r.time ? `<small>${r.time}</small>` : ''}</span>
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
    const list = agendaOn(iso);
    // compromissos aparecem primeiro no quadradinho do dia (são os mais importantes de lembrar)
    const shownList = [...list.filter(isAppt), ...list.filter(r => !isAppt(r))];
    const done = list.filter(r => r.isDoneOn(iso)).length;
    const outside = d.getMonth() !== m;
    const past = !isFutureIso(iso);
    const cls = [outside ? 'outside' : '', iso === todayIso() ? 'today' : '', d.getDay() === 0 || d.getDay() === 6 ? 'weekend' : '',
      past && list.length && done === list.length ? 'complete' : '', list.some(isAppt) ? 'has-appt' : ''].join(' ');
    const shown = shownList.slice(0, 3);
    cells.push(`
      <button class="cal-day ${cls}" data-day="${iso}" aria-label="${longDate(iso)}: ${list.length} na agenda">
        <span class="cal-num">${d.getDate()}</span>
        <span class="cal-items">
          ${shown.map(r => `<span class="cal-chip${r.isDoneOn(iso) ? ' done' : ''}${isAppt(r) ? ' appt' : ''}" style="--c:${r.color}"><i></i><em>${escapeHtml(r.name)}</em></span>`).join('')}
          ${list.length > 3 ? `<span class="cal-more">+${list.length - 3}</span>` : ''}
        </span>
        <span class="cal-dots">${shownList.map(r => `<i class="${r.isDoneOn(iso) ? 'done' : ''}${isAppt(r) ? ' appt' : ''}" style="--c:${r.color}"></i>`).join('')}</span>
      </button>`);
  }
  $('calendar').innerHTML =
    WEEKDAY_SHORT.map(w => `<div class="cal-wd">${w}</div>`).join('') + cells.join('');
}

function renderRoutineList() {
  const list = sortAgenda(state.routines);
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
    <div class="empty small"><p>Nenhuma rotina. Rotinas se repetem nos dias que você escolher, como “Estudar” às terças e quartas.</p></div>`;
}

/** Lista de compromissos (Configurar): próximos + botão para limpar os que já passaram */
function renderApptList() {
  const next = upcomingAppointments();
  const past = state.appointments.filter(a => a.isPast());
  $('apptList').innerHTML = next.length ? next.map(a => `
      <button class="routine-card appt-card${a.done ? ' done' : ''}" data-edit-appt="${a.id}" style="--c:${a.color}">
        <span class="ac-date"><b>${fromIso(a.date).getDate()}</b><small>${MONTHS[fromIso(a.date).getMonth()].slice(0, 3)}</small></span>
        <span class="rc-info">
          <b>${escapeHtml(a.name)}</b>
          <small>${shortDate(a.date)}${a.time ? ' · ' + a.time : ''} · ${a.whenLabel()}</small>
        </span>
        <span class="rc-edit">Editar</span>
      </button>`).join('') : `
    <div class="empty small"><p>Nenhum compromisso pela frente. Compromissos acontecem uma vez só, como um casamento ou uma consulta.</p></div>`;
  $('pastApptRow').hidden = !past.length;
  $('pastApptText').textContent = past.length === 1
    ? '1 compromisso que já passou (continua no calendário)'
    : `${past.length} compromissos que já passaram (continuam no calendário)`;
}

/** No celular a semana rola de lado: deixa o dia de hoje à vista */
function scrollWeekToToday() {
  const grid = $('weekGrid');
  const el = grid.querySelector('.week-day.today');
  if (el && grid.scrollWidth > grid.clientWidth) grid.scrollLeft = Math.max(0, el.offsetLeft - grid.offsetLeft - 8);
}

function renderRoutinesFooter() {
  const iso = todayIso();
  const list = agendaOn(iso);
  const done = list.filter(r => r.isDoneOn(iso)).length;
  const nA = upcomingAppointments().length;
  $('summary').textContent = `${state.routines.length} rotina${state.routines.length === 1 ? '' : 's'} · ${nA} compromisso${nA === 1 ? '' : 's'} pela frente · hoje ${done}/${list.length} feitos`;
}

// ------------------------------------------------------------
// AÇÕES
// ------------------------------------------------------------
function findAgendaItem(kind, id) {
  return kind === 'appointment' ? state.appointments.find(x => x.id === id) : state.routines.find(x => x.id === id);
}

/** Marca / desmarca um item da agenda (rotina ou compromisso) como feito num dia */
function toggleAgenda(kind, id, iso) {
  const item = findAgendaItem(kind, id);
  if (!item || isFutureIso(iso)) return;
  const value = !item.isDoneOn(iso);
  item.setDone(iso, value);
  saveState();
  if (isAppt(item)) queueOp({ t: 'mark', k: 'appointment', id: item.id });
  else queueOp({ t: 'mark', k: 'routine', id: item.id, date: iso, done: value });
  if (value && navigator.vibrate) navigator.vibrate(12);
  renderView();
  if (openDayIso) renderDayModal();
  const el = document.querySelector(`.view:not([hidden]) .r-check[data-id="${id}"][data-date="${iso}"]`);
  if (el && value) el.classList.add('pop');
}
const toggleRoutine = (rid, iso) => toggleAgenda('routine', rid, iso);   // nome antigo

function changeRoutineSchedule(r) {
  saveState();
  queueOp({ t: 'update', k: 'routine', id: r.id });
  renderView();
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
  const list = agendaOn(iso);
  const others = sortAgenda(state.routines.filter(r => !r.isScheduledOn(iso)));
  $('dayTitle').textContent = longDate(iso) + (iso === todayIso() ? ' · hoje' : '');
  $('dayList').innerHTML = list.length ? list.map(r => `
    <div class="day-item${r.isDoneOn(iso) ? ' done' : ''}${isAppt(r) ? ' appt' : ''}" style="--c:${r.color}">
      ${checkHtml(r, iso)}
      <button class="di-name" ${editAttr(r)} title="Editar">
        <b>${isAppt(r) ? ICON_PIN + ' ' : ''}${escapeHtml(r.name)}</b>
        <small>${r.time ? r.time + ' · ' : ''}${isAppt(r) ? 'compromisso (só neste dia)' : escapeHtml(itemSubLabel(r, iso))}${isAppt(r) && r.note ? ' · ' + escapeHtml(r.note) : ''}</small>
      </button>
      ${isAppt(r)
        ? `<button class="di-remove" data-delete-appt="${r.id}" title="Excluir este compromisso">Excluir</button>`
        : `<button class="di-remove" data-remove-rid="${r.id}" title="Tirar desta data (a programação continua)">Tirar</button>`}
    </div>`).join('') : '<p class="modal-text">Nada na agenda neste dia.</p>';
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
  renderView();
  if (openDayIso) renderDayModal();
}

function deleteRoutine() {
  const idx = state.routines.findIndex(x => x.id === editingRoutineId);
  if (idx < 0) return closeRoutine();
  const [removed] = state.routines.splice(idx, 1);
  saveState();
  queueDelete(removed);
  closeRoutine();
  renderView();
  if (openDayIso) renderDayModal();
  toast(`“${removed.name}” excluída`, {
    label: 'Desfazer',
    run: () => { state.routines.splice(idx, 0, removed); saveState(); queueRestore(removed); renderView(); if (openDayIso) renderDayModal(); }
  });
}

// ------------------------------------------------------------
// JANELA DO COMPROMISSO (criar / editar) — acontece uma vez só
// ------------------------------------------------------------
function openAppt(id, forDayIso = null) {
  const a = id ? state.appointments.find(x => x.id === id) : null;
  editingApptId = a ? a.id : null;
  apptColor = a ? a.color : '#f59e0b';
  $('apptTitle').textContent = a ? 'Editar compromisso' : 'Novo compromisso';
  $('apptNameInput').value = a ? a.name : '';
  $('apptDateInput').value = a ? a.date : (forDayIso || todayIso());
  $('apptTimeInput').value = a ? a.time : '';
  $('apptNoteInput').value = a ? a.note : '';
  $('deleteApptBtn').hidden = !a;
  $('saveApptBtn').textContent = a ? 'Salvar' : 'Criar compromisso';
  renderSwatches($('apptSwatches'), apptColor, c => apptColor = c);
  $('apptModal').hidden = false;
  setTimeout(() => $('apptNameInput').focus(), 50);
}
function closeAppt() { $('apptModal').hidden = true; editingApptId = null; }

function saveAppt() {
  const name = $('apptNameInput').value.trim();
  const date = $('apptDateInput').value;
  if (!name) { toast('Dê um nome para o compromisso'); $('apptNameInput').focus(); return; }
  if (!ISO_RE.test(date)) { toast('Escolha a data do compromisso'); $('apptDateInput').focus(); return; }
  const data = { name, date, time: $('apptTimeInput').value || '', note: $('apptNoteInput').value, color: apptColor };
  if (editingApptId) {
    const a = state.appointments.find(x => x.id === editingApptId);
    const fresh = new Appointment({ ...a, ...data });
    if (fresh.date !== a.date) fresh.done = false;   // mudou de dia: começa como não feito
    Object.assign(a, { name: fresh.name, date: fresh.date, time: fresh.time, note: fresh.note, color: fresh.color, done: fresh.done });
    saveState();
    queueOp({ t: 'update', k: 'appointment', id: a.id });
    toast('Compromisso atualizado');
  } else {
    const a = new Appointment(data);
    state.appointments.push(a);
    saveState();
    queueOp({ t: 'create', k: 'appointment', id: a.id });
    toast(`Compromisso “${a.name}” marcado para ${shortDate(a.date)}`);
  }
  closeAppt();
  renderView();
  if (openDayIso) renderDayModal();
}

function deleteAppt(id) {
  const idx = state.appointments.findIndex(x => x.id === id);
  if (idx < 0) return;
  const [removed] = state.appointments.splice(idx, 1);
  saveState();
  queueDelete(removed);
  if (!$('apptModal').hidden) closeAppt();
  renderView();
  if (openDayIso) renderDayModal();
  toast(`“${removed.name}” excluído`, {
    label: 'Desfazer',
    run: () => { state.appointments.splice(idx, 0, removed); saveState(); queueRestore(removed); renderView(); if (openDayIso) renderDayModal(); }
  });
}

/** Apaga de vez os compromissos que já passaram */
function clearPastAppts() {
  const past = state.appointments.filter(a => a.isPast());
  if (!past.length) return;
  const n = past.length;
  if (!confirm(`Apagar ${n === 1 ? '1 compromisso que já passou' : n + ' compromissos que já passaram'}?\nEles também somem do calendário. Não dá para desfazer.`)) return;
  state.appointments = state.appointments.filter(a => !a.isPast());
  past.forEach(queueDelete);
  saveState();
  renderView();
  toast(n === 1 ? '1 compromisso antigo apagado' : `${n} compromissos antigos apagados`);
}

// ------------------------------------------------------------
// EVENTOS
// ------------------------------------------------------------
/** Cliques comuns da agenda (tela Agenda, janela do dia, Início, Configurar) */
function handleAgendaClick(e) {
  const check = e.target.closest('.r-check[data-kind]');
  if (check) { toggleAgenda(check.dataset.kind, check.dataset.id, check.dataset.date); return true; }
  const editR = e.target.closest('[data-edit-routine]');
  if (editR) { openRoutine(editR.dataset.editRoutine); return true; }
  const editA = e.target.closest('[data-edit-appt]');
  if (editA) { openAppt(editA.dataset.editAppt); return true; }
  const delA = e.target.closest('[data-delete-appt]');
  if (delA) { deleteAppt(delA.dataset.deleteAppt); return true; }
  const remove = e.target.closest('[data-remove-rid]');
  if (remove) {
    const r = state.routines.find(x => x.id === remove.dataset.removeRid);
    if (r) { r.removeFrom(openDayIso); changeRoutineSchedule(r); toast(`“${r.name}” tirada deste dia`); }
    return true;
  }
  const day = e.target.closest('[data-day]');
  if (day) { openDay(day.dataset.day); return true; }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  $('routinesView').addEventListener('click', handleAgendaClick);
  $('dayModal').addEventListener('click', (e) => {
    if (e.target.id === 'dayModal') return closeDay();
    handleAgendaClick(e);
  });

  $('newRoutineBtn').onclick = () => openRoutine(null);
  $('newApptBtn').onclick = () => openAppt(null);
  $('prevWeekBtn').onclick = () => { weekOffset--; renderWeek(); };
  $('nextWeekBtn').onclick = () => { weekOffset++; renderWeek(); };
  $('thisWeekBtn').onclick = () => { weekOffset = 0; renderWeek(); scrollWeekToToday(); };
  $('calPrevBtn').onclick = () => goTo(state.year, state.activeMonth - 1);
  $('calNextBtn').onclick = () => goTo(state.year, state.activeMonth + 1);
  $('calTodayBtn').onclick = () => goTo(TODAY.y, TODAY.m);

  // Janela do dia
  $('closeDayBtn').onclick = closeDay;
  $('dayApptBtn').onclick = () => openAppt(null, openDayIso);
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

  // Janela do compromisso
  $('saveApptBtn').onclick = saveAppt;
  $('cancelApptBtn').onclick = closeAppt;
  $('deleteApptBtn').onclick = () => deleteAppt(editingApptId);
  $('apptNameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveAppt(); });
  $('apptModal').addEventListener('click', (e) => { if (e.target.id === 'apptModal') closeAppt(); });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('apptModal').hidden) closeAppt();
    else if (!$('routineModal').hidden) closeRoutine();
    else if (!$('dayModal').hidden) closeDay();
  });
});
