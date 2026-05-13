# Estrutura do Backend - BRPec

## Visao geral

O backend segue a arquitetura em camadas Controller > Service > Repository > DB. Cada camada tem uma responsabilidade unica e so se comunica com a camada imediatamente abaixo. O objetivo e separar a logica de recebimento HTTP, a logica de negocio e o acesso a dados em arquivos distintos.

O fluxo de qualquer requisicao segue este caminho:

```
Requisicao HTTP
      |
   routes/        --> define qual controller atende qual rota
      |
   controllers/   --> recebe req/res, chama o service, retorna a resposta
      |
   services/      --> executa a logica de negocio, chama o repository
      |
   repositories/  --> monta e executa as queries SQL
      |
   config/database.js --> pool de conexao PostgreSQL (Supabase)
      |
   Banco de dados
```

---

## Estrutura de pastas

```
src/backend/
├── server.js
├── app.js
├── config/
│   └── database.js
├── controllers/
│   └── healthController.js
├── services/
│   └── healthService.js
├── repositories/
├── models/
├── routes/
│   └── index.js
├── middlewares/
│   └── errorHandler.js
├── tests/
├── .env.example
└── package.json
```

---

## Descricao de cada arquivo e pasta

### server.js

Entrypoint da aplicacao. Carrega as variaveis de ambiente do `.env` e inicia o servidor Express na porta definida. Nenhuma logica de negocio deve estar aqui.

Conteudo atual:

```js
require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

Quando alguem executa `npm run dev` ou `node server.js`, este arquivo e o primeiro a rodar.

---

### app.js

Configura o Express. Registra os middlewares na ordem correta e monta as rotas. Exporta o `app` sem chamar `listen()` para que o `server.js` controle a inicializacao e, futuramente, os testes possam importar o app sem subir um servidor real.

Ordem dos middlewares:
1. `cors()` - permite requisicoes de outros dominios
2. `express.json()` - converte o body de requisicoes JSON para objeto JavaScript
3. `express.urlencoded()` - converte dados de formularios HTML
4. `routes` - direciona a requisicao para o controller correto
5. `errorHandler` - captura qualquer erro e retorna JSON padronizado

---

### config/

Pasta para arquivos de configuracao. Atualmente contem apenas a conexao com o banco.

#### config/database.js

Cria um pool de conexao com o PostgreSQL do Supabase usando o pacote `pg`. O pool mantem varias conexoes abertas e reutiliza-as entre as requisicoes, evitando o custo de abrir e fechar conexao a cada query.

Conteudo atual:

```js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
```

O modulo exporta duas coisas:
- `query(text, params)` - funcao que executa uma query SQL parametrizada. E a forma principal de uso nos repositories.
- `pool` - o objeto pool diretamente, para casos que precisem de transacoes.

Exemplo de uso em um repository:

```js
const db = require('../config/database');

// Query simples
const result = await db.query('SELECT * FROM tarefas WHERE retiro_id = $1', [retiroId]);

// Query com INSERT retornando o registro criado
const result = await db.query(
  'INSERT INTO tarefas (titulo, retiro_id) VALUES ($1, $2) RETURNING *',
  [titulo, retiroId]
);
```

O `$1`, `$2` sao parametros posicionais. Nunca concatenar valores diretamente na string SQL para evitar SQL injection.

**Conexao com Supabase:** O Supabase fornece um banco PostgreSQL padrao. A conexao e feita via connection string (variavel `DATABASE_URL` no `.env`). Essa string contem host, porta, usuario, senha e nome do banco. O pool do `pg` se conecta diretamente ao PostgreSQL, sem usar o SDK do Supabase.

**Transacoes:** Para operacoes que precisam de atomicidade (tudo funciona ou nada funciona), use o pool diretamente:

```js
const client = await db.pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO movimentacoes (...) VALUES (...)', [...]);
  await client.query('UPDATE estoque SET quantidade = quantidade - $1 WHERE ...', [...]);
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

---

### routes/

Pasta que contem os arquivos de definicao de rotas. Cada arquivo registra as rotas de um modulo e aponta para o controller correspondente.

#### routes/index.js

Agregador central. Todas as rotas passam por aqui. Para adicionar um novo modulo, basta importar o router do modulo e registrar.

Conteudo atual:

```js
const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/health', healthController.getHealth);

module.exports = router;
```

Exemplo de como ficaria ao adicionar o modulo de tarefas:

```js
const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const tarefasController = require('../controllers/tarefasController');

router.get('/health', healthController.getHealth);

router.get('/tarefas', tarefasController.listar);
router.get('/tarefas/:id', tarefasController.buscarPorId);
router.post('/tarefas', tarefasController.criar);
router.put('/tarefas/:id', tarefasController.atualizar);
router.delete('/tarefas/:id', tarefasController.deletar);

module.exports = router;
```

Quando o numero de rotas crescer, pode-se separar em arquivos por modulo (ex: `routes/tarefasRoutes.js`, `routes/movimentacoesRoutes.js`) e importar todos no `index.js`.

---

### controllers/

Cada controller recebe a requisicao HTTP (`req`, `res`, `next`), extrai os dados necessarios (body, params, query), chama o service correspondente e retorna a resposta ao cliente. O controller nao contem logica de negocio nem acesso ao banco.

#### controllers/healthController.js

```js
const healthService = require('../services/healthService');

const getHealth = async (req, res, next) => {
  try {
    const result = await healthService.checkHealth();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getHealth };
```

O padrao para qualquer controller e:
1. Importar o service correspondente
2. Definir uma funcao para cada rota
3. Dentro da funcao: extrair dados do `req`, chamar o service, retornar o resultado com `res.status().json()`
4. Envolver em try/catch e chamar `next(error)` no catch para que o errorHandler trate o erro

Exemplo de como seria um `tarefasController.js`:

```js
const tarefasService = require('../services/tarefasService');

const listar = async (req, res, next) => {
  try {
    const tarefas = await tarefasService.listarTodas();
    return res.status(200).json(tarefas);
  } catch (error) {
    next(error);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const tarefa = await tarefasService.buscarPorId(req.params.id);
    if (!tarefa) {
      return res.status(404).json({ error: { message: 'Tarefa nao encontrada' } });
    }
    return res.status(200).json(tarefa);
  } catch (error) {
    next(error);
  }
};

const criar = async (req, res, next) => {
  try {
    const novaTarefa = await tarefasService.criar(req.body);
    return res.status(201).json(novaTarefa);
  } catch (error) {
    next(error);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const atualizada = await tarefasService.atualizar(req.params.id, req.body);
    return res.status(200).json(atualizada);
  } catch (error) {
    next(error);
  }
};

const deletar = async (req, res, next) => {
  try {
    await tarefasService.deletar(req.params.id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, deletar };
```

---

### services/

Cada service contem a logica de negocio de um modulo. Nao conhece HTTP (nao recebe `req` nem `res`). Recebe dados puros (objetos, IDs, strings) e retorna dados puros. E aqui que ficam as validacoes, regras de negocio e orquestracao de chamadas ao repository.

#### services/healthService.js

```js
const db = require('../config/database');

const checkHealth = async () => {
  let databaseStatus = 'desconectado';
  try {
    await db.query('SELECT NOW()');
    databaseStatus = 'conectado';
  } catch (error) {
    databaseStatus = 'erro: ' + error.message;
  }
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: databaseStatus,
  };
};

module.exports = { checkHealth };
```

Exemplo de como seria um `tarefasService.js`:

```js
const tarefasRepository = require('../repositories/tarefasRepository');

const listarTodas = async () => {
  return await tarefasRepository.findAll();
};

const buscarPorId = async (id) => {
  return await tarefasRepository.findById(id);
};

const criar = async (dados) => {
  // Validacao de regra de negocio: toda tarefa precisa ter titulo e retiro
  if (!dados.titulo || !dados.retiro_id) {
    const error = new Error('Titulo e retiro sao obrigatorios');
    error.statusCode = 400;
    throw error;
  }
  return await tarefasRepository.create(dados);
};

const atualizar = async (id, dados) => {
  const existente = await tarefasRepository.findById(id);
  if (!existente) {
    const error = new Error('Tarefa nao encontrada');
    error.statusCode = 404;
    throw error;
  }
  return await tarefasRepository.update(id, dados);
};

const deletar = async (id) => {
  const existente = await tarefasRepository.findById(id);
  if (!existente) {
    const error = new Error('Tarefa nao encontrada');
    error.statusCode = 404;
    throw error;
  }
  return await tarefasRepository.remove(id);
};

module.exports = { listarTodas, buscarPorId, criar, atualizar, deletar };
```

A regra e: se a logica envolve decidir se algo e valido, transformar dados, combinar resultados de varias queries ou aplicar uma regra do negocio da BRPec, ela pertence ao service.

---

### repositories/

Cada repository e responsavel por montar e executar queries SQL para uma tabela ou entidade. Nao contem logica de negocio. Recebe dados puros e retorna os resultados do banco.

Esta pasta esta vazia no momento (apenas `.gitkeep`). Quando uma feature for implementada, o primeiro arquivo a ser criado aqui sera o repository correspondente.

Exemplo de como seria um `tarefasRepository.js`:

```js
const db = require('../config/database');

const findAll = async () => {
  const result = await db.query('SELECT * FROM tarefas ORDER BY created_at DESC');
  return result.rows;
};

const findById = async (id) => {
  const result = await db.query('SELECT * FROM tarefas WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const create = async (dados) => {
  const result = await db.query(
    'INSERT INTO tarefas (titulo, descricao, retiro_id, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [dados.titulo, dados.descricao, dados.retiro_id, 'pendente']
  );
  return result.rows[0];
};

const update = async (id, dados) => {
  const result = await db.query(
    'UPDATE tarefas SET titulo = $1, descricao = $2, status = $3 WHERE id = $4 RETURNING *',
    [dados.titulo, dados.descricao, dados.status, id]
  );
  return result.rows[0];
};

const remove = async (id) => {
  await db.query('DELETE FROM tarefas WHERE id = $1', [id]);
};

module.exports = { findAll, findById, create, update, remove };
```

Pontos sobre o repository:
- Toda query usa parametros posicionais (`$1`, `$2`) e nunca concatena valores na string SQL
- `RETURNING *` faz o INSERT/UPDATE retornar o registro completo, evitando uma segunda query
- `result.rows` e o array de resultados retornado pelo `pg`
- `result.rows[0]` retorna o primeiro registro ou `undefined` se nao existir

---

### models/

Pasta reservada para definicoes de entidades do dominio. Pode conter schemas de validacao, constantes ou funcoes utilitarias relacionadas a uma entidade.

No contexto deste projeto, os models nao sao obrigatorios porque o PostgreSQL ja define a estrutura via DDL (CREATE TABLE). Porem, podem ser uteis para centralizar validacoes.

Exemplo de como seria um `tarefaModel.js`:

```js
const statusValidos = ['pendente', 'em_andamento', 'concluida'];

const validar = (dados) => {
  const erros = [];
  if (!dados.titulo) erros.push('Titulo e obrigatorio');
  if (!dados.retiro_id) erros.push('Retiro e obrigatorio');
  if (dados.status && !statusValidos.includes(dados.status)) {
    erros.push('Status invalido. Valores aceitos: ' + statusValidos.join(', '));
  }
  return erros;
};

module.exports = { statusValidos, validar };
```

---

### middlewares/

Funcoes que interceptam requisicoes antes ou depois dos controllers. Ficam entre a requisicao e a resposta.

#### middlewares/errorHandler.js

Middleware global que captura qualquer erro lancado nos controllers ou services. Retorna um JSON padronizado com a mensagem de erro e o status HTTP.

```js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';
  console.error('[ERRO ' + statusCode + '] ' + message);
  return res.status(statusCode).json({
    error: { message, status: statusCode },
  });
};
```

Quando um service lanca um erro com `error.statusCode = 400`, o errorHandler captura e retorna:

```json
{
  "error": {
    "message": "Titulo e retiro sao obrigatorios",
    "status": 400
  }
}
```

Se nenhum `statusCode` for definido, retorna 500 (erro interno).

---

### tests/

Pasta para testes automatizados. Vazia no momento (apenas `.gitkeep`). Quando implementados, os testes devem seguir a convencao `nomeDoModulo.test.js`.

---

### .env.example

Modelo das variaveis de ambiente. Deve ser copiado para `.env` e preenchido com os valores reais. O `.env` nunca deve ser commitado (ja esta no `.gitignore`).

```
PORT=3000
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres
NODE_ENV=development
```

---

## Passo a passo para implementar uma nova feature

Exemplo: implementar o CRUD de tarefas.

### 1. Criar o repository

Arquivo: `repositories/tarefasRepository.js`

Escrever as funcoes que executam as queries SQL para a tabela `tarefas`. Cada funcao faz uma unica operacao no banco: buscar todos, buscar por ID, inserir, atualizar, deletar.

### 2. Criar o service

Arquivo: `services/tarefasService.js`

Importar o repository e escrever as funcoes de logica de negocio. Aqui ficam as validacoes (ex: verificar se o titulo foi preenchido antes de inserir), verificacoes (ex: se o registro existe antes de atualizar) e qualquer transformacao de dados.

### 3. Criar o controller

Arquivo: `controllers/tarefasController.js`

Importar o service e escrever uma funcao para cada rota. Cada funcao recebe `(req, res, next)`, extrai os dados do `req`, chama o service e retorna o resultado.

### 4. Registrar as rotas

Arquivo: `routes/index.js`

Importar o controller e registrar as rotas com os metodos HTTP correspondentes:

```js
const tarefasController = require('../controllers/tarefasController');

router.get('/tarefas', tarefasController.listar);
router.get('/tarefas/:id', tarefasController.buscarPorId);
router.post('/tarefas', tarefasController.criar);
router.put('/tarefas/:id', tarefasController.atualizar);
router.delete('/tarefas/:id', tarefasController.deletar);
```

### 5. Testar

Iniciar o servidor com `npm run dev` e testar as rotas no navegador ou com ferramentas como Postman/Insomnia.

### Resumo da ordem

| Passo | Arquivo | O que fazer |
|-------|---------|-------------|
| 1 | `repositories/tarefasRepository.js` | Queries SQL |
| 2 | `services/tarefasService.js` | Validacoes e logica de negocio |
| 3 | `controllers/tarefasController.js` | Receber req, chamar service, retornar res |
| 4 | `routes/index.js` | Registrar rotas HTTP |
| 5 | Terminal | `npm run dev` e testar |

Esse mesmo passo a passo se aplica para qualquer modulo: movimentacoes, chamados, retiros, eventos zootecnicos.

---

## Banco de dados

### Conexao

O backend se conecta ao PostgreSQL do Supabase usando a biblioteca `pg` (node-postgres). A conexao e feita via pool, que mantem conexoes abertas e reutiliza entre requisicoes.

A connection string segue o formato:

```
postgresql://usuario:senha@host:porta/nome_do_banco
```

Exemplo real:

```
postgresql://postgres:minhaSenha@db.abcdefgh.supabase.co:5432/postgres
```

### Parametros posicionais

Todas as queries devem usar parametros posicionais (`$1`, `$2`, `$3`...) em vez de concatenar valores na string. Isso previne SQL injection.

Correto:
```js
db.query('SELECT * FROM tarefas WHERE retiro_id = $1 AND status = $2', [retiroId, 'pendente']);
```

Incorreto (vulneravel a SQL injection):
```js
db.query(`SELECT * FROM tarefas WHERE retiro_id = ${retiroId} AND status = '${status}'`);
```

### Retorno das queries

O resultado de `db.query()` retorna um objeto com a propriedade `rows`, que e um array de objetos. Cada objeto representa uma linha da tabela.

```js
const result = await db.query('SELECT * FROM tarefas');
// result.rows = [{ id: 1, titulo: 'Verificar cercas', ... }, { id: 2, ... }]

const result = await db.query('SELECT * FROM tarefas WHERE id = $1', [5]);
// result.rows[0] = { id: 5, titulo: '...', ... } ou undefined se nao existir
```

### SSL

Em ambiente de producao, a conexao usa SSL (`ssl: { rejectUnauthorized: false }`). Em desenvolvimento local, SSL esta desabilitado para evitar problemas com certificados.

---

## Regras de organizacao

1. Controllers nao acessam o banco diretamente. Sempre passam pelo service e pelo repository.
2. Services nao conhecem HTTP. Nao recebem `req` nem `res`. Recebem e retornam dados puros.
3. Repositories nao contem logica de negocio. Apenas montam e executam queries SQL.
4. Cada modulo (tarefas, movimentacoes, chamados) tem seu proprio controller, service e repository.
5. Erros de validacao devem ser lancados no service com `statusCode` definido (400, 404, etc.).
6. O errorHandler no middleware captura todos os erros e retorna JSON padronizado.
7. Variaveis de ambiente ficam no `.env` e sao acessadas via `process.env.NOME`.
8. Novas rotas sao registradas apenas em `routes/index.js`.
