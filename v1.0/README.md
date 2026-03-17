# Maestro - Sistema de Gestão PCP/PROCESSOS

Sistema moderno de gestão para PCP e Projetos com integração ao Jira.

## 📋 Funcionalidades

### PCP
- **Rotinas PCP**
  - Salvar OPs: Download de ordens de produção do Jira
  - Imprimir OPs: Impressão de documentos de OP
  - Reprogramar OPs: Atualização de datas de previsão no Jira
  - Adicionar Datas: Gerenciamento de datas de entrega

- **Relatórios**
  - Gerar Relatório: Relatório completo de cards do Jira

### Projetos
- **Rotinas PCP**
  - Criar Espelhos: Geração de documentos Word com dados do Jira e QR Code
  - Montar OPs: Funcionalidade em desenvolvimento

- **Relatórios**
  - Gerar Relatório: Relatório completo de cards do Jira

## 🚀 Iniciando a Aplicação

### Método 1: Usando o arquivo .bat (Recomendado)
Simplesmente clique duas vezes em `iniciar.bat` na raiz do projeto.

### Método 2: Linha de comando
```powershell
.\.venv\Scripts\python.exe .\scripts\main.py
```

## 🔐 Login

A aplicação possui uma tela de login moderna. Use uma das credenciais de exemplo:

- **Admin**: 
  - Usuário: `admin`
  - Senha: `admin123`

- **User**:
  - Usuário: `user`
  - Senha: `user123`

> **Nota**: As credenciais atuais são apenas exemplos. Em produção, deve-se implementar um sistema de autenticação real.

## 📁 Estrutura de Arquivos

```
Maestro/
├── .venv/                      # Ambiente virtual Python
├── img/                        # Ícones e imagens
│   └── icone.ico              # Ícone da aplicação
├── scripts/                    # Código-fonte
│   ├── main.py                # Aplicação principal
│   ├── login.py               # Tela de login
│   ├── pcp/                   # Módulos PCP
│   │   └── data_update/       # Atualização de datas
│   └── projetos/              # Módulos de projetos
│       ├── mirror_create.py   # Criação de espelhos
│       └── default.docx       # Template Word
├── src/                        # Arquivos temporários
│   └── temp/
│       ├── espelhos/          # Espelhos gerados
│       │   ├── arquivos/      # Documentos Word
│       │   └── logs/          # Logs de processamento
│       └── jira_cards/        # Cards do Jira
│           └── relatorios/    # Relatórios Excel
├── iniciar.bat                # Script de inicialização
└── README.md                  # Este arquivo
```

## 🛠️ Tecnologias

- **Python 3.13**: Linguagem principal
- **CustomTkinter**: Interface gráfica moderna
- **Jira REST API v3**: Integração com Jira
- **docxtpl**: Geração de documentos Word
- **qrcode**: Geração de QR codes
- **pandas & openpyxl**: Manipulação de planilhas
- **python-dotenv**: Gerenciamento de variáveis de ambiente

## ⚙️ Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
JIRA_URL=https://sua-empresa.atlassian.net
EMAIL=seu.email@empresa.com
API_TOKEN=seu_token_api_jira
```

### Campos Customizados do Jira
O sistema utiliza os seguintes custom fields:

- `customfield_11298`: Modelo do Veículo
- `customfield_11331`: Tipo de Teto
- `customfield_11071`: Ano do Veículo
- `customfield_11353`: Número do Projeto
- `customfield_10040`: Número do Pedido (PEDIDO CARBON)
- `customfield_10245`: Data de Previsão de Entrega

## 📝 Funcionalidades Detalhadas

### Criar Espelhos
1. Clique em "Criar Espelhos" na aba Projetos
2. Insira os IDs dos cards do Jira (separados por vírgula, ponto-e-vírgula ou espaço)
3. Aguarde o processamento
4. Os documentos Word serão gerados em `src/temp/espelhos/arquivos/`
5. Cada documento inclui:
   - Dados do card formatados
   - QR code com informações do projeto (35mm)
   - Formato de nome: `{PEDIDO_CARBON} {dd.mm.yyyy hh-mm}.docx`

### Gerar Relatório
1. Clique em "Gerar Relatório" na aba PCP ou Projetos
2. Aguarde o processamento
3. O relatório Excel será gerado em `src/temp/jira_cards/relatorios/`
4. A visualização interativa permite editar datas de previsão
5. Use "Salvar e Atualizar Jira" para sincronizar as alterações

### Reprogramar OPs
1. Clique em "Reprogramar OPs" na aba PCP
2. Insira os IDs dos cards a serem reprogramados
3. Informe a nova data de previsão (DD/MM/AAAA)
4. Confirme a operação
5. As datas serão atualizadas no Jira

## 🐛 Solução de Problemas

### Erro: "No module named..."
Certifique-se de que está usando o Python do ambiente virtual (.venv).

### Erro de execução de scripts do PowerShell
Use o arquivo `iniciar.bat` ou execute diretamente:
```powershell
.\.venv\Scripts\python.exe .\scripts\main.py
```

### Arquivo não encontrado
Verifique se está executando a partir da raiz do projeto (pasta Maestro).

## 📄 Licença

Uso interno da empresa.

## 👤 Autor

Desenvolvido para o sistema de gestão PCP/PROCESSOS.

---

**Versão**: 1.0.0  
**Última atualização**: 2024
