# Habit Tracker

App de rotina e registro de hábitos: web, Android e iPhone (Capacitor), com servidor próprio (Node + SQLite).

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

## Como instalar no Android
O PC e o celular precisam estar no **mesmo Wi-Fi**. Para usar fora de casa, veja abaixo.

**Jeito 1: baixar pronto do GitHub (não precisa compilar nada)**
1. No GitHub do projeto, abra a aba **Actions** → **Android (APK)** → o build mais recente com ✓ verde.
2. Lá embaixo, em **Artifacts**, baixe **HabitTracker-apk**. Vem um `.zip` com o `HabitTracker-X.Y.Z.apk` dentro.
3. Mande o `.apk` para o celular e toque nele. No Galaxy, permita **instalar apps desconhecidos** para o app que abriu o arquivo (Meus Arquivos, Chrome…).
4. No app, abra **⋮ › Conta e servidor**, digite o endereço "No celular" e crie a conta ou entre.

**Jeito 2: gerar no PC.** Dê dois cliques em **`gerar-apk.bat`**. Ele cria `HabitTracker.apk` na Área de Trabalho (precisa do Android Studio instalado).

As versões novas instalam **por cima** da antiga, sem perder os dados.

> ⚠️ **Vindo da versão 1.6 ou anterior:** o app mudou de identidade (`com.matheuslemos.habittracker`), então o Android vê como outro app. No app antigo, entre na conta e sincronize; depois desinstale e instale o novo. Os dados do servidor voltam no login.

## Como instalar no iPhone
Não precisa de Mac. Há dois caminhos:

### Caminho rápido e grátis: pela Tela de Início (Safari)
Serve para usar e testar o visual. Não é o app "de verdade" da App Store, mas fica com ícone e abre em tela cheia.
1. Ligue o servidor no PC (veja acima). O iPhone precisa estar no mesmo Wi-Fi.
2. No iPhone, abra o **Safari** e digite o endereço "No celular" (ex.: `http://192.168.0.10:3000`).
3. Toque em **Compartilhar** (o quadrado com a seta) → **Adicionar à Tela de Início** → **Adicionar**.
4. Abra pelo ícone **Hábitos**. Entre na conta em **⋮ › Conta e servidor** (o endereço já vem preenchido).

Limites: o servidor do PC precisa estar ligado para o app **abrir** (é dele que a página vem), e as notificações não funcionam.

### App de verdade: TestFlight (precisa da conta paga da Apple)
O GitHub compila o app num Mac dele e manda para o **TestFlight** (o app de testes da Apple). Quem for testar instala o TestFlight da App Store e recebe um convite.

**O que fazer uma vez só:**
1. Assine o **Apple Developer Program** (pago, por ano) em https://developer.apple.com/programs/.
2. Em https://appstoreconnect.apple.com → **Apps** → **+** → **Novo app**: plataforma iOS, nome "Habit Tracker", idioma português (Brasil), Bundle ID **`com.matheuslemos.habittracker`** (se ele não aparecer na lista, crie antes em developer.apple.com → Certificates, IDs & Profiles → Identifiers).
3. Em App Store Connect → **Usuários e acesso** → **Integrações** → **App Store Connect API** → gere uma chave com acesso **Admin**. Anote o **Issuer ID** e o **Key ID** e baixe o arquivo `AuthKey_XXXX.p8` (só dá para baixar uma vez).
4. Descubra o seu **Team ID** em https://developer.apple.com/account → Membership details.
5. No GitHub do projeto: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Crie estes 4:

   | Secret | O que colocar |
   |---|---|
   | `APPLE_TEAM_ID` | o Team ID (10 letras/números) |
   | `ASC_KEY_ID` | o Key ID da chave |
   | `ASC_ISSUER_ID` | o Issuer ID |
   | `ASC_KEY_P8_BASE64` | o conteúdo do `.p8` em base64. No PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXX.p8"))` |

**Depois, a cada versão:** quando algo entra na `main` (ou ao rodar **Actions → iOS → Run workflow**), o build vai sozinho para o TestFlight. Em App Store Connect → seu app → **TestFlight**, adicione o e-mail de quem vai testar em **Testadores internos**. A pessoa instala o app **TestFlight** no iPhone e aceita o convite.

Sem os secrets, o GitHub só confere se o app compila (para o simulador), sem gerar nada para instalar.

**Na primeira vez que abrir**, o iPhone pergunta se o app pode **encontrar dispositivos na rede local**. Toque em **Permitir**, senão ele não acha o servidor do PC. Se tocar em "Não permitir" sem querer: Ajustes → Privacidade e Segurança → Rede Local → Habit Tracker.

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
- `ios/`: o projeto do iPhone gerado pelo Capacitor (abre no Xcode, mas aqui é compilado pelo GitHub Actions).
- `assets/`: o ícone do app (`icone.svg`) e as imagens de onde saem os ícones e a tela de abertura. Para gerar de novo depois de mudar: `npx @capacitor/assets generate --iconBackgroundColor '#4f46e5' --splashBackgroundColor '#f4f5fb' --splashBackgroundColorDark '#0b0c12'`.
- `.github/workflows/`: os builds automáticos (`android.yml` gera o APK; `ios.yml` compila o iPhone e manda para o TestFlight).
- `CHANGELOG.md`: as patch notes. 🟣 Mudança grande sobe o número do meio da versão; 🔹 pequena sobe o último.
