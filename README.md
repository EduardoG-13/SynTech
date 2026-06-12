# Inteli - Instituto de Tecnologia e Liderança 

<p align="center">
<a href= "https://www.inteli.edu.br/"><img src="/assets/inteli.png" alt="Inteli - Instituto de Tecnologia e Liderança" border="0"></a>
</p>

# BRPec — Syntech

> Sistema web PWA de gestão zootécnica e operacional para a BRPec Agropecuária S.A. — registro offline-first de boletas, chamados de infraestrutura e tarefas de campo, com sincronização automática e exportação para Excel/CSV/PDF.

## Grupo 3 — Syntech

## :student: Integrantes: 
- <a href="https://www.linkedin.com/in/arthurriscadomorais/">Arthur Morais </a>
- <a href="https://www.linkedin.com/in/eduardo-oliveira05/">Eduardo Oliveira</a>
- <a href="https://www.linkedin.com/in/enzo-santos-bezerra-1904403bb/">Enzo Santos Bezerra</a>
- <a href="https://www.linkedin.com/in/guilherme-beltrame-18b1b429b/">Guilherme Munhoz Beltrame</a>
- <a href="https://www.linkedin.com/in/laiza-guimar%C3%A3es-2748b2313/">Laiza Guimaraes</a>
- <a href="https://www.linkedin.com/in/lorena-cordeiro-kopke/">Lorena Kopke</a>
- <a href="https://www.linkedin.com/in/mateus-galatro/">Mateus Gongora Pereira Galatro</a>
- <a href="https://www.linkedin.com/in/miguel-cristiano-costa-160b96320/">Miguel Cristiano Costa</a>

## :teacher: Professores:
### Orientador(a) 
- <a href="https://www.linkedin.com/in/marcelo-gon%C3%A7alves-phd/">Marcelo Gonçalves</a>
### Instrutores
- <a href="https://www.linkedin.com/in/ovidio-netto/">Ovidio Lopes</a>
- <a href="https://www.linkedin.com/in/diogo-martins-gon%C3%A7alves-de-morais-96404732/">Diogo Morais</a> 
- <a href="https://www.linkedin.com/in/gui-cestari/">Guilherme Cestari</a> 
- <a href="https://www.linkedin.com/in/natalia-k-37a62052/">Natalia Kloeckner</a>
- <a href="https://www.linkedin.com/in/filipe-gon%C3%A7alves-08a55015b/">Filipe Gonçalves</a>

## 📝 Descrição

A BRPec Agropecuária S.A. opera 14 retiros no Pantanal mato-grossense onde o fluxo de informações entre campo e escritório é manual — capatazes anotam boletas em papel, coordenadores transcrevem em planilhas Excel, e o gerente toma decisões com dados defasados. O **Syntech** é o sistema PWA que digitaliza esse fluxo na fonte, com foco em três realidades operacionais:

1. **Conectividade intermitente** — capatazes registram tudo offline; ao reconectar, o app sincroniza via outbox SQLite.
2. **Hierarquia de aprovação** — Capataz cria → Coordenador aprova → Gerente consolida → Gerente ADM administra usuários/retiros e pode excluir registros.
3. **Variedade de evidências** — fotos, áudios, GPS e brincos de identificação são parte do registro.

**Quatro perfis** com fluxos próprios:

- **Capataz**: registra boletas (nascimento, óbito, transferência, compra/venda, evolução, manejo) e abre chamados de infraestrutura. Interface com fontes maiores e UPPERCASE para leitura em campo.
- **Coordenador**: aprova boletas dos retiros sob sua responsabilidade, exporta XLSX/CSV/PDF estilizado.
- **Gerente**: visão consolidada da fazenda em dashboards (chamados por retiro, evolução de demandas, tarefas por status).
- **Infraestrutura**: recebe chamados filtrados pela categoria (hidráulica/elétrica/cerca), vê foto + áudio + GPS + local de referência enviados pelo capataz, e registra a solução.
- **Gerente ADM** (variação): único perfil com permissão de excluir qualquer registro do sistema, gateado por `is_admin` em duas camadas (UI + backend).

**Stack:** Node.js 22 + Express + EJS + `node:sqlite` embutido + Supabase para cloud sync + Service Worker + IndexedDB outbox. Exportação XLSX via `exceljs`, PDF via `pdfkit`.

## 📝 Link de demonstração

_(adicionar link do vídeo após gravação)_

## 📁 Estrutura de pastas

Dentre os arquivos e pastas presentes na raiz do projeto, definem-se:

- <b>assets</b>: aqui estão os arquivos relacionados a elementos não-estruturados deste repositório, como imagens.

- <b>document</b>: aqui estão todos os documentos do projeto, como o Web Application  Document (WAD) bem como documentos complementares, na pasta "other".

- <b>src</b>: Todo o código fonte criado para o desenvolvimento do projeto de aplicação web.

- <b>README.md</b>: arquivo que serve como guia introdutório e explicação geral sobre o projeto e a aplicação (o mesmo arquivo que você está lendo agora).

## Configuracao para desenvolvimento

### Pré-requisitos

- [Node.js](https://nodejs.org/pt-br/) v22.5.0 ou superior (necessário para o módulo embutido `node:sqlite`)
- npm (incluso com o Node.js)

### Instalação

1. Clone o repositório:

```sh
git clone <url-do-repositorio>
cd g03
```

2. Instale as dependências:

```sh
npm install
```

3. Acesse o backend e instale suas dependencias:

```sh
cd src/backend
npm install
```

4. Crie o arquivo `.env` a partir do modelo:

```sh
cp .env.example .env
```

O arquivo `.env` já vem com valores padrão funcionais. Não é necessário preencher credenciais externas — o banco SQLite é criado automaticamente na primeira execução.

### Execucao

A partir da pasta `src/backend`, inicie o servidor em modo desenvolvimento:

```sh
npm run dev
```

O terminal deve exibir:

```
[database] Banco SQLite conectado: .../database/brpec.sqlite
[initDb] Banco de dados inicializado com sucesso
[server] Servidor BrPec rodando na porta 3000
   Health-check: http://localhost:3000/api/health
```

### Verificacao

Acesse `http://localhost:3000/api/health` no navegador ou execute no terminal:

```sh
curl http://localhost:3000/api/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "timestamp": "2026-05-18T18:00:00.000Z",
  "uptime": 1.234,
  "banco": "conectado"
}
```

Se o campo `banco` retornar `"desconectado"`, verifique se o Node.js esta na versão 22.5.0 ou superior.

### Estrutura do backend

Arquitetura em camadas: Controller > Service > Repository > Banco SQLite. Documentacao detalhada em [`src/backend/README_BACKEND.md`](src/backend/README_BACKEND.md).

```
src/backend/
├── server.js              # Entrypoint (ponto de entrada)
├── app.js                 # Configuracao do Express
├── config/
│   ├── database.js        # Conexao com o SQLite (node:sqlite)
│   └── initDb.js          # Execucao automatica das migrations
├── controllers/           # Recebe requisicao, delega para o service
├── services/              # Logica de negocio
├── repositories/          # Acesso a dados (queries SQL)
├── models/                # Definicoes de entidades
├── routes/                # Registro de rotas
├── database/              # Diretorio do arquivo SQLite (nao versionado)
├── tests/                 # Testes
├── .env.example           # Modelo de variaveis de ambiente
└── package.json           # Dependencias e scripts
```

### Arquivos que nao devem ser commitados

Os seguintes arquivos e pastas estao no `.gitignore` e nao devem ser versionados:

| Arquivo/Pasta | Motivo |
|---------------|--------|
| `node_modules/` | Dependencias instaladas. Cada dev gera ao rodar `npm install` |
| `.env` | Contem configuracoes locais do ambiente |
| `src/backend/database/*.sqlite` | Banco de dados local, gerado automaticamente |
| `package-lock.json` (backend) | Gerado automaticamente pelo npm |
| `.vscode/`, `.idea/` | Configuracoes de IDE pessoais |
| `.DS_Store`, `Thumbs.db` | Arquivos gerados pelo sistema operacional |

## 🗃 Histórico de lançamentos

* **0.5.0 - 01/06/2026**
    * Configuração do motor de templates EJS e rotas de visualização (`/`, `/dashboard`, `/tasks`).
    * Criação da tabela `schema_migrations` no script de inicialização do banco SQLite (`initDb.ts`).
    * Finalização das seções de Autenticação, Autorização e Resiliência no WAD.
* **0.4.0 - 18/05/2026**
    * Implementação do mecanismo offline-first (IndexedDB no cliente e fila de sincronização `sync_queue` no SQLite).
    * Criação do endpoint de sincronização em lote (`POST /api/sincronizacao/lote`).
* **0.3.0 - 04/05/2026**
    * Desenvolvimento da primeira versão da WebAPI REST (Node.js, Express, TypeScript e SQLite).
    * Criação dos endpoints para CRUD de tarefas, chamados de infraestrutura e eventos de nascimento.
    * Implementação da suite de testes de integração com Jest e Supertest.
* **0.2.0 - 20/04/2026**
    * Elaboração dos protótipos de alta fidelidade e definição da paleta de cores de alto contraste para o campo.
    * Modelagem de banco de dados (DER/MR) e escrita dos scripts de migração DDL.
* **0.1.0 - 06/04/2026**
    * Definição de escopo, análise SWOT, matriz de riscos do projeto e especificação inicial das User Stories.

## 📋 Licença/License
```
Alunos inteli (remover essa observação do readme.md após leitura e execução, junto com o link para o tutorial):

1. Siga o tutorial para criação da licença: https://drive.google.com/file/d/1hXWLHUhjBkPVuGqeE2LZKozFntnJZzlx/view
```

<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"><p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="https://github.com/Intelihub/Template_M2/">MODELO GIT INTELI</a> by <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://www.yggbrasil.com.br/vr">Inteli, Nome do integrante 1, Nome do integrante 2, Nome do integrante 3, Nome do integrante 4, Nome do integrante 5, Nome do integrante 6, Nome do integrante 7</a> is licensed under <a href="http://creativecommons.org/licenses/by/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">Attribution 4.0 International</a>.</p>

