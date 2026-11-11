# Patch Notes — Habit Tracker

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
