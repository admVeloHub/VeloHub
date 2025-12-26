/**
 * VeloChat API Service - Frontend
 * VERSION: v4.4.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
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
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'velochatApi.js:51',message:'authenticatedFetch entry',data:{url,method:options.method||'GET',hasOptions:!!options},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const sessionId = getSessionId();
  
  console.log(`🔐 [authenticatedFetch] Fazendo requisição para ${url}:`, {
    hasSessionId: !!sessionId,
    sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : null
  });
  
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'velochatApi.js:59',message:'sessionId check',data:{hasSessionId:!!sessionId,sessionIdPrefix:sessionId?sessionId.substring(0,8):null},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  if (!sessionId) {
    console.error('❌ [authenticatedFetch] SessionId não encontrado no localStorage');
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'velochatApi.js:61',message:'sessionId missing error',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw new Error('SessionId não encontrado. Faça login novamente.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Session-Id': sessionId,
    ...options.headers,
  };

  const fullUrl = `${VELOCHAT_API_URL}${url}`;
  
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'velochatApi.js:75',message:'before fetch',data:{fullUrl,method:options.method||'GET',headers:Object.keys(headers),origin:typeof window!=='undefined'?window.location.origin:null},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  console.log(`📤 [authenticatedFetch] Enviando requisição:`, {
    url: fullUrl,
    method: options.method || 'GET',
    hasSessionIdHeader: !!headers['X-Session-Id']
  });

  let response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
    });
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'velochatApi.js:81',message:'fetch success',data:{url:fullUrl,status:response.status,statusText:response.statusText,ok:response.ok,headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  } catch (fetchError) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'velochatApi.js:85',message:'fetch error caught',data:{url:fullUrl,errorName:fetchError.name,errorMessage:fetchError.message,errorStack:fetchError.stack,isCorsError:fetchError.message&&(fetchError.message.includes('CORS')||fetchError.message.includes('Failed to fetch')||fetchError.name==='TypeError')},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error(`❌ [authenticatedFetch] Erro na requisição fetch:`, {
      url: fullUrl,
      error: fetchError.message,
      name: fetchError.name,
      stack: fetchError.stack
    });
    throw fetchError;
  }

  console.log(`📥 [authenticatedFetch] Resposta recebida:`, {
    url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    console.error(`❌ [authenticatedFetch] Erro na resposta:`, {
      url,
      status: response.status,
      error: error.error || error.message
    });
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'velochatApi.js:96',message:'response not ok',data:{url:fullUrl,status:response.status,statusText:response.statusText,error},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    throw new Error(error.error || `Erro ${response.status}`);
  }

  const result = await response.json();
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/2a8deb5a-b094-407b-b92c-d784ff86433f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'velochatApi.js:99',message:'authenticatedFetch success',data:{url,hasResult:!!result},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
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
    const [p2pData, salasData] = await Promise.all([
      getP2PConversations(),
      getSalas()
    ]);
    
    // Combinar conversas P2P e salas
    const p2pConversations = (p2pData.conversations || []).map(conv => ({
      ...conv,
      type: 'p2p'
    }));
    
    const salaConversations = (salasData.salas || []).map(sala => ({
      conversationId: sala.Id,
      Id: sala.Id,
      type: 'sala',
      salaNome: sala.salaNome,
      name: sala.salaNome,
      participantes: sala.participantes || [],
      createdAt: sala.createdAt,
      updatedAt: sala.updatedAt
    }));
    
    // Combinar e ordenar por updatedAt
    const allConversations = [...p2pConversations, ...salaConversations].sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });
    
    return {
      conversations: allConversations
    };
  } catch (error) {
    console.error('Erro ao obter conversas:', error);
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
