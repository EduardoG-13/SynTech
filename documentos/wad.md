<img src="../assets/logointeli.png">

# WAD - Web Application Document - Módulo 2 - Inteli

**_Os trechos em itálico servem apenas como guia para o preenchimento da seção. Por esse motivo, não devem fazer parte da documentação final_**

## Nome do Grupo

#### Nomes dos integrantes do grupo

- <a href="https://www.linkedin.com/in/filipe-salotti-9ab184310/">Arthur Morais </a>
- <a href="https://www.linkedin.com/in/eduardo-gabriel-de-oliveira-1ab818220/">Eduardo Oliveira</a>
- <a href="https://www.linkedin.com/in/enzo-santos-bezerra-1904403bb/">Enzo Santos Bezerra</a>
- <a href="https://www.linkedin.com/in/guilherme-beltrame-18b1b429b/">Guilherme Munhoz Beltrame</a>
- <a href="https://www.linkedin.com/in/laiza-guimar%C3%A3es-2748b2313/">Laiza Guimaraes</a>
- <a href="https://www.linkedin.com/in/kaylan-alexandre/">Lorena Kopke</a>
- <a href="https://www.linkedin.com/in/mateus-galatro/">Mateus Gongora Pereira Galatro</a>
- <a href="https://www.linkedin.com/in/miguel-cristiano-costa-160b96320/">Miguel Cristiano Costa</a>

## Sumário

[1. Introdução](#c1)

[2. Visão Geral da Aplicação Web](#c2)

[3. Projeto Técnico da Aplicação Web](#c3)

[4. Desenvolvimento da Aplicação Web](#c4)

[5. Testes da Aplicação Web](#c5)

[6. Estudo de Mercado e Plano de Marketing](#c6)

[7. Conclusões e trabalhos futuros](#c7)

[8. Referências](c#8)

[Anexos](#c9)

<br>

# <a name="c1"></a>1. Introdução (sprints 1 a 5)

O agronegócio brasileiro desempenha papel central na economia nacional, sendo responsável pela significativa geração de empregos e pela produção de alimentos em larga escala(CEPEA, 2023). Nesse contexto, a pecuária demanda elevado nível de controle operacional, especialmente no registro de atividades de campo e na gestão da movimentação do rebanho, fatores diretamente relacionados à produtividade e à qualidade da tomada de decisão.

No cenário da BrPec Agropecuária S.A., identificou-se que o fluxo de informações entre o campo e o escritório ocorre de forma manual, por meio de anotações em boletas de papel. Esse modelo gera ineficiências operacionais relevantes: registros podem ser preenchidos de forma incompleta ou ilegível, há atraso no envio das informações até o escritório e torna-se necessário redigitar todos os dados em planilhas digitais. Como consequência, ocorrem retrabalho, risco de erros na consolidação dos dados e atrasos que podem comprometer a visibilidade das operações por horas ou até dias, impactando diretamente a tomada de decisão dos gestores.  

Além disso, a limitação de conectividade nas áreas operacionais impede o uso contínuo de soluções digitais convencionais, dificultando ainda mais a padronização e a confiabilidade das informações registradas no campo.
Diante desse contexto, foi proposta a construção de uma aplicação web capaz de digitalizar o gerenciamento de tarefas e o registro das movimentações do rebanho, com funcionamento offline. A solução permite que os dados sejam coletados diretamente no campo e sincronizados automaticamente quando houver conexão com a internet.

Como principal criação de valor, o sistema promove a padronização dos registros, elimina a necessidade de redigitação manual, reduz erros operacionais e melhora a rastreabilidade das informações. Dessa forma, possibilita maior agilidade na atualização dos dados, aumenta a transparência das operações e apoia a tomada de decisão dos gestores, alinhando-se às necessidades reais da BrPec.


# <a name="c2"></a>2. Visão Geral da Aplicação Web (sprint 1)

## 2.1. Escopo do Projeto (sprints 1 e 4)

### 2.1.1. Modelo de 5 Forças de Porter (sprint 1)

O Modelo das 5 Forças de Porter foi aplicado para analisar a estrutura competitiva do setor agropecuário no qual a BrPec Agropecuária está inserida (PORTER, 2008), setor marcado por dependência de commodities, capital intensivo, pressão regulatória ambiental crescente.

Rivalidade entre concorrentes: A rivalidade é alta. O mercado bovino e de grãos compete por escala, eficiência e acesso a canais de comercialização, dada a limitada diferenciação em commodities. A BrPec disputa com grupos integrados como Bom Futuro (MT), Jacarezinho, ligada a Marcos Molina da Marfrig, e Rio Vermelho (PA), além de fundos de investimento em terras (COMPRERURAL, 2024). Num ambiente de preços de mercado, eficiência de custo e volume são o campo de batalha (PORTER, 2008).

Ameaça de novos entrantes: A ameaça é média a baixa. Operar em larga escala exige capital intensivo para aquisição de terras, infraestrutura e formação de rebanho, além de licenciamento ambiental complexo em biomas como Pantanal e Cerrado. Essas barreiras restringem a entrada de concorrentes de grande porte, embora fundos agropecuários nacionais e estrangeiros sustentem ameaça relevante no longo prazo (CASALE, 2024).

Poder de barganha dos fornecedores: O poder é moderado. A BrPec depende de fertilizantes (Yara, Mosaic), defensivos e sementes (Bayer, BASF, Syngenta) e medicamentos veterinários (Zoetis, Boehringer Ingelheim), segmentos dominados por multinacionais com poder de precificação. A produção própria de soja e milho atenua parcialmente essa dependência (FEED&FOOD, 2024).

Poder de barganha dos clientes: O poder é alto. Os principais compradores JBS, Marfrig e Minerva Foods, operam em oligopsônio e pressionam os preços pagos por arroba (INFOMONEY, 2024). A concentração do lado comprador mantém o produtor em posição estruturalmente desfavorável, com margens sensíveis à política de compra desses grupos (REPÓRTER BRASIL, 2024).

Ameaça de substitutos: A ameaça é moderada e crescente. No mercado interno, frango e suíno competem com a carne bovina em custo-benefício (CEPEA, 2023). Externamente, o regulamento anti-desmatamento da União Europeia, em vigor a partir de 2026, restringe produtores com histórico ambiental negativo, limitando o acesso a mercados de maior valor agregado (REHAGRO, 2024).

Análise estrutural: A BrPec opera em setor com barreiras de entrada relevantes e integração vertical como diferencial, mas enfrenta forte pressão de canais de compra concentrados, alta rivalidade por escala e dependência de fornecedores especializados. O passivo ambiental representa risco estratégico: a empresa figura entre os maiores desmatadores do Pantanal segundo o Ibama (DE OLHO NOS RURALISTAS, 2020), podendo restringir o acesso aos segmentos de maior rentabilidade.

<center>
  <img src="../assets/porterForcas.png" width="800"/>
  <p><strong>Figura 1</strong> — Análise das 5 Forças de Porter aplicada à BrPec Agropecuária<br/>
  Fonte: Próprios autores (2026).</p>
</center>

### 2.1.2. Análise SWOT da Instituição Parceira (sprint 1)

A análise SWOT a seguir avalia o posicionamento estratégico da BRPec considerando seu ambiente interno — forças operacionais e financeiras e fraquezas estruturais e regulatórias — e fatores externos: oportunidades de mercado e ameaças setoriais. O contexto de análise é o agronegócio brasileiro de pecuária e grãos, especificamente o segmento de produção integrada em larga escala no Pantanal mato-grossense, caracterizado por crescente pressão ESG sobre crédito e certificações, restrições regulatórias à expansão de novas áreas e acirrada competição fundiária com players institucionalizados.

A leitura integrada dos quadrantes revela que a principal vantagem competitiva sustentável da BRPec reside em sua escala fundiária no Pantanal e no modelo integrado grãos-pecuária, atributos que concorrentes de médio porte não replicam no curto prazo. Por outro lado, o passivo ambiental ativo representa não apenas uma fraqueza interna de compliance, mas um vetor de amplificação de ameaças externas: é simultaneamente a causa do risco de bloqueio ao mercado europeu via EUDR e do encarecimento do custo de capital frente a concorrentes com certificações ESG consolidadas — concentrando dois dos três riscos externos mapeados em uma única vulnerabilidade de origem interna. Essa sobreposição indica que a resolução do passivo ambiental não é apenas uma pauta regulatória, mas a condição estrutural para que a BRPec converta sua escala operacional em acesso real a mercados premium e crédito qualificado.

### 2.1.3. Solução (sprints 1 a 5)

_Explique detalhadamente os seguintes aspectos (até 60 palavras por item):_

1. Problema a ser resolvido
2. Dados disponíveis (mencionar fonte e conteúdo; se não houver, indicar “não se aplica”)
3. Solução proposta
4. Forma de utilização da solução
5. Benefícios esperados
6. Critério de sucesso e como será avaliado

#### 1. Definição do Problema

A BRPec depende atualmente de processos manuais e anotações em papel (boletas) para comunicar ordens de serviço entre o campo e o escritório, além de registrar movimentações do rebanho (nascimentos, óbitos e transferências). Isso gera retrabalho na consolidação dos dados, redigitação em planilhas eletrônicas e atraso na visibilidade das informações operacionais.

---

#### 2. Dados Disponíveis

Os dados disponíveis para o projeto incluem:

- Estrutura de papéis (Gerente, Capataz, Coordenador de Retiro)
- Tipos de eventos zootécnicos registrados manualmente: nascimento, morte, compra, venda e transferência entre retiros
- Tipos de tarefas de campo: cercas, pasto, infraestrutura
- Formato de saída esperado: planilha Excel/CSV
- Stack técnica definida: HTML/CSS/JS (front), Node.js (servidor), SQLite (banco)
- Restrições: sem autenticação formal de usuários, sem integração com WebAPIs externas

---

#### 3. Solução Proposta

Desenvolvimento de uma aplicação web com arquitetura cliente-servidor (HTML/CSS/JS + Node.js + SQLite) que centraliza o gerenciamento de tarefas operacionais e o registro de movimentações do rebanho bovino. A solução contempla três perfis de uso — Gerente, Capataz e Coordenador — cada um com interface adaptada às suas responsabilidades. O sistema funcionará em modo offline, com sincronização automática quando houver conexão.

---

#### 4. Forma de Uso da Solução

**Gerente:** Cria, edita e monitora tarefas calendarizadas para os Capatazes via painel web.

**Capataz:** Usa a aplicação offline para visualizar tarefas, reportar status com evidências (foto, texto, áudio) e registrar movimentações do rebanho.

**Coordenador:** Visualiza movimentações reportadas e exporta dados consolidados em Excel/CSV.

---

#### 5. Benefícios Esperados

- Padronização dos registros de campo, eliminando anotações em papel
- Agilidade na atualização do inventário pecuário com digitalização na fonte
- Maior transparência e rastreabilidade das atividades operacionais em tempo real
- Redução de falhas de comunicação e de transcrição de dados
- Eliminação da redigitação manual de informações para planilhas
- Ganho de eficiência e integração entre as áreas agrícola e pecuária

---

#### 6. Critérios de Sucesso

O projeto será considerado bem-sucedido quando:

- O MVP funcional integrar o gerenciamento de tarefas e o formulário de movimentação bovina
- Os três perfis (Gerente, Capataz, Coordenador) conseguirem executar seus fluxos principais sem erros
- A funcionalidade offline operar corretamente com sincronização posterior
- A exportação de dados em Excel/CSV gerar arquivos utilizáveis pelos Coordenadores sem necessidade de redigitação
- Os registros de campo eliminarem o uso de boletas de papel no dia a dia

---

#### 7. Alinhamento com SWOT e Canvas

> ⚠️ **Nota:** Esta seção deve ser revisada e complementada pelo grupo após a elaboração da Análise SWOT e do Business Model Canvas do projeto.

#### Alinhamento com a Análise SWOT

- **SWOT:** Os pontos levantados na análise devem refletir os problemas (fraquezas/ameaças) e oportunidades descritos na TAPI

#### Alinhamento com o Business Model Canvas

- **Canvas:** O bloco de "Proposta de Valor" deve estar coerente com os benefícios esperados; "Segmentos de Clientes" com os atores; "Canais" com a interface web/offline

### 2.1.4. Value Proposition Canvas (sprint 1):

A proposta de valor é uma declaração curta e objetiva que resume a essência da aplicação web: o que ela oferece, para quem e por que vale a pena jogar. Ela funciona como o núcleo de toda a visão do projeto, orientando decisões de design e comunicando de forma clara o diferencial do jogo antes de qualquer detalhe técnico ou mecânico ser apresentado.

<center>
  <img src="../assets/canvasPropostaDeValor.png" width="800"/>
  <p><strong>Figura 2</strong> — Canvas Proposta de Valor aplicada à BrPec Agropecuária<br/>
  Fonte: Próprios autores (2026).</p>
</center>

O canvas evidencia que a aplicação web resolve dores concretas dos Capatazes em campo — como a dependência de boletas de papel, a impossibilidade de usar soluções convencionais sem internet e a comunicação informal com o Gerente, garantindo que haja um maior controle pelos Capatazes. Os ganhos gerados, como a eliminação do retrabalho de transcrição, o registro ágil de eventos zootécnicos em poucos toques e a confirmação automática de tarefas com envio de evidências, se alinham diretamente às entregas do produto: formulários digitais de manejo bovino, sistema de alertas multimídia e exportação em Excel para o Coordenador. A proposta de valor da aplicação web, portanto, não se limita a digitalizar uma planilha existente, mas redefine o fluxo de informações entre o campo e o escritório — tornando os registros operacionais mais confiáveis, rastreáveis e acessíveis para toda a cadeia de gestão da fazenda.

### 2.1.5. Matriz de Riscos do Projeto (sprint 1)

A matriz de riscos é uma ferramenta que permite identificar, analisar e priorizar ameaças e oportunidades de um projeto. A classificação é feita com base na probabilidade de ocorrência e no impacto, auxiliando na definição de ações para cada caso. Dessa forma, foi elaborada a matriz de riscos para o desenvolvimento da aplicação web da BrPec Agropecuária S.A, considerando seus principais desafios. 

Nesse contexto, a figura a seguir apresenta a matriz de riscos elaborada para o projeto, que usa como base os padrões da ISO 31000 e PMBOK(REVISTA DE GESTÃO E PROJETOS, 2013), na qual são organizadas as principais ameaças e oportunidades identificadas, considerando seus respectivos níveis de impacto e probabilidade. 


<center>
  <img src="../assets/matriz-de-risco-BrPec.png" width="800"/>
  <p><strong>Figura 3</strong> — Matriz De Risco aplicada à BrPec Agropecuária<br/>
  Fonte: Próprios autores (2026).</p>
</center>

## Ameaças

### A01 — Falha na sincronização de dados offline  
**Probabilidade:** 30%  
**Impacto:** Muito Alto  

**Explicação:**  
A operação ocorre majoritariamente offline nos retiros, o que torna a sincronização um elemento crítico do sistema. Falhas nesse processo podem resultar na perda, duplicidade ou inconsistência de dados. Por exemplo, uma movimentação de rebanho registrada no campo pode não ser refletida no sistema central, gerando divergência entre o estoque real de animais e os dados disponíveis para gestão.

**Plano de ação:**  
Para mitigar esse risco, deve-se adotar uma arquitetura orientada ao funcionamento offline, com armazenamento local de dados e sincronização assíncrona. É fundamental implementar mecanismos de controle de consistência, como filas de envio, registros de log e reprocessamento automático em caso de falhas. Além disso, devem ser realizados testes que simulem cenários reais de perda e retomada de conexão, garantindo que o sistema mantenha a integridade dos dados mesmo em condições adversas.

---

### A02 — Baixa usabilidade para capatazes  
**Probabilidade:** 50%  
**Impacto:** Alto  

**Explicação:**  
Os capatazes, principais usuários do sistema, apresentam baixo nível de instrução formal e estão habituados ao uso de ferramentas simples, como o WhatsApp. Uma interface complexa pode dificultar a utilização do sistema e comprometer sua adoção no dia a dia.

**Plano de ação:**  
A mitigação desse risco exige o desenvolvimento de uma interface altamente intuitiva, baseada em elementos visuais e fluxos simplificados. Deve-se reduzir ao máximo a necessidade de leitura e digitação, priorizando ações rápidas e diretas. A validação contínua com o parceiro, por meio de protótipos e simulações de uso real, é essencial para garantir aderência ao perfil do usuário. Além disso, a comparação com ferramentas já utilizadas pelos capatazes pode orientar decisões de design mais eficazes.

---

### A03 — Registro incorreto ou incompleto de dados  
**Probabilidade:** 30%  
**Impacto:** Alto  

**Explicação:**  
Erros no registro de eventos como nascimento, morte ou transferência de animais comprometem diretamente a confiabilidade das informações. Um exemplo crítico seria a ausência de registro de morte, que pode gerar inconsistência no inventário e impactar decisões de venda ou manejo.

**Plano de ação:**  
Para reduzir esse risco, o sistema deve impor validações estruturais nos registros, garantindo o preenchimento de campos essenciais, como origem, destino e tipo de movimentação. A exigência de evidências, como fotos georreferenciadas em eventos críticos, contribui para aumentar a confiabilidade dos dados. Além disso, a implementação de histórico de alterações permite rastrear inconsistências e corrigir eventuais erros ao longo do tempo.

---

### A04 — Resistência à mudança no processo operacional  
**Probabilidade:** 50%  
**Impacto:** Muito Alto  

**Explicação:**  
Mesmo com uma interface adequada, existe o risco de resistência à mudança por parte dos capatazes, que estão habituados ao uso de papel e ferramentas informais no dia a dia. A introdução de um novo sistema pode ser percebida como uma complexidade adicional à rotina, especialmente em um ambiente operacional já consolidado. Por exemplo, mesmo com o aplicativo disponível, o usuário pode optar por continuar registrando informações manualmente e postergar o uso da solução digital, comprometendo a centralização e a confiabilidade dos dados.

**Plano de ação:**  
A mitigação desse risco exige não apenas uma solução tecnicamente adequada, mas também uma estratégia de implementação alinhada ao contexto da fazenda. É necessário garantir que o sistema seja percebido como facilitador da rotina, reduzindo esforço operacional em comparação ao método atual. Além disso, o envolvimento de supervisores no acompanhamento do uso e a validação contínua com o parceiro contribuem para reforçar a adoção. A demonstração prática de benefícios, como redução de retrabalho e maior agilidade no registro, também atua como fator de incentivo ao uso contínuo da ferramenta.


---

### A05 — Problemas de integração entre frontend e backend  
**Probabilidade:** 30%  
**Impacto:** Moderado  

**Explicação:**  
Diferenças nos formatos de dados ou endpoints podem causar falhas no sistema, atrasando o desenvolvimento.

**Plano de ação:**  
Definir contratos de API (JSON padronizado), documentar endpoints, realizar testes de integração e manter comunicação constante entre os responsáveis.

---

### A06 — Desempenho inadequado em dispositivos de campo  
**Probabilidade:** 10%  
**Impacto:** Moderado  

**Explicação:**  
O sistema será utilizado em dispositivos móveis no campo, que podem apresentar limitações de hardware. Baixo desempenho pode dificultar o uso durante as atividades diárias.

**Plano de ação:**  
Para garantir uma experiência adequada, o sistema deve ser otimizado para dispositivos móveis, com interfaces leves e baixo consumo de recursos. A utilização de cache local e a minimização de requisições externas contribuem para melhorar o desempenho. Além disso, testes em dispositivos reais são essenciais para validar a usabilidade em condições próximas à operação.

---

## Oportunidades

### O01 — Redução de retrabalho e erros operacionais  
**Probabilidade:** 90%  
**Impacto:** Muito Alto  

**Explicação:**  
Atualmente, os dados são registrados em papel e posteriormente transcritos para planilhas, o que gera retrabalho e aumenta a probabilidade de erros. A digitalização permite eliminar esse processo intermediário, tornando o fluxo mais eficiente e confiável.

**Plano de ação:**  
A digitalização dos registros deve garantir que todas as informações sejam coletadas diretamente no campo, de forma estruturada e padronizada. A integração com relatórios e exportações automatizadas assegura que os dados possam ser utilizados imediatamente, reduzindo tempo operacional e falhas humanas.

---

### O02 — Entendimento do setor agro 
**Probabilidade:** 50%  
**Impacto:** Alto  

**Explicação:**  
O contato com a realidade da pecuária permite aprendizado de um setor relevante e pouco explorado por estudantes de tecnologia.

**Plano de ação:**  
Aproveitar reuniões com o parceiro, fazer perguntas estratégicas e validar entendimento do negócio.

---

### O03 — Melhoria na tomada de decisão gerencial  
**Probabilidade:** 70%  
**Impacto:** Alto  

**Explicação:**  
Atualmente, as decisões são tomadas com base em dados que chegam com atraso ou podem conter inconsistências. Com a digitalização, os gestores passam a ter acesso a informações mais atualizadas e confiáveis. Por exemplo, o controle preciso do número de animais por categoria permite decisões mais assertivas sobre venda e manejo.

**Plano de ação:**  
A disponibilização de dados estruturados deve ser acompanhada pela criação de dashboards e relatórios que facilitem a visualização das informações. A organização por retiro, tipo de atividade e categoria de animal contribui para análises mais rápidas e eficazes.

---

### O04 — Geração de vantagem competitiva operacional  
**Probabilidade:** 50%  
**Impacto:** Alto  

**Explicação:**  
Em um setor altamente competitivo, a eficiência operacional é um fator determinante. O uso de dados confiáveis permite reduzir perdas, melhorar o controle do rebanho e otimizar a execução das atividades. A identificação rápida de falhas operacionais possibilita correções ágeis, evitando impactos maiores na produção.

**Plano de ação:**  
Para potencializar essa oportunidade, é necessário garantir que os dados coletados sejam utilizados estrategicamente. A análise contínua por meio de indicadores e relatórios permite transformar informações operacionais em vantagens competitivas, fortalecendo a posição da empresa no mercado.

---

## Síntese

A análise da matriz de riscos permite identificar fatores críticos que podem impactar tanto o desenvolvimento do projeto quanto a efetividade da solução no contexto da BrPec. Ao estabelecer estratégias de mitigação e potencialização, torna-se possível conduzir o projeto de forma mais segura, alinhada às necessidades do parceiro e orientada à geração de valor, contribuindo para a qualidade e confiabilidade das entregas.


## 2.2. Personas (sprint 1)

Personas são, de forma resumida, representaçôes fictícia dos diferentes tipos de usuários. Elas permitem que a ferramenta seja mais eficiente e focada para atender as necessidades reais do cliente. Dessa forma, as figuras 4, 5 e 6 mostram as personas criadas para o projeto.

### Persona 1: João Pereira

<center>
  <img src="../assets/persona1.png" width="800"/>
  <p><strong>Figura 4</strong> — Persona 1: João Pereira (Gerente) <br/>
  Fonte: Próprios autores (2026).</p>
</center>


#### Informações:
- Nome e sobrenome: João Pereira;
- Idade: 40 anos [1];
- Cargo: Gerente geral na BrPec Agropecuária S.A.;
- Estado Civil: Casado;
- Localização: Miranda-MS;
- Escolaridade: Pós-graduado em veterinária.

#### Motivações:
Conseguir manter sua família e garantir educação para seus filhos. Além disso, deseja ser um funcionário de destaque para a BrPec.

#### Interesses [1]:
- Animais;
- Tecnologias aplicadas ao agronegócio;
- Gestão Logística e Operações;
- Gestão de tempo.

#### Desafios/Dores:
- Dificuldade de visualizar todo o cenário em tempo real;
- Comunicação lenta e fragmentada.

#### Metas:
- Ter maior controle sobre as atividades do campo;
- Garantir que as rotinas do campo sejam executadas seguindo o planejamento.

#### Necessidades:
- Painel de acompanhamento do status das atividades;
- Painel para a criação e gestão de tarefas calendarizadas para os Capatazes;
- Infomações diariamente atualizadas.

#### Habilidades [3]:
- Planejamento de atividades operacionais;
- Monitoramento e controle de metas de produção;
- Elaboração de relatórios;
- Gestão de equipes e supervisão de desempenho;
- Tomada de decisão baseada em indicadores do campo.

#### Familiaridade com Tecnologia [2]

| Aspecto   | Nível / Situação    |
|-------------------|---------------------------------|
| Smartphone | Intermediate (DigComp) - uso ativo de WhatsApp, e-mail, chamadas de trabalho e outros   |
| Aplicativos de gestão | Basic (DigComp) - uso limitado, sem experiência com sistemas ERP ou dashboards |
| Planilhas e formulários | Intermediate (DigComp) - utiliza planilhas para acompanhar as atividades |
| Sistemas web  | Basic (DigComp) - acessa portais e e-mail, sem uso de plataformas integradas  |

Informações extras:
- Conectividade: Boa - trabalha em escritório com acesso estável à internet;
- Meio de comunicação principal: WhatsApp, rádio e telefone com capatazes e coordenadores;
- Adaptação a novas tecnologias: Moderada a alta - reconhece o valor das ferramentas digitais e está aberto a adotá-las [3];
- Dispositivo disponível: Computador e celular.

#### Notas e Justificativas

**[1] Idade e perfil do cargo:**
A faixa etária de 40 anos foi baseada no perfil médio do Gerente de Produção e Operações Agropecuárias (CBO 1411-15), que aponta 40 anos como idade mais recorrente segundo o Portal Salário a partir de dados do CAGED. Além disso, outras informações sobre o perfil do foram baseadas a partir dessa fonte. (PORTAL SALÁRIO, 2025)

**[2] Framework de Competência Digital - DigComp 3.0:**
Os níveis de familiaridade com tecnologia foram classificados seguindo o DigComp 3.0, framework europeu de competência digital desenvolvido pelo Joint Research Centre da Comissão Europeia. Ele define quatro níveis de proficiência (Basic, Intermediate, Advanced e Highly Advanced) com base na complexidade das tarefas executadas e no grau de autonomia do indivíduo. (COSGROVE; CACHIA, 2025)

**[3] Habilidades do gestor no agronegócio:**
As habilidades listadas foram baseadas no perfil de profissionais que ocupam cargos de gestão no agronegócio. (IPOG, 2022)

#### Biografia:

João Pereira tem 40 anos, trabalha na BrPec há 6 anos e é responsável por gerar as atividades calendarizadas  para os Capatazes, como por exemplo: "Segunda-feira, Gabriel deve verificar as cercas do retiro 3". Além disso, ele acompanha a evolução das atividades da fazenda. 

João começa seu dia sempre verificando mensagens dos capatazes e coordenadores, depois disso, distribui tarefas para os retiros consultando anotações e planilhas. Ao longo do dia, participa de diversas reuniões, mas sempre sofre com o atraso das informações, que o impedem de identificar e corrigir imprevistos rapidamente, além de impedir que ele garanta que as rotinas de campo sejam cumpridas conforme o planejado. No final do dia, consolida o que foi executado, mas se sente frustrado por  saber que poderia ter tomado decisões melhores se tivesse acesso a dados em tempo real.

"Demoro muito para saber o que está acontecendo nas terras, o que torna difícil gerar as atividades para os Capatazes e garantir que tudo está ocorrendo conforme planejado na fazenda. Isso, porque as informações que tenho nem sempre são as mais atualizadas."

João se comunica com supervisores e coordenadores frequentemente, mas essa comunicação ainda é lenta e fragmentada. Além disso, está aberto a ferramentas digitais, porque sabe que elas o ajudariam a ter uma visão atualizada e completa sobre o cenário geral da fazenda.

### Persona 2: Marcos Cesar Filho

<center>
  <img src="../assets/persona2.png" width="800"/>
  <p><strong>Figura 5</strong> — Persona 2: Marcos Cesar Filho (Coordenador)<br/>
  Fonte: Próprios autores (2026).</p>
</center>

#### Informações:
- Nome e sobrenome: Marcos Cesar Filho;
- Idade: 35 anos;
- Cargo: Coordenador na BrPec Agropecuária S.A.;
- Estado Civil: Solteiro;
- Localização: Miranda- MS;
- Escolaridade: Pós-graduado em administração [1].

#### Motivações:
Crescer profissionalmente dentro do agronegócio e ser reconhecido pela precisão e confiabilidade dos dados que gerencia.

#### Interesses:
- Gestão de dados;
- Pecuária;
- Tecnologia aplicada ao campo.

#### Desafios/Dores:
- Demanda-se tempo para consolidação e transcrição em planilhas eletrônicas;
- Registros de campo não são padronizados.

#### Metas:
- Conseguir validar rapidamente as movimentações dos capatazes;
- Ter dados consolidados e confiáveis sem depender de transcrição manual.

#### Necessidades:
- Visualização das movimentações reportadas pelos Capatazes;
- Visão consolidada das movimentações de todos os retiros sob sua responsabilidade;
- Função para gerar e baixar planilhas referentes às movimentações.

#### Habilidades:
- Análise e validação de dados operacionais;
- Gestão de planilhas e relatórios;
- Comunicação entre campo e gestão;
- Tomada de decisão baseada em dados.

#### Familiaridade com Tecnologia [2]:

| Aspecto | Nível / Situação  |
|---------------------------|-------------------------------|
| Smartphone | Intermediate (DigComp) - uso ativo de WhatsApp, e-mail e câmera no trabalho   |
| Aplicativos de gestão  | Basic (DigComp) - sem experiência com sistemas ERP ou plataformas operacionais  |
| Planilhas e formulários   | Intermediate (DigComp) - usa Excel para consolidação manual de dados de campo |
| Sistemas web  | Basic (DigComp) - acessa e-mail e portais simples, sem dashboards ou sistemas  |

**Informações extras:**
- Conectividade: Boa, trabalha em ambiente de escritório com acesso à internet;
- Meio de comunicação principal: WhatsApp, e-mail e telefone;
- Adaptação a novas tecnologias: Moderada - aberto a ferramentas que simplifiquem seu fluxo de trabalho;
- Dispositivo disponível: Computador e celular.

#### Notas e Justificativas

**[1] Escolaridade do gestor no agronegócio:**
O Portal CNA Brasil aponta que, para cargos de coordenação técnica no agronegócio, o perfil mais buscado combina forte conhecimento técnico com boas noções de gestão, habilidade de comunicação e liderança. (CNA BRASIL, [s.d.])

**[2] Framework de Competência Digital - DigComp 3.0:**
Os níveis de familiaridade com tecnologia foram classificados seguindo o DigComp 3.0, framework europeu de competência digital desenvolvido pelo Joint Research Centre da Comissão Europeia. Ele define quatro níveis de proficiência (Basic, Intermediate, Advanced e Highly Advanced) com base na complexidade das tarefas executadas e no grau de autonomia do indivíduo. (COSGROVE; CACHIA, 2025)

#### Biografia:

Marcos Cesar tem 35 anos, está na BRPec há 5 anos e é responsável por validar as informações enviadas pelos Capatazes em campo. Além disso, tem como grande desafio hoje receber registros em boletas de papel, muitas vezes incompletos ou ilegíveis e ter que redigitar tudo manualmente em planilhas. Essa situação o deixa frustrado, ainda mais por esse processo estar sujeito a erros.

Sua rotina começa organizando as boletas vindas dos capatazes. Assim, ele tenta decifrar as caligrafias para depois iniciar a transcrição no Excel. Durante o dia, alterna entre a consolidação dos dados de movimentação do rebanho, validação de registros e comunicação com os capatazes para esclarecer dúvidas. Ao fim do dia, revisa as planilhas para garantir que nenhum dado ficou incorreto.

"Recebo a boleta, tento decifrar o que está escrito e ainda tenho que digitar tudo no Excel. Qualquer erro no campo vira problema aqui."

### Persona 3: Gabriel Galdino

<center>
  <img src="../assets/persona3.png" width="800"/>
  <p><strong>Figura 5</strong> — Persona 3: Gabriel Galdino (Capataz) <br/>
  Fonte: Próprios autores (2026).</p>
</center>

#### Informações: 
- Nome e sobrenome: Gabriel Galdino;
- Idade: 33 anos [1];
- Cargo: Capataz na BrPec Agropecuária S.A. [2];
- Estado Civil: Casado;
- Localização: Aquidauana (MS) – Atua em retiros na região do Pantanal;
- Escolaridade: Ensino Fundamental completo;

#### Motivações: 
Garantir o sustento da família e proporcionar uma boa vida para os filhos. Quer ser reconhecido como alguém de confiança no retiro.

#### Metas:
- Manter o retiro organizado e funcionando corretamente;
- Garantir a execução das tarefas dentro do prazo;
- Evitar retrabalho e falhas na comunicação;
- Ter maior controle sobre as atividades realizadas no dia.

#### Necessidades:
- Sistema fácil de usar sem conhecimento técnico prévio, por ter maior dificuldade com tecnologias [3];
- Registro rápido de tarefas e ocorrências;
- Visualização clara das atividades do dia;
- Funcionamento offline devido à limitação de internet;
- Padronização das informações registradas.

#### Desafios/dores:
- Baixa familiaridade com tecnologias digitais [3];
- Dependência de registros manuais e memória;
- Dificuldade para acompanhar tarefas em tempo real;
- Dificuldade de comunicação com níveis superiores;

#### Interesses:
- Animais e agricultura;
- Soluções que reduzam esforço operacional;
- Organização das tarefas no campo;
- Comunicação direta e eficiente.

#### Habilidades:
- Administração de mão de obra rural;
- Controle de qualidade e produtividade do rebanho;
- Planejamento e supervisão de atividades no campo;
- Gestão de recursos e insumos do retiro;
- Resolução de imprevistos sob pressão;
- Comunicação direta com equipe de vaqueiros;
- Resiliência devido aos diversos problemas que ocorrem.

#### Familiaridade com Tecnologia [4]

| Aspecto            | Nível / Situação       |
|---------------------------|-----------------------------------------------------|
| Smartphone      | Basic (DigComp) - uso restrito a ligações e WhatsApp       |
| Aplicativos de gestão   | Abaixo do Basic - sem experiência com apps de controle de tarefas ou relatórios |
| Planilhas e formulários  | Abaixo do Basic - registro em planilhas é feito por outros a partir de suas anotações |
| Sistemas web ou digitais  | Abaixo do Basic - boletas são físicas e comunicação é verbal |

Informações extras:
- Conectividade no campo: Instável ou ausente - sinal de internet limitado ou inexistente nos retiros;
- Meio de comunicação principal: Rádio, comunicação verbal e anotações;
- Adaptação a novas tecnologias: Baixa - resistência natural e por pouco contato com dispositivos ao longo da vida [3];
- Dispositivo disponível: Celular.

#### Notas e Justificativas: 

**[1] Idade e perfil salarial do capataz:**  
A faixa etária de 33 anos foi baseada no perfil médio de trabalhadores que ocupam o cargo de capataz na pecuária, conforme levantamento disponível no site consultado. (PORTAL SALÁRIO, 2026)

**[2] Descrição do cargo de Capataz:**  
As atribuições descritas, como exemplo a administração de mão de obra ou o controle do rebanho, estão alinhadas com a Classificação Brasileira de Ocupações (CBO), que define formalmente as competências e atividades do capataz na agropecuária. (BRASIL, [s.d.])

**[3] Baixa familiaridade com tecnologias digitais na pecuária:**  
A pesquisa acadêmica publicada na SciELO expõe a dificuldade de adoção de tecnologias por trabalhadores rurais na pecuária. O estudo aponta que características individuais como formação profissional e a posição ocupada dentro da propriedade influenciam diretamente a adoção ou rejeição de tecnologias, sendo a baixa escolaridade um fator determinante para a resistência ao uso de ferramentas digitais no campo. (MACHADO; NANTES, 2011)

**[4] Framework de Competência Digital - DigComp 3.0:**
Os níveis de familiaridade com tecnologia foram classificados seguindo o DigComp 3.0, framework europeu de competência digital desenvolvido pelo Joint Research Centre da Comissão Europeia. Ele define quatro níveis de proficiência (Basic, Intermediate, Advanced e Highly Advanced) com base na complexidade das tarefas executadas e no grau de autonomia do indivíduo. (COSGROVE; CACHIA, 2025)

#### Biografia:

Gabriel Galdino tem 33 anos e atua como capataz na BrPec Agropecuária S.A, sendo responsável pela gestão do retiro da Barra Bonita. Sua rotina é voltada à execução das atividades operacionais, organização da equipe de vaqueiros e acompanhamento direto das demandas relacionadas ao rebanho. Com forte experiência prática no campo, coordena tarefas como movimentação de gado, manutenção de cercas e resolução de imprevistos. Também realiza registros básicos das atividades e comunica atualizações ao coordenador.

Comprometido com o sustento da família e com o bom funcionamento do retiro, Gabriel é um profissional que se destaca ao ser um ótimo capataz para seu retiro e comunidade. Apesar disso, enfrenta limitações no uso de ferramentas digitais e depende, em grande parte, de anotações informais e comunicação via rádio, o que dificulta o controle das informações e o acompanhamento das tarefas.

"Quando o bicho adoece ou a cerca arrebenta, não tem tempo de procurar papel, tem que resolver na hora. O que não ficou na cabeça, ficou perdido."


## 2.3. User Stories (sprints 1 a 5)

| Campo | Descrição |
| ----- | ----- |
| **Identificação** | US01 |
| **Persona** | João Pereira (Gerente Geral) |
| **User Story** | Como gerente geral, posso criar tarefas e atribuí-las a um retiro específico para organizar a rotina diária da equipe de campo e garantir que o planejamento seja executado corretamente |
| **Critério de Aceite 1** | CR1: Dado que João acessa o sistema, quando cria uma tarefa e seleciona um retiro, então a tarefa deve ser salva corretamente vinculada ao retiro |
| **Critério de Aceite 2** | CR2: Dado que a tarefa foi criada, quando o sistema sincronizar, então ela deve ficar disponível para os capatazes responsáveis pelo retiro |

### Critérios INVEST

**Independente:** Pode ser implementada sem depender da visualização offline

**Negociável:** Campos e detalhes da tarefa podem ser ajustados conforme necessidade do gerente

**Valorosa:** Permite maior controle e organização das atividades da fazenda

**Estimável:** Escopo claro de criação e associação de tarefas

**Pequena:** Foco apenas na criação e atribuição de tarefas

**Testável:** Possível validar criação e vínculo com retiro

| Campo | Descrição |
| ----- | ----- |
| **Identificação** | US02 |
| **Persona** | Gabriel Galdino (Capataz) |
| **User Story** | Como capataz, posso visualizar minha lista de tarefas do dia offline para saber o que precisa ser executado, mesmo longe da sede, de forma simples e clara |
| **Critério de Aceite 1** | CR1: Dado que as tarefas foram previamente sincronizadas, quando Gabriel estiver sem internet, então deve conseguir visualizar a lista de tarefas do dia |
| **Critério de Aceite 2** | CR2: Dado que não há tarefas sincronizadas, quando acessar offline, então o sistema deve exibir uma mensagem simples informando ausência de tarefas |
| **Critério de Aceite 3** | CR3: Dado que Gabriel acessa as tarefas, quando exibidas, então devem estar organizadas de forma simples e de fácil entendimento |

### Critérios INVEST

**Independente:** Depende apenas da sincronização de tarefas

**Negociável:** Forma de exibição pode ser adaptada ao nível de letramento digital

**Valorosa:** Garante execução das atividades mesmo sem internet

**Estimável:** Escopo técnico claro (armazenamento local e leitura)

**Pequena:** Foco na visualização das tarefas do dia

**Testável:** Cenários offline verificáveis

---

| Campo | Descrição |
| ----- | ----- |
| **Identificação** | US03 |
| **Persona** | Gabriel Galdino (Capataz) |
| **User Story** | Como capataz, posso marcar uma tarefa como concluída para informar o gerente sobre o avanço do trabalho de forma simples e rápida |
| **Critério de Aceite 1** | CR1: Dado que Gabriel visualiza uma tarefa, quando marcar como concluída, então o status da tarefa deve ser atualizado no sistema |
| **Critério de Aceite 2** | CR2: Dado que a tarefa foi marcada como concluída offline, quando o dispositivo sincronizar, então o status deve ser atualizado para o gerente |
| **Critério de Aceite 3** | CR3: Dado que Gabriel interage com a tarefa, quando marcar como concluída, então a ação deve ser simples, com botão visível e de fácil entendimento |

### Critérios INVEST

**Independente:** Pode ser implementada separadamente da criação de tarefas

**Negociável:** Forma de interação pode ser ajustada (botão, ícone, etc.)

**Valorosa:** Permite acompanhamento do progresso das atividades

**Estimável:** Escopo claro (alteração de status + sincronização)

**Pequena:** Foco apenas na atualização de status

**Testável:** Possível validar mudança de status e sincronização

---

| Campo | Descrição |
| ----- | ----- |
| **Identificação** | US04 |
| **Persona** | Gabriel Galdino (Capataz) |
| **User Story** | Como capataz, posso anexar fotos na conclusão de uma tarefa para comprovar visualmente o serviço realizado, mesmo em ambiente com conexão limitada |
| **Critério de Aceite 1** | CR1: Dado que Gabriel conclui uma tarefa, quando anexar uma foto, então ela deve ser associada corretamente à tarefa |
| **Critério de Aceite 2** | CR2: Dado que a foto foi registrada offline, quando o dispositivo sincronizar, então a imagem deve ser enviada ao sistema |
| **Critério de Aceite 3** | CR3: Dado que Gabriel utiliza a funcionalidade, quando anexar a foto, então o processo deve ser simples e intuitivo |

### Critérios INVEST

**Independente:** Pode ser implementada separadamente do fluxo de conclusão

**Negociável:** Forma de captura/anexo pode ser ajustada

**Valorosa:** Garante evidência visual do trabalho realizado

**Estimável:** Escopo claro (upload + vínculo com tarefa)

**Pequena:** Foco no anexo de imagens

**Testável:** Possível validar envio e associação da imagem

---

| Campo | Descrição |
| ----- | ----- |
| **Identificação** | US05 |
| **Persona** | Gabriel Galdino (Capataz) |
| **User Story** | Como capataz, posso gravar e anexar um áudio curto à tarefa, para explicar detalhes complexos sem precisar digitar textos longos |
| **Critério de Aceite 1** | CR1: Dado que Gabriel está visualizando uma tarefa, quando clicar na opção de gravar áudio, então o sistema deve permitir iniciar a gravação |
| **Critério de Aceite 2** | CR2: Dado que a gravação foi finalizada, quando salvar, então o áudio deve ser anexado corretamente à tarefa |
| **Critério de Aceite 3** | CR3: Dado que o áudio foi anexado, quando o supervisor acessar a tarefa, então deve conseguir reproduzir o áudio |

### Critérios INVEST

**Independente:** Não depende de outras funcionalidades além da tarefa

**Negociável:** Tempo máximo e formato do áudio podem ser ajustados

**Valorosa:** Reduz a necessidade de digitação para usuários com baixa instrução

**Estimável:** Escopo claro envolvendo gravação e anexação de áudio

**Pequena:** Funcionalidade focada apenas no envio de áudio

**Testável:** Possível testar gravação, salvamento e reprodução do áudio

---

| Campo | Descrição |
| ----- | ----- |
| **Identificação** | US06 |
| **Persona** | Gabriel Galdino (Capataz) |
| **User Story** | Como capataz, posso criar um alerta de infraestrutura (ticket), para avisar a gerência sobre cercas ou bebedouros quebrados |
| **Critério de Aceite 1** | CR1: Dado que Gabriel deseja registrar um problema, quando acessar a opção de novo alerta, então deve visualizar um formulário simples |
| **Critério de Aceite 2** | CR2: Dado que o alerta está sendo criado, quando preencher os dados, então deve ser obrigatório informar o tipo de problema |
| **Critério de Aceite 3** | CR3: Dado que o alerta é enviado, então o sistema deve registrar automaticamente a localização (GPS) |
| **Critério de Aceite 4** | CR4: Dado que o alerta foi criado, quando o supervisor acessar o sistema, então deve visualizar o novo chamado |

---

| Campo | Descrição |
| ----- | ----- |
| **Identificação** | US07 |
| **Persona** | João Pereira (Gerente) |
| **User Story** | Como gerente, posso visualizar um painel com o status de todas as tarefas e alertas em aberto, para priorizar a equipe de manutenção e garantir que as rotinas de campo sejam executadas conforme o planejamento |
| **Critério de Aceite 1** | CR1: Dado que João acessa o painel de acompanhamento, quando a tela é carregada, então são exibidas todas as tarefas atribuídas aos capatazes com seus respectivos status (pendente, em andamento, concluída), agrupadas por retiro ou capataz responsável |
| **Critério de Aceite 2** | CR2: Dado que um ou mais capatazes enviaram alertas ao gerente, quando João visualiza o painel, então os alertas aparecem em seção destacada, com identificação do capataz, do retiro e da data/hora de envio, ordenados do mais recente ao mais antigo |
| **Critério de Aceite 3** | CR3: Dado que um usuário com perfil diferente de gerente tenta acessar o painel de acompanhamento, quando a requisição é feita, então o sistema nega o acesso e redireciona para a interface correspondente ao seu perfil |

---

| Campo | Descrição |
| ----- | ----- |
| **Identificação** | US08 |
| **Persona** | Gabriel Galdino (Capataz) |
| **User Story** | Como capataz, posso registrar o nascimento de bezerros de forma offline para manter o rebanho atualizado sem usar boletas de papel |
| **Critério de Aceite 1** | CR1: Dado que Gabriel está no pasto sem acesso à internet, quando ele acessa o formulário de registro de nascimento e preenche os campos obrigatórios (data, retiro, categoria e quantidade), então o registro é salvo localmente no dispositivo com confirmação visual de que foi armazenado com sucesso |
| **Critério de Aceite 2** | CR2: Dado que Gabriel registrou um ou mais nascimentos enquanto estava offline, quando o dispositivo se conecta à internet, então os registros são sincronizados automaticamente com o servidor e Gabriel recebe uma confirmação visual de que os dados foram enviados |
| **Critério de Aceite 3** | CR3: Dado que Gabriel tenta salvar um registro de nascimento sem preencher todos os campos obrigatórios, quando ele tenta confirmar o formulário, então o sistema exibe uma mensagem indicando quais campos estão incompletos e não permite o salvamento do registro |
| **Critérios INVEST** | Não se aplica (US08 é de prioridade secundária). |

---

| Campo                    | Descrição                                                                                                                                                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identificação**        | US09                                                                                                                                                                                                                                                        |
| **Persona**              | Gabriel Galdino (Capataz)                                                                                                                                                                                                                                  |
| **User Story**           | Como capataz, posso registrar a morte de um animal offline para reportar rapidamente a baixa ao coordenador, garantindo que nenhuma informação se perca mesmo sem conexão disponível no campo.                                                             |
| **Critério de Aceite 1** | CR1: Dado que Gabriel está sem conexão Starlink no momento do óbito, quando ele preenche os campos obrigatórios do formulário de morte (identificação do animal, categoria, causa e data) e confirma, então o sistema deve salvar o registro localmente no dispositivo e exibir a mensagem "Registro salvo. Será enviado quando houver conexão" |

### Critérios INVEST

**Independente:** Pode ser registrado separadamente sem depender de outras funcionalidades

**Negociável:** Campos e estrutura do formulário podem ser refinados com cliente

**Valorosa:** Garante que óbitos não sejam perdidos mesmo offline

**Estimável:** Escopo claro (formulário + salvamento local + sincronização)

**Pequena:** Foco no registro da morte do animal

**Testável:** Possível validar salvamento offline e sincronização posterior

---

| Campo | Descrição |
|-----------|-----------|
| **Identificação** | US10 |
| **Persona** | Gabriel Galdino (Capataz) |
| **User Story** | Como capataz, posso (e devo) anexar a foto do animal no registro de óbito para cumprir as regras de auditoria e controle sanitário da fazenda. |
| **Critério de Aceite 1** | CR1: Dado que o capataz está registrando um óbito, quando preencher as informações do registro, então o sistema deve exigir o anexo de pelo menos uma foto do animal antes de finalizar o cadastro. |
| **Critério de Aceite 2** | CR2: Dado que o capataz esteja sem conexão com a internet, quando anexar a foto ao registro de óbito, então o sistema deve armazenar a imagem localmente para sincronização posterior. |
| **Critério de Aceite 3** | CR3: Dado que o registro de óbito foi sincronizado com sucesso, quando o gerente ou coordenador acessar o sistema, então a foto anexada deve estar vinculada ao respectivo registro para consulta e auditoria. |
| **Critérios INVEST** | Não se aplica (US10 é de prioridade secundária). |

---

# <a name="c3"></a>3. Projeto da Aplicação Web (sprints 1 a 5)

## 3.1. Requisitos do Sistema (sprints 1 a 5)

_Esta seção formaliza o que o sistema deve fazer, sob quais regras e com quais qualidades. Atualize a cada sprint conforme os requisitos evoluem._

### 3.1.1. Requisitos Funcionais (sprint 1, refinar até sprint 5)

| ID    | Descrição                                                                                                                                                  | Prioridade | Status    |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- |
| RF001 | O sistema deve permitir que o gerente crie tarefas e as associe a um retiro específico                                                                     | Alta       | Planejado |
| RF002 | O sistema deve permitir que o capataz visualize as tarefas do dia mesmo sem conexão com a internet                                                         | Alta       | Planejado |
| RF003 | O sistema deve armazenar localmente as tarefas sincronizadas para acesso offline                                                                           | Alta       | Planejado |
| RF004 | O sistema deve exibir mensagem simples quando não houver tarefas disponíveis offline                                                                       | Média      | Planejado |
| RF005 | O sistema deve permitir que o capataz grave um áudio curto e o anexe a uma tarefa                                                                          | Média      | Planejado |
| RF006 | O sistema deve permitir que o capataz crie alertas de infraestrutura (ticket), informando: tipo de problema, retirada e localização                        | Média      | Planejado |
| RF007 | O sistema deve exibir ao gerente um painel com o status de todas as tarefas (pendente, em andamento, concluída) e alertas em aberto, agrupados por retiro. | Média      | Planejado |
| RF008 | O sistema deve permitir que o capataz registre o nascimento de bezerros de forma offline, informando: data, retiro, categoria e quantidade                 | Média      | Planejado |
| RF009 | O sistema deve permitir que o capataz preencha e confirme o formulário de registro de morte de animal mesmo sem conexão com a internet, salvando os dados localmente no dispositivo | Alta    | Planejado    |
| RF010 | O sistema deve detectar automaticamente o restabelecimento da conexão com a rede e iniciar a transmissão dos registros locais pendentes para o servidor remoto, sem exigir nenhuma ação manual do capataz | Alta    | Planejado    |
| RF011 | O sistema deve notificar o capataz com uma mensagem de confirmação após a sincronização bem-sucedida dos dados com o servidor ("Registro sincronizado com sucesso") | Média   | Planejado    |
| RF012 | O sistema deve manter os registros com falha de envio salvos localmente e tentar reenvio automático a cada nova conexão disponível, até que a sincronização seja concluída com sucesso | Alta  | Planejado    |
| RF013 | O sistema deve validar o preenchimento dos campos obrigatórios do formulário de óbito (identificação do animal, categoria, causa da morte e data) antes de permitir o salvamento local, bloqueando o registro incompleto e sinalizando visualmente os campos faltante | Alta  | Planejado    |
| RF014 | Após a sincronização, o sistema deve disponibilizar automaticamente o registro de óbito no painel do coordenador, vinculado ao retiro do capataz que realizou o lançamento | Média | Planejado    |

### 3.1.2. Regras de Negócio (sprint 1, refinar até sprint 5)

| ID   | Descrição | RF associado |
|------|------|------|
| RN01 | Toda tarefa deve estar obrigatoriamente vinculada a um único retiro | RF001 |
| RN02 | Apenas tarefas do dia atual devem ser exibidas ao capataz | RF002 |
| RN03 | As tarefas devem ser armazenadas localmente após sincronização | RF003 |
| RN04 | A mensagem exibida deve utilizar linguagem simples e direta | RF004 |
| RN05 | Apenas tarefas associadas ao retiro do capataz devem ser exibidas para ele | RF002 |
| RN06 | O sistema deve permitir visualização offline apenas de tarefas previamente sincronizadas | RF002 |
| RN07 | As tarefas do dia devem ficar disponíveis offline quando houver sincronização prévia | RF002 |
| RN08 | A marcação de conclusão feita offline deve ser armazenada localmente até a próxima sincronização | RF003 |
| RN09 | Uma tarefa concluída deve ter seu status atualizado para o gerente após sincronização | RF003 |
| RN10 | As fotos anexadas devem estar vinculadas à tarefa correspondente | RF004 |
| RN11 | Fotos registradas offline devem ser enviadas ao sistema quando houver conexão | RF004 |
| RN12 | As telas destinadas ao capataz devem usar linguagem simples, botões visíveis e poucos passos de interação | RF002, RF003, RF004 |
| RN13 | O áudio anexado pelo capataz deve estar vinculado a uma tarefa existente | RF005 |
| RN14 | O capataz deve conseguir gravar um áudio curto para complementar a conclusão ou atualização de uma tarefa | RF005 |
| RN15 | O áudio gravado sem conexão com a internet deve ser armazenado localmente até a próxima sincronização | RF005 |
| RN16 | O áudio registrado offline deve ser enviado ao sistema quando houver conexão disponível | RF005 |
| RN17 | O sistema deve exibir uma mensagem simples de confirmação após o áudio ser salvo ou sincronizado | RF005 |
| RN18 | O áudio anexado deve ficar disponível junto aos detalhes da tarefa correspondente | RF005 |
| RN19 | O sistema deve capturar automaticamente a localização (GPS) quando o capataz criar um alerta | RF006 |
| RN20 | O alerta deve ser enviado imediatamente ao servidor caso haja conexão com a internet | RF006 |
| RN21 | Se não houver conexão, o alerta deve ser armazenado localmente e enviado na próxima sincronização | RF006 |
| RN22 | O sistema deve exibir uma mensagem de confirmação após o envio bem-sucedido do alerta | RF006 |
| RN23 | Se o alerta não puder ser enviado devido à falta de conexão, o sistema deve informar ao capataz que o registro foi salvo localmente e será enviado posteriormente | RF006 |
| RN25 | O sistema deve registrar a data e hora exatas da criação do alerta | RF006 |
| RN26 | O sistema deve associar o alerta ao retiro selecionado pelo capataz | RF006 |
| RN27 | O sistema deve permitir que o capataz registre o nascimento de bezerros de forma offline, informando: data, retiro, categoria e quantidade | RF006 |

| ID   | Descrição                                                                                                  | RF associado        |
| ---- | ---------------------------------------------------------------------------------------------------------- | ------------------- |
| RN01 | Toda tarefa deve estar obrigatoriamente vinculada a um único retiro                                        | RF001               |
| RN02 | Apenas tarefas do dia atual devem ser exibidas ao capataz                                                  | RF002               |
| RN03 | As tarefas devem ser armazenadas localmente após sincronização                                             | RF003               |
| RN04 | A mensagem exibida deve utilizar linguagem simples e direta                                                | RF004               |
| RN05 | Apenas tarefas associadas ao retiro do capataz devem ser exibidas para ele.                                | RF002               |
| RN06 | O sistema deve permitir visualização offline apenas de tarefas previamente sincronizadas                   | RF002               |
| RN07 | As tarefas do dia devem ficar disponíveis offline quando houver sincronização prévia.                      | RF002               |
| RN08 | A marcação de conclusão feita offline deve ser armazenada localmente até a próxima sincronização.          | RF003               |
| RN09 | Uma tarefa concluída deve ter seu status atualizado para o gerente após sincronização.                     | RF003               |
| RN10 | As fotos anexadas devem estar vinculadas à tarefa correspondente.                                          | RF004               |
| RN11 | Fotos registradas offline devem ser enviadas ao sistema quando houver conexão.                             | RF004               |
| RN12 | O painel do gerente deve exibir tarefas organizadas por retiro e por status.                               | RF007               |
| RN13 | O painel deve apresentar informações atualizadas conforme a última sincronização disponível.               | RF007               |
| RN14 | As telas destinadas ao capataz devem usar linguagem simples, botões visíveis e poucos passos de interação. | RF002, RF003, RF004 |
| RN15 | Um registro de óbito só pode ser marcado como "sincronizado" e removido da fila local após o servidor retornar HTTP 200 ou 201 | RF010, RF012 |
| RN16 | O formulário de óbito não pode ser salvo — online ou offline — se qualquer campo obrigatório (identificação, categoria, causa da morte ou data) estiver vazio | RF009, RF013 |
| RN17 | A sincronização deve ser iniciada automaticamente ao detectar conexão, sem depender de nenhuma ação manual do capataz | RF010 |
| RN18 | Em falha parcial de sincronização, apenas registros com HTTP 200/201 são marcados como enviados; os demais permanecem na fila e são reenviados sem duplicação | RF012 |
| RN19 | Cada registro de óbito sincronizado deve ser vinculado ao retiro e ao capataz responsável, sendo imutável após confirmação do servidor | RF009, RF014 |
| RN20 | Um registro de óbito só deve aparecer no painel do coordenador após sincronização bem-sucedida; registros em fila local são invisíveis para outros perfis | RF014 |

### 3.1.3. Requisitos Não Funcionais — 8 Eixos ISO/IEC 25010 (sprints 1 a 5)

_Preencha os 8 eixos. Cada eixo deve ter ao menos um RNF verificável (com métrica, limite ou critério concreto) ou justificativa explícita de ausência. Evolua do conceitual (sprint 1) ao técnico mensurável (sprint 5)._

| Eixo                     | Requisito | Métrica / Critério | Como atendido |
|--------------------------|-----------|--------------------|---------------|
| USAB - Usabilidade       | ...       | ...                | ...           |
| CONF - Confiabilidade    | ...       | ...                | ...           |
| DES - Desempenho         | ...       | p95 < X ms         | ...           |
| SUP - Suportabilidade    | ...       | ...                | ...           |
| SEG - Segurança          | ...       | ...                | ...           |
| CAP - Capacidade         | ...       | ...                | ...           |
| REST - Restrições Design | ...       | ...                | ...           |
| ORG - Organizacionais    | ...       | ...                | ...           |

### 3.1.4. Matriz RF → RN → Endpoint (sprints 3 a 5)

_Matriz de cobertura mostrando quais RN e endpoints implementam cada RF._

| RF    | RN associadas | Endpoint              | Método |
| ----- | ------------- | --------------------- | ------ |
| RF001 | RN01          | /tarefas              | POST   |
| RF002 | RN02, RN05    | /tarefas/hoje         | GET    |
| RF003 | RN03          | /tarefas/sincronizar  | GET    |
| RF004 | RN04          | /tarefas/hoje/offline | GET    |
| RF005 | RN05          | /tarefas/concluir     | POST   |
| RF006 | RN06          | /chamados             | POST   |
| RF007 | RN07          | /eventos/zootecnicos  | POST   |
| RF008 | RN08          | /transacoes/gado      | POST   |
| RF009 | RN09          | /transferencias       | POST   |
| RF010 | RN10          | Armazenamento Local   | INSERT |
| RF011 | RN11          | /sincronizar          | POST   |
| RF012 | RN12          | Consulta Banco Local  | GET    |

## 3.2. Arquitetura (sprints 1 a 5)

### 3.2.1. Diagrama de Arquitetura (sprints 3 e 4)

_Posicione aqui o diagrama de arquitetura da solução, indicando as camadas principais (Controller, Service, Repository, Model) e suas responsabilidades. Atualize sempre que necessário._

### 3.2.2. Diagrama de Casos de Uso (sprint 1)

@startuml
left to right direction

actor "Gerente (João)" as Gerente
actor "Coordenador (Marcos)" as Coordenador
actor "Capataz (Gabriel)" as Capataz

rectangle "Sistema BrPec" {

usecase "Criar tarefa" as UC1
usecase "Atribuir tarefa ao retiro" as UC2
usecase "Visualizar painel de status" as UC3

usecase "Visualizar tarefas do dia" as UC4
usecase "Marcar tarefa como concluída" as UC5
usecase "Anexar foto na tarefa" as UC6

usecase "Visualizar movimentações" as UC7
usecase "Validar movimentações" as UC8
usecase "Exportar relatórios" as UC9
}

Gerente --> UC1
Gerente --> UC3

Capataz --> UC4
Capataz --> UC5

Coordenador --> UC7
Coordenador --> UC8
Coordenador --> UC9

UC1 ..> UC2 : <<include>>
UC8 ..> UC7 : <<include>>

UC6 ..> UC5 : <<extend>>

@enduml

<center>
  <img src="../assets/diagramaDeUso.png" width="800"/>
  <p><strong>Figura 6</strong> — Diagrama de Caso De Uso aplicada à BrPec Agropecuária<br/>
  Fonte: Próprios autores (2026).</p>
</center>

### 3.2.3. Diagrama de Classes do Domínio (sprint 2)

_Diagrama UML de classes com entidades, atributos, relacionamentos e responsabilidades. Diferencie **associação**, **agregação** (losango vazio), **composição** (losango cheio) e **herança** (triângulo vazio). Multiplicidade explícita em toda associação._

### 3.2.4. Diagrama de Sequência UML (sprint 3)

_Ao menos um fluxo prioritário, mostrando a interação entre as camadas Controller → Service → Repository → Banco. Linhas de vida verticais, ativação correta, mensagens síncronas e assíncronas diferenciadas, retornos tracejados._

### 3.2.5. Diagrama de Atividades ou Estados (sprint 3)

_Ao menos um fluxo relevante em UML ou BPMN. Use a notação da ferramenta escolhida de forma consistente (sem misturar convenções)._

### 3.2.6. Diagrama de Implantação (sprints 4 e 5)

_Diagrama UML de deployment mostrando nós físicos, artefatos e canais de comunicação. Representa a visão Engineering + Technology do RM-ODP._

### 3.2.7. Padrões de Projeto Aplicados (sprints 3 a 5)

_Documente os design patterns utilizados (Repository, Strategy, Factory, DTO etc.) e quais princípios SOLID se aplicam. Justifique a adoção de cada padrão com base em uma necessidade real do projeto._

## 3.3. Wireframes (sprint 2)

_Posicione aqui as imagens do wireframe construído para sua solução e, opcionalmente, o link para acesso (mantenha o link sempre público para visualização)_

## 3.4. Guia de estilos (sprint 3)

_Descreva aqui orientações gerais para o leitor sobre como utilizar os componentes do guia de estilos de sua solução_

### 3.4.1 Cores

_Apresente aqui a paleta de cores, com seus códigos de aplicação e suas respectivas funções_

### 3.4.2 Tipografia

_Apresente aqui a tipografia da solução, com famílias de fontes e suas respectivas funções_

### 3.4.3 Iconografia e imagens

_(esta subseção é opcional, caso não existam ícones e imagens, apague esta subseção)_

_posicione aqui imagens e textos contendo exemplos padronizados de ícones e imagens, com seus respectivos atributos de aplicação, utilizadas na solução_

## 3.5 Protótipo de alta fidelidade (sprint 3)

_posicione aqui algumas imagens demonstrativas de seu protótipo de alta fidelidade e o link para acesso ao protótipo completo (mantenha o link sempre público para visualização)_

## 3.6. Modelagem do banco de dados (sprints 2 e 4)

### 3.6.1. Modelo Entidade-Relacionamento (ER) (sprint 2)

*Apresente o modelo ER conceitual com entidades, atributos e relacionamentos. Use notação consistente (Chen ou Crow's Foot - não misture).*

### 3.6.2. Diagrama Entidade-Relacionamento (DER) (sprint 2)

_Posicione aqui o DER com cardinalidades explícitas em ambos os lados de cada relação e identificação de PK/FK. O DER deve ser coerente com o diagrama de classes (3.2.3)._

### 3.6.3. Modelo Relacional e Modelo Físico (sprints 2 e 4)

_Posicione aqui os diagramas de modelos relacionais do banco de dados, apresentando todos os esquemas de tabelas e suas relações. Inclua as migrations DDL numeradas e reproduzíveis (`CREATE TABLE`, `CREATE INDEX`, constraints `NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`). Utilize texto para complementar suas explicações quando necessário._

### 3.6.4. Consultas SQL e lógica proposicional (sprint 2)

_posicione aqui uma lista de consultas SQL compostas, realizadas pelo back-end da aplicação web, com sua respectiva lógica proposicional, descrita conforme template abaixo. Lembre-se que para usar LaTeX em markdown, basta você colocar as expressões entre $ ou $$_

_Template de SQL + lógica proposicional_
#1 | ---
--- | ---
**Expressão SQL** | SELECT \* FROM suppliers WHERE (state = 'California' AND supplier_id <> 900) OR (supplier_id = 100);
**Proposições lógicas** | $A$: O estado é 'California' (state = 'California') <br> $B$: O ID do fornecedor não é 900 (supplier_id ≠ 900) <br> $C$: O ID do fornecedor é 100 (supplier_id = 100)
**Expressão lógica proposicional** | $(A \land B) \lor C$
**Tabela Verdade** | <table> <thead> <tr> <th>$A$</th> <th>$B$</th> <th>$C$</th> <th>$(A \land B)$</th> <th>$(A \land B) \lor C$</th> </tr> </thead> <tbody> <tr> <td>F</td> <td>F</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>F</td> <td>F</td> <td>V</td> <td>F</td> <td>V</td> </tr> <tr> <td>F</td> <td>V</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>F</td> <td>V</td> <td>V</td> <td>F</td> <td>V</td> </tr> <tr> <td>V</td> <td>F</td> <td>F</td> <td>F</td> <td>F</td> </tr> <tr> <td>V</td> <td>F</td> <td>V</td> <td>F</td> <td>V</td> </tr> <tr> <td>V</td> <td>V</td> <td>F</td> <td>V</td> <td>V</td> </tr> <tr> <td>V</td> <td>V</td> <td>V</td> <td>V</td> <td>V</td> </tr> </tbody> </table>

_Dica: edite a tabela verdade fora do markdown, para ter melhor controle_

## 3.7. WebAPI e endpoints (sprints 3 e 4)

_Utilize um link para outra página de documentação contendo a descrição completa de cada endpoint. Ou descreva aqui cada endpoint criado para seu sistema._

_Cada endpoint deve conter endereço, método (GET, POST, PUT, PATCH, DELETE), header, body, formatos de response e os status codes possíveis (200, 201, 204, 400, 401, 403, 404, 409, 422, 500)._

## 3.8. Autenticação, Autorização e Resiliência (sprint 5)

### 3.8.1. Autenticação

_Descreva o fluxo de autenticação implementado: persistência de senha com hash bcrypt/argon2 (parâmetros de custo explícitos e justificados), validação de credenciais e criação de sessão. Senhas em texto plano no banco não são aceitas._

### 3.8.2. Controle de sessão

_Descreva o controle de sessão baseado em `session id` persistido em tabela própria, com expiração. Se optar por JWT, justifique a escolha explicando os trade-offs (stateless, não revogável, payload exposto)._

### 3.8.3. Autorização

*Descreva as regras de autorização por rota e por operação, baseadas no perfil do usuário autenticado. A verificação deve ocorrer no backend - o frontend nunca é fonte de verdade para autorização.*

### 3.8.4. Estratégias de Resiliência

_Descreva as estratégias aplicadas no tratamento de falhas de rede: timeout, retry com backoff exponencial, circuit breaker e idempotência em operações críticas (`PUT`, `DELETE`, operações de pagamento etc.)._

## 3.9. Matriz de Rastreabilidade (RTM) (sprints 3 a 5)

*A RTM consolida a rastreabilidade completa do sistema. Um elo quebrado invalida toda a cadeia - mantenha-a atualizada a cada sprint. A partir da sprint 3 não deve haver lacunas nos fluxos centrais.*

| Persona | RF    | RN   | Endpoint    | Tela     | Teste | Evidência                          |
| ------- | ----- | ---- | ----------- | -------- | ----- | ---------------------------------- |
| ...     | RF001 | RN01 | `/usuarios` | Cadastro | CT02  | print, log, relatório de cobertura |

# <a name="c4"></a>4. Desenvolvimento da Aplicação Web

## 4.1. Primeira versão da aplicação web (sprint 3)

_Descreva e ilustre aqui o desenvolvimento da primeira versão do sistema web. Utilize prints de tela para ilustrar. Indique obrigatoriamente: (a) o que foi implementado, (b) o que não foi concluído, (c) dificuldades técnicas enfrentadas e próximos passos._

## 4.2. Segunda versão da aplicação web (sprint 4)

_Descreva e ilustre aqui o desenvolvimento da segunda versão do sistema web, com foco no que foi consolidado entre a primeira versão funcional e o sistema operacional integrado. Utilize prints de tela para ilustrar. Indique obrigatoriamente: (a) o que foi implementado, (b) o que não foi concluído, (c) dificuldades técnicas enfrentadas e próximos passos._

## 4.3. Versão final da aplicação web (sprint 5)

_Descreva e ilustre aqui o desenvolvimento da versão final do sistema web, com foco em refatorações, correções finais e na camada de autenticação/autorização entregue. Utilize prints de tela para ilustrar. Indique obrigatoriamente: (a) o que foi refinado ou adicionado desde a sprint 4, (b) pendências remanescentes, (c) dificuldades técnicas enfrentadas._

# <a name="c5"></a>5. Testes

## 5.1. Relatório de testes de integração de endpoints automatizados (sprint 4)

_Liste e descreva os testes automatizados dos endpoints criados e planejados para sua solução, implementados com **Jest**. Cubra as duas abordagens:_

- ***White-box*** *- testes unitários de Service que exercitam ramos internos, exceções e regras de negócio (conhecimento da implementação).*
- ***Black-box*** *- testes de integração dos endpoints via Jest + Supertest, verificando apenas o contrato HTTP (status, body, efeito observável), sem depender da implementação interna.*

_Posicione aqui também o relatório de cobertura de testes Jest se houver (através de link ou transcrito para estrutura markdown)._

## 5.2. Testes de usabilidade (sprint 5)

### 5.2.1. Relatório de testes de guerrilha

_Posicione aqui as tabelas com enunciados de tarefas, etapas e resultados de testes de usabilidade. Ou utilize um link para seu relatório de testes (mantenha o link sempre público para visualização)._

### 5.2.2. Relatório de testes SUS (System Usability Scale)

_Posicione aqui o relatório dos testes SUS realizados._

# <a name="c6"></a>6. Estudo de Mercado e Plano de Marketing (sprint 4)

## 6.1 Resumo Executivo

_Preencher com até 300 palavras, sem necessidade de fonte_

_Apresente de forma clara e objetiva os principais destaques do projeto: oportunidades de mercado, diferenciais competitivos da aplicação web e os objetivos estratégicos pretendidos._

## 6.2 Análise de Mercado

_a) Visão Geral do Setor (até 250 palavras)_
_Contextualize o setor no qual a aplicação está inserida, considerando aspectos econômicos, tecnológicos e regulatórios. Utilize fontes confiáveis._

_b) Tamanho e Crescimento do Mercado (até 250 palavras)_
_Apresente dados quantitativos sobre o tamanho atual e projeções de crescimento do mercado. Utilize fontes confiáveis._

_c) Tendências de Mercado (até 300 palavras)_
_Identifique e analise tendências relevantes (tecnológicas, comportamentais e mercadológicas) que influenciam o setor. Utilize fontes confiáveis._

## 6.3 Análise da Concorrência

_a) Principais Concorrentes (até 250 palavras)_
_Liste os concorrentes diretos e indiretos, destacando suas principais características e posicionamento no mercado._

_b) Vantagens Competitivas da Aplicação Web (até 250 palavras)_
_Descreva os diferenciais da sua aplicação em relação aos concorrentes, sem necessidade de citação de fontes._

## 6.4 Público-Alvo

_a) Segmentação de Mercado (até 250 palavras)_
Descreva os principais segmentos de mercado a serem atendidos pela aplicação. Utilize bases de dados e fontes confiáveis.\*

_b) Perfil do Público-Alvo (até 250 palavras)_
_Caracterize o público-alvo com dados demográficos, psicográficos e comportamentais, incluindo necessidades específicas. Utilize fontes obrigatórias._

## 6.5 Posicionamento

_a) Proposta de Valor Única (até 250 palavras)_
_Defina de maneira clara o que torna a sua aplicação única e valiosa para o mercado._

_b) Estratégia de Diferenciação (até 250 palavras)_
_Explique como sua aplicação se destacará da concorrência, evidenciando a lógica por trás do posicionamento._

## 6.6 Estratégia de Marketing

_a) Produto/Serviço (até 200 palavras)_
_Descreva as funcionalidades, benefícios e diferenciais da aplicação_

_b) Preço (até 200 palavras)_
_Explique o modelo de precificação adotado e justifique com base nas análises anteriores._

_c) Praça (Distribuição) (até 200 palavras)_
_Apresente os canais digitais utilizados para distribuir e entregar a aplicação ao público._

_d) Promoção (até 200 palavras)_
_Descreva as estratégias digitais planejadas, como SEO, redes sociais, marketing de conteúdo e campanhas pagas._

# <a name="c7"></a>7. Conclusões e trabalhos futuros (sprint 5)

_Escreva de que formas a solução da aplicação web atingiu os objetivos descritos na seção 2 deste documento. Indique pontos fortes e pontos a melhorar de maneira geral._

_Relacione os pontos de melhorias evidenciados nos testes com planos de ações para serem implementadas. O grupo não precisa implementá-las, pode deixar registrado aqui o plano para ações futuras_

_Relacione também quaisquer outras ideias que o grupo tenha para melhorias futuras_

# <a name="c8"></a>8. Referências (sprints 1 a 5)

PORTAL SALÁRIO. Gerente de Produção e Operações Agropecuárias - Salário 2026, Piso Salarial. 2026. Disponível em: https://www.salario.com.br/profissao/gerente-de-producao-e-operacoes-agropecuarias-cbo-141115/. Acesso em: 28 abr. 2026.<br>

COSGROVE, J.; CACHIA, R. DigComp 3.0: European Digital Competence Framework. 5. ed. Luxembourg: Publications Office of the European Union, 2025. Disponível em: https://data.europa.eu/doi/10.2760/0001149. Acesso em: 28 abr. 2026.<br>

IPOG. Gestão do Agronegócio: como está o mercado de trabalho?. Disponível em: https://blog.ipog.edu.br/gestao-e-negocios/gestao-do-agronegocio/. [S.d.]. Acesso em: 28 abr. 2026.<br>

CONFEDERAÇÃO DA AGRICULTURA E PECUÁRIA DO BRASIL. Conheça as 4 carreiras mais quentes do agronegócio brasileiro. CNA Brasil, [S.d.]. Disponível em: https://www.cnabrasil.org.br/noticias/conheca-as-4-carreiras-mais-quentes-do-agronegocio-brasileiro. Acesso em: 28 abr. 2026. <br>

PORTAL SALÁRIO. Capataz na Pecuária - Salário 2026, Piso Salarial. 2026. Disponível em: https://www.salario.com.br/profissao/capataz-na-pecuaria-cbo-620115/. Acesso em: 28 abr. 2026. <br>

BRASIL. Ministério do Trabalho e Emprego. Classificação Brasileira de Ocupações (CBO): Capataz na Agropecuária - CBO 6210-05. [S.d.]. Disponível em: https://www.mtecbo.gov.br. Acesso em: 28 abr. 2026. <br>

MACHADO, João Guilherme de Camargo Ferraz; NANTES, José Flávio Diniz. Adoção da tecnologia da informação em organizações rurais: o caso da pecuária de corte. Gestão & Produção, São Carlos, v. 18, n. 3, p. 555-570, 2011. Disponível em: https://www.scielo.br/j/gp/a/cwVwLsPgq8FBq5kvgXZPpLQ/. Acesso em: 28 abr. 2026. <br>

‌
Incluir as principais referências de seu projeto, para que seu parceiro possa consultar caso ele se interessar em aprofundar. Um exemplo de referência de livro e de site:_<br>

CEPEA. PIB do Agronegócio Brasileiro. Disponível em: https://www.cepea.esalq.usp.br. Acesso em: 29 abr. 2026.

REVISTA DE GESTÃO E PROJETOS — GeP. Gestão de riscos em projetos: uma análise comparativa da norma ISO 31000 e o Guia PMBOK®, 2012. Revista de Gestão e Projetos — GeP, São Paulo, v. 4, n. 3, p. 46–72, set./dez. 2013. Disponível em: https://www.bibliotecadeseguranca.com.br/wp-content/uploads/2020/05/gerenciamento-de-riscos-em-projetos-uma-comparacao-entre-o-pmbok-e-a-iso-31000.pdf. Acesso em: 29 abr. 2026. 



# <a name="c9"></a>Anexos

_Inclua aqui quaisquer complementos para seu projeto, como diagramas, imagens, tabelas etc. Organize em sub-tópicos utilizando headings menores (use ## ou ### para isso)_
