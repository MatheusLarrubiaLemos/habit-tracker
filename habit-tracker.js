
// Ano atual (usado para calcular número de dias por mês)
const YEAR = new Date().getFullYear();

// Nomes dos meses (índice 0 = Janeiro). Usamos para gerar abas e o cabeçalho.
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// Chave usada para salvar/recuperar dados no localStorage do navegador
const STORAGE_KEY = 'habitTrackerData_v1';

// Estado global da aplicação.
// Mantemos tudo em um único objeto `state` para facilitar serialização (export/import).
let state = {
  year: YEAR,                        // ano usado (poderia ser parametrizável)
  activeMonth: new Date().getMonth(),// índice do mês atualmente selecionado (0-11)
  color: '#10b981',                  // cor usada para preencher células marcadas (HEX)
  // eraserOn foi removido: apenas marcação agora
  darkMode: false,                   // modo claro/escuro
  habits: []                         // lista de hábitos; cada item {id, name, marks}
}

// Gera um id simples para identificar hábitos. Não é criptograficamente seguro, mas suficiente aqui.
function genId(){
  return 'h' + Math.random().toString(36).slice(2,9);
}

// Retorna quantidade de dias para um dado mês/ano. Ex: daysInMonth(2026, 1) => 28/29/30/31
function daysInMonth(year, monthIndex){
  // Criar um Date com dia 0 do mês seguinte devolve o último dia do mês desejado
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Chave usada internamente para armazenar marcações em objeto: "mes-dia" (ex: "0-1" para 1º de Janeiro)
function markKey(monthIndex, day){
  return `${monthIndex}-${day}`;
}

// -----------------------
// Persistência (localStorage)
// -----------------------
// Salva todo o objeto `state` no localStorage como JSON.
function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(e){
    // Se o navegador bloquear localStorage (ex.: modo privado), registramos o erro.
    console.error('Erro ao salvar no localStorage', e);
  }
}

// Carrega o estado do localStorage se existir.
// Fazemos uma mesclagem (Object.assign) para preservar chaves novas caso o código seja atualizado futuramente.
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign(state, parsed);

      // MIGRAÇÃO: marcas antigas (booleano) para usar uma cor padrão
      state.habits.forEach(habit => {
        if (habit.marks) {
          Object.keys(habit.marks).forEach(key => {
            if (typeof habit.marks[key] === 'boolean') {
              // Se for true, substitui pela cor atual; se for false (improvável), remove
              if (habit.marks[key] === true) {
                habit.marks[key] = state.color || '#10b981'; // usa a cor atual ou um verde padrão
              } else {
                delete habit.marks[key];
              }
            }
          });
        }
      });
    }
  } catch(e) {
    console.error('Erro ao ler localStorage', e);
  }
}

// -----------------------
// Referências ao DOM
// -----------------------
// Guardamos referências aos elementos do HTML que manipulamos com frequência.
const tabsEl = document.getElementById('tabs');                 // container das abas (meses)
const tableEl = document.getElementById('habitTable');         // tabela principal de hábitos x dias
const colorPicker = document.getElementById('colorPicker');    // seletor de cor
const colorValue = document.getElementById('colorValue');      // exibe valor HEX da cor
// const eraserBtn = document.getElementById('eraserBtn');        // botão borracha (removido)
const addHabitBtn = document.getElementById('addHabitBtn');    // botão adicionar hábito
const habitNameInput = document.getElementById('habitNameInput');// campo de texto do novo hábito
const summaryEl = document.getElementById('summary');          // área de resumo (contagem)
const monthYearEl = document.getElementById('monthYear');      // cabeçalho mês + ano
const darkToggle = document.getElementById('darkToggle');      // botão modo claro/escuro
// Elementos do painel camuflado (export/import)
const optionsBtn = document.getElementById('optionsBtn');
const optionsPanel = document.getElementById('optionsPanel');
const exportBtn = document.getElementById('exportBtn');
const importFileInput = document.getElementById('importFileInput');

// -----------------------
// Renderização da interface
// -----------------------
// renderTabs: cria os botões das 12 abas de mês.
// Cada aba atualiza `state.activeMonth` quando clicada.
function renderTabs(){
  tabsEl.innerHTML = ''; // limpa antes de renderizar
  MONTHS.forEach((m, idx) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (idx === state.activeMonth ? ' active' : '');
    btn.textContent = m.slice(0, 3); // mostra abreviação (Jan, Fev, ...)
    btn.title = m; // tooltip com nome completo
    btn.addEventListener('click', () => {
      state.activeMonth = idx; // muda o mês ativo
      saveState();
      render(); // re-renderiza a interface inteira
    });
    tabsEl.appendChild(btn);
  });
}

// renderHeader: atualiza o texto de mês + ano no topo
function renderHeader(){
  monthYearEl.textContent = `${MONTHS[state.activeMonth]} ${state.year}`;
}

// renderTable: constrói a tabela de hábitos x dias para o mês ativo.
// - Gera o cabeçalho com os dias (1..N)
// - Gera uma linha por hábito, com células clicáveis para marcar/desmarcar
// - Permite renomear hábito com double-click (substitui o texto por um input temporário)
function renderTable(){
  tableEl.innerHTML = ''; // limpa tabela

  const monthIndex = state.activeMonth;
  const days = daysInMonth(state.year, monthIndex); // número de colunas de dias

  // --- Cabeçalho ---
  const thead = document.createElement('thead');
  const hrow = document.createElement('tr');
  const thHabit = document.createElement('th');
  thHabit.className = 'habit';
  thHabit.textContent = 'Hábitos';
  hrow.appendChild(thHabit);

  // Colunas dos dias (01, 02, ...)
  for (let d = 1; d <= days; d++){
    const th = document.createElement('th');
    th.textContent = String(d).padStart(2, '0');
    hrow.appendChild(th);
  }

  // Coluna de ação (Remover)
  const thRemove = document.createElement('th');
  thRemove.textContent = '';
  hrow.appendChild(thRemove);

  thead.appendChild(hrow);
  tableEl.appendChild(thead);

  // --- Corpo da tabela (linhas de hábitos) ---
  const currentColor = state.color; // cor atual para pintar células marcadas
  const tbody = document.createElement('tbody');

  // Para cada hábito, criamos uma linha com N células (uma por dia)
  state.habits.forEach(habit => {
    const tr = document.createElement('tr');

    // Coluna do nome do hábito (com suporte para renomear via double-click)
    const tdName = document.createElement('td');
    tdName.className = 'habitName';
    tdName.textContent = habit.name;

    // Ao dar double-click, substituímos o texto por um input para renomear.
    // A edição termina no blur (perda de foco) ou ao pressionar Enter.x
    tdName.addEventListener('dblclick', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = habit.name;
      input.style.width = '90%';

      // Substitui o conteúdo do TD pelo input e foca nele
      tdName.innerHTML = '';
      tdName.appendChild(input);
      input.focus();

      // Quando terminar a edição, valida e salva
      function finish(){
        const v = input.value.trim();
        if (v) renameHabit(habit.id, v);
        else alert('Nome vazio não permitido');
      }
      input.addEventListener('blur', finish);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
    });

    tr.appendChild(tdName);

    // Gerar as células de cada dia. Células marcadas recebem background com a cor selecionada.
    for (let d = 1; d <= days; d++){
      const td = document.createElement('td');
      td.className = 'dayCell';
      td.dataset.habitId = habit.id; // meta-dados úteis para identificar qual hábito
      td.dataset.day = d;

      const key = markKey(monthIndex, d);
      if (habit.marks && habit.marks[key]){
        td.style.backgroundColor = habit.marks[key]; // agora a cor vem do estado, não mais fixa
        td.classList.add('marked');
      } else {
        td.style.backgroundColor = ''; //limpa cor se não marcado
        td.classList.remove('marked');
      }

      // Clique na célula: marca/desmarca dependendo do modo (borracha/desenho)
      td.addEventListener('click', () => {
        toggleMark(habit.id, monthIndex, d);
      });

      tr.appendChild(td);
    }

    // Botão Remover para excluir o hábito (perguntamos antes de remover)
    const tdRem = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'ghost';
    btn.textContent = 'Remover';
    btn.addEventListener('click', () => {
      if (confirm(`Remover o hábito "${habit.name}"?`)) removeHabit(habit.id);
    });
    tdRem.appendChild(btn);
    tr.appendChild(tdRem);

    tbody.appendChild(tr);
  });

  tableEl.appendChild(tbody);

  // Atualiza resumo (contagem de marcações) após construir a tabela
  renderSummary();
}

// renderSummary: conta quantas marcações existem no mês ativo e mostra junto ao número de hábitos
function renderSummary(){
  const monthIndex = state.activeMonth;
  let total = 0;
  state.habits.forEach(h => {
    // h.marks é um objeto onde cada chave é "mes-dia". Contamos as que pertencem ao mês atual.
    Object.keys(h.marks || {}).forEach(k => { if (k.startsWith(monthIndex + '-')) total++; });
  });
  summaryEl.textContent = `Marcações no mês: ${total} (${state.habits.length} hábitos)`;
}

// render: função de alto nível que redesenha a UI (abas, cabeçalho, tabela) e atualiza controles
function render(){
  renderTabs();
  renderHeader();
  renderTable();
  // Atualiza controles visuais (seletor de cor, estado da borracha e modo escuro)
  colorPicker.value = state.color;
  colorValue.textContent = state.color.toUpperCase();
  if (state.darkMode) document.body.classList.add('dark'); else document.body.classList.remove('dark');
}

// -----------------------
// Ações do usuário (CRUD básico de hábitos)
// -----------------------
// addHabit: cria um novo hábito com nome informado e salva no estado
function addHabit(name){
  if (!name || !name.trim()) return alert('Digite um nome para o hábito');
  const habit = { id: genId(), name: name.trim(), marks: {} };
  state.habits.push(habit);
  saveState();
  render();
  habitNameInput.value = '';
}

// removeHabit: remove um hábito pelo id
function removeHabit(id){
  state.habits = state.habits.filter(h => h.id !== id);
  saveState();
  render();
}

// renameHabit: altera o nome registrado de um hábito
function renameHabit(id, newName){
  const h = state.habits.find(x => x.id === id);
  if (!h) return; // se não encontrado, nada a fazer
  h.name = newName;
  saveState();
  // atualizamos apenas a tabela para manter foco caso o usuário esteja editando
  renderTable();
}

// toggleMark: marca ou desmarca a célula correspondente a (habit, month, day)
// sempre alterna o estado da marcação (sem modo borracha)
function toggleMark(habitId, monthIndex, day){
  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;
  const key = markKey(monthIndex, day);
  habit.marks = habit.marks || {};
  if (habit.marks[key]) {
    // Se já está marcada, apaga (desmarca)
    delete habit.marks[key];
  } else {
    // Marca com a cor atual (a cor é aplicada via CSS na renderização, aqui só registramos a marcação)
    habit.marks[key] = state.color;
  }
  saveState();
  renderTable();
}

// -----------------------
// Export / Import JSON
// -----------------------
// exportData: cria e baixa um arquivo JSON contendo o `state` atual.
function exportData(){
  const data = JSON.stringify(state, null, 2); // formatação legível com identação
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

// handleImportFile: lê um arquivo JSON selecionado pelo usuário e substitui o estado atual.
// Observação: a implementação substitui completamente o estado salvo. Poderíamos implementar
// uma mesclagem (merge) caso o usuário prefira combinar dados.
function handleImportFile(file){
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try{
      const parsed = JSON.parse(e.target.result);
      if (!confirm('Deseja substituir os dados atuais pelos dados importados? Isso sobrescreverá tudo.')) return;
      // Substitui todo o estado. Mantemos defaults para chaves ausentes.
      state = Object.assign({ year: YEAR, activeMonth: new Date().getMonth(), color: '#10b981', darkMode: false, habits: [] }, parsed);
      state.habits = state.habits || [];
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
// Painel camuflado (opções)
// -----------------------
function toggleOptionsPanel(){
  // Alterna a visibilidade do painel de opções (export/import)
  optionsPanel.classList.toggle('visible');
}

// -----------------------
// Eventos de controle (liga os elementos do DOM às funções acima)
// -----------------------
// Ao alterar o seletor de cor, atualizamos o estado e redesenhamos as células marcadas
colorPicker.addEventListener('input', (e) => {
  state.color = e.target.value;
  colorValue.textContent = state.color.toUpperCase();
  saveState();
  renderTable(); // atualiza visual das células marcadas
});

// botão de borracha removido; nenhuma lógica necessária


// Adicionar hábito por botão ou Enter
addHabitBtn.addEventListener('click', () => { addHabit(habitNameInput.value); });
habitNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addHabit(habitNameInput.value); });

// Alternar modo claro/escuro
darkToggle.addEventListener('click', () => { state.darkMode = !state.darkMode; saveState(); render(); });

// Abrir painel camuflado
optionsBtn.addEventListener('click', () => { toggleOptionsPanel(); });

// Export / Import handlers
exportBtn.addEventListener('click', () => { exportData(); });
importFileInput.addEventListener('change', (e) => { const f = e.target.files[0]; if (f) handleImportFile(f); e.target.value = ''; });

// -----------------------
// Inicialização (boot)
// -----------------------
// Carrega estado do localStorage e renderiza a interface pela primeira vez.
(function init(){
  loadState();
  if (!state.color) state.color = '#10b981';
  // assegura que não existe campo obsoleto
  if ('eraserOn' in state) delete state.eraserOn;
  render();
})();
