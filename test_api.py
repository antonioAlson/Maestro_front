import requests
from requests.auth import HTTPBasicAuth

JIRA_URL = "https://carboncars.atlassian.net"
EMAIL = ""
API_TOKEN = ""

jql = "project = MANTA"

url = f"{JIRA_URL}/rest/api/3/search/jql"

headers = {
    "Accept": "application/json"
}

next_page = None
all_issues = []

while True:

    params = {
        "jql": jql,
        "maxResults": 100,

        # CAMPOS QUE QUER TRAZER
        "fields": [
            "issuetype",
            "summary",
            "status",
            "customfield_SITUACAO",
            "customfield_VEICULO",
            "customfield_PREVISAO"
        ]
    }

    if next_page:
        params["nextPageToken"] = next_page

    response = requests.get(
        url,
        headers=headers,
        params=params,
        auth=HTTPBasicAuth(EMAIL, API_TOKEN)
    )

    data = response.json()

    issues = data.get("issues", [])
    all_issues.extend(issues)

    print("Cartões coletados:", len(all_issues))

    if data.get("isLast"):
        break

    next_page = data.get("nextPageToken")

print("Total de cartões:", len(all_issues))


# GERAR TXT ORGANIZADO
with open("jira_cards.txt", "w", encoding="utf-8") as f:

    # cabeçalho
    f.write("Tipo de item\tChave\tResumo\tStatus\tSITUAÇÃO\tVeiculo - Marca/Modelo\tDT. PREVISÃO ENTREGA\n")

    for issue in all_issues:

        fields = issue.get("fields", {})

        tipo = fields.get("issuetype", {}).get("name", "")
        chave = issue.get("key", "")
        resumo = fields.get("summary", "")
        status = fields.get("status", {}).get("name", "")

        situacao = fields.get("customfield_SITUACAO", "")
        veiculo = fields.get("customfield_VEICULO", "")
        previsao = fields.get("customfield_PREVISAO", "")

        linha = f"{tipo}\t{chave}\t{resumo}\t{status}\t{situacao}\t{veiculo}\t{previsao}\n"

        f.write(linha)

print("Arquivo jira_cards.txt criado!")