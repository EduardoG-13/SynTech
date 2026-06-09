# 📱 Implementação de Salvar Operações Offline - [SP4]

## ✅ O que foi implementado

### 1. **Funções de Persistência Local** (`src/public/js/db.js`)
- ✅ `salvarFila(tipo, dados)` - Salva operação offline na sync_queue do IndexedDB
  - Tipos permitidos: `'tarefa'`, `'obito'`, `'chamado'`
  - Status: `'PENDENTE'`
  - Timestamp automático (ISO 8601)

- ✅ `listarFila()` - Lista todas as operações pendentes

- ✅ `atualizarFila(registro)` - Atualiza registro na fila

- ✅ `removerFila(id)` - Remove registro após sincronização bem-sucedida

- ✅ `buscarFilaPorId(id)` - Busca uma operação específica

### 2. **Interceptador de Requisições Offline** (`src/public/js/offline-interceptor.js`)
- ✅ Monitora status online/offline via `navigator.onLine`
- ✅ Detecta eventos `online` e `offline` do navegador
- ✅ `fazerRequisicaoComOffline(url, opcoes)` - Wrapper que:
  - Tenta fazer a requisição normalmente
  - Se falhar e estiver offline: salva na fila local
  - Retorna resposta estruturada com status
  
- ✅ `sincronizarFilaPendente()` - Processa fila quando voltar online:
  - Percorre todos os registros pendentes
  - Tenta reenviar cada requisição
  - Remove da fila ao sincronizar com sucesso
  - Incrementa contador de tentativas se falhar
  
- ✅ `estaOnline()` - Verifica status de conectividade
- ✅ `forcarSincronizacao()` - Sincroniza manualmente

### 3. **Handlers dos Formulários**

#### **Nova OS** (`src/public/js/nova-os-handler.js`)
- ✅ Intercepta submit do formulário `#form-nova-os`
- ✅ Coleta dados e valida campos obrigatórios
- ✅ Determina tipo baseado em operação (tarefa/chamado)
- ✅ Chama `fazerRequisicaoComOffline()` para POST
- ✅ Feedback diferenciado para offline vs. erro real
- ✅ Limpa formulário e volta ao voltar

#### **Resolver Chamado** (`src/public/js/chamado-resolver-handler.js`)
- ✅ Intercepta submit do formulário `#form-resolver-chamado`
- ✅ Processa upload de foto e converte para Base64
- ✅ Valida tamanho máximo (10MB)
- ✅ Chama `fazerRequisicaoComOffline()` para PUT
- ✅ Contador de caracteres dinâmico

### 4. **Integração em Templates**

#### **Footer** (`src/views/partials/footer.ejs`)
- ✅ Carrega `offline-interceptor.js` como módulo
- ✅ Expõe funções globalmente para uso em templates
- ✅ Badge de status online/offline (`#onlineStatus`)

#### **Nova OS** (`src/views/nova-os.ejs`)
- ✅ Formulário com ID `#form-nova-os`
- ✅ Carrega handler específico

#### **Resolver Chamado** (`src/views/chamado-resolver.ejs`)
- ✅ Formulário com ID `#form-resolver-chamado`
- ✅ Input hidden para ID do chamado
- ✅ Carrega handler específico

## 🔄 Fluxo de Funcionamento

### Online (Conectado):
```
Usuário submete formulário
  ↓
Handler coletaContextAndRender dados
  ↓
fazerRequisicaoComOffline() → fetch() bem-sucedido
  ↓
Resposta retorna com sucesso
  ↓
Feedback ao usuário: ✅ Enviado com sucesso
```

### Offline (Sem conexão):
```
Usuário submete formulário
  ↓
Handler coleta dados
  ↓
fazerRequisicaoComOffline() → fetch() falha
  ↓
Detecta offline via navigator.onLine
  ↓
salvarFila(tipo, dados) → Persiste no IndexedDB
  ↓
Feedback ao usuário: 📱 Salvo localmente, sincronizará depois
  ↓
Form reseta
```

### Reconexão (Voltou online):
```
Navegador dispara evento 'online'
  ↓
sincronizarFilaPendente() iniciada automaticamente
  ↓
Para cada registro na fila:
  - Tenta fazer POST/PUT da requisição original
  - Se sucesso: remove da fila
  - Se erro: incrementa tentativas
  ↓
Console log com resumo (sucessos/erros)
```

## 📦 Estrutura de Dados

### Registro na Fila:
```json
{
  "id": 1,  // Auto-incrementado
  "tipo": "chamado",  // 'tarefa', 'obito', 'chamado'
  "dados": {
    "url": "/api/tarefas",
    "metodo": "POST",
    "dados": { /* payload original */ },
    "tentativas": 0,
    "ultimaTentativa": "2026-06-07T14:30:00.000Z"
  },
  "status": "PENDENTE",
  "timestamp": "2026-06-07T14:30:00.000Z"
}
```

## 🧪 Testes

Arquivo: `src/backend/tests/offline-operations.test.ts`

Testa:
- ✅ Disponibilidade dos scripts de offline
- ✅ Presença de handlers nos formulários
- ✅ Funções do db.js expostas globalmente
- ✅ Scripts carregados no footer
- ✅ Endpoints preparados para receber requisições offline

Execute:
```bash
npm test -- offline-operations.test.ts
```

## 🎯 Critérios de Aceite Atendidos

| Critério | Status |
|----------|--------|
| **Dado que** o dispositivo está offline | ✅ Monitorado via `navigator.onLine` |
| **Quando** submete formulário de óbito/tarefa/chamado | ✅ Handlers interceptam submit |
| **Então** registrado em sync_queue com status PENDENTE | ✅ `salvarFila()` persiste com status 'PENDENTE' |
| **E** sincroniza quando reconectar | ✅ `sincronizarFilaPendente()` processa ao voltar online |
| **E** feedback diferenciado offline vs. erro | ✅ Alertas distintos para cada cenário |

## 🚀 Uso

### Desenvolvedor (usando no JavaScript):
```javascript
// Importar funcionalidade
import { fazerRequisicaoComOffline, sincronizarFilaPendente } from '/public/js/offline-interceptor.js';

// Fazer requisição com tratamento offline
const resultado = await fazerRequisicaoComOffline('/api/tarefas', {
  metodo: 'POST',
  dados: { /* payload */ },
  tipo: 'tarefa'
});

if (resultado.sucesso) {
  console.log('✅ Enviado com sucesso');
} else if (resultado.offline) {
  console.log('📱 Salvo localmente:', resultado.mensagem);
}

// Forçar sincronização manual
await syncronizarFilaPendente();
```

### Usuário Final (interface):
1. Preenche formulário offline
2. Clica "Enviar"
3. Sistema detecta falta de conexão
4. Alerta: "Salvo localmente. Sincronizará quando houver conexão."
5. Ao reconectar, sincronização automática ocorre
6. Badge de status muda de 🔴 Offline para 🟢 Online

## 📝 Notas Importantes

1. **Flag de Base64**: O payload já indica se há foto via `temFoto` booleano
2. **Limite de Armazenamento**: IndexedDB tipicamente oferece 50MB-100MB de espaço
3. **Sincronização Automática**: Ocorre ao conectar e também periodicamente
4. **Reprocessamento**: Registros com erro continuam na fila para retry futuro
5. **Limpeza**: Remova registros manually quando necessário via `removerFila(id)`

## 🔗 Relacionados

- **Requisito Funcional**: RF010 - Gravação de dados localmente em banco local (IndexedDB)
- **Regra de Negócio**: RN10 - Limites de armazenamento local de fotos/vídeos
- **User Story**: US08 - Como capataz, posso salvar apontamentos offline
- **Card AR1**: Sincronização offline-first (Dependência)

---

**Status**: ✅ Implementado e testado
**Última atualização**: 2026-06-07
