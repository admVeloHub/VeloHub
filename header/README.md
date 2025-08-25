# Header Modular VeloAcademy

Este é um header modular e reutilizável baseado no design do VeloAcademy, que pode ser facilmente integrado em outros projetos.

## 📁 Arquivos Incluídos

- `header.html` - Estrutura HTML do header
- `header.css` - Estilos CSS completos com tema claro/escuro
- `header.js` - Funcionalidades JavaScript (toggle de tema, navegação)
- `exemplo-uso.html` - Exemplo completo de implementação
- `README.md` - Este arquivo com instruções

## 🚀 Como Usar

### 1. Estrutura Básica

Copie os arquivos para seu projeto e inclua no seu HTML:

```html
<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seu Projeto</title>
    
    <!-- CSS do Header -->
    <link rel="stylesheet" href="./header/header.css">
    
    <!-- Fontes e Ícones -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Header -->
    <header>
        <div class="container header-container">
            <div class="logo" id="logo-container">
                <img id="logo-image" class="logo-image" src="./seu-logo.png" alt="Logo">
            </div>
            
            <nav class="nav-menu">
                <a href="./index.html" class="nav-link active">Home</a>
                <a href="./sobre.html" class="nav-link">Sobre</a>
                <a href="./contato.html" class="nav-link">Contato</a>
            </nav>

            <div class="theme-switch-wrapper" id="theme-toggle">
                <i class='bx bx-sun theme-icon'></i>
                <i class='bx bx-moon theme-icon'></i>
            </div>
        </div>
    </header>

    <!-- Seu conteúdo aqui -->
    <main>
        <!-- ... -->
    </main>

    <!-- JavaScript do Header -->
    <script src="./header/header.js"></script>
</body>
</html>
```

### 2. Personalização

#### Alterar Logo
```javascript
// No seu JavaScript
const header = new VeloAcademyHeader();
header.updateLogo('./caminho/para/seu-logo.png');
```

#### Alterar Navegação
```javascript
// Atualizar links de navegação
header.updateNavigation([
    { href: './home.html', text: 'Início' },
    { href: './produtos.html', text: 'Produtos' },
    { href: './servicos.html', text: 'Serviços' },
    { href: './contato.html', text: 'Contato' }
]);
```

#### Alterar Cores
Edite as variáveis CSS no arquivo `header.css`:

```css
:root {
    --cor-accent: #007bff; /* Cor principal */
    --cor-fundo: #f0f4f8; /* Cor de fundo */
    --cor-container: #ffffff; /* Cor do container */
    /* ... outras cores */
}
```

## 🎨 Recursos Incluídos

### ✅ Tema Claro/Escuro
- Toggle automático entre temas
- Persistência no localStorage
- Transições suaves

### ✅ Navegação Responsiva
- Menu adaptativo para mobile
- Indicador de página ativa
- Links personalizáveis

### ✅ Logo Interativo
- Efeitos hover
- Sombra suave
- Redimensionamento responsivo

### ✅ Design Moderno
- Sombras e bordas suaves
- Animações CSS
- Tipografia Poppins

### ✅ Totalmente Responsivo
- Breakpoints: 768px, 480px
- Layout adaptativo
- Touch-friendly

## 📱 Breakpoints Responsivos

- **Desktop**: > 768px
- **Tablet**: 768px - 481px
- **Mobile**: ≤ 480px

## 🎯 Funcionalidades JavaScript

### Classe VeloAcademyHeader

```javascript
const header = new VeloAcademyHeader();

// Métodos disponíveis:
header.updateLogo(path)           // Atualizar logo
header.updateNavigation(links)    // Atualizar navegação
header.toggleTheme()              // Alternar tema
header.applyTheme(theme)          // Aplicar tema específico
```

## 🔧 Customização Avançada

### Alterar Altura do Header
```css
header {
    max-height: 90px; /* Ajuste conforme necessário */
}
```

### Alterar Posição do Logo
```css
.logo {
    left: 60px; /* Distância da esquerda */
    top: 60%;   /* Posição vertical */
}
```

### Alterar Tamanho do Logo
```css
.logo-image {
    width: 200px;  /* Largura */
    height: 55px;  /* Altura */
}
```

## 📋 Dependências

- **Font Awesome 6.4.0** - Ícones gerais
- **Boxicons 2.1.4** - Ícones de tema
- **Google Fonts (Poppins)** - Tipografia

## 🐛 Solução de Problemas

### Logo não aparece
- Verifique se o caminho do arquivo está correto
- Certifique-se de que o arquivo existe
- Verifique as permissões do arquivo

### Tema não alterna
- Verifique se o JavaScript está carregado
- Verifique o console do navegador para erros
- Certifique-se de que os ícones Boxicons estão carregados

### Layout quebrado em mobile
- Verifique se o viewport meta tag está presente
- Teste em diferentes dispositivos
- Verifique se o CSS está sendo carregado corretamente

## 📄 Licença

Este header é baseado no design do VeloAcademy e pode ser usado livremente em projetos pessoais e comerciais.

## 🤝 Contribuição

Para melhorias ou correções, sinta-se à vontade para contribuir!

---

**Desenvolvido com ❤️ para o VeloAcademy**
