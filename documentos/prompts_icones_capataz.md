# Prompts de Geração de Ícones — Sistema BRPec / SynTech

Levantamento completo dos emojis usados no projeto, com prompts prontos para gerar ícones consistentes em IA generativa (Midjourney / DALL-E / Imagen / Stable Diffusion). Após gerar como PNG transparente 512×512, exportar também como `.ico` para uso no projeto.

## 📐 Estilo base (colar no início de TODO prompt)

> "Flat minimalist icon, single centered subject, Phosphor-icons style with bold/fill weight, thick rounded strokes, deep green (#1A4D2E) on transparent background, no text, no shadow, 1:1 square aspect ratio, 512x512px, generous padding around the subject (subject occupies ~65% of canvas), high contrast for outdoor sunlight readability, simple and instantly recognizable for low-literacy users."

**Regras obrigatórias** (atacam diretamente a crítica do Art. 7 do WAD):
- **1:1 quadrado, 512×512** — reduz bem até 24px sem perder legibilidade
- **Padding generoso** — subject ocupa ~65% do canvas
- **Cor única** `#1A4D2E` (verde profundo), exceto status (vermelho/âmbar/verde semânticos)
- **Sem texto** dentro do ícone — label textual sempre acompanha
- **Mesmo modelo/seed** entre ícones para uniformidade de traço

---

## 1. ✅ Ações universais (botões e estados)

### ✅ Sucesso / Confirmar
> [estilo base] + "A bold checkmark inside a rounded circle, deep green color, representing success or confirmation."

### ❌ Erro / Cancelar
> [estilo base, usar VERMELHO `#D32F2F`] + "A bold X mark inside a rounded circle, representing error or cancellation."

### ✏️ Editar
> [estilo base] + "A simple pencil with a soft eraser tip, slightly tilted, representing edit or modify."

### ✓ Check simples (inline)
> [estilo base] + "A thin checkmark stroke without circle, used inline next to text items."

### ➕ Adicionar
> [estilo base] + "A bold plus sign with rounded ends, representing add new item."

### 🗑️ Excluir / Remover
> [estilo base] + "A simple trash can icon with rounded lid, representing delete."

### 💾 Salvar
> [estilo base] + "A floppy disk icon with a folded corner, representing save data."

### 👁️ Mostrar senha
> [estilo base] + "An open eye with a centered pupil, representing show/reveal password."

### 🔍 Buscar
> [estilo base] + "A magnifying glass tilted to the right, representing search."

### 🚪 Sair / Logout
> [estilo base] + "A door slightly ajar with an arrow pointing out to the right, representing logout."

### 🔒 Acesso restrito
> [estilo base, usar ÂMBAR `#A64B00`] + "A closed padlock with a thick shackle, representing locked or restricted access."

### 🚫 Bloqueado / Negado
> [estilo base, usar VERMELHO `#D32F2F`] + "A circle with a diagonal slash, representing blocked or denied."

### ⚠️ Aviso
> [estilo base, usar ÂMBAR `#A64B00`] + "A triangle warning sign with an exclamation mark inside, representing alert."

### 👉 Dica / Aqui
> [estilo base] + "A hand with extended index finger pointing to the right, representing a tip or call-to-action."

---

## 2. 🐂 Operações de boleta (tela Nova Boleta)

### 🐄 Nascimento
> [estilo base] + "A friendly cow with a small calf beside it, symbolizing birth of cattle. Warm and positive feel."

### ⚰️ Óbito / Morte de animal
> [estilo base] + "A simple cross or tombstone combined with a subtle cattle silhouette, respectful and neutral, representing animal death record. Avoid gore or disturbing imagery."

### 🔄 Transferência entre retiros
> [estilo base] + "Two circular arrows forming a loop between two location pins, representing transfer of cattle between farm units."

### 💰 Compra / Venda
> [estilo base] + "A hand holding coins next to a cattle silhouette, representing buying and selling livestock."

### 📈 Evolução de rebanho (reclassificação)
> [estilo base] + "An upward trending arrow over stacked cattle silhouettes of increasing size, representing herd category evolution."

### 🔧 Manejo geral (manutenção/vacinação)
> [estilo base] + "Crossed wrench and syringe, representing general cattle handling and vaccination tasks."

---

## 3. 🐂 Categorias e tipos de animal

### 🐂 Rebanho geral (categoria)
> [estilo base] + "A bold ox/bull head silhouette facing front with prominent horns, representing the herd section."

### 🐮 Raça (nascimento)
> [estilo base] + "A friendly cow face front view with visible breed features (humped neck Nelore-style), representing animal breed."

---

## 4. 📋 Campos do formulário (boleta)

### 🏠 Retiro
> [estilo base] + "A simple farmhouse/ranch building with a gabled roof, representing a farm unit (retiro)."

### 🌾 Pasto (campo)
> [estilo base] + "Three wheat/grass stalks tied together, representing pasture/field."

### 📍 Localização / Nº do pasto
> [estilo base] + "A single map location pin, clean and bold, representing a place or pasture number."

### 🎯 Retiro de destino
> [estilo base] + "A bullseye target with concentric circles, representing destination."

### 📅 Data
> [estilo base] + "A simple calendar page icon with the top binder visible."

### 🏷️ Brinco / Identificação do animal
> [estilo base] + "A cattle ear tag (brinco) with a small number visible, representing animal identification."

### 💀 Causa da morte
> [estilo base] + "A simple medical clipboard with a small cross at the top, representing cause-of-death record. Neutral and clinical, not horror."

### 📷 Foto / Câmera
> [estilo base] + "A simple camera icon with a round lens, bold and rounded."

### 📝 Observações
> [estilo base] + "A notepad with a pencil resting on top, representing written notes."

### 🔢 Número / Placa
> [estilo base] + "Three numeric digits inside a rectangle frame, representing a number or vehicle plate."

### 👤 Pessoa / Usuário
> [estilo base] + "A single person bust silhouette in a rounded circle, generic user avatar."

### 👥 Usuários (plural)
> [estilo base] + "Two overlapping person bust silhouettes, representing multiple users."

### 🪪 RG / CPF / Documento
> [estilo base] + "A simple ID card with a small portrait silhouette in the corner."

### 🛰️ GPS / Satélite
> [estilo base] + "A satellite with two solar panels and signal waves emanating from it, representing GPS positioning."

---

## 5. 🎙️ Áudio e mídia

### 🎙️ Gravar áudio
> [estilo base] + "A studio microphone on a small stand, representing audio recording."

### 🔇 Sem áudio / mudo
> [estilo base, usar CINZA `#8A8A7C`] + "A speaker icon with a diagonal slash through it, representing muted or no audio."

### 📭 Vazio / Sem registros
> [estilo base, usar CINZA `#8A8A7C`] + "An empty open mailbox with the flag down, representing no items / empty list."

---

## 6. 🚚 Transferência (detalhes da boleta de movimentação)

### 📤 Enviando / Saída
> [estilo base] + "An arrow pointing up and out of an open box, representing outbound shipment of animals."

### 📥 Recebendo / Entrada
> [estilo base] + "An arrow pointing down into an open tray, representing inbound arrival of animals."

### 🚛 / 🚚 Caminhão / Transporte rodoviário
> [estilo base] + "A side view of a cattle transport truck with covered cargo, simple and bold."

### 🐎 Comitiva (cavalo)
> [estilo base] + "A horse silhouette in profile, representing cattle drive on horseback (comitiva)."

### 🧭 Direção / Navegação
> [estilo base] + "A compass with a clearly visible north needle, representing direction or guidance."

### ➡️ Seta evolução (origem → destino)
> [estilo base] + "A bold right-pointing arrow with rounded tip, representing flow from A to B."

---

## 7. 💰 Compra e venda

### 💵 Valor / Dinheiro
> [estilo base] + "A folded paper bill (banknote) with a dollar/real-style symbol in the center."

### 🛒 Compra
> [estilo base] + "A shopping cart silhouette, simple and bold, representing purchase."

### 🤝 Venda / Negócio fechado
> [estilo base] + "Two hands shaking, representing a deal or sale closed."

### 💼 Negócio / Coordenador
> [estilo base] + "A briefcase with a handle and clasps, representing business/management."

### 🧮 Total / Cálculo
> [estilo base] + "A simple abacus with bead rows, representing total or calculation."

---

## 8. 🟢 Status de chamado de infraestrutura

### 🟠 Aberto / Pendente
> [estilo base, usar ÂMBAR `#A64B00`] + "A clock face with hands showing waiting, representing a pending or open ticket."

### 🔵 Em andamento
> [estilo base, usar ÂMBAR `#A64B00`] + "A circular arrow (spinner/refresh), representing work in progress."

### 🟢 Concluído / Resolvido
> [estilo base, manter VERDE `#2E7D52`] + "A checkmark inside a circle, representing a completed task."

---

## 9. 🔧 Categorias de infraestrutura

### 🔧 Ferramenta / Manutenção
> [estilo base] + "A wrench at 45 degrees, bold and clean, representing infrastructure maintenance."

### 🚰 Hidráulica / Bebedouro
> [estilo base] + "A water tap with a drop falling, representing hydraulic infrastructure / animal trough."

### ⚡ Elétrica / Cerca elétrica
> [estilo base, usar ÂMBAR `#A64B00`] + "A bold lightning bolt with rounded edges, representing electrical infrastructure."

### 🪵 Cerca / Mourão de madeira
> [estilo base] + "A vertical wood log/post with visible bark texture, representing fence post."

### 👷 Técnico de infraestrutura
> [estilo base] + "A person bust wearing a hard hat with a small wrench in the corner, representing maintenance technician."

---

## 10. 🤠 Perfis de usuário (avatares)

### 🤠 Capataz
> [estilo base] + "A person bust wearing a wide-brim cowboy/field hat, representing the field foreman (capataz)."

### 🧑‍💼 Gerente
> [estilo base] + "A person bust wearing a tie and collared shirt, representing the manager."

### 📋 Coordenador
> [estilo base] + "A person bust beside a clipboard with checklist visible, representing the coordinator."

### 🔧 Infraestrutura (perfil)
> use o ícone `👷` acima — mesmo conceito.

---

## 11. 🌱 Sistema e marca

### 🌱 Logo SynTech
> NÃO refazer com IA — usar a versão oficial em `assets/Logos/`. Esta entrada existe só como marca de identificação na sidebar.

### 📲 Instalar PWA (app)
> [estilo base] + "A smartphone with a downward arrow entering its screen, representing install app."

### 📱 Celular / Notificação
> [estilo base] + "A simple smartphone silhouette with a small dot in the corner, representing mobile device or notification."

### 🕓 Histórico / Tempo
> [estilo base] + "A clock face with hands and a curved arrow around it, representing history or time-back."

---

## 12. 🧭 Navegação (sidebar / bottom-nav)

| Item | Ícone | Prompt já listado em |
|---|---|---|
| Início (Capataz) | 🏠 | seção 4 (Retiro) |
| Tarefas / Boletas | 📋 | seção 4 (Coordenador) |
| Nova Boleta | ➕ + 🐂 | seções 1 + 3 |
| Histórico | 🕓 | seção 11 |
| Movimentação | 🔄 | seção 2 |
| Infraestrutura | 🔧 | seção 9 |
| Abrir Chamado | 👷 | seção 9 |
| Dashboard (Gerente/Coord) | 📊 (novo) | abaixo |
| Configurações | ⚙️ (novo) | abaixo |
| Sair | 🚪 | seção 1 |

### 📊 Dashboard (Gerente/Coordenador)
> [estilo base] + "Two vertical bars of different heights next to a small upward trending line, representing analytics dashboard."

### ⚙️ Configurações
> [estilo base] + "A gear/cog with 6-8 teeth, centered, representing settings."

---

## Notas finais

1. **Geração em lote**: para manter uniformidade, gere os ícones usando o **mesmo modelo + mesmo seed** quando possível. Diferentes seeds geram traços visivelmente diferentes.
2. **Pós-processamento**: depois de gerar os PNGs 512×512, converta para `.ico` multi-tamanho usando https://convertio.co/png-ico/ ou similar, gerando os tamanhos **24, 32, 48, 64, 128, 256**.
3. **Onde colocar no projeto**: `src/public/Icons/` (mantém o padrão atual).
4. **Status com cor**: os ícones marcados com cor diferente (vermelho/âmbar) devem ser gerados separadamente com a cor especificada — o frontend já usa CSS pra adaptar, mas a cor base da imagem precisa estar correta para fundos claros.
5. **Critério de aceite**: cada ícone deve ser **identificável a 24px** numa tela mobile sob luz solar direta. Teste antes de aprovar.
