import sys
import io

# Configurar saída UTF-8 para Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pandas as pd
import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
from dotenv import load_dotenv
import os
from openpyxl import load_workbook

load_dotenv()

# CONFIGURAÇÕES
JIRA_URL = os.getenv("JIRA_URL")
EMAIL = os.getenv("EMAIL")
API_TOKEN = os.getenv("API_TOKEN")

# FILTRO JQL - mesma query do generate_archives
jql = '(project = MANTA AND status IN ("A Produzir", "Liberado Engenharia")) OR (project = TENSYLON AND status IN ("A Produzir", "Liberado Engenharia", "Aguardando Acabamento", "Aguardando Autoclave", "Aguardando Corte", "Aguardando montagem"))'

url = f"{JIRA_URL}/rest/api/3/search/jql"

headers = {
    "Accept": "application/json"
}

auth = HTTPBasicAuth(EMAIL, API_TOKEN)

# ============================================================================
# PARTE 1: GERAR ARQUIVO update_cards.xlsx
# ============================================================================

print("Buscando dados do Jira...")

next_page = None
all_rows = []
all_links = []

while True:
    params = {
        "jql": jql,
        "maxResults": 100,
        "fields": [
            "issuetype",
            "summary",
            "status",
            "customfield_10039",   # SITUAÇÃO
            "customfield_11298",   # VEÍCULO
            "customfield_10245"    # DT PREVISÃO ENTREGA
        ]
    }

    if next_page:
        params["nextPageToken"] = next_page

    response = requests.get(
        url,
        headers=headers,
        params=params,
        auth=auth
    )

    if response.status_code != 200:
        print(f"Erro na requisição: {response.status_code}")
        print(response.text)
        break

    data = response.json()
    issues = data.get("issues", [])

    if not issues:
        break

    for issue in issues:
        fields = issue.get("fields", {})

        # Tipo
        tipo = fields.get("issuetype", {}).get("name", "")

        # Chave e link
        key = issue.get("key", "")
        link = f"{JIRA_URL}/browse/{key}"

        # Campos padrão
        resumo = fields.get("summary", "")
        status = fields.get("status", {}).get("name", "")

        # SITUAÇÃO (dropdown Jira)
        situacao_raw = fields.get("customfield_10039")
        if isinstance(situacao_raw, dict):
            situacao = situacao_raw.get("value", "")
        else:
            situacao = situacao_raw or ""
        
        # Filtrar apenas situações desejadas
        situacoes_validas = ["⚪️RECEBIDO ENCAMINHADO", "🟢RECEBIDO LIBERADO"]
        if situacao not in situacoes_validas:
            continue

        # Abreviar situação
        if situacao == "⚪️RECEBIDO ENCAMINHADO":
            situacao = "⚪️REC. Encaminhado"
        elif situacao == "🟢RECEBIDO LIBERADO":
            situacao = "🟢REC. Liberado"

        # VEÍCULO
        veiculo_raw = fields.get("customfield_11298")
        if isinstance(veiculo_raw, dict):
            veiculo = veiculo_raw.get("value", "")
        else:
            veiculo = veiculo_raw or ""

        # DT PREVISÃO ENTREGA
        dt_previsao_raw = fields.get("customfield_10245", "")
        if dt_previsao_raw:
            try:
                dt_previsao = datetime.strptime(dt_previsao_raw, "%Y-%m-%d").strftime("%d/%m/%Y")
            except:
                dt_previsao = dt_previsao_raw
        else:
            dt_previsao = ""

        all_rows.append({
            "ID": key,
            "Tipo de issue": tipo,
            "Chave": link,
            "Resumo": resumo,
            "Status": status,
            "SITUAÇÃO": situacao,
            "Veículo": veiculo,
            "DT. PREVISÃO ENTREGA": dt_previsao
        })

        all_links.append(link)

    print("Cartões coletados:", len(all_rows))

    if data.get("isLast"):
        break

    next_page = data.get("nextPageToken")

print(f"Total de cartões: {len(all_rows)}")

# Criar DataFrame
df = pd.DataFrame(all_rows)

# Filtrar cartões sem previsão de entrega
cards_sem_previsao = df[df["DT. PREVISÃO ENTREGA"].isna() | (df["DT. PREVISÃO ENTREGA"] == "")]

print(f"Cartões sem previsão de entrega: {len(cards_sem_previsao)}")

# Selecionar apenas as colunas desejadas
cards_update = cards_sem_previsao[[
    "ID",
    "Tipo de issue",
    "Chave",
    "Resumo",
    "Status",
    "SITUAÇÃO",
    "Veículo",
    "DT. PREVISÃO ENTREGA"
]]

# Criar diretórios se não existirem
os.makedirs(".\\src\\data_update", exist_ok=True)

# Salvar arquivo
update_filename = ".\\src\\data_update\\update_cards.xlsx"
cards_update.to_excel(update_filename, index=False)

# Adicionar hyperlinks na coluna Chave
wb_update = load_workbook(update_filename)
ws_update = wb_update.active

# Criar lista de links apenas para cards sem previsão
links_sem_previsao = cards_sem_previsao["Chave"].tolist()

# Adicionar hyperlinks (começando da linha 2, pulando o cabeçalho)
for idx, link in enumerate(links_sem_previsao, start=2):
    cell = ws_update[f'C{idx}']  # Coluna C é a coluna "Chave"
    cell.hyperlink = link
    cell.style = "Hyperlink"

# Ajustar largura da coluna SITUAÇÃO (coluna F) para 80px (aproximadamente 11 unidades)
ws_update.column_dimensions['F'].width = 11

wb_update.save(update_filename)

print(f"Arquivo {update_filename} criado com sucesso!")