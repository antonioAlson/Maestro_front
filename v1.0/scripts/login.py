import sys
import io

# Configurar saída UTF-8 para Windows
if sys.platform == 'win32':
    try:
        if not isinstance(sys.stdout, io.TextIOWrapper) or sys.stdout.encoding != 'utf-8':
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        if not isinstance(sys.stderr, io.TextIOWrapper) or sys.stderr.encoding != 'utf-8':
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

import customtkinter as ctk
from PIL import Image
import os


class LoginWindow:
    def __init__(self):
        self.root = ctk.CTk()
        self.root.title("Maestro - Login")
        
        # Configurar tema
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        
        # Definir ícone da janela
        self.set_window_icon()
        
        # Centralizar janela com tamanho inicial
        self.center_window()
        
        # Variável para armazenar resultado do login
        self.login_successful = False
        
        # Criar interface
        self.create_login_ui()
    
    def set_window_icon(self):
        """Define o ícone da janela de login"""
        # O ícone está na pasta img/ na raiz do projeto
        icon_ico_path = os.path.join(os.path.dirname(__file__), "..", "img", "icone.ico")
        icon_ico_path = os.path.normpath(icon_ico_path)
        
        if not os.path.exists(icon_ico_path):
            print(f"Ícone não encontrado: {icon_ico_path}")
            return
        
        try:
            # Aplicar ícone .ico no Windows
            self.root.iconbitmap(icon_ico_path)
            # Reaplicar após inicialização para garantir persistência
            self.root.after(100, lambda: self.root.iconbitmap(icon_ico_path))
            print(f"Ícone aplicado na tela de login: {icon_ico_path}")
        except Exception as e:
            print(f"Erro ao definir ícone da janela de login: {e}")
        
    def center_window(self):
        """Centraliza a janela na tela com tamanho inicial"""
        # Definir tamanho mínimo recomendado
        self.root.minsize(400, 500)
        
        # Tamanho inicial sugerido
        width = 450
        height = 550
        
        self.root.update_idletasks()
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        x = (screen_width - width) // 2
        y = (screen_height - height) // 2
        self.root.geometry(f"{width}x{height}+{x}+{y}")
    
    def create_login_ui(self):
        """Cria a interface de login"""
        # Container principal
        main_container = ctk.CTkFrame(self.root, fg_color="transparent")
        main_container.pack(fill="both", expand=True, padx=40, pady=40)
        
        # Logo/Título
        title_label = ctk.CTkLabel(
            main_container,
            text="Maestro",
            font=ctk.CTkFont(size=42, weight="bold"),
            text_color="#1f6aa5"
        )
        title_label.pack(pady=(20, 10))
        
        # Subtítulo
        subtitle_label = ctk.CTkLabel(
            main_container,
            text="Sistema de Gestão",
            font=ctk.CTkFont(size=16),
            text_color="gray70"
        )
        subtitle_label.pack(pady=(0, 40))
        
        # Card de login
        login_card = ctk.CTkFrame(main_container, corner_radius=15)
        login_card.pack(fill="both", expand=True, padx=10)
        
        # Título do card
        card_title = ctk.CTkLabel(
            login_card,
            text="Entrar no sistema",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        card_title.pack(pady=(30, 30))
        
        # Campo de usuário
        user_label = ctk.CTkLabel(
            login_card,
            text="Usuário",
            font=ctk.CTkFont(size=13, weight="bold"),
            anchor="w"
        )
        user_label.pack(fill="x", padx=30, pady=(0, 5))
        
        self.user_entry = ctk.CTkEntry(
            login_card,
            placeholder_text="Digite seu usuário",
            height=45,
            font=ctk.CTkFont(size=14)
        )
        self.user_entry.pack(fill="x", padx=30, pady=(0, 20))
        
        # Campo de senha
        password_label = ctk.CTkLabel(
            login_card,
            text="Senha",
            font=ctk.CTkFont(size=13, weight="bold"),
            anchor="w"
        )
        password_label.pack(fill="x", padx=30, pady=(0, 5))
        
        self.password_entry = ctk.CTkEntry(
            login_card,
            placeholder_text="Digite sua senha",
            show="●",
            height=45,
            font=ctk.CTkFont(size=14)
        )
        self.password_entry.pack(fill="x", padx=30, pady=(0, 10))
        
        # Label de erro (oculto inicialmente)
        self.error_label = ctk.CTkLabel(
            login_card,
            text="",
            font=ctk.CTkFont(size=12),
            text_color="#ff6b6b"
        )
        self.error_label.pack(pady=(10, 0))
        
        # Botão de login
        login_button = ctk.CTkButton(
            login_card,
            text="Entrar",
            command=self.handle_login,
            height=45,
            font=ctk.CTkFont(size=15, weight="bold"),
            fg_color="#1f6aa5",
            hover_color="#2f7dc2"
        )
        login_button.pack(fill="x", padx=30, pady=(20, 30))
        
        # Bind Enter key para fazer login
        self.user_entry.bind("<Return>", lambda e: self.handle_login())
        self.password_entry.bind("<Return>", lambda e: self.handle_login())
        
        # Focar no campo de usuário
        self.user_entry.focus()
    
    def handle_login(self):
        """Processa o login"""
        username = self.user_entry.get().strip()
        password = self.password_entry.get().strip()
        
        # Validar campos vazios
        if not username or not password:
            self.show_error("Por favor, preencha todos os campos")
            return
        
        # Validar credenciais (exemplo simples - substituir por validação real)
        if self.validate_credentials(username, password):
            self.login_successful = True
            self.root.destroy()
        else:
            self.show_error("Usuário ou senha incorretos")
            self.password_entry.delete(0, "end")
            self.password_entry.focus()
    
    def validate_credentials(self, username, password):
        """
        Valida as credenciais do usuário.
        TODO: Implementar validação real (banco de dados, API, etc.)
        """
        # Credenciais de exemplo (SUBSTITUIR POR VALIDAÇÃO REAL)
        valid_users = {
            "admin": "admin123",
            "user": "user123"
        }
        
        return username in valid_users and valid_users[username] == password
    
    def show_error(self, message):
        """Exibe mensagem de erro"""
        self.error_label.configure(text=message)
        
        # Animar campo de senha (shake effect)
        original_x = self.password_entry.winfo_x()
        for i in range(3):
            self.root.after(i * 50, lambda: self.password_entry.pack(fill="x", padx=(35, 25)))
            self.root.after(i * 50 + 25, lambda: self.password_entry.pack(fill="x", padx=(25, 35)))
        self.root.after(150, lambda: self.password_entry.pack(fill="x", padx=30))
    
    def run(self):
        """Inicia a janela de login"""
        self.root.mainloop()
        return self.login_successful


def show_login():
    """Função auxiliar para mostrar a tela de login"""
    login_window = LoginWindow()
    return login_window.run()


if __name__ == "__main__":
    # Teste da tela de login
    if show_login():
        print("Login bem-sucedido!")
    else:
        print("Login cancelado")
