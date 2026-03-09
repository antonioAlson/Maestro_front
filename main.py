import customtkinter as ctk

# configuração de aparência
ctk.set_appearance_mode("light")
ctk.set_default_color_theme("blue")


class App(ctk.CTk):
    def __init__(self):
        super().__init__()

        # configurações da janela
        self.title("Maestro - Home")
        largura = 900
        altura = 500

        # centralizar janela
        largura_tela = self.winfo_screenwidth()
        altura_tela = self.winfo_screenheight()
        x = int((largura_tela / 2) - (largura / 2))
        y = int((altura_tela / 2) - (altura / 2))
        self.geometry(f"{largura}x{altura}+{x}+{y}")

        # estado do menu
        self.menu_aberto = False
        self.largura_menu = 250
        self.animacao_ativa = False
        self.total_frames_animacao = 18
        self.intervalo_animacao_ms = 12

        # criar container principal
        self.container = ctk.CTkFrame(self, corner_radius=0)
        self.container.pack(fill="both", expand=True)

        # criar barra superior
        self.top_bar = ctk.CTkFrame(self.container, height=60, corner_radius=0)
        self.top_bar.pack(fill="x", side="top")
        self.top_bar.pack_propagate(False)

        # botão hambúrguer
        self.btn_menu = ctk.CTkButton(
            self.top_bar,
            text="☰",
            width=50,
            height=50,
            font=ctk.CTkFont(size=24),
            command=self.toggle_menu,
            corner_radius=8,
            fg_color="transparent",
            hover_color=("gray75", "gray25")
        )
        self.btn_menu.pack(side="left", padx=10, pady=5)

        # título na barra superior
        self.titulo = ctk.CTkLabel(
            self.top_bar,
            text="Maestro - Sistema de Gestão Jira",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        self.titulo.pack(side="left", padx=20)

        # container para menu e conteúdo
        self.main_container = ctk.CTkFrame(self.container, corner_radius=0)
        self.main_container.pack(fill="both", expand=True)

        # menu lateral (inicialmente oculto)
        self.sidebar = ctk.CTkFrame(self.main_container, width=self.largura_menu, corner_radius=0)
        self.sidebar.pack_propagate(False)

        # cabeçalho do menu
        self.menu_header = ctk.CTkFrame(self.sidebar, height=80, corner_radius=0)
        self.menu_header.pack(fill="x", pady=(10, 20), padx=10)
        self.menu_header.pack_propagate(False)

        self.menu_title = ctk.CTkLabel(
            self.menu_header,
            text="MENU",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        self.menu_title.pack(pady=20)

        # itens do menu
        self.criar_item_menu("🏠 Início", self.ir_inicio)
        self.criar_item_menu("📊 Relatórios", self.ir_relatorios)
        self.criar_item_menu("📋 Consultar Cards", self.ir_consultar)
        self.criar_item_menu("🔄 Atualizar Jira", self.ir_atualizar)
        self.criar_item_menu("⚙️ Configurações", self.ir_configuracoes)

        # separador
        ctk.CTkFrame(self.sidebar, height=2).pack(fill="x", padx=20, pady=20)

        self.criar_item_menu("🚪 Sair", self.sair)

        # área de conteúdo principal
        self.content_frame = ctk.CTkFrame(self.main_container, corner_radius=0)
        self.content_frame.pack(fill="both", expand=True)

        # menu inicia fora da tela e desliza sobre o conteúdo ao abrir
        self.sidebar.place(x=-self.largura_menu, y=0, relheight=1)

        # conteúdo de exemplo
        self.welcome_label = ctk.CTkLabel(
            self.content_frame,
            text="Bem-vindo ao Maestro",
            font=ctk.CTkFont(size=32, weight="bold")
        )
        self.welcome_label.pack(pady=(50, 20))

        self.subtitle_label = ctk.CTkLabel(
            self.content_frame,
            text="Use o menu hambúrguer para navegar",
            font=ctk.CTkFont(size=16),
            text_color="gray"
        )
        self.subtitle_label.pack(pady=10)

    def criar_item_menu(self, texto, comando):
        """Cria um item de menu"""
        btn = ctk.CTkButton(
            self.sidebar,
            text=texto,
            command=comando,
            height=45,
            font=ctk.CTkFont(size=14),
            anchor="w",
            fg_color="transparent",
            text_color=("gray10", "gray90"),
            hover_color=("gray75", "gray25"),
            corner_radius=8
        )
        btn.pack(fill="x", padx=10, pady=5)
        return btn

    def toggle_menu(self):
        """Abre ou fecha o menu lateral"""
        if self.animacao_ativa:
            return

        if self.menu_aberto:
            self.fechar_menu()
        else:
            self.abrir_menu()

    def abrir_menu(self):
        """Abre o menu lateral"""
        if self.menu_aberto or self.animacao_ativa:
            return

        self.animacao_ativa = True
        self.sidebar.lift()
        self._animar_menu(inicio=-self.largura_menu, fim=0, frame=0)

    def fechar_menu(self):
        """Fecha o menu lateral"""
        if not self.menu_aberto or self.animacao_ativa:
            return

        self.animacao_ativa = True
        self._animar_menu(inicio=0, fim=-self.largura_menu, frame=0)

    def _animar_menu(self, inicio, fim, frame):
        """Anima o menu em slide com easing para movimento mais fluido."""
        progresso = frame / self.total_frames_animacao
        progresso_suave = 1 - pow(1 - progresso, 3)
        posicao_x = int(inicio + (fim - inicio) * progresso_suave)
        self.sidebar.place_configure(x=posicao_x)

        if frame >= self.total_frames_animacao:
            self.sidebar.place_configure(x=fim)
            self.menu_aberto = fim == 0
            self.animacao_ativa = False
            return

        self.after(
            self.intervalo_animacao_ms,
            lambda: self._animar_menu(inicio, fim, frame + 1)
        )

    def limpar_conteudo(self):
        """Limpa o conteúdo atual"""
        for widget in self.content_frame.winfo_children():
            widget.destroy()

    def ir_inicio(self):
        """Navega para início"""
        self.limpar_conteudo()
        label = ctk.CTkLabel(
            self.content_frame,
            text="Página Inicial",
            font=ctk.CTkFont(size=28, weight="bold")
        )
        label.pack(pady=50)
        self.fechar_menu()

    def ir_relatorios(self):
        """Navega para relatórios"""
        self.limpar_conteudo()
        label = ctk.CTkLabel(
            self.content_frame,
            text="Relatórios",
            font=ctk.CTkFont(size=28, weight="bold")
        )
        label.pack(pady=50)
        self.fechar_menu()

    def ir_consultar(self):
        """Navega para consultar cards"""
        self.limpar_conteudo()
        label = ctk.CTkLabel(
            self.content_frame,
            text="Consultar Cards",
            font=ctk.CTkFont(size=28, weight="bold")
        )
        label.pack(pady=50)
        self.fechar_menu()

    def ir_atualizar(self):
        """Navega para atualizar Jira"""
        self.limpar_conteudo()
        label = ctk.CTkLabel(
            self.content_frame,
            text="Atualizar Jira",
            font=ctk.CTkFont(size=28, weight="bold")
        )
        label.pack(pady=50)
        self.fechar_menu()

    def ir_configuracoes(self):
        """Navega para configurações"""
        self.limpar_conteudo()
        label = ctk.CTkLabel(
            self.content_frame,
            text="Configurações",
            font=ctk.CTkFont(size=28, weight="bold")
        )
        label.pack(pady=50)
        self.fechar_menu()

    def sair(self):
        """Fecha a aplicação"""
        self.quit()


if __name__ == "__main__":
    app = App()
    app.mainloop()