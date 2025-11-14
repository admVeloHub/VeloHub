// API de integração com o Ponto Mais
// Documentação: https://app2.pontomais.com.br/lo

const PONTO_MAIS_BASE_URL = 'https://api.pontomais.com.br';

// Configurações da empresa (deve ser configurada)
const COMPANY_CONFIG = {
  companyId: process.env.REACT_APP_PONTO_MAIS_COMPANY_ID || '',
  apiKey: process.env.REACT_APP_PONTO_MAIS_API_KEY || '',
  baseUrl: process.env.REACT_APP_PONTO_MAIS_BASE_URL || PONTO_MAIS_BASE_URL
};

// Função para autenticar com o Ponto Mais
async function authenticatePontoMais(credentials) {
  try {
    const response = await fetch(`${COMPANY_CONFIG.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COMPANY_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        company_id: COMPANY_CONFIG.companyId
      })
    });

    if (!response.ok) {
      throw new Error('Falha na autenticação');
    }

    const data = await response.json();
    return {
      success: true,
      token: data.token,
      user: data.user
    };
  } catch (error) {
    console.error('Erro na autenticação com Ponto Mais:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para registrar ponto (entrada/saída)
async function registerPonto(token, tipo = 'in') {
  try {
    const response = await fetch(`${COMPANY_CONFIG.baseUrl}/time_clock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: tipo, // 'in' para entrada, 'out' para saída
        timestamp: new Date().toISOString(),
        location: {
          latitude: null, // Pode ser implementado com geolocalização
          longitude: null,
          accuracy: null
        }
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao registrar ponto');
    }

    const data = await response.json();
    return {
      success: true,
      record: data,
      message: tipo === 'in' ? 'Entrada registrada com sucesso!' : 'Saída registrada com sucesso!'
    };
  } catch (error) {
    console.error('Erro ao registrar ponto:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para buscar status atual do usuário
async function getCurrentStatus(token) {
  try {
    const response = await fetch(`${COMPANY_CONFIG.baseUrl}/time_clock/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao buscar status');
    }

    const data = await response.json();
    return {
      success: true,
      status: data.status,
      lastRecord: data.last_record,
      todayHours: data.today_hours
    };
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para buscar histórico de pontos do dia
async function getTodayRecords(token) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${COMPANY_CONFIG.baseUrl}/time_clock/records?date=${today}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao buscar registros');
    }

    const data = await response.json();
    return {
      success: true,
      records: data.records || [],
      totalHours: data.total_hours || 0
    };
  } catch (error) {
    console.error('Erro ao buscar registros:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// API principal do Ponto Mais
export const pontoMaisAPI = {
  // Autenticar usuário
  authenticate: authenticatePontoMais,
  
  // Registrar entrada
  registerEntry: (token) => registerPonto(token, 'in'),
  
  // Registrar saída
  registerExit: (token) => registerPonto(token, 'out'),
  
  // Buscar status atual
  getCurrentStatus,
  
  // Buscar registros do dia
  getTodayRecords,
  
  // Verificar se está configurado
  isConfigured: () => {
    return !!(COMPANY_CONFIG.companyId && COMPANY_CONFIG.apiKey);
  },
  
  // Configurações da empresa
  getConfig: () => ({
    companyId: COMPANY_CONFIG.companyId,
    baseUrl: COMPANY_CONFIG.baseUrl,
    isConfigured: COMPANY_CONFIG.companyId && COMPANY_CONFIG.apiKey
  })
};

export default pontoMaisAPI;
