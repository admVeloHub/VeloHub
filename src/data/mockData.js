// Dados mock baseados no CSV "CENTRAL INTERNA - INPUT - Artigos.csv"
export const mockData = {
  velonews: [
    {
      _id: "mock_velonews_001",
      title: "Nova Ferramenta de Preenchimento Disponível",
      content: "Inserir os textos ficou mais fácil. Agora temos formatação automática por inteligência artificial. Falta adicionar opções de negrito.",
      is_critical: "N",
      createdAt: "2025-01-15T10:00:00.000Z",
      updatedAt: "2025-01-15T10:00:00.000Z"
    },
    {
      _id: "mock_velonews_002",
      title: "Sistema de Formatação Atualizado",
      content: "Novo sistema de inserção de conteúdos. Sucesso na fonte de digitação e negrito no editor ativado, com atalho de teclado válido. Itálico disponível.",
      is_critical: "Y",
      createdAt: "2025-01-14T15:30:00.000Z",
      updatedAt: "2025-01-14T15:30:00.000Z"
    },
    {
      _id: "mock_velonews_003",
      title: "Melhorias na Plataforma Velotax",
      content: "Implementamos novas funcionalidades para melhorar sua experiência. Agora você pode formatar textos com mais facilidade e rapidez.",
      is_critical: "N",
      createdAt: "2025-01-13T09:15:00.000Z",
      updatedAt: "2025-01-13T09:15:00.000Z"
    }
  ],
  
  articles: [
    {
      _id: "mock_articles_001",
      title: "Pedidos de Antecipação Temporariamente Suspensos",
      content: "Informamos que, no momento, as antecipações e os pedidos de antecipação em andamento estão temporariamente suspensos. Esta pausa é necessária para podermos realizar adequações técnicas e preparar o aplicativo para futuras melhorias.",
      category: "Antecipação",
      category_id: "01_antecipação",
      keywords: ["antecipação", "contratar", "suspensão"],
      createdAt: "2025-01-15T08:00:00.000Z",
      updatedAt: "2025-01-15T08:00:00.000Z"
    },
    {
      _id: "mock_articles_002",
      title: "Restituição em lote anterior ao contrato",
      content: "A antecipação da sua restituição de imposto de renda é contratada por um valor fixo, que já inclui os juros e taxas acordados no momento do serviço. Isso ocorre porque, no momento da contratação, é impossível prever a data exata em que sua restituição estará disponível.",
      category: "Antecipação",
      category_id: "01_antecipação",
      keywords: ["restituição", "pagamento", "data"],
      createdAt: "2025-01-14T12:00:00.000Z",
      updatedAt: "2025-01-14T12:00:00.000Z"
    },
    {
      _id: "mock_articles_003",
      title: "Antecipação negada ao usuário: Oferta indisponível",
      content: "As telas a seguir são apresentadas ao usuário que tenta a antecipação do IRPF, mas não terá o crédito disponibilizado pelos critérios do app. Quando a mensagem exibida é 'ocorreu um erro, infelizmente não será possível seguir com a sua operação', o cliente não tem oferta de antecipação disponível.",
      category: "Antecipação",
      category_id: "01_antecipação",
      keywords: ["pagamento", "antecipação", "portabilidade", "negado", "falha"],
      createdAt: "2025-01-13T16:45:00.000Z",
      updatedAt: "2025-01-13T16:45:00.000Z"
    },
    {
      _id: "mock_articles_004",
      title: "Posso usar qualquer chave pix para antecipação?",
      content: "Não. Apenas a chave PIX que utiliza seu CPF poderá ser utilizada na conta Velobank para o processo de antecipação, ou cobrança retida da taxa de uso do app. Essa limitação ocorre por razão de segurança e garantia de que nenhum terceiro efetue operações de crédito em seu nome.",
      category: "Antecipação",
      category_id: "01_antecipação",
      keywords: ["restituição", "pagamento", "data", "pix", "antecipação"],
      createdAt: "2025-01-12T11:20:00.000Z",
      updatedAt: "2025-01-12T11:20:00.000Z"
    },
    {
      _id: "mock_articles_005",
      title: "Restituição não Creditada",
      content: "Se você está cadastrado para receber no primeiro lote da restituição do Imposto de Renda de 30/05/2025 e ainda não visualizou o crédito no app Velotax, fique tranquilo. Alguns clientes não receberam e o valor ficou disponível para resgate manual no site do Banco do Brasil.",
      category: "Restituição e Declaração",
      category_id: "02_restituição",
      keywords: ["Restituição", "Declaração", "não creditada"],
      createdAt: "2025-01-11T14:30:00.000Z",
      updatedAt: "2025-01-11T14:30:00.000Z"
    },
    {
      _id: "mock_articles_006",
      title: "Excluir conta Velotax pelo app",
      content: "Para excluir a conta no Velotax, acessando pelo app, siga os passos abaixo: Acesse o aplicativo Velotax. Na tela inicial, clique no ícone do Perfil (canto superior esquerdo) e selecione a opção DARF. No canto superior direito da tela, clique no menu de opções, indicado por 3 linhas horizontais.",
      category: "Conta e Planos",
      category_id: "04_Conta",
      keywords: ["conta", "excluir", "deletar"],
      createdAt: "2025-01-10T09:45:00.000Z",
      updatedAt: "2025-01-10T09:45:00.000Z"
    },
    {
      _id: "mock_articles_007",
      title: "Entendendo sua Procuração Eletrônica Velotax",
      content: "Para executar os serviços que você contratou, como declarar seu IR ou regularizar um imposto, precisamos de uma autorização para acessar seus dados na Receita Federal. A procuração eletrônica no portal e-CAC é a forma oficial e segura de conceder essa permissão.",
      category: "Conta e Planos",
      category_id: "04_Conta",
      keywords: ["procuração", "autorização", "dados", "compartilhamento"],
      createdAt: "2025-01-09T13:15:00.000Z",
      updatedAt: "2025-01-09T13:15:00.000Z"
    },
    {
      _id: "mock_articles_008",
      title: "Telefones e Links Públicos",
      content: "Estes telefones e links podem ser divulgados para os clientes e serem usados como ferramentas do atendimento. Central de atendimento: Capitais e Regiões metropolitanas: 3003-7293. Demais localidades: 0800-800-0049.",
      category: "Ferramentas do Agente",
      category_id: "06_ferramentas",
      keywords: ["Links", "link", "telefone"],
      createdAt: "2025-01-08T10:30:00.000Z",
      updatedAt: "2025-01-08T10:30:00.000Z"
    }
  ],
  
  faq: [
    {
      _id: "mock_faq_001",
      topic: "Como funciona a antecipação de restituição?",
      context: "A antecipação da sua restituição de imposto de renda é contratada por um valor fixo, que já inclui os juros e taxas acordados no momento do serviço. Isso ocorre porque, no momento da contratação, é impossível prever a data exata em que sua restituição estará disponível.",
      keywords: "antecipação, restituição, contrato",
      question: "Como funciona a antecipação de restituição?",
      createdAt: "2025-01-15T07:00:00.000Z",
      updatedAt: "2025-01-15T07:00:00.000Z"
    },
    {
      _id: "mock_faq_002",
      topic: "Posso usar qualquer chave PIX?",
      context: "Não. Apenas a chave PIX que utiliza seu CPF poderá ser utilizada na conta Velobank para o processo de antecipação, ou cobrança retida da taxa de uso do app. Essa limitação ocorre por razão de segurança.",
      keywords: "pix, chave, segurança",
      question: "Posso usar qualquer chave PIX?",
      createdAt: "2025-01-14T11:00:00.000Z",
      updatedAt: "2025-01-14T11:00:00.000Z"
    },
    {
      _id: "mock_faq_003",
      topic: "Como excluir minha conta?",
      context: "Para excluir a conta no Velotax, acesse o aplicativo. Na tela inicial, clique no ícone do Perfil e selecione a opção DARF. No canto superior direito, clique no menu de opções e role até encontrar 'Excluir Conta'.",
      keywords: "conta, excluir, deletar",
      question: "Como excluir minha conta?",
      createdAt: "2025-01-13T15:30:00.000Z",
      updatedAt: "2025-01-13T15:30:00.000Z"
    },
    {
      _id: "mock_faq_004",
      topic: "O que é a procuração eletrônica?",
      context: "Para executar os serviços que você contratou, como declarar seu IR ou regularizar um imposto, precisamos de uma autorização para acessar seus dados na Receita Federal. A procuração eletrônica no portal e-CAC é a forma oficial e segura de conceder essa permissão.",
      keywords: "procuração, autorização, dados",
      question: "O que é a procuração eletrônica?",
      createdAt: "2025-01-12T09:45:00.000Z",
      updatedAt: "2025-01-12T09:45:00.000Z"
    },
    {
      _id: "mock_faq_005",
      topic: "Como entrar em contato com o suporte?",
      context: "Central de atendimento: Capitais e Regiões metropolitanas: 3003-7293. Demais localidades: 0800-800-0049. Formulário de abertura de ticket: https://support.velotax.com.br/",
      keywords: "contato, suporte, atendimento",
      question: "Como entrar em contato com o suporte?",
      createdAt: "2025-01-11T12:20:00.000Z",
      updatedAt: "2025-01-11T12:20:00.000Z"
    }
  ]
};

// Função para obter dados mock
export const getMockData = () => {
  console.log('📋 Usando dados mock como fallback');
  return mockData;
};
