/**
 * VeloHub V3 - FormReclamacaoEdit Component
 * VERSION: v1.10.2 | DATE: 2026-02-25 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.10.2:
 * - Valores dos campos Motivos e Produto convertidos para primeira letra maiúscula
 * 
 * Mudanças v1.10.0:
 * - Atualizado campo Motivos (BACEN e N2 Pix) com novos valores: abatimento de juros, cancelamento, cobrança, encerramento de conta, erro, fraude, lgpd, liberação chave pix, superendividamento
 * - Atualizado campo Produto do formulário N2 Pix com novos valores: antecipação, crédito pessoal, crédito trabalhador, cupons, seguros
 * 
 * Mudanças v1.9.0:
 * - Campo Origem do formulário N2 Pix: removidos valores "Telefone" e "Ticket", adicionado valor "Atendimento"
 * 
 * Mudanças v1.6.0:
 * - Campo Motivo agora usa dropdown que adiciona opções selecionadas ao campo
 * - Motivos selecionados aparecem como tags removíveis dentro do campo
 * - Dropdown mostra apenas motivos ainda não selecionados
 * - Interface mais limpa e compacta
 * 
 * Mudanças v1.5.0:
 * - Campo Motivo agora permite múltipla escolha em TODOS os tipos de reclamação
 * - Criada função renderCampoMotivo para padronizar exibição de checkboxes de motivos
 * - converterParaFormData atualizado para converter motivoReduzido string para array quando necessário
 * - Validação atualizada para verificar se pelo menos um motivo foi selecionado
 * - handleSubmit atualizado para enviar array de motivos em todos os tipos
 * 
 * Mudanças v1.4.0:
 * - Adicionado suporte para tipo de reclamação "Procon"
 * - Criada função renderCamposProcon() com todos os campos específicos
 * - Adicionada função de busca automática de registros Reclame Aqui por CPF com modal de exibição
 * - Adicionada validação para campos do Procon
 * - Atualizado submit para incluir campos do Procon
 * - Protocolos e Canais de Atendimento agora aparecem também para Procon
 * - Tentativas de Contato não aparecem para Procon
 * 
 * Mudanças v1.3.0:
 * - Adicionado suporte para tipo de reclamação "Reclame Aqui"
 * - Criada função renderCamposReclameAqui() com todos os campos específicos
 * - Adicionada validação para campos do Reclame Aqui
 * - Atualizado submit para incluir campos do Reclame Aqui
 * - Protocolos e Canais de Atendimento agora aparecem também para Reclame Aqui
 * - Tentativas de Contato não aparecem para Reclame Aqui
 * 
 * Mudanças v1.2.0:
 * - Removido campo casosCriticos (não conectado ao formulário principal)
 * 
 * Mudanças v1.1.0:
 * - Removido campo status (usar Finalizado.Resolvido para determinar se está em andamento ou resolvido)
 * - Removido campo mes do formulário OUVIDORIA
 * 
 * Componente de formulário para edição de reclamações BACEN, Ouvidoria e Reclame Aqui
 * Baseado no FormReclamacao.js mas adaptado para edição
 */

import React, { useState, useEffect, useRef } from 'react';
import { reclamacoesAPI, anexosAPI } from '../../services/ouvidoriaApi';
import toast from 'react-hot-toast';

// Importar funções auxiliares e constantes do FormReclamacao
// Por enquanto, vou duplicar as funções essenciais aqui
const formatCPFInput = (value) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return cleaned.replace(/(\d{3})(\d+)/, '$1.$2');
  if (cleaned.length <= 9) return cleaned.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  if (cleaned.length <= 11) return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
  return value;
};

const formatTelefone = (value) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  if (cleaned.length <= 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  return value;
};

const formatarEmail = (valor) => {
  return String(valor || '').toLowerCase().trim().replace(/\s+/g, '');
};

const validarEmail = (valor) => {
  const email = String(valor || '').trim();
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
  return emailRegex.test(email);
};

const validarCPF = (cpf) => {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.length === 11;
};

/**
 * Opções de motivo reduzido (BACEN/N2)
 * VERSION: v1.3.2 | DATE: 2026-02-25 | Primeira letra maiúscula
 * 
 * Motivos disponíveis para formulários BACEN e N2 Pix:
 * - Abatimento de juros
 * - Cancelamento
 * - Cobrança
 * - Encerramento de conta
 * - Erro
 * - Fraude
 * - Lgpd
 * - Liberação chave pix
 * - Superendividamento
 */
const MOTIVOS_REDUZIDOS = [
  'Abatimento de juros',
  'Cancelamento',
  'Cobrança',
  'Encerramento de conta',
  'Erro',
  'Fraude',
  'Lgpd',
  'Liberação chave pix',
  'Superendividamento'
];

/**
 * Opções de motivo para Ação Judicial (múltipla escolha)
 */
const MOTIVOS_ACAO_JUDICIAL = [
  'Juros',
  'Chave Pix',
  'Restituição BB',
  'Relatório',
  'Repetição Indébito',
  'Superendividamento',
  'Desconhece Contratação'
];

/**
 * Converter dados da reclamação para formData
 */
const converterParaFormData = (reclamacao) => {
  if (!reclamacao) return null;

  // Formatar data para input date (YYYY-MM-DD)
  const formatarDataInput = (data) => {
    if (!data) return '';
    try {
      const date = new Date(data);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Normalizar tipo (API pode retornar diferentes formatos mas código espera formatos específicos)
  let tipoNormalizado = reclamacao.tipo || 'BACEN';
  if (tipoNormalizado === 'Reclame Aqui' || tipoNormalizado === 'RECLAME AQUI') {
    tipoNormalizado = 'RECLAME_AQUI';
  } else if (tipoNormalizado === 'N2' || tipoNormalizado === 'N2 & Pix' || tipoNormalizado === 'N2&PIX') {
    tipoNormalizado = 'OUVIDORIA';
  } else if (tipoNormalizado === 'Procon' || tipoNormalizado === 'PROCON') {
    tipoNormalizado = 'PROCON';
  }

  return {
    // Campos comuns
    nome: reclamacao.nome || '',
    cpf: reclamacao.cpf ? formatCPFInput(reclamacao.cpf.replace(/\D/g, '')) : '',
    telefones: reclamacao.telefones?.lista?.length > 0 
      ? { lista: reclamacao.telefones.lista }
      : { lista: [''] },
    email: reclamacao.email || '',
    observacoes: reclamacao.observacoes || '',
    tipo: tipoNormalizado,
    
    // Campos BACEN
    dataEntrada: formatarDataInput(reclamacao.dataEntrada),
    origem: reclamacao.origem || '',
    produto: reclamacao.produto || '',
    anexos: reclamacao.anexos || [],
    prazoBacen: formatarDataInput(reclamacao.prazoBacen),
    motivoReduzido: Array.isArray(reclamacao.motivoReduzido) 
      ? reclamacao.motivoReduzido 
      : (reclamacao.motivoReduzido ? [reclamacao.motivoReduzido] : []),
    motivoDetalhado: reclamacao.motivoDetalhado || '',
    
    // Campos OUVIDORIA
    dataEntradaAtendimento: formatarDataInput(reclamacao.dataEntradaAtendimento),
    prazoOuvidoria: formatarDataInput(reclamacao.prazoOuvidoria),
    
    // Campos Reclame Aqui
    cpfRepetido: reclamacao.cpfRepetido || '',
    idEntrada: reclamacao.idEntrada || '',
    dataReclam: formatarDataInput(reclamacao.dataReclam),
    passivelNotaMais: reclamacao.passivelNotaMais || false,
    oportunidade: reclamacao.oportunidade || '',
    solicitadoAvaliacao: reclamacao.solicitadoAvaliacao || false,
    avaliado: reclamacao.avaliado || false,
    
    // Campos Procon
    codigoProcon: reclamacao.codigoProcon || '',
    dataProcon: formatarDataInput(reclamacao.dataProcon),
    solucaoApresentada: reclamacao.solucaoApresentada || '',
    processoAdministrativo: reclamacao.processoAdministrativo || '',
    clienteDesistiu: reclamacao.clienteDesistiu || false,
    encaminhadoJuridico: reclamacao.encaminhadoJuridico || false,
    processoEncaminhadoResponsavel: reclamacao.processoEncaminhadoResponsavel || '',
    processoEncaminhadoData: formatarDataInput(reclamacao.processoEncaminhadoData),
    processoEncerrado: reclamacao.processoEncerrado || false,
    dataProcessoEncerrado: formatarDataInput(reclamacao.dataProcessoEncerrado),
    registrosReclameAqui: reclamacao.registrosReclameAqui || '',
    
    // Campos compartilhados
    tentativasContato: reclamacao.tentativasContato?.lista?.length > 0
      ? { lista: reclamacao.tentativasContato.lista }
      : { lista: [{ data: '', meio: '', resultado: '' }] },
    acionouCentral: reclamacao.acionouCentral || false,
    protocolosCentral: reclamacao.protocolosCentral?.length > 0 
      ? reclamacao.protocolosCentral 
      : [''],
    n2SegundoNivel: reclamacao.n2SegundoNivel || false,
    protocolosN2: reclamacao.protocolosN2?.length > 0 
      ? reclamacao.protocolosN2 
      : [''],
    reclameAqui: reclamacao.reclameAqui || false,
    protocolosReclameAqui: reclamacao.protocolosReclameAqui?.length > 0 
      ? reclamacao.protocolosReclameAqui 
      : [''],
    procon: reclamacao.procon || false,
    protocolosProcon: reclamacao.protocolosProcon?.length > 0 
      ? reclamacao.protocolosProcon 
      : [''],
    pixStatus: reclamacao.pixStatus || '',
    statusContratoQuitado: reclamacao.statusContratoQuitado || false,
    statusContratoAberto: reclamacao.statusContratoAberto || false,
  };
};

const FormReclamacaoEdit = ({ reclamacao, onClose, onSuccess }) => {
  // Obter userEmail e responsavel da sessão
  const getUserSession = () => {
    try {
      const sessionData = 
        localStorage.getItem('veloacademy_user_session') ||
        localStorage.getItem('velohub_user_session') ||
        localStorage.getItem('user_session');
      
      if (sessionData) {
        return JSON.parse(sessionData);
      }
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
    }
    return null;
  };

  const session = getUserSession();
  const userEmail = session?.user?.email || session?.email || '';
  const responsavel = session?.user?.name || '';

  const [formData, setFormData] = useState(() => converterParaFormData(reclamacao) || {
    nome: '',
    cpf: '',
    telefones: { lista: [''] },
    email: '',
    observacoes: '',
    tipo: 'BACEN',
    dataEntrada: new Date().toISOString().split('T')[0],
    origem: '',
    produto: '',
    anexos: [],
    prazoBacen: '',
    motivoReduzido: [],
    motivoDetalhado: '',
    dataEntradaAtendimento: '',
    prazoOuvidoria: '',
    cpfRepetido: '',
    idEntrada: '',
    dataReclam: '',
    passivelNotaMais: false,
    oportunidade: '',
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
    tentativasContato: { lista: [{ data: '', meio: '', resultado: '' }] },
    acionouCentral: false,
    protocolosCentral: [''],
    n2SegundoNivel: false,
    protocolosN2: [''],
    reclameAqui: false,
    protocolosReclameAqui: [''],
    procon: false,
    protocolosProcon: [''],
    pixStatus: '',
    statusContratoQuitado: false,
    statusContratoAberto: false,
    enviarParaCobranca: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const dropdownRef = useRef(null);
  const [dropdownMotivoAberto, setDropdownMotivoAberto] = useState(null); // ID único do campo de motivo aberto
  const dropdownMotivoRefs = useRef({});

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

  // Atualizar formData quando reclamacao mudar
  useEffect(() => {
    if (reclamacao) {
      const novoFormData = converterParaFormData(reclamacao);
      if (novoFormData) {
        setFormData(novoFormData);
      }
    }
  }, [reclamacao]);

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

  // Validação condicional para prazoBacen
  useEffect(() => {
    if (formData.tipo === 'BACEN' && formData.origem === 'Consumidor.Gov') {
      if (!formData.prazoBacen) {
        setErrors(prev => ({ ...prev, prazoBacen: 'Prazo BACEN é obrigatório quando origem é Consumidor.Gov' }));
      } else {
        setErrors(prev => {
          const novos = { ...prev };
          delete novos.prazoBacen;
          return novos;
        });
      }
    }
  }, [formData.tipo, formData.origem, formData.prazoBacen]);

  /**
   * Validar formulário
   */
  const validarFormulario = () => {
    const novosErros = {};

    // Validações comuns
    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    }
    if (!validarCPF(formData.cpf)) {
      novosErros.cpf = 'CPF inválido';
    }

    // Validações BACEN
    if (formData.tipo === 'BACEN') {
      if (!formData.dataEntrada) {
        novosErros.dataEntrada = 'Data de entrada é obrigatória';
      }
      if (!formData.origem) {
        novosErros.origem = 'Natureza é obrigatória';
      }
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) {
        novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      }
      if (!formData.motivoDetalhado.trim()) {
        novosErros.motivoDetalhado = 'Descrição é obrigatória';
      }
    }

    // Validações OUVIDORIA
    if (formData.tipo === 'OUVIDORIA') {
      if (!formData.dataEntradaAtendimento) {
        novosErros.dataEntradaAtendimento = 'Data entrada atendimento é obrigatória';
      }
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) {
        novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      }
      if (!formData.origem) {
        novosErros.origem = 'Origem é obrigatória';
      }
    }
    
    // Validações RECLAME_AQUI
    if (formData.tipo === 'RECLAME_AQUI') {
      if (!formData.idEntrada || formData.idEntrada.replace(/\D/g, '').length !== 9) {
        novosErros.idEntrada = 'ID Entrada deve ter 9 dígitos numéricos';
      }
      if (!formData.dataReclam) {
        novosErros.dataReclam = 'Data Reclamação é obrigatória';
      }
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) {
        novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      }
    }
    
    // Validações PROCON
    if (formData.tipo === 'PROCON') {
      if (!formData.codigoProcon || formData.codigoProcon.length !== 16) {
        novosErros.codigoProcon = 'Código Procon deve ter 16 caracteres';
      }
      if (!formData.dataProcon) {
        novosErros.dataProcon = 'Data Procon é obrigatória';
      }
      if (!formData.produto) {
        novosErros.produto = 'Produto é obrigatório';
      }
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) {
        novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      }
    }
    
    // Validações RECLAME_AQUI
    if (formData.tipo === 'RECLAME_AQUI') {
      if (!formData.idEntrada || formData.idEntrada.replace(/\D/g, '').length !== 9) {
        novosErros.idEntrada = 'ID Entrada deve ter 9 dígitos numéricos';
      }
      if (!formData.dataReclam) {
        novosErros.dataReclam = 'Data Reclamação é obrigatória';
      }
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) {
        novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      }
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
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

    if (!validarFormulario()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      setShowSaveOptions(false);
      return;
    }

    setLoading(true);
    setShowSaveOptions(false);
    try {
      // Montar payload baseado no tipo
      let payload = {
        tipo: formData.tipo,
        nome: formData.nome,
        cpf: formData.cpf.replace(/\D/g, ''),
        telefones: { lista: formData.telefones.lista.filter(t => t.trim() !== '') },
        email: formData.email || '',
        observacoes: formData.observacoes,
        responsavel: responsavel,
        userEmail: userEmail,
        updatedAt: new Date(),
      };

      // Adicionar objeto Finalizado se modo for "resolvido"
      if (modo === 'resolvido') {
        payload.Finalizado = {
          Resolvido: true,
          dataResolucao: new Date()
        };
      }

      // Adicionar campos específicos por tipo
      if (formData.tipo === 'BACEN') {
        payload = {
          ...payload,
          dataEntrada: formData.dataEntrada,
          origem: formData.origem,
          produto: formData.produto || '',
          anexos: formData.anexos,
          prazoBacen: formData.prazoBacen || '',
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
          pixStatus: formData.pixStatus,
          statusContratoQuitado: formData.statusContratoQuitado,
          statusContratoAberto: formData.statusContratoAberto,
        };
      } else if (formData.tipo === 'OUVIDORIA') {
        payload = {
          ...payload,
          dataEntradaAtendimento: formData.dataEntradaAtendimento,
          origem: formData.origem || '',
          produto: formData.produto || '',
          prazoOuvidoria: formData.prazoOuvidoria || '',
          motivoReduzido: formData.motivoReduzido,
          motivoDetalhado: formData.motivoDetalhado || '',
          anexos: formData.anexos,
          tentativasContato: { lista: formData.tentativasContato.lista.filter(t => t.data || t.meio || t.resultado) },
          acionouCentral: formData.acionouCentral,
          protocolosCentral: formData.protocolosCentral.filter(p => p.trim() !== ''),
          n2SegundoNivel: formData.n2SegundoNivel,
          protocolosN2: formData.protocolosN2.filter(p => p.trim() !== ''),
          reclameAqui: formData.reclameAqui,
          protocolosReclameAqui: formData.protocolosReclameAqui.filter(p => p.trim() !== ''),
          procon: formData.procon,
          protocolosProcon: formData.protocolosProcon.filter(p => p.trim() !== ''),
          pixStatus: formData.pixStatus,
          statusContratoQuitado: formData.statusContratoQuitado,
          statusContratoAberto: formData.statusContratoAberto,
        };
      } else if (formData.tipo === 'RECLAME_AQUI') {
        payload = {
          ...payload,
          cpfRepetido: formData.cpfRepetido || '',
          idEntrada: formData.idEntrada,
          dataReclam: formData.dataReclam,
          motivoReduzido: formData.motivoReduzido,
          motivoDetalhado: formData.motivoDetalhado || '',
          passivelNotaMais: formData.passivelNotaMais,
          pixStatus: formData.pixStatus || '',
          statusContratoQuitado: formData.statusContratoQuitado,
          statusContratoAberto: formData.statusContratoAberto,
          enviarParaCobranca: formData.enviarParaCobranca || false,
          anexos: formData.anexos,
          oportunidade: formData.oportunidade || '',
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
        };
      } else if (formData.tipo === 'PROCON') {
        payload = {
          ...payload,
          codigoProcon: formData.codigoProcon,
          dataProcon: formData.dataProcon,
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
          // Tratativa N1: Canais de atendimento e protocolos acionados
          acionouCentral: formData.acionouCentral,
          protocolosCentral: formData.protocolosCentral.filter(p => p.trim() !== ''),
          n2SegundoNivel: formData.n2SegundoNivel,
          protocolosN2: formData.protocolosN2.filter(p => p.trim() !== ''),
          reclameAqui: formData.reclameAqui,
          protocolosReclameAqui: formData.protocolosReclameAqui.filter(p => p.trim() !== ''),
          procon: formData.procon,
          protocolosProcon: formData.protocolosProcon.filter(p => p.trim() !== ''),
        };
      }

      const resultado = await reclamacoesAPI.update(reclamacao._id, payload, formData.tipo);
      
      const mensagem = modo === 'resolvido' 
        ? 'Reclamação atualizada como Resolvida com sucesso!'
        : 'Reclamação atualizada como Em Andamento com sucesso!';
      toast.success(mensagem);
      
      if (onSuccess) {
        onSuccess(resultado);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao atualizar reclamação:', error);
      toast.error(error.message || 'Erro ao atualizar reclamação');
    } finally {
      setLoading(false);
    }
  };

  // Funções auxiliares para arrays dinâmicos
  const adicionarTelefone = () => {
    setFormData(prev => ({
      ...prev,
      telefones: { lista: [...prev.telefones.lista, ''] }
    }));
  };

  const removerTelefone = (index) => {
    setFormData(prev => ({
      ...prev,
      telefones: { lista: prev.telefones.lista.filter((_, i) => i !== index) }
    }));
  };

  const atualizarTelefone = (index, valor) => {
    const novasLista = [...formData.telefones.lista];
    novasLista[index] = formatTelefone(valor);
    setFormData(prev => ({ ...prev, telefones: { lista: novasLista } }));
  };

  const adicionarTentativa = () => {
    setFormData(prev => ({
      ...prev,
      tentativasContato: { 
        lista: [...prev.tentativasContato.lista, { data: '', meio: '', resultado: '' }] 
      }
    }));
  };

  const removerTentativa = (index) => {
    setFormData(prev => ({
      ...prev,
      tentativasContato: { 
        lista: prev.tentativasContato.lista.filter((_, i) => i !== index) 
      }
    }));
  };

  const adicionarProtocolo = (campo) => {
    setFormData(prev => ({
      ...prev,
      [campo]: [...prev[campo], '']
    }));
  };

  const removerProtocolo = (campo, index) => {
    setFormData(prev => ({
      ...prev,
      [campo]: prev[campo].filter((_, i) => i !== index)
    }));
  };

  const atualizarProtocolo = (campo, index, valor) => {
    const novaLista = [...formData[campo]];
    novaLista[index] = valor;
    setFormData(prev => ({ ...prev, [campo]: novaLista }));
  };

  // Renderizar campos específicos BACEN
  const renderCamposBacen = () => (
    <>
      <div className="velohub-card">
        <h3 className="text-xl font-semibold mb-4 velohub-title">Reclamação</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Natureza *
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
              <option value="Consumidor.Gov">Consumidor.Gov</option>
            </select>
            {errors.origem && <span className="text-red-500 text-xs">{errors.origem}</span>}
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
              <option value="Antecipação">Antecipação</option>
              <option value="Credito Pessoal">Credito Pessoal</option>
              <option value="Credito Trabalhador">Credito Trabalhador</option>
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
            {errors.dataEntrada && <span className="text-red-500 text-xs">{errors.dataEntrada}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 mb-4">
          <div>
            {renderCampoMotivo(
              MOTIVOS_REDUZIDOS,
              formData.motivoReduzido,
              (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
              errors.motivoReduzido,
              'Motivo *',
              'motivo-bacen-edit'
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Prazo {formData.origem === 'Consumidor.Gov' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              value={formData.prazoBacen}
              onChange={(e) => setFormData(prev => ({ ...prev, prazoBacen: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required={formData.origem === 'Consumidor.Gov'}
            />
            {errors.prazoBacen && <span className="text-red-500 text-xs">{errors.prazoBacen}</span>}
          </div>
        </div>

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
          {errors.motivoDetalhado && <span className="text-red-500 text-xs">{errors.motivoDetalhado}</span>}
        </div>

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

  // Renderizar campos específicos OUVIDORIA
  const renderCamposOuvidoria = () => (
    <>
      <div className="velohub-card">
        <h3 className="text-xl font-semibold mb-4 velohub-title">Reclamação</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
              <option value="Antecipação">Antecipação</option>
              <option value="Crédito pessoal">Crédito pessoal</option>
              <option value="Crédito trabalhador">Crédito trabalhador</option>
              <option value="Cupons">Cupons</option>
              <option value="Seguros">Seguros</option>
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
            {errors.origem && <span className="text-red-500 text-xs">{errors.origem}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Data de Entrada *
            </label>
            <input
              type="date"
              value={formData.dataEntradaAtendimento}
              onChange={(e) => setFormData(prev => ({ ...prev, dataEntradaAtendimento: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            />
            {errors.dataEntradaAtendimento && <span className="text-red-500 text-xs">{errors.dataEntradaAtendimento}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Prazo
            </label>
            <input
              type="date"
              value={formData.prazoOuvidoria}
              onChange={(e) => setFormData(prev => ({ ...prev, prazoOuvidoria: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
          <div>
            {renderCampoMotivo(
              MOTIVOS_REDUZIDOS,
              formData.motivoReduzido,
              (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
              errors.motivoReduzido,
              'Motivo *',
              'motivo-bacen-edit'
            )}
          </div>
        </div>

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
          
          {/* Linha 1: ID Entrada | Data Reclam | CPF Repetido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
          </div>

          {/* Linha 2: Motivo */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            {renderCampoMotivo(
              MOTIVOS_REDUZIDOS,
              formData.motivoReduzido,
              (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
              errors.motivoReduzido,
              'Motivo *',
              'motivo-reclame-aqui-edit'
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

          {/* Oportunidade */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Oportunidade
            </label>
            <input
              type="text"
              value={formData.oportunidade}
              onChange={(e) => setFormData(prev => ({ ...prev, oportunidade: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Digite a oportunidade..."
            />
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
        toast.info('Nenhum registro Reclame Aqui encontrado para este CPF.');
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
          
          {/* Linha 1: Código Procon | Data Procon | Produto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                <option value="Antecipação">Antecipação</option>
                <option value="Credito Pessoal">Credito Pessoal</option>
                <option value="Credito Trabalhador">Credito Trabalhador</option>
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
              'motivo-reclame-aqui-edit'
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

          {/* Registros Reclame Aqui */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Registros Reclame Aqui?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.registrosReclameAqui}
                readOnly
                className="flex-1 border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                placeholder="Clique em 'Buscar' para encontrar registros relacionados"
              />
              <button
                type="button"
                onClick={buscarRegistrosReclameAqui}
                disabled={buscandoReclameAqui || !formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11}
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
                {buscandoReclameAqui ? 'Buscando...' : 'Buscar'}
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
      </>
    );
  };

  // Renderizar tentativas de contato
  const renderTentativasContato = () => (
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

  // Renderizar protocolos
  const renderProtocolos = () => (
    <div className="velohub-card">
      <h3 className="text-xl font-semibold mb-4 velohub-title">Canais de Atendimento e Protocolos Acionados</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Central de Ajuda */}
        <div>
          <div className="flex items-center mb-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.acionouCentral}
                onChange={(e) => setFormData(prev => ({ ...prev, acionouCentral: e.target.checked }))}
                className="mr-2"
              />
              <span>Central de Ajuda</span>
            </label>
          </div>
          {formData.acionouCentral && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Qual Protocolo - Central de Ajuda
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

        {/* Escalado Ouvidoria */}
        <div>
          <div className="flex items-center mb-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.n2SegundoNivel}
                onChange={(e) => setFormData(prev => ({ ...prev, n2SegundoNivel: e.target.checked }))}
                className="mr-2"
              />
              <span>Escalado Ouvidoria</span>
            </label>
          </div>
          {formData.n2SegundoNivel && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Qual Protocolo - Escalado Ouvidoria
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

        {/* PIX liberado ou excluído? */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            PIX liberado ou excluído?
          </label>
          <select
            value={formData.pixStatus}
            onChange={(e) => setFormData(prev => ({ ...prev, pixStatus: e.target.value }))}
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Selecione...</option>
            <option value="Liberado">Liberado</option>
            <option value="Excluído">Excluído</option>
            <option value="Solicitada">Solicitada</option>
            <option value="Não aplicável">Não aplicável</option>
          </select>
        </div>
      </div>

      {/* Grid 3x2: Linha 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Reclame Aqui */}
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

        {/* Procon */}
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

        {/* Status do contrato */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Status do contrato
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.statusContratoQuitado}
                onChange={(e) => setFormData(prev => ({ ...prev, statusContratoQuitado: e.target.checked }))}
                className="mr-2"
              />
              <span>Quitado</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.statusContratoAberto}
                onChange={(e) => setFormData(prev => ({ ...prev, statusContratoAberto: e.target.checked }))}
                className="mr-2"
              />
              <span>Em aberto</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
      {/* Dados do Cliente */}
      <div className="velohub-card">
        <h3 className="text-xl font-semibold mb-4 velohub-title">Dados do Cliente</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            {errors.nome && <span className="text-red-500 text-xs">{errors.nome}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              CPF *
            </label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => {
                const formatted = formatCPFInput(e.target.value);
                setFormData(prev => ({ ...prev, cpf: formatted }));
              }}
              className={`w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                validarCPF(formData.cpf) 
                  ? 'border-green-500 border-2' 
                  : 'border-gray-400 dark:border-gray-500'
              }`}
              placeholder="000.000.000-00"
              maxLength={14}
              required
            />
            {errors.cpf && <span className="text-red-500 text-xs">{errors.cpf}</span>}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Telefones
          </label>
          {formData.telefones.lista.map((telefone, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={telefone}
                onChange={(e) => atualizarTelefone(index, e.target.value)}
                className={`flex-1 border rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                  telefone.replace(/\D/g, '').length >= 10 
                    ? 'border-green-500 border-2' 
                    : 'border-gray-400 dark:border-gray-500'
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

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => {
              const formatted = formatarEmail(e.target.value);
              setFormData(prev => ({ ...prev, email: formatted }));
            }}
            className={`w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
              formData.email && validarEmail(formData.email)
                ? 'border-green-500 border-2'
                : 'border-gray-400 dark:border-gray-500'
            }`}
            placeholder="email@exemplo.com"
          />
        </div>

        <div className="mb-4">
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

      {/* Campos específicos por tipo */}
      {formData.tipo === 'BACEN' && renderCamposBacen()}
      {formData.tipo === 'OUVIDORIA' && renderCamposOuvidoria()}
      {formData.tipo === 'RECLAME_AQUI' && renderCamposReclameAqui()}
      {formData.tipo === 'PROCON' && renderCamposProcon()}

      {/* Tentativas de Contato (BACEN/N2 apenas) */}
      {(formData.tipo === 'BACEN' || formData.tipo === 'OUVIDORIA') && renderTentativasContato()}

      {/* Protocolos (BACEN/N2/Reclame Aqui) */}
      {(formData.tipo === 'BACEN' || formData.tipo === 'OUVIDORIA' || formData.tipo === 'RECLAME_AQUI') && renderProtocolos()}

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4 relative">
        <button
          type="button"
          onClick={onClose}
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
          Cancelar
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
                            {registro.dataReclam ? new Date(registro.dataReclam).toLocaleDateString('pt-BR') : 'N/A'}
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

export default FormReclamacaoEdit;
