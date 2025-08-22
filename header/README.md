# Header Kit - Kit Completo

Este diretório contém todos os arquivos necessários para implementar um header profissional em qualquer projeto.

## 📁 Arquivos Incluídos

### 🎨 Estilos
- **`header-styles.css`** - CSS completo do header com todas as variáveis e responsividade

### 🔧 Funcionalidade
- **`header-theme.js`** - JavaScript para toggle de tema e funcionalidades do usuário

### 📄 Estrutura
- **`header-structure.html`** - Estruturas HTML prontas (2 versões)

### ⚙️ Configuração
- **`config.json`** - Configurações do logo e tema

## 🚀 Como Implementar

### 1. **Dependências Externas**
Inclua no `<head>` do seu HTML:

```html
<!-- Fonte Poppins -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<!-- Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- Boxicons -->
<link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css">

<!-- Header Styles -->
<link rel="stylesheet" href="header/header-styles.css">
```

### 2. **Estrutura HTML**
Escolha uma das versões em `header-structure.html`:

- **Versão 1:** Header simples (para página inicial)
- **Versão 2:** Header com seção do usuário (para páginas internas)

### 3. **JavaScript**
Inclua antes do `</body>`:

```html
<script src="header/header-theme.js"></script>
```

### 4. **Arquivos de Assets**
- Adicione seu logo na raiz do projeto
- Copie `config.json` se quiser usar as configurações

## 🎨 Personalização

### Cores
Edite as variáveis CSS no início do `header-styles.css`:

```css
:root {
    --cor-accent: #007bff;        /* Cor principal */
    --cor-fundo: #f0f4f8;         /* Fundo claro */
    --cor-container: #ffffff;     /* Fundo do header */
    /* ... */
}
```

### Logo
1. Substitua `seu-logo.png` pelo caminho do seu logo
2. Ajuste as dimensões no `config.json`:

```json
{
    "logo": {
        "width": "200px",
        "height": "55px"
    }
}
```

### Navegação
Edite os links no HTML conforme suas páginas:

```html
<nav class="nav-menu">
    <a href="./index.html" class="nav-link active">Home</a>
    <a href="./sua-pagina.html" class="nav-link">Sua Página</a>
    <!-- ... -->
</nav>
```

## 🌗 Funcionalidades

### Toggle de Tema
- ✅ Tema claro/escuro automático
- ✅ Persistência no localStorage
- ✅ Ícones reativos (sol/lua)

### Responsividade
- ✅ Mobile-first design
- ✅ Breakpoints: 768px e 480px
- ✅ Logo e navegação se adaptam

### Seção do Usuário
- ✅ Avatar do usuário
- ✅ Nome do usuário
- ✅ Botão de logout
- ✅ Dados do localStorage

## 📱 Responsividade

### Desktop (>768px)
- Logo grande (scale: 2.10)
- Navegação completa
- Todos os elementos visíveis

### Tablet (≤768px)
- Logo médio (scale: 1.5)
- Navegação compacta
- Espaçamentos reduzidos

### Mobile (≤480px)
- Logo pequeno (scale: 1.2)
- Navegação mínima
- Interface otimizada

## 🔧 Configurações Avançadas

### Posicionamento do Logo
```css
.logo { 
    left: 20px;           /* Distância da esquerda */
    top: 60%;             /* Posição vertical */
    transform: scale(2.10); /* Tamanho */
}
```

### Tema Toggle
```css
.theme-switch-wrapper {
    right: 10px;          /* Distância da direita */
    width: 40px;          /* Largura do botão */
    height: 40px;         /* Altura do botão */
}
```

## 🎯 Uso em Outros Projetos

1. **Copie a pasta `header`** para seu projeto
2. **Inclua as dependências** (Poppins, Font Awesome, Boxicons)
3. **Adicione o CSS** ao seu HTML
4. **Copie a estrutura HTML** desejada
5. **Inclua o JavaScript** para funcionalidade
6. **Personalize** conforme necessário

## 🚀 Resultado Final

Um header completo e profissional com:
- ✅ Design moderno e responsivo
- ✅ Toggle de tema claro/escuro
- ✅ Navegação intuitiva
- ✅ Logo personalizado
- ✅ Seção do usuário (opcional)
- ✅ Animações suaves
- ✅ Compatibilidade total

---

**Kit de Header Profissional** 🎨
