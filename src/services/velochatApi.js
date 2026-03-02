/**
 * VeloChat API Service - Frontend
 * VERSION: v4.7.2 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v4.7.2:
 * - OTIMIZAÇÃO: Import estático de ensureSessionId ao invés de import dinâmico (melhor performance e consistência)
 * 
 * Mudanças v4.7.1:
 * - CORREÇÃO: getConversations() agora usa Promise.allSettled() para retornar conversas parciais mesmo se uma chamada falhar
 * - MELHORIA: getConversations() garante sessionId antes de fazer chamadas usando ensureSessionId()
 * - MELHORIA: Logs melhorados para diagnóstico quando uma das chamadas falha mas há conversas válidas
 * 
 * Mudanças v4.7.0:
 * - Adicionadas funções editP2PMessage e deleteP2PMessage para editar/excluir mensagens P2P
 * - Adicionadas funções editSalaMessage e deleteSalaMessage para editar/excluir mensagens de salas
 * 
 * Mudanças v4.5.1:
 * - Removidos todos os logs de debug que tentavam conectar em 127.0.0.1:7244 (causavam ERR_CONNECTION_REFUSED)
 * - Mantidos apenas logs de console para debug quando necessário
 * - Simplificado tratamento de erros removendo código de debug desnecessário
 * 
 * Mudanças v4.4.0:
 * - Adicionados logs de debug para investigar erro "failed to fetch"
 * - Logs capturam: URL, headers, erros de fetch, status de resposta, erros CORS
 * 
 * Mudanças v4.3.0:
 * - Removidos logs de debug do endpoint de ingest que causavam erros no console
 * 
 * Mudanças v4.2.0:
 * - Removida função getAttachmentReadUrl (não é mais necessária com arquivos públicos)
 * - Atualizado confirmAttachmentUpload para trabalhar com arquivos públicos
 * - URLs públicas permanentes são retornadas após upload
 * 
 * Mudanças v4.1.0:
 * - Melhorado upload de anexos com logs detalhados e validação completa
 * - Adicionada inferência automática de mediaType quando não fornecido
 * - Melhorado tratamento de erros no upload e solicitação de signed URLs
 * 
 * Mudanças v4.0.0:
 * - Refatorado para usar novos schemas: P2P (chat_mensagens) e Salas (chat_salas + salaMensagens)
 * - Adicionadas funções específicas para P2P e Salas
 * - Separadas APIs de conversas P2P e salas coletivas
 * 
 * Mudanças v3.0.0:
 * - getContacts revertido para usar VeloChat Server /api/contacts conforme arquitetura original
 * - Todas as chamadas de conversas agora usam VeloChat Server exclusivamente
 * - Apenas status de usuário (getChatStatus, updateChatStatus) usa Backend VeloHub
 * 
 * Serviço para comunicação com a API REST do VeloChat Server
 */

import { API_BASE_URL, getVeloChatApiUrl } from '../config/api-config';
import { ensureSessionId } from './auth';

// Usar detecção automática de ambiente ao invés de fallback hardcoded
const VELOCHAT_API_URL = getVeloChatApiUrl();

/**
 * Obter sessionId do localStorage
 */
const getSessionId = () => {
  try {
    return localStorage.getItem('velohub_session_id');
  } catch (error) {
    console.error('Erro ao obter sessionId:', error);
    return null;
  }
};

/**
 * Função genérica para fazer requisições autenticadas
 */
const authenticatedFetch = async (url, options = {}) => {
  const sessionId = getSessionId();
  
  if (!sessionId) {
    console.error('❌ [authenticatedFetch] SessionId não encontrado no localStorage');
    throw new Error('SessionId não encontrado. Faça login novamente.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Session-Id': sessionId,
    ...options.headers,
  };

  const fullUrl = `${VELOCHAT_API_URL}${url}`;

  let response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'omit'
    });
  } catch (fetchError) {
    console.error(`❌ [authenticatedFetch] Erro na requisição fetch:`, {
      url: fullUrl,
      error: fetchError.message,
      name: fetchError.name,
      origin: typeof window !== 'undefined' ? window.location.origin : null,
    });
    throw fetchError;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    // Reduzir verbosidade: apenas logar erros que não sejam 401 (sessão inválida)
    if (response.status !== 401) {
      console.error(`❌ [authenticatedFetch] Erro na resposta:`, {
        url,
        status: response.status,
        error: error.error || error.message
      });
    }
    throw new Error(error.error || `Erro ${response.status}`);
  }

  const result = await response.json();
  return result;
};

// ==================== APIs P2P ====================

/**
 * Obter conversas P2P do usuário
 */
export const getP2PConversations = async () => {
  const data = await authenticatedFetch('/api/p2p/conversations');
  return {
    conversations: data.conversations || []
  };
};

/**
 * Obter mensagens de uma conversa P2P
 */
export const getP2PMessages = async (conversationId) => {
  const data = await authenticatedFetch(`/api/p2p/conversations/${conversationId}/messages`);
  return {
    messages: data.messages || []
  };
};

/**
 * Criar ou obter conversa P2P entre dois usuários
 */
export const createOrGetP2PConversation = async (colaboradorNome2) => {
  const data = await authenticatedFetch('/api/p2p/conversations', {
    method: 'POST',
    body: JSON.stringify({ colaboradorNome2 })
  });
  return data.conversation;
};

/**
 * Enviar mensagem em conversa P2P
 */
export const sendP2PMessage = async (conversationId, mensagem) => {
  const data = await authenticatedFetch(`/api/p2p/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ mensagem })
  });
  return data.message;
};

/**
 * Encerrar conversa P2P para o usuário atual (DEPRECATED - usar deleteP2PConversation)
 * Adiciona colaboradorNome ao array encerradaPor sem deletar a conversa
 * @deprecated Use deleteP2PConversation instead
 */
export const closeP2PConversation = async (conversationId) => {
  // Usar nova rota DELETE ao invés de PUT
  return await deleteP2PConversation(conversationId);
};

// ==================== APIs Salas ====================

/**
 * Obter salas onde usuário está em participantes
 */
export const getSalas = async () => {
  const data = await authenticatedFetch('/api/salas');
  return {
    salas: data.salas || []
  };
};

/**
 * Obter mensagens de uma sala
 */
export const getSalaMessages = async (salaId) => {
  const data = await authenticatedFetch(`/api/sala-mensagens/${salaId}/messages`);
  return {
    messages: data.messages || []
  };
};

/**
 * Criar nova sala
 */
export const createSala = async (salaNome, participantes = [], bloqueioAdm = false) => {
  const data = await authenticatedFetch('/api/salas', {
    method: 'POST',
    body: JSON.stringify({ salaNome, participantes, bloqueioAdm })
  });
  return data.sala;
};

/**
 * Excluir conversa P2P (soft delete)
 */
export const deleteP2PConversation = async (conversationId) => {
  const data = await authenticatedFetch(`/api/conversations/p2p/${conversationId}`, {
    method: 'DELETE'
  });
  return data;
};

/**
 * Excluir sala (soft delete)
 */
export const deleteSalaConversation = async (salaId) => {
  const data = await authenticatedFetch(`/api/conversations/salas/${salaId}`, {
    method: 'DELETE'
  });
  return data;
};

/**
 * Enviar mensagem em uma sala
 */
export const sendSalaMessage = async (salaId, mensagem) => {
  const data = await authenticatedFetch(`/api/sala-mensagens/${salaId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ mensagem })
  });
  return data.message;
};

/**
 * Adicionar participante à sala
 */
export const addParticipantToSala = async (salaId, colaboradorNome) => {
  const data = await authenticatedFetch(`/api/salas/${salaId}/participants`, {
    method: 'PUT',
    body: JSON.stringify({ action: 'add', colaboradorNome })
  });
  return data.sala;
};

/**
 * Remover participante da sala
 */
export const removeParticipantFromSala = async (salaId, colaboradorNome) => {
  const data = await authenticatedFetch(`/api/salas/${salaId}/participants`, {
    method: 'PUT',
    body: JSON.stringify({ action: 'remove', colaboradorNome })
  });
  return data.sala;
};

/**
 * Atualizar nome da sala
 */
export const updateSalaNome = async (salaId, novoNome) => {
  const data = await authenticatedFetch(`/api/salas/${salaId}/nome`, {
    method: 'PUT',
    body: JSON.stringify({ salaNome: novoNome })
  });
  return data.sala;
};

/**
 * Usuário sair da sala
 */
export const leaveSala = async (salaId) => {
  const data = await authenticatedFetch(`/api/salas/${salaId}/leave`, {
    method: 'POST'
  });
  return data.sala;
};

/**
 * Editar mensagem P2P
 */
export const editP2PMessage = async (conversationId, userName, timestamp, novaMensagem) => {
  const data = await authenticatedFetch(`/api/messages/p2p/${conversationId}/edit`, {
    method: 'PUT',
    body: JSON.stringify({ userName, timestamp, mensagem: novaMensagem })
  });
  return data.message;
};

/**
 * Excluir mensagem P2P
 */
export const deleteP2PMessage = async (conversationId, userName, timestamp) => {
  const data = await authenticatedFetch(`/api/messages/p2p/${conversationId}/delete`, {
    method: 'DELETE',
    body: JSON.stringify({ userName, timestamp })
  });
  return data.message;
};

/**
 * Editar mensagem de sala
 */
export const editSalaMessage = async (salaId, userName, timestamp, novaMensagem) => {
  const data = await authenticatedFetch(`/api/messages/salas/${salaId}/edit`, {
    method: 'PUT',
    body: JSON.stringify({ userName, timestamp, mensagem: novaMensagem })
  });
  return data.message;
};

/**
 * Excluir mensagem de sala
 */
export const deleteSalaMessage = async (salaId, userName, timestamp) => {
  const data = await authenticatedFetch(`/api/messages/salas/${salaId}/delete`, {
    method: 'DELETE',
    body: JSON.stringify({ userName, timestamp })
  });
  return data.message;
};

/**
 * Excluir anexo de mensagem P2P (soft delete)
 */
export const deleteP2PAttachment = async (conversationId, userName, timestamp) => {
  const data = await authenticatedFetch(`/api/messages/p2p/${conversationId}/attachment`, {
    method: 'DELETE',
    body: JSON.stringify({ userName, timestamp })
  });
  return data.message;
};

/**
 * Excluir anexo de mensagem de sala (soft delete)
 */
export const deleteSalaAttachment = async (salaId, userName, timestamp) => {
  const data = await authenticatedFetch(`/api/messages/salas/${salaId}/attachment`, {
    method: 'DELETE',
    body: JSON.stringify({ userName, timestamp })
  });
  return data.message;
};

// ==================== APIs de Anexos ====================

/**
 * Solicitar signed URL para upload de anexo
 */
export const getAttachmentUploadUrl = async (fileName, contentType, mediaType) => {
  console.log('🔗 [getAttachmentUploadUrl] Solicitando signed URL:', {
    fileName,
    contentType,
    mediaType
  });

  const sessionId = getSessionId();
  
  if (!sessionId) {
    throw new Error('SessionId não encontrado. Faça login novamente.');
  }

  // Validar mediaType
  if (!mediaType || !['image', 'video', 'file'].includes(mediaType)) {
    console.warn('⚠️ [getAttachmentUploadUrl] mediaType inválido, inferindo do contentType:', mediaType);
    if (contentType?.startsWith('image/')) {
      mediaType = 'image';
    } else if (contentType?.startsWith('video/')) {
      mediaType = 'video';
    } else {
      mediaType = 'file';
    }
    console.log('🔗 [getAttachmentUploadUrl] mediaType inferido:', mediaType);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chat/attachments/get-upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({ fileName, contentType, mediaType })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.error('❌ [getAttachmentUploadUrl] Erro ao obter URL:', error);
      throw new Error(error.error || 'Erro ao obter URL de upload');
    }

    const data = await response.json();
    console.log('✅ [getAttachmentUploadUrl] Signed URL obtida com sucesso:', {
      filePath: data.filePath,
      publicUrl: data.publicUrl,
      hasSignedUrl: !!data.signedUrl
    });

    return data;
  } catch (error) {
    console.error('❌ [getAttachmentUploadUrl] Erro na requisição:', error);
    throw error;
  }
};

/**
 * Fazer upload de anexo para GCS usando signed URL
 */
export const uploadAttachmentToGCS = async (file, signedUrl, contentType) => {
  console.log('📤 [uploadAttachmentToGCS] Iniciando upload:', {
    fileName: file.name,
    fileSize: file.size,
    contentType,
    signedUrlLength: signedUrl?.length
  });

  if (!signedUrl) {
    throw new Error('Signed URL não fornecida');
  }

  if (!file) {
    throw new Error('Arquivo não fornecido');
  }

  const finalContentType = contentType || file.type || 'application/octet-stream';
  const requestHeaders = {
    'Content-Type': finalContentType
  };

  try {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      headers: requestHeaders,
      body: file
    });

    const responseHeaders = Object.fromEntries(response.headers.entries());

    console.log('📤 [uploadAttachmentToGCS] Resposta do upload:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: responseHeaders
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      
      console.error('❌ [uploadAttachmentToGCS] Erro no upload:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 200)
      });
      throw new Error(`Erro no upload: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
    }

    console.log('✅ [uploadAttachmentToGCS] Upload concluído com sucesso');
    return true;
  } catch (error) {
    
    // Detectar erro de CORS
    const isCorsError = error?.message?.includes('CORS') || 
                       error?.message?.includes('cors') || 
                       error?.message?.includes('Failed to fetch') ||
                       error?.name === 'TypeError';
    
    if (isCorsError) {
      const corsError = new Error('Erro de CORS: O bucket GCS precisa ter CORS configurado. Execute: gsutil cors set gcs-cors-config-velochat.json gs://velochat_anexos');
      corsError.isCorsError = true;
      corsError.originalError = error;
      console.error('❌ [uploadAttachmentToGCS] Erro de CORS detectado:', corsError.message);
      throw corsError;
    }
    
    console.error('❌ [uploadAttachmentToGCS] Erro ao fazer upload:', error);
    throw error;
  }
};

/**
 * Confirmar upload e tornar arquivo público no GCS
 */
export const confirmAttachmentUpload = async (filePath) => {
  console.log('🔗 [confirmAttachmentUpload] Confirmando upload:', { filePath });

  const sessionId = getSessionId();
  
  if (!sessionId) {
    throw new Error('SessionId não encontrado. Faça login novamente.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chat/attachments/confirm-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({ filePath })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.error('❌ [confirmAttachmentUpload] Erro ao confirmar upload:', error);
      throw new Error(error.error || 'Erro ao confirmar upload');
    }

    const data = await response.json();
    console.log('✅ [confirmAttachmentUpload] Upload confirmado:', {
      filePath: data.filePath,
      publicUrl: data.publicUrl
    });

    return data;
  } catch (error) {
    console.error('❌ [confirmAttachmentUpload] Erro na requisição:', error);
    throw error;
  }
};

// ==================== APIs Compatibilidade (Legacy) ====================

/**
 * Obter todas as conversas (P2P + Salas onde usuário é participante)
 * Função de compatibilidade que combina P2P e Salas
 */
export const getConversations = async () => {
  try {
    // Tentar garantir sessionId antes de fazer as chamadas
    const sessionId = await ensureSessionId();
    if (!sessionId) {
      console.warn('⚠️ [getConversations] sessionId não disponível, tentando mesmo assim...');
    }
    
    // Usar Promise.allSettled para não falhar completamente se uma chamada falhar
    const [p2pResult, salasResult] = await Promise.allSettled([
      getP2PConversations(),
      getSalas()
    ]);
    
    // Processar resultado P2P
    let p2pConversations = [];
    if (p2pResult.status === 'fulfilled') {
      p2pConversations = (p2pResult.value.conversations || []).map(conv => ({
        ...conv,
        type: 'p2p'
      }));
    } else {
      console.error('❌ [getConversations] Erro ao obter conversas P2P:', p2pResult.reason);
      // Continuar mesmo com erro - pode haver salas válidas
    }
    
    // Processar resultado Salas
    let salaConversations = [];
    if (salasResult.status === 'fulfilled') {
      salaConversations = (salasResult.value.salas || []).map(sala => ({
        conversationId: sala.Id,
        Id: sala.Id,
        type: 'sala',
        salaNome: sala.salaNome,
        name: sala.salaNome,
        participantes: sala.participantes || [],
        createdAt: sala.createdAt,
        updatedAt: sala.updatedAt
      }));
    } else {
      console.error('❌ [getConversations] Erro ao obter salas:', salasResult.reason);
      // Continuar mesmo com erro - pode haver conversas P2P válidas
    }
    
    // Combinar e ordenar por updatedAt
    const allConversations = [...p2pConversations, ...salaConversations].sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });
    
    // Log informativo se alguma chamada falhou mas ainda há conversas
    if ((p2pResult.status === 'rejected' || salasResult.status === 'rejected') && allConversations.length > 0) {
      console.warn(`⚠️ [getConversations] Algumas chamadas falharam mas retornando ${allConversations.length} conversas encontradas`);
    }
    
    return {
      conversations: allConversations
    };
  } catch (error) {
    console.error('❌ [getConversations] Erro geral ao obter conversas:', error);
    return { conversations: [] };
  }
};

/**
 * Obter mensagens de uma conversa (detecta automaticamente se é P2P ou Sala)
 */
export const getMessages = async (conversationId) => {
  // Detectar tipo pela estrutura do ID
  if (conversationId && conversationId.startsWith('p2p_')) {
    return getP2PMessages(conversationId);
  } else {
    return getSalaMessages(conversationId);
  }
};

/**
 * Criar nova conversa (detecta automaticamente se é P2P ou Sala)
 */
export const createConversation = async (conversationData) => {
  if (conversationData.type === 'direct' || conversationData.type === 'p2p') {
    // Criar conversa P2P
    const otherMember = conversationData.members && conversationData.members.length > 0
      ? (typeof conversationData.members[0] === 'string' 
          ? conversationData.members[0] 
          : conversationData.members[0].userName || conversationData.members[0].colaboradorNome)
      : null;
    
    if (!otherMember) {
      throw new Error('É necessário especificar o outro participante para conversa P2P');
    }
    
    const conversation = await createOrGetP2PConversation(otherMember);
    return { conversation };
  } else {
    // Criar sala
    const participantes = conversationData.members 
      ? conversationData.members.map(m => typeof m === 'string' ? m : (m.userName || m.colaboradorNome))
      : [];
    
    const sala = await createSala(conversationData.name || conversationData.salaNome, participantes);
    return {
      conversation: {
        conversationId: sala.Id,
        Id: sala.Id,
        type: 'sala',
        salaNome: sala.salaNome,
        name: sala.salaNome,
        participantes: sala.participantes,
        createdAt: sala.createdAt,
        updatedAt: sala.updatedAt
      }
    };
  }
};

/**
 * Obter lista de contatos
 * Usa VeloChat Server conforme arquitetura original definida
 */
export const getContacts = async () => {
  return authenticatedFetch('/api/contacts');
};

/**
 * Obter status atual do chat do usuário
 * Agora usa endpoint do backend VeloHub ao invés do VeloChat Server
 */
export const getChatStatus = async () => {
  const sessionId = getSessionId();
  
  if (!sessionId) {
    throw new Error('SessionId não encontrado. Faça login novamente.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Session-Id': sessionId,
  };

  // API_BASE_URL já inclui /api no final, então usamos /status
  const response = await fetch(`${API_BASE_URL}/status`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${response.status}`);
  }

  return await response.json();
};

/**
 * Atualizar status do chat do usuário
 * Agora usa endpoint do backend VeloHub ao invés do VeloChat Server
 */
export const updateChatStatus = async (status) => {
  const sessionId = getSessionId();
  
  if (!sessionId) {
    throw new Error('SessionId não encontrado. Faça login novamente.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Session-Id': sessionId,
  };

  // API_BASE_URL já inclui /api no final, então usamos /auth/session/chat-status
  const response = await fetch(`${API_BASE_URL}/auth/session/chat-status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status, sessionId })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${response.status}`);
  }

  const result = await response.json();
  
  return result;
};
