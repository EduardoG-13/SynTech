#!/usr/bin/env python3
"""
Sprint 5 — Tarefas extras: melhorias de frontend (feedback Prof. Kleber)
2 cards | Projeto 10969 | Milestone 1517
"""

import urllib.request
import urllib.error
import json
import time

BASE_URL     = "https://git.inteli.edu.br/api/v4"
PROJECT_ID   = "10969"
MILESTONE_ID = 1517
TOKEN        = "glpat-MlLXspTiP6Aro4g40bNTlG86MQp1OjQ2CA.01.0y05aicis"

HDR = {"PRIVATE-TOKEN": TOKEN, "Content-Type": "application/json"}


def req(method, path, data=None):
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(f"{BASE_URL}{path}", data=body, headers=HDR, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"    ✗ HTTP {e.code} em {path}: {e.read().decode()[:200]}")
        return None
    except Exception as e:
        print(f"    ✗ Erro em {path}: {e}")
        return None


print("Resolvendo IDs dos usuários...")
UID = {}
for username in ["eduardo.oliveira2", "miguel.costa"]:
    result = req("GET", f"/users?username={username}")
    if result and len(result) > 0:
        UID[username] = result[0]["id"]
        print(f"  ✓ @{username} → ID {UID[username]}")
    else:
        print(f"  ✗ @{username} não encontrado.")


ISSUES = [
    {
        "title":    "[SP5] - Melhorar CSS global, remover emojis e corrigir apresentação visual",
        "assignee": "eduardo.oliveira2",
        "reviewer": "miguel.costa",
        "start":    "2026-06-16",
        "end":      "2026-06-16",
        "branch":   "fix/frontend-css-global-emojis-and-titles",
        "commit":   "fix: melhora css global remove emojis e corrige apresentacao visual",
        "us":       "US01–US12",
        "rf":       "RF001–RF015",
        "rn":       "RN01",
        "rnf":      "RNF:USAB — Usabilidade (UI limpa, sem elementos visuais desnecessários); RNF:DES — Desempenho",
        "local":    "`src/` (estilos globais) + componentes de layout e navegação",
        "objetivo": (
            "Aplicar as melhorias de apresentação visual apontadas pelo Prof. Kleber na Sprint Review: "
            "remover todos os emojis da interface do site (botões, cabeçalhos, labels e textos); "
            "corrigir o CSS global para garantir espaçamentos, tipografia e contraste consistentes; "
            "simplificar os títulos dos formulários (linguagem mais direta e menos verbosa); "
            "e corrigir a apresentação do fechamento mensal na interface para que os dados fiquem "
            "legíveis e organizados. O resultado esperado é uma UI mais limpa e profissional."
        ),
        "entrega": (
            "PR com: (a) emojis removidos de toda a interface, (b) CSS global revisado, "
            "(c) títulos dos formulários simplificados, (d) fechamento mensal com apresentação "
            "corrigida. Screenshots antes/depois obrigatórios no PR como evidência."
        ),
        "tags":     ["CODE", "Sprint 5", "M", "P.Alta", "UX"],
        "estimate": "2h",
    },
    {
        "title":    "[SP5] - Corrigir formulários de nascimento, evolução e identificação da boleta PDF",
        "assignee": "eduardo.oliveira2",
        "reviewer": "miguel.costa",
        "start":    "2026-06-17",
        "end":      "2026-06-17",
        "branch":   "fix/frontend-forms-birth-evolution-pdf",
        "commit":   "fix: corrige formularios de nascimento evolucao e identificacao da boleta",
        "us":       "US02, US03, US04, US05, US06",
        "rf":       "RF002, RF003, RF005, RF006",
        "rn":       "RN02, RN05, RN12, RN13, RN14",
        "rnf":      "RNF:USAB — Usabilidade (Capataz conclui movimentação em no máximo 4 cliques/toques); RNF:DES — Desempenho",
        "local":    "Componentes de formulário (`src/components/` ou equivalente) + geração de PDF",
        "objetivo": (
            "Implementar as melhorias de UX nos formulários específicos apontadas pelo Prof. Kleber: "
            "(1) alterar a lógica de exibição do formulário de nascimento — simplificar o fluxo e "
            "reduzir campos ou etapas desnecessárias; "
            "(2) melhorar a identificação visual no formulário de evolução animal — deixar claro "
            "qual animal está sendo editado (nome/ID em destaque no topo do formulário); "
            "(3) corrigir a identificação na boleta gerada em PDF — garantir que os dados do animal "
            "e da operação estejam legíveis, com hierarquia visual adequada."
        ),
        "entrega": (
            "PR com: (a) formulário de nascimento com fluxo simplificado, (b) formulário de evolução "
            "com identificação clara do animal, (c) boleta PDF com identificação corrigida. "
            "Screenshots da interface e prints do PDF gerado como evidência no PR."
        ),
        "tags":     ["CODE", "Sprint 5", "M", "P.Alta", "UX"],
        "estimate": "2h",
    },
]


def make_description(t):
    header = (
        f"*Dono:* @{t['assignee']}  \n"
        f"*Revisor:* @{t['reviewer']}  \n"
        f"*Tempo Estimado (T-Shirt Sizing):* M (2h de esforço)  \n"
        f"*Frente:* UX  \n"
        f"*Prioridade:* P:alta  \n"
        f"*Categoria:* DEVELOPMENT  \n"
        f"*Data de Início:* {t['start']}  \n"
        f"*Data de Entrega:* {t['end']}\n\n"
    )
    extras = (
        "## 🔗 Rastreabilidade (Requisitos & Negócios)\n"
        f"- **User Stories:** {t['us']}\n"
        f"- **Req. Funcionais:** {t['rf']}\n"
        f"- **Regras de Negócio:** {t['rn']}\n"
        f"- **Req. Não Funcionais:** {t['rnf']}\n\n"
        "## 🎯 Objetivo & Contexto\n"
        f"{t['objetivo']}\n\n"
        "## 📦 Entrega Esperada\n"
        f"{t['entrega']}\n\n"
        "## 📂 Onde Inserir no Projeto\n"
        f"{t['local']}\n\n"
    )
    body = (
        "## :clipboard: Definition of Ready (DoR)\n"
        "- [ ] Branch principal atualizada e sem conflitos\n"
        "- [ ] Feedback do Prof. Kleber acessível como referência\n"
        "- [ ] Ambiente de desenvolvimento configurado e funcional\n\n"
        "## :white_check_mark: Definition of Done (DoD)\n"
        "- [ ] Implementação concluída e funcional\n"
        "- [ ] Nenhuma regressão introduzida nos testes existentes\n"
        f"- [ ] PR aberto e pronto para revisão por @{t['reviewer']}\n\n"
        "## :test_tube: Critérios de Aceite\n"
        f"- [ ] *Dado que* a implementação é concluída, *quando* revisada por @{t['reviewer']}, "
        "*então* atende a todos os pontos de melhoria do feedback do Prof. Kleber sem introduzir regressão funcional.\n\n"
        "## :herb: Controle de Versão Sugerido\n"
        f"- *Branch:* `{t['branch']}`\n"
        f"- *Commit:* `{t['commit']}`"
    )
    return header + extras + body


print("\nCriando issues...\n")
for t in ISSUES:
    payload = {
        "title":        t["title"],
        "description":  make_description(t),
        "assignee_ids": [UID[t["assignee"]]],
        "labels":       ",".join(t["tags"]),
        "milestone_id": MILESTONE_ID,
        "due_date":     t["end"],
    }
    result = req("POST", f"/projects/{PROJECT_ID}/issues", payload)
    if result and "iid" in result:
        iid = result["iid"]
        req("POST", f"/projects/{PROJECT_ID}/issues/{iid}/time_estimate", {"duration": t["estimate"]})
        print(f"  ✓ Issue #{iid}: {t['title'][:65]}")
    else:
        print(f"  ✗ Falha: {t['title'][:65]}")
    time.sleep(0.35)

print("\nConcluído.")
