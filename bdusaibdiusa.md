
### 3.6.4. Consultas SQL e lógica proposicional (sprint 2)

_posicione aqui uma lista de consultas SQL compostas, realizadas pelo back-end da aplicação web, com sua respectiva lógica proposicional, descrita conforme template abaixo. Lembre-se que para usar LaTeX em markdown, basta você colocar as expressões entre $ ou $$_

_Template de SQL + lógica proposicional_

Consultas SQL são instruções que permitem ao sistema recuperar, inserir, atualizar ou remover dados em um banco de dados relacional. Cada consulta é composta por cláusulas que definem quais tabelas serão acessadas (`FROM`, `JOIN`), quais registros serão selecionados (`WHERE`) e como o resultado será apresentado (`ORDER BY`, `LIMIT`). A cláusula `WHERE`, em particular, especifica um conjunto de condições que cada linha precisa satisfazer para ser incluída no resultado, exatamente o ponto onde a lógica proposicional se aplica.

A lógica proposicional é o ramo da lógica matemática que estuda proposições: afirmações que assumem valor verdadeiro (V) ou falso (F). Proposições simples são combinadas por operadores lógicos: conjunção ($\land$, equivalente ao `AND` do SQL), disjunção ($\lor$, equivalente ao `OR`) e negação ($\lnot$, equivalente ao `NOT`), formando expressões compostas cujo valor de verdade depende dos valores de cada parte. A tabela-verdade enumera todas as combinações possíveis de valores das proposições elementares e o resultado da expressão composta para cada combinação, tornando explícita a semântica da condição de filtragem.

A conexão entre os dois formalismos é direta: cada predicado da cláusula `WHERE` de uma consulta SQL corresponde a uma proposição lógica, e os operadores `AND`/`OR` mapeiam diretamente para $\land$/$\lor$. Representar as consultas dessa forma dupla, como código SQL e como expressão proposicional com tabela-verdade, permite verificar formalmente se a lógica de filtragem está correta e comunicar a intenção da consulta de maneira precisa, independente do dialeto SQL utilizado.

As consultas abaixo representam fluxos priorizados do sistema BRPec, alinhados ao modelo físico SQLite da seção 3.6.3. As expressões usam os nomes de colunas do modelo atual, especialmente `responsavel_id`, `criado_por_id`, `data_prevista`, `sync_status` e a fila técnica `sync_queue`.

<center>
  <p><strong>Tabela 8</strong> — Expressões SQL e Lógica Proposicional</p>
</center>

#1 | ---
--- | ---
**Expressão SQL** | `SELECT id, titulo, descricao, status, data_prevista FROM tarefas WHERE responsavel_id = $1 AND date(data_prevista) = date('now') AND (status = 'pendente' OR status = 'em_andamento') ORDER BY data_prevista ASC;` |
**Proposições lógicas** | $A$: a tarefa pertence ao capataz autenticado (`responsavel_id = $1`) <br> $B$: a tarefa está prevista para hoje (`date(data_prevista) = date('now')`) <br> $C$: o status é pendente (`status = 'pendente'`) <br> $D$: o status é em andamento (`status = 'em_andamento'`) |
**Expressão lógica proposicional** | $A \land B \land (C \lor D)$ |
**Tabela Verdade** | <table> <thead> <tr> <th>$A$</th> <th>$B$</th> <th>$C$</th> <th>$D$</th> <th>$A \land B \land (C \lor D)$</th> </tr> </thead> <tbody> <tr> <td>F</td> <td>F</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>F</td> <td>V</td> <td>V</td> <td>F</td> <td>F</td> </tr> <tr> <td>V</td> <td>F</td> <td>V</td> <td>F</td> <td>F</td> </tr> <tr> <td>V</td> <td>V</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>V</td> <td>V</td> <td>V</td> <td>F</td> <td>V</td> </tr> <tr> <td>V</td> <td>V</td> <td>F</td> <td>V</td> <td>V</td> </tr> <tr> <td>V</td> <td>V</td> <td>V</td> <td>V</td> <td>V</td> </tr> </tbody> </table>

<center>
  <p>Fonte: Próprios autores (2026).</p>
</center>

---

#2 | ---
--- | ---
**Expressão SQL** | `UPDATE tarefas SET status = 'concluida', data_conclusao = strftime('%Y-%m-%dT%H:%M:%fZ','now'), sync_status = 'pendente', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = $1 AND responsavel_id = $2 AND status <> 'concluida';` |
**Proposições lógicas** | $A$: a tarefa corresponde ao ID informado (`id = $1`) <br> $B$: a tarefa pertence ao responsável autenticado (`responsavel_id = $2`) <br> $C$: a tarefa ainda não está concluída (`status <> 'concluida'`) |
**Expressão lógica proposicional** | $A \land B \land C$ |
**Tabela Verdade** | <table> <thead> <tr> <th>$A$</th> <th>$B$</th> <th>$C$</th> <th>$A \land B \land C$</th> </tr> </thead> <tbody> <tr> <td>F</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>F</td> <td>V</td> <td>V</td> <td>F</td> </tr> <tr> <td>V</td> <td>F</td> <td>V</td> <td>F</td> </tr> <tr> <td>V</td> <td>V</td> <td>F</td> <td>F</td> </tr> <tr> <td>V</td> <td>V</td> <td>V</td> <td>V</td> </tr> </tbody> </table>

<center>
  <p>Fonte: Próprios autores (2026).</p>
</center>

---

#3 | ---
--- | ---
**Expressão SQL** | `SELECT a.id, a.titulo, a.descricao, a.tipo, a.status, a.created_at, r.nome AS retiro, u.nome AS criado_por FROM alertas a JOIN retiros r ON a.retiro_id = r.id JOIN usuarios u ON a.criado_por_id = u.id WHERE (a.status = 'aberto' OR a.status = 'em_andamento') AND (a.tipo = 'infraestrutura' OR a.tipo = 'cerca' OR a.tipo = 'bebedouro') ORDER BY a.created_at DESC;` |
**Proposições lógicas** | $A$: o alerta está aberto (`status = 'aberto'`) <br> $B$: o alerta está em andamento (`status = 'em_andamento'`) <br> $C$: o tipo é infraestrutura (`tipo = 'infraestrutura'`) <br> $D$: o tipo é cerca (`tipo = 'cerca'`) <br> $E$: o tipo é bebedouro (`tipo = 'bebedouro'`) |
**Expressão lógica proposicional** | $(A \lor B) \land (C \lor D \lor E)$ |
**Tabela Verdade** | <table> <thead> <tr> <th>$A$</th> <th>$B$</th> <th>$C$</th> <th>$D$</th> <th>$E$</th> <th>$(A \lor B) \land (C \lor D \lor E)$</th> </tr> </thead> <tbody> <tr> <td>F</td> <td>F</td> <td>F</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>F</td> <td>F</td> <td>V</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>V</td> <td>F</td> <td>F</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>F</td> <td>V</td> <td>F</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>V</td> <td>F</td> <td>V</td> <td>F</td> <td>F</td> <td>V</td> </tr> <tr> <td>V</td> <td>F</td> <td>F</td> <td>V</td> <td>F</td> <td>V</td> </tr> <tr> <td>F</td> <td>V</td> <td>F</td> <td>F</td> <td>V</td> <td>V</td> </tr> <tr> <td>V</td> <td>V</td> <td>V</td> <td>V</td> <td>V</td> <td>V</td> </tr> </tbody> </table>

<center>
  <p>Fonte: Próprios autores (2026).</p>
</center>

---

#4 | ---
--- | ---
**Expressão SQL** | `SELECT t.id, t.titulo, t.status, t.data_prevista, r.nome AS retiro, u.nome AS responsavel FROM tarefas t JOIN retiros r ON t.retiro_id = r.id JOIN usuarios u ON t.responsavel_id = u.id WHERE t.criado_por_id = $1 AND (t.status = 'pendente' OR t.status = 'em_andamento') AND date(t.data_prevista) >= date('now') ORDER BY t.data_prevista ASC, r.nome ASC;` |
**Proposições lógicas** | $A$: a tarefa foi criada pelo gerente autenticado (`criado_por_id = $1`) <br> $B$: o status é pendente (`status = 'pendente'`) <br> $C$: o status é em andamento (`status = 'em_andamento'`) <br> $D$: a data prevista é hoje ou futura (`date(data_prevista) >= date('now')`) |
**Expressão lógica proposicional** | $A \land (B \lor C) \land D$ |
**Tabela Verdade** | <table> <thead> <tr> <th>$A$</th> <th>$B$</th> <th>$C$</th> <th>$D$</th> <th>$A \land (B \lor C) \land D$</th> </tr> </thead> <tbody> <tr> <td>F</td> <td>F</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>F</td> <td>V</td> <td>F</td> <td>V</td> <td>F</td> </tr> <tr> <td>V</td> <td>F</td> <td>F</td> <td>V</td> <td>F</td> </tr> <tr> <td>V</td> <td>V</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>V</td> <td>V</td> <td>F</td> <td>V</td> <td>V</td> </tr> <tr> <td>V</td> <td>F</td> <td>V</td> <td>V</td> <td>V</td> </tr> <tr> <td>V</td> <td>V</td> <td>V</td> <td>V</td> <td>V</td> </tr> </tbody> </table>

<center>
  <p>Fonte: Próprios autores (2026).</p>
</center>

---

| #5 | Fluxo: Registro de nascimento offline com fila de sincronização (US08 / RF008) |
|---|---|
| **Expressão SQL** | `BEGIN; INSERT INTO movimentacoes (id, retiro_id, responsavel_id, tipo, categoria, data_movimentacao, observacoes, sync_status) VALUES ($1, $2, $3, 'nascimento', $4, $5, $6, 'pendente') ON CONFLICT(id) DO UPDATE SET categoria = excluded.categoria, data_movimentacao = excluded.data_movimentacao, observacoes = excluded.observacoes, sync_status = 'pendente', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE movimentacoes.sync_status != 'sincronizado' AND movimentacoes.responsavel_id = excluded.responsavel_id; INSERT INTO nascimentos (id, movimentacao_id, quantidade, raca) VALUES ($7, $1, $8, $9) ON CONFLICT(id) DO UPDATE SET quantidade = excluded.quantidade, raca = excluded.raca; INSERT INTO sync_queue (id, tabela, registro_id, operacao, payload_json) VALUES ($10, 'movimentacoes', $1, 'insert', $11); COMMIT;` |
| **Proposições lógicas** | $A$: o registro ainda não existe no banco local <br> $B$: o registro existe, mas ainda não foi sincronizado (`sync_status != 'sincronizado'`) <br> $C$: o registro pertence ao mesmo responsável (`responsavel_id = excluded.responsavel_id`) |
| **Expressão lógica proposicional** | $A \lor (B \land C)$ |

| $A$ | $B$ | $C$ | $A \lor (B \land C)$ |
|---|---|---|---|
| F | F | F | F |
| F | F | V | F |
| F | V | F | F |
| F | V | V | V |
| V | F | F | V |
| V | F | V | V |
| V | V | F | V |
| V | V | V | V |

<center>
  <p>Fonte: Próprios autores (2026).</p>
</center>

--- 

| #6 | Fluxo: Registro de óbito offline com fila de sincronização (US09 / RF009) |
|---|---|
| **Expressão SQL** | `BEGIN; INSERT INTO movimentacoes (id, retiro_id, responsavel_id, tipo, categoria, data_movimentacao, observacoes, sync_status) VALUES ($1, $2, $3, 'obito', $4, $5, $6, 'pendente') ON CONFLICT(id) DO UPDATE SET categoria = excluded.categoria, data_movimentacao = excluded.data_movimentacao, observacoes = excluded.observacoes, sync_status = 'pendente', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE movimentacoes.sync_status != 'sincronizado' AND movimentacoes.responsavel_id = excluded.responsavel_id; INSERT INTO obitos (id, movimentacao_id, identificacao_animal, quantidade, causa, exige_evidencia_foto) VALUES ($7, $1, $8, $9, $10, 1) ON CONFLICT(id) DO UPDATE SET causa = excluded.causa, quantidade = excluded.quantidade, identificacao_animal = excluded.identificacao_animal WHERE obitos.movimentacao_id = excluded.movimentacao_id; INSERT INTO sync_queue (id, tabela, registro_id, operacao, payload_json) VALUES ($11, 'movimentacoes', $1, 'insert', $12); COMMIT;` |
| **Proposições lógicas** | $A$: o registro de óbito ainda não existe no banco local <br> $B$: o registro existe, mas ainda não foi sincronizado (`sync_status != 'sincronizado'`) <br> $C$: o registro pertence ao mesmo responsável (`responsavel_id = excluded.responsavel_id`) <br> $D$: a causa da morte foi informada (`causa IS NOT NULL`) |
| **Expressão lógica proposicional** | $(A \lor (B \land C)) \land D$ |

| $A$ | $B$ | $C$ | $D$ | $(A \lor (B \land C)) \land D$ |
|---|---|---|---|---|
| F | F | F | F | F |
| F | F | F | V | F |
| F | F | V | V | F |
| F | V | F | V | F |
| F | V | V | F | F |
| F | V | V | V | V |
| V | F | F | F | F |
| V | F | F | V | V |
| V | F | V | V | V |
| V | V | F | V | V |
| V | V | V | F | F |
| V | V | V | V | V |

<center>
  <p>Fonte: Próprios autores (2026).</p>
</center>


| **Proposições lógicas** | $A$: o registro de óbito ainda não existe no banco local <br> $B$: o registro existe, mas ainda não foi sincronizado (`sync_status != 'sincronizado'`) <br> $C$: o registro pertence ao mesmo responsável (`responsavel_id = excluded.responsavel_id`) <br> $D$: a causa da morte foi informada (`causa IS NOT NULL`) |
| **Expressão lógica proposicional** | $(A \lor (B \land C)) \land D$ |

| $A$ | $B$ | $C$ | $D$ | $(A \lor (B \land C)) \land D$ |
|---|---|---|---|---|
| F | F | F | F | F |
| F | F | F | V | F |
| F | F | V | V | F |
| F | V | F | V | F |
| F | V | V | F | F |
| F | V | V | V | V |
| V | F | F | F | F |
| V | F | F | V | V |
| V | F | V | V | V |
| V | V | F | V | V |
| V | V | V | F | F |
| V | V | V | V | V |

<center>
  <p>Fonte: Próprios autores (2026).</p>
</center>

---
| #7 | Fluxo: Busca de registros pendentes na fila de sincronização (RF010 / RF012) |
|---|---|
| **Expressão SQL** | `SELECT id, tabela, registro_id, operacao, payload_json, tentativas FROM sync_queue WHERE status = 'pendente' AND tentativas < 5 ORDER BY created_at ASC LIMIT 50;` |
| **Proposições lógicas** | $A$: o registro está com status pendente de envio (`status = 'pendente'`) <br> $B$: o número de tentativas de envio é menor que 5 (`tentativas < 5`) |
| **Expressão lógica proposicional** | $A \land B$ |

| $A$ | $B$ | $A \land B$ |
|---|---|---|
| F | F | F |
| F | V | F |
| V | F | F |
| V | V | V |

<center>
  <p>Fonte: Próprios autores (2026).</p>
</center>
---

#8 | ---
--- | ---
**Expressão SQL** | `SELECT m.id, m.tipo, m.categoria, m.data_movimentacao, m.observacoes, r.nome AS retiro, u.nome AS responsavel, o.causa AS causa_obito, o.identificacao_animal, n.quantidade AS qtd_nascimento, t.retiro_origem_id, t.retiro_destino_id, cv.tipo_negocio, cv.valor_financeiro FROM movimentacoes m JOIN retiros r ON m.retiro_id = r.id JOIN usuarios u ON m.responsavel_id = u.id LEFT JOIN obitos o ON o.movimentacao_id = m.id LEFT JOIN nascimentos n ON n.movimentacao_id = m.id LEFT JOIN transferencias t ON t.movimentacao_id = m.id LEFT JOIN compravendas cv ON cv.movimentacao_id = m.id WHERE m.sync_status = 'sincronizado' AND m.retiro_id = $1 AND date(m.data_movimentacao) BETWEEN date($2) AND date($3) ORDER BY m.data_movimentacao ASC;` |
**Proposições lógicas** | $A$: a movimentação já foi sincronizada com o servidor (`sync_status = 'sincronizado'`) <br> $B$: a movimentação pertence ao retiro selecionado pelo coordenador (`retiro_id = $1`) <br> $C$: a data da movimentação está dentro do intervalo de exportação (`data_movimentacao BETWEEN $2 AND $3`) |
**Expressão lógica proposicional** | $A \land B \land C$ |
**Tabela Verdade** | <table> <thead> <tr> <th>$A$</th> <th>$B$</th> <th>$C$</th> <th>$A \land B$</th> <th>$A \land B \land C$</th> </tr> </thead> <tbody> <tr> <td>F</td> <td>F</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>F</td> <td>F</td> <td>V</td> <td>F</td> <td>F</td> </tr> <tr> <td>F</td> <td>V</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>F</td> <td>V</td> <td>V</td> <td>F</td> <td>F</td> </tr> <tr> <td>V</td> <td>F</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>V</td> <td>F</td> <td>V</td> <td>F</td> <td>F</td> </tr> <tr> <td>V</td> <td>V</td> <td>F</td> <td>V</td> <td>F</td> </tr> <tr> <td>V</td> <td>V</td> <td>V</td> <td>V</td> <td>V</td> </tr> </tbody> </table>

<center>
  <p>Fonte: Próprios autores (2026).</p>
</center>
---
## 3.7. WebAPI e endpoints (sprints 3 e 4)

_Utilize um link para outra página de documentação contendo a descrição completa de cada endpoint. Ou descreva aqui cada endpoint criado para seu sistema._

_Cada endpoint deve conter endereço, método (GET, POST, PUT, PATCH, DELETE), header, body, formatos de response e os status codes possíveis (200, 201, 204, 400, 401, 403, 404, 409, 422, 500)._