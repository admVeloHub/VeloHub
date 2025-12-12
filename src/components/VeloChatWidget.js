/**
 * VeloChatWidget - Componente Principal do Chat
 * VERSION: v1.5.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.5.0:
 * - Adicionado suporte para status "ausente" nas abas de contatos e conversas
 * - Status "ausente" exibido com cor amarela (#eab308)
 * - Opacidade reduzida aplicada apenas para status "offline"
 * 
 * Mudanças v1.4.0:
 * - Integrado ChatStatusSelector no header do chat
 * - Conversas prévias são carregadas automaticamente ao iniciar o VeloHub
 * - Carregamento de conversas ocorre tanto ao montar quanto ao mudar para aba 'conversations'
 * 
 * Mudanças v1.3.0:
 * - Adicionado indicador de status online/offline na aba de conversas
 * - Conversas diretas agora mostram foto de perfil e status do contato
 * - Contatos são carregados também na aba de conversas para exibir status
 * - Opacidade do fundo verde reduzida para 0.15
 * 
 * Mudanças v1.2.0:
 * - Adicionado suporte para busca de contatos via prop searchQuery
 * - Implementado clique em contato para iniciar/abrir conversa
 * - Reduzida opacidade do fundo verde dos usuários online pela metade
 * 
 * Mudanças v1.1.1:
 * - Removido status "ausente" - agora usa apenas isActive (online/offline)
 * 
 * Mudanças v1.1.0:
 * - Adicionado suporte para prop activeTab (conversations, contacts, groups)
 * - Implementada visualização de contatos com indicadores de status
 * - Adicionada função loadContacts() para buscar contatos do backend
 * - Criada renderContactsView() com indicadores visuais (online/offline)
 * - Criada renderGroupsView() como placeholder
 * 
 * Widget de chat integrado na sidebar do VeloHub
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import * as velochatApi from '../services/velochatApi';
import ChatStatusSelector from './ChatStatusSelector';

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
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // WebSocket handlers - usando useCallback para evitar recriação
  const handleNewMessage = useCallback((message) => {
    if (message.conversationId === selectedConversation?.conversationId) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    }
  }, [selectedConversation]);

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

  // WebSocket connection
  const {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage: wsSendMessage,
    sendTyping,
    markRead
  } = useWebSocket(handleNewMessage, handleTyping, handleRead);

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

  // Carregar conversas ao montar e sempre que activeTab mudar para 'conversations'
  // Isso garante que conversas prévias sejam carregadas ao iniciar o VeloHub
  useEffect(() => {
    if (activeTab === 'conversations') {
      loadConversations();
    }
  }, [activeTab, loadConversations]);

  // Carregar conversas ao montar o componente (independente da aba ativa)
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Carregar contatos quando aba de contatos ou conversas estiver ativa (para mostrar status)
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VeloChatWidget.js:useEffect[activeTab]',message:'useEffect triggered for activeTab',data:{activeTab,shouldLoad:activeTab==='contacts'||activeTab==='conversations'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (activeTab === 'contacts' || activeTab === 'conversations') {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VeloChatWidget.js:useEffect[activeTab]',message:'Calling loadContacts',data:{activeTab},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      loadContacts();
    }
  }, [activeTab]);

  // Entrar/sair da conversa quando selecionada
  useEffect(() => {
    if (selectedConversation && isConnected) {
      joinConversation(selectedConversation.conversationId);
      loadMessages(selectedConversation.conversationId);
      
      return () => {
        leaveConversation(selectedConversation.conversationId);
      };
    }
  }, [selectedConversation, isConnected]);

  // Scroll automático para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  /**
   * Carregar mensagens de uma conversa
   */
  const loadMessages = async (conversationId) => {
    try {
      setLoading(true);
      const data = await velochatApi.getMessages(conversationId);
      setMessages(data.messages || []);
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
  };

  /**
   * Lidar com clique em contato - iniciar ou abrir conversa
   */
  const handleContactClick = async (contact) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUserEmail = getCurrentUserEmail();
      if (!currentUserEmail) {
        throw new Error('Usuário não identificado');
      }

      // Verificar se já existe conversa direta nas conversas carregadas
      const existingConversation = conversations.find(conv => {
        if (conv.type !== 'direct') return false;
        const otherMember = conv.members.find(m => m.userEmail !== currentUserEmail);
        return otherMember && otherMember.userEmail === contact.userEmail;
      });

      if (existingConversation) {
        // Conversa já existe, apenas selecionar
        handleSelectConversation(existingConversation);
        return;
      }

      // Criar nova conversa direta
      const conversationData = await velochatApi.createConversation({
        type: 'direct',
        members: [
          {
            userEmail: contact.userEmail,
            userName: contact.userName
          }
        ]
      });

      if (conversationData && conversationData.conversation) {
        // Adicionar à lista de conversas e selecionar
        setConversations(prev => [conversationData.conversation, ...prev]);
        handleSelectConversation(conversationData.conversation);
      } else {
        throw new Error('Erro ao criar conversa');
      }
    } catch (err) {
      console.error('Erro ao iniciar conversa:', err);
      setError(err.message || 'Erro ao iniciar conversa');
    } finally {
      setLoading(false);
    }
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
   * Enviar mensagem
   */
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      const messageData = {
        conversationId: selectedConversation.conversationId,
        content: messageInput.trim()
      };

      // Enviar via WebSocket (mensagem será salva no backend)
      wsSendMessage(
        selectedConversation.conversationId,
        messageInput.trim(),
        []
      );

      setMessageInput('');
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err.message);
    }
  };

  /**
   * Handle typing indicator
   */
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (selectedConversation && isConnected) {
      sendTyping(selectedConversation.conversationId, true);
      
      // Parar de digitar após 1 segundo sem digitação
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(selectedConversation.conversationId, false);
      }, 1000);
    }
  };

  /**
   * Carregar contatos do usuário
   */
  const loadContacts = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VeloChatWidget.js:loadContacts',message:'loadContacts called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      setLoadingContacts(true);
      setError(null);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VeloChatWidget.js:loadContacts',message:'Before API call',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const data = await velochatApi.getContacts();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VeloChatWidget.js:loadContacts',message:'API response received',data:{hasData:!!data,contactsCount:data?.contacts?.length||0,contacts:data?.contacts||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D,E'})}).catch(()=>{});
      // #endregion
      setContacts(data.contacts || []);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VeloChatWidget.js:loadContacts',message:'State updated with contacts',data:{contactsCount:data?.contacts?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VeloChatWidget.js:loadContacts',message:'Error in loadContacts',data:{error:err.message,errorStack:err.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('Erro ao carregar contatos:', err);
      setError(err.message);
    } finally {
      setLoadingContacts(false);
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

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => {
                const currentUserEmail = getCurrentUserEmail();
                let otherMember = null;
                let memberStatus = 'offline';
                let contactData = null;
                
                if (conv.type === 'direct') {
                  otherMember = conv.members.find(m => m.userEmail !== currentUserEmail);
                  if (otherMember) {
                    contactData = getContactData(otherMember.userEmail);
                    memberStatus = contactData?.status || 'offline';
                  }
                }

                const statusColors = {
                  online: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
                  ausente: { border: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' }, // Amarelo
                  offline: { border: '#6b7280', bg: 'rgba(107, 114, 128, 0.5)' }
                };
                const statusLabels = {
                  online: 'Online',
                  ausente: 'Ausente',
                  offline: 'Offline'
                };
                const colors = statusColors[memberStatus] || statusColors.offline;
                const isOffline = memberStatus === 'offline';
                const fotoPerfil = contactData?.fotoPerfil || otherMember?.fotoPerfil || '/mascote avatar.png';

                return (
                  <div
                    key={conv.conversationId}
                    onClick={() => handleSelectConversation(conv)}
                    className="p-3 rounded-lg mb-2 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      border: `1px solid ${colors.border}`,
                      backgroundColor: conv.type === 'direct' ? colors.bg : 'transparent',
                      borderRadius: '8px',
                      opacity: conv.type === 'direct' && isOffline ? 0.6 : 1
                    }}
                  >
                    {conv.type === 'direct' && otherMember && (
                      <div className="relative">
                        <img
                          src={fotoPerfil}
                          alt={otherMember.userName || 'Contato'}
                          className="w-10 h-10 rounded-full object-cover"
                          style={{ opacity: isOffline ? 0.6 : 1 }}
                          onError={(e) => {
                            e.target.src = '/mascote avatar.png';
                          }}
                        />
                        {/* Indicador de status */}
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                          style={{
                            backgroundColor: colors.border,
                            borderColor: 'white',
                            borderWidth: '2px'
                          }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, opacity: conv.type === 'direct' && isOffline ? 0.6 : 1 }}>
                      <div className="font-semibold" style={{ color: 'var(--blue-dark)' }}>
                        {conv.type === 'direct' 
                          ? otherMember?.userName || 'Conversa Direta'
                          : conv.name || 'Grupo'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {conv.type === 'direct' && (
                          <div className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>
                            {statusLabels[memberStatus] || 'Offline'}
                          </div>
                        )}
                        {conv.lastMessageAt && (
                          <>
                            {conv.type === 'direct' && <span className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>•</span>}
                            <div className="text-xs" style={{ color: 'var(--cor-texto-secundario)' }}>
                              {new Date(conv.lastMessageAt).toLocaleDateString()}
                            </div>
                          </>
                        )}
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
   * Renderizar tela de contatos
   */
  const renderContactsView = () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VeloChatWidget.js:renderContactsView',message:'renderContactsView called',data:{loadingContacts,contactsCount:contacts.length,hasError:!!error,error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
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

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">
                {searchQuery.trim() === '' ? 'Nenhum contato encontrado' : 'Nenhum contato encontrado para a busca'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => {
                const statusColors = {
                  online: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
                  ausente: { border: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' }, // Amarelo
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
                    onClick={() => handleContactClick(contact)}
                    className="p-3 rounded-lg mb-2 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.bg,
                      borderRadius: '8px',
                      opacity: isOffline ? 0.6 : 1
                    }}
                  >
                    <img
                      src={contact.fotoPerfil || '/mascote avatar.png'}
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
   * Renderizar tela de grupos (placeholder)
   */
  const renderGroupsView = () => {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Grupos em breve</p>
      </div>
    );
  };

  /**
   * Renderizar tela de conversa
   */
  const renderConversationView = () => {
    if (!selectedConversation) return null;

    const conversationName = selectedConversation.type === 'direct'
      ? selectedConversation.members.find(m => m.userEmail !== getCurrentUserEmail())?.userName || 'Conversa Direta'
      : selectedConversation.name || 'Grupo';

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--blue-opaque)' }}>
          <button
            onClick={handleBackToContacts}
            className="mr-2 text-blue-medium hover:text-blue-dark"
          >
            ← Voltar
          </button>
          <h4 className="font-semibold flex-1" style={{ color: 'var(--blue-dark)' }}>
            {conversationName}
          </h4>
          {!isConnected && (
            <span className="text-xs text-red-500">Desconectado</span>
          )}
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Carregando mensagens...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Nenhuma mensagem ainda</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.messageId}
                className={`flex ${msg.senderEmail === getCurrentUserEmail() ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-2 rounded-lg ${
                    msg.senderEmail === getCurrentUserEmail()
                      ? 'bg-blue-medium text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={{ borderRadius: '8px' }}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {msg.senderName}
                  </div>
                  <div>{msg.content}</div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm underline"
                        >
                          {att.name}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
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
        <div className="p-3 border-t" style={{ borderColor: 'var(--blue-opaque)' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite uma mensagem..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-medium"
              style={{
                borderColor: 'var(--blue-opaque)',
                borderRadius: '8px'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || !isConnected}
              className="px-4 py-2 bg-blue-medium text-white rounded-lg hover:bg-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '8px' }}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Obter email do usuário atual
   */
  const getCurrentUserEmail = () => {
    try {
      // Tentar obter do localStorage usando a chave correta
      const sessionData = localStorage.getItem('velohub_user_session') || localStorage.getItem('veloacademy_user_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        return session.user?.email || '';
      }
    } catch (error) {
      console.error('Erro ao obter email do usuário:', error);
    }
    return '';
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
      case 'groups':
        return renderGroupsView();
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
    <div className="h-full flex flex-col" style={{ minHeight: '400px' }}>
      {renderContent()}
    </div>
  );
};

export default VeloChatWidget;

