# Patch Notes — Habit Tracker

> **Como a versão é numerada (X.Y.Z)**
> - 🟣 **GRANDE** (função nova, mudança de estrutura) → sobe o número do **meio** (ex.: 1.3.0 → 1.4.0)
> - 🔹 **PEQUENA** (ajuste, correção, detalhe visual) → sobe o **último** número (ex.: 1.3.0 → 1.3.1)
>
> Cada item das notas vem marcado como 🟣 GRANDE ou 🔹 PEQUENA.

## v1.4.0 — 11/11/2026 · "Início" (🟣 GRANDE)

### ✨ Novidades
- 🟣 **GRANDE — Tela Início (resumão unificado):** é a primeira tela do app e junta tudo num lugar só.
  - **Destaque do dia:** saudação, data e um anel com a % de tudo que foi feito hoje (hábitos + rotinas), além de quanto falta para fechar o dia.
  - **Resumão em cartões:** rotinas hoje, hábitos hoje, % da semana, % dos hábitos no mês e maior sequência 🔥. Tocar em *Rotinas hoje* ou *Hábitos hoje* abre a tela correspondente.
  - **Rotinas de hoje** (com horário) e **Hábitos de hoje** lado a lado, marcados com as etiquetas *Rotina* e *Hábito*. Dá para marcar como feito direto ali.
  - **Sua semana:** 7 dias com uma barrinha de progresso (hábitos + rotinas). O dia de hoje fica em destaque e tocar num dia abre a janela daquele dia.
  - **Amanhã:** as rotinas programadas para o dia seguinte.
- 🟣 **GRANDE — Menu principal:** no PC fica **na lateral esquerda**. No celular vira uma **barra fixa embaixo**, como nos apps de celular. Os itens são **Início, Hábitos, Rotinas e Configurar**, e o Configurar fica no canto (embaixo no PC, último à direita no celular).
- 🟣 **GRANDE — Tela Configurar:** um lugar só para gerenciar o app.
  - **Hábitos:** lista com sequência atual e melhor sequência, botão *Novo hábito* e editar.
  - **Rotinas:** lista com a programação e a % dos últimos 30 dias, botão *Nova rotina* e editar.
  - **Preferências:** tema (Claro / Escuro / Auto), conta e servidor, backup (exportar/importar) e versão do app.
- 🟣 **GRANDE — Voltar para o Início:**
  - O botão **‹ Início** aparece no topo em qualquer outra tela.
  - O item **Início** do menu também volta.
  - No celular, tocar no logo volta para o Início.

### 🔄 Mudanças
- 🔹 **PEQUENA — Criar hábito:** agora é pelo botão **+ Novo hábito**, que abre a mesma janela de edição com nome e cor. A barra de adicionar que ficava acima da grade saiu.
- 🔹 **PEQUENA — Lista de rotinas:** saiu da tela Rotinas e foi para o **Configurar**. Na tela Rotinas, o botão **+ Nova rotina** fica ao lado da Semana.
- 🔹 **PEQUENA — Título do topo:** mostra o nome da tela aberta (Hábitos, Rotinas, Configurar).
- 🔹 **PEQUENA — Lembra a última tela:** o app lembra a última tela aberta. Na primeira vez, abre no Início.
- 🔹 **PEQUENA — Rodapé:** mostra o total de hábitos e rotinas e a versão do app.
- 🔹 **PEQUENA — Avisos no celular:** os avisos rápidos (toasts) ficam acima da barra de baixo, sem cobrir o menu.
- 🔹 **PEQUENA — Meses dos hábitos:** ao abrir Hábitos no celular, a fileira de meses já rola até o mês atual.

### 🧱 Estrutura do código
- 🔹 **PEQUENA — Novo arquivo** `www/home.js`, com as telas Início e Configurar.
- 🔹 **PEQUENA — Telas sempre atualizadas:** qualquer mudança em hábito ou rotina atualiza a tela que estiver aberta.

### 📱 Android
- 🔹 **PEQUENA — Versão do APK:** `1.4.0` (versionCode 4).

---

## v1.3.0 — 11/11/2026 · "Rotinas" (🟣 GRANDE)

### ✨ Novidades
- 🟣 **GRANDE — Aba Rotinas:** o app agora tem duas abas no topo, **Hábitos** e **Rotinas**. Ele lembra qual aba você deixou aberta.
- 🟣 **GRANDE — Rotinas com programação:** cada rotina tem os próprios dias da semana. Exemplo: *Academia* todos os dias e *Estudar* só terça e quarta. O horário é opcional e as rotinas aparecem ordenadas por ele.
- 🟣 **GRANDE — Hoje em destaque:** um cartão grande no topo mostra a data de hoje, as rotinas do dia e um anel com a % concluída. Dá para marcar como feita ali mesmo.
- 🟣 **GRANDE — Semana em blocos:** sete blocos (Dom a Sáb), cada um com as rotinas do dia e um contador (ex.: 1/3).
  - O dia de hoje fica destacado.
  - As setas ‹ › trocam de semana.
  - No celular, os blocos rolam de lado e já abrem no dia de hoje.
- 🟣 **GRANDE — Calendário grande do mês:** cada dia mostra as rotinas com a cor delas. As feitas aparecem preenchidas.
  - Dia com tudo feito ganha um ✓ verde, e hoje fica destacado.
  - No celular, as rotinas viram bolinhas coloridas.
- 🟣 **GRANDE — Marcar rotina como feita:** em qualquer dia, pelo cartão de hoje, pela semana, pelo calendário ou pela janela do dia. Dias futuros não podem ser marcados.
- 🟣 **GRANDE — Janela do dia:** toque em qualquer dia da semana ou do calendário para:
  - ver e marcar as rotinas daquele dia;
  - **adicionar uma rotina só naquele dia** (ex.: estudar numa sexta);
  - **tirar uma rotina só daquele dia**, sem mudar a programação;
  - criar uma rotina nova a partir dali. Se você não escolher dias da semana, ela entra só naquele dia.
- 🟣 **GRANDE — Janela da rotina:**
  - Nome, dias da semana (com atalhos *Todos os dias*, *Dias úteis* e *Limpar*), horário e cor.
  - Estatísticas: feitas nos últimos 30 dias, % de conclusão e total feitas.
  - Excluir, com opção de desfazer.
- 🟣 **GRANDE — Lista "Minhas rotinas":** cada cartão mostra a programação (ex.: "Ter, Qua · 19:00") e a % de conclusão dos últimos 30 dias.
- 🔹 **PEQUENA — Rodapé por aba:** na aba Rotinas, o rodapé mostra quantas rotinas existem e quantas foram feitas hoje.

### 🧱 Estrutura do código
- 🟣 **GRANDE — Classes para separar rotinas de hábitos:** novo arquivo `www/models.js`.
  - `Registro` é a base comum (id, nome, cor).
  - `Habit` é o hábito: marcação diária, sequências e % do mês.
  - `Routine` é a rotina: dias da semana, horário, dias avulsos, dias pulados, data de início e dias feitos. Ela também sabe dizer se acontece numa data (`isScheduledOn`).
- 🟣 **GRANDE — Código da aba Rotinas separado** em `www/routines.js`.
- 🔹 **PEQUENA — Inicialização do app:** agora só acontece depois que todos os arquivos carregam.

### 🛠️ Servidor
- 🟣 **GRANDE — Novas tabelas** `routines` e `routine_done`, criadas sozinhas ao ligar o servidor.
- 🟣 **GRANDE — Novas rotas** `/api/routines`: listar, criar, editar, excluir e `PUT /api/routines/:id/done/:data` para marcar feita.
- 🟣 **GRANDE — Sincronização das rotinas:** funciona igual à dos hábitos, inclusive offline com fila. No primeiro login, as rotinas do aparelho também são enviadas.
- 🔹 **PEQUENA — Login organizado:** a verificação de login virou um arquivo só (`backend/requireAuth.js`), usado por hábitos e rotinas.
- 🔹 **PEQUENA — Backup completo:** o backup (exportar/importar JSON) agora inclui as rotinas.

### 📱 Android
- 🔹 **PEQUENA — Versão do APK:** `1.3.0` (versionCode 3).

---

## v1.2.0 — 11/11/2026 · "Nuvem em casa"

### ✨ Novidades
- **Conta e sincronização:** nova janela **Conta e servidor** (menu ⋮ ou o status no rodapé). Nela você cria a conta ou entra, informando o endereço do servidor.
- **Mesmos dados em todo lugar:** PC, celular e APK usam a mesma conta e os mesmos hábitos.
- **Funciona sem internet:** se o servidor estiver desligado ou fora do alcance, tudo continua sendo salvo no aparelho e entra numa fila. A fila é enviada sozinha quando o servidor volta.
- **Primeiro login:** os hábitos que já estavam no aparelho são enviados para a conta. Se a conta já tiver hábitos, o app pergunta se você quer juntar os dois.
- **Status no rodapé:** mostra se está *Sincronizado*, *Sincronizando…*, *Servidor fora do ar (N na fila)* ou *Salvo só neste aparelho*. Tocar no status tenta de novo.
- **Sincronização automática:** ao abrir o app, ao voltar para ele e a cada 1 minuto.
- **Botão Testar:** confere se o endereço do servidor está certo antes de entrar.
- **App pelo navegador:** o servidor também entrega o app. Abrindo `http://IP-DO-PC:3000`, o endereço do servidor já vem preenchido.

### 🛠️ Servidor
- **Roda no seu PC:** o banco agora é **SQLite**, um único arquivo em `backend/data/habits.db`. Não precisa instalar banco de dados nem contratar serviço.
- **Fácil de migrar:** para levar para outro PC ou mini computador, basta copiar a pasta `backend/data`.
- **Endereços na tela:** ao ligar, o servidor mostra o endereço para usar no PC e no celular.
- **Segredo de login automático:** é gerado e guardado sozinho (`data/jwt-secret.txt`). O `.env` agora é opcional.
- **Rotas novas:**
  - `PUT /api/habits/:id/marks/:data` marca ou desmarca um dia de forma explícita, evitando erros quando a mesma ação é enviada duas vezes.
  - `POST /api/habits/import` envia vários hábitos de uma vez.
  - `GET /api/health` serve para testar a conexão.
- **Mudança de endereço:** as rotas da API agora ficam em `/api/...`.
- **Login mais longo:** o login dura 1 ano.

### 📱 Android
- **Acesso ao servidor da sua rede:** o APK agora consegue falar com o servidor pela rede de casa (`http`). Para isso, foram ajustados `capacitor.config.json` e `AndroidManifest`.
- **Nova versão do APK:** `1.2.0` (versionCode 2).

### 🧰 Atalhos
- **`iniciar-servidor.bat`:** instala o que falta (só na primeira vez) e liga o servidor.
- **`gerar-apk.bat`:** atualiza o projeto Android, compila o APK e coloca `HabitTracker.apk` na Área de Trabalho.
- **`Habit Tracker - Servidor.bat` na Área de Trabalho:** liga o servidor com dois cliques.

### 🔄 Outras mudanças
- O `package.json` da raiz agora só tem o que o app Android usa. O servidor tem o próprio, em `backend/`.
- A pasta do banco (`backend/data/`) e os arquivos `.apk` não vão para o GitHub.

---

## v1.1.0 — 11/11/2026 · "Repaginada"

### ✨ Novidades
- **Visual novo:** layout moderno com cartões, cantos arredondados e ícones próprios.
- **Tema automático:** claro ou escuro, seguindo o do celular/PC. O botão ☀️/🌙 continua trocando manualmente.
- **Navegação por mês:** setas ‹ › passam de mês e também de ano. Novo botão **Hoje** volta para o mês atual.
- **Painel de resumo** no topo:
  - **Hoje:** quantos hábitos você já fez hoje.
  - **Conclusão do mês:** % de dias marcados até agora.
  - **Maior sequência atual:** 🔥 o hábito com mais dias seguidos.
- **Sequência por hábito:** cada hábito mostra quantos dias seguidos tem (🔥) e quantas marcações no mês.
- **Coluna %:** a taxa de conclusão de cada hábito no mês.
- **Grade melhorada:**
  - Mostra o dia da semana (D, S, T…), com o fim de semana destacado.
  - O dia de hoje fica marcado e a grade já abre rolada até ele.
  - Os dias futuros aparecem mais apagados.
  - O quadrado marcado ganha um ✓ e uma animação, e o celular vibra de leve.
- **Paleta de cores:** 8 cores prontas, além de uma cor personalizada. Cada hábito novo já sugere a próxima cor.
- **Janela de edição:** tocar no nome do hábito abre uma janela para mudar nome e cor. Ela mostra a sequência atual, a melhor sequência e o total de dias, e tem o botão de excluir.
- **Desfazer exclusão:** ao excluir um hábito, aparece um aviso com o botão **Desfazer**.
- **Avisos rápidos (toasts):** substituem os pop-ups de alerta do navegador.
- **Atalhos no PC:** ← → trocam o mês, **H** volta para hoje e **Esc** fecha a janela.
- **Backup:** o arquivo exportado agora leva a data no nome. O app checa se o arquivo é válido antes de importar.
- **Tela vazia** com instruções quando ainda não há hábitos.

### 🔄 Mudanças
- O app agora sempre abre no mês atual.
- O clique simples no nome **não troca mais a cor** sem querer. Tudo isso agora fica na janela de edição.
- O seletor de ano « » e o seletor de cor 🎨 foram substituídos pela navegação de mês e pela paleta.

### 🛠️ Backend (API)
- **Correção de segurança:** antes, um usuário logado conseguia marcar dias nos hábitos de outra pessoa. Agora a API confere se o hábito é seu.
- **Tabelas automáticas:** `users`, `habits` e `habit_marks` são criadas sozinhas quando o servidor liga.
- **Nova rota:** `PATCH /habits/:id` edita o nome e a cor de um hábito.
- **Validações:**
  - Email precisa ser válido e a senha precisa ter pelo menos 6 caracteres.
  - O nome do hábito é obrigatório e a cor precisa estar em hexadecimal.
  - A data precisa estar no formato `AAAA-MM-DD`.
- **Formato das datas:** as datas das marcações agora vêm sempre como `AAAA-MM-DD`.
- **Estabilidade:**
  - Um erro no banco de dados não derruba mais o servidor (ele responde com erro 500).
  - O servidor avisa se `JWT_SECRET` ou `DATABASE_URL` não estiverem configurados.
- **Banco local:** o SSL só é ativado para banco remoto, então agora funciona com um Postgres no próprio PC.
- **Novo arquivo** `.env.example` com as configurações que o servidor precisa.

### 💾 Compatibilidade
- Os dados salvos continuam na mesma chave (`habitTrackerData_v1`). Seus hábitos e marcações antigos aparecem normalmente.

---

## v1.0.0
- Versão inicial: grade de hábitos por mês, marcação de dias, cores por hábito, modo escuro, exportar/importar JSON, app Android via Capacitor e API com login.
