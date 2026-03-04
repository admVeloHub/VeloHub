/**
 * VeloHub V3 - FormSolicitacao Component (Escalações Module)
 * VERSION: v1.15.2 | DATE: 2026-03-03 | AUTHOR: VeloHub Development Team
 * Branch: escalacoes
 * 
 * Mudanças v1.15.2:
 * - MELHORIA: Melhorado tratamento de erro 503 para detectar WhatsApp desconectado
 * - Detecta múltiplas variações de mensagem de erro do backend
 * - Mensagens mais específicas baseadas no tipo de erro retornado
 * 
 * Mudanças v1.15.1:
 * - Melhorado tratamento de erro 503 (WhatsApp desconectado) com mensagens mais claras
 * - Usuário é informado que a solicitação foi registrada mesmo quando WhatsApp falha
 * 
 * Mudanças v1.15.0:
 * - Atualizado para usar WHATSAPP_ENDPOINT que detecta automaticamente o endpoint correto
 * - Em localhost:3001 usa /api/whatsapp/send, em produção usa /send
 * 
 * Mudanças v1.14.0:
 * - Campo "Prazo Máximo" alterado de texto livre para campo de data objetiva (type="date")
 * - Data formatada na mensagem WhatsApp como DD/MM/YYYY para melhor legibilidade
 * 
 * Mudanças v1.13.0:
 * - Adicionado checkbox "Bacen" para opção "Exclusão de Chave PIX"
 * - Adicionado campo "Prazo Máximo" que aparece quando Reclame Aqui, Bacen, Procon, Processo ou N2 estiver marcado
 * - Campo "Prazo Máximo" incluído na mensagem WhatsApp quando preenchido
 * - Validação atualizada para incluir Bacen como opção válida
 * 
 * Mudanças v1.12.0:
 * - CPF sempre enviado apenas com números (sem pontos ou traços) em todas as operações
 * - Normalização aplicada ao enviar para WhatsApp API, salvar no backend, logs e cache local
 * - Máscara visual mantida na interface, mas dados sempre normalizados antes do envio
 * 
 * Mudanças v1.11.0:
 * - Removida opção "Exclusão de Conta" (movida para aba Erros/Bugs)
 * 
 * Mudanças v1.10.0:
 * - Revertida API WhatsApp para usar whatsapp-api-new-54aw.onrender.com/send
 * 
 * Mudanças v1.9.0:
 * - Adicionada formatação reativa de moeda brasileira no campo Valor (Aumento de Limite Pix e Cancelamento)
 * - Formatação preenche do centavo para dezena de centavo, depois unidade, dezena, centena, etc.
 * - Adiciona pontuações de milhar automaticamente (R$ 1.234,56)
 * - Placeholder atualizado para R$0,00
 * 
 * Mudanças v1.8.0:
 * - Corrigido formato de telefone celular para padrão brasileiro: (XX)91234-5678 (11 dígitos)
 * - Atualizada validação para aceitar 11 dígitos ao invés de 10
 * - Corrigido placeholder para mostrar formato correto
 * 
 * Mudanças v1.7.0:
 * - Atualizado endpoint WhatsApp para usar nova API do backend GCP: /api/whatsapp/send
 *   - Local: http://localhost:3001/api/whatsapp/send
 *   - Produção: https://backend-gcp-278491073220.us-east1.run.app/api/whatsapp/send
 * - Melhorado tratamento de erros e logs de debug
 * 
 * Mudanças v1.6.0:
 * - Adicionados campos para "Exclusão de Chave PIX" (semDebitoAberto, n2Ouvidora, procon, reclameAqui, processo)
 * - Adicionado campo "Aumento de Limite Pix" com campo valor
 * - Adicionados novos tipos no select: "Aumento de Limite Pix" e "Reset de Senha"
 * - Adicionada validação para Exclusão de Chave PIX (pelo menos uma opção deve ser selecionada)
 * - Atualizada função montarMensagem() para incluir novos tipos e campos
 * 
 * Componente de formulário para criação de solicitações técnicas
 * 
 * Mudanças v1.5.0:
 * - Adicionada funcionalidade completa de Cancelamento de Serviços
 * - Novos campos: seguroPrestamista, seguroSaude, seguroCelular, seguroDividaZero, clubeVelotax
 * - Campos de prazo: dentroDos7Dias, depoisDos7Dias
 * - Formulário condicional para tipo "Cancelamento" com seleção múltipla de produtos e prazos
 * - Formatação automática de mensagem WhatsApp para cancelamentos
 * - Adicionada formatação automática de CPF (000.000.000-00)
 * - Validação visual de CPF: borda verde quando tiver 11 dígitos
 * - Limitação de entrada: máximo 11 dígitos no campo CPF
 * 
 * Mudanças v1.4.0:
 * - Alterado fluxo para seguir padrão do painel de serviços (que funciona corretamente)
 * - PRIMEIRO: Frontend envia diretamente para WhatsApp API
 * - DEPOIS: Salva no backend com waMessageId já obtido
 * - Isso garante envio imediato e controle direto do frontend sobre o processo
 * 
 * Mudanças v1.3.4:
 * - Toast renderizado via React Portal diretamente no body para garantir posicionamento fixo na viewport (tela)
 * - Toast no canto superior direito DA TELA (não do container), logo abaixo do header
 * - Formato: retangular, bordas 4px, verde 70% opacidade (sucesso), vermelho 60% opacidade (erro)
 * 
 * Mudanças v1.3.3:
 * - Alterado posicionamento dos toasts para top-20 right-4 (canto superior direito, logo abaixo do header)
 * 
 * Mudanças v1.3.2:
 * - Corrigido posicionamento dos toasts para bottom-4 right-4 (canto inferior direito, fixo no frame)
 * - Usado z-velohub-toast para seguir padrão do projeto
 * 
 * Mudanças v1.3.1:
 * - Corrigido posicionamento dos toasts de top-4 para bottom-4 (canto inferior direito)
 * 
 * Mudanças v1.3.0:
 * - Adicionada formatação e máscara de email (email@dominio.com.br) nos campos dadoAntigo e dadoNovo
 * - Adicionada validação visual (borda verde) no campo "Dado novo" quando:
 *   - Tipo é "E-mail" e formato válido (parte@dominio.extensão)
 *   - Tipo é "Telefone" e telefone completo (11 dígitos para celular)
 * - Telefone definido como valor padrão do campo "Tipo de informação"
 * 
 * Mudanças v1.2.0:
 * - Corrigida formatação de telefone para usar estado anterior (prev) ao invés de estado atual
 * - Melhorada lógica de atualização do select de tipo de informação
 * 
 * Mudanças v1.1.0:
 * - Adicionada formatação automática de telefone (XX)91234-5678 nos campos dadoAntigo e dadoNovo
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { solicitacoesAPI, logsAPI } from '../../services/escalacoesApi';
import { WHATSAPP_API_URL, WHATSAPP_DEFAULT_JID, WHATSAPP_ENDPOINT } from '../../config/api-config';

/**
 * Componente de formulário para solicitações técnicas
 * @param {Function} registrarLog - Função para registrar logs
 */
const FormSolicitacao = ({ registrarLog }) => {
  const [form, setForm] = useState({
    agente: '',
    cpf: '',
    tipo: 'Alteração de Dados Cadastrais',
    infoTipo: 'Telefone',
    dadoAntigo: '',
    dadoNovo: '',
    fotosVerificadas: false,
    observacoes: '',
    // Campos para Exclusão de Chave PIX
    semDebitoAberto: false,
    n2Ouvidora: false,
    procon: false,
    reclameAqui: false,
    processo: false,
    bacen: false,
    prazoMaximo: '',
    // Campos para Aumento de Limite Pix e Cancelamento
    valor: '',
    nomeCliente: '',
    dataContratacao: '',
    // Campos para Cancelamento (existente)
    seguroPrestamista: false,
    seguroSaude: false,
    seguroCelular: false,
    seguroDividaZero: false,
    clubeVelotax: false,
    dentroDos7Dias: false,
    depoisDos7Dias: false,
  });
  const [loading, setLoading] = useState(false);
  const [cpfError, setCpfError] = useState('');
  const [localLogs, setLocalLogs] = useState([]); // {cpf, tipo, waMessageId, status, createdAt}
  const [buscaCpf, setBuscaCpf] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [buscaResultados, setBuscaResultados] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  /**
   * Exibir notificação simples
   * @param {string} message - Mensagem a exibir
   * @param {string} type - Tipo da notificação (success, error, info)
   */
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  /**
   * Normalizar nome do agente (Title Case, espaços simples)
   * @param {string} s - String a normalizar
   * @returns {string} String normalizada
   */
  const toTitleCase = (s = '') => {
    const lower = String(s).toLowerCase().replace(/\s+/g, ' ').trim();
    const keepLower = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);
    return lower.split(' ').filter(Boolean).map((p, i) => {
      if (i > 0 && keepLower.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
  };

  // Carregar cache inicial
  useEffect(() => {
    try {
      const cached = localStorage.getItem('velotax_local_logs');
      if (cached) setLocalLogs(JSON.parse(cached));
      const agent = localStorage.getItem('velotax_agent');
      if (agent) setForm((prev) => ({ ...prev, agente: toTitleCase(agent) }));
    } catch (err) {
      console.error('Erro ao carregar cache:', err);
    }
  }, []);

  // Garantir formatação quando componente monta com Telefone como padrão
  useEffect(() => {
    if (form.tipo === 'Alteração de Dados Cadastrais') {
      // Forçar atualização dos campos para aplicar formatação
      setForm(prev => {
        const novoForm = { ...prev };
        if (prev.infoTipo === 'Telefone') {
          if (prev.dadoAntigo) {
            novoForm.dadoAntigo = formatarTelefone(prev.dadoAntigo);
          }
          if (prev.dadoNovo) {
            novoForm.dadoNovo = formatarTelefone(prev.dadoNovo);
          }
        } else if (prev.infoTipo === 'E-mail') {
          if (prev.dadoAntigo) {
            novoForm.dadoAntigo = formatarEmail(prev.dadoAntigo);
          }
          if (prev.dadoNovo) {
            novoForm.dadoNovo = formatarEmail(prev.dadoNovo);
          }
        }
        return novoForm;
      });
    }
  }, []); // Executa apenas na montagem

  /**
   * Salvar cache no localStorage
   * @param {Array} items - Itens para salvar
   */
  const saveCache = (items) => {
    setLocalLogs(items);
    try {
      localStorage.setItem('velotax_local_logs', JSON.stringify(items));
    } catch (err) {
      console.error('Erro ao salvar cache:', err);
    }
  };

  /**
   * Buscar solicitações por CPF
   */
  const buscarCpf = async () => {
    const digits = String(buscaCpf || '').replace(/\D/g, '');
    if (!digits) {
      setBuscaResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const results = await solicitacoesAPI.getByCpf(digits);
      setBuscaResultados(Array.isArray(results.data) ? results.data : []);
    } catch (err) {
      console.error('Erro ao buscar CPF:', err);
      setBuscaResultados([]);
    }
    setBuscando(false);
  };

  /**
   * Atualizar status dos logs localmente
   */
  const refreshNow = async () => {
    if (!localLogs.length) return;
    try {
      const all = await solicitacoesAPI.getAll();
      const requests = Array.isArray(all.data) ? all.data : [];
      const updated = localLogs.map(item => {
        const match = item.waMessageId
          ? requests.find(r => r.waMessageId === item.waMessageId)
          : requests.find(r => r.cpf === item.cpf && r.tipo === item.tipo);
        return match ? { ...item, status: match.status } : item;
      });
      saveCache(updated);
    } catch (err) {
      console.error('Erro ao atualizar logs:', err);
    }
  };

  /**
   * Formatar telefone no formato (XX)91234-5678 (celular brasileiro - 11 dígitos)
   * @param {string} valor - Valor a formatar
   * @returns {string} Telefone formatado
   */
  const formatarTelefone = (valor) => {
    // Remove tudo que não é dígito
    const digits = String(valor || '').replace(/\D/g, '');
    
    // Limita a 11 dígitos (XX)91234-5678
    const limited = digits.slice(0, 11);
    
    if (limited.length === 0) return '';
    if (limited.length <= 2) return `(${limited}`;
    if (limited.length <= 7) return `(${limited.slice(0, 2)})${limited.slice(2)}`;
    return `(${limited.slice(0, 2)})${limited.slice(2, 7)}-${limited.slice(7)}`;
  };

  /**
   * Validar telefone completo (11 dígitos para celular brasileiro)
   * @param {string} valor - Valor a validar
   * @returns {boolean} True se válido
   */
  const validarTelefone = (valor) => {
    const digits = String(valor || '').replace(/\D/g, '');
    return digits.length === 11;
  };

  /**
   * Formatar CPF no formato 000.000.000-00
   * @param {string} valor - Valor a formatar
   * @returns {string} CPF formatado
   */
  const formatarCPF = (valor) => {
    // Remove tudo que não é dígito
    const digits = String(valor || '').replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = digits.slice(0, 11);
    
    if (limited.length === 0) return '';
    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
  };

  /**
   * Validar CPF completo (11 dígitos)
   * @param {string} valor - Valor a validar
   * @returns {boolean} True se válido
   */
  const validarCPF = (valor) => {
    const digits = String(valor || '').replace(/\D/g, '');
    return digits.length === 11;
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
   * Formatar valor monetário no formato brasileiro R$ 1.234,56
   * Formatação reativa: digitação preenche do centavo para a dezena de centavo, depois unidade, dezena, centena, etc.
   * @param {string} valor - Valor a formatar (pode conter R$, pontos, vírgulas, etc.)
   * @returns {string} Valor formatado no padrão R$ X.XXX,XX
   */
  const formatarMoeda = (valor) => {
    // Remove tudo que não é dígito
    const digits = String(valor || '').replace(/\D/g, '');
    
    // Se não há dígitos, retorna vazio
    if (digits.length === 0) return '';
    
    // Converte para número e divide por 100 para obter centavos
    const valorNumerico = parseInt(digits, 10) / 100;
    
    // Formata com separador de milhar (.) e decimal (,)
    const valorFormatado = valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Adiciona prefixo R$
    return `R$ ${valorFormatado}`;
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

  // Refresh de status a cada 20s
  useEffect(() => {
    const refresh = async () => {
      if (!localLogs.length) return;
      try {
        const all = await solicitacoesAPI.getAll();
        const requests = Array.isArray(all.data) ? all.data : [];
        const updated = localLogs.map(item => {
          const match = item.waMessageId
            ? requests.find(r => r.waMessageId === item.waMessageId)
            : requests.find(r => r.cpf === item.cpf && r.tipo === item.tipo);
          return match ? { ...item, status: match.status } : item;
        });
        saveCache(updated);
      } catch (err) {
        console.error('Erro ao atualizar logs:', err);
      }
    };
    refresh();
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
  }, [localLogs.length]);

  // Reformatar campos quando tipo de informação mudar para Telefone ou E-mail
  useEffect(() => {
    if (form.tipo === 'Alteração de Dados Cadastrais') {
      setForm(prev => {
        let atualizado = false;
        const novoForm = { ...prev };
        
        if (prev.infoTipo === 'Telefone') {
          // Reformatar dadoAntigo se tiver valor (mesmo que parcial)
          if (prev.dadoAntigo && prev.dadoAntigo.trim() !== '') {
            const formatted = formatarTelefone(prev.dadoAntigo);
            if (formatted !== prev.dadoAntigo) {
              novoForm.dadoAntigo = formatted;
              atualizado = true;
            }
          }
          
          // Reformatar dadoNovo se tiver valor (mesmo que parcial)
          if (prev.dadoNovo && prev.dadoNovo.trim() !== '') {
            const formatted = formatarTelefone(prev.dadoNovo);
            if (formatted !== prev.dadoNovo) {
              novoForm.dadoNovo = formatted;
              atualizado = true;
            }
          }
        } else if (prev.infoTipo === 'E-mail') {
          // Reformatar dadoAntigo se tiver valor
          if (prev.dadoAntigo && prev.dadoAntigo.trim() !== '') {
            const formatted = formatarEmail(prev.dadoAntigo);
            if (formatted !== prev.dadoAntigo) {
              novoForm.dadoAntigo = formatted;
              atualizado = true;
            }
          }
          
          // Reformatar dadoNovo se tiver valor
          if (prev.dadoNovo && prev.dadoNovo.trim() !== '') {
            const formatted = formatarEmail(prev.dadoNovo);
            if (formatted !== prev.dadoNovo) {
              novoForm.dadoNovo = formatted;
              atualizado = true;
            }
          }
        }
        
        return atualizado ? novoForm : prev;
      });
    }
  }, [form.infoTipo, form.tipo]);

  /**
   * Atualizar campo do formulário
   * @param {string} campo - Nome do campo
   * @param {any} valor - Valor do campo
   */
  const atualizar = (campo, valor) => {
    setForm(prev => {
      let valorFinal = valor;
      
      // Aplicar formatação de CPF se necessário
      if (campo === 'cpf') {
        valorFinal = formatarCPF(valor);
      }
      
      // Aplicar formatação de telefone se necessário - SEMPRE quando tipo é Telefone
      if (prev.tipo === 'Alteração de Dados Cadastrais' && prev.infoTipo === 'Telefone') {
        if (campo === 'dadoAntigo' || campo === 'dadoNovo') {
          // Aplicar formatação mesmo se o valor estiver vazio ou parcial
          valorFinal = formatarTelefone(valor);
        }
      }
      
      // Aplicar formatação de email se necessário - SEMPRE quando tipo é E-mail
      if (prev.tipo === 'Alteração de Dados Cadastrais' && prev.infoTipo === 'E-mail') {
        if (campo === 'dadoAntigo' || campo === 'dadoNovo') {
          // Formatar email (lowercase, sem espaços)
          valorFinal = formatarEmail(valor);
        }
      }
      
      // Aplicar formatação de moeda se necessário - SEMPRE quando tipo é Aumento de Limite Pix ou Cancelamento e campo é valor
      if ((prev.tipo === 'Aumento de Limite Pix' || prev.tipo === 'Cancelamento') && campo === 'valor') {
        valorFinal = formatarMoeda(valor);
      }
      
      const novoForm = { ...prev, [campo]: valorFinal };
      
      // Processar campos específicos
      if (campo === 'cpf') {
        setCpfError('');
      }
      if (campo === 'agente') {
        const norm = toTitleCase(valor);
        try {
          localStorage.setItem('velotax_agent', norm);
        } catch (err) {
          console.error('Erro ao salvar agente:', err);
        }
      }
      
      return novoForm;
    });
  };

  /**
   * Montar mensagem para WhatsApp
   * @returns {string} Mensagem formatada
   */
  const montarMensagem = () => {
    const simNao = v => (v ? '✅ Sim' : '❌ Não');
    const typeMap = {
      'Exclusão de Chave PIX': 'Exclusão de Chave PIX',
      'Alteração de Dados Cadastrais': 'Alteração de Dados Cadastrais',
      'Reativação de Conta': 'Reativação de Conta',
      'Cancelamento': 'Cancelamento',
      'Reset de Senha': 'Reset de Senha',
      'Aumento de Limite Pix': 'Aumento de Limite Pix',
    };
    const tipoCanon = typeMap[form.tipo] || toTitleCase(String(form.tipo || ''));
    const cpfNorm = String(form.cpf || '').replace(/\s+/g, ' ').trim();
    let msg = `*Nova Solicitação Técnica - ${tipoCanon}*\n\n`;
    msg += `Agente: ${form.agente}\nCPF: ${cpfNorm}\n\n`;

    if (form.tipo === 'Alteração de Dados Cadastrais') {
      msg += `Tipo de informação: ${form.infoTipo}\n`;
      msg += `Dado antigo: ${form.dadoAntigo}\n`;
      msg += `Dado novo: ${form.dadoNovo}\n`;
      msg += `Fotos verificadas: ${simNao(form.fotosVerificadas)}\n`;
      msg += `Observações: ${form.observacoes || '—'}\n`;
    } else if (form.tipo === 'Exclusão de Chave PIX') {
      msg += `Sem Débito em aberto: ${simNao(form.semDebitoAberto)}\n`;
      msg += `N2 - Ouvidora: ${simNao(form.n2Ouvidora)}\n`;
      msg += `Procon: ${simNao(form.procon)}\n`;
      msg += `Reclame Aqui: ${simNao(form.reclameAqui)}\n`;
      msg += `Processo: ${simNao(form.processo)}\n`;
      msg += `Bacen: ${simNao(form.bacen)}\n`;
      if (form.prazoMaximo) {
        // Formatar data de YYYY-MM-DD para DD/MM/YYYY
        const dataFormatada = form.prazoMaximo.split('-').reverse().join('/');
        msg += `Prazo Máximo: ${dataFormatada}\n`;
      }
      msg += `Observações: ${form.observacoes || '—'}\n`;
    } else if (form.tipo === 'Aumento de Limite Pix') {
      msg += `Valor: ${form.valor || '—'}\n`;
      msg += `Observações: ${form.observacoes || '—'}\n`;
    } else if (form.tipo === 'Cancelamento') {
      msg += `Nome do Cliente: ${form.nomeCliente || '—'}\n`;
      msg += `Data da Contratação: ${form.dataContratacao || '—'}\n`;
      msg += `Valor: ${form.valor || '—'}\n`;
      msg += `Observações: ${form.observacoes || '—'}\n`;
    } else {
      msg += `Observações: ${form.observacoes || '—'}\n`;
    }
    return msg;
  };

  /**
   * Enviar solicitação
   * @param {Event} e - Evento do formulário
   */
  const enviar = async (e) => {
    e.preventDefault();
    const digits = String(form.cpf || '').replace(/\D/g, '');
    if (digits.length !== 11) {
      setCpfError('CPF inválido. Digite os 11 dígitos.');
      showNotification('CPF inválido. Digite os 11 dígitos.', 'error');
      return;
    }
    if (form.tipo === 'Exclusão de Chave PIX' && !form.semDebitoAberto && !form.n2Ouvidora && !form.procon && !form.reclameAqui && !form.processo && !form.bacen) {
      showNotification('Para Exclusão de Chave PIX, selecione pelo menos uma opção: Sem Débito em aberto, N2 - Ouvidora, Procon, Reclame Aqui, Processo ou Bacen.', 'error');
      return;
    }
    setLoading(true);
    if (registrarLog) registrarLog('Iniciando envio...');

    /**
     * Notificar erro via Notification API
     * @param {string} title - Título da notificação
     * @param {string} body - Corpo da notificação
     */
    const notifyError = (title, body) => {
      try {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(title, { body });
          } else {
            Notification.requestPermission().then((p) => {
              if (p === 'granted') new Notification(title, { body });
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Erro ao exibir notificação:', err);
      }
    };

    // Garantir nome do agente normalizado
    let agenteNorm = form.agente && form.agente.trim() ? toTitleCase(form.agente) : '';
    if (!agenteNorm) {
      try {
        agenteNorm = toTitleCase(localStorage.getItem('velotax_agent') || '');
      } catch (err) {
        console.error('Erro ao obter agente:', err);
      }
      if (agenteNorm) setForm((prev) => ({ ...prev, agente: agenteNorm }));
    }
    if (agenteNorm) {
      try {
        localStorage.setItem('velotax_agent', agenteNorm);
      } catch (err) {
        console.error('Erro ao salvar agente:', err);
      }
    }

    const mensagemTexto = montarMensagem();

    // Obter configurações do WhatsApp
    const apiUrl = WHATSAPP_API_URL;
    const defaultJid = WHATSAPP_DEFAULT_JID;
    
    // CPF apenas com números (sem formatação) para a API
    const cpfApenasNumeros = String(form.cpf || '').replace(/\D/g, '');
    
    const payload = { 
      jid: defaultJid, 
      mensagem: mensagemTexto, 
      cpf: cpfApenasNumeros, 
      solicitacao: form.tipo, 
      agente: agenteNorm || form.agente 
    };

    try {
      // 1) PRIMEIRO: Tentar enviar via WhatsApp se configurado (seguindo fluxo do painel de serviços)
      let res = { ok: false };
      let waMessageId = null;
      
      if (apiUrl && defaultJid) {
        try {
          const whatsappEndpoint = WHATSAPP_ENDPOINT;
          console.log('📤 [FormSolicitacao] Enviando para WhatsApp API:', whatsappEndpoint);
          console.log('📤 [FormSolicitacao] Payload:', payload);
          
          res = await fetch(whatsappEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (res && res.ok) {
            try {
              const data = await res.json();
              console.log('✅ [FormSolicitacao] Resposta do WhatsApp:', data);
              waMessageId = data?.messageId || data?.key?.id || null;
            } catch (err) {
              console.error('❌ [FormSolicitacao] Erro ao parsear resposta do WhatsApp:', err);
            }
          } else {
            // Tentar ler mensagem de erro
            try {
              const errorData = await res.json();
              console.error('❌ [FormSolicitacao] Erro da API WhatsApp:', errorData);
              
              // Detectar erro específico de WhatsApp desconectado
              const errorMessage = errorData?.error || '';
              const isWhatsAppDisconnected = res.status === 503 && (
                errorMessage.toLowerCase().includes('whatsapp desconectado') ||
                errorMessage.toLowerCase().includes('whatsapp está desconectado') ||
                errorMessage.toLowerCase().includes('websocket') ||
                errorMessage.toLowerCase().includes('não está disponível')
              );
              
              if (isWhatsAppDisconnected) {
                console.warn('⚠️ [FormSolicitacao] WhatsApp está desconectado');
                if (registrarLog) registrarLog('⚠️ WhatsApp está desconectado. A solicitação foi registrada no painel.');
              } else if (res.status === 503) {
                console.warn('⚠️ [FormSolicitacao] Serviço WhatsApp temporariamente indisponível');
                if (registrarLog) registrarLog('⚠️ Serviço WhatsApp temporariamente indisponível. A solicitação foi registrada no painel.');
              }
            } catch (e) {
              console.error('❌ [FormSolicitacao] Erro HTTP:', res.status, res.statusText);
              if (res.status === 503) {
                if (registrarLog) registrarLog('⚠️ Serviço WhatsApp indisponível. A solicitação foi registrada no painel.');
              }
            }
          }
        } catch (err) {
          console.error('❌ [FormSolicitacao] Erro ao enviar via WhatsApp:', err);
        }
      }

      // 2) DEPOIS: Criar solicitação no backend com waMessageId já obtido
      // CPF sempre apenas números (sem formatação) para o backend também
      const solicitacaoData = {
        agente: agenteNorm || form.agente,
        cpf: cpfApenasNumeros, // Usar CPF normalizado (apenas números)
        tipo: form.tipo,
        payload: { ...form, cpf: cpfApenasNumeros }, // Garantir CPF normalizado no payload também
        mensagemTexto,
        agentContact: defaultJid || null,
        waMessageId: waMessageId || null,
      };

      console.log('📤 [FormSolicitacao] Enviando solicitação:', {
        tipo: solicitacaoData.tipo,
        cpf: solicitacaoData.cpf,
        agente: solicitacaoData.agente,
        payloadKeys: Object.keys(solicitacaoData.payload),
      });

      let result;
      try {
        result = await solicitacoesAPI.create(solicitacaoData);
        console.log('✅ [FormSolicitacao] Solicitação criada no backend:', result);
      } catch (apiErr) {
        console.error('❌ [FormSolicitacao] Erro ao criar solicitação no backend:', apiErr);
        throw apiErr; // Re-throw para ser capturado pelo catch externo
      }

      // Criar log
      try {
        await logsAPI.create({
          action: 'send_request',
          detail: {
            tipo: form.tipo,
            cpf: cpfApenasNumeros, // CPF normalizado no log também
            waMessageId,
            whatsappSent: !!waMessageId,
            alteracao: form.tipo === 'Alteração de Dados Cadastrais' ? {
              infoTipo: form.infoTipo || '',
              dadoAntigo: form.dadoAntigo || '',
              dadoNovo: form.dadoNovo || '',
              fotosVerificadas: !!form.fotosVerificadas,
            } : undefined,
            observacoes: form.observacoes || '',
          },
        });
      } catch (logErr) {
        console.error('Erro ao criar log:', logErr);
      }

      // 3) Atualizar UI/Cache baseado no resultado do WhatsApp
      if (!apiUrl || !defaultJid) {
        if (registrarLog) registrarLog('ℹ️ WhatsApp não configurado: apenas registrado no painel');
        showNotification('Solicitação registrada', 'info');
      } else if (res.ok && waMessageId) {
        if (registrarLog) registrarLog('✅ Enviado com sucesso');
        showNotification('Solicitação enviada', 'success');
      } else {
        // Mensagem mais específica baseada no status
        let errorMessage = 'Erro desconhecido';
        let logMessage = `❌ Erro da API: Erro ${res.status || 'desconhecido'}`;
        
        if (res.status === 503) {
          errorMessage = 'WhatsApp está desconectado. A solicitação foi registrada no painel.';
          logMessage = '⚠️ WhatsApp desconectado. Solicitação registrada no painel.';
        } else if (res.status) {
          errorMessage = `Erro ${res.status} ao enviar para WhatsApp. A solicitação foi registrada no painel.`;
          logMessage = `❌ Erro ${res.status} da API WhatsApp. Solicitação registrada no painel.`;
        }
        
        if (registrarLog) registrarLog(logMessage);
        showNotification(errorMessage, 'warning');
        notifyError('Falha ao enviar solicitação', errorMessage);
      }

      const newItem = {
        cpf: cpfApenasNumeros, // CPF normalizado no cache também
        tipo: form.tipo,
        waMessageId,
        status: waMessageId ? 'enviado' : 'em aberto',
        enviado: !!waMessageId,
        createdAt: new Date().toISOString(),
      };
      saveCache([newItem, ...localLogs].slice(0, 50));

      // Limpar formulário
      setForm({
        agente: agenteNorm || '',
        cpf: '',
        tipo: 'Alteração de Dados Cadastrais',
        infoTipo: 'Telefone',
        dadoAntigo: '',
        dadoNovo: '',
        fotosVerificadas: false,
        observacoes: '',
        // Campos para Exclusão de Chave PIX
        semDebitoAberto: false,
        n2Ouvidora: false,
        procon: false,
        reclameAqui: false,
        processo: false,
        bacen: false,
        prazoMaximo: '',
        // Campos para Aumento de Limite Pix e Cancelamento
        valor: '',
        nomeCliente: '',
        dataContratacao: '',
        // Campos para Cancelamento (existente)
        seguroPrestamista: false,
        seguroSaude: false,
        seguroCelular: false,
        seguroDividaZero: false,
        clubeVelotax: false,
        dentroDos7Dias: false,
        depoisDos7Dias: false,
      });
    } catch (err) {
      console.error('❌ [FormSolicitacao] Erro ao enviar solicitação:', err);
      console.error('❌ [FormSolicitacao] Detalhes do erro:', {
        message: err.message,
        stack: err.stack,
        tipo: form.tipo,
        cpf: form.cpf,
      });
      if (registrarLog) registrarLog(`❌ Falha de conexão com a API: ${err.message || 'Erro desconhecido'}`);
      showNotification(`Falha de conexão: ${err.message || 'Erro desconhecido'}`, 'error');
      notifyError('Falha de conexão', err.message || 'Não foi possível contactar a API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Notificação simples - Canto superior direito DA TELA (viewport), logo abaixo do header */}
      {/* Renderizado via Portal diretamente no body para garantir posicionamento fixo na viewport */}
      {notification.show && typeof document !== 'undefined' && createPortal(
        <div 
          className={`px-4 py-3 rounded shadow-lg text-white ${
            notification.type === 'success' ? 'bg-green-500/70' :
            notification.type === 'error' ? 'bg-red-500/60' :
            'bg-blue-500/70'
          }`} 
          style={{ 
            borderRadius: '4px',
            position: 'fixed',
            top: '80px',
            right: '16px',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
        >
          {notification.message}
        </div>,
        document.body
      )}

      <form
        onSubmit={enviar}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            enviar(e);
          }
        }}
        className="space-y-5 relative"
        aria-busy={loading}
        aria-live="polite"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">CPF</label>
            <div className="relative">
              <input
                className={`w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white ${
                  validarCPF(form.cpf)
                    ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                    : 'border-gray-400 dark:border-gray-500 focus:ring-2 focus:ring-blue-500'
                }`}
                placeholder="000.000.000-00"
                value={formatarCPF(form.cpf)}
                onChange={(e) => atualizar('cpf', e.target.value)}
                maxLength={14}
                required
              />
            </div>
            {cpfError && (
              <div className="mt-1 text-xs text-red-600">{cpfError}</div>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">Tipo de Solicitação</label>
            <select
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              value={form.tipo}
              onChange={(e) => atualizar('tipo', e.target.value)}
            >
              <option>Alteração de Dados Cadastrais</option>
              <option>Aumento de Limite Pix</option>
              <option>Exclusão de Chave PIX</option>
              <option>Reativação de Conta</option>
              <option>Reset de Senha</option>
              <option value="Cancelamento">Cancelamento</option>
            </select>
          </div>
        </div>

        {form.tipo === 'Alteração de Dados Cadastrais' && (
          <div className="p-4 rounded-lg mt-2" style={{ background: 'transparent', border: '1.5px solid #000058', borderRadius: '8px' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Tipo de informação</label>
                <select
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  value={form.infoTipo}
                  onChange={(e) => {
                    const novoTipo = e.target.value;
                    // Limpar campos quando mudar o tipo de informação
                    if (novoTipo !== form.infoTipo) {
                      setForm(prev => {
                        const novoForm = { ...prev, infoTipo: novoTipo, dadoAntigo: '', dadoNovo: '' };
                        // Se mudou para Telefone, garantir que os campos vazios estejam prontos para formatação
                        return novoForm;
                      });
                    } else {
                      atualizar('infoTipo', novoTipo);
                    }
                  }}
                >
                  <option value="Telefone">Telefone</option>
                  <option value="E-mail">E-mail</option>
                  <option value="Nome">Nome</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="flex items-center pt-7 gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={form.fotosVerificadas}
                  onChange={(e) => atualizar('fotosVerificadas', e.target.checked)}
                />
                <label className="text-gray-700 dark:text-gray-300">Fotos verificadas</label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Dado antigo</label>
                <input
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  type={form.infoTipo === 'Telefone' ? 'tel' : form.infoTipo === 'E-mail' ? 'email' : 'text'}
                  placeholder={
                    form.infoTipo === 'Telefone' ? '(XX)XXXXX-XXXX' :
                    form.infoTipo === 'E-mail' ? 'email@dominio.com.br' :
                    ''
                  }
                  value={
                    form.infoTipo === 'Telefone' ? formatarTelefone(form.dadoAntigo) :
                    form.infoTipo === 'E-mail' ? formatarEmail(form.dadoAntigo) :
                    form.dadoAntigo
                  }
                  onChange={(e) => atualizar('dadoAntigo', e.target.value)}
                  maxLength={form.infoTipo === 'Telefone' ? 15 : undefined}
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Dado novo</label>
                <input
                  className={`w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white ${
                    form.infoTipo === 'Telefone' && validarTelefone(form.dadoNovo)
                      ? 'border-green-500 focus:ring-1 focus:ring-green-500'
                      : form.infoTipo === 'E-mail' && validarEmail(form.dadoNovo)
                      ? 'border-green-500 focus:ring-1 focus:ring-green-500'
                      : 'border-gray-400 dark:border-gray-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                  type={form.infoTipo === 'Telefone' ? 'tel' : form.infoTipo === 'E-mail' ? 'email' : 'text'}
                  placeholder={
                    form.infoTipo === 'Telefone' ? '(XX)XXXXX-XXXX' :
                    form.infoTipo === 'E-mail' ? 'email@dominio.com.br' :
                    ''
                  }
                  value={
                    form.infoTipo === 'Telefone' ? formatarTelefone(form.dadoNovo) :
                    form.infoTipo === 'E-mail' ? formatarEmail(form.dadoNovo) :
                    form.dadoNovo
                  }
                  onChange={(e) => atualizar('dadoNovo', e.target.value)}
                  maxLength={form.infoTipo === 'Telefone' ? 15 : undefined}
                />
              </div>
            </div>
          </div>
        )}

        {form.tipo === 'Exclusão de Chave PIX' && (
          <div className="p-4 rounded-lg mt-2" style={{ background: 'transparent', border: '1.5px solid #000058', borderRadius: '8px' }}>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">* Selecione pelo menos uma opção:</p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={form.semDebitoAberto || false}
                onChange={(e) => atualizar('semDebitoAberto', e.target.checked)}
              />
              <span>Sem Débito em aberto</span>
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={form.n2Ouvidora || false}
                onChange={(e) => atualizar('n2Ouvidora', e.target.checked)}
              />
              <span>N2 - Ouvidora</span>
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={form.procon || false}
                onChange={(e) => atualizar('procon', e.target.checked)}
              />
              <span>Procon</span>
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={form.reclameAqui || false}
                onChange={(e) => atualizar('reclameAqui', e.target.checked)}
              />
              <span>Reclame Aqui</span>
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={form.processo || false}
                onChange={(e) => atualizar('processo', e.target.checked)}
              />
              <span>Processo</span>
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={form.bacen || false}
                onChange={(e) => atualizar('bacen', e.target.checked)}
              />
              <span>Bacen</span>
            </label>
            
            {/* Campo Prazo Máximo - aparece quando qualquer checkbox relevante estiver marcado */}
            {(form.reclameAqui || form.bacen || form.procon || form.processo || form.n2Ouvidora) && (
              <div className="mt-4">
                <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Prazo Máximo</label>
                <input
                  type="date"
                  className="w-auto px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
                  value={form.prazoMaximo || ''}
                  onChange={(e) => atualizar('prazoMaximo', e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {form.tipo === 'Aumento de Limite Pix' && (
          <div className="p-4 rounded-lg mt-2" style={{ background: 'transparent', border: '1.5px solid #000058', borderRadius: '8px' }}>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Valor</label>
              <input
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                type="text"
                placeholder="R$0,00"
                value={formatarMoeda(form.valor)}
                onChange={(e) => atualizar('valor', e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {form.tipo === 'Cancelamento' && (
          <div className="p-4 rounded-lg mt-2" style={{ background: 'transparent', border: '1.5px solid #000058', borderRadius: '8px' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Nome do Cliente</label>
                <input
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  type="text"
                  placeholder="Nome completo do cliente"
                  value={form.nomeCliente || ''}
                  onChange={(e) => atualizar('nomeCliente', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Data da Contratação</label>
                <input
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  type="date"
                  value={form.dataContratacao || ''}
                  onChange={(e) => atualizar('dataContratacao', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Valor</label>
                <input
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  type="text"
                  placeholder="R$0,00"
                  value={formatarMoeda(form.valor)}
                  onChange={(e) => atualizar('valor', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300">Observações</label>
          <textarea
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 h-28 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Adicione observações adicionais..."
            value={form.observacoes}
            onChange={(e) => atualizar('observacoes', e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            disabled={loading}
            className={`bg-blue-600 text-white font-medium px-5 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 inline-flex items-center gap-2 ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            type="submit"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </>
            ) : (
              'Enviar Solicitação'
            )}
          </button>
        </div>

        {buscaResultados && buscaResultados.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 backdrop-blur p-4 rounded-xl border border-gray-200 dark:border-gray-700 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Histórico recente para {String(buscaCpf || form.cpf)}
              </h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {buscaResultados.map((r) => (
                <div
                  key={r._id || r.id}
                  className="p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {r.tipo} — {r.cpf}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Agente: {r.colaboradorNome || r.agente || '—'} • Status: {r.status || '—'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs de Envio */}
        <div className="bg-gray-50 dark:bg-gray-800 backdrop-blur p-4 rounded-xl border border-gray-200 dark:border-gray-700 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Logs de Envio</h2>
          </div>
          {(!localLogs || localLogs.length === 0) && (
            <div className="text-gray-600 dark:text-gray-400">Nenhum log ainda.</div>
          )}
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {localLogs.map((l, idx) => {
              const s = String(l.status || '').toLowerCase();
              const isDoneFail = s === 'não feito' || s === 'nao feito';
              const isDoneOk = s === 'feito';
              const sentOnly = !isDoneOk && !isDoneFail && (s === 'enviado' || l.enviado === true);
              const colorDone1 = isDoneFail ? 'bg-red-500' : 'bg-emerald-500';
              const colorDone2 = isDoneFail ? 'bg-red-500' : 'bg-emerald-500';
              const colorDone3 = isDoneFail ? 'bg-red-500' : 'bg-emerald-500';
              const bar1 = (isDoneOk || isDoneFail) ? colorDone1 : (sentOnly ? 'bg-amber-400' : 'bg-gray-300 dark:bg-gray-600');
              const bar2 = (isDoneOk || isDoneFail) ? colorDone2 : (sentOnly ? 'bg-amber-400' : 'bg-gray-300 dark:bg-gray-600');
              const bar3 = (isDoneOk || isDoneFail) ? colorDone3 : 'bg-gray-300 dark:bg-gray-600';
              const icon = isDoneOk ? '✅' : (isDoneFail ? '❌' : (sentOnly ? '📨' : '⏳'));
              return (
                <div
                  key={idx}
                  className="p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{icon}</span>
                      <span className="text-sm text-gray-800 dark:text-gray-200">
                        {l.cpf} — {l.tipo}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(l.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5" aria-label={`progresso: ${s || 'em aberto'}`}>
                    <span className={`h-1.5 w-8 rounded-full ${bar1}`}></span>
                    <span className={`h-1.5 w-8 rounded-full ${bar2}`}></span>
                    <span className={`h-1.5 w-8 rounded-full ${bar3}`}></span>
                    <span className="text-[11px] opacity-60 ml-2 text-gray-600 dark:text-gray-400">
                      {s || 'em aberto'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {loading && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.20), rgba(2,6,23,0.35))' }}
          >
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-800 dark:text-gray-200">Enviando solicitação...</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </>
  );
};

export default FormSolicitacao;

