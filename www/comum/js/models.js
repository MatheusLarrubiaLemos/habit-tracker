// ============================================================
// MODELOS (CLASSES)
// Hábito  = algo que você acompanha todo dia na grade (marca ou não marca).
// Rotina  = uma atividade com PROGRAMAÇÃO: acontece em dias certos da semana
//           (ex.: Estudar ter/qua), podendo ter horário, dias extras e dias pulados.
// Compromisso (Appointment) = acontece UMA VEZ só, numa data (ex.: casamento,
//           dentista). Não se repete e não entra na lista de rotinas.
// Todos herdam de "Registro", que tem o que é comum: id, nome, cor.
// Rotina e Compromisso formam a AGENDA e têm os mesmos métodos:
//   isScheduledOn(data) · isDoneOn(data) · setDone(data, sim/não)
// ============================================================

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Date → "AAAA-MM-DD" (data local, sem fuso) */
function toIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
/** "AAAA-MM-DD" → Date (meia-noite local) */
function fromIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEX_RE = /^#[0-9a-f]{6}$/i;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

class Registro {
  constructor(data = {}) {
    this.id = data.id || genId();
    if (data.sid) this.sid = data.sid;               // id no servidor (quando sincronizado)
    this.name = String(data.name || '').trim().slice(0, 60);
    this.color = HEX_RE.test(data.color) ? data.color : PALETTE[0];
  }
}

// ------------------------------------------------------------
class Habit extends Registro {
  constructor(data = {}) {
    super(data);
    this.kind = 'habit';
    // marks: { "AAAA-M-D": true }  (mês começando em 0 — formato antigo, mantido por compatibilidade)
    this.marks = (data.marks && typeof data.marks === 'object' && !Array.isArray(data.marks)) ? { ...data.marks } : {};
  }
  isMarked(y, m, d) { return !!this.marks[markKey(y, m, d)]; }
  toggle(y, m, d) {
    const k = markKey(y, m, d);
    if (this.marks[k]) delete this.marks[k]; else this.marks[k] = true;
    return !!this.marks[k];
  }
  /** Formato enviado ao servidor */
  toPayload() {
    return { name: this.name, color: this.color, marks: Object.keys(this.marks).map(keyToIso) };
  }
  static fromServer(s, localId) {
    const marks = {};
    (s.marks || []).forEach(iso => { marks[isoToKey(iso)] = true; });
    return new Habit({ id: localId || 'h' + s.id, sid: s.id, name: s.name, color: s.color, marks });
  }
}

// ------------------------------------------------------------
class Routine extends Registro {
  constructor(data = {}) {
    super(data);
    this.kind = 'routine';
    this.time = TIME_RE.test(data.time || '') ? data.time : '';                 // "19:00" ou vazio
    this.days = Array.isArray(data.days) ? [...new Set(data.days.map(Number).filter(d => d >= 0 && d <= 6))].sort() : [];
    this.extraDates = (data.extraDates || []).filter(d => ISO_RE.test(d));       // dias avulsos adicionados
    this.skipDates = (data.skipDates || []).filter(d => ISO_RE.test(d));         // dias em que foi tirada
    this.startDate = ISO_RE.test(data.startDate || '') ? data.startDate : toIso(new Date());
    this.done = (data.done && typeof data.done === 'object') ? { ...data.done } : {};   // { "AAAA-MM-DD": true }
  }

  /** A rotina acontece nesta data? */
  isScheduledOn(date) {
    const iso = typeof date === 'string' ? date : toIso(date);
    if (this.skipDates.includes(iso)) return false;
    if (this.extraDates.includes(iso)) return true;
    if (iso < this.startDate) return false;
    const wd = (typeof date === 'string' ? fromIso(date) : date).getDay();
    return this.days.includes(wd);
  }
  isDoneOn(date) { return !!this.done[typeof date === 'string' ? date : toIso(date)]; }
  setDone(date, value) {
    const iso = typeof date === 'string' ? date : toIso(date);
    if (value) this.done[iso] = true; else delete this.done[iso];
  }

  /** Coloca a rotina num dia avulso (ou desfaz um "pular" nesse dia). */
  addOn(iso) {
    this.skipDates = this.skipDates.filter(d => d !== iso);
    if (!this.isScheduledOn(iso)) this.extraDates.push(iso);
  }
  /** Tira a rotina de um dia específico, sem mudar a programação. */
  removeFrom(iso) {
    this.extraDates = this.extraDates.filter(d => d !== iso);
    this.setDone(iso, false);
    if (this.isScheduledOn(iso)) this.skipDates.push(iso);
  }

  get everyDay() { return this.days.length === 7; }

  /** Texto curto da programação: "Todos os dias", "Ter, Qua", "Dias avulsos" */
  scheduleLabel() {
    let txt;
    if (this.everyDay) txt = 'Todos os dias';
    else if (this.days.length === 5 && [1, 2, 3, 4, 5].every(d => this.days.includes(d))) txt = 'Dias úteis';
    else if (this.days.length === 2 && this.days.includes(0) && this.days.includes(6)) txt = 'Fins de semana';
    else if (this.days.length) txt = this.days.map(d => WEEKDAY_SHORT[d]).join(', ');
    else txt = 'Só dias avulsos';
    return this.time ? `${txt} · ${this.time}` : txt;
  }

  /** Taxa de conclusão nos últimos N dias programados (até hoje) */
  stats(lastDays = 30) {
    const d = new Date(TODAY.y, TODAY.m, TODAY.d);
    let planned = 0, done = 0;
    for (let i = 0; i < lastDays; i++) {
      if (this.isScheduledOn(d)) { planned++; if (this.isDoneOn(d)) done++; }
      d.setDate(d.getDate() - 1);
    }
    return { planned, done, pct: planned ? Math.round((done / planned) * 100) : null };
  }

  toPayload() {
    return {
      name: this.name, color: this.color, time: this.time, days: this.days,
      extraDates: this.extraDates, skipDates: this.skipDates, startDate: this.startDate,
      done: Object.keys(this.done)
    };
  }
  static fromServer(s, localId) {
    const done = {};
    (s.done || []).forEach(iso => { done[iso] = true; });
    return new Routine({ ...s, id: localId || 'r' + s.id, sid: s.id, done });
  }
}

// ------------------------------------------------------------
class Appointment extends Registro {
  constructor(data = {}) {
    super(data);
    this.kind = 'appointment';
    this.date = ISO_RE.test(data.date || '') ? data.date : toIso(new Date());   // o único dia em que acontece
    this.time = TIME_RE.test(data.time || '') ? data.time : '';                 // "16:00" ou vazio
    this.note = String(data.note || '').trim().slice(0, 200);                   // observação opcional
    this.done = !!data.done;
  }
  isScheduledOn(date) { return (typeof date === 'string' ? date : toIso(date)) === this.date; }
  isDoneOn(date) { return this.done && this.isScheduledOn(date); }
  setDone(date, value) { if (this.isScheduledOn(date)) this.done = !!value; }

  /** Já passou? (o dia é anterior a hoje) */
  isPast() { return this.date < toIso(new Date(TODAY.y, TODAY.m, TODAY.d)); }

  /** Quantos dias faltam (0 = hoje, 1 = amanhã, negativo = já passou) */
  daysUntil() {
    return Math.round((fromIso(this.date) - new Date(TODAY.y, TODAY.m, TODAY.d)) / 86400000);
  }

  /** "hoje", "amanhã", "em 10 dias", "há 3 dias" */
  whenLabel() {
    const n = this.daysUntil();
    if (n === 0) return 'hoje';
    if (n === 1) return 'amanhã';
    if (n === -1) return 'ontem';
    return n > 0 ? `em ${n} dias` : `há ${-n} dias`;
  }

  toPayload() {
    return { name: this.name, color: this.color, date: this.date, time: this.time, note: this.note, done: this.done };
  }
  static fromServer(s, localId) {
    return new Appointment({ ...s, id: localId || 'a' + s.id, sid: s.id });
  }
}

/** Ordena itens da agenda: com horário primeiro (por hora), depois por nome */
function sortAgenda(list) {
  return [...list].sort((a, b) =>
    (a.time || '99:99').localeCompare(b.time || '99:99') || a.name.localeCompare(b.name, 'pt-BR'));
}
const sortRoutines = sortAgenda;   // nome antigo, mantido por compatibilidade

/** Tudo que está na agenda num dia: rotinas programadas + compromissos daquela data */
function agendaOn(iso) {
  return sortAgenda([
    ...state.routines.filter(r => r.isScheduledOn(iso)),
    ...state.appointments.filter(a => a.date === iso)
  ]);
}

/** Compromissos de hoje em diante, do mais próximo ao mais distante */
function upcomingAppointments() {
  const t = toIso(new Date(TODAY.y, TODAY.m, TODAY.d));
  return state.appointments.filter(a => a.date >= t)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '99:99').localeCompare(b.time || '99:99'));
}
