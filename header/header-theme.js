/* ========================================
   FUNCIONALIDADE DO TEMA - Header VeloAcademy
   ======================================== */

// Objeto principal para controle do tema
const HeaderTheme = {
    
    // Inicializar o sistema de tema
    init() {
        console.log('Inicializando sistema de tema do header...');
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
        const savedTheme = localStorage.getItem('theme') || 'light';
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
            localStorage.setItem('theme', newTheme);
            updateIcons(newTheme);
            
            console.log('Tema alterado para:', newTheme);
        });
        
        console.log('Sistema de tema inicializado');
    },

    // Inicializar informações do usuário (para páginas internas)
    initUserInfo() {
        const userName = localStorage.getItem('userName');
        const userPicture = localStorage.getItem('userPicture');
        
        // Atualizar nome do usuário
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = userName || 'Usuário';
        }
        
        // Atualizar avatar do usuário
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
            if (userPicture) {
                userAvatar.src = userPicture;
                userAvatar.style.display = 'block';
            } else {
                userAvatar.style.display = 'none';
                const userInfo = document.getElementById('user-info');
                if (userInfo) {
                    userInfo.classList.add('no-avatar');
                }
            }
        }
    },

    // Inicializar botão de logout (para páginas internas)
    initLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                // Limpar dados do usuário
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                localStorage.removeItem('userPicture');
                
                // Redirecionar para página inicial
                window.location.href = './index.html';
            });
        }
    }
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    HeaderTheme.init();
});

/* ========================================
   INSTRUÇÕES DE USO:
   
   1. Inclua este arquivo antes do </body>
   2. Certifique-se de que os elementos HTML têm os IDs corretos:
      - theme-toggle
      - user-name (opcional)
      - user-avatar (opcional)
      - logout-btn (opcional)
   
   3. O tema será salvo no localStorage automaticamente
   4. Para usar em outros projetos, apenas copie este arquivo
   
   EXEMPLO DE INCLUSÃO:
   <script src="header/header-theme.js"></script>
   
   ======================================== */
