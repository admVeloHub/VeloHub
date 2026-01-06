/**
 * Componente de Thread de Comentários do Velonews
 * VERSION: v1.0.2 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.0.2:
 * - Corrigida mensagem de erro que mencionava porta 8090 (agora usa mensagem genérica)
 * 
 * Mudanças v1.0.1:
 * - Melhorado tratamento de erros com mensagens mais específicas
 * - Adicionado tratamento de erro ao carregar avatar no useEffect
 */

import React, { useState, useEffect, useRef } from 'react';
import { veloNewsAPI } from '../services/api';
import { getUserSession } from '../services/auth';
import { getUserAvatar, formatNameWithLastNameInitial } from '../utils/avatarUtils';

const VelonewsCommentThread = ({ newsId, thread = [], onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userAvatars, setUserAvatars] = useState({});
  const commentsEndRef = useRef(null);

  // Inicializar comentários e buscar avatares
  useEffect(() => {
    if (Array.isArray(thread)) {
      setComments(thread);
      
      // Buscar avatar apenas para o usuário atual logado
      const session = getUserSession();
      if (session?.user?.email && session?.user?.name) {
        getUserAvatar(session.user.email, session.user.name).then(avatarData => {
          setUserAvatars(prev => ({
            ...prev,
            [session.user.name]: avatarData
          }));
        }).catch(error => {
          console.error('Erro ao carregar avatar do usuário:', error);
        });
      }
      
      // Para outros usuários, usar inicial do nome (será gerado no renderAvatar)
      const uniqueUsers = [...new Set(thread.map(c => c.userName))];
      uniqueUsers.forEach((userName) => {
        // Se não tiver avatar ainda, criar objeto com inicial
        setUserAvatars(prev => {
          if (!prev[userName]) {
            return {
              ...prev,
              [userName]: {
                url: null,
                initial: userName.charAt(0).toUpperCase(),
                displayName: formatNameWithLastNameInitial(userName)
              }
            };
          }
          return prev;
        });
      });
    }
  }, [thread]);

  // Scroll para o final quando novos comentários são adicionados
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setError('O comentário não pode estar vazio');
      return;
    }

    const session = getUserSession();
    if (!session || !session.user) {
      setError('Você precisa estar logado para comentar');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userName = session.user.name || 'Usuário';
      const result = await veloNewsAPI.addComment(newsId, userName, newComment.trim());

      if (result.success && result.news) {
        // Atualizar lista de comentários
        const updatedComments = result.news.thread || [];
        setComments(updatedComments);
        setNewComment('');

        // Buscar avatar do usuário atual
        if (session.user.email) {
          const avatarData = await getUserAvatar(session.user.email, userName);
          setUserAvatars(prev => ({
            ...prev,
            [userName]: avatarData
          }));
        }

        // Notificar componente pai
        if (onCommentAdded) {
          onCommentAdded(updatedComments);
        }
      } else {
        throw new Error(result.error || 'Erro ao adicionar comentário');
      }
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao adicionar comentário. Tente novamente.';
      
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
      } else if (err.message.includes('404')) {
        errorMessage = 'Endpoint não encontrado. Verifique se o servidor foi reiniciado após as alterações.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAvatar = (userName) => {
    const avatarData = userAvatars[userName];
    
    if (avatarData?.url) {
      return (
        <img
          src={avatarData.url}
          alt={userName}
          className="w-8 h-8 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
          onError={(e) => {
            // Se falhar ao carregar imagem, mostrar inicial
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }

    const initial = avatarData?.initial || userName.charAt(0).toUpperCase();
    return (
      <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-sm font-semibold border-2 border-gray-300 dark:border-gray-600">
        {initial}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Comentários ({comments.length})
        </h3>
      </div>

      {/* Lista de Comentários */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p>Nenhum comentário ainda.</p>
            <p className="text-sm mt-2">Seja o primeiro a comentar!</p>
          </div>
        ) : (
          comments.map((comment, index) => {
            const displayName = formatNameWithLastNameInitial(comment.userName);
            const avatarData = userAvatars[comment.userName];

            return (
              <div key={index} className="flex gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {renderAvatar(comment.userName)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                      {displayName || comment.userName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">
                    {comment.comentario}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Campo de Digitação */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {error && (
          <div className="mb-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-sm rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              setError(null);
            }}
            placeholder="Digite seu comentário..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
            rows="2"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newComment.trim()}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md font-medium hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VelonewsCommentThread;

