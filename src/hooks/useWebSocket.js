/**
 * Hook useWebSocket - VeloChat Frontend
 * VERSION: v3.3.1 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v3.3.0: Adicionado suporte a eventos de edição de mensagens (p2p_message_edited e sala_message_edited)
 * - v3.2.0: Adicionado suporte a mediaUrl e mediaType em p2p_message_received e sala_message_received
 */

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getVeloChatWsUrl } from '../config/api-config';

// Usar detecção automática de ambiente ao invés de fallback hardcoded
const VELOCHAT_WS_URL = getVeloChatWsUrl();

/**
 * Hook para gerenciar conexão WebSocket
 */
export const useWebSocket = (onMessage, onTyping, onRead, onContactStatusChange, onConversationUpdate, onMessageEdited) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const isConnectingRef = useRef(false);
  const callbacksRef = useRef({ 
    onMessage, 
    onTyping, 
    onRead, 
    onContactStatusChange, 
    onConversationUpdate,
    onMessageEdited
  });

  // Atualizar callbacks sem recriar conexão
  useEffect(() => {
    callbacksRef.current = { 
      onMessage, 
      onTyping, 
      onRead, 
      onContactStatusChange, 
      onConversationUpdate,
      onMessageEdited
    };
  }, [onMessage, onTyping, onRead, onContactStatusChange, onConversationUpdate, onMessageEdited]);

  useEffect(() => {
    // Evitar múltiplas conexões simultâneas
    if (socketRef.current?.connected || isConnectingRef.current) {
      return;
    }

    // Obter sessionId do localStorage
    const getSessionId = () => {
      try {
        // sessionId está armazenado diretamente em velohub_session_id
        return localStorage.getItem('velohub_session_id');
      } catch (error) {
        console.error('Erro ao obter sessionId:', error);
      }
      return null;
    };

    const sessionId = getSessionId();
    
    if (!sessionId) {
      console.warn('⚠️ SessionId não encontrado - WebSocket não conectará');
      return;
    }

    isConnectingRef.current = true;

    // Conectar ao servidor WebSocket
    const socket = io(VELOCHAT_WS_URL, {
      query: { sessionId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      timeout: 20000,
      forceNew: false // Reutilizar conexão existente se disponível
    });

    socketRef.current = socket;

    // Event: connect
    socket.on('connect', () => {
      console.log('✅ WebSocket conectado ao VeloChat Server');
      setIsConnected(true);
      isConnectingRef.current = false;
    });

    // Event: disconnect
    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado:', reason);
      setIsConnected(false);
      isConnectingRef.current = false;
      
      // Não desconectar manualmente se for uma desconexão temporária (reconexão automática)
      if (reason === 'io client disconnect' || reason === 'io server disconnect') {
        // Desconexão manual ou do servidor - não tentar reconectar
        socketRef.current = null;
      }
    });

    // Event: connect_error
    socket.on('connect_error', (error) => {
      // Reduzir verbosidade: apenas logar erros que não sejam relacionados a sessão inválida
      if (!error.message || !error.message.includes('Sessão inválida')) {
        console.error('❌ Erro ao conectar WebSocket:', error.message);
        console.error('URL tentada:', VELOCHAT_WS_URL);
        console.error('SessionId:', sessionId ? 'presente' : 'ausente');
      }
      setIsConnected(false);
      isConnectingRef.current = false;
    });

    // Event: message_received (legacy - manter para compatibilidade)
    socket.on('message_received', (data) => {
      if (callbacksRef.current.onMessage) {
        callbacksRef.current.onMessage(data.message);
      }
    });

    // Event: p2p_message_received
    socket.on('p2p_message_received', (data) => {
      if (callbacksRef.current.onMessage) {
        // Converter formato P2P para formato esperado pelo callback
        callbacksRef.current.onMessage({
          conversationId: data.conversationId,
          userName: data.message.userName,
          mensagem: data.message.mensagem,
          timestamp: data.message.timestamp,
          createdAt: data.message.timestamp,
          mediaUrl: data.message.mediaUrl || null,        // NOVO: URL da mídia
          mediaType: data.message.mediaType || null,      // NOVO: Tipo da mídia
          attachments: data.message.attachments || [],     // Manter compatibilidade
          type: 'p2p'
        });
      }
    });

    // Event: sala_message_received
    socket.on('sala_message_received', (data) => {
      if (callbacksRef.current.onMessage) {
        // Converter formato Sala para formato esperado pelo callback
        callbacksRef.current.onMessage({
          conversationId: data.salaId,
          salaId: data.salaId,
          userName: data.message.userName,
          mensagem: data.message.mensagem,
          timestamp: data.message.timestamp,
          createdAt: data.message.timestamp,
          mediaUrl: data.message.mediaUrl || null,        // NOVO: URL da mídia
          mediaType: data.message.mediaType || null,      // NOVO: Tipo da mídia
          attachments: data.message.attachments || [],     // Manter compatibilidade
          type: 'sala'
        });
      }
    });

    // Event: p2p_message_edited - Mensagem P2P foi editada
    socket.on('p2p_message_edited', (data) => {
      if (callbacksRef.current.onMessageEdited) {
        callbacksRef.current.onMessageEdited({
          conversationId: data.conversationId,
          userName: data.userName,
          timestamp: data.timestamp,
          message: data.message,
          type: 'p2p'
        });
      }
    });

    // Event: sala_message_edited - Mensagem de sala foi editada
    socket.on('sala_message_edited', (data) => {
      if (callbacksRef.current.onMessageEdited) {
        callbacksRef.current.onMessageEdited({
          conversationId: data.salaId,
          salaId: data.salaId,
          userName: data.userName,
          timestamp: data.timestamp,
          message: data.message,
          type: 'sala'
        });
      }
    });

    // Event: user_typing
    socket.on('user_typing', (data) => {
      if (callbacksRef.current.onTyping) {
        callbacksRef.current.onTyping(data);
      }
    });

    // Event: message_read
    socket.on('message_read', (data) => {
      if (callbacksRef.current.onRead) {
        callbacksRef.current.onRead(data);
      }
    });

    // Event: contact_online - Contato ficou online
    socket.on('contact_online', (data) => {
      if (callbacksRef.current.onContactStatusChange) {
        callbacksRef.current.onContactStatusChange({
          userEmail: data.userEmail,
          userName: data.userName,
          status: 'online',
          timestamp: data.timestamp
        });
      }
    });

    // Event: contact_offline - Contato ficou offline
    socket.on('contact_offline', (data) => {
      if (callbacksRef.current.onContactStatusChange) {
        callbacksRef.current.onContactStatusChange({
          userEmail: data.userEmail,
          userName: data.userName,
          status: 'offline',
          timestamp: data.timestamp
        });
      }
    });

    // Event: contact_status_changed - Status de contato mudou (online, ausente, offline)
    socket.on('contact_status_changed', (data) => {
      if (callbacksRef.current.onContactStatusChange) {
        callbacksRef.current.onContactStatusChange({
          userEmail: data.userEmail,
          userName: data.userName,
          status: data.status, // Pode ser 'online', 'ausente', ou 'offline'
          timestamp: data.timestamp
        });
      }
    });

    // Event: conversation_created - Nova conversa criada
    socket.on('conversation_created', (data) => {
      if (callbacksRef.current.onConversationUpdate) {
        callbacksRef.current.onConversationUpdate({
          type: 'created',
          conversation: data.conversation,
          createdBy: data.createdBy
        });
      }
    });

    // Event: last_message_updated - Última mensagem de conversa atualizada
    socket.on('last_message_updated', (data) => {
      if (callbacksRef.current.onConversationUpdate) {
        callbacksRef.current.onConversationUpdate({
          type: 'last_message_updated',
          conversationId: data.conversationId,
          lastMessage: data.lastMessage,
          timestamp: data.timestamp
        });
      }
    });

    // Cleanup - desconectar apenas se realmente necessário
    return () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null;
      isConnectingRef.current = false;
    };
  }, []); // Array vazio - conexão criada apenas uma vez

  /**
   * Entrar em uma conversa
   */
  const joinConversation = (conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_conversation', { conversationId });
    }
  };

  /**
   * Sair de uma conversa
   */
  const leaveConversation = (conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_conversation', { conversationId });
    }
  };

  /**
   * Enviar mensagem via WebSocket
   * Detecta automaticamente se é P2P ou Sala baseado no conversationId
   * @param {string} conversationId - ID da conversa
   * @param {string} content - Conteúdo da mensagem
   * @param {Array} attachments - Anexos
   * @param {string} mediaUrl - URL da mídia
   * @param {string} mediaType - Tipo da mídia
   * @param {string} otherParticipantName - Nome do outro participante (para P2P, permite criar conversa automaticamente)
   */
  const sendMessage = (conversationId, content, attachments = [], mediaUrl = null, mediaType = null, otherParticipantName = null) => {
    console.log('📤 [useWebSocket.sendMessage] Tentando enviar mensagem:', {
      conversationId,
      hasSocket: !!socketRef.current,
      isConnected,
      hasContent: !!content,
      contentLength: content?.length,
      hasMediaUrl: !!mediaUrl,
      mediaType,
      otherParticipantName
    });
    
    if (!socketRef.current) {
      console.error('❌ [useWebSocket.sendMessage] Socket não disponível');
      return;
    }
    
    if (!isConnected) {
      console.error('❌ [useWebSocket.sendMessage] WebSocket não conectado. Status:', isConnected);
      return;
    }
    
    // O servidor detecta automaticamente o tipo baseado no ID
    const messageData = {
      conversationId,
      content,
      attachments
    };
    
    // Adicionar mídia se disponível
    if (mediaUrl) {
      messageData.mediaUrl = mediaUrl;
      messageData.mediaType = mediaType;
    }
    
    // Adicionar nome do outro participante se for P2P (permite criar conversa automaticamente na primeira mensagem)
    if (otherParticipantName && conversationId && conversationId.startsWith('p2p_')) {
      messageData.otherParticipantName = otherParticipantName;
    }
    
    console.log('📤 [useWebSocket.sendMessage] Emitindo evento send_message:', messageData);
    socketRef.current.emit('send_message', messageData);
    console.log('✅ [useWebSocket.sendMessage] Evento emitido com sucesso');
  };

  /**
   * Enviar indicador de digitação
   */
  const sendTyping = (conversationId, isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', {
        conversationId,
        isTyping
      });
    }
  };

  /**
   * Marcar mensagem como lida
   */
  const markRead = (conversationId, messageId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_read', {
        conversationId,
        messageId
      });
    }
  };

  return {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    markRead
  };
};
