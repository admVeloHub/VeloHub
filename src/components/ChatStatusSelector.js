/**
 * ChatStatusSelector - Seletor de Status do Chat
 * VERSION: v1.2.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Componente para selecionar e atualizar o status do chat do usuário
 * (online, offline, ausente)
 * 
 * Mudanças v1.2.0:
 * - Melhorada lógica de verificação de sessionId com função auxiliar
 * - Adicionado retry com timeout se sessionId não estiver disponível
 * - Tratamento de resposta melhorado (aceita resposta mesmo sem success: true)
 * 
 * Mudanças v1.1.0:
 * - Alterado comportamento: agora abre menu de seleção ao invés de toggle direto
 * - Menu dropdown com opções "Online" e "Ausente"
 */

import React, { useState, useEffect, useRef } from 'react';
import { getChatStatus, updateChatStatus } from '../services/velochatApi';
import { ChevronDown } from 'lucide-react';

const ChatStatusSelector = ({ sessionId, onStatusChange }) => {
  const [status, setStatus] = useState('online');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Verificar se sessionId está disponível no localStorage
  const hasSessionId = () => {
    try {
      return !!localStorage.getItem('velohub_session_id');
    } catch (error) {
      return false;
    }
  };

  // Carregar status inicial
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await getChatStatus();
        // Tratar resposta mesmo sem success: true (verificar propriedade status diretamente)
        if (response && response.status) {
          setStatus(response.status);
        } else if (response && response.success && response.status) {
          setStatus(response.status);
        }
      } catch (err) {
        console.error('Erro ao buscar status:', err);
        setError(err.message);
      }
    };

    // Se sessionId foi passado como prop, usar diretamente
    if (sessionId) {
      fetchStatus();
    } else {
      // Caso contrário, verificar se está disponível no localStorage
      if (hasSessionId()) {
        fetchStatus();
      } else {
        // Tentar novamente após um pequeno delay para dar tempo do login ser processado
        const timeoutId = setTimeout(() => {
          if (hasSessionId()) {
            fetchStatus();
          }
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [sessionId]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Handler para mudança de status
  const handleStatusChange = async (newStatus) => {
    if (newStatus === status || loading) {
      setIsMenuOpen(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsMenuOpen(false);

    try {
      const response = await updateChatStatus(newStatus);
      if (response.success) {
        setStatus(newStatus);
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      } else {
        throw new Error(response.error || 'Erro ao atualizar status');
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cores e ícones para cada status
  const statusConfig = {
    online: {
      label: 'Online',
      color: '#10B981', // green-500
      bgColor: '#D1FAE5', // green-100
      dotColor: '#10B981'
    },
    ausente: {
      label: 'Ausente',
      color: '#F59E0B', // amber-500
      bgColor: '#FEF3C7', // amber-100
      dotColor: '#F59E0B'
    },
    offline: {
      label: 'Offline',
      color: '#6B7280', // gray-500
      bgColor: '#F3F4F6', // gray-100
      dotColor: '#6B7280'
    }
  };

  const currentConfig = statusConfig[status] || statusConfig.online;

  // Status disponíveis para seleção (offline é automático, não pode ser selecionado)
  const availableStatuses = ['online', 'ausente'];

  return (
    <div className="relative" ref={menuRef}>
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all hover:opacity-80"
        style={{
          backgroundColor: currentConfig.bgColor,
          border: `1px solid ${currentConfig.color}20`
        }}
        onClick={() => {
          if (!loading) {
            setIsMenuOpen(!isMenuOpen);
          }
        }}
        title={`Status: ${currentConfig.label}. Clique para alterar.`}
      >
        {/* Indicador de status (bolinha) */}
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: currentConfig.dotColor,
            boxShadow: `0 0 4px ${currentConfig.dotColor}80`
          }}
        />
        
        {/* Label do status */}
        <span
          className="text-sm font-medium"
          style={{ color: currentConfig.color }}
        >
          {currentConfig.label}
        </span>

        {/* Ícone de dropdown */}
        <ChevronDown 
          size={14} 
          style={{ 
            color: currentConfig.color,
            transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }} 
        />

        {/* Spinner de loading */}
        {loading && (
          <div
            className="w-3 h-3 border-2 rounded-full animate-spin"
            style={{
              borderColor: `${currentConfig.color}40`,
              borderTopColor: currentConfig.color
            }}
          />
        )}
      </div>

      {/* Menu dropdown */}
      {isMenuOpen && (
        <div
          className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[120px]"
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
        >
          {availableStatuses.map((statusOption) => {
            const optionConfig = statusConfig[statusOption];
            const isSelected = status === statusOption;
            
            return (
              <div
                key={statusOption}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                onClick={() => handleStatusChange(statusOption)}
                style={{
                  backgroundColor: isSelected ? optionConfig.bgColor : 'transparent'
                }}
              >
                {/* Indicador de status (bolinha) */}
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: optionConfig.dotColor,
                    boxShadow: `0 0 4px ${optionConfig.dotColor}80`
                  }}
                />
                
                {/* Label do status */}
                <span
                  className="text-sm font-medium flex-1"
                  style={{ color: optionConfig.color }}
                >
                  {optionConfig.label}
                </span>

                {/* Indicador de seleção */}
                {isSelected && (
                  <span style={{ color: optionConfig.color }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div
          className="absolute top-full left-0 mt-1 px-2 py-1 text-xs rounded bg-red-100 text-red-600 z-50"
          style={{ whiteSpace: 'nowrap' }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default ChatStatusSelector;
