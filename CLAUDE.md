# CLAUDE.md — Regras do projeto Habit Tracker

Leia o `README.md` e o `CHANGELOG.md` antes de mexer no projeto.

## CHANGELOG e versão
- **Sempre** atualize o `CHANGELOG.md` com **todas** as mudanças, no topo, seguindo o formato das versões anteriores.
- Marque cada mudança como:
  - 🟣 **GRANDE** (função nova, mudança de estrutura): sobe o número do **meio** (ex.: 1.6.0 → 1.7.0).
  - 🔹 **PEQUENA** (ajuste, correção, detalhe visual): sobe o **último** número (ex.: 1.6.0 → 1.6.1).
- A versão fica em **4 lugares**. Atualize todos juntos:
  1. `package.json` → `"version"`
  2. `backend/package.json` → `"version"`
  3. `android/app/build.gradle` → `versionName` **e** `versionCode` (o `versionCode` sobe +1 a cada versão)
  4. `www/comum/js/habit-tracker.js` → `const APP_VERSION`

## Classes (em `www/comum/js/models.js`)
- `Habit`: hábito, acontece **todo dia**.
- `Routine`: rotina, se repete nos **dias da semana** escolhidos.
- `Appointment` = **Compromisso**: acontece **uma vez só**, numa data marcada.
- **Agenda** = Rotina + Compromisso. A tela Agenda é a `routines` no código (`data-nav="routines"`, `comum/js/routines.js`).

## Versões por aparelho
- Cada aparelho tem o **próprio HTML e CSS**: `www/pc/`, `www/tablet/` e `www/celular/` (`index.html` + `estilo.css`).
- O JS e os tokens são **compartilhados** em `www/comum/` (`comum/js/`, `tokens.css`, `tokens.json`).
- **Toda mudança de tela entra nas 3 versões** (pc, tablet e celular).
- **Não apague nem renomeie `id`s usados pelo JS.** A lista completa está no README, em "Regras para editar o HTML". Se criar um `id` novo, inclua-o lá.
- Se mudar uma cor nos `tokens.css`, atualize também os `tokens.json`.

## App Android (Capacitor) e site
- appId: `com.matheuslemos.habittracker` (Android). Não trocar: no aparelho, vira outro app.
- Depois de mudar algo em `www/`, rode `npx cap sync android` para copiar para `android/`.
- O ícone sai de `assets/icone.svg`. Os PNGs nativos são gerados com `npx @capacitor/assets generate` (veja o README).
- **Não há app nativo de iPhone.** No iPhone (e em qualquer aparelho) usa-se o **site**: a pasta `www/` publicada, com os dados salvos no navegador.

## Idioma
- Textos da tela, mensagens, avisos (toasts) e erros mostrados ao usuário ficam em **português**.
