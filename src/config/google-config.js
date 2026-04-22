// Configurações do Google OAuth 2.0 para VeloHub
// VERSION: v1.3.2 | DATE: 2026-04-22 | AUTHOR: Lucas Gravina - VeloHub Development Team
// v1.3.2: Em produção sem REACT_APP no build, LoginPage obtém clientId via GET /api/auth/oauth-client-id (GOOGLE_CLIENT_ID no container)
// v1.3.1: CLIENT_ID via REACT_APP_GOOGLE_CLIENT_ID (build); sem fallback literal nem logs de debug
// 
// INSTRUÇÕES:
// 1. Acesse https://console.cloud.google.com/
// 2. Crie um novo projeto ou selecione existente
// 3. Ative a API "Google Identity Services"
// 4. Vá para "APIs & Services" > "Credentials"
// 5. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
// 6. Configure:
//    - Application type: Web application
//    - Name: VeloHub
//    - Authorized JavaScript origins: 
//      - http://localhost:3000 (desenvolvimento)
//      - https://seudominio.com (produção)
//    - Authorized redirect URIs:
//      - http://localhost:3000 (desenvolvimento)
//      - https://seudominio.com (produção)
// 7. Copie o Client ID gerado e substitua abaixo

export const GOOGLE_CONFIG = {
  // Client ID: injetado no build (ex.: Cloud Build a partir do Secret Manager)
  CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  
  // Domínio de email autorizado
  AUTHORIZED_DOMAIN: process.env.REACT_APP_AUTHORIZED_DOMAIN || "velotax.com.br",
  
  // Duração da sessão em milissegundos (4 horas)
  SESSION_DURATION: 4 * 60 * 60 * 1000,
  
  // Chave para localStorage
  SESSION_KEY: 'velohub_user_session'
};

// Função para verificar se o domínio do email é autorizado
export function isAuthorizedDomain(email) {
  if (!email) return false;
  return email.endsWith(GOOGLE_CONFIG.AUTHORIZED_DOMAIN);
}

// Função para obter o Client ID
export function getClientId() {
  return GOOGLE_CONFIG.CLIENT_ID;
}
