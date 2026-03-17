# Implementação de Autenticação Real

Este documento fornece orientações sobre como substituir o sistema de autenticação de exemplo por uma solução de produção.

## Estado Atual

Atualmente, a tela de login ([login.py](scripts/login.py)) utiliza credenciais fixas em código:

```python
def validate_credentials(self, username, password):
    """Valida as credenciais do usuário"""
    # Lista de usuários válidos (exemplo - substituir por autenticação real)
    valid_users = {
        "admin": "admin123",
        "user": "user123"
    }
    
    return valid_users.get(username) == password
```

⚠️ **AVISO**: Este método é adequado APENAS para testes e desenvolvimento. Para produção, implemente uma das soluções abaixo.

## Opções de Implementação

### Opção 1: Autenticação com Banco de Dados

#### Bibliotecas Necessárias
```bash
pip install bcrypt sqlalchemy
```

#### Implementação
```python
import bcrypt
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default='user')

# Conexão com banco (SQLite para exemplo)
engine = create_engine('sqlite:///maestro_users.db')
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

def validate_credentials(self, username, password):
    """Valida credenciais contra banco de dados"""
    session = Session()
    try:
        user = session.query(User).filter_by(username=username).first()
        if user and bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return True
        return False
    finally:
        session.close()

def create_user(username, password, role='user'):
    """Cria novo usuário com senha hash"""
    session = Session()
    try:
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        new_user = User(username=username, password_hash=password_hash, role=role)
        session.add(new_user)
        session.commit()
        return True
    except Exception as e:
        session.rollback()
        print(f"Erro ao criar usuário: {e}")
        return False
    finally:
        session.close()
```

### Opção 2: Autenticação LDAP/Active Directory

#### Bibliotecas Necessárias
```bash
pip install ldap3
```

#### Implementação
```python
from ldap3 import Server, Connection, ALL, SIMPLE

def validate_credentials(self, username, password):
    """Valida credenciais contra Active Directory"""
    try:
        # Configurar servidor LDAP
        server = Server('ldap://seu-servidor-ad.empresa.com', get_info=ALL)
        
        # Formato do usuário pode variar: username@domain.com ou DOMAIN\\username
        user_dn = f'{username}@empresa.com'
        
        # Tentar conexão
        conn = Connection(server, user=user_dn, password=password, authentication=SIMPLE)
        
        if conn.bind():
            conn.unbind()
            return True
        return False
        
    except Exception as e:
        print(f"Erro na autenticação LDAP: {e}")
        return False
```

### Opção 3: Autenticação via API Externa

#### Implementação
```python
import requests
from requests.auth import HTTPBasicAuth

def validate_credentials(self, username, password):
    """Valida credenciais via API de autenticação"""
    try:
        # Endpoint de autenticação da sua API
        auth_url = "https://api.empresa.com/auth/login"
        
        response = requests.post(
            auth_url,
            json={"username": username, "password": password},
            timeout=5
        )
        
        if response.status_code == 200:
            # Opcional: armazenar token para uso posterior
            token = response.json().get('token')
            # Salvar token em variável de sessão ou arquivo
            return True
        return False
        
    except Exception as e:
        print(f"Erro na autenticação via API: {e}")
        return False
```

### Opção 4: Autenticação com Arquivo de Credenciais Criptografado

#### Bibliotecas Necessárias
```bash
pip install cryptography
```

#### Implementação
```python
from cryptography.fernet import Fernet
import json
import os

class SecureCredentials:
    def __init__(self):
        # Carregar ou gerar chave de criptografia
        key_file = 'credentials.key'
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                self.key = f.read()
        else:
            self.key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(self.key)
        
        self.cipher = Fernet(self.key)
        self.creds_file = 'credentials.enc'
    
    def save_user(self, username, password):
        """Salva credenciais criptografadas"""
        # Carregar usuários existentes
        users = self.load_users()
        
        # Adicionar novo usuário
        users[username] = password
        
        # Criptografar e salvar
        encrypted = self.cipher.encrypt(json.dumps(users).encode())
        with open(self.creds_file, 'wb') as f:
            f.write(encrypted)
    
    def load_users(self):
        """Carrega usuários do arquivo criptografado"""
        if not os.path.exists(self.creds_file):
            return {}
        
        with open(self.creds_file, 'rb') as f:
            encrypted = f.read()
        
        decrypted = self.cipher.decrypt(encrypted)
        return json.loads(decrypted.decode())
    
    def validate(self, username, password):
        """Valida credenciais"""
        users = self.load_users()
        return users.get(username) == password

# Uso
def validate_credentials(self, username, password):
    """Valida credenciais usando arquivo criptografado"""
    creds = SecureCredentials()
    return creds.validate(username, password)
```

## Implementação de Sessão de Usuário

Após autenticação bem-sucedida, você pode querer armazenar informações do usuário:

```python
class LoginWindow:
    def __init__(self):
        # ... código existente ...
        self.logged_user = None  # Armazenar usuário logado
        self.user_role = None    # Armazenar papel/permissões
    
    def handle_login(self):
        username = self.user_entry.get().strip()
        password = self.password_entry.get().strip()
        
        if not username or not password:
            self.show_error("Preencha usuário e senha")
            return
        
        # Validar e obter informações do usuário
        user_info = self.validate_and_get_user_info(username, password)
        
        if user_info:
            self.logged_user = user_info['username']
            self.user_role = user_info['role']
            self.login_successful = True
            self.root.quit()
        else:
            self.show_error("Usuário ou senha inválidos")
    
    def validate_and_get_user_info(self, username, password):
        """Valida e retorna informações do usuário"""
        # Implementar validação e retornar dict com info do usuário
        # Exemplo:
        if self.validate_credentials(username, password):
            return {
                'username': username,
                'role': 'admin',  # Obter do banco/LDAP/API
                'email': f'{username}@empresa.com',
                'full_name': 'Nome Completo'
            }
        return None

def show_login():
    """Mostra janela de login e retorna informações do usuário"""
    login_window = LoginWindow()
    login_window.root.mainloop()
    
    if login_window.login_successful:
        return {
            'success': True,
            'user': login_window.logged_user,
            'role': login_window.user_role
        }
    return {'success': False}
```

## Controle de Acesso por Função

Você pode adicionar controle de acesso baseado em função na aplicação principal:

```python
# Em main.py
def main():
    # Mostrar tela de login
    login_result = show_login()
    
    if not login_result['success']:
        return  # Login cancelado ou falhou
    
    # Se login bem-sucedido, iniciar aplicação principal com info do usuário
    root = ctk.CTk()
    app = SidebarApp(root, user_info=login_result)
    root.mainloop()

class SidebarApp:
    def __init__(self, root, user_info=None):
        self.root = root
        self.user_info = user_info or {}
        self.user_role = self.user_info.get('role', 'user')
        
        # ... resto do código ...
    
    def pcp_action(self):
        """Mostra conteúdo PCP - restrito a certos usuários"""
        # Verificar permissão
        if self.user_role not in ['admin', 'pcp_manager']:
            self.show_error("Acesso negado: você não tem permissão para acessar PCP")
            return
        
        # Continuar com ação normal
        # ... código existente ...
```

## Segurança Adicional

### 1. Limite de Tentativas
```python
class LoginWindow:
    def __init__(self):
        # ... código existente ...
        self.login_attempts = 0
        self.max_attempts = 3
    
    def handle_login(self):
        # Verificar tentativas
        if self.login_attempts >= self.max_attempts:
            self.show_error("Muitas tentativas. Tente novamente mais tarde.")
            self.root.after(3000, lambda: self.root.quit())
            return
        
        # ... validação normal ...
        
        if not user_info:
            self.login_attempts += 1
            remaining = self.max_attempts - self.login_attempts
            self.show_error(f"Credenciais inválidas. {remaining} tentativa(s) restante(s)")
```

### 2. Log de Autenticação
```python
import logging
from datetime import datetime

logging.basicConfig(
    filename='auth_log.txt',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def handle_login(self):
    username = self.user_entry.get().strip()
    # ... validação ...
    
    if success:
        logging.info(f"Login bem-sucedido: {username}")
    else:
        logging.warning(f"Tentativa de login falhou: {username}")
```

### 3. Timeout de Sessão
```python
class SidebarApp:
    def __init__(self, root, user_info=None):
        # ... código existente ...
        self.session_timeout = 3600  # 1 hora em segundos
        self.last_activity = datetime.now()
        
        # Verificar timeout periodicamente
        self.check_session_timeout()
    
    def check_session_timeout(self):
        """Verifica se a sessão expirou"""
        elapsed = (datetime.now() - self.last_activity).total_seconds()
        
        if elapsed > self.session_timeout:
            self.show_session_expired_dialog()
            return
        
        # Verificar novamente em 60 segundos
        self.root.after(60000, self.check_session_timeout)
    
    def reset_activity_timer(self):
        """Reseta o timer de atividade"""
        self.last_activity = datetime.now()
```

## Próximos Passos

1. **Escolha uma opção de autenticação** baseada nas necessidades da empresa
2. **Instale as dependências** necessárias
3. **Modifique o método `validate_credentials`** em [login.py](scripts/login.py)
4. **Teste extensivamente** antes de implantar em produção
5. **Documente** o sistema escolhido e credenciais de administrador
6. **Configure backup** do banco de dados de usuários (se aplicável)

## Suporte

Para dúvidas sobre implementação, consulte:
- Documentação do SQLAlchemy: https://www.sqlalchemy.org/
- Documentação do ldap3: https://ldap3.readthedocs.io/
- Documentação do bcrypt: https://pypi.org/project/bcrypt/
- Documentação do cryptography: https://cryptography.io/

---

**Importante**: Nunca commite credenciais ou chaves de criptografia para repositórios Git. Use variáveis de ambiente ou arquivos de configuração excluídos no .gitignore.
