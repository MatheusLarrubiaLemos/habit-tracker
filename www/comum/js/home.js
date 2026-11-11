// ============================================================
// TELA INÍCIO (resumão unificado) e TELA CONFIGURAR
// Início: hábitos + agenda (rotinas e compromissos) de hoje, semana, amanhã e próximos compromissos
// ============================================================

// ------------------------------------------------------------
// CONTAS DO RESUMO
// ------------------------------------------------------------
/** Hábitos + agenda (rotinas e compromissos) de um dia: quantos tinha e quantos foram feitos */
function dayTotals(date) {
  const iso = toIso(date);
  const agenda = agendaOn(iso);
  const aDone = agenda.filter(r => r.isDoneOn(iso)).length;
  const y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
  const hDone = state.habits.filter(h => h.isMarked(y, m, d)).length;
  return {
    iso, agenda, aDone, hTotal: state.habits.length, hDone,
    total: agenda.length + state.habits.length,
    done: aDone + hDone
  };
}

/** Semana atual (dom → hoje): % de tudo que estava previsto e foi feito */
function weekSummary() {
  const start = new Date(TODAY.y, TODAY.m, TODAY.d);
  start.setDate(start.getDate() - start.getDay());
  let total = 0, done = 0;
  for (let d = new Date(start); d <= new Date(TODAY.y, TODAY.m, TODAY.d); d.setDate(d.getDate() + 1)) {
    const t = dayTotals(d);
    total += t.total; done += t.done;
  }
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

function ringSvg(pct, size = 64, stroke = 6, cls = '') {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return `<svg class="ring ${cls}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg" style="stroke-width:${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" style="stroke-width:${stroke}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/>
    <text x="50%" y="50%" dy=".35em" text-anchor="middle">${pct}%</text>
  </svg>`;
}

// ------------------------------------------------------------
// INÍCIO
// ------------------------------------------------------------
function renderHome() {
  const now = new Date(TODAY.y, TODAY.m, TODAY.d);
  const t = dayTotals(now);
  const pct = t.total ? Math.round((t.done / t.total) * 100) : 0;
  const h = new Date().getHours();
  const greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const week = weekSummary();
  const monthElapsed = TODAY.d * state.habits.length;
  const monthMarks = state.habits.reduce((s, x) => s + countMonthMarks(x, TODAY.y, TODAY.m), 0);
  const monthPct = monthElapsed ? Math.round((monthMarks / monthElapsed) * 100) : 0;
  const best = state.habits.reduce((b, x) => { const s = currentStreak(x); return s > b.s ? { s, name: x.name } : b; }, { s: 0, name: '' });
  const message = !t.total ? 'Comece criando seus hábitos, rotinas e compromissos.'
    : t.done === t.total ? 'Tudo feito por hoje! 🎉'
    : `Faltam ${t.total - t.done} de ${t.total} para fechar o dia.`;

  // 1) Destaque do dia
  $('homeHero').innerHTML = `
    <div class="hero-text">
      <div class="today-label">${greet}!</div>
      <div class="today-date">${longDate(t.iso)}</div>
      <div class="today-sub">${message}</div>
    </div>
    ${ringSvg(pct, 84, 8)}`;

  // 2) Resumão
  $('homeStats').innerHTML = `
    <button class="stat stat-link" data-go="routines">
      <div class="stat-label">Agenda hoje</div>
      <div class="stat-value">${t.aDone}<small> / ${t.agenda.length}</small></div>
      <div class="progress"><span style="width:${t.agenda.length ? (t.aDone / t.agenda.length) * 100 : 0}%"></span></div>
    </button>
    <button class="stat stat-link" data-go="habits">
      <div class="stat-label">Hábitos hoje</div>
      <div class="stat-value">${t.hDone}<small> / ${t.hTotal}</small></div>
      <div class="progress"><span style="width:${t.hTotal ? (t.hDone / t.hTotal) * 100 : 0}%"></span></div>
    </button>
    <div class="stat">
      <div class="stat-label">Esta semana</div>
      <div class="stat-value">${week.total ? week.pct + '%' : '—'}</div>
      <div class="habit-meta">${week.done} de ${week.total} concluídos</div>
    </div>
    <div class="stat">
      <div class="stat-label">Hábitos no mês</div>
      <div class="stat-value">${monthElapsed ? monthPct + '%' : '—'}</div>
      <div class="habit-meta">${MONTHS[TODAY.m]}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Maior sequência</div>
      <div class="stat-value">${best.s ? '🔥 ' + best.s : '0'}<small> ${best.s === 1 ? 'dia' : 'dias'}</small></div>
      <div class="habit-meta">${best.s ? escapeHtml(best.name) : 'Marque um hábito hoje'}</div>
    </div>`;

  // 3) Seu dia: agenda (rotinas + compromissos) e hábitos de hoje, juntos
  const iso = t.iso;
  $('homeRoutines').innerHTML = t.agenda.length ? t.agenda.map(r => `
    <div class="home-item${r.isDoneOn(iso) ? ' done' : ''}${isAppt(r) ? ' appt' : ''}" style="--c:${r.color}">
      ${checkHtml(r, iso)}
      <button class="hi-name" ${editAttr(r)} title="Editar"><b>${escapeHtml(r.name)}</b><small>${r.time || 'sem horário'}${isAppt(r) && r.note ? ' · ' + escapeHtml(r.note) : ''}</small></button>
      <span class="hi-tag${isAppt(r) ? ' appt' : ''}">${isAppt(r) ? 'Compromisso' : 'Rotina'}</span>
    </div>`).join('')
    : `<p class="home-empty">Nada na agenda hoje. <a href="#" data-new-appt>+ Compromisso</a> · <a href="#" data-go="routines">Ver agenda</a></p>`;

  $('homeHabits').innerHTML = state.habits.length ? state.habits.map(x => {
    const done = x.isMarked(TODAY.y, TODAY.m, TODAY.d);
    const streak = currentStreak(x);
    return `
    <div class="home-item${done ? ' done' : ''}" style="--c:${x.color}">
      <button class="r-check${done ? ' done' : ''}" style="--c:${x.color}" data-habit-today="${x.id}" aria-label="${escapeHtml(x.name)}: ${done ? 'feito hoje' : 'marcar hoje'}">${ICON_CHECK_SM}</button>
      <span class="hi-name"><b>${escapeHtml(x.name)}</b><small class="streak ${streak >= 3 ? 'hot' : ''}">🔥 ${streak} ${streak === 1 ? 'dia' : 'dias'}</small></span>
      <span class="hi-tag habit">Hábito</span>
    </div>`;
  }).join('')
    : `<p class="home-empty">Nenhum hábito ainda. <a href="#" data-go="manage">Criar hábito</a></p>`;

  // 4) Semana em miniatura
  const start = new Date(TODAY.y, TODAY.m, TODAY.d);
  start.setDate(start.getDate() - start.getDay());
  $('homeWeek').innerHTML = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const w = dayTotals(d);
    const isT = w.iso === todayIso();
    const fut = isFutureIso(w.iso);
    const p = w.total ? Math.round((w.done / w.total) * 100) : 0;
    return `
      <button class="hw-day${isT ? ' today' : ''}${fut ? ' future' : ''}" data-day="${w.iso}" title="${longDate(w.iso)}">
        <span class="wd">${WEEKDAY_SHORT[d.getDay()]}</span>
        <span class="dn">${d.getDate()}</span>
        <span class="hw-bar"><i style="height:${fut ? 0 : p}%"></i></span>
        <span class="hw-pct">${fut ? (w.agenda.length ? w.agenda.length + (w.agenda.length === 1 ? ' item' : ' itens') : '') : w.total ? p + '%' : '—'}</span>
        ${w.agenda.some(isAppt) ? '<span class="hw-star" title="Tem compromisso">' + ICON_PIN + '</span>' : ''}
      </button>`;
  }).join('');

  // 5) Amanhã
  const tm = new Date(TODAY.y, TODAY.m, TODAY.d + 1);
  const next = agendaOn(toIso(tm));
  $('homeTomorrow').innerHTML = next.length
    ? next.map(r => `<span class="tm-chip${isAppt(r) ? ' appt' : ''}" style="--c:${r.color}">${isAppt(r) ? ICON_PIN : '<i></i>'}${escapeHtml(r.name)}${r.time ? ` · ${r.time}` : ''}</span>`).join('')
    : '<span class="home-empty">Nada programado.</span>';

  // 6) Próximos compromissos (os 5 mais próximos)
  const appts = upcomingAppointments().slice(0, 5);
  $('homeAppts').innerHTML = appts.length ? appts.map(a => `
    <button class="ha-item${a.done ? ' done' : ''}" data-edit-appt="${a.id}" style="--c:${a.color}">
      <span class="ac-date"><b>${fromIso(a.date).getDate()}</b><small>${MONTHS[fromIso(a.date).getMonth()].slice(0, 3)}</small></span>
      <span class="rc-info"><b>${escapeHtml(a.name)}</b><small>${shortDate(a.date)}${a.time ? ' · ' + a.time : ''}</small></span>
      <span class="ha-when">${a.whenLabel()}</span>
    </button>`).join('')
    : `<p class="home-empty">Nenhum compromisso marcado. <a href="#" data-new-appt>+ Compromisso</a></p>`;
}

// ------------------------------------------------------------
// CONFIGURAR
// ------------------------------------------------------------
function renderManage() {
  $('manageHabits').innerHTML = state.habits.length ? state.habits.map(h => {
    const streak = currentStreak(h);
    return `
      <button class="routine-card" data-edit-habit="${h.id}" style="--c:${h.color}">
        <span class="rc-bar"></span>
        <span class="rc-info"><b>${escapeHtml(h.name)}</b><small>Todo dia · 🔥 ${streak} · melhor ${bestStreak(h)}</small></span>
        <span class="rc-edit">Editar</span>
      </button>`;
  }).join('') : `
    <div class="empty small"><p>Nenhum hábito. Hábitos são coisas que você marca todo dia, como “Beber água”.</p></div>`;

  renderRoutineList();
  renderApptList();

  // Preferências
  const mode = state.darkMode === null || state.darkMode === undefined ? 'system' : state.darkMode ? 'dark' : 'light';
  document.querySelectorAll('[data-theme-opt]').forEach(b => b.classList.toggle('on', b.dataset.themeOpt === mode));
  $('manageAccount').textContent = loggedIn() ? `Conectado como ${sync.email}` : 'Salvo só neste aparelho';
  $('manageVersion').textContent = 'v' + APP_VERSION;
}

// ------------------------------------------------------------
// EVENTOS
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  $('homeView').addEventListener('click', (e) => {
    const hb = e.target.closest('[data-habit-today]');
    if (hb) return toggleHabitToday(hb.dataset.habitToday);
    const na = e.target.closest('[data-new-appt]');
    if (na) { e.preventDefault(); return openAppt(null); }
    handleAgendaClick(e);   // check, editar, abrir dia
  });

  $('manageView').addEventListener('click', (e) => {
    const eh = e.target.closest('[data-edit-habit]');
    if (eh) return openEdit(eh.dataset.editHabit);
    if (handleAgendaClick(e)) return;   // editar rotina / compromisso
    const th = e.target.closest('[data-theme-opt]');
    if (th) {
      state.darkMode = th.dataset.themeOpt === 'system' ? null : th.dataset.themeOpt === 'dark';
      saveState(); applyTheme(); renderManage();
    }
  });
  $('manageNewHabit').onclick = () => openEdit(null);
  $('manageNewRoutine').onclick = () => openRoutine(null);
  $('manageNewAppt').onclick = () => openAppt(null);
  $('clearPastApptsBtn').onclick = clearPastAppts;
  $('manageAccountBtn').onclick = openAccount;
  $('manageExportBtn').onclick = exportData;
});
