# Inteli - Instituto de Tecnologia e Liderança 

<p align="center">
<a href= "https://www.inteli.edu.br/"><img src="/assets/inteli.png" alt="Inteli - Instituto de Tecnologia e Liderança" border="0"></a>
</p>

# Nome do projeto

## Nome do grupo

## :student: Integrantes: 
- <a href="https://www.linkedin.com/in/filipe-salotti-9ab184310/">Arthur Morais </a>
- <a href="https://www.linkedin.com/in/eduardo-gabriel-de-oliveira-1ab818220/">Eduardo Oliveira</a>
- <a href="https://www.linkedin.com/in/enzo-santos-bezerra-1904403bb/">Enzo Santos Bezerra</a>
- <a href="https://www.linkedin.com/in/guilherme-beltrame-18b1b429b/">Guilherme Munhoz Beltrame</a>
- <a href="https://www.linkedin.com/in/laiza-guimar%C3%A3es-2748b2313/">Laiza Guimaraes</a>
- <a href="https://www.linkedin.com/in/kaylan-alexandre/">Lorena Kopke</a>
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

_Descreva seu projeto (até 600 palavras)_

## 📝 Link de demonstração

_Coloque aqui o link para o vídeo de demonstração do projeto_

## 📁 Estrutura de pastas

Dentre os arquivos e pastas presentes na raiz do projeto, definem-se:

- <b>assets</b>: aqui estão os arquivos relacionados a elementos não-estruturados deste repositório, como imagens.

- <b>document</b>: aqui estão todos os documentos do projeto, como o Web Application  Document (WAD) bem como documentos complementares, na pasta "other".

- <b>src</b>: Todo o código fonte criado para o desenvolvimento do projeto de aplicação web.

- <b>README.md</b>: arquivo que serve como guia introdutório e explicação geral sobre o projeto e a aplicação (o mesmo arquivo que você está lendo agora).

## Configuracao para desenvolvimento

### Pre-requisitos

| Ferramenta | Versao minima | Observacao |
|------------|---------------|------------|
| Node.js | 18.x LTS | [Download](https://nodejs.org/) |
| npm | 9.x | Incluido com o Node.js |
| Supabase | -- | Projeto configurado com banco PostgreSQL |

### Instalacao

1. Clone o repositorio:

```sh
git clone https://git.inteli.edu.br/graduacao/2026-1b/t26/g03.git
cd g03
```

2. Instale as dependencias da raiz (commitlint, husky):

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

5. Preencha o `.env` com os dados do seu projeto Supabase. A connection string esta disponivel em Supabase Dashboard > Settings > Database > Connection string > URI.

```env
PORT=3000
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres
NODE_ENV=development
```

### Execucao

A partir da pasta `src/backend`, inicie o servidor em modo desenvolvimento:

```sh
npm run dev
```

O terminal deve exibir:

```
Servidor rodando em http://localhost:3000
Health-check: http://localhost:3000/health
```

### Verificacao

Acesse `http://localhost:3000/health` no navegador ou execute no terminal:

```sh
curl http://localhost:3000/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "timestamp": "2026-05-07T18:00:00.000Z",
  "uptime": 1.234,
  "database": "conectado"
}

```

Se o campo `database` retornar `"erro: ..."`, verifique se a `DATABASE_URL` no `.env` esta correta.

### Estrutura do backend

Arquitetura em camadas: Controller > Service > Repository > DB. Documentacao detalhada em [`src/ESTRUTURA_BACKEND.md`](src/ESTRUTURA_BACKEND.md).

```
src/backend/
├── server.js              # Entrypoint
├── app.js                 # Configuracao do Express
├── config/
│   └── database.js        # Pool de conexao PostgreSQL
├── controllers/           # Recebe requisicao, delega para o service
├── services/              # Logica de negocio
├── repositories/          # Acesso a dados (queries SQL)
├── models/                # Definicoes de entidades
├── routes/                # Registro de rotas
├── middlewares/            # Error handler
├── tests/                 # Testes
├── .env.example           # Modelo de variaveis de ambiente
└── package.json           # Dependencias e scripts
```

### Arquivos que nao devem ser commitados

Os seguintes arquivos e pastas estao no `.gitignore` e nao devem ser versionados:

| Arquivo/Pasta | Motivo |
|---------------|--------|
| `node_modules/` | Dependencias instaladas. Cada dev gera ao rodar `npm install` |
| `.env` | Contem credenciais do banco de dados |
| `package-lock.json` (backend) | Gerado automaticamente pelo npm |
| `supabase/.branches`, `supabase/.temp` | Estado local do Supabase CLI |
| `.vscode/`, `.idea/` | Configuracoes de IDE pessoais |
| `.DS_Store`, `Thumbs.db` | Arquivos gerados pelo sistema operacional |

## 🗃 Histórico de lançamentos

* 0.5.0 - XX/XX/2024
    * 
* 0.4.0 - XX/XX/2024
    * 
* 0.3.0 - XX/XX/2024
    * 
* 0.2.0 - XX/XX/2024
    * 
* 0.1.0 - XX/XX/2024
    *

## 📋 Licença/License
```
Alunos inteli (remover essa observação do readme.md após leitura e execução, junto com o link para o tutorial):

1. Siga o tutorial para criação da licença: https://drive.google.com/file/d/1hXWLHUhjBkPVuGqeE2LZKozFntnJZzlx/view
```

<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"><p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="https://github.com/Intelihub/Template_M2/">MODELO GIT INTELI</a> by <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://www.yggbrasil.com.br/vr">Inteli, Nome do integrante 1, Nome do integrante 2, Nome do integrante 3, Nome do integrante 4, Nome do integrante 5, Nome do integrante 6, Nome do integrante 7</a> is licensed under <a href="http://creativecommons.org/licenses/by/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">Attribution 4.0 International</a>.</p>

