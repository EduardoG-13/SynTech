# BrPec -- Documentacao Completa do Backend

Este documento explica como o backend do sistema BrPec funciona internamente. Cada arquivo, cada pasta, cada regra e cada software utilizado estao descritos aqui de forma que qualquer pessoa consiga entender o sistema, mesmo sem experiencia previa em programacao.

---

## Indice

1. [O que e o backend](#1-o-que-e-o-backend)
2. [Softwares e tecnologias utilizados](#2-softwares-e-tecnologias-utilizados)
3. [Como instalar e executar](#3-como-instalar-e-executar)
4. [Estrutura de pastas e arquivos](#4-estrutura-de-pastas-e-arquivos)
5. [Explicacao de cada arquivo](#5-explicacao-de-cada-arquivo)
6. [O banco de dados](#6-o-banco-de-dados)
7. [Regras de negocio aplicadas no banco](#7-regras-de-negocio-aplicadas-no-banco)
8. [Arquitetura do sistema](#8-arquitetura-do-sistema)
9. [Como o endpoint de health-check funciona](#9-como-o-endpoint-de-health-check-funciona)
10. [Variaveis de ambiente](#10-variaveis-de-ambiente)
11. [Proximos passos](#11-proximos-passos)

---

## 1. O que e o backend

O backend e a parte do sistema que roda no servidor (ou na maquina do desenvolvedor). Ele e responsavel por:

- Receber requisicoes HTTP (ex.: um pedido de "me mostre as tarefas de hoje")
- Processar as regras de negocio (ex.: verificar se o capataz pertence ao retiro)
- Acessar o banco de dados para gravar ou buscar informacoes
- Retornar uma resposta em formato JSON para quem pediu

O frontend (a tela que o usuario ve) envia requisicoes para o backend, e o backend responde com os dados necessarios. O backend nunca exibe nada visual -- ele apenas processa dados.

---

## 2. Softwares e tecnologias utilizados

| Software / Tecnologia | Versao minima | O que e | Por que usamos |
|---|---|---|---|
| **Node.js** | 22.5.0 | Ambiente de execucao de JavaScript no servidor | Permite escrever o backend inteiro em JavaScript. A versao 22.5.0 inclui o modulo `node:sqlite` embutido, que elimina a necessidade de instalar drivers de banco externos |
| **Express** | 4.21.2 | Framework web para Node.js | Facilita a criacao de endpoints HTTP (rotas), tratamento de requisicoes e respostas. E o framework mais utilizado do ecossistema Node.js |
| **SQLite** | (embutido) | Banco de dados relacional em arquivo local | Armazena todos os dados em um unico arquivo no disco. Nao precisa de servidor de banco rodando separadamente. Ideal para a estrategia offline-first do projeto |
| **node:sqlite** | (embutido) | Modulo nativo do Node.js para acessar SQLite | Permite que o backend leia e escreva no banco SQLite sem instalar nenhum pacote adicional. Todas as operacoes sao sincronas (nao usa async/await) |
| **dotenv** | 16.4.7 | Carregador de variaveis de ambiente | Le o arquivo `.env` e disponibiliza as variaveis (porta do servidor, caminho do banco) para o codigo. Evita que credenciais fiquem escritas diretamente no codigo |
| **cors** | 2.8.5 | Middleware de Cross-Origin Resource Sharing | Permite que o frontend (que roda em outra origem/porta) faca requisicoes ao backend sem ser bloqueado pelo navegador |
| **uuid** | 11.1.0 | Gerador de identificadores unicos universais | Gera IDs no formato UUID v7 para os registros do banco. Importante para o cenario offline-first: cada dispositivo pode criar registros sem conflito de IDs |
| **nodemon** | 3.1.9 | Reiniciador automatico (apenas desenvolvimento) | Observa mudancas nos arquivos do projeto e reinicia o servidor automaticamente. Usado apenas durante o desenvolvimento |

---

## 3. Como instalar e executar

### Pre-requisitos (todos os sistemas operacionais)

- **Node.js** versao 22.5.0 ou superior
- **npm** (gerenciador de pacotes, ja vem incluido com o Node.js)

Para verificar se o Node.js esta instalado e na versao correta, abra o terminal e execute:

```
node --version
```

O resultado deve ser `v22.5.0` ou superior. Caso nao tenha instalado, siga as instrucoes de instalacao do seu sistema operacional abaixo.

---

### Windows

#### 1. Instalar o Node.js

Acesse https://nodejs.org e baixe o instalador `.msi` da versao LTS (22.x ou superior). Execute o instalador e siga as opcoes padrao. Apos a instalacao, abra o **PowerShell** e confirme:

```powershell
node --version
npm --version
```

#### 2. Configurar o projeto

Abra o **PowerShell** e navegue ate a pasta do backend:

```powershell
cd C:\caminho\para\g03\src\backend
```

Instale as dependencias:

```powershell
npm install
```

Crie o arquivo de configuracao copiando o modelo:

```powershell
copy .env.example .env
```

#### 3. Iniciar o servidor

Modo desenvolvimento (reinicia automaticamente ao salvar arquivos):

```powershell
npm run dev
```

Modo producao:

```powershell
npm start
```

#### 4. Verificar

Abra outro terminal PowerShell e execute:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/health
```

Ou acesse `http://localhost:3000/api/health` direto no navegador.

---

### macOS

#### 1. Instalar o Node.js

Opcao A -- via Homebrew (recomendado):

```bash
brew install node@22
```

Opcao B -- via instalador: acesse https://nodejs.org e baixe o `.pkg` para macOS.

Confirme a instalacao:

```bash
node --version
npm --version
```

#### 2. Configurar o projeto

Abra o **Terminal** e navegue ate a pasta do backend:

```bash
cd /caminho/para/g03/src/backend
```

Instale as dependencias:

```bash
npm install
```

Crie o arquivo de configuracao:

```bash
cp .env.example .env
```

#### 3. Iniciar o servidor

Modo desenvolvimento:

```bash
npm run dev
```

Modo producao:

```bash
npm start
```

#### 4. Verificar

Em outro terminal:

```bash
curl http://localhost:3000/api/health
```

---

### Linux (Ubuntu/Debian)

#### 1. Instalar o Node.js

Opcao A -- via NodeSource (recomendado para obter a versao 22.x):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Opcao B -- via nvm (gerenciador de versoes):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

Confirme a instalacao:

```bash
node --version
npm --version
```

#### 2. Configurar o projeto

```bash
cd /caminho/para/g03/src/backend
npm install
cp .env.example .env
```

#### 3. Iniciar o servidor

Modo desenvolvimento:

```bash
npm run dev
```

Modo producao:

```bash
npm start
```

#### 4. Verificar

Em outro terminal:

```bash
curl http://localhost:3000/api/health
```

---

### Saida esperada (todos os sistemas)

Ao iniciar o servidor, o terminal deve exibir:

```
[database] Banco SQLite conectado: .../database/brpec.sqlite
[initDb] Banco de dados inicializado com sucesso
[server] Servidor BrPec rodando na porta 3000
   Health-check: http://localhost:3000/api/health
```

A resposta do endpoint `/api/health` deve ser:

```json
{
  "status": "ok",
  "timestamp": "2026-05-18T18:00:00.000Z",
  "uptime": 1.23,
  "banco": "conectado"
}
```

| Campo | Significado |
|---|---|
| **status** | "ok" = servidor rodando e banco acessivel. "erro" = problema |
| **timestamp** | Data e hora exata da verificacao |
| **uptime** | Ha quantos segundos o servidor esta rodando |
| **banco** | "conectado" = SQLite respondeu corretamente. "desconectado" = falha |

Se o campo `banco` retornar "desconectado", verifique se o Node.js esta na versao 22.5.0 ou superior executando `node --version`.

---

## 4. Estrutura de pastas e arquivos

```
src/backend/
│
├── server.js                  # Ponto de entrada do servidor
├── app.js                     # Configuracao do Express (middlewares e rotas)
├── package.json               # Lista de dependencias e scripts
├── .env.example               # Modelo das variaveis de ambiente
├── .env                       # Variaveis de ambiente locais (nao versionado)
├── .gitignore                 # Arquivos ignorados pelo Git
│
├── config/                    # Configuracoes do sistema
│   ├── database.js            # Conexao com o banco SQLite
│   └── initDb.js              # Execucao das migrations na inicializacao
│
├── controllers/               # Camada que recebe as requisicoes HTTP
│   └── healthController.js    # Controller do health-check
│
├── services/                  # Camada de logica de negocio
│   └── healthService.js       # Service do health-check
│
├── repositories/              # Camada de acesso a dados (a implementar)
│   └── .gitkeep
│
├── models/                    # Definicoes de entidades (a implementar)
│   └── .gitkeep
│
├── routes/                    # Registro e agrupamento de rotas
│   └── index.js               # Arquivo que reune todas as rotas
│
├── database/                  # Pasta onde o arquivo SQLite e gerado
│   └── .gitkeep
│
└── tests/                     # Testes automatizados (a implementar)
    └── .gitkeep
```

As pastas `models/`, `repositories/` e `tests/` contem apenas um arquivo `.gitkeep`. Esse arquivo vazio serve para que o Git rastreie a pasta mesmo sem conteudo real. Elas serao preenchidas nas proximas sprints.

---

## 5. Explicacao de cada arquivo

### server.js -- Ponto de entrada

Este e o primeiro arquivo executado quando o servidor e iniciado. Ele faz tres coisas em ordem:

1. Carrega as variaveis de ambiente do arquivo `.env` usando o pacote `dotenv`
2. Chama a funcao `inicializarBanco()` para criar as tabelas do banco se ainda nao existirem
3. Inicia o servidor Express na porta configurada (padrao: 3000)

### app.js -- Configuracao do Express

Cria e configura a aplicacao Express. E separado do `server.js` para facilitar testes futuros (testes podem importar `app.js` sem iniciar o servidor). Configura tres middlewares:

- **cors()**: permite que requisicoes vindas de outras origens (ex.: frontend rodando na porta 5173) sejam aceitas
- **express.json()**: interpreta automaticamente o corpo das requisicoes que chegam em formato JSON
- **express.urlencoded()**: interpreta dados enviados em formato de formulario HTML

Apos os middlewares, monta todas as rotas no prefixo `/api`. Isso significa que todos os endpoints do sistema comecam com `/api/` (ex.: `/api/health`, `/api/tarefas`).

### config/database.js -- Conexao com o banco

Responsavel por abrir (ou criar) o arquivo do banco SQLite. Na inicializacao:

1. Le a variavel de ambiente `DB_PATH` para saber onde o banco fica (padrao: `./database/brpec.sqlite`)
2. Se a pasta `database/` nao existir, cria ela automaticamente
3. Abre o banco usando o modulo `node:sqlite` (embutido no Node.js)
4. Executa `PRAGMA foreign_keys = ON` para ativar a verificacao de chaves estrangeiras (sem isso, o SQLite ignora regras de relacionamento entre tabelas)
5. Exporta a instancia do banco para que outros arquivos possam usa-la

O banco e criado como um arquivo fisico no disco. Se o arquivo nao existir, o SQLite cria um novo banco vazio automaticamente.

### config/initDb.js -- Inicializacao das tabelas

Le o arquivo `src/src/migration.sql` e executa todo o seu conteudo SQL no banco. O migration.sql contem os comandos `CREATE TABLE IF NOT EXISTS` para todas as 11 tabelas do sistema. Como usa `IF NOT EXISTS`, e seguro executar varias vezes -- ele nunca apaga dados existentes.

Se o arquivo de migration nao for encontrado, exibe um erro no console mas nao interrompe o servidor.

### controllers/healthController.js -- Controller do health-check

Recebe a requisicao HTTP `GET /api/health` e delega a verificacao para o `healthService`. Se o resultado for positivo, retorna HTTP 200 (sucesso). Se o banco nao estiver acessivel, retorna HTTP 503 (servico indisponivel).

O controller nunca acessa o banco diretamente. Ele apenas recebe a requisicao, chama o service e devolve a resposta.

### services/healthService.js -- Logica do health-check

Contem a logica real de verificacao. Executa a query `SELECT 1 AS ok` no banco -- essa e a forma mais simples de testar se o banco esta respondendo. Se a query executar sem erro, o banco esta "conectado". Se houver erro, captura a mensagem e retorna "desconectado".

O service nao conhece HTTP. Ele nao sabe o que e uma requisicao, uma resposta, um status code. Ele apenas processa a logica e retorna um objeto com os dados.

### routes/index.js -- Agregador de rotas

Cria um roteador Express e registra todas as rotas do sistema. Atualmente tem apenas uma rota:

- `GET /health` -> chama `healthController.verificarSaude`

Conforme novos endpoints forem criados (tarefas, alertas, movimentacoes), eles serao registrados aqui.

### .env.example -- Modelo de variaveis

Contem as variaveis de ambiente com valores padrao. Deve ser copiado para `.env` no primeiro setup. O arquivo `.env` nunca e commitado no Git porque pode conter configuracoes especificas de cada desenvolvedor.

### .gitignore -- Ignorar arquivos

Lista os arquivos e pastas que o Git nao deve versionar: `node_modules/` (dependencias instaladas), `.env` (configuracoes locais), e arquivos `.sqlite` / `.db` (banco de dados local).

### package.json -- Dependencias e scripts

Define o nome do projeto, a versao, as dependencias de producao (express, cors, dotenv, uuid), as dependencias de desenvolvimento (nodemon) e os scripts disponiveis:

- `npm start`: inicia o servidor normalmente
- `npm run dev`: inicia o servidor com nodemon (reinicia automaticamente ao salvar um arquivo)

---

## 6. O banco de dados

### O que e SQLite

SQLite e um banco de dados relacional que funciona como um arquivo unico no disco. Diferente de bancos como PostgreSQL ou MySQL, o SQLite nao precisa de um servidor rodando separadamente. O proprio codigo do backend abre o arquivo, le e escreve diretamente nele.

### Por que SQLite

O sistema BrPec opera em fazendas com conectividade limitada (Starlink em janelas de horario). Os capatazes precisam registrar tarefas, movimentacoes e alertas mesmo sem internet. O SQLite permite que:

- O dispositivo armazene os dados localmente, sem depender de um servidor remoto
- Os dados sejam sincronizados quando a internet estiver disponivel
- O banco seja criado automaticamente, sem configuracao manual

### Onde fica o arquivo do banco

O banco e criado em `src/backend/database/brpec.sqlite` na primeira execucao do servidor. Esse arquivo contem todas as tabelas e todos os dados. Ele nao e versionado pelo Git (esta no `.gitignore`), pois cada desenvolvedor tera seus proprios dados de teste.

### Tabelas do banco

O banco possui 11 tabelas, criadas pelo script `src/src/migration.sql`:

| Tabela | Descricao | Quantidade de campos |
|---|---|---|
| **retiros** | Unidades operacionais da fazenda (cada retiro e uma area de trabalho) | 4 |
| **usuarios** | Pessoas que usam o sistema (gerente, capataz, coordenador, tecnico de infra) | 8 |
| **tarefas** | Ordens de servico criadas pelo gerente e executadas pelo capataz | 12 |
| **alertas** | Chamados de problemas de infraestrutura (cerca quebrada, bebedouro com defeito) | 14 |
| **movimentacoes** | Registros de eventos do rebanho (nascimento, obito, transferencia, compra/venda) | 10 |
| **evidencias** | Fotos, audios, videos e textos anexados a tarefas, alertas ou movimentacoes | 13 |
| **nascimentos** | Detalhes especificos de um registro de nascimento de animal | 5 |
| **obitos** | Detalhes especificos de um registro de morte de animal | 6 |
| **transferencias** | Detalhes de transferencia de animais entre retiros | 6 |
| **compravendas** | Detalhes de operacoes de compra ou venda de animais | 6 |
| **sync_queue** | Fila tecnica que controla quais registros ainda precisam ser sincronizados com o servidor central | 9 |

### Relacionamentos entre tabelas

```
retiros
  |--- usuarios (um retiro pode ter varios usuarios)
  |--- tarefas (um retiro pode ter varias tarefas)
  |--- alertas (um retiro pode ter varios alertas)
  |--- movimentacoes (um retiro pode ter varias movimentacoes)

usuarios
  |--- tarefas (um usuario cria tarefas e outro executa)
  |--- alertas (um usuario cria alertas e outro resolve)
  |--- movimentacoes (um usuario registra movimentacoes)

tarefas
  |--- evidencias (uma tarefa pode ter varias evidencias)

alertas
  |--- evidencias (um alerta pode ter varias evidencias)

movimentacoes
  |--- evidencias (uma movimentacao pode ter varias evidencias)
  |--- nascimentos (detalhe 1:1)
  |--- obitos (detalhe 1:1)
  |--- transferencias (detalhe 1:1)
  |--- compravendas (detalhe 1:1)
```

---

## 7. Regras de negocio aplicadas no banco

As seguintes regras sao garantidas pelo proprio banco de dados, independentemente do codigo do backend:

### Regras de perfil de usuario

- O campo `perfil` so aceita quatro valores: `gerente`, `capataz`, `coordenador` ou `tecnico_infra`. Qualquer outro valor e rejeitado.
- Se o perfil for `capataz`, o campo `retiro_id` e obrigatorio (todo capataz deve estar vinculado a um retiro). Demais perfis podem atuar sem retiro especifico.
- O campo `email` e unico. Dois usuarios nao podem ter o mesmo email.

### Regras de tarefas

- O campo `status` so aceita: `pendente`, `em_andamento`, `concluida` ou `cancelada`.
- Se o status for `concluida`, o campo `data_conclusao` e obrigatorio (nao pode concluir sem data).
- Cada tarefa esta vinculada obrigatoriamente a um retiro, a um criador e a um responsavel.

### Regras de alertas

- O campo `tipo` so aceita: `cerca`, `bebedouro`, `hidraulica`, `eletrica`, `infraestrutura` ou `outro`.
- O campo `status` so aceita: `aberto`, `em_andamento` ou `fechado`.
- Se o status for `fechado`, o campo `data_resolucao` e obrigatorio.
- A localizacao (latitude e longitude) e obrigatoria em todo alerta.

### Regras de evidencias

- Cada evidencia pertence a exatamente uma origem: uma tarefa, OU um alerta, OU uma movimentacao. Nunca duas ou tres ao mesmo tempo. Isso e garantido por uma restricao CHECK no banco.
- Se o tipo da evidencia for `texto`, o campo `conteudo_texto` e obrigatorio.
- Se o tipo da evidencia for foto, audio, video ou documento, pelo menos um dos campos de arquivo (local, storage ou URL) deve estar preenchido.

### Regras de movimentacoes

- O campo `tipo` so aceita: `nascimento`, `obito`, `transferencia` ou `compravenda`.
- O campo `categoria` so aceita: `bezerro`, `garrote`, `boi_touro`, `bezerra`, `novilha` ou `vaca`.
- Cada especializacao (nascimentos, obitos, transferencias, compravendas) permite no maximo um detalhe por movimentacao (garantido por UNIQUE na coluna `movimentacao_id`).
- Transferencias exigem que o retiro de origem seja diferente do retiro de destino.
- Quantidades devem ser maiores que zero.
- Valores financeiros em compravendas devem ser maiores que zero.

### Controle de sincronizacao

- Todas as tabelas operacionais possuem o campo `sync_status` com valores `pendente`, `sincronizado` ou `erro`.
- A tabela `sync_queue` registra cada operacao pendente (insert, update, delete ou upload) para envio ao servidor central quando a internet estiver disponivel.

---

## 8. Arquitetura do sistema

O backend segue o padrao de arquitetura em camadas **Controller > Service > Repository > Banco**:

```
Requisicao HTTP
      |
      v
  Controller    (recebe a requisicao, valida campos obrigatorios, delega ao service)
      |
      v
    Service      (aplica regras de negocio, orquestra chamadas ao repository)
      |
      v
  Repository    (executa queries SQL no banco, retorna dados puros)
      |
      v
   Banco SQLite  (armazena e recupera dados)
```

### Por que separar em camadas

- **Controller** nao conhece SQL. Se um dia o banco mudar de SQLite para PostgreSQL, o controller nao precisa ser alterado.
- **Service** nao conhece HTTP. Ele pode ser chamado por um controller web, por um teste automatizado, ou por um job de sincronizacao -- sem mudanca.
- **Repository** nao conhece regras de negocio. Ele apenas executa a query que o service pedir. Se a regra mudar, apenas o service e alterado.

Essa separacao facilita a manutencao, os testes e a evolucao do sistema.

### CommonJS

Todo o backend usa o sistema de modulos CommonJS do Node.js:

- Para importar: `const algo = require('./caminho')`
- Para exportar: `module.exports = { funcao }`

Essa escolha evita conflitos com bibliotecas que usam formatos diferentes (como ESModules com `import/export`).

---

## 9. Como o endpoint de health-check funciona

O unico endpoint implementado atualmente e o health-check. Ele serve para verificar se o servidor esta ativo e se o banco de dados esta acessivel.

### Fluxo completo

1. O cliente (navegador, Postman, curl) envia `GET http://localhost:3000/api/health`
2. O Express recebe a requisicao e a encaminha para `routes/index.js`
3. O roteador identifica que `GET /health` deve chamar `healthController.verificarSaude`
4. O controller chama `healthService.verificarSaude()`
5. O service executa `SELECT 1 AS ok` no banco SQLite
6. Se funcionar, retorna `{ status: 'ok', banco: 'conectado' }`; se falhar, retorna `{ status: 'erro', banco: 'desconectado' }`
7. O controller recebe o resultado e envia como JSON com status HTTP 200 (ou 503 se erro)

### Por que o SELECT 1

`SELECT 1` e a query mais leve possivel. Ela nao acessa nenhuma tabela, nao processa nenhum dado. Serve exclusivamente para verificar se o banco responde. Se essa query falhar, algo fundamental esta errado (arquivo corrompido, disco cheio, etc.).

---

## 10. Variaveis de ambiente

O arquivo `.env` (copiado de `.env.example`) contem:

| Variavel | Valor padrao | O que faz |
|---|---|---|
| `PORT` | `3000` | Porta TCP em que o servidor escuta. Altere se a porta 3000 ja estiver em uso |
| `NODE_ENV` | `development` | Define o ambiente de execucao. Pode ser `development`, `test` ou `production`. Futuramente, o comportamento de logs e tratamento de erros pode variar conforme esse valor |
| `DB_PATH` | `./database/brpec.sqlite` | Caminho relativo (a partir da pasta `src/backend/`) onde o arquivo do banco sera criado. Nao ha necessidade de alterar em condicoes normais |

---
