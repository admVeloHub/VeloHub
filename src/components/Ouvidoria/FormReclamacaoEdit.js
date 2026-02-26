/**
 * VeloHub V3 - FormReclamacaoEdit Component
 * VERSION: v1.2.0 | DATE: 2025-02-20 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.2.0:
 * - Removido campo casosCriticos (não conectado ao formulário principal)
 * 
 * Mudanças v1.1.0:
 * - Removido campo status (usar Finalizado.Resolvido para determinar se está em andamento ou resolvido)
 * - Removido campo mes do formulário OUVIDORIA
 * 
 * Componente de formulário para edição de reclamações BACEN e Ouvidoria
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

const MOTIVOS_REDUZIDOS = [
  'Abatimento Juros',
  'Abatimento Juros/Chave PIX',
  'Cancelamento Conta',
  'Chave PIX',
  'PIX/Abatimento Juros/Encerramento de conta',
  'Chave PIX/Abatimento Juros/Prob. App',
  'Chave PIX/Acesso ao App',
  'Chave PIX/Exclusão de Conta',
  'Conta',
  'Contestação de Valores',
  'Credito do Trabalhador',
  'Credito Pessoal',
  'Cupons Velotax',
  'Devolução à Celcoin',
  'Fraude',
  'Liquidação Antecipada',
  'Liquidação Antecipada/Abatimento Juros',
  'Não recebeu restituição',
  'Não recebeu restituição/Abatimento Juros',
  'Não recebeu restituição/Abatimento Juros/Chave PIX',
  'Não recebeu restituição/Chave PIX',
  'Probl. App/Gov',
  'Seguro Celular',
  'Seguro Divida Zero',
  'Seguro Prestamista',
  'Seguro Saude',
  'Superendividamento'
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

  return {
    // Campos comuns
    nome: reclamacao.nome || '',
    cpf: reclamacao.cpf ? formatCPFInput(reclamacao.cpf.replace(/\D/g, '')) : '',
    telefones: reclamacao.telefones?.lista?.length > 0 
      ? { lista: reclamacao.telefones.lista }
      : { lista: [''] },
    email: reclamacao.email || '',
    observacoes: reclamacao.observacoes || '',
    tipo: reclamacao.tipo || 'BACEN',
    
    // Campos BACEN
    dataEntrada: formatarDataInput(reclamacao.dataEntrada),
    origem: reclamacao.origem || '',
    produto: reclamacao.produto || '',
    anexos: reclamacao.anexos || [],
    prazoBacen: formatarDataInput(reclamacao.prazoBacen),
    motivoReduzido: reclamacao.motivoReduzido || '',
    motivoDetalhado: reclamacao.motivoDetalhado || '',
    
    // Campos OUVIDORIA
    dataEntradaAtendimento: formatarDataInput(reclamacao.dataEntradaAtendimento),
    prazoOuvidoria: formatarDataInput(reclamacao.prazoOuvidoria),
    
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
    motivoReduzido: '',
    motivoDetalhado: '',
    dataEntradaAtendimento: '',
    prazoOuvidoria: '',
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
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const dropdownRef = useRef(null);

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
      if (!formData.motivoReduzido) {
        novosErros.motivoReduzido = 'Motivo é obrigatório';
      }
      if (!formData.motivoDetalhado.trim()) {
        novosErros.motivoDetalhado = 'Descrição é obrigatória';
      }
    }

    // Validações OUVIDORIA
    if (formData.tipo === 'OUVIDORIA') {
      if (!formData.dataEntradaAtendimento) {
        novosErros.dataEntradaAtendimento = 'Data de entrada é obrigatória';
      }
      if (!formData.origem) {
        novosErros.origem = 'Origem é obrigatória';
      }
      if (!formData.motivoReduzido) {
        novosErros.motivoReduzido = 'Motivo é obrigatório';
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
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Motivo *
            </label>
            <select
              value={formData.motivoReduzido}
              onChange={(e) => setFormData(prev => ({ ...prev, motivoReduzido: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            >
              <option value="">Selecione...</option>
              {MOTIVOS_REDUZIDOS.map(motivo => (
                <option key={motivo} value={motivo}>{motivo}</option>
              ))}
            </select>
            {errors.motivoReduzido && <span className="text-red-500 text-xs">{errors.motivoReduzido}</span>}
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
              <option value="Telefone">Telefone</option>
              <option value="Ticket">Ticket</option>
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
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Motivo *
            </label>
            <select
              value={formData.motivoReduzido}
              onChange={(e) => setFormData(prev => ({ ...prev, motivoReduzido: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            >
              <option value="">Selecione...</option>
              {MOTIVOS_REDUZIDOS.map(motivo => (
                <option key={motivo} value={motivo}>{motivo}</option>
              ))}
            </select>
            {errors.motivoReduzido && <span className="text-red-500 text-xs">{errors.motivoReduzido}</span>}
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
      {formData.tipo === 'BACEN' ? renderCamposBacen() : renderCamposOuvidoria()}

      {/* Tentativas de Contato */}
      {renderTentativasContato()}

      {/* Protocolos */}
      {renderProtocolos()}

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
  );
};

export default FormReclamacaoEdit;
