# Prompts de Geração de Ícones — Sistema do Capataz (BRPec / SynTech)

Padrão visual de todos os ícones (manter consistência com os `.ico` já existentes):

> **Estilo base (colar no início de cada prompt):**
> "Flat minimalist icon, single centered subject, Phosphor-icons style with bold/fill weight, thick rounded strokes, deep green (#1A4D2E) on transparent background, no text, no shadow, 1:1 square aspect ratio, 512x512px, generous padding around the subject, high contrast for outdoor sunlight readability, simple and instantly recognizable for low-literacy users."

A proporção **1:1 (quadrada), 512x512px** e o **padding generoso** são obrigatórios para os ícones reduzirem bem (até 24px) sem perder legibilidade — exatamente a crítica que recebemos no Art. 7 (logo complexo demais).

---

## Ícones de Operação / Boleta (tela Nova Boleta)

### 🐄 Nascimento
> [estilo base] + "A friendly cow with a small calf beside it, symbolizing birth of cattle. Warm and positive feel."

### ⚰️ Óbito / Morte
> [estilo base] + "A simple cross or tombstone combined with a subtle cattle silhouette, respectful and neutral, representing animal death record. Avoid gore or disturbing imagery."

### 🔄 Transferência entre retiros
> [estilo base] + "Two circular arrows forming a loop between two location pins, representing transfer of cattle between farm units."

### 💰 Compra / Venda
> [estilo base] + "A hand holding coins next to a cattle silhouette, representing buying and selling livestock."

### 📈 Evolução de rebanho
> [estilo base] + "An upward trending arrow over stacked cattle silhouettes of increasing size, representing herd category evolution/growth."

### 🛠️ Manejo geral
> [estilo base] + "Crossed wrench and syringe, representing general cattle handling and vaccination tasks."

---

## Ícones de Transferência (detalhes)

### 📤 Enviando (Saída)
> [estilo base] + "An arrow pointing up and out of an open box, representing outbound shipment of animals."

### 📥 Recebendo (Entrada)
> [estilo base] + "An arrow pointing down into an open box/tray, representing inbound arrival of animals."

### 🚛 Caminhão (Rodoviário)
> [estilo base] + "A side view of a cattle transport truck, simple and bold."

### 🐎 Comitiva (Estrada/cavalo)
> [estilo base] + "A horse silhouette, representing cattle drive on horseback (comitiva)."

---

## Ícones de Campos do Formulário

### 🏠 Retiro
> [estilo base] + "A simple farm house/ranch building, representing a farm unit (retiro)."

### 📍 Nº do pasto
> [estilo base] + "A single map location pin, clean and bold, representing a pasture number."

### 📅 Data
> [estilo base] + "A simple calendar page icon."

### 🏷️ Identificação / Brinco do animal
> [estilo base] + "A cattle ear tag (brinco) with a number, representing animal identification."

### 💀 Causa da morte
> [estilo base] + "A simple medical clipboard with a small cross, representing cause-of-death record. Neutral and clinical."

### 📷 Foto da carcaça
> [estilo base] + "A simple camera icon, bold and rounded."

### 📝 Observações
> [estilo base] + "A notepad with a pencil, representing written notes/observations."

### 👤 Motorista / Comissário
> [estilo base] + "A simple person bust silhouette wearing a cap, representing the driver/transporter."

### 🪪 RG / CPF
> [estilo base] + "A simple ID card icon."

---

## Ícones de Navegação (sidebar / bottom-nav) — perfil Capataz

### Tarefas (📋)
> [estilo base] + "A checklist clipboard with a checkmark, representing daily tasks."

### Movimentação / Rebanho (🐂)
> [estilo base] + "A bold ox/cattle head silhouette facing front, representing the herd section."

### Infraestrutura (🔧)
> [estilo base] + "Crossed wrench and screwdriver, representing infrastructure maintenance."

### Início / Home (🏠)
> [estilo base] + "A simple house icon."

---

## Ícones de Status de Tarefa

### Pendente (🟠)
> [estilo base, mas usar cor ÂMBAR #A64B00] + "A clock with hands, representing a pending task awaiting action."

### Em andamento (🔵)
> [estilo base, mas usar cor ÂMBAR #A64B00] + "A circular arrow (refresh/spinner), representing a task in progress."

### Concluída (🟢)
> [estilo base, manter VERDE #2E7D52] + "A checkmark inside a circle, representing a completed task."

---

## Ícones de Perfil (avatares)

### 🤠 Capataz
> [estilo base] + "A person bust wearing a wide-brim cowboy/field hat, representing the field foreman (capataz)."

### 🧑‍💼 Gerente
> [estilo base] + "A person bust wearing a tie/business attire, representing the manager."

### 📋 Coordenador
> [estilo base] + "A person bust beside a clipboard, representing the coordinator."

### 🔧 Infraestrutura / Técnico
> [estilo base] + "A person bust wearing a hard hat with a wrench, representing the maintenance technician."

---

## Observações de uso

1. **Sempre 1:1 e 512px** — depois exportar em PNG transparente e converter para `.ico` se necessário.
2. **Cor única (#1A4D2E)** exceto os de status, que seguem a semântica da paleta (âmbar = atenção, vermelho = erro/morte, verde = sucesso).
3. **Padding generoso** — o subject deve ocupar ~70% do canvas, deixando margem. Isso garante legibilidade em 24px.
4. **Sem texto** dentro do ícone — o label textual sempre acompanha (decisão de acessibilidade do WAD seção 3.4.3).
5. Gerar todos com o **mesmo modelo/seed** quando possível, para manter uniformidade de traço (crítica recebida no Art. 7).
