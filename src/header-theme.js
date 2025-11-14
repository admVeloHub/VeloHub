/* ========================================
   FUNCIONALIDADE DO TEMA - Header VeloHub
   ======================================== */

// Objeto principal para controle do tema
const VeloHubHeader = {
    
    // Inicializar o sistema de tema
    init() {
        console.log('Inicializando sistema de tema do header VeloHub...');
        this.initTheme();
        this.initUserInfo();
        this.initLogout();
    },

    // Configurar o toggle de tema claro/escuro
    initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        
        if (!themeToggle) {
            console.warn('Elemento theme-toggle não encontrado');
            return;
        }

        console.log('Theme toggle encontrado:', themeToggle);
        
        const sunIcon = themeToggle.querySelector('.bx-sun');
        const moonIcon = themeToggle.querySelector('.bx-moon');
        
        if (!sunIcon || !moonIcon) {
            console.warn('Ícones de tema não encontrados');
            return;
        }

        console.log('Ícones encontrados - Sol:', sunIcon, 'Lua:', moonIcon);
        
        const docElement = document.documentElement;
        
        // Carregar tema salvo ou usar padrão
        const savedTheme = localStorage.getItem('velohub-theme') || 'light';
        docElement.setAttribute('data-theme', savedTheme);
        
        // Função para atualizar os ícones
        const updateIcons = (theme) => {
            if (theme === 'light') {
                // Tema claro: mostrar lua (opção para mudar para escuro)
                sunIcon.classList.remove('active');
                moonIcon.classList.add('active');
            } else {
                // Tema escuro: mostrar sol (opção para mudar para claro)
                sunIcon.classList.add('active');
                moonIcon.classList.remove('active');
            }
        };
        
        // Inicializar ícones
        updateIcons(savedTheme);
        
        // Evento de clique para alternar tema
        themeToggle.addEventListener('click', () => {
            const currentTheme = docElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            docElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('velohub-theme', newTheme);
            updateIcons(newTheme);
            
            console.log('Tema alterado para:', newTheme);
        });
        
        console.log('Sistema de tema inicializado');
    },

    // Inicializar informações do usuário
    initUserInfo() {
        // Verificar se há dados no localStorage (compatibilidade)
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');
        const userPicture = localStorage.getItem('userPicture');
        
        // Verificar se há sessão válida
        const sessionData = localStorage.getItem('velohub_user_session');
        let finalUserName = 'Usuário VeloHub';
        let finalUserPicture = null;
        
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                if (session.user) {
                    finalUserName = session.user.name || userName || 'Usuário VeloHub';
                    finalUserPicture = session.user.picture || userPicture;
                }
            } catch (error) {
                console.warn('Erro ao decodificar sessão:', error);
            }
        } else if (userName) {
            finalUserName = userName;
            finalUserPicture = userPicture;
        }
        
        // Atualizar nome do usuário
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = finalUserName;
        }
        
        // Atualizar avatar do usuário
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
            if (finalUserPicture) {
                userAvatar.src = finalUserPicture;
                userAvatar.style.display = 'block';
            } else {
                // Avatar padrão do VeloHub
                userAvatar.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMDdiZmYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNOCA0QzkuNjYgNCAxMSA1LjM0IDExIDdDMTEgOC42NiA5LjY2IDEwIDggMTBDNi4zNCAxMCA1IDguNjYgNSAxN0M1IDUuMzQgNi4zNCA0IDggNFpNOCAxMkM5LjY2IDEyIDExIDEyLjM0IDExIDE0QzExIDE1LjY2IDkuNjYgMTcgOCAxN0M2LjM0IDE3IDUgMTUuNjYgNSAxNEM1IDEyLjM0IDYuMzQgMTIgOCAxMloiLz4KPC9zdmc+Cjwvc3ZnPgo=';
                userAvatar.style.display = 'block';
            }
        }
    },

    // Inicializar funcionalidade de logout
    initLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja sair?')) {
                    // Limpar dados do localStorage (compatibilidade)
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userPicture');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('velohub_user_session');
                    localStorage.removeItem('velohub-theme');
                    
                    // Redirecionar para página de login ou home
                    window.location.href = '/';
                }
            });
        }
    },

    // Função removida - redirecionamento agora é controlado pelo React

    // Função para atualizar página ativa
    updateActivePage(pageName) {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.textContent.trim() === pageName) {
                link.classList.add('active');
            }
        });
    },

    // Função para mostrar/ocultar seção do usuário
    toggleUserSection(show = true) {
        const userSection = document.querySelector('.user-section');
        if (userSection) {
            userSection.style.display = show ? 'block' : 'none';
        }
    }
};

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        VeloHubHeader.init();
    });
} else {
    VeloHubHeader.init();
}

// Exportar para uso em React
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VeloHubHeader;
}
