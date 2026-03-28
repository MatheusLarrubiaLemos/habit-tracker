// Ano atual (usado como ano inicial, mas agora é mutável)
const CURRENT_YEAR = new Date().getFullYear();

// Nomes dos meses
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// Chave usada para salvar/recuperar dados no localStorage
const STORAGE_KEY = 'habitTrackerData_v2'; // Mudei a versão para evitar conflito

// Estado global
let state = {
  year: CURRENT_YEAR,               // ano atual exibido (mutável)
  activeMonth: new Date().getMonth(),
  color: '#10b981',
  darkMode: false,
  habits: []
}

// Gera um id simples
function genId(){
  return 'h' + Math.random().toString(36).slice(2,9);
}

// Retorna quantidade de dias de um mês/ano
function daysInMonth(year, monthIndex){
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Chave de marcação agora inclui o ano
function markKey(year, monthIndex, day){
  return `${year}-${monthIndex}-${day}`;
}

// -----------------------
// Persistência (localStorage)
// -----------------------
function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(e){
    console.error('Erro ao salvar no localStorage', e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign(state, parsed);

      // MIGRAÇÃO DE DADOS ANTIGOS (versão anterior, sem ano)
      // Se há hábitos com marcas no formato antigo ("mes-dia") e não há marcas com ano,
      // vamos convertê-las usando o ano atual (state.year).
      let needsMigration = false;
      state.habits.forEach(habit => {
        if (habit.marks) {
          // Verifica se existe alguma chave que não contém ano (ou seja, não começa com dígitos e traço)
          const hasOldFormat = Object.keys(habit.marks).some(key => !/^\d{4}-\d+-\d+$/.test(key));
          if (hasOldFormat) {
            needsMigration = true;
            const newMarks = {};
            Object.keys(habit.marks).forEach(oldKey => {
              // oldKey é "mês-dia"
              const [month, day] = oldKey.split('-').map(Number);
              if (!isNaN(month) && !isNaN(day)) {
                const newKey = markKey(state.year, month, day);
                // O valor antigo pode ser booleano ou string (cor)
                newMarks[newKey] = typeof habit.marks[oldKey] === 'string' ? true : habit.marks[oldKey];
              }
            });
            habit.marks = newMarks;
          }
        }
        // Garante que cada hábito tenha uma cor
        if (!habit.color) habit.color = state.color;
      });
      if (needsMigration) saveState();

      // Se algum hábito ainda não tem cor, define
      state.habits.forEach(habit => {
        if (!habit.color) habit.color = state.color;
      });
    }
  } catch(e) {
    console.error('Erro ao ler localStorage', e);
  }
}

// -----------------------
// Referências ao DOM
// -----------------------
const tabsEl = document.getElementById('tabs');
const tableEl = document.getElementById('habitTable');
const colorPicker = document.getElementById('colorPicker');
const colorValue = document.getElementById('colorValue');
const addHabitBtn = document.getElementById('addHabitBtn');
const habitNameInput = document.getElementById('habitNameInput');
const summaryEl = document.getElementById('summary');
const monthYearEl = document.getElementById('monthYear');
const darkToggle = document.getElementById('darkToggle');
const optionsBtn = document.getElementById('optionsBtn');
const optionsPanel = document.getElementById('optionsPanel');
const exportBtn = document.getElementById('exportBtn');
const importFileInput = document.getElementById('importFileInput');

// Elementos de navegação de ano (devem existir no HTML)
const prevYearBtn = document.getElementById('prevYearBtn');
const nextYearBtn = document.getElementById('nextYearBtn');
const currentYearSpan = document.getElementById('currentYear');

// -----------------------
// Navegação por ano
// -----------------------
function setYear(newYear) {
  state.year = newYear;
  saveState();
  render(); // recarrega tudo
}

function prevYear() {
  setYear(state.year - 1);
}

function nextYear() {
  setYear(state.year + 1);
}

// -----------------------
// Renderização
// -----------------------
function renderTabs(){
  tabsEl.innerHTML = '';
  MONTHS.forEach((m, idx) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (idx === state.activeMonth ? ' active' : '');
    btn.textContent = m.slice(0, 3);
    btn.title = m;
    btn.addEventListener('click', () => {
      state.activeMonth = idx;
      saveState();
      render();
    });
    tabsEl.appendChild(btn);
  });
}

function renderHeader(){
  monthYearEl.textContent = `${MONTHS[state.activeMonth]} ${state.year}`;
  if (currentYearSpan) currentYearSpan.textContent = state.year;
}

function renderTable(){
  tableEl.innerHTML = '';

  const year = state.year;
  const monthIndex = state.activeMonth;
  const days = daysInMonth(year, monthIndex);

  // Cabeçalho
  const thead = document.createElement('thead');
  const hrow = document.createElement('tr');
  const thHabit = document.createElement('th');
  thHabit.className = 'habit';
  thHabit.textContent = 'Hábitos';
  hrow.appendChild(thHabit);
  for (let d = 1; d <= days; d++){
    const th = document.createElement('th');
    th.textContent = String(d).padStart(2, '0');
    hrow.appendChild(th);
  }
  const thRemove = document.createElement('th');
  thRemove.textContent = '';
  hrow.appendChild(thRemove);
  thead.appendChild(hrow);
  tableEl.appendChild(thead);

  // Corpo
  const tbody = document.createElement('tbody');
  state.habits.forEach(habit => {
    const tr = document.createElement('tr');

    // Coluna do nome (com círculo de cor e ações)
    const tdName = document.createElement('td');
    tdName.className = 'habitName';
    tdName.style.cursor = 'pointer';
    tdName.style.display = 'flex';
    tdName.style.alignItems = 'center';
    tdName.style.gap = '8px';
    tdName.title = 'Clique simples: alterar cor | Duplo clique: renomear';

    const colorIndicator = document.createElement('span');
    colorIndicator.style.display = 'inline-block';
    colorIndicator.style.width = '16px';
    colorIndicator.style.height = '16px';
    colorIndicator.style.borderRadius = '50%';
    colorIndicator.style.backgroundColor = habit.color;
    colorIndicator.style.border = '1px solid #ccc';
    colorIndicator.style.flexShrink = '0';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = habit.name;

    tdName.appendChild(colorIndicator);
    tdName.appendChild(nameSpan);

    let clickTimer = null;
    tdName.addEventListener('click', (e) => {
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        habit.color = state.color;
        saveState();
        colorIndicator.style.backgroundColor = habit.color;
        // feedback visual
        const originalBorder = colorIndicator.style.border;
        colorIndicator.style.border = '2px solid gold';
        setTimeout(() => {
          colorIndicator.style.border = originalBorder;
        }, 300);
        // toast
        const toast = document.createElement('div');
        toast.textContent = `Cor alterada para ${habit.color.toUpperCase()}`;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '20px';
        toast.style.backgroundColor = '#333';
        toast.style.color = '#fff';
        toast.style.padding = '8px 12px';
        toast.style.borderRadius = '4px';
        toast.style.fontSize = '14px';
        toast.style.zIndex = '1000';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.2s';
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '1'; }, 10);
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 300);
        }, 1500);
        clickTimer = null;
      }, 200);
    });

    tdName.addEventListener('dblclick', (e) => {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      const input = document.createElement('input');
      input.type = 'text';
      input.value = habit.name;
      input.style.width = '100%';
      input.style.padding = '4px';
      tdName.innerHTML = '';
      tdName.appendChild(input);
      input.focus();
      function finish(){
        const v = input.value.trim();
        if (v) renameHabit(habit.id, v);
        else alert('Nome vazio não permitido');
      }
      input.addEventListener('blur', finish);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
    });

    tr.appendChild(tdName);

    // Células de dias
    for (let d = 1; d <= days; d++){
      const td = document.createElement('td');
      td.className = 'dayCell';
      td.dataset.habitId = habit.id;
      td.dataset.day = d;

      const key = markKey(year, monthIndex, d);
      if (habit.marks && habit.marks[key]){
        td.style.backgroundColor = habit.color;
        td.classList.add('marked');
      } else {
        td.style.backgroundColor = '';
        td.classList.remove('marked');
      }

      td.addEventListener('click', () => {
        toggleMark(habit.id, year, monthIndex, d);
      });
      tr.appendChild(td);
    }

    // Ações: Remover
    const tdActions = document.createElement('td');
    const btnRemove = document.createElement('button');
    btnRemove.className = 'ghost';
    btnRemove.textContent = 'Remover';
    btnRemove.addEventListener('click', () => {
      if (confirm(`Remover o hábito "${habit.name}"?`)) removeHabit(habit.id);
    });
    tdActions.appendChild(btnRemove);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
  tableEl.appendChild(tbody);
  renderSummary();
}

function renderSummary(){
  const year = state.year;
  const monthIndex = state.activeMonth;
  let total = 0;
  state.habits.forEach(h => {
    Object.keys(h.marks || {}).forEach(k => {
      if (k.startsWith(`${year}-${monthIndex}-`)) total++;
    });
  });
  summaryEl.textContent = `Marcações no mês: ${total} (${state.habits.length} hábitos)`;
}

function render(){
  renderTabs();
  renderHeader();
  renderTable();
  colorPicker.value = state.color;
  colorValue.textContent = state.color.toUpperCase();
  if (state.darkMode) document.body.classList.add('dark'); else document.body.classList.remove('dark');
}

// -----------------------
// Ações do usuário
// -----------------------
function addHabit(name){
  if (!name || !name.trim()) return alert('Digite um nome para o hábito');
  const habit = { id: genId(), name: name.trim(), marks: {} };
  state.habits.push(habit);
  saveState();
  render();
  habitNameInput.value = '';
}

function removeHabit(id){
  state.habits = state.habits.filter(h => h.id !== id);
  saveState();
  render();
}

function renameHabit(id, newName){
  const h = state.habits.find(x => x.id === id);
  if (!h) return;
  h.name = newName;
  saveState();
  renderTable();
}

function toggleMark(habitId, year, monthIndex, day){
  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;
  const key = markKey(year, monthIndex, day);
  habit.marks = habit.marks || {};

  if (!habit.color) {
    habit.color = state.color;
  }

  if (habit.marks[key]) {
    delete habit.marks[key];
  } else {
    habit.marks[key] = true;
  }
  saveState();
  renderTable();
}

// -----------------------
// Export / Import
// -----------------------
function exportData(){
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habit-tracker-export-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function handleImportFile(file){
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try{
      const parsed = JSON.parse(e.target.result);
      if (!confirm('Deseja substituir os dados atuais pelos dados importados? Isso sobrescreverá tudo.')) return;
      state = Object.assign({ year: CURRENT_YEAR, activeMonth: new Date().getMonth(), color: '#10b981', darkMode: false, habits: [] }, parsed);
      state.habits = state.habits || [];
      state.habits.forEach(habit => {
        if (!habit.color) habit.color = state.color;
      });
      saveState();
      render();
      alert('Importação concluída.');
    }catch(err){
      alert('Arquivo inválido: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// -----------------------
// Painel de opções
// -----------------------
function toggleOptionsPanel(){
  optionsPanel.classList.toggle('visible');
}

// -----------------------
// Eventos
// -----------------------
colorPicker.addEventListener('input', (e) => {
  state.color = e.target.value;
  colorValue.textContent = state.color.toUpperCase();
  saveState();
});

addHabitBtn.addEventListener('click', () => { addHabit(habitNameInput.value); });
habitNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addHabit(habitNameInput.value); });

darkToggle.addEventListener('click', () => { state.darkMode = !state.darkMode; saveState(); render(); });

optionsBtn.addEventListener('click', () => { toggleOptionsPanel(); });
exportBtn.addEventListener('click', () => { exportData(); });
importFileInput.addEventListener('change', (e) => { const f = e.target.files[0]; if (f) handleImportFile(f); e.target.value = ''; });

// Botões de ano
if (prevYearBtn) prevYearBtn.addEventListener('click', prevYear);
if (nextYearBtn) nextYearBtn.addEventListener('click', nextYear);

// -----------------------
// Inicialização
// -----------------------
(function init(){
  loadState();
  if (!state.color) state.color = '#10b981';
  render();
})();