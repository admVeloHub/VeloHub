/**
 * VeloHub V3 - FormReclamacao Component
 * VERSION: v3.39.0 | DATE: 2026-04-02 | AUTHOR: VeloHub Development Team
 * 
 * Componente de formulário para criação de reclamações BACEN, Ouvidoria, Reclame Aqui, Procon e Processos
 * 
 * Mudanças v3.39.0:
 * - Produto N2 e Reclame Aqui: rótulo de value Antecipação unificado a "Antecipação Outros Anos" (igual BACEN/Procon/Judicial)
 * 
 * Mudanças v3.38.0:
 * - Produto: grafia canônica Empréstimo Pessoal (onde era Credito Pessoal) e Crédito Trabalhador (Credito Trabalhador / Crédito ao trabalhador / Crédito ao Trabalhador), mantidas as listas por tipo
 * 
 * Mudanças v3.37.0:
 * - Canais: Localizar fora do grid (flex); checkboxes em grid 4×2 com L2C4 vazio (md)
 * 
 * Mudanças v3.36.0:
 * - Canais: linha Localizar só botão + campo; Sem Resposta do Cliente na 1ª linha do grid de checkboxes (col. 4), com N1 | N2 | Pix
 * 
 * Mudanças v3.35.0:
 * - Canais de Atendimento: 1ª linha em grid 4 colunas — Localizar (C1 + C2–C3 campo) e Sem Resposta do Cliente (C4); demais grids inalterados
 * 
 * Mudanças v3.34.0:
 * - BACEN / N2 Pix: removido campo "Prazo" do formulário; prazoBacen/prazoOuvidoria definidos na API (2 dias após createdAt)
 * 
 * Mudanças v3.33.0:
 * - Canais de Atendimento e Protocolos: checkbox "Sem Resposta do Cliente" (semRespostaCliente boolean no payload BACEN, N2, Reclame Aqui, Procon)
 * 
 * Mudanças v3.32.0:
 * - Reclame Aqui: lista final de Motivos e de Produto (ordem operacional); novos motivos Não elegível a crédito, Desativado; rótulos Encerramento cta App/Celcoin, Reativação do cadastro, Valor mínimo para contratação, Portabilidade pix
 * 
 * Mudanças v3.31.0:
 * - Reclame Aqui (MOTIVOS_RECLAME_AQUI): removidos Cancelamento/ estorno, Sem margem, Desativada - não considerar reclamação, Seguro acidente, Dúvidas sobre restituição
 * 
 * Mudanças v3.30.0:
 * - MOTIVOS_REDUZIDOS (BACEN / N2 / Procon): ordem e rótulos alinhados à especificação (Cancelamento em duas opções; renomeações; Lgpd → Encerramento cta App)
 * 
 * Mudanças v3.29.2:
 * - Reclame Aqui: motivo "Desativada - Não considerar Reclamação" (hífen)
 * 
 * Mudanças v3.29.1:
 * - Reclame Aqui: ordem — Encerramento cta App logo após Encerramento cta Celcoin
 * 
 * Mudanças v3.29.0:
 * - Reclame Aqui (MOTIVOS_RECLAME_AQUI): novos motivos; removido Erro E-cac; renomeações; Liberação Chave Pix e Portabilidade Chave Pix no topo
 * 
 * Mudanças v3.28.0:
 * - PROCON: adicionado campo Origem (valores: Procon, Consumidor.gov); incluído no payload
 * 
 * Mudanças v3.27.0:
 * - BACEN: removido valor "Consumidor.Gov" do campo Origem; Prazo deixa de ser obrigatório
 * 
 * Mudanças v3.26.0:
 * - BACEN: campo "Natureza" renomeado para "Origem" (label e mensagens de validação)
 * 
 * Mudanças v3.25.0:
 * - MOTIVOS_REDUZIDOS: Abatimento de juros → Abatimento de Juros; Liberação chave pix → Liberação Chave Pix; Encerramento de conta → Encerramento de Conta; adicionado Portabilidade Pix
 * - MOTIVOS_RECLAME_AQUI: adicionado Portabilidade Pix
 * - Padronização de grafias: Abatimento de Juros, Liberação Chave Pix, Contestação de Valores, Encerramento de Conta, Exclusão de Conta, Não Recebeu Restituição
 * 
 * Mudanças v3.24.0:
 * - Removido campo oportunidade do form Reclame Aqui (não consta no schema)
 * 
 * Mudanças v3.23.0:
 * - Form Reclame Aqui: lista específica de motivos (MOTIVOS_RECLAME_AQUI): Liberação Chave Pix, Cancelamento/ Estorno, Abatimento de Juros, Cobrança, Encerramento de Conta Celcoin, Erro, Fraude, LGPD, Juros Abusivos, Sem Margem, Valor Minimo para contratação, Desativada Não considerar Reclamação, Reativação de Cadastro, Dúvidas Gerais, Limite baixo do Pix, Erro E-cac
 * 
 * Mudanças v3.22.0:
 * - Form N2: removido n2SegundoNivel (537) do payload; protocolosN2 (538) preenchido via campo Protocolo N2 ao lado de Motivo
 * - Localizar Atendimentos: N2 não preenche n2SegundoNivel; protocolosN2 tratado com fallback para array vazio
 * 
 * Mudanças v3.21.0:
 * - Localizar Atendimentos adicionado aos forms BACEN, OUVIDORIA (N2) e RECLAME_AQUI (na área Canais de Atendimento)
 * - Função localizarAtendimentos parametrizada: exclui o tipo do form atual da busca
 * - Preenche também procon/protocolosProcon para forms BACEN, N2, Reclame Aqui
 * 
 * Mudanças v3.20.0:
 * - Form Procon: "Registros Reclame Aqui" renomeado para "Localizar Atendimentos"
 * - Localizar Atendimentos: busca CPF em todas as collections e preenche acionouCentral, protocolosCentral, n2SegundoNivel, protocolosN2, reclameAqui, protocolosReclameAqui, pixLiberado, statusContratoQuitado
 * - Adicionados campos Central de Atendimento, N2 Ouvidoria, Reclame Aqui (com protocolos) e Pix Liberado/Contrato Quitado no form Procon (omitido Procon)
 * 
 * Mudanças v3.19.2:
 * - Corrigido toast.info para toast (react-hot-toast não possui método .info)
 * 
 * Mudanças v3.19.1:
 * - Campo Produto do form N2 Pix: Antecipação Outros Anos, Antecipação 2026, Conta Celcoin, Empréstimo Pessoal, Seguros, Crédito Trabalhador
 * 
 * Mudanças v3.19.0:
 * - Adicionado campo Produto no formulário Reclame Aqui (obrigatório)
 * 
 * Mudanças v3.18.0:
 * - Produto: "Antecipação" exibe "Antecipação Outros Anos" (valor no banco mantido); novo "Antecipação 2026"
 * 
 * Mudanças v3.17.0:
 * - Ocultos campos redundantes: Escalado N2 no form N2 Pix, Procon no form Procon, Reclame Aqui no form Reclame Aqui
 * - Status do contrato: 1 checkbox "Contrato Quitado" (Boolean); statusContratoAberto derivado no payload
 * - Pix Liberado e Contrato Quitado sempre na coluna 3 (md:col-start-3)
 * 
 * Mudanças v3.16.0:
 * - Data de entrada obrigatória em todos os formulários (BACEN, OUVIDORIA, RECLAME_AQUI, PROCON, PROCESSOS)
 * - Toast específico quando data de entrada não preenchida: exibe mensagem do campo (ex: "Data de entrada é obrigatória")
 * 
 * Mudanças v3.15.2:
 * - Valores dos campos Motivos e Produto convertidos para primeira letra maiúscula
 * 
 * Mudanças v3.15.0:
 * - Atualizado campo Motivos (BACEN e N2 Pix) com novos valores: abatimento de juros, cancelamento, cobrança, encerramento de conta, erro, fraude, lgpd, liberação chave pix, superendividamento
 * - Atualizado campo Produto do formulário N2 Pix com novos valores: antecipação, crédito pessoal, crédito trabalhador, cupons, seguros
 * 
 * Mudanças v3.14.0:
 * - Campo Origem do formulário N2 Pix: removidos valores "Telefone" e "Ticket", adicionado valor "Atendimento"
 * 
 * Mudanças v3.11.0:
 * - Campo Motivo agora usa dropdown que adiciona opções selecionadas ao campo
 * - Motivos selecionados aparecem como tags removíveis dentro do campo
 * - Dropdown mostra apenas motivos ainda não selecionados
 * - Interface mais limpa e compacta
 * 
 * Mudanças v3.10.0:
 * - Campo Motivo agora permite múltipla escolha em TODOS os tipos de reclamação (não apenas Ação Judicial)
 * - Criada função renderCampoMotivo para padronizar exibição de checkboxes de motivos
 * - Schema atualizado: motivoReduzido agora é [String] em todos os tipos
 * - Validação atualizada para verificar se pelo menos um motivo foi selecionado
 * - handleSubmit atualizado para enviar array de motivos em todos os tipos
 * 
 * Mudanças v3.9.0:
 * - Adicionado tipo de reclamação "Ação Judicial"
 * - Criado schema reclamacoes_judicial no LISTA_SCHEMAS.rb
 * - Adicionados campos específicos: Nro do Processo, Empresa Acionada (Velotax/Celcoin), Data de Entrada, Produto, Motivo, Descrição, Audiência (com data e situação), Subsídios
 * - Criada função de busca automática de Outros Protocolos por CPF em todas as collections do DB hub_ouvidoria
 * - Criados cards com modal expansível para cada resultado encontrado em Outros Protocolos
 * - Removidas coordenadas de grid (L1C1, etc.) das etiquetas dos campos conforme solicitado
 * 
 * Mudanças v3.8.0:
 * - Adicionado tipo de reclamação "Procon"
 * - Criado schema reclamacoes_procon no LISTA_SCHEMAS.rb
 * - Adicionados campos específicos: Código Procon (16 caracteres), Data Procon, Produto, Motivo, Descrição, Solução Apresentada, Processo Administrativo, Cliente Desistiu, Encaminhado ao Jurídico, Processo Encerrado
 * - Criada função de busca automática de registros Reclame Aqui por CPF com modal de exibição
 * - Protocolos e Canais de Atendimento agora aparecem também para Procon
 * - Tentativas de Contato não aparecem para Procon
 * 
 * Mudanças v3.7.0:
 * - Adicionado tipo de reclamação "Reclame Aqui"
 * - Criado schema reclamacoes_reclameAqui no LISTA_SCHEMAS.rb
 * - Adicionados campos específicos: ID Entrada, CPF Repetido, Data Reclam, Passível de nota +, Oportunidade, Solicitado Avaliação, Avaliado
 * - Protocolos e Canais de Atendimento agora aparecem também para Reclame Aqui (Tratativa N1)
 * - Tentativas de Contato não aparecem para Reclame Aqui
 * 
 * Mudanças v3.6.0:
 * - Removido campo userEmail (nome do usuário obtido da sessão ativa no middleware)
 * 
 * Mudanças v3.5.0:
 * - Removido campo casosCriticos (não conectado ao formulário)
 * 
 * Mudanças v3.4.0:
 * - Removido campo status (usar Finalizado.Resolvido para determinar se está em andamento ou resolvido)
 * - Removido campo mes do formulário OUVIDORIA
 * 
 * Mudanças v3.3.0:
 * - Removidos vestígios da metodologia anterior do BACEN/N2 original
 * - Renomeado campo origemOuvidoria para origem (conforme schema)
 * - Adicionado campo dataEntradaN2 ao formulário OUVIDORIA
 * - Removida função gerarOpcoesMes não utilizada
 * - Simplificados comentários históricos
 * 
 * Mudanças v3.2.0:
 * - Melhorada função formatTelefone para aplicar máscara progressiva durante digitação
 * - Adicionadas funções formatarEmail e validarEmail para formatação e validação de email
 * - Engrossada borda verde de validação de 1px para 2px (border-2)
 * - Email agora é formatado automaticamente (lowercase, sem espaços) durante digitação
 * 
 * Mudanças v3.1.0:
 * - Adicionado objeto Finalizado { Resolvido: Boolean, dataResolucao: Date } ao schema
 * - Botão Salvar Reclamação agora oferece 2 opções: "Em Andamento" e "Resolvido"
 */

import React, { useState, useEffect, useRef } from 'react';
import { reclamacoesAPI, anexosAPI } from '../../services/ouvidoriaApi';
import { formatDateRegistro } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

/**
 * Formatar CPF
 */
const formatCPF = (value) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return value;
};

/**
 * Formatar telefone com máscara progressiva
 */
const formatTelefone = (value) => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  if (cleaned.length <= 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  
  return value;
};

/**
 * Formatar email (mantém formato básico, não força máscara rígida)
 * @param {string} valor - Valor a formatar
 * @returns {string} Email formatado (em lowercase, sem espaços)
 */
const formatarEmail = (valor) => {
  return String(valor || '').toLowerCase().trim().replace(/\s+/g, '');
};

/**
 * Validar formato de email (deve ter pelo menos: parte@dominio.extensão)
 * Aceita extensões: .com, .com.br, .gov, .net, .org, .co, etc.
 * @param {string} valor - Email a validar
 * @returns {boolean} True se formato válido
 */
const validarEmail = (valor) => {
  const email = String(valor || '').trim();
  if (!email) return false;
  
  // Regex para validar formato básico: parte@dominio.extensão
  // Aceita extensões comuns: .com, .com.br, .gov, .net, .org, .co, etc.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
  
  // Verifica se tem pelo menos: parte@dominio.com (ou similar)
  return emailRegex.test(email);
};

/**
 * Validar CPF
 */
const validarCPF = (cpf) => {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.length === 11;
};


/**
 * Opções de motivo reduzido (BACEN / N2 Pix / Procon)
 * VERSION: v2.0.0 | DATE: 2026-03-19 | Alinhado lista operacional BACEN
 *
 * Ordem: Liberação Chave Pix e Portabilidade Pix no topo; depois Abatimento, cancelamentos (7 dias),
 * Em cobrança, Alega fraude, Erro App, encerramentos cta, Superendividamento.
 */
const MOTIVOS_REDUZIDOS = [
  'Liberação chave pix',
  'Portabilidade pix',
  'Abatimento de juros',
  'Cancelamento até 7 dias',
  'Cancelamento superior a 7 dias',
  'Em cobrança',
  'Alega fraude',
  'Erro app',
  'Encerramento cta celcoin',
  'Encerramento cta app',
  'Superendividamento',
];

/**
 * Opções de motivo para Ação Judicial (múltipla escolha)
 */
const MOTIVOS_ACAO_JUDICIAL = [
  'Juros',
  'Chave pix',
  'Restituição BB',
  'Relatório',
  'Repetição indébito',
  'Superendividamento',
  'Desconhece contratação'
];

/**
 * Opções de motivo para Reclame Aqui (múltipla escolha)
 */
const MOTIVOS_RECLAME_AQUI = [
  'Reativação do cadastro',
  'Alteração cadastral',
  'Abatimento de juros',
  'Valor mínimo para contratação',
  'Limite baixo do pix',
  'Portabilidade pix',
  'Em cobrança',
  'Cancelamento até 7 dias',
  'Cancelamento superior a 7 dias',
  'Erro gov',
  'Não elegível a crédito',
  'Alega fraude',
  'Desativado',
  'Dívida prescrita',
  'Dúvidas gerais',
  'Encerramento cta App',
  'Encerramento cta Celcoin',
  'Erro app',
  'Liberação chave pix',
];

const FormReclamacao = ({ responsavel, onSuccess }) => {
  const [formData, setFormData] = useState({
    // Campos comuns
    nome: '',
    cpf: '',
    telefones: { lista: [''] },
    email: '',
    observacoes: '',
    tipo: 'BACEN',
    
    // Campos BACEN
    dataEntrada: new Date().toISOString().split('T')[0],
    origem: '',
    produto: '',
    anexos: [], // Array de URLs dos anexos
    motivoReduzido: [], // Array de motivos selecionados
    motivoDetalhado: '',
    
    // Campos Ouvidoria (schema: dataEntradaN2)
    dataEntradaN2: '',
    
    // Campos Reclame Aqui
    cpfRepetido: '',
    idEntrada: '',
    dataReclam: '',
    passivelNotaMais: false,
    solicitadoAvaliacao: false,
    avaliado: false,
    
    // Campos Procon
    codigoProcon: '',
    dataProcon: '',
    solucaoApresentada: '',
    processoAdministrativo: '',
    clienteDesistiu: false,
    encaminhadoJuridico: false,
    processoEncaminhadoResponsavel: '',
    processoEncaminhadoData: '',
    processoEncerrado: false,
    dataProcessoEncerrado: '',
    registrosReclameAqui: '',
    
    // Campos Processos
    nroProcesso: '',
    empresaAcionada: '',
    dataEntradaProcesso: new Date().toISOString().split('T')[0],
    audiencia: false,
    dataAudiencia: '',
    situacaoAudiencia: '',
    subsidios: '',
    outrosProtocolos: '',
    
    // Campos compartilhados (condicionais)
    tentativasContato: { lista: [{ data: '', meio: '', resultado: '' }] },
    acionouCentral: false,
    protocolosCentral: [''],
    n2SegundoNivel: false,
    protocolosN2: [''],
    reclameAqui: false,
    protocolosReclameAqui: [''],
    procon: false,
    protocolosProcon: [''],
    pixLiberado: false,
    statusContratoQuitado: false,
    enviarParaCobranca: false,
    localizarAtendimentos: '', // Resultado da busca por CPF (BACEN, N2, Reclame Aqui)
    semRespostaCliente: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [saveMode, setSaveMode] = useState(null); // 'em-andamento' ou 'resolvido'
  const [dropdownMotivoAberto, setDropdownMotivoAberto] = useState(null); // ID único do campo de motivo aberto
  const dropdownMotivoRefs = useRef({});
  const dropdownRef = useRef(null); // Ref para o dropdown de opções de salvamento

  // Fechar dropdown de motivo ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownMotivoAberto !== null) {
        const ref = dropdownMotivoRefs.current[dropdownMotivoAberto];
        if (ref && !ref.contains(event.target)) {
          setDropdownMotivoAberto(null);
        }
      }
    };

    if (dropdownMotivoAberto !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownMotivoAberto]);

  /**
   * Renderizar campo de motivo com dropdown múltipla escolha
   */
  const renderCampoMotivo = (motivosLista, valorAtual, onChange, error, label = 'Motivo *', campoId = 'motivo-default') => {
    const valoresArray = Array.isArray(valorAtual) ? valorAtual : [];
    const motivosDisponiveis = motivosLista.filter(m => !valoresArray.includes(m));
    const isAberto = dropdownMotivoAberto === campoId;

    const adicionarMotivo = (motivo) => {
      if (!valoresArray.includes(motivo)) {
        onChange([...valoresArray, motivo]);
      }
      setDropdownMotivoAberto(null);
    };

    const removerMotivo = (motivo) => {
      onChange(valoresArray.filter(m => m !== motivo));
    };

    return (
      <div 
        className="relative" 
        ref={(el) => {
          if (el) {
            dropdownMotivoRefs.current[campoId] = el;
          }
        }}
      >
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          {label}
        </label>
        
        {/* Campo de exibição dos motivos selecionados */}
        <div 
          className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 min-h-[42px] flex flex-wrap gap-2 items-center cursor-pointer bg-white dark:bg-gray-800"
          onClick={() => setDropdownMotivoAberto(isAberto ? null : campoId)}
        >
          {valoresArray.length === 0 ? (
            <span className="text-gray-400 dark:text-gray-500 text-sm">Selecione os motivos...</span>
          ) : (
            valoresArray.map((motivo, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
              >
                {motivo}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removerMotivo(motivo);
                  }}
                  className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                >
                  ×
                </button>
              </span>
            ))
          )}
          <span className="ml-auto text-gray-400">▼</span>
        </div>

        {/* Dropdown de opções */}
        {isAberto && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-500 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {motivosDisponiveis.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Todos os motivos já foram selecionados
              </div>
            ) : (
              motivosDisponiveis.map(motivo => (
                <div
                  key={motivo}
                  onClick={() => adicionarMotivo(motivo)}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                >
                  {motivo}
                </div>
              ))
            )}
          </div>
        )}

        {error && (
          <span className="text-red-500 text-xs mt-1 block">{error}</span>
        )}
      </div>
    );
  };
  
  // Estados para busca de registros Reclame Aqui (Procon)
  const [reclameAquiRegistros, setReclameAquiRegistros] = useState([]);
  const [mostrarModalReclameAqui, setMostrarModalReclameAqui] = useState(false);
  const [buscandoReclameAqui, setBuscandoReclameAqui] = useState(false);
  
  // Estados para busca de Outros Protocolos (Processos)
  const [outrosProtocolosRegistros, setOutrosProtocolosRegistros] = useState([]);
  const [mostrarModalOutrosProtocolos, setMostrarModalOutrosProtocolos] = useState(false);
  const [buscandoOutrosProtocolos, setBuscandoOutrosProtocolos] = useState(false);
  const [protocoloExpandido, setProtocoloExpandido] = useState(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSaveOptions && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSaveOptions(false);
      }
    };

    if (showSaveOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSaveOptions]);

  /**
   * Adicionar telefone
   */
  const adicionarTelefone = () => {
    setFormData(prev => ({
      ...prev,
      telefones: { lista: [...prev.telefones.lista, ''] }
    }));
  };

  /**
   * Remover telefone
   */
  const removerTelefone = (index) => {
    setFormData(prev => ({
      ...prev,
      telefones: { lista: prev.telefones.lista.filter((_, i) => i !== index) }
    }));
  };

  /**
   * Atualizar telefone
   */
  const atualizarTelefone = (index, value) => {
    setFormData(prev => ({
      ...prev,
      telefones: { 
        lista: prev.telefones.lista.map((tel, i) => i === index ? formatTelefone(value) : tel)
      }
    }));
  };

  /**
   * Adicionar tentativa de contato
   */
  const adicionarTentativa = () => {
    setFormData(prev => ({
      ...prev,
      tentativasContato: { 
        lista: [...prev.tentativasContato.lista, { data: '', meio: '', resultado: '' }]
      }
    }));
  };

  /**
   * Remover tentativa
   */
  const removerTentativa = (index) => {
    setFormData(prev => ({
      ...prev,
      tentativasContato: { 
        lista: prev.tentativasContato.lista.filter((_, i) => i !== index)
      }
    }));
  };

  /**
   * Adicionar protocolo
   */
  const adicionarProtocolo = (tipo) => {
    setFormData(prev => ({
      ...prev,
      [tipo]: [...prev[tipo], '']
    }));
  };

  /**
   * Remover protocolo
   */
  const removerProtocolo = (tipo, index) => {
    setFormData(prev => ({
      ...prev,
      [tipo]: prev[tipo].filter((_, i) => i !== index)
    }));
  };

  /**
   * Atualizar protocolo
   */
  const atualizarProtocolo = (tipo, index, value) => {
    setFormData(prev => ({
      ...prev,
      [tipo]: prev[tipo].map((p, i) => i === index ? value : p)
    }));
  };

  /**
   * Validar formulário
   */
  const validarFormulario = () => {
    const novosErros = {};

    // Campos comuns sempre obrigatórios
    if (!formData.nome) novosErros.nome = 'Nome é obrigatório';
    if (!validarCPF(formData.cpf)) novosErros.cpf = 'CPF inválido';

    // Validações específicas por tipo
    if (formData.tipo === 'BACEN') {
      if (!formData.dataEntrada) novosErros.dataEntrada = 'Data de entrada é obrigatória';
      if (!formData.origem) novosErros.origem = 'Origem é obrigatória';
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      if (!formData.motivoDetalhado) novosErros.motivoDetalhado = 'Descrição é obrigatória';
    } else if (formData.tipo === 'OUVIDORIA') {
      if (!formData.dataEntradaN2) novosErros.dataEntradaN2 = 'Data entrada atendimento é obrigatória';
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      if (!formData.origem) novosErros.origem = 'Origem é obrigatória';
    } else if (formData.tipo === 'RECLAME_AQUI') {
      if (!formData.idEntrada || formData.idEntrada.replace(/\D/g, '').length !== 9) {
        novosErros.idEntrada = 'ID Entrada deve ter 9 dígitos numéricos';
      }
      if (!formData.dataReclam) novosErros.dataReclam = 'Data Reclamação é obrigatória';
      if (!formData.produto) novosErros.produto = 'Produto é obrigatório';
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
    } else if (formData.tipo === 'PROCON') {
      if (!formData.origem || !['Procon', 'Consumidor.gov'].includes(formData.origem)) {
        novosErros.origem = 'Origem é obrigatória';
      }
      if (!formData.codigoProcon || formData.codigoProcon.length !== 16) {
        novosErros.codigoProcon = 'Código Procon deve ter 16 caracteres';
      }
      if (!formData.dataProcon) novosErros.dataProcon = 'Data Procon é obrigatória';
      if (!formData.produto) novosErros.produto = 'Produto é obrigatório';
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
    } else if (formData.tipo === 'PROCESSOS') {
      if (!formData.nroProcesso) novosErros.nroProcesso = 'Número do Processo é obrigatório';
      if (!formData.empresaAcionada) novosErros.empresaAcionada = 'Empresa Acionada é obrigatória';
      if (!formData.dataEntradaProcesso) novosErros.dataEntradaProcesso = 'Data de Entrada é obrigatória';
      if (!formData.produto) novosErros.produto = 'Produto é obrigatório';
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) {
        novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      }
    }

    setErrors(novosErros);
    return { valid: Object.keys(novosErros).length === 0, errors: novosErros };
  };

  /**
   * Toast de acordo com o erro de validação (prioridade: data de entrada)
   */
  const exibirToastValidacao = (errors) => {
    const camposDataEntrada = ['dataEntrada', 'dataEntradaN2', 'dataReclam', 'dataProcon', 'dataEntradaProcesso'];
    const erroData = camposDataEntrada.find(c => errors[c]);
    if (erroData) {
      toast.error(errors[erroData]);
      return;
    }
    toast.error('Por favor, preencha todos os campos obrigatórios');
  };

  /**
   * Submeter formulário
   */
  const handleSubmit = async (e, modo = null) => {
    e.preventDefault();

    // Se não foi passado um modo, mostrar opções
    if (!modo) {
      setShowSaveOptions(true);
      return;
    }

    const { valid, errors } = validarFormulario();
    if (!valid) {
      exibirToastValidacao(errors);
      setShowSaveOptions(false);
      return;
    }

    setLoading(true);
    setShowSaveOptions(false);
    try {
      // Log para debug
      console.log(`🔍 [FormReclamacao] Dados antes de enviar:`, {
        responsavel,
        tipo: formData.tipo
      });

      // Montar payload baseado no tipo
      let payload = {
        tipo: formData.tipo,
        nome: formData.nome,
        cpf: formData.cpf.replace(/\D/g, ''),
        telefones: { lista: formData.telefones.lista.filter(t => t.trim() !== '') },
        email: formData.email || '',
        observacoes: formData.observacoes,
        responsavel: responsavel, // Nome do usuário logado obtido da sessão
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Adicionar objeto Finalizado se modo for "resolvido"
      if (modo === 'resolvido') {
        payload.Finalizado = {
          Resolvido: true,
          dataResolucao: new Date()
        };
      }
      // Se modo for "em-andamento", não adiciona o objeto Finalizado (fica em branco/null)

      // Adicionar campos específicos por tipo
      if (formData.tipo === 'BACEN') {
        payload = {
          ...payload,
          dataEntrada: formData.dataEntrada,
          origem: formData.origem,
          produto: formData.produto || '',
          anexos: formData.anexos,
          motivoReduzido: formData.motivoReduzido,
          motivoDetalhado: formData.motivoDetalhado,
          tentativasContato: { lista: formData.tentativasContato.lista.filter(t => t.data || t.meio || t.resultado) },
          acionouCentral: formData.acionouCentral,
          protocolosCentral: formData.protocolosCentral.filter(p => p.trim() !== ''),
          n2SegundoNivel: formData.n2SegundoNivel,
          protocolosN2: formData.protocolosN2.filter(p => p.trim() !== ''),
          reclameAqui: formData.reclameAqui,
          protocolosReclameAqui: formData.protocolosReclameAqui.filter(p => p.trim() !== ''),
          procon: formData.procon,
          protocolosProcon: formData.protocolosProcon.filter(p => p.trim() !== ''),
          semRespostaCliente: formData.semRespostaCliente === true,
          pixLiberado: formData.pixLiberado,
          statusContratoQuitado: formData.statusContratoQuitado,
          statusContratoAberto: !formData.statusContratoQuitado,
        };
      } else if (formData.tipo === 'OUVIDORIA') {
        payload = {
          ...payload,
          dataEntradaN2: formData.dataEntradaN2,
          origem: formData.origem || '',
          produto: formData.produto || '',
          motivoReduzido: formData.motivoReduzido,
          motivoDetalhado: formData.motivoDetalhado || '',
          anexos: formData.anexos,
          tentativasContato: { lista: formData.tentativasContato.lista.filter(t => t.data || t.meio || t.resultado) },
          acionouCentral: formData.acionouCentral,
          protocolosCentral: formData.protocolosCentral.filter(p => p.trim() !== ''),
          protocolosN2: (formData.protocolosN2 || []).filter(p => p && String(p).trim() !== ''),
          reclameAqui: formData.reclameAqui,
          protocolosReclameAqui: formData.protocolosReclameAqui.filter(p => p.trim() !== ''),
          procon: formData.procon,
          protocolosProcon: formData.protocolosProcon.filter(p => p.trim() !== ''),
          semRespostaCliente: formData.semRespostaCliente === true,
          pixLiberado: formData.pixLiberado,
          statusContratoQuitado: formData.statusContratoQuitado,
          statusContratoAberto: !formData.statusContratoQuitado,
        };
      } else if (formData.tipo === 'RECLAME_AQUI') {
        payload = {
          ...payload,
          cpfRepetido: formData.cpfRepetido || '',
          idEntrada: formData.idEntrada,
          dataReclam: formData.dataReclam,
          produto: formData.produto,
          motivoReduzido: formData.motivoReduzido,
          motivoDetalhado: formData.motivoDetalhado || '',
          passivelNotaMais: formData.passivelNotaMais,
          pixLiberado: formData.pixLiberado === true,
          statusContratoQuitado: formData.statusContratoQuitado,
          statusContratoAberto: !formData.statusContratoQuitado,
          enviarParaCobranca: formData.enviarParaCobranca || false,
          anexos: formData.anexos,
          solicitadoAvaliacao: formData.solicitadoAvaliacao,
          avaliado: formData.avaliado,
          // Tratativa N1: Canais de atendimento e protocolos acionados
          acionouCentral: formData.acionouCentral,
          protocolosCentral: formData.protocolosCentral.filter(p => p.trim() !== ''),
          n2SegundoNivel: formData.n2SegundoNivel,
          protocolosN2: formData.protocolosN2.filter(p => p.trim() !== ''),
          reclameAqui: formData.reclameAqui,
          protocolosReclameAqui: formData.protocolosReclameAqui.filter(p => p.trim() !== ''),
          procon: formData.procon,
          protocolosProcon: formData.protocolosProcon.filter(p => p.trim() !== ''),
          semRespostaCliente: formData.semRespostaCliente === true,
        };
      } else if (formData.tipo === 'PROCON') {
        payload = {
          ...payload,
          codigoProcon: formData.codigoProcon,
          dataProcon: formData.dataProcon,
          origem: formData.origem,
          produto: formData.produto,
          motivoReduzido: formData.motivoReduzido,
          motivoDetalhado: formData.motivoDetalhado || '',
          solucaoApresentada: formData.solucaoApresentada || '',
          processoAdministrativo: formData.processoAdministrativo || '',
          clienteDesistiu: formData.clienteDesistiu || false,
          encaminhadoJuridico: formData.encaminhadoJuridico || false,
          processoEncaminhadoResponsavel: formData.encaminhadoJuridico && formData.processoEncaminhadoResponsavel ? formData.processoEncaminhadoResponsavel : '',
          processoEncaminhadoData: formData.encaminhadoJuridico && formData.processoEncaminhadoData ? formData.processoEncaminhadoData : '',
          processoEncerrado: formData.processoEncerrado || false,
          dataProcessoEncerrado: formData.processoEncerrado && formData.dataProcessoEncerrado ? formData.dataProcessoEncerrado : '',
          registrosReclameAqui: formData.registrosReclameAqui || '',
          anexos: formData.anexos,
          // Tratativa N1: Canais de atendimento e protocolos acionados (schema Procon não inclui procon/protocolosProcon)
          acionouCentral: formData.acionouCentral,
          protocolosCentral: formData.protocolosCentral.filter(p => p && String(p).trim() !== ''),
          n2SegundoNivel: formData.n2SegundoNivel,
          protocolosN2: formData.protocolosN2.filter(p => p && String(p).trim() !== ''),
          reclameAqui: formData.reclameAqui,
          protocolosReclameAqui: formData.protocolosReclameAqui.filter(p => p && String(p).trim() !== ''),
          pixLiberado: formData.pixLiberado || false,
          statusContratoQuitado: formData.statusContratoQuitado || false,
          semRespostaCliente: formData.semRespostaCliente === true,
        };
      } else if (formData.tipo === 'PROCESSOS') {
        payload = {
          ...payload,
          nroProcesso: formData.nroProcesso,
          empresaAcionada: formData.empresaAcionada,
          dataEntrada: formData.dataEntradaProcesso,
          produto: formData.produto,
          motivoReduzido: formData.motivoReduzido, // Array de motivos selecionados
          motivoDetalhado: formData.motivoDetalhado || '',
          audiencia: formData.audiencia || false,
          dataAudiencia: formData.audiencia && formData.dataAudiencia ? formData.dataAudiencia : '',
          situacaoAudiencia: formData.audiencia && formData.situacaoAudiencia ? formData.situacaoAudiencia : '',
          subsidios: formData.subsidios || '',
          outrosProtocolos: formData.outrosProtocolos || '',
          anexos: formData.anexos,
        };
      }

      const resultado = await reclamacoesAPI.create(payload);
      
      const mensagem = modo === 'resolvido' 
        ? 'Reclamação salva como Resolvida com sucesso!'
        : 'Reclamação salva como Em Andamento com sucesso!';
      toast.success(mensagem);
      
      // Limpar formulário
      resetFormulario();
      setSaveMode(null);

      if (onSuccess) {
        onSuccess(resultado);
      }
    } catch (error) {
      console.error('Erro ao criar reclamação:', error);
      toast.error(error.message || 'Erro ao criar reclamação');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset do formulário
   */
  const resetFormulario = () => {
    const hoje = new Date().toISOString().split('T')[0];
    setFormData({
      nome: '',
      cpf: '',
      telefones: { lista: [''] },
      email: '',
      observacoes: '',
      tipo: formData.tipo, // Manter tipo selecionado
      dataEntrada: hoje,
      origem: '',
      produto: '',
      anexos: [],
      motivoReduzido: [],
      motivoDetalhado: '',
      dataEntradaN2: '',
      origem: '',
      produto: '',
      cpfRepetido: '',
      idEntrada: '',
      dataReclam: '',
      passivelNotaMais: false,
      solicitadoAvaliacao: false,
      avaliado: false,
      codigoProcon: '',
      dataProcon: '',
      solucaoApresentada: '',
      processoAdministrativo: '',
      clienteDesistiu: false,
      encaminhadoJuridico: false,
      processoEncaminhadoResponsavel: '',
      processoEncaminhadoData: '',
      processoEncerrado: false,
      dataProcessoEncerrado: '',
      registrosReclameAqui: '',
      nroProcesso: '',
      empresaAcionada: '',
      dataEntradaProcesso: hoje,
      audiencia: false,
      dataAudiencia: '',
      situacaoAudiencia: '',
      subsidios: '',
      outrosProtocolos: '',
      tentativasContato: { lista: [{ data: '', meio: '', resultado: '' }] },
      acionouCentral: false,
      protocolosCentral: [''],
      n2SegundoNivel: false,
      protocolosN2: [''],
      reclameAqui: false,
      protocolosReclameAqui: [''],
      procon: false,
      protocolosProcon: [''],
      semRespostaCliente: false,
      pixLiberado: false,
      statusContratoQuitado: false,
      enviarParaCobranca: false,
      localizarAtendimentos: '',
    });
    setErrors({});
  };

  /**
   * Renderizar campos específicos BACEN
   */
  const renderCamposBacen = () => (
    <>
      {/* Reclamação BACEN */}
      <div className="velohub-card">
        <h3 className="text-xl font-semibold mb-4 velohub-title">Reclamação</h3>
        
        {/* Linha 1: Origem | Produto | Data de entrada */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Origem *
            </label>
            <select
              value={formData.origem}
              onChange={(e) => setFormData(prev => ({ ...prev, origem: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            >
              <option value="">Selecione...</option>
              <option value="Bacen Celcoin">Bacen Celcoin</option>
              <option value="Bacen Via Capital">Bacen Via Capital</option>
            </select>
            {errors.origem && (
              <span className="text-red-500 text-xs">{errors.origem}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Produto
            </label>
            <select
              value={formData.produto}
              onChange={(e) => setFormData(prev => ({ ...prev, produto: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Selecione...</option>
              <option value="Antecipação 2026">Antecipação 2026</option>
              <option value="Antecipação">Antecipação Outros Anos</option>
              <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
              <option value="Crédito Trabalhador">Crédito Trabalhador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Data de Entrada *
            </label>
            <input
              type="date"
              value={formData.dataEntrada}
              onChange={(e) => setFormData(prev => ({ ...prev, dataEntrada: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            />
            {errors.dataEntrada && (
              <span className="text-red-500 text-xs">{errors.dataEntrada}</span>
            )}
          </div>
        </div>

        {/* Linha 2: Motivo (prazo BACEN é automático na API: +2 dias após a criação do registro) */}
        <div className="mb-4">
          {renderCampoMotivo(
            MOTIVOS_REDUZIDOS,
            formData.motivoReduzido,
            (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
            errors.motivoReduzido,
            'Motivo *',
            'motivo-bacen'
          )}
        </div>

        {/* Linha 3: Descrição */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Descrição *
          </label>
          <textarea
            value={formData.motivoDetalhado}
            onChange={(e) => setFormData(prev => ({ ...prev, motivoDetalhado: e.target.value }))}
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            rows={4}
            placeholder="Descreva detalhadamente a reclamação..."
            required
          />
          {errors.motivoDetalhado && (
            <span className="text-red-500 text-xs">{errors.motivoDetalhado}</span>
          )}
        </div>

        {/* Linha 4: Anexo */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Anexo
          </label>
          <input
            type="file"
            onChange={async (e) => {
              const files = Array.from(e.target.files);
              if (files.length === 0) return;
              
              // Upload de cada arquivo
              const uploadPromises = files.map(async (file) => {
                try {
                  const resultado = await anexosAPI.upload(file, formData.tipo);
                  return resultado.url;
                } catch (error) {
                  console.error('Erro ao fazer upload do anexo:', error);
                  toast.error(`Erro ao fazer upload de ${file.name}: ${error.message}`);
                  return null;
                }
              });
              
              const urls = await Promise.all(uploadPromises);
              const urlsValidas = urls.filter(url => url !== null);
              
              setFormData(prev => ({ 
                ...prev, 
                anexos: [...prev.anexos, ...urlsValidas]
              }));
              
              if (urlsValidas.length > 0) {
                toast.success(`${urlsValidas.length} arquivo(s) enviado(s) com sucesso`);
              }
            }}
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple
          />
          <small className="text-xs text-gray-600 dark:text-gray-400">
            Você pode selecionar múltiplos arquivos. Os arquivos serão enviados automaticamente.
          </small>
          {formData.anexos.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Arquivos enviados ({formData.anexos.length}):
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                {formData.anexos.map((url, index) => (
                  <li key={index} className="truncate">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Anexo {index + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );

  /**
   * Renderizar campos específicos N2/Ouvidoria
   */
  const renderCamposN2 = () => (
    <>
      {/* Reclamação Ouvidoria */}
      <div className="velohub-card">
        <h3 className="text-xl font-semibold mb-4 velohub-title">Reclamação</h3>
        
        {/* Linha 1: Produto | Origem | Data de Entrada (prazo N2 é automático na API: +2 dias após a criação) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Produto
            </label>
            <select
              value={formData.produto}
              onChange={(e) => setFormData(prev => ({ ...prev, produto: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Selecione...</option>
              <option value="Antecipação">Antecipação Outros Anos</option>
              <option value="Antecipação 2026">Antecipação 2026</option>
              <option value="Conta Celcoin">Conta Celcoin</option>
              <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
              <option value="Seguros">Seguros</option>
              <option value="Crédito Trabalhador">Crédito Trabalhador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Origem *
            </label>
            <select
              value={formData.origem}
              onChange={(e) => setFormData(prev => ({ ...prev, origem: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            >
              <option value="">Selecione...</option>
              <option value="Atendimento">Atendimento</option>
              <option value="Chatbot">Chatbot</option>
            </select>
            {errors.origem && (
              <span className="text-red-500 text-xs">{errors.origem}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Data de Entrada *
            </label>
            <input
              type="date"
              value={formData.dataEntradaN2}
              onChange={(e) => setFormData(prev => ({ ...prev, dataEntradaN2: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            />
            {errors.dataEntradaN2 && (
              <span className="text-red-500 text-xs">{errors.dataEntradaN2}</span>
            )}
          </div>
        </div>

        {/* Linha 2: Motivo | Protocolo N2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            {renderCampoMotivo(
              MOTIVOS_REDUZIDOS,
              formData.motivoReduzido,
              (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
              errors.motivoReduzido,
              'Motivo *',
              'motivo-ouvidoria'
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Protocolo N2
            </label>
            {(formData.protocolosN2?.length > 0 ? formData.protocolosN2 : ['']).map((p, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={p}
                  onChange={(e) => atualizarProtocolo('protocolosN2', i, e.target.value)}
                  className="flex-1 border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Nro protocolo"
                />
                {(formData.protocolosN2?.length || 0) > 1 && (
                  <button type="button" onClick={() => removerProtocolo('protocolosN2', i)} className="text-sm px-2 text-red-600">Remover</button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => adicionarProtocolo('protocolosN2')}
              className="text-sm px-3 py-2 rounded border dark:bg-gray-700"
              style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
            >
              + Adicionar Protocolo
            </button>
          </div>
        </div>

        {/* Linha 3: Descrição (opcional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Descrição
          </label>
          <textarea
            value={formData.motivoDetalhado}
            onChange={(e) => setFormData(prev => ({ ...prev, motivoDetalhado: e.target.value }))}
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            rows={4}
            placeholder="Descreva detalhadamente a reclamação..."
          />
        </div>

        {/* Linha 4: Anexo */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Anexo
          </label>
          <input
            type="file"
            onChange={async (e) => {
              const files = Array.from(e.target.files);
              if (files.length === 0) return;
              
              // Upload de cada arquivo
              const uploadPromises = files.map(async (file) => {
                try {
                  const resultado = await anexosAPI.upload(file, formData.tipo);
                  return resultado.url;
                } catch (error) {
                  console.error('Erro ao fazer upload do anexo:', error);
                  toast.error(`Erro ao fazer upload de ${file.name}: ${error.message}`);
                  return null;
                }
              });
              
              const urls = await Promise.all(uploadPromises);
              const urlsValidas = urls.filter(url => url !== null);
              
              setFormData(prev => ({ 
                ...prev, 
                anexos: [...prev.anexos, ...urlsValidas]
              }));
              
              if (urlsValidas.length > 0) {
                toast.success(`${urlsValidas.length} arquivo(s) enviado(s) com sucesso`);
              }
            }}
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple
          />
          <small className="text-xs text-gray-600 dark:text-gray-400">
            Você pode selecionar múltiplos arquivos. Os arquivos serão enviados automaticamente.
          </small>
          {formData.anexos.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Arquivos enviados ({formData.anexos.length}):
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                {formData.anexos.map((url, index) => (
                  <li key={index} className="truncate">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Anexo {index + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );

  /**
   * Renderizar campos específicos Reclame Aqui
   */
  const renderCamposReclameAqui = () => {
    // Validar ID Entrada (9 dígitos numéricos)
    const validarIdEntrada = (id) => {
      const cleaned = id.replace(/\D/g, '');
      return cleaned.length === 9;
    };

    return (
      <>
        {/* Reclamação Reclame Aqui */}
        <div className="velohub-card">
          <h3 className="text-xl font-semibold mb-4 velohub-title">Reclamação</h3>
          
          {/* Linha 1: ID Entrada | Data Reclam | CPF Repetido | Produto */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                ID Entrada (9 dígitos) *
              </label>
              <input
                type="text"
                value={formData.idEntrada}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 9);
                  setFormData(prev => ({ ...prev, idEntrada: cleaned }));
                }}
                className={`w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                  validarIdEntrada(formData.idEntrada) ? 'border-green-500 border-2' : 'border-gray-400 dark:border-gray-500'
                }`}
                placeholder="000000000"
                maxLength={9}
                required
              />
              {errors.idEntrada && (
                <span className="text-red-500 text-xs">{errors.idEntrada}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Data Reclam *
              </label>
              <input
                type="date"
                value={formData.dataReclam}
                onChange={(e) => setFormData(prev => ({ ...prev, dataReclam: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              />
              {errors.dataReclam && (
                <span className="text-red-500 text-xs">{errors.dataReclam}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                CPF Repetido
              </label>
              <input
                type="text"
                value={formData.cpfRepetido}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setFormData(prev => ({ ...prev, cpfRepetido: cleaned }));
                }}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Apenas números"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Produto *
              </label>
              <select
                value={formData.produto}
                onChange={(e) => setFormData(prev => ({ ...prev, produto: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              >
                <option value="">Selecione...</option>
                <option value="Antecipação">Antecipação Outros Anos</option>
                <option value="Antecipação 2026">Antecipação 2026</option>
                <option value="Aplicativo">Aplicativo</option>
                <option value="Conta Celcoin">Conta Celcoin</option>
                <option value="Crédito Trabalhador">Crédito Trabalhador</option>
                <option value="Clube Velotax">Clube Velotax</option>
                <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                <option value="Cupom">Cupom</option>
                <option value="Seguros">Seguros</option>
                <option value="Veloprime">Veloprime</option>
                <option value="Desativado">Desativado</option>
              </select>
              {errors.produto && (
                <span className="text-red-500 text-xs">{errors.produto}</span>
              )}
            </div>
          </div>

          {/* Linha 2: Motivo */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            {renderCampoMotivo(
              MOTIVOS_RECLAME_AQUI,
              formData.motivoReduzido,
              (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
              errors.motivoReduzido,
              'Motivo *',
              'motivo-reclame-aqui'
            )}
          </div>

          {/* Descrição */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Descrição
            </label>
            <textarea
              value={formData.motivoDetalhado}
              onChange={(e) => setFormData(prev => ({ ...prev, motivoDetalhado: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={4}
              placeholder="Descreva detalhadamente a reclamação..."
            />
          </div>

          {/* Solicitado Avaliação, Avaliado e Passível de nota + (abaixo do Descrição) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.solicitadoAvaliacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, solicitadoAvaliacao: e.target.checked }))}
                  className="w-5 h-5"
                />
                <span>Solicitado Avaliação</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.avaliado}
                  onChange={(e) => setFormData(prev => ({ ...prev, avaliado: e.target.checked }))}
                  className="w-5 h-5"
                />
                <span>Avaliado</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.passivelNotaMais}
                  onChange={(e) => setFormData(prev => ({ ...prev, passivelNotaMais: e.target.checked }))}
                  className="w-5 h-5"
                />
                <span>Passível de nota +</span>
              </label>
            </div>
          </div>

          {/* Anexo */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Anexo
            </label>
            <input
              type="file"
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;
                
                // Upload de cada arquivo
                const uploadPromises = files.map(async (file) => {
                  try {
                    const resultado = await anexosAPI.upload(file, formData.tipo);
                    return resultado.url;
                  } catch (error) {
                    console.error('Erro ao fazer upload do anexo:', error);
                    toast.error(`Erro ao fazer upload de ${file.name}: ${error.message}`);
                    return null;
                  }
                });
                
                const urls = await Promise.all(uploadPromises);
                const urlsValidas = urls.filter(url => url !== null);
                
                setFormData(prev => ({ 
                  ...prev, 
                  anexos: [...prev.anexos, ...urlsValidas]
                }));
                
                if (urlsValidas.length > 0) {
                  toast.success(`${urlsValidas.length} arquivo(s) enviado(s) com sucesso`);
                }
              }}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
            />
            <small className="text-xs text-gray-600 dark:text-gray-400">
              Você pode selecionar múltiplos arquivos. Os arquivos serão enviados automaticamente.
            </small>
            {formData.anexos.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Arquivos enviados ({formData.anexos.length}):
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                  {formData.anexos.map((url, index) => (
                    <li key={index} className="truncate">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Anexo {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  /**
   * Localizar Atendimentos por CPF: busca conforme tipo do form e preenche campos.
   * BACEN: N1(535-536), N2(538-539), ReclameAqui(561,575), Procon(613,625)
   * N2 Pix: N1(535-536), ReclameAqui(561,575), Procon(613,625) - sem n2SegundoNivel(537)
   * Reclame Aqui: N1(535-536), N2(538-539), Procon(613,625)
   * Procon: N1, N2, ReclameAqui, pixLiberado, statusContratoQuitado
   */
  const localizarAtendimentos = async (tipoExcluir = 'PROCON') => {
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
      toast.error('CPF inválido. Preencha o CPF do cliente primeiro.');
      return;
    }

    setBuscandoReclameAqui(true);
    try {
      const cpfLimpo = formData.cpf.replace(/\D/g, '');
      const resultado = await reclamacoesAPI.getByCpf(cpfLimpo);
      const todasReclamacoes = Array.isArray(resultado) ? resultado : (resultado?.data || []);

      const tiposExcluir = [tipoExcluir?.toUpperCase?.()?.trim?.()].flatMap(t => {
        if (t === 'OUVIDORIA') return ['OUVIDORIA', 'N2', 'N2 PIX'];
        if (t === 'RECLAME_AQUI') return ['RECLAME_AQUI', 'RECLAME AQUI'];
        return t ? [t] : [];
      });

      const registros = todasReclamacoes.filter(r => {
        const tipo = String(r.tipo || '').toUpperCase().trim();
        return !tiposExcluir.includes(tipo);
      });

      const protocolosCentral = [];
      const protocolosN2 = [];
      const protocolosReclameAqui = [];
      const protocolosProcon = [];
      let acionouCentral = false;
      let n2SegundoNivel = false;
      let reclameAqui = false;
      let procon = false;
      let pixLiberado = formData.pixLiberado;
      let statusContratoQuitado = formData.statusContratoQuitado;

      const incluirN2 = tipoExcluir !== 'OUVIDORIA'; // BACEN e Reclame Aqui buscam N2
      const incluirReclameAqui = tipoExcluir !== 'RECLAME_AQUI'; // BACEN e N2 buscam Reclame Aqui
      const incluirProcon = true;
      const incluirN2SegundoNivel = tipoExcluir !== 'OUVIDORIA'; // N2 não preenche n2SegundoNivel (537)

      for (const r of registros) {
        const tipo = String(r.tipo || '').toUpperCase().trim();

        if (r.acionouCentral && Array.isArray(r.protocolosCentral)) {
          acionouCentral = true;
          protocolosCentral.push(...r.protocolosCentral.filter(p => p && String(p).trim()));
        }
        if (incluirN2 && (tipo === 'OUVIDORIA' || tipo === 'N2' || tipo === 'N2 PIX')) {
          if (incluirN2SegundoNivel) n2SegundoNivel = true;
          if (Array.isArray(r.protocolosN2)) {
            protocolosN2.push(...r.protocolosN2.filter(p => p && String(p).trim()));
          }
        }
        if (incluirReclameAqui && (tipo === 'RECLAME_AQUI' || tipo === 'RECLAME AQUI')) {
          reclameAqui = true;
          if (Array.isArray(r.protocolosReclameAqui)) {
            protocolosReclameAqui.push(...r.protocolosReclameAqui.filter(p => p && String(p).trim()));
          }
        }
        if (incluirProcon && tipo === 'PROCON') {
          procon = true;
          if (Array.isArray(r.protocolosProcon)) {
            protocolosProcon.push(...r.protocolosProcon.filter(p => p && String(p).trim()));
          }
        }
        if (tipo === 'BACEN') {
          if (r.pixLiberado === true) pixLiberado = true;
          if (r.statusContratoQuitado === true) statusContratoQuitado = true;
        }
      }

      const protocolosCentralUnicos = [...new Set(protocolosCentral)];
      const protocolosN2Unicos = [...new Set(protocolosN2)];
      const protocolosReclameAquiUnicos = [...new Set(protocolosReclameAqui)];
      const protocolosProconUnicos = [...new Set(protocolosProcon)];

      const msgResultado = registros.length === 0
        ? 'Nenhum atendimento encontrado para este CPF.'
        : `${registros.length} atendimento(s) encontrado(s). Campos preenchidos automaticamente.`;

      const updates = {
        acionouCentral: acionouCentral || formData.acionouCentral,
        protocolosCentral: protocolosCentralUnicos.length > 0 ? protocolosCentralUnicos : formData.protocolosCentral,
        reclameAqui: reclameAqui || formData.reclameAqui,
        protocolosReclameAqui: protocolosReclameAquiUnicos.length > 0 ? protocolosReclameAquiUnicos : formData.protocolosReclameAqui,
        procon: procon || formData.procon,
        protocolosProcon: protocolosProconUnicos.length > 0 ? protocolosProconUnicos : formData.protocolosProcon,
        registrosReclameAqui: msgResultado,
        localizarAtendimentos: msgResultado,
      };
      if (incluirN2) {
        updates.protocolosN2 = protocolosN2Unicos.length > 0 ? protocolosN2Unicos : formData.protocolosN2;
      }
      if (incluirN2SegundoNivel) {
        updates.n2SegundoNivel = n2SegundoNivel || formData.n2SegundoNivel;
      }
      if (['BACEN', 'OUVIDORIA', 'RECLAME_AQUI', 'PROCON'].includes(tipoExcluir)) {
        updates.pixLiberado = pixLiberado;
        updates.statusContratoQuitado = statusContratoQuitado;
      }

      setFormData(prev => ({ ...prev, ...updates }));

      if (registros.length === 0) {
        toast('Nenhum atendimento encontrado para este CPF.');
      } else {
        toast.success(`${registros.length} atendimento(s) encontrado(s). Campos preenchidos automaticamente.`);
      }
    } catch (error) {
      console.error('Erro ao localizar atendimentos:', error);
      toast.error('Erro ao localizar atendimentos');
    } finally {
      setBuscandoReclameAqui(false);
    }
  };

  /**
   * Buscar registros Reclame Aqui por CPF
   */
  const buscarRegistrosReclameAqui = async () => {
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
      toast.error('CPF inválido. Preencha o CPF do cliente primeiro.');
      return;
    }

    setBuscandoReclameAqui(true);
    try {
      const cpfLimpo = formData.cpf.replace(/\D/g, '');
      const resultado = await reclamacoesAPI.getByCpf(cpfLimpo);
      const todasReclamacoes = resultado.data || resultado || [];
      
      // Filtrar apenas registros do tipo Reclame Aqui
      const registrosRA = todasReclamacoes.filter(r => 
        r.tipo === 'RECLAME_AQUI' || 
        r.tipo === 'Reclame Aqui' || 
        r.tipo === 'RECLAME AQUI'
      );
      
      if (registrosRA.length === 0) {
        toast('Nenhum registro Reclame Aqui encontrado para este CPF.');
        setReclameAquiRegistros([]);
        setFormData(prev => ({ ...prev, registrosReclameAqui: 'Nenhum registro encontrado' }));
      } else {
        setReclameAquiRegistros(registrosRA);
        setMostrarModalReclameAqui(true);
        // Atualizar campo de texto com quantidade encontrada
        setFormData(prev => ({ 
          ...prev, 
          registrosReclameAqui: `${registrosRA.length} registro(s) encontrado(s)` 
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar registros Reclame Aqui:', error);
      toast.error('Erro ao buscar registros Reclame Aqui');
    } finally {
      setBuscandoReclameAqui(false);
    }
  };

  /**
   * Buscar Outros Protocolos por CPF em todas as collections do DB hub_ouvidoria
   */
  const buscarOutrosProtocolos = async () => {
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
      toast.error('CPF inválido. Preencha o CPF do cliente primeiro.');
      return;
    }

    setBuscandoOutrosProtocolos(true);
    try {
      const cpfLimpo = formData.cpf.replace(/\D/g, '');
      const resultado = await reclamacoesAPI.getByCpf(cpfLimpo);
      const todasReclamacoes = resultado.data || resultado || [];
      
      // Filtrar registros que NÃO são do tipo AÇÃO JUDICIAL (para não incluir o próprio registro)
      const outrosProtocolos = todasReclamacoes.filter(r => {
        const tipo = String(r.tipo || '').toUpperCase().trim();
        return tipo !== 'PROCESSOS' && tipo !== 'JUDICIAL' && tipo !== 'AÇÃO JUDICIAL';
      });
      
      if (outrosProtocolos.length === 0) {
        toast('Nenhum outro protocolo encontrado para este CPF.');
        setOutrosProtocolosRegistros([]);
        setFormData(prev => ({ ...prev, outrosProtocolos: 'Nenhum protocolo encontrado' }));
      } else {
        setOutrosProtocolosRegistros(outrosProtocolos);
        setMostrarModalOutrosProtocolos(true);
        // Atualizar campo de texto com quantidade encontrada
        setFormData(prev => ({ 
          ...prev, 
          outrosProtocolos: `${outrosProtocolos.length} protocolo(s) encontrado(s)` 
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar outros protocolos:', error);
      toast.error('Erro ao buscar outros protocolos');
    } finally {
      setBuscandoOutrosProtocolos(false);
    }
  };

  /**
   * Renderizar campos específicos Ação Judicial
   */
  const renderCamposProcessos = () => {
    return (
      <>
        {/* Reclamação Ação Judicial */}
        <div className="velohub-card">
          <h3 className="text-xl font-semibold mb-4 velohub-title">Reclamação</h3>
          
          {/* Linha 1: Nro do Processo | Empresa Acionada | Data de Entrada | Produto */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Nro do Processo *
              </label>
              <input
                type="text"
                value={formData.nroProcesso}
                onChange={(e) => setFormData(prev => ({ ...prev, nroProcesso: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Digite o número do processo"
                required
              />
              {errors.nroProcesso && (
                <span className="text-red-500 text-xs">{errors.nroProcesso}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Empresa Acionada *
              </label>
              <select
                value={formData.empresaAcionada}
                onChange={(e) => setFormData(prev => ({ ...prev, empresaAcionada: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              >
                <option value="">Selecione...</option>
                <option value="Velotax">Velotax</option>
                <option value="Celcoin">Celcoin</option>
              </select>
              {errors.empresaAcionada && (
                <span className="text-red-500 text-xs">{errors.empresaAcionada}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Data de Entrada *
              </label>
              <input
                type="date"
                value={formData.dataEntradaProcesso}
                onChange={(e) => setFormData(prev => ({ ...prev, dataEntradaProcesso: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              />
              {errors.dataEntradaProcesso && (
                <span className="text-red-500 text-xs">{errors.dataEntradaProcesso}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Produto *
              </label>
              <select
                value={formData.produto}
                onChange={(e) => setFormData(prev => ({ ...prev, produto: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              >
                <option value="">Selecione...</option>
                <option value="Antecipação 2026">Antecipação 2026</option>
              <option value="Antecipação">Antecipação Outros Anos</option>
                <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                <option value="Crédito Trabalhador">Crédito Trabalhador</option>
                <option value="Cupons Velotax">Cupons Velotax</option>
                <option value="QueroQuitar">QueroQuitar</option>
                <option value="Seguro DividaZero">Seguro DividaZero</option>
                <option value="Seguro Celular">Seguro Celular</option>
                <option value="Seguro Prestamista">Seguro Prestamista</option>
                <option value="Seguro Saúde">Seguro Saúde</option>
                <option value="Calculadora">Calculadora</option>
                <option value="App">App</option>
                <option value="Outras Ocorrências">Outras Ocorrências</option>
              </select>
              {errors.produto && (
                <span className="text-red-500 text-xs">{errors.produto}</span>
              )}
            </div>
          </div>

          {/* Linha 2: Motivo (múltipla escolha) */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            {renderCampoMotivo(
              MOTIVOS_ACAO_JUDICIAL,
              formData.motivoReduzido,
              (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
              errors.motivoReduzido,
              'Motivo *',
              'motivo-processos'
            )}
          </div>

          {/* Linha 3: Descrição */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Descrição
            </label>
            <textarea
              value={formData.motivoDetalhado}
              onChange={(e) => setFormData(prev => ({ ...prev, motivoDetalhado: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={4}
              placeholder="Descreva detalhadamente o processo..."
            />
          </div>

          {/* Linha 4: Audiência */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.audiencia}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      audiencia: e.target.checked,
                      dataAudiencia: e.target.checked ? '' : '',
                      situacaoAudiencia: e.target.checked ? '' : ''
                    }));
                  }}
                  className="w-5 h-5"
                />
                <span>Audiência</span>
              </label>
            </div>

            {formData.audiencia && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Data da Audiência
                  </label>
                  <input
                    type="date"
                    value={formData.dataAudiencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataAudiencia: e.target.value }))}
                    className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Situação
                  </label>
                  <input
                    type="text"
                    value={formData.situacaoAudiencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, situacaoAudiencia: e.target.value }))}
                    className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Digite a situação da audiência"
                  />
                </div>
              </>
            )}
          </div>

          {/* Linha 5: Subsídios */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Subsídios
            </label>
            <textarea
              value={formData.subsidios}
              onChange={(e) => setFormData(prev => ({ ...prev, subsidios: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={3}
              placeholder="Digite os subsídios..."
            />
          </div>

          {/* Outros Protocolos */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Outros Protocolos
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.outrosProtocolos}
                readOnly
                className="flex-1 border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                placeholder="Clique em 'Buscar' para encontrar protocolos relacionados"
              />
              <button
                type="button"
                onClick={buscarOutrosProtocolos}
                disabled={buscandoOutrosProtocolos || !formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11}
                className="px-4 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: '#006AB9',
                  color: '#006AB9',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                    e.target.style.color = '#F3F7FC';
                    e.target.style.borderColor = '#006AB9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#006AB9';
                    e.target.style.borderColor = '#006AB9';
                  }
                }}
              >
                {buscandoOutrosProtocolos ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {/* Anexo */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Anexo
            </label>
            <input
              type="file"
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;
                
                const uploadPromises = files.map(async (file) => {
                  try {
                    const resultado = await anexosAPI.upload(file, formData.tipo);
                    return resultado.url;
                  } catch (error) {
                    console.error('Erro ao fazer upload do anexo:', error);
                    toast.error(`Erro ao fazer upload de ${file.name}: ${error.message}`);
                    return null;
                  }
                });
                
                const urls = await Promise.all(uploadPromises);
                const urlsValidas = urls.filter(url => url !== null);
                
                setFormData(prev => ({ 
                  ...prev, 
                  anexos: [...prev.anexos, ...urlsValidas]
                }));
                
                if (urlsValidas.length > 0) {
                  toast.success(`${urlsValidas.length} arquivo(s) enviado(s) com sucesso`);
                }
              }}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
            />
            <small className="text-xs text-gray-600 dark:text-gray-400">
              Você pode selecionar múltiplos arquivos. Os arquivos serão enviados automaticamente.
            </small>
            {formData.anexos.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Arquivos enviados ({formData.anexos.length}):
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                  {formData.anexos.map((url, index) => (
                    <li key={index} className="truncate">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Anexo {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Modal Outros Protocolos */}
        {mostrarModalOutrosProtocolos && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold velohub-title">
                  Outros Protocolos Encontrados ({outrosProtocolosRegistros.length})
                </h3>
                <button
                  onClick={() => {
                    setMostrarModalOutrosProtocolos(false);
                    setProtocoloExpandido(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {outrosProtocolosRegistros.map((protocolo, index) => (
                  <div
                    key={index}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setProtocoloExpandido(protocoloExpandido === index ? null : index)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {protocolo.tipo || 'Sem tipo'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {protocolo.nome || 'Sem nome'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          CPF: {protocolo.cpf ? `${protocolo.cpf.substring(0, 3)}***${protocolo.cpf.substring(9)}` : 'N/A'}
                        </div>
                        {protocolo.createdAt && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Criado em: {formatDateRegistro(protocolo.createdAt)}
                          </div>
                        )}
                      </div>
                      <button className="text-blue-600 dark:text-blue-400">
                        {protocoloExpandido === index ? '▼' : '▶'}
                      </button>
                    </div>

                    {protocoloExpandido === index && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                          {JSON.stringify(protocolo, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  /**
   * Renderizar campos específicos Procon
   */
  const renderCamposProcon = () => {
    // Validar Código Procon (16 caracteres)
    const validarCodigoProcon = (codigo) => {
      return codigo && codigo.length === 16;
    };

    return (
      <>
        {/* Reclamação Procon */}
        <div className="velohub-card">
          <h3 className="text-xl font-semibold mb-4 velohub-title">Reclamação</h3>
          
          {/* Linha 1: Origem | Código Procon | Data Procon | Produto */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Origem *
              </label>
              <select
                value={formData.origem}
                onChange={(e) => setFormData(prev => ({ ...prev, origem: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              >
                <option value="">Selecione...</option>
                <option value="Procon">Procon</option>
                <option value="Consumidor.gov">Consumidor.gov</option>
              </select>
              {errors.origem && (
                <span className="text-red-500 text-xs">{errors.origem}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Código Procon (16 caracteres) *
              </label>
              <input
                type="text"
                value={formData.codigoProcon}
                onChange={(e) => {
                  const valor = e.target.value.slice(0, 16);
                  setFormData(prev => ({ ...prev, codigoProcon: valor }));
                }}
                className={`w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                  validarCodigoProcon(formData.codigoProcon) ? 'border-green-500 border-2' : 'border-gray-400 dark:border-gray-500'
                }`}
                placeholder="Digite o código Procon"
                maxLength={16}
                required
              />
              {errors.codigoProcon && (
                <span className="text-red-500 text-xs">{errors.codigoProcon}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Data Procon *
              </label>
              <input
                type="date"
                value={formData.dataProcon}
                onChange={(e) => setFormData(prev => ({ ...prev, dataProcon: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              />
              {errors.dataProcon && (
                <span className="text-red-500 text-xs">{errors.dataProcon}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Produto *
              </label>
              <select
                value={formData.produto}
                onChange={(e) => setFormData(prev => ({ ...prev, produto: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              >
                <option value="">Selecione...</option>
                <option value="Antecipação 2026">Antecipação 2026</option>
              <option value="Antecipação">Antecipação Outros Anos</option>
                <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                <option value="Crédito Trabalhador">Crédito Trabalhador</option>
                <option value="Cupons Velotax">Cupons Velotax</option>
                <option value="QueroQuitar">QueroQuitar</option>
                <option value="Seguro DividaZero">Seguro DividaZero</option>
                <option value="Seguro Celular">Seguro Celular</option>
                <option value="Seguro Prestamista">Seguro Prestamista</option>
                <option value="Seguro Saúde">Seguro Saúde</option>
                <option value="Calculadora">Calculadora</option>
                <option value="App">App</option>
                <option value="Outras Ocorrências">Outras Ocorrências</option>
              </select>
              {errors.produto && (
                <span className="text-red-500 text-xs">{errors.produto}</span>
              )}
            </div>
          </div>

          {/* Linha 2: Motivo */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            {renderCampoMotivo(
              MOTIVOS_REDUZIDOS,
              formData.motivoReduzido,
              (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
              errors.motivoReduzido,
              'Motivo *',
              'motivo-procon'
            )}
          </div>

          {/* Linha 3: Descrição */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Descrição
            </label>
            <textarea
              value={formData.motivoDetalhado}
              onChange={(e) => setFormData(prev => ({ ...prev, motivoDetalhado: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={4}
              placeholder="Descreva detalhadamente a reclamação..."
            />
          </div>

          {/* Linha 4: Solução Apresentada */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Solução Apresentada
            </label>
            <textarea
              value={formData.solucaoApresentada}
              onChange={(e) => setFormData(prev => ({ ...prev, solucaoApresentada: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={4}
              placeholder="Descreva a solução apresentada..."
            />
          </div>

          {/* Linha 5: Processo Administrativo | Cliente Desistiu | Processo Encaminhado | Processo Encerrado */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-start">
            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Processo Administrativo
              </label>
              <select
                value={formData.processoAdministrativo}
                onChange={(e) => setFormData(prev => ({ ...prev, processoAdministrativo: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="Sim - Status Não Atendido">Sim - Status Não Atendido</option>
                <option value="Não - Status Atendido">Não - Status Atendido</option>
                <option value="Sem Interação do Cliente">Sem Interação do Cliente</option>
              </select>
            </div>

            <div className="flex items-center" style={{ paddingTop: '1.5rem' }}>
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.clienteDesistiu}
                  onChange={(e) => setFormData(prev => ({ ...prev, clienteDesistiu: e.target.checked }))}
                  className="w-5 h-5"
                />
                <span>Cliente Desistiu</span>
              </label>
            </div>

            <div>
              <div className="flex items-center" style={{ paddingTop: '1.5rem' }}>
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.encaminhadoJuridico}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        encaminhadoJuridico: e.target.checked,
                        processoEncaminhadoResponsavel: e.target.checked ? '' : '',
                        processoEncaminhadoData: e.target.checked ? '' : ''
                      }));
                    }}
                    className="w-5 h-5"
                  />
                  <span>Processo Encaminhado</span>
                </label>
              </div>
              {formData.encaminhadoJuridico && (
                <div className="mt-2 space-y-2">
                  <select
                    value={formData.processoEncaminhadoResponsavel}
                    onChange={(e) => setFormData(prev => ({ ...prev, processoEncaminhadoResponsavel: e.target.value }))}
                    className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="Tadeu">Tadeu</option>
                    <option value="Aline">Aline</option>
                    <option value="Celcoin">Celcoin</option>
                  </select>
                  <input
                    type="date"
                    value={formData.processoEncaminhadoData}
                    onChange={(e) => setFormData(prev => ({ ...prev, processoEncaminhadoData: e.target.value }))}
                    className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Data do encaminhamento"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center" style={{ paddingTop: '1.5rem' }}>
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.processoEncerrado}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        processoEncerrado: e.target.checked,
                        dataProcessoEncerrado: e.target.checked ? new Date().toISOString().split('T')[0] : ''
                      }));
                    }}
                    className="w-5 h-5"
                  />
                  <span>Processo Encerrado</span>
                </label>
              </div>
              {formData.processoEncerrado && (
                <input
                  type="date"
                  value={formData.dataProcessoEncerrado}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataProcessoEncerrado: e.target.value }))}
                  className="w-full mt-2 border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Data do encerramento"
                />
              )}
            </div>
          </div>

          {/* Localizar — fora do grid */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => localizarAtendimentos('PROCON')}
              disabled={buscandoReclameAqui || !formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11}
              className="px-4 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              style={{
                borderColor: '#006AB9',
                color: '#006AB9',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                  e.target.style.color = '#F3F7FC';
                  e.target.style.borderColor = '#006AB9';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.target.disabled) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#006AB9';
                  e.target.style.borderColor = '#006AB9';
                }
              }}
            >
              {buscandoReclameAqui ? 'Buscando...' : 'Localizar Atendimentos e Protocolos'}
            </button>
            <input
              type="text"
              value={formData.registrosReclameAqui}
              readOnly
              className="min-w-0 max-w-md border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed text-sm"
              placeholder=""
            />
          </div>

          {/* Grid 4×2 — L2C4 vazio (md); Procon omitido neste form */}
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 mb-4">
            <div>
              <div className="flex items-center mb-2">
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.acionouCentral}
                    onChange={(e) => setFormData(prev => ({ ...prev, acionouCentral: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <span>Atendimento N1</span>
                </label>
              </div>
              {formData.acionouCentral && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Nro Protocolo
                  </label>
                  {formData.protocolosCentral.map((protocolo, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={protocolo}
                        onChange={(e) => atualizarProtocolo('protocolosCentral', index, e.target.value)}
                        className="flex-1 border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Digite o protocolo"
                      />
                      {formData.protocolosCentral.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerProtocolo('protocolosCentral', index)}
                          className="text-sm px-3 py-2 rounded border dark:bg-gray-700"
                          style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent' }}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => adicionarProtocolo('protocolosCentral')}
                    className="text-sm px-3 py-2 rounded border dark:bg-gray-700"
                    style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
                  >
                    + Adicionar Protocolo
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center mb-2">
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.n2SegundoNivel}
                    onChange={(e) => setFormData(prev => ({ ...prev, n2SegundoNivel: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <span>N2 Ouvidoria</span>
                </label>
              </div>
              {formData.n2SegundoNivel && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Protocolos N2
                  </label>
                  {formData.protocolosN2.map((protocolo, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={protocolo}
                        onChange={(e) => atualizarProtocolo('protocolosN2', index, e.target.value)}
                        className="flex-1 border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Digite o protocolo"
                      />
                      {formData.protocolosN2.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerProtocolo('protocolosN2', index)}
                          className="text-sm px-3 py-2 rounded border dark:bg-gray-700"
                          style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent' }}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => adicionarProtocolo('protocolosN2')}
                    className="text-sm px-3 py-2 rounded border dark:bg-gray-700"
                    style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
                  >
                    + Adicionar Protocolo
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center mb-2">
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.pixLiberado === true}
                    onChange={(e) => setFormData(prev => ({ ...prev, pixLiberado: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <span>Pix Liberado</span>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="w-5 h-5 shrink-0"
                  checked={formData.semRespostaCliente === true}
                  onChange={(e) => setFormData((prev) => ({ ...prev, semRespostaCliente: e.target.checked }))}
                />
                <span>Sem Resposta do Cliente</span>
              </label>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.reclameAqui}
                    onChange={(e) => setFormData(prev => ({ ...prev, reclameAqui: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <span>Reclame Aqui</span>
                </label>
              </div>
              {formData.reclameAqui && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Protocolos Reclame Aqui
                  </label>
                  {formData.protocolosReclameAqui.map((protocolo, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={protocolo}
                        onChange={(e) => atualizarProtocolo('protocolosReclameAqui', index, e.target.value)}
                        className="flex-1 border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Digite o protocolo"
                      />
                      {formData.protocolosReclameAqui.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerProtocolo('protocolosReclameAqui', index)}
                          className="text-sm px-3 py-2 rounded border dark:bg-gray-700"
                          style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent' }}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => adicionarProtocolo('protocolosReclameAqui')}
                    className="text-sm px-3 py-2 rounded border dark:bg-gray-700"
                    style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
                  >
                    + Adicionar Protocolo
                  </button>
                </div>
              )}
            </div>

            <div className="hidden md:block min-h-0" aria-hidden="true" />

            <div>
              <div className="flex items-center mb-2">
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.statusContratoQuitado}
                    onChange={(e) => setFormData(prev => ({ ...prev, statusContratoQuitado: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <span>Contrato Quitado</span>
                </label>
              </div>
            </div>

            <div className="hidden md:block min-h-0" aria-hidden="true" />
          </div>

          {/* Anexo */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Anexo
            </label>
            <input
              type="file"
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;
                
                const uploadPromises = files.map(async (file) => {
                  try {
                    const resultado = await anexosAPI.upload(file, formData.tipo);
                    return resultado.url;
                  } catch (error) {
                    console.error('Erro ao fazer upload do anexo:', error);
                    toast.error(`Erro ao fazer upload de ${file.name}: ${error.message}`);
                    return null;
                  }
                });
                
                const urls = await Promise.all(uploadPromises);
                const urlsValidas = urls.filter(url => url !== null);
                
                setFormData(prev => ({ 
                  ...prev, 
                  anexos: [...prev.anexos, ...urlsValidas]
                }));
                
                if (urlsValidas.length > 0) {
                  toast.success(`${urlsValidas.length} arquivo(s) enviado(s) com sucesso`);
                }
              }}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
            />
            <small className="text-xs text-gray-600 dark:text-gray-400">
              Você pode selecionar múltiplos arquivos. Os arquivos serão enviados automaticamente.
            </small>
            {formData.anexos.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Arquivos enviados ({formData.anexos.length}):
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                  {formData.anexos.map((url, index) => (
                    <li key={index} className="truncate">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Anexo {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  /**
   * Renderizar tentativas de contato (BACEN/Ouvidoria)
   */
  const renderTentativasContato = () => {

    return (
      <div className="velohub-card">
        <h3 className="text-xl font-semibold mb-4 velohub-title">Tentativas de Contato</h3>
        
        {formData.tentativasContato.lista.map((tentativa, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {index + 1}ª tentativa
              </label>
              <input
                type="date"
                value={tentativa.data}
                onChange={(e) => {
                  const novasTentativas = [...formData.tentativasContato.lista];
                  novasTentativas[index].data = e.target.value;
                  setFormData(prev => ({ ...prev, tentativasContato: { lista: novasTentativas } }));
                }}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Meio
              </label>
              <select
                value={tentativa.meio}
                onChange={(e) => {
                  const novasTentativas = [...formData.tentativasContato.lista];
                  novasTentativas[index].meio = e.target.value;
                  setFormData(prev => ({ ...prev, tentativasContato: { lista: novasTentativas } }));
                }}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="Telefone">Telefone</option>
                <option value="Whatsapp">Whatsapp</option>
                <option value="Email">Email</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Resultado
              </label>
              <input
                type="text"
                value={tentativa.resultado}
                onChange={(e) => {
                  const novasTentativas = [...formData.tentativasContato.lista];
                  novasTentativas[index].resultado = e.target.value;
                  setFormData(prev => ({ ...prev, tentativasContato: { lista: novasTentativas } }));
                }}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Resultado do contato"
              />
            </div>
            {formData.tentativasContato.lista.length > 1 && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removerTentativa(index)}
                  className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
                  style={{
                    borderColor: '#dc2626',
                    color: '#dc2626',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#dc2626';
                    e.target.style.color = '#F3F7FC';
                    e.target.style.borderColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#dc2626';
                    e.target.style.borderColor = '#dc2626';
                  }}
                >
                  Remover
                </button>
              </div>
            )}
          </div>
        ))}
        
        <button
          type="button"
          onClick={adicionarTentativa}
          className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
          style={{
            borderColor: '#006AB9',
            color: '#006AB9',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
            e.target.style.color = '#F3F7FC';
            e.target.style.borderColor = '#006AB9';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#006AB9';
            e.target.style.borderColor = '#006AB9';
          }}
        >
          + Adicionar Tentativa
        </button>
      </div>
    );
  };

  /**
   * Renderizar protocolos (BACEN/Ouvidoria)
   */
  const renderProtocolos = () => {

    return (
      <div className="velohub-card">
        <h3 className="text-xl font-semibold mb-4 velohub-title">Canais de Atendimento e Protocolos Acionados</h3>

        {/* Localizar Atendimentos — fora do grid de checkboxes */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => localizarAtendimentos(formData.tipo)}
            disabled={buscandoReclameAqui || !formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11}
            className="px-4 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            style={{
              borderColor: '#006AB9',
              color: '#006AB9',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                e.target.style.color = '#F3F7FC';
                e.target.style.borderColor = '#006AB9';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.target.disabled) {
                e.target.style.background = 'transparent';
                e.target.style.color = '#006AB9';
                e.target.style.borderColor = '#006AB9';
              }
            }}
          >
            {buscandoReclameAqui ? 'Buscando...' : 'Localizar Atendimentos e Protocolos'}
          </button>
          <input
            type="text"
            value={formData.localizarAtendimentos}
            readOnly
            className="min-w-0 max-w-md border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed text-sm"
            placeholder=""
          />
        </div>

        {/* Grid 4×2 checkboxes — L2C4 vazio (md) */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 mb-4">
          {/* Atendimento N1 */}
          <div>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.acionouCentral}
                  onChange={(e) => setFormData(prev => ({ ...prev, acionouCentral: e.target.checked }))}
                  className="mr-2"
                />
                <span>Atendimento N1</span>
              </label>
            </div>
            {formData.acionouCentral && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Nro Protocolo
                </label>
                {formData.protocolosCentral.map((protocolo, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={protocolo}
                      onChange={(e) => atualizarProtocolo('protocolosCentral', index, e.target.value)}
                      className="flex-1 border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Digite o protocolo"
                    />
                    {formData.protocolosCentral.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerProtocolo('protocolosCentral', index)}
                        className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
                        style={{
                          borderColor: '#dc2626',
                          color: '#dc2626',
                          background: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#dc2626';
                          e.target.style.color = '#F3F7FC';
                          e.target.style.borderColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = '#dc2626';
                          e.target.style.borderColor = '#dc2626';
                        }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => adicionarProtocolo('protocolosCentral')}
                  className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
                  style={{
                    borderColor: '#006AB9',
                    color: '#006AB9',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                    e.target.style.color = '#F3F7FC';
                    e.target.style.borderColor = '#006AB9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#006AB9';
                    e.target.style.borderColor = '#006AB9';
                  }}
                >
                  + Adicionar Protocolo
                </button>
              </div>
            )}
          </div>

          {/* Escalado N2 - oculto no form N2 Pix: coluna vazia mantém Pix na 3ª posição */}
          {formData.tipo !== 'OUVIDORIA' ? (
          <div>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.n2SegundoNivel}
                  onChange={(e) => setFormData(prev => ({ ...prev, n2SegundoNivel: e.target.checked }))}
                  className="mr-2"
                />
                <span>Escalado N2</span>
              </label>
            </div>
            {formData.n2SegundoNivel && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Qual Protocolo - Escalado N2
                </label>
                {formData.protocolosN2.map((protocolo, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={protocolo}
                      onChange={(e) => atualizarProtocolo('protocolosN2', index, e.target.value)}
                      className="flex-1 border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Digite o protocolo"
                    />
                    {formData.protocolosN2.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerProtocolo('protocolosN2', index)}
                        className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
                        style={{
                          borderColor: '#dc2626',
                          color: '#dc2626',
                          background: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#dc2626';
                          e.target.style.color = '#F3F7FC';
                          e.target.style.borderColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = '#dc2626';
                          e.target.style.borderColor = '#dc2626';
                        }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => adicionarProtocolo('protocolosN2')}
                  className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
                  style={{
                    borderColor: '#006AB9',
                    color: '#006AB9',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                    e.target.style.color = '#F3F7FC';
                    e.target.style.borderColor = '#006AB9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#006AB9';
                    e.target.style.borderColor = '#006AB9';
                  }}
                >
                  + Adicionar Protocolo
                </button>
              </div>
            )}
          </div>
          ) : (
            <div className="hidden md:block min-h-0" aria-hidden="true" />
          )}

          <div>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.pixLiberado === true}
                  onChange={(e) => setFormData(prev => ({ ...prev, pixLiberado: e.target.checked }))}
                  className="mr-2"
                />
                <span>Pix Liberado</span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="w-5 h-5 shrink-0"
                checked={formData.semRespostaCliente === true}
                onChange={(e) => setFormData((prev) => ({ ...prev, semRespostaCliente: e.target.checked }))}
              />
              <span>Sem Resposta do Cliente</span>
            </label>
          </div>

          {/* L2C1 Reclame Aqui — oculto no form Reclame Aqui */}
          {formData.tipo !== 'RECLAME_AQUI' ? (
          <div>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.reclameAqui}
                  onChange={(e) => setFormData(prev => ({ ...prev, reclameAqui: e.target.checked }))}
                  className="mr-2"
                />
                <span>Reclame Aqui</span>
              </label>
            </div>
            {formData.reclameAqui && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Qual Protocolo - Reclame Aqui
                </label>
                {formData.protocolosReclameAqui.map((protocolo, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={protocolo}
                      onChange={(e) => atualizarProtocolo('protocolosReclameAqui', index, e.target.value)}
                      className="flex-1 border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Digite o protocolo"
                    />
                    {formData.protocolosReclameAqui.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerProtocolo('protocolosReclameAqui', index)}
                        className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
                        style={{
                          borderColor: '#dc2626',
                          color: '#dc2626',
                          background: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#dc2626';
                          e.target.style.color = '#F3F7FC';
                          e.target.style.borderColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = '#dc2626';
                          e.target.style.borderColor = '#dc2626';
                        }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => adicionarProtocolo('protocolosReclameAqui')}
                  className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
                  style={{
                    borderColor: '#006AB9',
                    color: '#006AB9',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                    e.target.style.color = '#F3F7FC';
                    e.target.style.borderColor = '#006AB9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#006AB9';
                    e.target.style.borderColor = '#006AB9';
                  }}
                >
                  + Adicionar Protocolo
                </button>
              </div>
            )}
          </div>
          ) : (
            <div className="hidden md:block min-h-0" aria-hidden="true" />
          )}

          {/* L2C2 Procon — oculto no form Procon */}
          {formData.tipo !== 'PROCON' ? (
          <div>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.procon}
                  onChange={(e) => setFormData(prev => ({ ...prev, procon: e.target.checked }))}
                  className="mr-2"
                />
                <span>Procon</span>
              </label>
            </div>
            {formData.procon && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Qual Protocolo - Procon
                </label>
                {formData.protocolosProcon.map((protocolo, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={protocolo}
                      onChange={(e) => atualizarProtocolo('protocolosProcon', index, e.target.value)}
                      className="flex-1 border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Digite o protocolo"
                    />
                    {formData.protocolosProcon.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerProtocolo('protocolosProcon', index)}
                        className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
                        style={{
                          borderColor: '#dc2626',
                          color: '#dc2626',
                          background: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#dc2626';
                          e.target.style.color = '#F3F7FC';
                          e.target.style.borderColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = '#dc2626';
                          e.target.style.borderColor = '#dc2626';
                        }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => adicionarProtocolo('protocolosProcon')}
                  className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
                  style={{
                    borderColor: '#006AB9',
                    color: '#006AB9',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                    e.target.style.color = '#F3F7FC';
                    e.target.style.borderColor = '#006AB9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#006AB9';
                    e.target.style.borderColor = '#006AB9';
                  }}
                >
                  + Adicionar Protocolo
                </button>
              </div>
            )}
          </div>
          ) : (
            <div className="hidden md:block min-h-0" aria-hidden="true" />
          )}

          {/* L2C3 Contrato quitado */}
          <div>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.statusContratoQuitado}
                  onChange={(e) => setFormData(prev => ({ ...prev, statusContratoQuitado: e.target.checked }))}
                  className="mr-2"
                />
                <span>Contrato Quitado</span>
              </label>
            </div>
          </div>

          {/* L2C4 reservado vazio */}
          <div className="hidden md:block min-h-0" aria-hidden="true" />
        </div>
      </div>
    );
  };


  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campo Tipo - Topo, lado esquerdo */}
        <div className="flex justify-start">
          <div className="w-full md:w-auto md:min-w-[250px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Tipo de Reclamação *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => {
                const novoTipo = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  tipo: novoTipo,
                  // Resetar campos específicos ao mudar tipo
                  origem: '',
                  anexos: [],
                  motivoReduzido: [],
                  motivoDetalhado: '',
                  dataEntradaN2: '',
                  origem: '',
                  produto: '',
                  cpfRepetido: '',
                  idEntrada: '',
                  dataReclam: '',
                  passivelNotaMais: false,
                  solicitadoAvaliacao: false,
                  avaliado: false,
                  codigoProcon: '',
                  dataProcon: '',
                  solucaoApresentada: '',
                  processoAdministrativo: '',
                  clienteDesistiu: false,
                  encaminhadoJuridico: false,
                  processoEncaminhadoResponsavel: '',
                  processoEncaminhadoData: '',
                  processoEncerrado: false,
                  dataProcessoEncerrado: '',
                  registrosReclameAqui: '',
                }));
                setErrors({});
              }}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            >
              <option value="BACEN">Bacen</option>
              <option value="OUVIDORIA">N2 Pix</option>
              <option value="RECLAME_AQUI">Reclame Aqui</option>
              <option value="PROCON">Procon</option>
              <option value="PROCESSOS">Ação Judicial</option>
            </select>
            {errors.tipo && (
              <span className="text-red-500 text-xs">{errors.tipo}</span>
            )}
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="velohub-card">
          <h3 className="text-xl font-semibold mb-4 velohub-title">Dados do Cliente</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Nome do Cliente *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              />
              {errors.nome && (
                <span className="text-red-500 text-xs">{errors.nome}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                CPF (000.000.000-00) *
              </label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value);
                  setFormData(prev => ({ ...prev, cpf: formatted }));
                }}
                className={`w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white ${
                  validarCPF(formData.cpf) ? 'border-green-500' : 'border-gray-400 dark:border-gray-500'
                } focus:ring-1 focus:ring-blue-500`}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
              {errors.cpf && (
                <span className="text-red-500 text-xs">{errors.cpf}</span>
              )}
            </div>
          </div>

          {/* Telefones e Email */}
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Telefone
              </label>
              {formData.telefones.lista.map((telefone, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => atualizarTelefone(index, e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                      telefone && telefone.replace(/\D/g, '').length >= 10 
                        ? 'border-2 border-green-500' 
                        : 'border border-gray-400 dark:border-gray-500'
                    }`}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                {formData.telefones.lista.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerTelefone(index)}
                    className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
                    style={{
                      borderColor: '#dc2626',
                      color: '#dc2626',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#dc2626';
                      e.target.style.color = '#F3F7FC';
                      e.target.style.borderColor = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#dc2626';
                      e.target.style.borderColor = '#dc2626';
                    }}
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={adicionarTelefone}
              className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
              style={{
                borderColor: '#006AB9',
                color: '#006AB9',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                e.target.style.color = '#F3F7FC';
                e.target.style.borderColor = '#006AB9';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#006AB9';
                e.target.style.borderColor = '#006AB9';
              }}
            >
              + Adicionar Telefone
            </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  const emailFormatado = formatarEmail(e.target.value);
                  setFormData(prev => ({ ...prev, email: emailFormatado }));
                }}
                className={`w-full rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                  formData.email && validarEmail(formData.email) 
                    ? 'border-2 border-green-500' 
                    : 'border border-gray-400 dark:border-gray-500'
                }`}
                placeholder="email@exemplo.com"
              />
              {errors.email && (
                <span className="text-red-500 text-xs">{errors.email}</span>
              )}
            </div>
          </div>
        </div>

        {/* Campos específicos por tipo */}
        {formData.tipo === 'BACEN' && renderCamposBacen()}
        {formData.tipo === 'OUVIDORIA' && renderCamposN2()}
        {formData.tipo === 'RECLAME_AQUI' && renderCamposReclameAqui()}
        {formData.tipo === 'PROCON' && renderCamposProcon()}
        {formData.tipo === 'PROCESSOS' && renderCamposProcessos()}

        {/* Tentativas de Contato (BACEN/N2 apenas) */}
        {(formData.tipo === 'BACEN' || formData.tipo === 'OUVIDORIA') && renderTentativasContato()}

        {/* Protocolos (BACEN/N2/Reclame Aqui) */}
        {(formData.tipo === 'BACEN' || formData.tipo === 'OUVIDORIA' || formData.tipo === 'RECLAME_AQUI') && renderProtocolos()}

        {/* Status PIX e Contrato */}

        {/* Observações */}
        <div className="velohub-card">
          <h3 className="text-xl font-semibold mb-4 velohub-title">Observações</h3>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={4}
              placeholder="Digite as observações..."
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4 relative">
          <button
            type="button"
            onClick={resetFormulario}
            className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
            style={{
              borderColor: '#006AB9',
              color: '#006AB9',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
              e.target.style.color = '#F3F7FC';
              e.target.style.borderColor = '#006AB9';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#006AB9';
              e.target.style.borderColor = '#006AB9';
            }}
          >
            Limpar
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={(e) => handleSubmit(e)}
              disabled={loading}
              className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
              style={{
                borderColor: '#006AB9',
                color: '#006AB9',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                  e.target.style.color = '#F3F7FC';
                  e.target.style.borderColor = '#006AB9';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#006AB9';
                  e.target.style.borderColor = '#006AB9';
                }
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  Salvar Reclamação
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
            
            {/* Dropdown de opções */}
            {showSaveOptions && !loading && (
              <div 
                className="absolute right-0 bottom-full mb-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 z-50"
                style={{
                  border: '1px solid #1634FF'
                }}
              >
                <div className="py-1" role="menu">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'em-andamento')}
                    className="block w-full text-left px-4 py-2 text-sm transition-colors font-medium"
                    style={{
                      color: '#F3F7FC',
                      backgroundColor: 'rgba(0, 106, 185, 0.7)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(0, 90, 158, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(0, 106, 185, 0.7)';
                    }}
                    role="menuitem"
                  >
                    Em Andamento
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'resolvido')}
                    className="block w-full text-left px-4 py-2 text-sm transition-colors font-medium"
                    style={{
                      color: '#F3F7FC',
                      backgroundColor: 'rgba(21, 162, 55, 0.7)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(18, 138, 46, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(21, 162, 55, 0.7)';
                    }}
                    role="menuitem"
                  >
                    Resolvido
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Modal de Registros Reclame Aqui (para Procon) */}
      {mostrarModalReclameAqui && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center backdrop-blur-sm p-4 z-50"
          onClick={() => setMostrarModalReclameAqui(false)}
        >
          <div
            className="rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold velohub-title">
                Registros Reclame Aqui Encontrados ({reclameAquiRegistros.length})
              </h3>
              <button
                onClick={() => setMostrarModalReclameAqui(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {reclameAquiRegistros.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">Nenhum registro encontrado.</p>
              ) : (
                <div className="space-y-4">
                  {reclameAquiRegistros.map((registro, index) => (
                    <div
                      key={registro._id || index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            ID Entrada: <span className="font-normal">{registro.idEntrada || 'N/A'}</span>
                          </p>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Data Reclamação: <span className="font-normal">
                              {registro.dataReclam ? formatDateRegistro(registro.dataReclam) : 'N/A'}
                            </span>
                          </p>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Motivo: <span className="font-normal">{registro.motivoReduzido || 'N/A'}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Responsável: <span className="font-normal">{registro.responsavel || 'N/A'}</span>
                          </p>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Status: <span className="font-normal">
                              {registro.Finalizado?.Resolvido ? 'Resolvido' : 'Em Aberto'}
                            </span>
                          </p>
                          {registro.motivoDetalhado && (
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                              Descrição: <span className="font-normal text-xs">{registro.motivoDetalhado}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormReclamacao;
