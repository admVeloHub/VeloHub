/**
 * VeloChatWidget - Componente Principal do Chat
 * VERSION: v3.17.1 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v3.17.1:
 * - Removidos logs de debug após correção bem-sucedida
 * 
 * 
 * Mudanças v3.17.0:
 * - Corrigido polling para não recriar intervalo constantemente (usando refs)
 * - Reduzido polling de 10s para 5s
 * - Adicionado polling periódico para conversas (5s)
 * - Melhorado sistema de notificações de áudio (volume, preload, tratamento de erros)
 * - Melhorada detecção de mensagens próprias (comparação normalizada)
 * - Notificações de áudio agora funcionam mesmo quando sidebar está recolhida
 * 
 * Mudanças v3.16.0:
 * - Refatorado sistema de gerenciamento de salas com campo bloqueioAdm
 * - Removido campo salaProfilePic do modal de criação
 * - Adicionado checkbox "Impedir gerenciamento da sala" no modal de criação
 * - Criado novo modal de gerenciamento de sala acessível via clique no badge
 * - Implementadas permissões baseadas em bloqueioAdm e criadoPor
 * - Implementada função de sair da sala
 * - Ajustadas cores do badge da sala (azul claro com contorno azul escuro)
 * - Removido botão "gerenciar participantes" do header
 * - Implementada remoção imediata de participante ao desmarcar checkbox
 * 
 * Mudanças v3.15.0:
 * - Melhorada lógica de retry para carregamento de conversas e contatos
 * - Aumentado timeout de 500ms para 2000ms
 * - Adicionadas múltiplas tentativas de retry (até 3 tentativas)
 * - Adicionados logs para debug do processo de carregamento
 * 
 * Mudanças v3.14.0:
 * - Adicionada verificação de sessionId antes de carregar conversas e contatos
 * - Adicionado retry com timeout para aguardar sessionId estar disponível
 * 
 * Mudanças v3.13.0:
 * - Removidos logs de debug do endpoint de ingest que causavam erros no console
 * 
 * Mudanças v3.12.0:
 * - Adicionada lista específica de tipos MIME aceitos para documentos (PDF, Word, Excel, JSON, CSV, etc.)
 * - Atualizado atributo accept do input de arquivo para filtrar corretamente por tipo (imagem, vídeo, documento)
 * - Ajustado timing dos handlers dos botões do menu para garantir que selectedMediaType seja atualizado antes de abrir o seletor
 * - Adicionada validação no onChange para verificar se documentos são tipos MIME válidos
 * 
 * Mudanças v3.11.0:
 * - CORRIGIDO: Modal de anexo movido para nível superior do componente (estava dentro de renderConversationView)
 * - Modal agora é renderizado independentemente da view atual (conversation/contacts/salas)
 * - Modal agora abre corretamente ao clicar na thumbnail de imagem
 * 
 * Mudanças v3.10.0:
 * - Corrigido clique na thumbnail de imagem: onClick movido para container div ao invés da tag img
 * - Adicionado pointer-events-none na imagem para permitir click no container
 * - Adicionado z-10 no botão de download para garantir que ele capture clicks corretamente
 * 
  * Widget de chat integrado na sidebar do VeloHub
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import * as velochatApi from '../services/velochatApi';
import { AttachFile, Image, Videocam, InsertDriveFile, Close, GroupAdd, Download, PictureAsPdf, Description } from '@mui/icons-material';
import { API_BASE_URL } from '../config/api-config';

// Tipos MIME aceitos para documentos
const ACCEPTED_DOCUMENT_TYPES = [
  // PDF
  'application/pdf',
  // Microsoft Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Microsoft Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // JSON
  'application/json',
  // CSV
  'text/csv',
  // Texto
  'text/plain',
  // Outros formatos comuns
  'application/rtf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed'
];

const ACCEPTED_DOCUMENT_TYPES_STRING = ACCEPTED_DOCUMENT_TYPES.join(',');

/**
 * Verifica se um tipo MIME é um documento válido
 */
const isValidDocumentType = (mimeType) => {
  if (!mimeType) return false;
  return ACCEPTED_DOCUMENT_TYPES.includes(mimeType);
};

const VeloChatWidget = ({ activeTab = 'conversations', searchQuery = '' }) => {
  // Estados principais
  const [view, setView] = useState('contacts'); // 'contacts' | 'conversation'
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [error, setError] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [chatStatus, setChatStatus] = useState('online');
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [bloqueioAdm, setBloqueioAdm] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedMediaType, setSelectedMediaType] = useState(null);
  const [salaParticipants, setSalaParticipants] = useState([]);
  const [showManageParticipantsModal, setShowManageParticipantsModal] = useState(false);
  const [participantsToAdd, setParticipantsToAdd] = useState([]);
  const [manageError, setManageError] = useState(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [salaNomeEdit, setSalaNomeEdit] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [filePreview, setFilePreview] = useState(null); // URL do preview (data URL ou blob URL)
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  /**
   * Obter email do usuário atual
   */
  const getCurrentUserEmail = () => {
    try {
      // Tentar obter do localStorage usando a chave correta
      const sessionData = localStorage.getItem('velohub_user_session') || localStorage.getItem('veloacademy_user_session') || localStorage.getItem('velohub_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        return session.user?.email || session?.user?.email || '';
      }
    } catch (error) {
      console.error('Erro ao obter email do usuário:', error);
    }
    return '';
  };

  /**
   * Função auxiliar para normalizar nomes na comparação (case-insensitive, trim)
   */
  const normalizeName = (name) => {
    if (!name) return '';
    return String(name).trim().toLowerCase();
  };

  /**
   * Obter nome do usuário atual
   */
  const getCurrentUserName = () => {
    try {
      // Tentar obter do localStorage usando a chave correta
      const sessionData = localStorage.getItem('velohub_user_session') || localStorage.getItem('veloacademy_user_session') || localStorage.getItem('velohub_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const name = session.user?.name || session.colaboradorNome || session?.user?.email || '';
        // Normalizar: trim para remover espaços extras
        return name.trim();
      }
    } catch (error) {
      console.error('Erro ao obter nome do usuário:', error);
    }
    return '';
  };

  /**
   * Funções de áudio (definidas antes dos handlers para garantir acesso)
   */
  const playNotificationSound = useCallback(() => {
    try {
      const soundEnabled = localStorage.getItem('velochat_sound_enabled') !== 'false';
      if (soundEnabled) {
        const audio = new Audio('/notificação simples.mp3');
        // Configurar volume e garantir reprodução
        audio.volume = 0.7;
        audio.preload = 'auto';
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            // Áudio reproduzido com sucesso
          }).catch(error => {
            console.warn('Erro ao reproduzir som de notificação:', error);
          });
        }
      }
    } catch (error) {
      console.warn('Erro ao reproduzir som de notificação:', error);
    }
  }, []);

  const playCallerSignSound = useCallback(() => {
    try {
      // Este áudio sempre executa, ignorando status de som
      const audio = new Audio('/caller sign.mp3');
      // Configurar volume e garantir reprodução
      audio.volume = 0.8;
      audio.preload = 'auto';
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Áudio reproduzido com sucesso
        }).catch(error => {
          console.warn('Erro ao reproduzir som de chamada:', error);
        });
      }
    } catch (error) {
      console.warn('Erro ao reproduzir som de chamada:', error);
    }
  }, []);

  // WebSocket handlers - usando useCallback para evitar recriação
  const handleNewMessage = useCallback((message) => {
    const currentConversationId = selectedConversation?.conversationId || selectedConversation?.Id;
    const messageConversationId = message.conversationId || message.salaId;
    
    // Normalizar IDs para comparação
    const normalizedCurrent = String(currentConversationId || '').trim();
    const normalizedMessage = String(messageConversationId || '').trim();
    
    // Obter nome do usuário atual para verificar se a mensagem é dele
    const currentUserName = getCurrentUserName();
    // Comparação mais robusta: normalizar espaços e case
    const normalizedCurrentUserName = String(currentUserName || '').trim().toLowerCase();
    const normalizedMessageUserName = String(message.userName || '').trim().toLowerCase();
    const isFromCurrentUser = normalizedCurrentUserName && normalizedMessageUserName && normalizedCurrentUserName === normalizedMessageUserName;
    
    // Verificar se é mensagem especial de chamada de atenção
    const isCallerSign = message.mensagem === '[att-caller-sign]' || message.content === '[att-caller-sign]';
    
    // Reproduzir áudio apropriado - SEMPRE reproduzir para mensagens de outros usuários
    // Mesmo quando sidebar está recolhida, o áudio deve ser reproduzido
    if (!isFromCurrentUser) {
      if (isCallerSign) {
        // Áudio de chamada sempre executa, ignorando status de som
        playCallerSignSound();
      } else {
        // Áudio normal respeita status de som
        playNotificationSound();
      }
    }
    
    // Notificação de sistema se usuário não está visualizando a tela e mensagem não é dele
    if (document.hidden && !isFromCurrentUser && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const notificationBody = isCallerSign 
          ? `${message.userName} está chamando sua atenção!`
          : `${message.userName}: ${message.mensagem}`;
        new Notification('Nova mensagem', {
          body: notificationBody,
          icon: '/mascote avatar.png'
        });
      }
    }
    
    if (normalizedMessage === normalizedCurrent) {
      // Verificar se já existe (evitar duplicatas) e substituir temporárias
      setMessages(prev => {
        // Remover mensagem temporária se existir (mesmo conteúdo + userName + timestamp próximo)
        const withoutTemp = prev.filter(msg => {
          if (msg.isTemporary && 
              msg.mensagem === message.mensagem && 
              msg.userName === message.userName) {
            // Se é temporária com mesmo conteúdo e usuário, remover se timestamp estiver próximo (dentro de 10s)
            const timeDiff = Math.abs((msg.timestamp || 0) - (message.timestamp || 0));
            return timeDiff > 10000; // Se diferença > 10s, manter ambas (caso raro de mensagens muito similares)
          }
          return true;
        });
        
        // Verificar se mensagem real já existe (evitar duplicatas)
        const exists = withoutTemp.some(msg => 
          !msg.isTemporary &&
          msg.mensagem === message.mensagem && 
          msg.userName === message.userName &&
          Math.abs((msg.timestamp || 0) - (message.timestamp || 0)) < 2000 // Dentro de 2s = mesma mensagem
        );
        
        if (exists) return withoutTemp;
        
        // Adicionar mensagem real no final (mensagens mais recentes ficam abaixo)
        // Validar e processar mediaUrl se presente
        let mediaUrl = message.mediaUrl || null;
        let mediaType = message.mediaType || null;
        
        // Validar URL se presente
        if (mediaUrl) {
          try {
            new URL(mediaUrl); // Validar formato de URL
            console.log('✅ [handleNewMessage] Anexo recebido:', { mediaUrl, mediaType });
          } catch (urlError) {
            console.warn('⚠️ [handleNewMessage] URL inválida recebida:', mediaUrl);
            mediaUrl = null; // Invalidar URL inválida
            mediaType = null;
          }
        }
        
        // Extrair nome do arquivo da URL se não estiver disponível
        let fileName = message.name || null;
        if (!fileName && mediaUrl) {
          try {
            const urlParts = mediaUrl.split('/');
            fileName = urlParts[urlParts.length - 1].split('?')[0];
          } catch {
            fileName = 'Anexo';
          }
        }
        
        const formattedMessage = {
          _id: message._id || `msg-${Date.now()}`,
          messageId: message._id || `msg-${Date.now()}`,
          userName: message.userName,
          senderName: message.userName,
          mensagem: isCallerSign ? 'Chamando sua atenção!' : message.mensagem, // Substituir texto especial
          content: isCallerSign ? 'Chamando sua atenção!' : message.mensagem,
          originalContent: isCallerSign ? '[att-caller-sign]' : message.mensagem, // Manter original para referência
          timestamp: message.timestamp,
          createdAt: message.timestamp,
          mediaUrl: mediaUrl,                          // URL validada da mídia
          mediaType: mediaType,                        // Tipo da mídia
          name: fileName,                              // Nome do arquivo extraído
          attachments: message.attachments || [],      // Manter compatibilidade
          isTemporary: false,
          isCallerSign: isCallerSign                   // Flag para identificar mensagem especial
        };
        
        // Adicionar no final e ordenar por timestamp ascendente (mais antiga primeiro, mais recente abaixo)
        const sorted = [...withoutTemp, formattedMessage].sort((a, b) => {
          const timeA = new Date(a.timestamp || a.createdAt || 0);
          const timeB = new Date(b.timestamp || b.createdAt || 0);
          return timeA - timeB; // Ascendente (mais antiga primeiro, mais recente abaixo)
        });
        
        return sorted;
      });
      
      // Scroll apenas se for uma nova mensagem (não temporária) e usuário estiver próximo do final
      scrollToBottom(false); // Não forçar, verificar se usuário está próximo do final
    } else {
      // Mensagem de outra conversa - atualizar contador de não lidas
      setUnreadCounts(prev => ({
        ...prev,
        [messageConversationId]: (prev[messageConversationId] || 0) + 1
      }));
    }
  }, [selectedConversation, playNotificationSound, playCallerSignSound]);

  const handleTyping = useCallback((data) => {
    if (data.conversationId === selectedConversation?.conversationId) {
      setTypingUsers(prev => ({
        ...prev,
        [data.userEmail]: data.isTyping ? data.userName : null
      }));
      
      // Limpar indicador após 3 segundos
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUsers(prev => {
          const newTyping = { ...prev };
          delete newTyping[data.userEmail];
          return newTyping;
        });
      }, 3000);
    }
  }, [selectedConversation]);

  const handleRead = useCallback((data) => {
    // Atualizar status de leitura se necessário
    console.log('Mensagem lida:', data);
  }, []);

  // Handler para mudanças de status de contatos
  const handleContactStatusChange = useCallback((data) => {
    setContacts(prev => {
      const updated = prev.map(contact => 
        contact.userEmail === data.userEmail
          ? { ...contact, status: data.status, isActive: data.status === 'online' }
          : contact
      );
      
      return updated;
    });
  }, []);

  // Handler para atualizações de conversas
  const handleConversationUpdate = useCallback((data) => {
    if (data.type === 'created') {
      // Adicionar nova conversa à lista
      setConversations(prev => [data.conversation, ...prev]);
    } else if (data.type === 'last_message_updated') {
      // Atualizar última mensagem e reordenar conversas
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.conversationId === data.conversationId || conv.salaId === data.conversationId
            ? {
                ...conv,
                lastMessage: data.lastMessage,
                lastMessageAt: data.timestamp
              }
            : conv
        );
        // Reordenar por última mensagem (mais recente primeiro)
        return updated.sort((a, b) => {
          const timeA = a.lastMessageAt || a.updatedAt || a.createdAt || 0;
          const timeB = b.lastMessageAt || b.updatedAt || b.createdAt || 0;
          return new Date(timeB) - new Date(timeA);
        });
      });
    }
  }, []);

  // WebSocket connection
  const {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage: wsSendMessage,
    sendTyping,
    markRead
  } = useWebSocket(
    handleNewMessage, 
    handleTyping, 
    handleRead,
    handleContactStatusChange,
    handleConversationUpdate
  );

  /**
   * Calcular mensagens não lidas de uma conversa
   */
  const calculateUnread = useCallback((conv) => {
    const conversationId = conv.conversationId || conv.Id;
    if (!conversationId) return 0;
    
    // Verificar se há contador em estado (mensagens recebidas em tempo real)
    if (unreadCounts[conversationId] !== undefined) {
      return unreadCounts[conversationId];
    }
    
    // Verificar última visualização
    const lastViewed = localStorage.getItem(`chat-viewed-${conversationId}`);
    if (!lastViewed || !conv.lastMessage) return 0;
    
    const lastMessageTime = new Date(conv.lastMessage.timestamp || conv.lastMessageAt);
    const viewedTime = new Date(lastViewed);
    
    return lastMessageTime > viewedTime ? 1 : 0;
  }, [unreadCounts]);

  /**
   * Carregar conversas do usuário
   */
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await velochatApi.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carregar contatos do usuário
   */
  const loadContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      setError(null);
      const data = await velochatApi.getContacts();
      
      // Filtrar contatos omitindo usuários com acessos.Velotax === false
      const filteredContacts = (data.contacts || []).filter(contact => {
        const acessos = contact.acessos || {};
        const velotax = acessos.Velotax ?? acessos.velotax ?? true;
        return velotax !== false; // Incluir apenas se velotax !== false
      });
      
      setContacts(filteredContacts);
    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
      setError(err.message);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  // Verificar se sessionId está disponível antes de carregar dados
  const hasSessionId = () => {
    try {
      return !!localStorage.getItem('velohub_session_id');
    } catch (error) {
      return false;
    }
  };

  // Fechar diálogo quando a aba mudar (mesmo efeito de clicar no botão voltar)
  const prevActiveTabRef = useRef(activeTab);
  useEffect(() => {
    // Só fechar se a aba realmente mudou (não na primeira renderização)
    if (prevActiveTabRef.current !== activeTab && view === 'conversation' && selectedConversation) {
      setView('contacts');
      setSelectedConversation(null);
      setMessages([]);
    }
    prevActiveTabRef.current = activeTab;
  }, [activeTab]);

  // Carregar conversas ao montar e sempre que activeTab mudar para 'conversations'
  // Isso garante que conversas prévias sejam carregadas ao iniciar o VeloHub
  useEffect(() => {
    if (activeTab === 'conversations' && hasSessionId()) {
      loadConversations();
    }
  }, [activeTab, loadConversations]);

  // Ref para armazenar a função loadConversations mais recente (evita recriação do intervalo)
  const loadConversationsRef = useRef(loadConversations);
  useEffect(() => {
    loadConversationsRef.current = loadConversations;
  }, [loadConversations]);

  // Polling periódico para atualizar conversas (5 segundos)
  useEffect(() => {
    // Apenas fazer polling se a aba estiver ativa
    if (activeTab !== 'conversations') {
      return;
    }

    let intervalId = null;

    const pollConversations = () => {
      // Polling deve continuar mesmo quando sidebar está recolhida
      // Apenas pular se a aba do navegador estiver oculta (document.hidden)
      if (document.hidden) {
        return;
      }

      // Usar ref para sempre usar a versão mais recente da função
      loadConversationsRef.current().then(() => {
      }).catch(err => {
      });
    };

    // Configurar polling a cada 5 segundos
    intervalId = setInterval(pollConversations, 5000);

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTab]); // Removido loadConversations das dependências

  // Carregar conversas ao montar o componente (independente da aba ativa)
  // Aguardar sessionId estar disponível com retry mais robusto
  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 segundos

    const tryLoadConversations = () => {
      if (hasSessionId()) {
        console.log('✅ VeloChatWidget: sessionId disponível, carregando conversas...');
        loadConversations();
      } else if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`⏳ VeloChatWidget: sessionId não disponível, tentativa ${retryCount}/${MAX_RETRIES}...`);
        const timeoutId = setTimeout(tryLoadConversations, RETRY_DELAY);
        return () => clearTimeout(timeoutId);
      } else {
        console.warn('⚠️ VeloChatWidget: sessionId não disponível após múltiplas tentativas');
      }
    };

    tryLoadConversations();
  }, [loadConversations]);

  // Carregar contatos quando aba de contatos ou conversas estiver ativa (para mostrar status)
  useEffect(() => {
    if ((activeTab === 'contacts' || activeTab === 'conversations') && hasSessionId()) {
      loadContacts();
    } else if ((activeTab === 'contacts' || activeTab === 'conversations') && !hasSessionId()) {
      // Tentar novamente após delay com retry
      let retryCount = 0;
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 2000; // 2 segundos

      const tryLoadContacts = () => {
        if (hasSessionId()) {
          console.log('✅ VeloChatWidget: sessionId disponível, carregando contatos...');
          loadContacts();
        } else if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`⏳ VeloChatWidget: sessionId não disponível para contatos, tentativa ${retryCount}/${MAX_RETRIES}...`);
          const timeoutId = setTimeout(tryLoadContacts, RETRY_DELAY);
          return () => clearTimeout(timeoutId);
        }
      };

      const timeoutId = setTimeout(tryLoadContacts, RETRY_DELAY);
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, loadContacts]);

  // Inicializar estados do modal de gerenciamento quando abrir
  useEffect(() => {
    if (showManageParticipantsModal && selectedConversation && selectedConversation.type === 'sala') {
      setSalaNomeEdit(selectedConversation.salaNome || selectedConversation.name || '');
      setSelectedParticipants(
        salaParticipants.map(p => p.userEmail || p.userName || p.colaboradorNome)
      );
    }
  }, [showManageParticipantsModal, selectedConversation, salaParticipants]);

  // Solicitar permissão de notificação ao montar componente
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // Ignorar erro se usuário negar permissão
      });
    }
  }, []);

  // Fechar menu de anexo ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };

    if (showAttachmentMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachmentMenu]);

  // Fechar menu de anexo ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };

    if (showAttachmentMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachmentMenu]);

  // Ref para armazenar a função loadContacts mais recente (evita recriação do intervalo)
  const loadContactsRef = useRef(loadContacts);
  useEffect(() => {
    loadContactsRef.current = loadContacts;
  }, [loadContacts]);

  // Polling periódico para atualizar status dos contatos (5 segundos)
  useEffect(() => {
    // Apenas fazer polling se a aba estiver ativa
    if (activeTab !== 'contacts' && activeTab !== 'conversations') {
      return;
    }

    let intervalId = null;

    const pollContacts = () => {
      // Polling deve continuar mesmo quando sidebar está recolhida
      // Apenas pular se a aba do navegador estiver oculta (document.hidden)
      if (document.hidden) {
        return;
      }

      // Usar ref para sempre usar a versão mais recente da função
      loadContactsRef.current().then(() => {
        // Contatos atualizados
      }).catch(err => {
        console.error('Erro ao atualizar contatos:', err);
      });
    };

    // Configurar polling a cada 5 segundos
    intervalId = setInterval(pollContacts, 5000);

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTab]); // Removido loadContacts das dependências

  // Atualizar status dos contatos quando a aba recebe foco (para atualização imediata)
  useEffect(() => {
    const handleFocus = () => {
      // Recarregar contatos quando a janela recebe foco para atualizar status imediatamente
      if (activeTab === 'contacts' || activeTab === 'conversations') {
        loadContacts();
      }
    };

    const handleVisibilityChange = () => {
      // Recarregar contatos quando a aba fica visível novamente
      if (!document.hidden && (activeTab === 'contacts' || activeTab === 'conversations')) {
        loadContacts();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTab, loadContacts]);

  // Carregar participantes da sala quando uma sala é selecionada
  const loadSalaParticipants = useCallback(async (salaId) => {
    if (!salaId) return;
    try {
      // Buscar dados da sala atual
      const sala = conversations.find(c => (c.conversationId === salaId || c.Id === salaId) && c.type === 'sala');
      if (sala && sala.participantes) {
        // Mapear participantes para dados de contatos
        const participantsData = sala.participantes.map(participantEmail => {
          const contact = contacts.find(c => c.userEmail === participantEmail);
          return contact || { userEmail: participantEmail, userName: participantEmail };
        });
        setSalaParticipants(participantsData);
      } else {
        setSalaParticipants([]);
      }
    } catch (error) {
      console.error('Erro ao carregar participantes da sala:', error);
      setSalaParticipants([]);
    }
  }, [conversations, contacts]);

  // Entrar/sair da conversa quando selecionada
  useEffect(() => {
    if (selectedConversation && isConnected) {
      const conversationId = selectedConversation.conversationId || selectedConversation.Id;
      if (conversationId) {
        joinConversation(conversationId);
        loadMessages(conversationId);
        
        // Se for sala, carregar participantes
        if (selectedConversation.type === 'sala') {
          loadSalaParticipants(conversationId);
        } else {
          setSalaParticipants([]);
        }
      }
      
      return () => {
        const conversationId = selectedConversation.conversationId || selectedConversation.Id;
        if (conversationId) {
          leaveConversation(conversationId);
        }
        setSalaParticipants([]);
      };
    }
  }, [selectedConversation, isConnected, loadSalaParticipants]);

  // Scroll automático para última mensagem - apenas quando necessário
  // Usa scrollTop do container ao invés de scrollIntoView para evitar scroll na página inteira
  const scrollToBottom = (force = false) => {
    if (!messagesEndRef.current) return;
    
    // Encontrar o container de mensagens (div com overflow-y-auto)
    const messagesContainer = messagesEndRef.current.closest('.overflow-y-auto, .overflow-auto');
    
    if (!messagesContainer) {
      console.warn('⚠️ [scrollToBottom] Container de mensagens não encontrado');
      return;
    }
    
    // Se não for forçado, verificar se o usuário está próximo do final antes de fazer scroll
    if (!force) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      // Só fazer scroll se estiver a menos de 200px do final (usuário estava vendo mensagens recentes)
      if (distanceFromBottom > 200) {
        return; // Usuário está visualizando mensagens antigas, não fazer scroll
      }
    }
    
    // Fazer scroll apenas dentro do container, não na página inteira
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Scroll automático apenas quando uma conversa é selecionada pela primeira vez
  const previousConversationIdRef = useRef(null);
  useEffect(() => {
    const currentConversationId = selectedConversation?.conversationId || selectedConversation?.Id;
    
    // Só fazer scroll se mudou de conversa (não quando messages.length muda)
    if (currentConversationId && 
        currentConversationId !== previousConversationIdRef.current) {
      previousConversationIdRef.current = currentConversationId;
      // Scroll será feito quando mensagens forem carregadas (em loadMessages)
    }
  }, [selectedConversation?.conversationId || selectedConversation?.Id]);


  /**
   * Carregar mensagens de uma conversa
   * Detecta automaticamente se é P2P ou Sala
   */
  const loadMessages = async (conversationId) => {
    try {
      setLoading(true);
      const data = await velochatApi.getMessages(conversationId);
      
      // Converter mensagens do novo formato para formato esperado pelo componente
      const formattedMessages = (data.messages || []).map((msg, index) => {
        // Validar e processar mediaUrl se presente
        let mediaUrl = msg.mediaUrl || null;
        let mediaType = msg.mediaType || null;
        
        // Validar URL se presente
        if (mediaUrl) {
          try {
            new URL(mediaUrl); // Validar formato de URL
            // URLs públicas do GCS agora funcionam diretamente (sem signed URL)
          } catch (urlError) {
            console.warn('⚠️ [loadMessages] URL inválida encontrada:', mediaUrl);
            mediaUrl = null; // Invalidar URL inválida
            mediaType = null;
          }
        }
        
        // Extrair nome do arquivo da URL se não estiver disponível
        let fileName = msg.name || null;
        if (!fileName && mediaUrl) {
          try {
            const urlParts = mediaUrl.split('/');
            fileName = urlParts[urlParts.length - 1].split('?')[0];
          } catch {
            fileName = 'Anexo';
          }
        }
        
        // Verificar se é mensagem especial de chamada de atenção
        const isCallerSign = msg.mensagem === '[att-caller-sign]';
        
        return {
          _id: msg._id || `msg-${index}`,
          messageId: msg._id || `msg-${index}`,
          userName: msg.userName,
          senderName: msg.userName,
          mensagem: isCallerSign ? 'Chamando sua atenção!' : msg.mensagem, // Substituir texto especial
          content: isCallerSign ? 'Chamando sua atenção!' : msg.mensagem,
          originalContent: isCallerSign ? '[att-caller-sign]' : msg.mensagem, // Manter original para referência
          timestamp: msg.timestamp,
          createdAt: msg.timestamp,
          mediaUrl: mediaUrl,                          // URL validada da mídia (ou será atualizada com signed URL)
          mediaType: mediaType,                        // Tipo da mídia
          name: fileName,                              // Nome do arquivo extraído
          attachments: msg.attachments || [],          // Manter compatibilidade
          isCallerSign: isCallerSign                   // Flag para identificar mensagem especial
        };
      });
      
      // Ordenar mensagens por timestamp ascendente (mais antiga primeiro, mais recente abaixo)
      const sortedMessages = formattedMessages.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt || 0);
        const timeB = new Date(b.timestamp || b.createdAt || 0);
        return timeA - timeB; // Ascendente (mais antiga primeiro, mais recente abaixo)
      });
      
      setMessages(sortedMessages);
      
      // Scroll para o final apenas ao carregar mensagens pela primeira vez
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
      
      // Marcar conversa como visualizada ao carregar mensagens
      if (conversationId) {
        localStorage.setItem(`chat-viewed-${conversationId}`, new Date().toISOString());
        setUnreadCounts(prev => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Selecionar conversa
   */
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setView('conversation');
    setMessages([]);
    
    // Carregar mensagens da conversa selecionada
    const conversationId = conversation.conversationId || conversation.Id;
    if (conversationId) {
      loadMessages(conversationId);
    }
  };

  /**
   * Lidar com clique em contato - iniciar ou abrir conversa
   */
  const handleContactClick = async (contact) => {
    try {
      console.log('🖱️ Clique em contato:', contact);
      setLoading(true);
      setError(null);
      
      const currentUserEmail = getCurrentUserEmail();
      if (!currentUserEmail) {
        console.error('❌ Usuário não identificado');
        throw new Error('Usuário não identificado');
      }
      
      console.log('✅ Usuário identificado:', currentUserEmail);

      // Verificar se já existe conversa direta nas conversas carregadas
      // Conversas diretas são salas privadas com 2 membros
      const existingConversation = conversations.find(conv => {
        // Verificar se é sala privada com exatamente 2 membros
        if (conv.type !== 'privada' && conv.type !== 'direct') return false;
        const membersArray = Array.isArray(conv.members) ? conv.members : [];
        const membersEmails = membersArray.map(m => typeof m === 'string' ? m : m.userEmail);
        if (membersEmails.length !== 2) return false;
        // Verificar se o contato está nos membros
        return membersEmails.includes(contact.userEmail) && membersEmails.includes(currentUserEmail);
      });

      if (existingConversation) {
        // Conversa já existe, apenas selecionar
        console.log('✅ Conversa existente encontrada:', existingConversation);
        handleSelectConversation(existingConversation);
        return;
      }

      console.log('📝 Criando nova conversa P2P...');
      // Criar nova conversa P2P usando novo schema
      const currentUserName = getCurrentUserName();
      const contactName = contact.userName || contact.colaboradorNome;
      
      if (!currentUserName || !contactName) {
        throw new Error('Nomes dos usuários não encontrados');
      }
      
      // Criar conversa P2P usando a nova API
      const conversation = await velochatApi.createOrGetP2PConversation(contactName);

      console.log('📦 Resposta da criação de conversa P2P:', conversation);

      if (conversation) {
        // Adicionar à lista de conversas e selecionar
        console.log('✅ Conversa P2P criada/obtida com sucesso:', conversation);
        const formattedConversation = {
          conversationId: conversation.Id,
          Id: conversation.Id,
          type: 'p2p',
          p2p: conversation.p2p,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        };
        setConversations(prev => [formattedConversation, ...prev]);
        handleSelectConversation(formattedConversation);
      } else {
        console.error('❌ Resposta inválida ao criar conversa P2P:', conversation);
        throw new Error('Erro ao criar conversa P2P');
      }
    } catch (err) {
      console.error('❌ Erro ao iniciar conversa:', err);
      setError(err.message || 'Erro ao iniciar conversa');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler para botão de chamada de atenção
   */
  const handleCallAttention = () => {
    if (!selectedConversation) return;
    
    const conversationId = selectedConversation.conversationId || selectedConversation.Id;
    if (!conversationId) return;
    
    // Enviar mensagem especial
    wsSendMessage(conversationId, '[att-caller-sign]', [], null, null);
  };

  /**
   * Voltar para lista de contatos
   */
  const handleBackToContacts = () => {
    setView('contacts');
    setSelectedConversation(null);
    setMessages([]);
  };

  /**
   * Gerar preview de arquivo (thumbnail)
   */
  const generateFilePreview = async (file, mediaType) => {
    return new Promise((resolve) => {
      if (mediaType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      } else if (mediaType === 'video') {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          canvas.width = 150;
          canvas.height = (150 / video.videoWidth) * video.videoHeight;
          video.currentTime = 1; // Pegar frame em 1 segundo
        };
        
        video.onseeked = () => {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } catch {
            resolve(null);
          }
        };
        
        video.onerror = () => resolve(null);
        video.src = URL.createObjectURL(file);
      } else {
        // Para arquivos, não gerar preview visual
        resolve(null);
      }
    });
  };

  /**
   * Upload de arquivo para GCS usando signed URL
   */
  const uploadFileToGCS = async (file, mediaType) => {
    try {
      console.log('📤 [uploadFileToGCS] Iniciando processo de upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        mediaType
      });

      // Validar mediaType
      if (!mediaType || !['image', 'video', 'file'].includes(mediaType)) {
        // Tentar inferir do tipo de arquivo
        if (file.type.startsWith('image/')) {
          mediaType = 'image';
        } else if (file.type.startsWith('video/')) {
          mediaType = 'video';
        } else {
          mediaType = 'file';
        }
        console.log('📤 [uploadFileToGCS] mediaType inferido:', mediaType);
      }

      // 1. Solicitar signed URL
      console.log('📤 [uploadFileToGCS] Solicitando signed URL...');
      const urlData = await velochatApi.getAttachmentUploadUrl(
        file.name,
        file.type,
        mediaType
      );
      
      if (!urlData.success) {
        throw new Error(urlData.error || 'Erro ao obter URL de upload');
      }

      const { signedUrl, publicUrl, filePath } = urlData;
      console.log('📤 [uploadFileToGCS] Signed URL obtida:', {
        filePath,
        publicUrl,
        signedUrlLength: signedUrl?.length
      });
      
      // 2. Upload para GCS
      console.log('📤 [uploadFileToGCS] Fazendo upload para GCS...');
      await velochatApi.uploadAttachmentToGCS(file, signedUrl, file.type);
      
      // 3. Confirmar upload e tornar arquivo público
      console.log('📤 [uploadFileToGCS] Confirmando upload e tornando arquivo público...');
      let finalPublicUrl = publicUrl;
      try {
        const confirmResult = await velochatApi.confirmAttachmentUpload(filePath);
        finalPublicUrl = confirmResult.publicUrl; // URL pública permanente
        console.log('✅ [uploadFileToGCS] Arquivo tornado público. URL permanente:', finalPublicUrl);
      } catch (confirmError) {
        console.warn('⚠️ [uploadFileToGCS] Erro ao tornar arquivo público (usando URL pública):', confirmError.message);
        // Continuar com URL pública mesmo se falhar (pode já ser público)
      }
      
      console.log('✅ [uploadFileToGCS] Upload concluído. URL final:', finalPublicUrl);
      
      // 4. Retornar URL pública permanente
      return finalPublicUrl;
    } catch (error) {
      console.error('❌ [uploadFileToGCS] Erro ao fazer upload do arquivo:', error);
      
      // Verificar se é erro de CORS
      if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
        const corsError = new Error('Erro de CORS: O bucket GCS precisa ter CORS configurado. Execute: gsutil cors set gcs-cors-config-velochat.json gs://velochat_anexos');
        corsError.isCorsError = true;
        throw corsError;
      }
      
      throw error;
    }
  };

  /**
   * Enviar mensagem
   * Detecta automaticamente se é P2P ou Sala e usa WebSocket apropriado
   */
  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConversation) return;

    try {
      const conversationId = selectedConversation.conversationId || selectedConversation.Id;
      const currentUserName = getCurrentUserName();
      const messageToSend = messageInput.trim();
      
      // Upload de arquivo para GCS se houver anexo
      let mediaUrl = null;
      if (selectedFile && selectedFile.file) {
        try {
          setUploadingFile(true);
          mediaUrl = await uploadFileToGCS(selectedFile.file, selectedMediaType);
        } catch (uploadError) {
          console.error('Erro ao fazer upload:', uploadError);
          setError(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
          setUploadingFile(false);
          return; // Não enviar mensagem se upload falhar
        } finally {
          setUploadingFile(false);
        }
      }
      
      // Criar mensagem temporária para optimistic update
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempMessage = {
        _id: tempId,
        messageId: tempId,
        userName: currentUserName,
        senderName: currentUserName,
        mensagem: messageToSend,
        content: messageToSend,
        timestamp: Date.now(),
        createdAt: Date.now(),
        attachments: mediaUrl ? [{
          url: mediaUrl,
          name: selectedFile.name,
          type: selectedFile.type
        }] : [],
        mediaUrl: mediaUrl,
        mediaType: selectedMediaType || null,
        name: selectedFile?.name || null,  // Preservar nome do arquivo
        isTemporary: true // Flag para identificar mensagem temporária
      };
      
      // Adicionar imediatamente ao estado (optimistic update) e ordenar por timestamp ascendente
      setMessages(prev => {
        const updated = [...prev, tempMessage];
        return updated.sort((a, b) => {
          const timeA = new Date(a.timestamp || a.createdAt || 0);
          const timeB = new Date(b.timestamp || b.createdAt || 0);
          return timeA - timeB; // Ascendente (mais antiga primeiro, mais recente abaixo)
        });
      });
      scrollToBottom(true); // Forçar scroll quando usuário envia mensagem
      
      // Limpar input e arquivo
      setMessageInput('');
      setSelectedFile(null);
      setSelectedMediaType(null);
      setFilePreview(null);
      setShowAttachmentMenu(false);
      
      // Enviar via WebSocket (mensagem será salva no backend)
      // O servidor detecta automaticamente se é P2P ou Sala baseado no ID
      // Garantir que sempre enviamos uma string (mesmo que vazia) para content
      const contentToSend = messageToSend || '';
      console.log('📤 [handleSendMessage] Enviando via WebSocket:', {
        conversationId,
        content: contentToSend,
        hasMediaUrl: !!mediaUrl,
        mediaUrl,
        mediaType: selectedMediaType
      });
      
      wsSendMessage(
        conversationId,
        contentToSend,
        mediaUrl ? [{
          url: mediaUrl,
          name: selectedFile.name,
          type: selectedFile.type
        }] : [],
        mediaUrl,
        selectedMediaType
      );
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err.message);
      setUploadingFile(false);
    }
  };

  /**
   * Handle typing indicator
   */
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (selectedConversation && isConnected) {
      const conversationId = selectedConversation.conversationId || selectedConversation.Id;
      if (conversationId) {
        sendTyping(conversationId, true);
      }
      
      // Parar de digitar após 1 segundo sem digitação
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        const conversationId = selectedConversation.conversationId || selectedConversation.Id;
        if (conversationId) {
          sendTyping(conversationId, false);
        }
      }, 1000);
    }
  };

  /**
   * Renderizar tela de conversas
   */
  const renderConversationsView = () => {
    if (loading && conversations.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Carregando conversas...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={loadConversations}
            className="px-4 py-2 bg-blue-medium text-white rounded hover:bg-blue-dark"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    // Filtrar conversas P2P e Salas onde usuário é participante
    // Aba "Conversas" mostra: P2P + Salas onde usuário está em participantes
    const currentUserName = getCurrentUserName();
    const normalizedCurrentName = normalizeName(currentUserName);
    
    // Debug temporário para diagnóstico
    if (conversations.length > 0) {
      console.log('🔍 DEBUG - Nome do usuário atual:', currentUserName);
      console.log('🔍 DEBUG - Nome normalizado:', normalizedCurrentName);
      console.log('🔍 DEBUG - Total de conversas recebidas:', conversations.length);
    }
    
    const filteredConversations = conversations.filter(conv => {
      if (conv.type === 'p2p') {
        // Verificar se usuário está na conversa P2P (comparação normalizada)
        if (conv.p2p) {
          const match1 = normalizeName(conv.p2p.colaboradorNome1) === normalizedCurrentName;
          const match2 = normalizeName(conv.p2p.colaboradorNome2) === normalizedCurrentName;
          
          // Debug temporário
          if (conversations.length > 0) {
            console.log('🔍 DEBUG P2P:', {
              conversationId: conv.conversationId || conv.Id,
              nome1: conv.p2p.colaboradorNome1,
              nome2: conv.p2p.colaboradorNome2,
              current: currentUserName,
              normalized1: normalizeName(conv.p2p.colaboradorNome1),
              normalized2: normalizeName(conv.p2p.colaboradorNome2),
              match1,
              match2,
              result: match1 || match2
            });
          }
          
          return match1 || match2;
        }
        return false;
      } else if (conv.type === 'sala') {
        // Verificar se usuário está em participantes (comparação normalizada)
        if (conv.participantes && Array.isArray(conv.participantes)) {
          return conv.participantes.some(p => normalizeName(p) === normalizedCurrentName);
        }
        return false;
      }
      // Manter compatibilidade com schema antigo temporariamente
      return conv.type === 'privada' || conv.type === 'direct';
    });

    // Ordenar por última mensagem (mais recente primeiro)
    const sortedConversations = [...filteredConversations].sort((a, b) => {
      // Se tem lastMessage, ordenar por timestamp
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
      }
      // Se só um tem lastMessage, ele vem primeiro
      if (a.lastMessage && !b.lastMessage) return -1;
      if (!a.lastMessage && b.lastMessage) return 1;
      // Se nenhum tem lastMessage, ordenar por createdAt
      const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return bCreated - aCreated;
    });

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          {sortedConversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedConversations.map((conv) => {
                const currentUserName = getCurrentUserName();
                let otherMember = null;
                let memberStatus = 'offline';
                let contactData = null;
                let conversationName = 'Conversa';
                
                // Processar conversa P2P
                if (conv.type === 'p2p' && conv.p2p) {
                  // Encontrar o outro participante (usando comparação normalizada)
                  const normalizedCurrent = normalizeName(currentUserName);
                  const otherName = normalizeName(conv.p2p.colaboradorNome1) === normalizedCurrent
                    ? conv.p2p.colaboradorNome2
                    : conv.p2p.colaboradorNome1;
                  
                  conversationName = otherName || 'Conversa P2P';
                  
                  // Buscar dados do contato pelo nome
                  contactData = contacts.find(c => 
                    (c.userName === otherName || c.colaboradorNome === otherName)
                  );
                  
                  if (contactData) {
                    memberStatus = contactData.status || 'offline';
                    otherMember = {
                      userEmail: contactData.userEmail,
                      userName: contactData.userName || contactData.colaboradorNome
                    };
                  } else {
                    otherMember = {
                      userName: otherName
                    };
                  }
                } 
                // Processar conversa Sala
                else if (conv.type === 'sala') {
                  conversationName = conv.salaNome || conv.name || 'Sala';
                  // Para salas, não há status individual, então usar padrão
                  memberStatus = 'offline';
                }
                // Compatibilidade com schema antigo
                else {
                  const currentUserEmail = getCurrentUserEmail();
                  const isDirect = conv.type === 'privada' || conv.type === 'direct';
                  if (isDirect) {
                    const membersArray = Array.isArray(conv.members) ? conv.members : [];
                    const membersEmails = membersArray.map(m => typeof m === 'string' ? m : m.userEmail);
                    const otherEmail = membersEmails.find(email => email !== currentUserEmail);
                    if (otherEmail) {
                      otherMember = { userEmail: otherEmail };
                      contactData = getContactData(otherEmail);
                      memberStatus = contactData?.status || 'offline';
                      if (contactData) {
                        otherMember.userName = contactData.userName;
                      }
                    }
                  }
                }

                const statusColors = {
                  online: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
                  ausente: { border: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
                  offline: { border: '#6b7280', bg: 'rgba(107, 114, 128, 0.5)' }
                };
                const statusLabels = {
                  online: 'Online',
                  ausente: 'Ausente',
                  offline: 'Offline'
                };
                const colors = statusColors[memberStatus] || statusColors.offline;
                const isOffline = memberStatus === 'offline';
                const fotoPerfil = contactData?.profile_pic || contactData?.fotoPerfil || otherMember?.profile_pic || otherMember?.fotoPerfil || '/mascote avatar.png';

                const conversationId = conv.conversationId || conv.Id;
                const isP2P = conv.type === 'p2p' || conv.type === 'direct' || conv.type === 'privada';
                const unreadCount = calculateUnread(conv);
                
                // Determinar background para salas com mensagens não visualizadas
                const salaBackground = !isP2P && conv.type === 'sala' && unreadCount > 0
                  ? 'rgba(0, 106, 185, 0.4)' // azul opaco com 40% de opacidade
                  : isP2P ? colors.bg : 'transparent';

                return (
                  <div
                    key={conversationId}
                    onClick={() => handleSelectConversation(conv)}
                    className="p-3 rounded-lg mb-2 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity relative"
                    style={{
                      border: `1px solid ${colors.border}`,
                      backgroundColor: salaBackground,
                      borderRadius: '8px',
                      opacity: isP2P && isOffline ? 0.6 : 1
                    }}
                  >
                    {isP2P && otherMember && (
                      <img
                        src={fotoPerfil}
                        alt={otherMember.userName || 'Contato'}
                        className="w-10 h-10 rounded-full object-cover"
                        style={{ opacity: isOffline ? 0.6 : 1 }}
                        onError={(e) => {
                          e.target.src = '/mascote avatar.png';
                        }}
                      />
                    )}
                    <div style={{ flex: 1, opacity: isP2P && isOffline ? 0.6 : 1 }}>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold" style={{ color: 'var(--blue-dark)' }}>
                          {isP2P
                            ? (otherMember?.userName || conversationName || 'Conversa P2P')
                            : (conversationName || conv.salaNome || conv.name || 'Sala')}
                        </div>
                        {!isP2P && conv.type === 'sala' && (
                          <div className="flex items-center ml-auto" style={{ marginLeft: 'auto' }}>
                            {conv.salaProfilePic ? (
                              <img
                                src={conv.salaProfilePic}
                                alt={conversationName}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.src = '/mascote avatar.png';
                                }}
                              />
                            ) : (
                              // Cascata horizontal de avatares
                              <div className="flex items-center" style={{ marginLeft: '-6px' }}>
                                {(() => {
                                  // Obter participantes da sala
                                  const salaParticipantes = conv.participantes || [];
                                  // Limitar a 6 avatares
                                  const participantesToShow = salaParticipantes.slice(0, 6);
                                  
                                  return participantesToShow.map((participantName, idx) => {
                                    // Buscar dados do contato pelo nome
                                    const participantContact = contacts.find(c => 
                                      c.userName === participantName || c.colaboradorNome === participantName
                                    );
                                    const participantPic = participantContact?.profile_pic || 
                                                          participantContact?.fotoPerfil || 
                                                          '/mascote avatar.png';
                                    
                                    return (
                                      <div
                                        key={idx}
                                        className="relative"
                                        style={{
                                          marginLeft: idx > 0 ? '-6px' : '0',
                                          zIndex: 6 - idx
                                        }}
                                      >
                                        <img
                                          src={participantPic}
                                          alt={participantName}
                                          className="w-8 h-8 rounded-full object-cover border-2"
                                          style={{
                                            borderColor: 'white',
                                            borderWidth: '2px'
                                          }}
                                          onError={(e) => {
                                            e.target.src = '/mascote avatar.png';
                                          }}
                                        />
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {isP2P && (
                          <>
                            <div className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>
                              {statusLabels[memberStatus] || 'Offline'}
                            </div>
                            {(conv.lastMessage?.timestamp || conv.lastMessageAt) && (
                              <>
                                <span className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>•</span>
                                <div className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>
                                  {new Date(conv.lastMessage?.timestamp || conv.lastMessageAt).toLocaleDateString()}
                                </div>
                              </>
                            )}
                          </>
                        )}
                        {!isP2P && conv.type === 'sala' && (
                          <>
                            {conv.participantes && conv.participantes.length > 0 && (
                              <>
                                <div className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>
                                  {conv.participantes.length} participante{conv.participantes.length !== 1 ? 's' : ''}
                                </div>
                                {conv.lastMessage && <span className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>•</span>}
                              </>
                            )}
                            {conv.lastMessage && (
                              <div className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>
                                {conv.lastMessage.mensagem?.substring(0, 50) || conv.lastMessage.content?.substring(0, 50) || 'Sem mensagens'}
                                {(conv.lastMessage.mensagem || conv.lastMessage.content) && (conv.lastMessage.mensagem || conv.lastMessage.content).length > 50 ? '...' : ''}
                              </div>
                            )}
                            {(conv.lastMessage?.timestamp || conv.lastMessageAt) && (
                              <>
                                <span className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>•</span>
                                <div className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>
                                  {new Date(conv.lastMessage?.timestamp || conv.lastMessageAt).toLocaleDateString()}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {/* Bubble vermelho de notificação de mensagens não lidas */}
                    {unreadCount > 0 && (
                      <div 
                        className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"
                        style={{ zIndex: 10 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Renderizar tela de contatos
   */
  const renderContactsView = () => {
    if (loadingContacts && contacts.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Carregando contatos...</p>
        </div>
      );
    }

    if (error && contacts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={loadContacts}
            className="px-4 py-2 bg-blue-medium text-white rounded hover:bg-blue-dark"
            style={{ borderRadius: '8px' }}
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    // Filtrar contatos baseado na busca
    const filteredContacts = searchQuery.trim() === '' 
      ? contacts 
      : contacts.filter(contact => {
          const query = searchQuery.toLowerCase();
          const userName = (contact.userName || '').toLowerCase();
          const userEmail = (contact.userEmail || '').toLowerCase();
          return userName.includes(query) || userEmail.includes(query);
        });

    // Ordenar contatos por status (online > ausente > offline)
    const statusOrder = { online: 0, ausente: 1, offline: 2 };
    const sortedContacts = filteredContacts.sort((a, b) => {
      const statusA = statusOrder[a.status] ?? 2;
      const statusB = statusOrder[b.status] ?? 2;
      return statusA - statusB;
    });

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          {sortedContacts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">
                {searchQuery.trim() === '' ? 'Nenhum contato encontrado' : 'Nenhum contato encontrado para a busca'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedContacts.map((contact) => {
                const statusColors = {
                  online: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
                  ausente: { border: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
                  offline: { border: '#6b7280', bg: 'rgba(107, 114, 128, 0.5)' }
                };
                const statusLabels = {
                  online: 'Online',
                  ausente: 'Ausente',
                  offline: 'Offline'
                };
                const colors = statusColors[contact.status] || statusColors.offline;
                const isOffline = contact.status === 'offline';

                return (
                  <div
                    key={contact.userEmail}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleContactClick(contact);
                    }}
                    className="p-3 rounded-lg mb-2 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.bg,
                      borderRadius: '8px',
                      opacity: isOffline ? 0.6 : 1
                    }}
                  >
                    <img
                      src={contact.profile_pic || contact.fotoPerfil || '/mascote avatar.png'}
                      alt={contact.userName}
                      className="w-10 h-10 rounded-full object-cover"
                      style={{ opacity: isOffline ? 0.6 : 1 }}
                      onError={(e) => {
                        e.target.src = '/mascote avatar.png';
                      }}
                    />
                    <div style={{ opacity: isOffline ? 0.6 : 1, flex: 1 }}>
                      <div className="font-semibold" style={{ color: 'var(--blue-dark)' }}>
                        {contact.userName}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>
                        {statusLabels[contact.status] || 'Offline'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Renderizar tela de salas
   */
  const renderSalasView = () => {
    // Filtrar apenas salas (type === 'sala')
    const salas = conversations.filter(conv => conv.type === 'sala');

    // Ordenar por última mensagem (mais recente primeiro)
    const sortedSalas = [...salas].sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
      }
      if (a.lastMessage && !b.lastMessage) return -1;
      if (!a.lastMessage && b.lastMessage) return 1;
      const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return bCreated - aCreated;
    });

    return (
      <div className="flex flex-col h-full">
        {/* Botão Criar Nova Sala */}
        <div className="px-3 py-2 border-b flex items-center" style={{ borderColor: 'var(--blue-opaque)' }}>
          <button
            onClick={() => setShowCreateRoomModal(true)}
            className="rounded-lg hover:opacity-90 transition-colors"
            style={{ 
              background: 'transparent',
              border: '1.5px solid var(--blue-dark)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'var(--blue-dark)',
              width: 'auto',
              fontSize: '14px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: '500',
              height: 'auto',
              lineHeight: '1.2'
            }}
          >
            Nova Sala
          </button>
        </div>

        {/* Lista de Salas */}
        <div className="flex-1 overflow-y-auto">
          {sortedSalas.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Nenhuma sala encontrada</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {sortedSalas.map((sala) => {
                const salaId = sala.conversationId || sala.Id;
                const salaNome = sala.salaNome || sala.name || 'Sala';
                const participantesCount = sala.participantes?.length || 0;
                const unreadCount = calculateUnread(sala);
                
                // Background azul opaco com 40% de opacidade se houver mensagens não visualizadas
                const salaBackground = unreadCount > 0
                  ? 'rgba(0, 106, 185, 0.4)' // azul opaco com 40% de opacidade
                  : 'transparent';

                return (
                  <div
                    key={salaId}
                    onClick={() => handleSelectConversation(sala)}
                    className="p-3 rounded-lg mb-2 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity relative"
                    style={{
                      border: '1px solid var(--blue-opaque)',
                      backgroundColor: salaBackground,
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold" style={{ color: 'var(--blue-dark)' }}>
                          {salaNome}
                        </div>
                        <div className="flex items-center ml-auto" style={{ marginLeft: 'auto' }}>
                          {sala.salaProfilePic ? (
                            <img
                              src={sala.salaProfilePic}
                              alt={salaNome}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src = '/mascote avatar.png';
                              }}
                            />
                          ) : (
                            // Cascata horizontal de avatares
                            <div className="flex items-center" style={{ marginLeft: '-6px' }}>
                              {(() => {
                                // Obter participantes da sala
                                const salaParticipantes = sala.participantes || [];
                                // Limitar a 6 avatares
                                const participantesToShow = salaParticipantes.slice(0, 6);
                                
                                return participantesToShow.map((participantName, idx) => {
                                  // Buscar dados do contato pelo nome
                                  const participantContact = contacts.find(c => 
                                    c.userName === participantName || c.colaboradorNome === participantName
                                  );
                                  const participantPic = participantContact?.profile_pic || 
                                                        participantContact?.fotoPerfil || 
                                                        '/mascote avatar.png';
                                  
                                  return (
                                    <div
                                      key={idx}
                                      className="relative"
                                      style={{
                                        marginLeft: idx > 0 ? '-6px' : '0',
                                        zIndex: 6 - idx
                                      }}
                                    >
                                      <img
                                        src={participantPic}
                                        alt={participantName}
                                        className="w-8 h-8 rounded-full object-cover border-2"
                                        style={{
                                          borderColor: 'white',
                                          borderWidth: '2px'
                                        }}
                                        onError={(e) => {
                                          e.target.src = '/mascote avatar.png';
                                        }}
                                      />
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {participantesCount > 0 && (
                          <>
                            <div className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>
                              {participantesCount} participante{participantesCount !== 1 ? 's' : ''}
                            </div>
                            {sala.lastMessage && <span className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>•</span>}
                          </>
                        )}
                        {sala.lastMessage && (
                          <div className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>
                            {sala.lastMessage.mensagem?.substring(0, 50) || sala.lastMessage.content?.substring(0, 50) || 'Sem mensagens'}
                            {(sala.lastMessage.mensagem || sala.lastMessage.content) && (sala.lastMessage.mensagem || sala.lastMessage.content).length > 50 ? '...' : ''}
                          </div>
                        )}
                        {(sala.lastMessage?.timestamp || sala.lastMessageAt) && (
                          <>
                            <span className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>•</span>
                            <div className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>
                              {new Date(sala.lastMessage?.timestamp || sala.lastMessageAt).toLocaleDateString()}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Bubble vermelho de notificação de mensagens não lidas */}
                    {unreadCount > 0 && (
                      <div 
                        className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"
                        style={{ zIndex: 10 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de Criação de Sala */}
        {showCreateRoomModal && renderCreateRoomModal()}
        
      </div>
    );
  };

  /**
   * Renderizar modal de criação de sala
   */
  const renderCreateRoomModal = () => {
    const handleToggleContact = (contactEmail) => {
      setSelectedContacts(prev => {
        if (prev.includes(contactEmail)) {
          return prev.filter(email => email !== contactEmail);
        } else {
          return [...prev, contactEmail];
        }
      });
    };

    const handleCreateRoom = async () => {
      if (!roomName.trim()) {
        setError('Nome da sala é obrigatório');
        return;
      }

      if (selectedContacts.length === 0) {
        setError('Selecione pelo menos um participante');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const currentUserName = getCurrentUserName();
        if (!currentUserName) {
          throw new Error('Nome do usuário não encontrado');
        }

        // Criar sala com participantes usando novo schema
        // Participantes são colaboradorNome (não emails)
        const participantes = [
          currentUserName,
          ...selectedContacts.map(email => {
            const contact = contacts.find(c => c.userEmail === email);
            return contact?.userName || contact?.colaboradorNome || email;
          }).filter(Boolean)
        ];

        const sala = await velochatApi.createSala(roomName.trim(), participantes, bloqueioAdm);

        if (sala) {
          // Adicionar à lista de conversas e recarregar
          await loadConversations();
          setShowCreateRoomModal(false);
          setRoomName('');
          setSelectedContacts([]);
          setRoomSearchQuery('');
          setBloqueioAdm(false);
          
          // Formatar sala para formato esperado pelo componente
          const formattedSala = {
            conversationId: sala.Id,
            Id: sala.Id,
            type: 'sala',
            salaNome: sala.salaNome,
            name: sala.salaNome,
            participantes: sala.participantes,
            bloqueioAdm: sala.bloqueioAdm || false,
            criadoPor: sala.criadoPor || currentUserName,
            createdAt: sala.createdAt,
            updatedAt: sala.updatedAt
          };
          
          // Opcionalmente, abrir a sala criada
          handleSelectConversation(formattedSala);
        } else {
          throw new Error('Erro ao criar sala');
        }
      } catch (err) {
        console.error('Erro ao criar sala:', err);
        setError(err.message || 'Erro ao criar sala');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Criar Nova Sala
            </h2>
            <button
              onClick={() => {
                setShowCreateRoomModal(false);
                setRoomName('');
                setSelectedContacts([]);
                setRoomSearchQuery('');
                setBloqueioAdm(false);
                setError(null);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Campo Nome da Sala */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--blue-dark)' }}>
                Nome da Sala
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Digite o nome da sala..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-medium"
                style={{
                  borderColor: 'var(--blue-opaque)',
                  borderRadius: '8px'
                }}
              />
            </div>

            {/* Checkbox bloqueioAdm */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bloqueioAdm}
                  onChange={(e) => setBloqueioAdm(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--blue-dark)' }}
                />
                <span className="text-sm font-medium" style={{ color: 'var(--blue-dark)' }}>
                  Impedir gerenciamento da sala
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Quando marcado, apenas o criador da sala poderá editar nome e participantes
              </p>
            </div>

            {/* Lista de Contatos */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--blue-dark)' }}>
                Participantes ({selectedContacts.length} selecionado{selectedContacts.length !== 1 ? 's' : ''})
              </label>
              
              {/* Barra de Busca */}
              <div className="mb-3">
                <input
                  type="text"
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  placeholder="Buscar usuários por nome ou email..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-medium"
                  style={{
                    borderColor: 'var(--blue-opaque)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div className="border rounded-lg max-h-64 overflow-y-auto" style={{ borderColor: 'var(--blue-opaque)' }}>
                {(() => {
                  // Filtrar contatos baseado na busca
                  const filteredContacts = contacts.filter(contact => {
                    if (!roomSearchQuery.trim()) return true;
                    const searchLower = roomSearchQuery.toLowerCase();
                    const userName = (contact.userName || '').toLowerCase();
                    const userEmail = (contact.userEmail || '').toLowerCase();
                    const colaboradorNome = (contact.colaboradorNome || '').toLowerCase();
                    return userName.includes(searchLower) || 
                           userEmail.includes(searchLower) || 
                           colaboradorNome.includes(searchLower);
                  });

                  if (filteredContacts.length === 0) {
                    return (
                      <div className="p-4 text-center text-gray-500">
                        {contacts.length === 0 
                          ? 'Nenhum contato disponível' 
                          : 'Nenhum contato encontrado'}
                      </div>
                    );
                  }

                  return (
                    <div className="p-2 space-y-1">
                      {filteredContacts.map((contact) => {
                      const isSelected = selectedContacts.includes(contact.userEmail);
                      return (
                        <div
                          key={contact.userEmail}
                          onClick={() => handleToggleContact(contact.userEmail)}
                          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleContact(contact.userEmail)}
                            className="w-4 h-4"
                          />
                          <img
                            src={contact.profile_pic || contact.fotoPerfil || '/mascote avatar.png'}
                            alt={contact.userName}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = '/mascote avatar.png';
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium" style={{ color: 'var(--blue-dark)' }}>
                              {contact.userName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {contact.userEmail}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  );
                })()}
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t dark:border-gray-700">
            <button
              onClick={() => {
                setShowCreateRoomModal(false);
                setRoomName('');
                setSelectedContacts([]);
                setRoomSearchQuery('');
                setBloqueioAdm(false);
                setError(null);
              }}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{
                borderColor: 'var(--blue-opaque)',
                borderRadius: '8px'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateRoom}
              disabled={!roomName.trim() || selectedContacts.length === 0 || loading}
              className="flex-1 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ 
                background: 'transparent',
                border: '1.5px solid var(--blue-dark)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: 'var(--blue-dark)',
                fontSize: '14px',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: '500',
                height: 'auto',
                lineHeight: '1.2'
              }}
            >
              {loading ? 'Criando...' : 'Criar Sala'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renderizar modal de gerenciamento de participantes
   */
  const renderSalaManagementModal = () => {
    if (!selectedConversation || selectedConversation.type !== 'sala') return null;
    
    const salaId = selectedConversation.conversationId || selectedConversation.Id;
    const currentUserName = getCurrentUserName();
    const isCreator = selectedConversation.criadoPor === currentUserName;
    const bloqueioAdm = selectedConversation.bloqueioAdm === true;
    
    // Verificar permissões de edição
    const canEdit = bloqueioAdm === false || (bloqueioAdm === true && isCreator);
    
    // Inicializar valores quando modal abrir
    const currentSalaNome = salaNomeEdit || selectedConversation.salaNome || selectedConversation.name || '';
    const currentSelectedParticipants = selectedParticipants.length > 0 
      ? selectedParticipants 
      : salaParticipants.map(p => p.userEmail || p.userName || p.colaboradorNome);
    
    const handleUpdateNome = async () => {
      if (!salaId || !salaNomeEdit.trim()) return;
      
      try {
        setManageLoading(true);
        setManageError(null);
        
        await velochatApi.updateSalaNome(salaId, salaNomeEdit.trim());
        
        // Recarregar conversas para atualizar nome
        await loadConversations();
        
        // Atualizar selectedConversation localmente
        setSelectedConversation(prev => ({
          ...prev,
          salaNome: salaNomeEdit.trim(),
          name: salaNomeEdit.trim()
        }));
      } catch (err) {
        console.error('Erro ao atualizar nome da sala:', err);
        setManageError(err.message || 'Erro ao atualizar nome da sala');
      } finally {
        setManageLoading(false);
      }
    };
    
    const handleToggleParticipant = async (participantEmail) => {
      if (!salaId || !canEdit) return;
      
      const isSelected = selectedParticipants.includes(participantEmail);
      
      try {
        setManageLoading(true);
        setManageError(null);
        
        const contact = contacts.find(c => c.userEmail === participantEmail);
        const colaboradorNome = contact?.userName || contact?.colaboradorNome || participantEmail;
        
        if (isSelected) {
          // Remover participante imediatamente ao desmarcar
          await velochatApi.removeParticipantFromSala(salaId, colaboradorNome);
          setSelectedParticipants(prev => prev.filter(email => email !== participantEmail));
        } else {
          // Adicionar participante
          await velochatApi.addParticipantToSala(salaId, colaboradorNome);
          setSelectedParticipants(prev => [...prev, participantEmail]);
        }
        
        // Recarregar participantes
        await loadSalaParticipants(salaId);
        await loadConversations();
      } catch (err) {
        console.error('Erro ao atualizar participante:', err);
        setManageError(err.message || 'Erro ao atualizar participante');
      } finally {
        setManageLoading(false);
      }
    };
    
    const handleLeaveSala = async () => {
      if (!salaId) return;
      
      try {
        setManageLoading(true);
        setManageError(null);
        
        await velochatApi.leaveSala(salaId);
        
        // Fechar modal e voltar para lista de conversas
        setShowManageParticipantsModal(false);
        setSelectedConversation(null);
        setView('contacts');
        
        // Recarregar conversas
        await loadConversations();
      } catch (err) {
        console.error('Erro ao sair da sala:', err);
        setManageError(err.message || 'Erro ao sair da sala');
      } finally {
        setManageLoading(false);
      }
    };
    
    const currentUserEmail = getCurrentUserEmail();
    const availableContacts = contacts.filter(c => 
      !salaParticipants.some(p => (p.userEmail || p.userName || p.colaboradorNome) === (c.userEmail || c.userName || c.colaboradorNome)) &&
      c.userEmail !== currentUserEmail &&
      (c.acessos?.Velotax !== false && c.acessos?.velotax !== false)
    );
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Gerenciar Sala
            </h2>
            <button
              onClick={() => {
                setShowManageParticipantsModal(false);
                setManageError(null);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Campo Nome da Sala */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--blue-dark)' }}>
                Nome da Sala
              </label>
              <input
                type="text"
                value={currentSalaNome}
                onChange={(e) => {
                  setSalaNomeEdit(e.target.value);
                }}
                disabled={!canEdit}
                onBlur={canEdit ? handleUpdateNome : undefined}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
                style={{
                  borderColor: 'var(--blue-opaque)',
                  borderRadius: '8px'
                }}
              />
              {!canEdit && (
                <p className="text-xs text-gray-500 mt-1">
                  Apenas o criador pode editar quando o bloqueio administrativo está ativo
                </p>
              )}
            </div>

            {/* Lista de participantes */}
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--blue-dark)' }}>
                Participantes ({salaParticipants.length})
              </h3>
              <div className="border rounded-lg max-h-64 overflow-y-auto" style={{ borderColor: 'var(--blue-opaque)' }}>
                <div className="p-2 space-y-1">
                  {salaParticipants.map((participant) => {
                    const participantEmail = participant.userEmail || participant.userName || participant.colaboradorNome;
                    const isCurrentUser = participantEmail === currentUserEmail || participant.userName === currentUserName || participant.colaboradorNome === currentUserName;
                    const isSelected = currentSelectedParticipants.includes(participantEmail);
                    
                    return (
                      <div
                        key={participantEmail}
                        className="flex items-center gap-3 p-2 rounded-lg"
                        style={{
                          backgroundColor: isCurrentUser ? 'rgba(22, 148, 255, 0.05)' : 'transparent'
                        }}
                      >
                        {canEdit && !isCurrentUser && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleParticipant(participantEmail)}
                            disabled={manageLoading}
                            className="w-4 h-4"
                            style={{ accentColor: 'var(--blue-dark)' }}
                          />
                        )}
                        <img
                          src={participant.profile_pic || participant.fotoPerfil || '/mascote avatar.png'}
                          alt={participant.userName || participantEmail}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = '/mascote avatar.png';
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: 'var(--blue-dark)' }}>
                            {participant.userName || participant.colaboradorNome || participantEmail}
                            {isCurrentUser && ' (Você)'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {participant.userEmail || participantEmail}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Adicionar participantes (apenas se pode editar) */}
            {canEdit && availableContacts.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--blue-dark)' }}>
                  Adicionar Participantes
                </h3>
                <div className="border rounded-lg max-h-48 overflow-y-auto" style={{ borderColor: 'var(--blue-opaque)' }}>
                  <div className="p-2 space-y-1">
                    {availableContacts.map((contact) => {
                      const contactEmail = contact.userEmail || contact.userName || contact.colaboradorNome;
                      const isSelected = currentSelectedParticipants.includes(contactEmail);
                      return (
                        <div
                          key={contactEmail}
                          onClick={() => handleToggleParticipant(contactEmail)}
                          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4"
                            style={{ accentColor: 'var(--blue-dark)' }}
                          />
                          <img
                            src={contact.profile_pic || contact.fotoPerfil || '/mascote avatar.png'}
                            alt={contact.userName}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = '/mascote avatar.png';
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium" style={{ color: 'var(--blue-dark)' }}>
                              {contact.userName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {contact.userEmail}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Mensagem de Erro */}
            {manageError && (
              <div className="p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
                {manageError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t dark:border-gray-700">
            <button
              onClick={() => {
                setShowManageParticipantsModal(false);
                setManageError(null);
              }}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{
                borderColor: 'var(--blue-opaque)',
                borderRadius: '8px'
              }}
            >
              Fechar
            </button>
            <button
              onClick={handleLeaveSala}
              disabled={manageLoading}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ borderRadius: '8px' }}
            >
              {manageLoading ? 'Saindo...' : bloqueioAdm && !isCreator ? 'Sair do Grupo' : 'Sair da Sala'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renderizar modal de visualização de anexo
   */
  const renderAttachmentModal = () => {
    if (!selectedAttachment) {
      return null;
    }

    const handleDownload = async () => {
      try {
        console.log('📥 [Download] Iniciando download:', selectedAttachment.url);
        
        // Para URLs do GCS, usar fetch para garantir CORS e download correto
        if (selectedAttachment.url.startsWith('http://') || selectedAttachment.url.startsWith('https://')) {
          const response = await fetch(selectedAttachment.url);
          if (!response.ok) {
            throw new Error(`Erro ao baixar arquivo: ${response.status}`);
          }
          
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = selectedAttachment.name || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Limpar blob URL após um tempo
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          
          console.log('✅ [Download] Download concluído');
        } else {
          // Para data URLs ou outros tipos
          const link = document.createElement('a');
          link.href = selectedAttachment.url;
          link.download = selectedAttachment.name || 'download';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (error) {
        console.error('❌ [Download] Erro ao fazer download:', error);
        setError(`Erro ao baixar arquivo: ${error.message}`);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
        onClick={() => {
          setShowAttachmentModal(false);
          setSelectedAttachment(null);
        }}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ borderRadius: '12px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {selectedAttachment.type === 'image' && (
                  <Image style={{ fontSize: '24px', color: 'var(--blue-dark)' }} />
                )}
                {selectedAttachment.type === 'video' && (
                  <Videocam style={{ fontSize: '24px', color: 'var(--blue-dark)' }} />
                )}
                {(selectedAttachment.type === 'file' || !selectedAttachment.type) && (
                  <InsertDriveFile style={{ fontSize: '24px', color: 'var(--blue-dark)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate" style={{ color: 'var(--blue-dark)' }}>
                  {selectedAttachment.name || 'Anexo'}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Download"
                style={{ color: 'var(--blue-dark)' }}
              >
                <Download style={{ fontSize: '20px' }} />
              </button>
              <button
                onClick={() => {
                  setShowAttachmentModal(false);
                  setSelectedAttachment(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Fechar"
              >
                <Close style={{ fontSize: '20px' }} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            {selectedAttachment.type === 'image' && (
              <div className="w-full flex items-center justify-center">
                <img
                  src={selectedAttachment.url}
                  alt={selectedAttachment.name || 'Imagem'}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  style={{ borderRadius: '8px' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (!parent.querySelector('.error-message')) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'error-message text-center p-8';
                      errorDiv.innerHTML = `
                        <div style="font-size: 64px; color: var(--blue-dark); margin-bottom: 16px;">📷</div>
                        <p style="color: var(--blue-dark); margin-bottom: 16px;">Erro ao carregar imagem</p>
                        <button 
                          onclick="window.location.reload()" 
                          style="padding: 8px 16px; background: var(--blue-opaque); color: white; border: none; border-radius: 4px; cursor: pointer;"
                        >
                          Tentar novamente
                        </button>
                      `;
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
              </div>
            )}
            {selectedAttachment.type === 'video' && (
              <div className="w-full flex items-center justify-center">
                <video
                  src={selectedAttachment.url}
                  controls
                  className="max-w-full max-h-[70vh] rounded-lg"
                  style={{ borderRadius: '8px' }}
                  onError={(e) => {
                    const video = e.target;
                    video.style.display = 'none';
                    const parent = video.parentElement;
                    if (!parent.querySelector('.error-message')) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'error-message text-center p-8';
                      errorDiv.innerHTML = `
                        <div style="font-size: 64px; color: var(--blue-dark); margin-bottom: 16px;">🎬</div>
                        <p style="color: var(--blue-dark); margin-bottom: 16px;">Erro ao carregar vídeo</p>
                        <p style="color: var(--blue-dark); font-size: 14px; margin-bottom: 16px;">O vídeo pode não estar disponível ou o formato não é suportado.</p>
                        <button 
                          onclick="window.location.reload()" 
                          style="padding: 8px 16px; background: var(--blue-opaque); color: white; border: none; border-radius: 4px; cursor: pointer;"
                        >
                          Tentar novamente
                        </button>
                      `;
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
              </div>
            )}
            {(selectedAttachment.type === 'file' || !selectedAttachment.type) && (
              <div className="w-full text-center p-8">
                <div className="mb-4">
                  {selectedAttachment.name?.toLowerCase().endsWith('.pdf') ? (
                    <PictureAsPdf style={{ fontSize: '64px', color: 'var(--blue-dark)' }} />
                  ) : (
                    <Description style={{ fontSize: '64px', color: 'var(--blue-dark)' }} />
                  )}
                </div>
                <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--blue-dark)' }}>
                  {selectedAttachment.name || 'Arquivo'}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Este arquivo não pode ser visualizado diretamente no navegador.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
                  style={{
                    background: 'var(--blue-opaque)',
                    color: 'white',
                    borderRadius: '8px'
                  }}
                >
                  <Download style={{ fontSize: '20px' }} />
                  <span>Baixar Arquivo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renderizar tela de conversa
   */
  const renderConversationView = () => {
    if (!selectedConversation) return null;

    const currentUserName = getCurrentUserName();
    let conversationName = 'Conversa';
    let contactAvatar = null;
    let contactStatus = 'offline';
    
    // Processar conversa P2P
    if (selectedConversation.type === 'p2p' && selectedConversation.p2p) {
      // Encontrar o outro participante (usando comparação normalizada)
      const normalizedCurrent = normalizeName(currentUserName);
      const otherName = normalizeName(selectedConversation.p2p.colaboradorNome1) === normalizedCurrent
        ? selectedConversation.p2p.colaboradorNome2
        : selectedConversation.p2p.colaboradorNome1;
      
      conversationName = otherName || 'Conversa P2P';
      
      // Buscar dados do contato pelo nome
      const otherContact = contacts.find(c => 
        (c.userName === otherName || c.colaboradorNome === otherName)
      );
      
      if (otherContact) {
        contactAvatar = otherContact.profile_pic || otherContact.fotoPerfil || '/mascote avatar.png';
        contactStatus = otherContact.status || 'offline';
      } else {
        contactAvatar = '/mascote avatar.png';
      }
    }
    // Processar conversa Sala
    else if (selectedConversation.type === 'sala') {
      conversationName = selectedConversation.salaNome || selectedConversation.name || 'Sala';
      // Salas não têm avatar individual, mas têm participantes
    }
    // Compatibilidade com schema antigo
    else if (selectedConversation.type === 'direct' || selectedConversation.type === 'privada') {
      const currentUserEmail = getCurrentUserEmail();
      const membersArray = Array.isArray(selectedConversation.members) ? selectedConversation.members : [];
      const membersEmails = membersArray.map(m => typeof m === 'string' ? m : m.userEmail);
      const otherEmail = membersEmails.find(email => email !== currentUserEmail);
      if (otherEmail) {
        const otherContact = getContactData(otherEmail);
        conversationName = otherContact?.userName || otherEmail || 'Conversa Direta';
        contactAvatar = otherContact?.profile_pic || otherContact?.fotoPerfil || '/mascote avatar.png';
        contactStatus = otherContact?.status || 'offline';
      } else {
        conversationName = 'Conversa Direta';
      }
    } else {
      conversationName = selectedConversation.name || selectedConversation.salaNome || 'Sala';
    }

    const statusColors = {
      online: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
      ausente: { border: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308' },
      offline: { border: '#6b7280', bg: 'rgba(107, 114, 128, 0.5)', text: '#6b7280' }
    };
    const statusLabels = {
      online: 'Online',
      ausente: 'Ausente',
      offline: 'Offline'
    };
    const colors = statusColors[contactStatus] || statusColors.offline;
    const statusLabel = statusLabels[contactStatus] || 'Offline';

    return (
      <div className="flex flex-col h-full" style={{ width: '100%', maxWidth: '100%' }}>
        {/* Header */}
        <div className="flex items-center p-3 border-b" style={{ borderColor: 'var(--blue-opaque)', width: '100%', position: 'relative' }}>
          <button
            onClick={handleBackToContacts}
            className="flex items-center justify-center p-2 rounded-full transition-colors"
            style={{ 
              position: 'absolute', 
              left: '-12px',
              color: 'var(--blue-opaque)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--blue-medium)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--blue-opaque)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div className="flex items-center gap-2" style={{ marginLeft: '12px' }}>
            {contactAvatar && (selectedConversation.type === 'p2p' || selectedConversation.type === 'direct' || selectedConversation.type === 'privada') && (
              <img
                src={contactAvatar}
                alt={conversationName}
                className="rounded-full"
                style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/mascote avatar.png';
                }}
              />
            )}
            {/* Avatar da sala (primeira letra) */}
            {selectedConversation.type === 'sala' && (
              <div className="w-8 h-8 rounded-full bg-blue-medium flex items-center justify-center text-white font-semibold text-sm">
                {conversationName.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              className="px-3 py-1 rounded-full flex items-center gap-2"
              style={{
                border: selectedConversation.type === 'sala' 
                  ? '1px solid var(--blue-dark)' 
                  : `1px solid ${colors.border}`,
                backgroundColor: selectedConversation.type === 'sala'
                  ? 'rgba(22, 148, 255, 0.15)'
                  : colors.bg,
                borderRadius: '16px',
                cursor: selectedConversation.type === 'sala' ? 'pointer' : 'default'
              }}
              onClick={selectedConversation.type === 'sala' ? () => setShowManageParticipantsModal(true) : undefined}
            >
              <h4 className="font-semibold text-sm" style={{ color: 'var(--blue-dark)' }}>
                {conversationName}
              </h4>
              {/* Cascata de avatares de participantes para salas (máximo 6) */}
              {selectedConversation.type === 'sala' && salaParticipants.length > 0 && (
                <div className="flex items-center" style={{ marginLeft: '8px' }}>
                  {salaParticipants.slice(0, 6).map((participant, index) => {
                    const avatarUrl = participant.profile_pic || participant.fotoPerfil || '/mascote avatar.png';
                    return (
                      <img
                        key={participant.userEmail || index}
                        src={avatarUrl}
                        alt={participant.userName || participant.colaboradorNome || 'Participante'}
                        className="rounded-full border-2 border-white"
                        style={{
                          width: '24px',
                          height: '24px',
                          objectFit: 'cover',
                          marginLeft: index > 0 ? '-8px' : '0',
                          zIndex: 10 - index,
                          position: 'relative'
                        }}
                        onError={(e) => {
                          e.target.src = '/mascote avatar.png';
                        }}
                        title={participant.userName || participant.colaboradorNome || participant.userEmail}
                      />
                    );
                  })}
                  {salaParticipants.length > 6 && (
                    <div
                      className="rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold"
                      style={{
                        width: '24px',
                        height: '24px',
                        marginLeft: '-8px',
                        backgroundColor: 'var(--blue-medium)',
                        color: 'white',
                        zIndex: 4,
                        position: 'relative'
                      }}
                      title={`+${salaParticipants.length - 6} mais`}
                    >
                      +{salaParticipants.length - 6}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Ícone de sino (chamada de atenção) - apenas para conversas P2P, não para salas */}
          {selectedConversation.type !== 'sala' && (
            <button
              onClick={handleCallAttention}
              className="flex items-center justify-center p-1.5 rounded-full transition-colors"
              style={{
                position: 'absolute',
                right: '45px',
                color: 'var(--blue-medium)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(22, 148, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Chamar atenção"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
          )}
          
          {/* Botão de anexo no header */}
          <div className="relative" style={{ position: 'absolute', right: '12px' }}>
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{
                borderRadius: '8px',
                minWidth: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--blue-dark)'
              }}
              title="Anexar arquivo"
            >
              <AttachFile style={{ fontSize: '18px' }} />
            </button>

            {/* Menu de seleção de tipo de anexo */}
            {showAttachmentMenu && (
              <div
                ref={attachmentMenuRef}
                className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50"
                style={{
                  minWidth: '150px',
                  borderRadius: '8px',
                  border: '1px solid var(--blue-dark)'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMediaType('image');
                    setShowAttachmentMenu(false);
                    // Aguardar React atualizar o DOM antes de abrir o seletor
                    setTimeout(() => {
                      fileInputRef.current?.click();
                    }, 0);
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  style={{ borderRadius: '6px' }}
                >
                  <Image style={{ fontSize: '20px', color: 'var(--blue-dark)' }} />
                  <span>Imagem</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMediaType('video');
                    setShowAttachmentMenu(false);
                    // Aguardar React atualizar o DOM antes de abrir o seletor
                    setTimeout(() => {
                      fileInputRef.current?.click();
                    }, 0);
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  style={{ borderRadius: '6px' }}
                >
                  <Videocam style={{ fontSize: '20px', color: 'var(--blue-dark)' }} />
                  <span>Vídeo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMediaType('file');
                    setShowAttachmentMenu(false);
                    // Aguardar React atualizar o DOM antes de abrir o seletor
                    setTimeout(() => {
                      fileInputRef.current?.click();
                    }, 0);
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  style={{ borderRadius: '6px' }}
                >
                  <InsertDriveFile style={{ fontSize: '20px', color: 'var(--blue-dark)' }} />
                  <span>Arquivo</span>
                </button>
              </div>
            )}
          </div>

          {/* Input de arquivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            accept={
              selectedMediaType === 'image' ? 'image/*' :
              selectedMediaType === 'video' ? 'video/*' :
              selectedMediaType === 'file' ? ACCEPTED_DOCUMENT_TYPES_STRING :
              '*/*'
            }
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Detectar mediaType automaticamente se não foi definido pelo usuário
                let detectedMediaType = selectedMediaType;
                if (!detectedMediaType) {
                  if (file.type.startsWith('image/')) {
                    detectedMediaType = 'image';
                  } else if (file.type.startsWith('video/')) {
                    detectedMediaType = 'video';
                  } else {
                    detectedMediaType = 'file';
                  }
                  console.log('📎 [File Select] mediaType detectado automaticamente:', detectedMediaType, 'do tipo:', file.type);
                }
                
                // Validar que o arquivo corresponde ao tipo selecionado
                if (selectedMediaType === 'image' && !file.type.startsWith('image/')) {
                  setError('Por favor, selecione uma imagem');
                  e.target.value = '';
                  return;
                }
                if (selectedMediaType === 'video' && !file.type.startsWith('video/')) {
                  setError('Por favor, selecione um vídeo');
                  e.target.value = '';
                  return;
                }
                if (selectedMediaType === 'file' && !isValidDocumentType(file.type)) {
                  setError('Por favor, selecione um documento válido (PDF, Word, Excel, JSON, CSV, etc.)');
                  e.target.value = '';
                  return;
                }
                
                // Garantir que mediaType está definido
                if (!selectedMediaType) {
                  setSelectedMediaType(detectedMediaType);
                }
                
                // Gerar preview baseado no tipo
                const preview = await generateFilePreview(file, detectedMediaType);
                
                setSelectedFile({
                  file,
                  name: file.name,
                  type: file.type,
                  url: null
                });
                setFilePreview(preview);
              }
              // Resetar input para permitir selecionar o mesmo arquivo novamente
              e.target.value = '';
            }}
          />
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 pb-2 space-y-3">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Carregando mensagens...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Nenhuma mensagem ainda</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              // Suportar tanto schema antigo quanto novo
              const userName = msg.userName || msg.senderName || msg.autorNome || 'Usuário';
              const timestamp = msg.timestamp || msg.createdAt;
              const isCurrentUser = userName === getCurrentUserName();
              
              // Verificar se é mensagem de chamada de atenção
              const isCallerSign = msg.mensagem === '[att-caller-sign]' || 
                                   msg.content === '[att-caller-sign]' || 
                                   msg.originalContent === '[att-caller-sign]' ||
                                   msg.isCallerSign;
              
              // Definir texto da mensagem baseado no tipo e se é do usuário atual
              let mensagem = msg.mensagem || msg.content || '';
              if (isCallerSign) {
                if (isCurrentUser) {
                  // Para o sender: "Chamou o Contato"
                  mensagem = 'Chamou o Contato';
                } else {
                  // Para o recebedor: "Chamando sua atenção!"
                  mensagem = 'Chamando sua atenção!';
                }
              }
              
              return (
                <div
                  key={msg._id || msg.messageId || `msg-${index}`}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`${msg.mediaUrl ? 'max-w-fit' : 'max-w-[70%]'} p-2 rounded-lg`}
                    style={{
                      borderRadius: '8px',
                      // Mensagem enviada (usuário atual)
                      ...(isCurrentUser ? {
                        backgroundColor: 'rgb(229, 231, 235)', // cinza (gray-200)
                        border: isCallerSign 
                          ? '2px solid #FFC107' // Amarelo para chamada de atenção do sender
                          : '1px solid var(--blue-opaque)', // #006AB9
                        color: 'var(--cor-texto-principal)' // ou 'black'
                      } : {
                        // Mensagem recebida
                        backgroundColor: 'rgba(22, 148, 255, 0.7)', // azul claro 70% opacidade
                        border: isCallerSign 
                          ? '2px solid #F44336' // Vermelho para chamada de atenção do recebedor
                          : '1px solid var(--blue-dark)', // #000058
                        color: 'white'
                      })
                    }}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {userName}
                    </div>
                    {mensagem && <div>{mensagem}</div>}
                    {/* Renderizar thumbnail de anexo se disponível */}
                    {msg.mediaUrl && (() => {
                      // Extrair nome do arquivo da URL se não estiver disponível
                      const getFileName = () => {
                        if (msg.name) return msg.name;
                        try {
                          const urlParts = msg.mediaUrl.split('/');
                          const fileName = urlParts[urlParts.length - 1].split('?')[0];
                          return fileName || 'Anexo';
                        } catch {
                          return 'Anexo';
                        }
                      };
                      const fileName = getFileName();
                      
                      return (
                        <div className="mt-2">
                          {msg.mediaType === 'image' && (
                            <div 
                              className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ 
                                maxWidth: 'min(300px, calc(70vw - 40px))',
                                width: 'auto',
                                height: 'auto',
                                minWidth: '150px',
                                minHeight: '150px',
                                maxHeight: '300px',
                                border: '1px solid var(--blue-opaque)',
                                borderRadius: '8px'
                              }}
                              onClick={(e) => {
                                try {
                                  const attachmentData = {
                                    url: msg.mediaUrl,
                                    type: 'image',
                                    name: fileName
                                  };
                                  setSelectedAttachment(attachmentData);
                                  setShowAttachmentModal(true);
                                } catch (error) {
                                  console.error('Erro ao abrir modal:', error);
                                }
                              }}
                            >
                              <img 
                                src={msg.mediaUrl} 
                                alt="Imagem anexada" 
                                className="w-full h-full object-cover pointer-events-none"
                                style={{
                                  display: 'block',
                                  objectFit: 'cover',
                                  objectPosition: 'center',
                                  minWidth: '100%',
                                  minHeight: '100%'
                                }}
                                loading="lazy"
                                onError={(e) => {
                                  console.error('Erro ao carregar imagem:', msg.mediaUrl);
                                  e.target.style.display = 'none';
                                  const parent = e.target.parentElement;
                                  if (parent && !parent.querySelector('.error-fallback')) {
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'error-fallback flex items-center justify-center w-full h-full bg-gray-200 dark:bg-gray-700';
                                    errorDiv.innerHTML = '<svg style="font-size: 48px; color: var(--blue-dark);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
                                    parent.appendChild(errorDiv);
                                  }
                                }}
                              />
                              <button
                                className="absolute bottom-0 right-0 p-1 bg-black bg-opacity-50 hover:bg-opacity-70 transition-opacity cursor-pointer rounded-tl-lg z-10"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(msg.mediaUrl);
                                    if (!response.ok) throw new Error(`Erro: ${response.status}`);
                                    const blob = await response.blob();
                                    const blobUrl = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = blobUrl;
                                    link.download = fileName || 'imagem.jpg';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                  } catch (error) {
                                    console.error('Erro ao baixar imagem:', error);
                                    setError(`Erro ao baixar imagem: ${error.message}`);
                                  }
                                }}
                                title="Baixar imagem"
                              >
                                <Download style={{ fontSize: '16px', color: 'white' }} />
                              </button>
                            </div>
                          )}
                          {msg.mediaType === 'video' && (
                            <div 
                              className="relative rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center"
                              style={{ 
                                width: '150px', 
                                height: '150px',
                                border: '1px solid var(--blue-opaque)'
                              }}
                            >
                              <div 
                                className="cursor-pointer w-full h-full flex items-center justify-center"
                                onClick={() => {
                                  setSelectedAttachment({
                                    url: msg.mediaUrl,
                                    type: 'video',
                                    name: fileName
                                  });
                                  setShowAttachmentModal(true);
                                }}
                              >
                                <Videocam style={{ fontSize: '48px', color: 'white' }} />
                              </div>
                              <button
                                className="absolute bottom-0 right-0 p-1 bg-black bg-opacity-50 hover:bg-opacity-70 transition-opacity cursor-pointer rounded-tl-lg"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(msg.mediaUrl);
                                    if (!response.ok) throw new Error(`Erro: ${response.status}`);
                                    const blob = await response.blob();
                                    const blobUrl = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = blobUrl;
                                    link.download = fileName || 'video.mp4';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                  } catch (error) {
                                    console.error('Erro ao baixar vídeo:', error);
                                    setError(`Erro ao baixar vídeo: ${error.message}`);
                                  }
                                }}
                                title="Baixar vídeo"
                              >
                                <Download style={{ fontSize: '16px', color: 'white' }} />
                              </button>
                            </div>
                          )}
                          {(msg.mediaType === 'file' || !msg.mediaType) && (
                            <div 
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              style={{ 
                                border: '1px solid var(--blue-opaque)',
                                borderRadius: '8px',
                                maxWidth: '200px'
                              }}
                            >
                              <div 
                                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                onClick={() => {
                                  setSelectedAttachment({
                                    url: msg.mediaUrl,
                                    type: 'file',
                                    name: fileName
                                  });
                                  setShowAttachmentModal(true);
                                }}
                              >
                                <InsertDriveFile style={{ fontSize: '24px', color: 'var(--blue-dark)' }} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm truncate" style={{ color: 'var(--blue-dark)' }}>
                                    {fileName}
                                  </div>
                                </div>
                              </div>
                              <button
                                className="hover:opacity-70 transition-opacity cursor-pointer"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(msg.mediaUrl);
                                    if (!response.ok) throw new Error(`Erro: ${response.status}`);
                                    const blob = await response.blob();
                                    const blobUrl = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = blobUrl;
                                    link.download = fileName || 'arquivo';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                  } catch (error) {
                                    console.error('Erro ao baixar arquivo:', error);
                                    setError(`Erro ao baixar arquivo: ${error.message}`);
                                  }
                                }}
                                title="Baixar arquivo"
                              >
                                <Download style={{ fontSize: '18px', color: 'var(--blue-dark)' }} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {/* Compatibilidade com formato antigo attachments */}
                    {msg.attachments && msg.attachments.length > 0 && !msg.mediaUrl && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((att, idx) => {
                          const attFileName = att.name || 'Arquivo';
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              style={{ 
                                border: '1px solid var(--blue-opaque)',
                                borderRadius: '8px',
                                maxWidth: '200px'
                              }}
                            >
                              <div 
                                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                onClick={() => {
                                  setSelectedAttachment({
                                    url: att.url,
                                    type: att.type || 'file',
                                    name: attFileName
                                  });
                                  setShowAttachmentModal(true);
                                }}
                              >
                                <InsertDriveFile style={{ fontSize: '24px', color: 'var(--blue-dark)' }} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm truncate" style={{ color: 'var(--blue-dark)' }}>
                                    {attFileName}
                                  </div>
                                </div>
                              </div>
                              <button
                                className="hover:opacity-70 transition-opacity cursor-pointer"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(att.url);
                                    if (!response.ok) throw new Error(`Erro: ${response.status}`);
                                    const blob = await response.blob();
                                    const blobUrl = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = blobUrl;
                                    link.download = attFileName;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                  } catch (error) {
                                    console.error('Erro ao baixar arquivo:', error);
                                    setError(`Erro ao baixar arquivo: ${error.message}`);
                                  }
                                }}
                                title="Baixar arquivo"
                              >
                                <Download style={{ fontSize: '18px', color: 'var(--blue-dark)' }} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="text-xs opacity-70 mt-1">
                      {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Indicador de digitação */}
          {Object.keys(typingUsers).length > 0 && (
            <div className="text-sm text-gray-500 italic">
              {Object.values(typingUsers).filter(Boolean).join(', ')} está digitando...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensagem */}
        <div className="pt-2 pb-3 border-t" style={{ 
          borderColor: 'var(--blue-opaque)', 
          paddingLeft: '12px', 
          paddingRight: '12px', 
          width: '100%', 
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Badge de preview de anexo */}
          {selectedFile && (
            <div 
              className="mb-2 rounded-lg flex items-center gap-2 px-3 py-2"
              style={{
                backgroundColor: 'var(--blue-opaque)', // #006AB9
                borderRadius: '8px',
                border: '1px solid var(--blue-dark)'
              }}
            >
              {/* Ícone baseado no tipo de arquivo */}
              {selectedMediaType === 'image' ? (
                <Image style={{ fontSize: '18px', color: 'white' }} />
              ) : selectedMediaType === 'video' ? (
                <Videocam style={{ fontSize: '18px', color: 'white' }} />
              ) : (
                <InsertDriveFile style={{ fontSize: '18px', color: 'white' }} />
              )}
              
              {/* Nome do arquivo */}
              <span className="text-sm truncate flex-1" style={{ color: 'white' }}>
                {uploadingFile ? 'Enviando...' : selectedFile.name}
              </span>
              
              {/* Botão remover ou spinner */}
              {uploadingFile ? (
                <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%' }} />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setSelectedMediaType(null);
                    setFilePreview(null);
                  }}
                  className="hover:opacity-70 transition-opacity"
                  title="Remover arquivo"
                  style={{ color: 'white' }}
                >
                  <Close style={{ fontSize: '18px' }} />
                </button>
              )}
            </div>
          )}

          {/* Textarea */}
          <textarea
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Digite uma mensagem..."
            rows={2}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-medium resize-none"
            style={{
              borderColor: 'var(--blue-opaque)',
              borderRadius: '8px',
              minHeight: '60px',
              maxHeight: '120px',
              boxSizing: 'border-box',
              display: 'block'
            }}
          />
        </div>
      </div>
    );
  };


  /**
   * Obter status de um contato pela lista de contatos carregados
   */
  const getContactStatus = (userEmail) => {
    const contact = contacts.find(c => c.userEmail === userEmail);
    return contact?.status || 'offline';
  };

  /**
   * Obter dados completos de um contato pela lista de contatos carregados
   */
  const getContactData = (userEmail) => {
    return contacts.find(c => c.userEmail === userEmail) || null;
  };

  // Renderizar conteúdo conforme activeTab
  const renderContent = () => {
    if (view === 'conversation') {
      return renderConversationView();
    }

    switch (activeTab) {
      case 'conversations':
        return renderConversationsView();
      case 'contacts':
        return renderContactsView();
      case 'salas':
        return renderSalasView();
      default:
        return renderConversationsView();
    }
  };

  // Obter sessionId do localStorage
  const getSessionId = () => {
    try {
      return localStorage.getItem('velohub_session_id');
    } catch (error) {
      console.error('Erro ao obter sessionId:', error);
      return null;
    }
  };

  const sessionId = getSessionId();

  return (
    <div className="h-full flex flex-col" style={{ minHeight: '400px', width: '100%', maxWidth: '100%' }}>
      {renderContent()}
      
      {/* Modal de Gerenciamento de Sala */}
      {showManageParticipantsModal && renderSalaManagementModal()}
      
      {/* Modal de Visualização de Anexo */}
      {showAttachmentModal && selectedAttachment && renderAttachmentModal()}
    </div>
  );
};

export default VeloChatWidget;

