# Habit Tracker

App de rotina e registro de hábitos: web + Android (Capacitor), com servidor próprio (Node + SQLite).

## Ligar o servidor (no PC)
1. Instale o **Node.js 22 LTS ou mais novo**: https://nodejs.org (versões antigas não funcionam)
2. Dê dois cliques em **`iniciar-servidor.bat`** (ou no atalho da Área de Trabalho).
3. Se o Windows perguntar sobre o firewall, marque **Redes privadas** e clique em **Permitir**.
4. A janela mostra os endereços. Exemplo:
   ```
   Neste PC:     http://localhost:3000
   No celular:   http://192.168.0.10:3000
   ```
   Deixe a janela aberta enquanto usa o app.

## Usar no celular (APK)
1. Dê dois cliques em **`gerar-apk.bat`**. Ele cria `HabitTracker.apk` na Área de Trabalho.
2. Mande o arquivo para o celular e instale. Pode ser preciso permitir "instalar apps desconhecidos".
3. No app, abra **⋮ › Conta e servidor**, digite o endereço "No celular" e crie a conta ou entre.

O celular precisa estar no **mesmo Wi-Fi** que o PC. Para usar fora de casa, veja abaixo.

## Usar fora de casa
Instale o **Tailscale** (gratuito) no PC e no celular, entrando com a mesma conta. No app, use o endereço Tailscale do PC (ex.: `100.x.x.x:3000`).

## Migrar para outro PC ou mini computador (ex.: Raspberry Pi)
1. Na máquina nova, instale Node.js 22 ou superior e clone este repositório.
2. Copie a pasta **`backend/data`** da máquina antiga para a nova. Ela tem o banco e o segredo do login.
3. Ligue o servidor (`npm --prefix backend install` e depois `npm --prefix backend start`).
4. No app, troque o endereço do servidor em **Conta e servidor**.

## Versões por aparelho (PC, tablet e celular)
Cada aparelho tem **o seu próprio HTML e CSS**, para poder desenhar e mexer em cada um separado (Figma etc.). A **lógica** (JS) é uma só, compartilhada.

```
www/
  index.html          página de entrada: abre a versão certa pela largura da tela
  pc/                 PC (1025px ou mais)      → index.html + estilo.css
  tablet/             tablet (721px a 1024px)  → index.html + estilo.css
  celular/            celular (até 720px)      → index.html + estilo.css
  comum/
    tokens.css        cores, sombras e raios (claro e escuro), iguais nos 3
    tokens.json       os mesmos tokens para importar no Figma (plugin Tokens Studio)
    js/               lógica compartilhada: models, hábitos, rotinas, início, sincronização
      aparelho.js     decide qual versão abrir
```

- **Mudar o visual só do celular:** edite `celular/estilo.css` (e `celular/index.html`, se precisar). O PC e o tablet não mudam.
- **Mudar as cores de tudo:** edite `comum/tokens.css` e, se usar o Figma, o `tokens.json`.
- **Troca automática:** se a janela muda de tamanho, o app troca de versão sozinho. Para forçar uma versão, abra com `?aparelho=pc`, `?aparelho=tablet` ou `?aparelho=celular`. Para voltar ao automático, use `?aparelho=auto`.
- **Para testar:** use o **Visualizador** da Área de Trabalho, com os botões Celular, Tablet e PC.

### Regras para editar o HTML
O JS procura os elementos pelo `id`. Pode mudar à vontade a ordem, o texto, as classes e o CSS. Mas **não apague nem renomeie** estes `id`s, em nenhuma das 3 versões:

`accountBtn`, `accountEmail`, `accountLast`, `accountLoggedIn`, `accountLoggedOut`, `accountModal`, `accountMsg`, `accountServer`, `apptDateInput`, `apptList`, `apptModal`, `apptNameInput`, `apptNoteInput`, `apptSwatches`, `apptTimeInput`, `apptTitle`, `brandBtn`, `calendar`, `calNextBtn`, `calPrevBtn`, `calTitle`, `calTodayBtn`, `cancelApptBtn`, `cancelEditBtn`, `cancelRoutineBtn`, `clearDaysBtn`, `clearPastApptsBtn`, `closeAccountBtn`, `closeDayBtn`, `darkToggle`, `dayAddBtn`, `dayAddRow`, `dayAddSelect`, `dayApptBtn`, `dayChips`, `dayList`, `dayModal`, `dayNewBtn`, `dayTitle`, `deleteApptBtn`, `deleteHabitBtn`, `deleteRoutineBtn`, `editModal`, `editNameInput`, `editStats`, `editSwatches`, `editTitle`, `emailInput`, `emptyState`, `everyDayBtn`, `exportBtn`, `greeting`, `habitsView`, `habitTable`, `homeAppts`, `homeBtn`, `homeHabits`, `homeHero`, `homeRoutines`, `homeStats`, `homeTomorrow`, `homeView`, `homeWeek`, `importFileInput`, `loginForm`, `logoutBtn`, `manageAccount`, `manageAccountBtn`, `manageExportBtn`, `manageHabits`, `manageNewAppt`, `manageNewHabit`, `manageNewRoutine`, `manageVersion`, `manageView`, `monthName`, `newApptBtn`, `newHabitBtn`, `newRoutineBtn`, `nextMonthBtn`, `nextWeekBtn`, `optionsBtn`, `optionsPanel`, `pageTitle`, `passwordInput`, `pastApptRow`, `pastApptText`, `prevMonthBtn`, `prevWeekBtn`, `registerBtn`, `routineHint`, `routineList`, `routineModal`, `routineNameInput`, `routineStats`, `routinesView`, `routineSwatches`, `routineTimeInput`, `routineTitle`, `saveApptBtn`, `saveEditBtn`, `saveRoutineBtn`, `serverInput`, `stats`, `summary`, `syncNowBtn`, `syncStatus`, `tableWrap`, `tabs`, `testServerBtn`, `thisWeekBtn`, `toast`, `todayBtn`, `todayCard`, `weekdaysBtn`, `weekGrid`, `weekLabel`, `yearName`

Também use os atributos `data-nav="home|habits|routines|manage"` nos botões de menu (`routines` é a tela **Agenda**), `data-go="…"` nos links que levam a outra tela e `data-new-appt` em links que abrem "Novo compromisso".

Quando uma tela nova for criada, ela precisa entrar nas 3 versões (`pc/`, `tablet/` e `celular/`).

### Do Figma para o código
- Crie 3 frames: **Desktop** (1366×800), **Tablet** (1024×768 ou 768×1024) e **Celular** (390×844).
- Importe `comum/tokens.json` no plugin **Tokens Studio**. Ele traz as cores com os mesmos nomes do código (`accent`, `surface`, `text`…).
- Na hora de passar para o código, cada frame vira o `estilo.css` (e o `index.html`, se mudar a estrutura) da pasta correspondente.

## Estrutura
- `www/`: o app. É usado pelo navegador e pelo APK. Veja "Versões por aparelho" acima.
  - `comum/js/models.js`: as classes `Habit` (hábitos), `Routine` (rotinas, que se repetem) e `Appointment` (compromissos, que acontecem uma vez só)
  - `comum/js/habit-tracker.js`: a tela Hábitos, a sincronização e a conta
  - `comum/js/routines.js`: a tela **Agenda** (rotinas + compromissos: hoje, semana, calendário e as janelas do dia, da rotina e do compromisso)
  - `comum/js/home.js`: a tela Início (resumão) e a tela Configurar
- `backend/`: o servidor (Express + SQLite). O banco fica em `backend/data/habits.db`.
- `android/`: o projeto Android gerado pelo Capacitor.
- `CHANGELOG.md`: as patch notes. 🟣 Mudança grande sobe o número do meio da versão; 🔹 pequena sobe o último.
