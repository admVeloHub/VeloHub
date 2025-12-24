/**
 * Hook useWebSocket - VeloChat Frontend
 * VERSION: v3.2.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v3.2.0:
 * - Adicionado suporte a mediaUrl e mediaType em p2p_message_received e sala_message_received
 * - Atualizado sendMessage para aceitar e enviar mediaUrl e mediaType
 * 
 * Mudanças v3.1.0:
 * - Corrigido problema de reconexões constantes: adicionada verificação para evitar múltiplas conexões
 * - Melhorado tratamento de desconexões: apenas desconecta se realmente necessário
 * - Adicionados logs de debug para rastrear problemas de conexão
 * - Aumentado reconnectionAttempts para 10 e reconnectionDelay para 2000ms
 * 
 * Mudanças v3.0.0:
 * - Adicionados listeners para eventos p2p_message_received e sala_message_received
 * - Atualizado sendMessage para detectar tipo de conversa automaticamente
 * 
 * Mudanças v2.0.0:
 * - Adicionados listeners para atualização em tempo real de contatos e conversas
 * - Eventos: contact_online, contact_offline, contact_status_changed
 * - Eventos: conversation_created, conversation_updated, last_message_updated
 * 
 * Hook React para gerenciar conexão WebSocket com VeloChat Server
 */

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const VELOCHAT_WS_URL = process.env.REACT_APP_VELOCHAT_WS_URL || 'http://localhost:3001';

/**
 * Hook para gerenciar conexão WebSocket
 */
export const useWebSocket = (onMessage, onTyping, onRead, onContactStatusChange, onConversationUpdate) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const isConnectingRef = useRef(false);
  const callbacksRef = useRef({ 
    onMessage, 
    onTyping, 
    onRead, 
    onContactStatusChange, 
    onConversationUpdate 
  });

  // Atualizar callbacks sem recriar conexão
  useEffect(() => {
    callbacksRef.current = { 
      onMessage, 
      onTyping, 
      onRead, 
      onContactStatusChange, 
      onConversationUpdate 
    };
  }, [onMessage, onTyping, onRead, onContactStatusChange, onConversationUpdate]);

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
      console.error('❌ Erro ao conectar WebSocket:', error.message);
      console.error('URL tentada:', VELOCHAT_WS_URL);
      console.error('SessionId:', sessionId ? 'presente' : 'ausente');
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
   */
  const sendMessage = (conversationId, content, attachments = [], mediaUrl = null, mediaType = null) => {
    console.log('📤 [useWebSocket.sendMessage] Tentando enviar mensagem:', {
      conversationId,
      hasSocket: !!socketRef.current,
      isConnected,
      hasContent: !!content,
      contentLength: content?.length,
      hasMediaUrl: !!mediaUrl,
      mediaType
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
