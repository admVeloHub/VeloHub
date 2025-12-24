/**
 * VeloHub V3 - Página de Perfil do Usuário
 * VERSION: v2.4.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.4.0:
 * - Adicionado sidebar direito com widget de chat (recolhido por padrão)
 * - Integrado VeloChatWidget com todas as funcionalidades (Conversas, Contatos, Salas)
 * - Implementado sistema de retração/expansão do sidebar direito
 * 
 * Mudanças v2.3.0:
 * - Implementado upload via signed URLs - upload direto do frontend para GCS
 * - Melhor performance: arquivo não passa pelo backend, apenas signed URL é gerada
 * - Upload mais rápido e eficiente, reduzindo carga no servidor
 * 
 * Mudanças v2.2.0:
 * - Implementado cache no localStorage para dados do perfil (duração: 5 minutos)
 * - Reduzidas requisições de rede - dados são carregados do cache quando disponível
 * - Cache é invalidado automaticamente ao atualizar perfil ou fazer upload de foto
 * 
 * Mudanças v2.1.0:
 * - Atualizado para usar campos corretos do schema MongoDB: colaboradorNome, telefone, userMail, profile_pic
 * - Removido campo senha atual do modal de alteração de senha
 * - Validação em tempo real para habilitar botão salvar apenas quando senhas forem iguais
 * - Prioridade de avatar: SSO picture > profile_pic > avatar padrão
 * 
 * Mudanças v2.0.0:
 * - Recriada completamente com preview de foto antes de salvar
 * - Upload de foto atualiza profile_pic no MongoDB automaticamente
 * - Atualiza sessão e header automaticamente após upload bem-sucedido
 * - Prioridade de exibição: SSO Google > GCS > Avatar padrão
 * - Segue padrões visuais do LAYOUT_GUIDELINES.md
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getUserSession, updateUserInfo } from '../services/auth';
import VeloChatWidget from '../components/VeloChatWidget';
import ChatStatusSelector from '../components/ChatStatusSelector';
import { API_BASE_URL } from '../config/api-config';

const PerfilPage = () => {
  const [userData, setUserData] = useState({
    colaboradorNome: '',
    telefone: '',
    userMail: '',
    profile_pic: '',
    ssoPicture: '' // Foto do SSO Google (separada para prioridade)
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    novaSenha: '',
    confirmarSenha: ''
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  
  // Estados do sidebar direito com chat
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true); // Recolhido por padrão
  const [chatActiveTab, setChatActiveTab] = useState('conversations');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('velochat_sound_enabled') !== 'false';
    } catch {
      return true;
    }
  });
  
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    try {
      localStorage.setItem('velochat_sound_enabled', newState.toString());
    } catch (error) {
      console.error('Erro ao salvar preferência de som:', error);
    }
  };
  
  // Função para calcular grid columns
  const getGridColumns = (rightCollapsed) => {
    if (rightCollapsed) {
      return '1fr 10px';
    } else {
      return 'minmax(0, 1fr) minmax(0, 35%)';
    }
  };
  
  // Função helper para renderizar sidebar direito com chat
  const renderRightSidebarChat = () => {
    if (isRightSidebarCollapsed) {
      return (
        <div 
          style={{
            position: 'relative',
            width: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12px'
          }}
          onClick={() => setIsRightSidebarCollapsed(false)}
        >
          <ChevronLeft 
            size={22} 
            style={{
              color: 'var(--blue-dark)',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--blue-opaque)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--blue-dark)'}
          />
        </div>
      );
    }

    return (
      <aside 
        className="rounded-lg shadow-sm flex flex-col velohub-container" 
        style={{
          borderRadius: '9.6px', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', 
          padding: '19.0px', 
          position: 'relative', 
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '700px',
          maxHeight: '700px',
          overflow: 'hidden',
          transition: 'opacity 0.3s ease, transform 0.3s ease'
        }}
      >
        {/* Botão de retração */}
        <button
          onClick={() => setIsRightSidebarCollapsed(true)}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.querySelector('svg').style.color = 'var(--blue-opaque)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.querySelector('svg').style.color = 'rgba(128, 128, 128, 0.5)';
          }}
        >
          <ChevronRight 
            size={18} 
            style={{
              color: 'rgba(128, 128, 128, 0.5)',
              transition: 'color 0.3s ease'
            }}
          />
        </button>
        
        {/* Widget VeloChat */}
        <div className="flex-1 flex flex-col" style={{ minHeight: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div className="flex items-center mb-4" style={{ gap: '8px', position: 'relative', flexShrink: 0 }}>
            {isSearchExpanded ? (
              <>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar contato..."
                  className="flex-1 px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: 'var(--blue-opaque)',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Poppins, sans-serif',
                    marginLeft: '40px'
                  }}
                  autoFocus
                />
                <button 
                  onClick={() => { setIsSearchExpanded(false); setSearchQuery(''); }}
                  className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                  style={{ color: 'var(--blue-dark)', minWidth: '32px', height: '32px' }}
                  title="Fechar busca"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div style={{ marginLeft: '16px', flexShrink: 0 }}>
                  <ChatStatusSelector 
                    sessionId={localStorage.getItem('velohub_session_id')} 
                    onStatusChange={() => {}}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <h3 className="font-bold text-xl velohub-title" style={{ 
                    color: 'var(--blue-dark)', 
                    margin: 0,
                    textAlign: 'center',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}>
                    Chat
                  </h3>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <button
                    onClick={toggleSound}
                    className="flex items-center justify-center p-1 rounded transition-colors"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title={soundEnabled ? 'Desativar som' : 'Ativar som'}
                  >
                    {soundEnabled ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(128, 128, 128, 0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                      </svg>
                    )}
                  </button>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <button 
                    onClick={() => setIsSearchExpanded(true)}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    style={{ color: 'var(--blue-dark)' }}
                    title="Buscar contato"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Seletor de Abas */}
          <div className="flex border-b mb-2" style={{ borderColor: 'var(--blue-opaque)', flexShrink: 0 }}>
            <button 
              className="flex-1 py-2 text-sm font-medium transition-colors"
              onClick={() => setChatActiveTab('conversations')}
              style={chatActiveTab === 'conversations' ? {
                color: 'var(--blue-dark)',
                borderBottom: '2px solid var(--blue-opaque)'
              } : {
                color: 'var(--cor-texto-secundario)'
              }}
            >
              Conversas
            </button>
            <button 
              className="flex-1 py-2 text-sm font-medium transition-colors"
              onClick={() => setChatActiveTab('contacts')}
              style={chatActiveTab === 'contacts' ? {
                color: 'var(--blue-dark)',
                borderBottom: '2px solid var(--blue-opaque)'
              } : {
                color: 'var(--cor-texto-secundario)'
              }}
            >
              Contatos
            </button>
            <button 
              className="flex-1 py-2 text-sm font-medium transition-colors"
              onClick={() => setChatActiveTab('salas')}
              style={chatActiveTab === 'salas' ? {
                color: 'var(--blue-dark)',
                borderBottom: '2px solid var(--blue-opaque)'
              } : {
                color: 'var(--cor-texto-secundario)'
              }}
            >
              Salas
            </button>
          </div>
              
          {/* Container scrollável */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            {(() => {
              const isProduction = typeof window !== 'undefined' && 
                !window.location.hostname.includes('localhost') && 
                !window.location.hostname.includes('127.0.0.1');
              
              let userName = '';
              try {
                const sessionData = localStorage.getItem('velohub_user_session');
                if (sessionData) {
                  const session = JSON.parse(sessionData);
                  userName = session?.user?.name || '';
                }
              } catch (err) {
                console.error('Erro ao obter nome do usuário:', err);
              }
              
              const isLucasGravina = userName && 
                userName.toLowerCase().includes('lucas') && 
                userName.toLowerCase().includes('gravina');
              
              const shouldShowChat = !isProduction || isLucasGravina;
              
              if (!shouldShowChat) {
                return (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    minHeight: '400px',
                    background: 'transparent',
                    border: '1.5px solid var(--blue-dark)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      zIndex: 10
                    }}>
                      <span style={{
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        fontFamily: 'Poppins, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '1.6px'
                      }}>
                        EM BREVE
                      </span>
                    </div>
                  </div>
                );
              }
              
              return (
                <VeloChatWidget activeTab={chatActiveTab} searchQuery={searchQuery} />
              );
            })()}
          </div>
        </div>
      </aside>
    );
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async (forceRefresh = false) => {
    try {
      setLoading(true);

      const session = getUserSession();
      if (session && session.user) {
        const email = session.user.email;
        const cacheKey = `velohub_profile_cache_${email}`;
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

        // Foto do SSO Google (prioridade máxima)
        const ssoPicture = session.user.picture || '';

        // Inicializar com dados do SSO
        let cachedData = null;

        // Verificar cache no localStorage (se não for refresh forçado)
        if (!forceRefresh) {
          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              const now = Date.now();
              // Se cache é válido (menos de 5 minutos), usar
              if (parsed.timestamp && (now - parsed.timestamp) < CACHE_DURATION) {
                cachedData = parsed.data;
              }
            }
          } catch (error) {
            // Se houver erro ao ler cache, ignorar e buscar do servidor
          }
        }

        if (cachedData) {
          // Usar dados do cache
          setUserData({
            colaboradorNome: cachedData.colaboradorNome || session.user.name || '',
            telefone: cachedData.telefone || '',
            userMail: cachedData.userMail || email,
            profile_pic: cachedData.profile_pic || '',
            ssoPicture: ssoPicture
          });
          setLoading(false);
          return;
        }

        // Se não tem cache válido, buscar do servidor
        setUserData({
          colaboradorNome: session.user.name || '',
          telefone: '',
          userMail: email,
          profile_pic: '',
          ssoPicture: ssoPicture
        });

        // Buscar dados do MongoDB via endpoint
        try {
          const response = await fetch(`${API_BASE_URL}/auth/profile?email=${encodeURIComponent(email)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.profile) {
              const profileData = {
                colaboradorNome: data.profile.colaboradorNome || session.user.name || '',
                telefone: data.profile.telefone || '',
                userMail: data.profile.userMail || email,
                profile_pic: data.profile.profile_pic || ''
              };

              // Salvar no cache
              try {
                localStorage.setItem(cacheKey, JSON.stringify({
                  data: profileData,
                  timestamp: Date.now()
                }));
              } catch (error) {
                // Se não conseguir salvar no localStorage, continuar normalmente
              }

              setUserData(prev => ({
                ...prev,
                ...profileData
              }));
            }
          }
        } catch (error) {
          console.log('Dados adicionais não disponíveis:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar dados do perfil' });
    } finally {
      setLoading(false);
    }
  };

  // Função para invalidar cache do perfil
  const invalidateProfileCache = () => {
    const session = getUserSession();
    if (session?.user?.email) {
      const cacheKey = `velohub_profile_cache_${session.user.email}`;
      localStorage.removeItem(cacheKey);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB' });
        return;
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor, selecione uma imagem válida' });
        return;
      }

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setPhotoFile(file);
        setMessage({ type: '', text: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      setMessage({ type: 'error', text: 'Selecione uma foto primeiro' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const session = getUserSession();
      if (!session || !session.user) {
        setMessage({ type: 'error', text: 'Sessão inválida. Faça login novamente.' });
        setUploading(false);
        return;
      }

      const email = session.user.email;
      const nomeCompleto = userData.colaboradorNome || 'user profile';
      const nomeParts = nomeCompleto.split(' ');
      const nome = nomeParts[0] || 'user';
      const sobrenome = nomeParts.slice(1).join(' ') || 'profile';
      const timestamp = Date.now();
      const fileExtension = photoFile.name.split('.').pop() || 'jpg';
      const fileName = `${nome}.${sobrenome}-${timestamp}.${fileExtension}`;

      // 1. Solicitar signed URL do backend
      const urlResponse = await fetch(
        `${API_BASE_URL}/auth/profile/get-upload-url?email=${encodeURIComponent(email)}&fileName=${encodeURIComponent(fileName)}&contentType=${encodeURIComponent(photoFile.type)}`
      );

      const urlData = await urlResponse.json();
      if (!urlData.success) {
        setMessage({ type: 'error', text: urlData.error || 'Erro ao obter URL de upload' });
        setUploading(false);
        return;
      }

      // 2. Fazer upload direto para GCS usando signed URL
      const uploadResponse = await fetch(urlData.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': photoFile.type
        },
        body: photoFile // Enviar arquivo diretamente, não base64
      });

      if (!uploadResponse.ok) {
        throw new Error(`Erro no upload: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      // 3. Confirmar upload no backend para atualizar MongoDB
      const confirmResponse = await fetch(`${API_BASE_URL}/auth/profile/confirm-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          filePath: urlData.filePath
        })
      });

      const confirmData = await confirmResponse.json();
      if (confirmData.success) {
        // Invalidar cache para forçar reload
        invalidateProfileCache();

        // Atualizar profile_pic com URL do GCS (substitui SSO quando usuário faz upload)
        setUserData(prev => ({
          ...prev,
          profile_pic: confirmData.url,
          ssoPicture: '' // Limpar SSO picture quando usuário faz upload próprio
        }));

        // Limpar preview e arquivo
        setPhotoPreview(null);
        setPhotoFile(null);

        // Atualizar sessão local com profile_pic (prioridade sobre SSO após upload)
        const updatedSession = {
          ...session,
          user: {
            ...session.user,
            picture: confirmData.url
          }
        };
        localStorage.setItem('velohub_user_session', JSON.stringify(updatedSession));

        // Atualizar header via evento
        updateUserInfo(updatedSession.user);
        setMessage({ type: 'success', text: 'Foto de perfil enviada com sucesso!' });
      } else {
        setMessage({ type: 'error', text: confirmData.error || 'Erro ao confirmar upload' });
      }

      setUploading(false);
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      setMessage({ type: 'error', text: 'Erro ao processar imagem. Tente novamente.' });
      setUploading(false);
    }
  };

  const handleCancelPhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const session = getUserSession();
      if (!session || !session.user) {
        setMessage({ type: 'error', text: 'Sessão inválida. Faça login novamente.' });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          colaboradorNome: userData.colaboradorNome,
          telefone: userData.telefone
        })
      });

      const data = await response.json();
      if (data.success) {
        // Invalidar cache para forçar reload
        invalidateProfileCache();
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });

        // Atualizar sessão local
        const updatedSession = {
          ...session,
          user: {
            ...session.user,
            name: userData.colaboradorNome,
            picture: userData.profile_pic || userData.ssoPicture || session.user.picture
          }
        };
        localStorage.setItem('velohub_user_session', JSON.stringify(updatedSession));

        // Recarregar dados do perfil (com cache invalidado)
        await loadUserData(true);

        // Atualizar header
        updateUserInfo(updatedSession.user);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao atualizar perfil' });
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar perfil. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordData.novaSenha !== passwordData.confirmarSenha) {
        setMessage({ type: 'error', text: 'As senhas não coincidem' });
        return;
      }

      if (passwordData.novaSenha.length < 6) {
        setMessage({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres' });
        return;
      }

      setSaving(true);
      setMessage({ type: '', text: '' });

      const session = getUserSession();
      if (!session || !session.user) {
        setMessage({ type: 'error', text: 'Sessão inválida. Faça login novamente.' });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          novaSenha: passwordData.novaSenha
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setShowPasswordModal(false);
        setPasswordData({
          novaSenha: '',
          confirmarSenha: ''
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao alterar senha' });
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setMessage({ type: 'error', text: 'Erro ao alterar senha. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  // Validação para habilitar botão salvar senha
  const canSavePassword = passwordData.novaSenha === passwordData.confirmarSenha &&
                          passwordData.novaSenha.length > 0;

  // Avatar padrão SVG
  const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjY0IiBmaWxsPSIjMDA3YmZmIi8+CjxzdmcgeD0iMzIiIHk9IjMyIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMzIgMTZDNDAuODM2IDE2IDQ4IDIzLjE2NCA0OCAzMkM0OCA0MC44MzYgNDAuODM2IDQ4IDMyIDQ4QzIzLjE2NCA0OCAxNiA0MC44MzYgMTYgMzJDMTYgMjMuMTY0IDIzLjE2NCAxNiAzMiAxNlpNMzIgNDhDNDAuODM2IDQ4IDQ4IDUwLjE2NCA0OCA1OEM0OCA2Ni44MzYgNDAuODM2IDc0IDMyIDc0QzIzLjE2NCA3NCAxNiA2Ni44MzYgMTYgNThDMTYgNTAuMTY0IDIzLjE2NCA0OCAzMiA0OFoiLz4KPC9zdmc+Cjwvc3ZnPgo=';

  if (loading) {
    return (
      <div className="w-full py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4">
      <div 
        className="grid gap-4" 
        style={{
          gridTemplateColumns: getGridColumns(isRightSidebarCollapsed),
          transition: 'grid-template-columns 0.3s ease',
          maxWidth: '100%'
        }}
      >
        {/* Conteúdo principal */}
        <div className="max-w-2xl mx-auto" style={{ minWidth: 0 }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold velohub-title" style={{ color: 'var(--blue-dark)', fontFamily: 'Poppins, sans-serif' }}>
            Meu Perfil
          </h1>
        </div>

        {/* Card Principal */}
        <div className="velohub-container" style={{
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          padding: '24px'
        }}>
          {/* Mensagem de feedback */}
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <p className={`text-sm ${
                message.type === 'success'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Foto de Perfil */}
          <div className="mb-6 text-center">
            <div className="inline-block relative">
              <img
                src={photoPreview || userData.ssoPicture || userData.profile_pic || defaultAvatar}
                alt="Foto de perfil"
                className="w-32 h-32 rounded-full object-cover border-2"
                style={{ borderColor: 'var(--blue-opaque)' }}
                onError={(e) => {
                  e.target.src = defaultAvatar;
                }}
              />
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                title="Alterar foto"
              >
                <i className="fas fa-camera"></i>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            {/* Preview com botões de ação */}
            {photoPreview && (
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={handlePhotoUpload}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--blue-medium)',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--blue-dark)')}
                  onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--blue-medium)')}
                >
                  {uploading ? 'Enviando...' : 'Salvar Foto'}
                </button>
                <button
                  onClick={handleCancelPhoto}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg font-semibold border transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--cor-container)',
                    color: 'var(--cor-texto-principal)',
                    borderColor: 'var(--cor-borda)',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--cor-texto-principal)', fontFamily: 'Poppins, sans-serif' }}>
                Nome *
              </label>
              <input
                type="text"
                name="colaboradorNome"
                value={userData.colaboradorNome}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--cor-container)',
                  color: 'var(--cor-texto-principal)',
                  borderColor: 'var(--cor-borda)',
                  fontFamily: 'Poppins, sans-serif'
                }}
                required
              />
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--cor-texto-principal)', fontFamily: 'Poppins, sans-serif' }}>
                E-Mail *
              </label>
              <input
                type="email"
                name="userMail"
                value={userData.userMail}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700"
                style={{
                  color: 'var(--cor-texto-secundario)',
                  borderColor: 'var(--cor-borda)',
                  fontFamily: 'Poppins, sans-serif'
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                O e-mail não pode ser alterado
              </p>
            </div>

            {/* Cel/Whatsapp */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--cor-texto-principal)', fontFamily: 'Poppins, sans-serif' }}>
                Cel/Whatsapp
              </label>
              <input
                type="tel"
                name="telefone"
                value={userData.telefone}
                onChange={handleInputChange}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--cor-container)',
                  color: 'var(--cor-texto-principal)',
                  borderColor: 'var(--cor-borda)',
                  fontFamily: 'Poppins, sans-serif'
                }}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--blue-medium)',
                  fontFamily: 'Poppins, sans-serif'
                }}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--blue-dark)')}
                onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--blue-medium)')}
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-6 py-3 rounded-lg font-semibold border transition-all"
                style={{
                  backgroundColor: 'var(--cor-container)',
                  color: 'var(--cor-texto-principal)',
                  borderColor: 'var(--cor-borda)',
                  fontFamily: 'Poppins, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--blue-opaque)';
                  e.target.style.color = 'var(--white)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--cor-container)';
                  e.target.style.color = 'var(--cor-texto-principal)';
                }}
              >
                Alterar Senha
              </button>
            </div>
          </div>
        </div>
        </div>
        
        {/* Sidebar direito com chat */}
        {renderRightSidebarChat()}
      </div>

      {/* Modal de Alterar Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="velohub-container" style={{
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            padding: '24px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--blue-dark)', fontFamily: 'Poppins, sans-serif' }}>
              Alterar Senha
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--cor-texto-principal)', fontFamily: 'Poppins, sans-serif' }}>
                  Nova Senha *
                </label>
                <input
                  type="password"
                  value={passwordData.novaSenha}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, novaSenha: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: 'var(--cor-container)',
                    color: 'var(--cor-texto-principal)',
                    borderColor: 'var(--cor-borda)',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--cor-texto-principal)', fontFamily: 'Poppins, sans-serif' }}>
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmarSenha}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: 'var(--cor-container)',
                    color: 'var(--cor-texto-principal)',
                    borderColor: passwordData.novaSenha !== passwordData.confirmarSenha && passwordData.confirmarSenha.length > 0 ? 'var(--red-500)' : 'var(--cor-borda)',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                />
                {passwordData.novaSenha !== passwordData.confirmarSenha && passwordData.confirmarSenha.length > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    As senhas não coincidem
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleChangePassword}
                disabled={saving || !canSavePassword}
                className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--blue-medium)',
                  fontFamily: 'Poppins, sans-serif'
                }}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--blue-dark)')}
                onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--blue-medium)')}
              >
                {saving ? 'Alterando...' : 'Salvar'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ novaSenha: '', confirmarSenha: '' });
                }}
                className="px-6 py-3 rounded-lg font-semibold border transition-all"
                style={{
                  backgroundColor: 'var(--cor-container)',
                  color: 'var(--cor-texto-principal)',
                  borderColor: 'var(--cor-borda)',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilPage;
