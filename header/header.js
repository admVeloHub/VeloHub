// =============================================
// == HEADER MODULAR VELOACADEMY - JAVASCRIPT ==
// =============================================

class VeloAcademyHeader {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        this.init();
    }

    init() {
        this.setupThemeToggle();
        this.setupNavigation();
        this.applyCurrentTheme();
        this.setupActivePage();
    }

    // Configuração do toggle de tema
    setupThemeToggle() {
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    // Alternar entre tema claro e escuro
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    // Aplicar tema
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Atualizar ícones do toggle
        const sunIcon = this.themeToggle.querySelector('.bx-sun');
        const moonIcon = this.themeToggle.querySelector('.bx-moon');
        
        if (theme === 'dark') {
            sunIcon.classList.remove('active');
            moonIcon.classList.add('active');
        } else {
            sunIcon.classList.add('active');
            moonIcon.classList.remove('active');
        }
    }

    // Aplicar tema atual
    applyCurrentTheme() {
        this.applyTheme(this.currentTheme);
    }

    // Configurar navegação
    setupNavigation() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remover classe active de todos os links
                this.navLinks.forEach(l => l.classList.remove('active'));
                // Adicionar classe active ao link clicado
                link.classList.add('active');
            });
        });
    }

    // Configurar página ativa baseada na URL atual
    setupActivePage() {
        const currentPath = window.location.pathname;
        
        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            // Verificar se o link corresponde à página atual
            if (href === currentPath || 
                (currentPath === '/' && href === './index.html') ||
                (currentPath.includes(href.replace('./', '')) && href !== './index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Método para atualizar logo
    updateLogo(logoPath) {
        const logoImage = document.getElementById('logo-image');
        if (logoImage) {
            logoImage.src = logoPath;
        }
    }

    // Método para atualizar links de navegação
    updateNavigation(links) {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && links) {
            navMenu.innerHTML = '';
            links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.href;
                a.className = 'nav-link';
                a.textContent = link.text;
                if (link.target) {
                    a.target = link.target;
                }
                navMenu.appendChild(a);
            });
            this.setupNavigation();
            this.setupActivePage();
        }
    }
}

// Inicializar o header quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new VeloAcademyHeader();
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VeloAcademyHeader;
}
