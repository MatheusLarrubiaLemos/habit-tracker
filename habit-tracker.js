// ============================================================
// CONFIGURAÇÕES INICIAIS E CONSTANTES
// ============================================================
const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const STORAGE_KEY = 'habitTrackerData_v1';   // chave para localStorage

// Estado global da aplicação
let state = {
  year: CURRENT_YEAR,           // ano exibido atualmente
  activeMonth: new Date().getMonth(), // mês ativo (0-11)
  color: '#10b981',             // cor atual do seletor (usada para novos hábitos e alteração de cor)
  darkMode: false,              // modo escuro ativo?
  habits: []                    // lista de hábitos: cada um tem id, name, color, marks { chave: true }
};

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================
function genId() {
  return 'h' + Math.random().toString(36).slice(2,9);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function markKey(year, monthIndex, day) {
  return `${year}-${monthIndex}-${day}`;
}

// ============================================================
// PERSISTÊNCIA (localStorage)
// ============================================================
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e) {
    console.error('Erro ao salvar no localStorage', e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign(state, parsed);

      // Migração de dados antigos (formato sem ano) para o novo formato
      let needsSave = false;
      state.habits.forEach(habit => {
        if (habit.marks) {
          const hasOldFormat = Object.keys(habit.marks).some(k => !/^\d{4}-\d+-\d+$/.test(k));
          if (hasOldFormat) {
            const newMarks = {};
            Object.keys(habit.marks).forEach(oldKey => {
              const [month, day] = oldKey.split('-').map(Number);
              if (!isNaN(month) && !isNaN(day)) {
                const newKey = markKey(state.year, month, day);
                newMarks[newKey] = true;
              }
            });
            habit.marks = newMarks;
            needsSave = true;
          }
        }
        if (!habit.color) habit.color = state.color;
      });
      if (needsSave) saveState();
    }
  } catch(e) {
    console.error('Erro ao ler localStorage', e);
  }
}

// ============================================================
// ELEMENTOS DO DOM (referências)
// ============================================================
const tabsEl = document.getElementById('tabs');
const tableEl = document.getElementById('habitTable');
const colorPicker = document.getElementById('colorPicker');
const colorPickerBtn = document.getElementById('colorPickerBtn');
const colorPreview = document.getElementById('colorPreview');
const addHabitBtn = document.getElementById('addHabitBtn');
const habitNameInput = document.getElementById('habitNameInput');
const summaryEl = document.getElementById('summary');
const monthYearDiv = document.getElementById('monthYear');
const darkToggle = document.getElementById('darkToggle');
const optionsBtn = document.getElementById('optionsBtn');
const optionsPanel = document.getElementById('optionsPanel');
const exportBtn = document.getElementById('exportBtn');
const importFileInput = document.getElementById('importFileInput');
const prevYearBtn = document.getElementById('prevYearBtn');
const nextYearBtn = document.getElementById('nextYearBtn');
const currentYearSpan = document.getElementById('currentYear');

// ============================================================
// NAVEGAÇÃO POR ANO
// ============================================================
function setYear(newYear) {
  state.year = newYear;
  saveState();
  render();           // recarrega toda a interface com o novo ano
}
function prevYear() {
  setYear(state.year - 1);
}
function nextYear() {
  setYear(state.year + 1);
}

// ============================================================
// SELETOR DE CORES (DISCRETO)
// ============================================================
function initColorPicker() {
  // Ao clicar no botão, abre o input nativo de cor
  colorPickerBtn.addEventListener('click', () => colorPicker.click());
  // Quando a cor muda no seletor, atualiza o estado e o preview
  colorPicker.addEventListener('input', (e) => {
    state.color = e.target.value;
    colorPreview.style.backgroundColor = state.color;
    saveState();
  });
  // Sincroniza o preview com a cor atual do estado
  colorPreview.style.backgroundColor = state.color;
}

// ============================================================
// RENDERIZAÇÃO DAS ABAS (meses)
// ============================================================
function renderTabs() {
  tabsEl.innerHTML = '';
  MONTHS.forEach((monthName, idx) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (idx === state.activeMonth ? ' active' : '');
    btn.textContent = monthName.slice(0, 3);  // Abreviação: Jan, Fev, etc.
    btn.title = monthName;
    btn.addEventListener('click', () => {
      state.activeMonth = idx;
      saveState();
      render();
    });
    tabsEl.appendChild(btn);
  });
}

// ============================================================
// RENDERIZAÇÃO DO CABEÇALHO (mês/ano)
// ============================================================
function renderHeader() {
  monthYearDiv.textContent = `${MONTHS[state.activeMonth]} ${state.year}`;
  if (currentYearSpan) currentYearSpan.textContent = state.year;
}

// ============================================================
// RENDERIZAÇÃO DA TABELA (hábitos x dias)
// ============================================================
function renderTable() {
  tableEl.innerHTML = '';
  const year = state.year;
  const monthIndex = state.activeMonth;
  const days = daysInMonth(year, monthIndex);

  // ---------- Cabeçalho ----------
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const thHabit = document.createElement('th');
  thHabit.textContent = 'Hábitos';
  headerRow.appendChild(thHabit);
  for (let d = 1; d <= days; d++) {
    const th = document.createElement('th');
    th.textContent = String(d).padStart(2, '0');
    headerRow.appendChild(th);
  }
  const thRemove = document.createElement('th');
  thRemove.textContent = '';
  headerRow.appendChild(thRemove);
  thead.appendChild(headerRow);
  tableEl.appendChild(thead);

  // ---------- Corpo (linhas de hábitos) ----------
  const tbody = document.createElement('tbody');
  state.habits.forEach(habit => {
    const row = document.createElement('tr');

    // Coluna do nome do hábito (clique simples altera cor, duplo renomeia)
    const tdName = document.createElement('td');
    tdName.className = 'habitName';
    tdName.textContent = habit.name;
    tdName.style.cursor = 'pointer';
    tdName.title = 'Clique simples: alterar cor | Duplo clique: renomear';

    let clickTimer = null;
    tdName.addEventListener('click', () => {
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        habit.color = state.color;       // aplica a cor atual do seletor
        saveState();
        renderTable();                  // recarrega tabela para aplicar nova cor
        clickTimer = null;
      }, 200);
    });
    tdName.addEventListener('dblclick', () => {
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
      function finish() {
        const v = input.value.trim();
        if (v) renameHabit(habit.id, v);
        else alert('Nome vazio não permitido');
      }
      input.addEventListener('blur', finish);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
    });
    row.appendChild(tdName);

    // Células dos dias
    for (let d = 1; d <= days; d++) {
      const td = document.createElement('td');
      td.className = 'dayCell';
      const key = markKey(year, monthIndex, d);
      if (habit.marks && habit.marks[key]) {
        td.style.backgroundColor = habit.color;  // aplica a cor fixa do hábito
        td.classList.add('marked');
      } else {
        td.style.backgroundColor = '';           // remove inline, permite CSS do modo escuro
        td.classList.remove('marked');
      }
      td.addEventListener('click', () => toggleMark(habit.id, year, monthIndex, d));
      row.appendChild(td);
    }

    // Botão remover (ícone)
    const tdRemove = document.createElement('td');
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '🗑️';
    removeBtn.className = 'remove-btn';
    removeBtn.title = 'Remover hábito';
    removeBtn.addEventListener('click', () => {
      if (confirm(`Remover "${habit.name}"?`)) removeHabit(habit.id);
    });
    tdRemove.appendChild(removeBtn);
    row.appendChild(tdRemove);

    tbody.appendChild(row);
  });
  tableEl.appendChild(tbody);
  renderSummary();
}

// ============================================================
// RESUMO (contagem de marcações)
// ============================================================
function renderSummary() {
  const year = state.year;
  const monthIndex = state.activeMonth;
  let total = 0;
  state.habits.forEach(h => {
    Object.keys(h.marks || {}).forEach(k => {
      if (k.startsWith(`${year}-${monthIndex}-`)) total++;
    });
  });
  summaryEl.textContent = `✔️ ${total} marcações este mês · ${state.habits.length} hábitos`;
}

// ============================================================
// FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO
// ============================================================
function render() {
  renderTabs();
  renderHeader();
  renderTable();
  // Aplica classe dark mode no body conforme o estado
  if (state.darkMode) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}

// ============================================================
// AÇÕES DOS HÁBITOS (CRUD)
// ============================================================
function addHabit(name) {
  if (!name?.trim()) return alert('Digite um nome');
  const habit = { id: genId(), name: name.trim(), marks: {} };
  state.habits.push(habit);
  saveState();
  render();
  habitNameInput.value = '';
}

function removeHabit(id) {
  state.habits = state.habits.filter(h => h.id !== id);
  saveState();
  render();
}

function renameHabit(id, newName) {
  const h = state.habits.find(x => x.id === id);
  if (h) { h.name = newName; saveState(); renderTable(); }
}

function toggleMark(habitId, year, monthIndex, day) {
  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;
  const key = markKey(year, monthIndex, day);
  habit.marks = habit.marks || {};
  if (!habit.color) habit.color = state.color;   // define cor se ainda não tiver
  if (habit.marks[key]) {
    delete habit.marks[key];
  } else {
    habit.marks[key] = true;
  }
  saveState();
  renderTable();   // atualiza apenas a tabela (mais rápido)
}

// ============================================================
// EXPORTAR / IMPORTAR JSON
// ============================================================
function exportData() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habit-tracker-${state.year}-${MONTHS[state.activeMonth]}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function handleImportFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!confirm('Substituir os dados atuais?')) return;
      // Mescla com defaults para garantir que todas as propriedades existam
      state = Object.assign({
        year: CURRENT_YEAR,
        activeMonth: new Date().getMonth(),
        color: '#10b981',
        darkMode: false,
        habits: []
      }, parsed);
      state.habits.forEach(h => { if (!h.color) h.color = state.color; });
      saveState();
      render();
      alert('Importado com sucesso!');
    } catch(err) {
      alert('Arquivo inválido');
    }
  };
  reader.readAsText(file);
}

// ============================================================
// CONTROLE DO MENU DROPDOWN (CONFIGURAÇÕES)
// ============================================================
function toggleOptionsPanel() {
  optionsPanel.classList.toggle('visible');
}
// Fecha o dropdown se clicar fora dele
document.addEventListener('click', (e) => {
  if (optionsPanel && optionsBtn && !optionsBtn.contains(e.target) && !optionsPanel.contains(e.target)) {
    optionsPanel.classList.remove('visible');
  }
});

// ============================================================
// EVENT LISTENERS (INTERAÇÃO DO USUÁRIO)
// ============================================================
addHabitBtn.addEventListener('click', () => addHabit(habitNameInput.value));
habitNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addHabit(habitNameInput.value); });
darkToggle.addEventListener('click', () => {
  state.darkMode = !state.darkMode;
  saveState();
  render();   // recarrega para aplicar a classe dark no body
});
optionsBtn.addEventListener('click', toggleOptionsPanel);
exportBtn.addEventListener('click', () => {
  exportData();
  toggleOptionsPanel();   // opcional: fecha o menu após exportar
});
importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleImportFile(file);
  e.target.value = '';
  toggleOptionsPanel();   // fecha menu após importar
});
prevYearBtn?.addEventListener('click', prevYear);
nextYearBtn?.addEventListener('click', nextYear);

// ============================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================================
(function init() {
  loadState();                    // carrega dados salvos
  if (!state.color) state.color = '#10b981';
  initColorPicker();             // configura o seletor de cores discreto
  render();                      // desenha a interface
})();