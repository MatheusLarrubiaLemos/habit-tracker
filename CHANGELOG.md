# Patch Notes — Habit Tracker

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
