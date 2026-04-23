# Configuração de Impressão Automática

Este guia mostra como configurar seu navegador para tornar a impressão em massa mais automática, minimizando a interação manual com os diálogos de impressão.

## 🎯 Objetivo

Configurar o navegador para:
- ✅ Imprimir em **Preto e Branco** automaticamente
- ✅ Usar **Frente e Verso (Duplex)** por padrão
- ✅ Lembrar as configurações de impressão
- ✅ Minimizar janelas de confirmação

---

## 🌐 Google Chrome / Microsoft Edge

### Método 1: Configurações do Navegador (Recomendado)

1. **Abrir Configurações de Impressão:**
   - Chrome: `chrome://settings/printing`
   - Edge: `edge://settings/printing`

2. **Configurar as opções:**
   - ✅ **Destino:** Selecione sua impressora padrão
   - ✅ **Cor:** Altere para "Preto e branco"
   - ✅ **Layout:** Marque "Frente e verso"
   - ✅ **Páginas:** Todas

### Método 2: Configurar Impressora Padrão (Windows)

1. **Abrir Impressoras:**
   - Pressione `Win + R`
   - Digite: `control printers`
   - Pressione Enter

2. **Configurar Impressora Padrão:**
   - Clique com botão direito na sua impressora → **Propriedades de impressão**
   - **Aba "Acabamento":** Marque "Impressão em frente e verso"
   - **Aba "Cor":** Selecione "Preto e branco" ou "Escala de cinza"
   - Clique em **OK** e depois em **Definir como padrão**

### Método 3: Política do Navegador (Avançado - Para TI)

Administradores podem configurar políticas empresariais:

**Chrome/Edge - Criar arquivo de política:**

Arquivo: `C:\Users\{usuario}\AppData\Local\Google\Chrome\User Data\Default\Preferences`

```json
{
  "printing": {
    "print_preview_sticky_settings": {
      "version": 2,
      "isColorEnabled": false,
      "isDuplexEnabled": true,
      "isDuplexShortEdge": false
    }
  }
}
```

---

## 🦊 Mozilla Firefox

1. **Abrir about:config:**
   - Digite `about:config` na barra de endereços
   - Aceite o aviso

2. **Configurar preferências:**
   - Procure por: `print.printer_{sua_impressora}`
   - Configure:
     ```
     print.printer_{nome}.print_in_color = false
     print.printer_{nome}.print_duplex = 1
     ```

3. **Alternativa - Usar preferências de impressora:**
   - Arquivo → Imprimir
   - Configure as opções desejadas
   - ✅ Marque "Lembrar minhas escolhas"
   - Firefox lembrará das configurações

---

## 🎨 Configuração Adicional - CSS de Impressão

O sistema já aplica automaticamente regras CSS para forçar impressão em escala de cinza:

```css
@media print {
  @page {
    -webkit-print-color-adjust: economy;
    print-color-adjust: economy;
  }
  body, * {
    -webkit-filter: grayscale(100%);
    filter: grayscale(100%);
  }
}
```

---

## ✅ Verificar Configurações

Depois de configurar, teste:

1. Vá em **Ordens de Produção** → **Imprimir OPs**
2. Digite alguns IDs e clique em **Buscar Arquivos**
3. Clique em **Imprimir**
4. Verifique se as configurações aparecem corretas:
   - ✅ Preto e branco selecionado
   - ✅ Frente e verso habilitado

---

## ⚠️ Limitações Importantes

### Por que ainda aparece a janela de impressão?

Por **questões de segurança**, navegadores modernos **não permitem** impressão completamente silenciosa (sem diálogo) através de JavaScript/HTML.

**Motivo:** Proteger usuários contra sites maliciosos que poderiam:
- Imprimir documentos sem autorização
- Desperdiçar papel/tinta
- Acessar informações da impressora

### O que foi implementado?

✅ **Configuração automática via CSS** - Sugere preto e branco e duplex
✅ **Pré-configuração** - Aplica filtros de escala de cinza
✅ **Lembrar configurações** - Browser pode guardar suas escolhas
✅ **Interface otimizada** - Processo mais rápido e menos cliques

### Alternativas para impressão 100% silenciosa:

Para casos que realmente precisam de impressão completamente automática:

1. **Electron App** - Aplicativo desktop com privilegios ampliados
2. **Extensão de Navegador** - Com permissões especiais
3. **Print Server** - Servidor dedicado que receba comandos de impressão
4. **AutoHotkey/Macros** - Scripts de automação (Windows)

---

## 📞 Suporte

Se as configurações não estiverem funcionando:

1. ✅ Verifique se a impressora padrão está configurada
2. ✅ Reinicie o navegador após mudanças
3. ✅ Teste com um PDF simples antes de impressão em massa
4. ✅ Verifique drivers atualizados da impressora

---

## 🔄 Resumo Rápido

| Navegador | Preto e Branco | Duplex | Lembrar Config |
|-----------|----------------|--------|----------------|
| Chrome    | ✅ Configurações | ✅ Configurações | ✅ Marcar checkbox |
| Edge      | ✅ Configurações | ✅ Configurações | ✅ Marcar checkbox |
| Firefox   | ✅ about:config | ✅ about:config | ✅ Marcar checkbox |

**Recomendação:** Configure uma vez nas preferências do navegador e marque "Lembrar" no primeiro uso!
