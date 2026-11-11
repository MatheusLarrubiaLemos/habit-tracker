# Habit Tracker

App de rotina e registro de hábitos: web + Android (Capacitor), com servidor próprio (Node + SQLite).

## Ligar o servidor (no PC)
1. Instale o **Node.js LTS**: https://nodejs.org
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
1. Na máquina nova, instale Node.js 20 ou superior e clone este repositório.
2. Copie a pasta **`backend/data`** da máquina antiga para a nova. Ela tem o banco e o segredo do login.
3. Ligue o servidor (`npm --prefix backend install` e depois `npm --prefix backend start`).
4. No app, troque o endereço do servidor em **Conta e servidor**.

## Estrutura
- `www/`: o app. É usado pelo navegador e pelo APK.
  - `models.js`: as classes `Habit` (hábitos) e `Routine` (rotinas)
  - `habit-tracker.js`: a aba Hábitos, a sincronização e a conta
  - `routines.js`: a tela Rotinas (hoje, semana e calendário)
  - `home.js`: a tela Início (resumão) e a tela Configurar
- `backend/`: o servidor (Express + SQLite). O banco fica em `backend/data/habits.db`.
- `android/`: o projeto Android gerado pelo Capacitor.
- `CHANGELOG.md`: as patch notes. 🟣 Mudança grande sobe o número do meio da versão; 🔹 pequena sobe o último.
