/**
 * VeloHub V3 - Main Application Component
 * VERSION: v2.15.1 | DATE: 2026-03-25 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.15.1:
 * - Header Req_Prod: bubble de notificação igual ao Apoio (vermelho #ff0000)
 * 
 * Mudanças v2.15.0:
 * - Header Req_Prod: badge quando há msg Produtos não lida (fora do módulo); polling + notificação do navegador com preview (dedup sessionStorage)
 * 
 * Mudanças v2.14.0:
 * - Widget Serviços (Home): lista do demonstrador atualizada (8 itens: Antecipação, Cr. Pessoal, Pgto Antec, Prestamista, Seguro Cel, Perda de Renda, Cupons, Seguro Pessoal)
 * 
 * Mudanças v2.13.0:
 * - Header: botões Reclamações e Sociais exibidos apenas para usuários com acesso
 * - Adicionado módulo Sociais com SociaisPage e SociaisAccessGuard
 * 
 * Mudanças v2.12.2:
 * - Renomeado módulo 'Bacen & N2' para 'Reclamações' no cabeçalho e no switch case
 * 
 * Mudanças v2.12.1:
 * - Corrigido dimensionamento dinâmico do container Velonews: removida altura fixa, implementado flexbox com scroll interno
 * - Botão "Ver Notícias Anteriores" agora sempre visível e posicionado fora da área de scroll
 * - Adicionada remoção de URLs do endpoint da API no processContentHtml para ocultar URLs de imagens do texto
 * - URLs de imagens do bucket e endpoint da API agora são removidas de markdown, tags <img>, links <a> e texto solto
 * 
 * Mudanças v2.12.0:
 * - Adicionado controle de acesso ao módulo Ouvidoria via OuvidoriaAccessGuard
 * - Verificação de acessos.ouvidoria === true antes de renderizar módulo
 * 
 * Mudanças v2.11.0:
 * - Adicionado módulo Ouvidoria ao header e renderContent
 * - Integração do módulo BACEN como novo módulo do Velohub
 * 
 * Mudanças v2.10.2:
 * - Corrigido: Adicionados estados chatRefreshTrigger, isRefreshing e função handleChatRefresh no componente ProcessosPage
 * - Resolvido erro ReferenceError: chatRefreshTrigger is not defined na página VeloBot
 * 
 * Mudanças v2.10.1:
 * - Corrigido: LoadingPage não é mais exibida após logout (verifica sessão válida antes de mostrar)
 * - LoadingPage só aparece quando há sessão válida, evitando áudio desnecessário após logout
 * 
 * Mudanças v2.10.0:
 * - Adicionadas rotas públicas para Termos de Uso e Política de Privacidade (/termos e /privacidade)
 * - Páginas públicas acessíveis sem autenticação
 * 
 * Mudanças v2.9.0:
 * - CRÍTICO: Corrigido disparo generalizado de notificações sonoras
 * - Adicionadas validações rigorosas antes de tocar áudio (verificar dados, ID, timestamp)
 * - Adicionada proteção contra reprocessamento de mensagens duplicadas
 * - Mensagens muito antigas (> 30s) são ignoradas para evitar eventos de reconexão
 * - Refs de mensagens processadas são limpos ao reconectar para evitar bloqueios incorretos
 * 
 * Mudanças v2.8.1:
 * - Movido botão de comentários para o lado direito do header do modal de notícias
 * 
 * Mudanças v2.8.0:
 * - Adicionada funcionalidade de comentários no modal de visualização de notícias
 * - Modal agora possui aba expansível à direita para exibir e adicionar comentários
 * - Integrado componente VelonewsCommentThread para gerenciar thread de comentários
 * 
 * Mudanças v2.7.0:
 * 
 * Mudanças v2.7.0:
 * - Adicionada LoadingPage intermediária após login bem-sucedido
 * - LoadingPage exibe imagem de fundo, toca áudio de abertura e mostra mensagens sequenciais
 * - Executa operações de inicialização (sessão, contatos, notícias) durante período do áudio
 * - Fluxo: Login → LoadingPage → (handleLoginSuccess → inicializa sessão + chat) → HomePage
 * 
 * Mudanças v2.6.6:
 * - Modais velonews (crítico automático e clique manual) agora centralizados verticalmente na tela mantendo dimensões
 * - Ambos os modais renderizados via React Portal com z-index máximo (2147483647) para ficarem acima de tudo
 * - Altura dos modais ajustada para calc(100vh - 160px) permitindo centralização com margens adequadas
 * - Scroll automático no conteúdo quando necessário
 * 
 * Mudanças v2.6.5:
 * - Corrigido dimensionamento do modal velonews: overlay cobre toda tela com z-index máximo (2147483647)
 * - Modal agora renderizado via React Portal diretamente no document.body para garantir que fique acima de TUDO
 * - Estilos aplicados inline no JSX para garantir máxima especificidade e evitar conflitos CSS
 * 
 * Mudanças v2.6.4:
 * - Removido bypass de Lucas Gravina - todos os usuários têm acesso ao chat
 * 
 * Mudanças v2.6.3:
 * - Removidos logs de debug após correção bem-sucedida
 * 
 * Mudanças v2.6.2:
 * - Listener global agora entra em todas as conversas ativas para receber mensagens
 * - Adicionada atualização periódica (30s) para entrar em novas conversas
 * - Listener global funciona independentemente do estado do widget (sidebar oculta/expandida)
 * - Adicionado listener para conversation_created para entrar automaticamente em novas conversas
 * - Adicionado listener para last_message_updated como fallback
 * 
 * Mudanças v2.6.1:
 * - Melhoradas funções de áudio globais (volume, preload, tratamento de erros)
 * - Melhorada detecção de mensagens próprias (comparação normalizada)
 * - Notificações de áudio agora funcionam corretamente mesmo quando sidebar está recolhida
 * - Suporte a mensagens de chamada de atenção via campo 'content' além de 'mensagem'
 * 
 * Mudanças v2.6.0:
 * - Adicionado sidebar direito com widget de chat em todos os módulos (ProcessosPage, ArtigosPage, ApoioPage)
 * - Criada função helper reutilizável renderRightSidebarChat para evitar duplicação de código
 * - Sidebar direito inicia recolhido por padrão em módulos não-Home
 * - Sidebar direito mantém estado expandido por padrão na HomePage
 * 
 * Mudanças v2.5.5:
 * - Corrigido footer: removido caractere estranho (┬® → ©) e padronizado texto
 * - Footer agora segue padrão: "© {ano} VeloHub. Todos os direitos reservados."
 * - Removida versão hardcoded do footer
 * 
 * Mudanças v2.5.4:
 * - Corrigido ReferenceError: sortedVeloNews is not defined na função checkCriticalNews
 * 
 * Mudanças v2.5.3:
 * - Adicionado polling para verificar mudan├ºas na sess├úo do usu├írio
 * - Adicionado listener para mudan├ºas no localStorage
 * - Melhorados logs de debug para rastrear carregamento da foto
 * - Garantido que avatar sempre seja exibido (padr├úo quando n├úo houver foto)
 * 
 * Mudan├ºas v2.5.2:
 * - Corrigido carregamento e atualiza├º├úo da foto do usu├írio ap├│s login SSO
 * - Adicionado tratamento de erro na imagem (fallback para avatar padr├úo)
 * - Adicionados logs para debug do carregamento de dados do usu├írio
 * - Garantido que evento user-info-updated seja disparado ap├│s login SSO
 * 
 * Mudan├ºas v2.5.1:
 * - Corrigido renderiza├º├úo da foto do usu├írio no header: agora sempre exibe avatar (padr├úo quando n├úo houver foto)
 * 
 * Mudan├ºas v2.5.0:
 * - Corrigido carregamento da foto do usu├írio no header ap├│s login SSO
 * - Header agora usa estado React para gerenciar foto e nome do usu├írio
 * - Integrado com evento customizado 'user-info-updated' para atualiza├º├úo em tempo real
 * 
 * Mudan├ºas v2.4.0:
 * - Restaurado ChatStatusSelector no header do chat
 * - Componente permite alterar status (online, offline, ausente)
 * 
 * Mudan├ºas v2.3.0:
 * - Ajustada altura fixa da sidebar direita igual ao container central (calc(100vh - 160px))
 * - Container do chat agora ├® scroll├ível mantendo header e abas fixos
 * - Sidebar esquerda serve como refer├¬ncia de altura para o chat
 * 
 * Mudan├ºas v2.2.9:
 * - Restaurado VeloChatWidget.js do Git (commit aafa99d)
 * - Criado velochatApi.js com fun├º├Áes necess├írias (getConversations, getMessages, createConversation, getContacts)
 * - Removida importa├º├úo do ChatStatusSelector (componente n├úo existe)
 * - Substitu├¡do placeholder "Chat em desenvolvimento" pelo componente VeloChatWidget funcional
 * 
 * Mudan├ºas v2.2.8:
 * - Removidos logs de debug desnecess├írios do console (processContentHtml, getImageUrl, getYouTubeThumbnail, renderiza├º├úo de imagens/v├¡deos)
 * - Console agora exibe apenas logs essenciais, sem polui├º├úo de logs de todos os artigos do hist├│rico
 * 
 * Mudan├ºas v2.2.7:
 * - Corre├º├úo parsing de formata├º├úo Artigos: aplicado formatResponseText antes de processContentHtml
 * - Markdown (**texto**, emojis, quebras de linha) agora ├® convertido corretamente para HTML nos artigos
 * - Corre├º├úo aplicada em: modal de artigo da HomePage
 * 
 * Mudan├ºas v2.2.6:
 * - Corre├º├úo parsing de formata├º├úo VeloNews: aplicado formatResponseText antes de processContentHtml
 * - Markdown (**texto**, emojis, quebras de linha) agora ├® convertido corretamente para HTML
 * - Corre├º├Áes aplicadas em: modal cr├¡tico, widget Recentes, modal de not├¡cia
 * 
 * Mudan├ºas v2.2.5:
 * - Adicionado bloqueio do VeloChatWidget em produ├º├úo (exceto para Lucas Gravina)
 * - Verifica├º├úo de ambiente (prod vs dev) para controle de acesso ao chat
 * - Bloqueio visual "EM BREVE" similar ao widget do pontomais
 * - Importa├º├úo do VeloChatWidget comentada at├® arquivo ser adicionado ao reposit├│rio
 * 
 * Mudan├ºas v2.2.4:
 * - Atualizada lista de servi├ºos online: adicionados Clube Velotax e Divida Zero
 * - Renomeados servi├ºos: "Seguro Cred." ÔåÆ "Prestamista", "Seguro Cel." ÔåÆ "Seguro Celular"
 * - Layout do grid de servi├ºos alterado de 2x4 para 3x3 para acomodar 9 servi├ºos
 * 
 * Mudan├ºas v2.2.3:
 * - Removida linha de divis├úo abaixo do t├¡tulo "Chat"
 * - Adicionado ├¡cone de lupa na mesma linha do t├¡tulo
 * - Implementado campo de busca expans├¡vel que move o t├¡tulo para a esquerda
 * - Busca de contatos integrada com filtro em tempo real
 * 
 * Mudan├ºas v2.2.2:
 * - Padronizado padding das sidebars para 19.0px
 * - Removido marginRight da sidebar direita
 * - Adicionado seletor de abas (Conversas, Contatos, Grupos) no Chat
 * - Implementada funcionalidade de Contatos com indicadores de status
 * 
 * Mudan├ºas v2.2.1:
 * - Removida ├írea clic├ível complexa das bordas
 * - Adicionados bot├Áes com ├¡cones de seta (ChevronLeft/ChevronRight)
 * - Bot├Áes posicionados no canto superior interno de cada sidebar
 * - Estilo: cinza transl├║cido que muda para azul opaco no hover
 * - Implementa├º├úo mais simples e intuitiva
 * 
 * Mudan├ºas v2.1.99:
 * - Corrigido layout quebrava ao retrair sidebar esquerda
 * - Implementada renderiza├º├úo condicional das sidebars (sem wrappers com width 0)
 * - Adicionada transi├º├úo suave no grid-template-columns
 * - Velonews e sidebar direita agora deslizam suavemente durante retra├º├úo
 * - Usado minmax() no grid para melhor responsividade
 * 
 * Mudan├ºas v2.1.98:
 * - Implementado sistema de retra├º├úo de sidebars com bordas clic├íveis
 * - Efeito hover nas bordas igual aos cards do Apoio
 * - Velonews desliza para esquerda quando sidebar esquerda retrai
 * - Sidebar direita expande automaticamente quando esquerda retrai
 * - Faixas clic├íveis de 3px nas bordas internas e externas
 * 
 * Mudan├ºas v2.1.97:
 * - Integrado VeloChatWidget na sidebar direita
 * - Sistema de chat interno VeloChat implementado
 * 
 * Mudan├ºas v2.1.96:
 * - Removida implementa├º├úo do RocketChat (substitu├¡do por VeloChat interno)
 * - Layout ajustado para 2 colunas (sidebar esquerda + conte├║do principal)
 * 
 * Mudan├ºas v2.1.95:
 * - Modais atualizados com z-index 9999 para ficarem acima do header
 * 
 * Mudan├ºas v2.1.93:
 * - Suporte completo para YouTube Shorts: detec├º├úo, convers├úo e exibi├º├úo com propor├º├úo 9:16
 * 
 * Mudan├ºas v2.1.92:
 * - Modificado getYouTubeThumbnail e getYouTubeEmbedUrl para aceitar URLs como strings
 * - Criada fun├º├úo convertYouTubeUrlToEmbed para converter URLs do YouTube para formato embed
 * - Atualizada renderiza├º├úo de v├¡deos nos modais para processar strings de URL
 * - Adicionados logs de debug para rastreamento de v├¡deos YouTube
 * 
 * Mudan├ºas v2.1.90:
 * - Corrigida codifica├º├úo de URLs para imagens com espa├ºos e caracteres especiais nos nomes de arquivos
 * - Fun├º├Áes getImageUrl e getAllImages agora codificam corretamente cada parte do caminho
 * 
 * Mudan├ºas v2.1.89:
 * - Adicionadas fun├º├Áes auxiliares para processamento de m├¡dia (getImageUrl, getYouTubeThumbnail, getYouTubeEmbedUrl, getAllImages)
 * - Implementada exibi├º├úo de imagens e v├¡deos YouTube na lista de not├¡cias VeloNews
 * - Expandido modal de not├¡cias para exibir todas as imagens e v├¡deos YouTube
 * - Adicionado modal de imagem expandida para visualiza├º├úo em tamanho completo
 * - Implementada exibi├º├úo de imagens na lista de artigos
 * - Expandido modal de artigos para exibir todas as imagens e v├¡deos YouTube
 * - Adicionado suporte para m├║ltiplos formatos de imagens (caminhos relativos, URLs, base64)
 * - Mantida compatibilidade com formato antigo (images) e novo (media.images)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Home, FileText, MessageSquare, LifeBuoy, Book, Search, User, Sun, Moon, FilePlus, Bot, GraduationCap, Map, Puzzle, PlusSquare, Send, ThumbsUp, ThumbsDown, BookOpen, X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { mainAPI, veloNewsAPI, articlesAPI, faqAPI } from './services/api';
import { checkAuthenticationState, updateUserInfo, getUserSession, stopHeartbeat, logout, isSessionValid } from './services/auth';
import { API_BASE_URL, getVeloChatWsUrl } from './config/api-config';
import { io } from 'socket.io-client';
import NewsHistoryModal from './components/NewsHistoryModal';
import LoginPage from './components/LoginPage';
import LoadingPage from './components/LoadingPage';
import Chatbot from './components/Chatbot';
import SupportModal from './components/SupportModal';
// VeloChatWidget - arquivo restaurado do Git
import VeloChatWidget from './components/VeloChatWidget';
import ChatStatusSelector from './components/ChatStatusSelector';
import EscalacoesPage from './pages/EscalacoesPage';
import OuvidoriaPage from './pages/OuvidoriaPage';
import OuvidoriaAccessGuard from './components/Ouvidoria/OuvidoriaAccessGuard';
import SociaisPage from './pages/SociaisPage';
import SociaisAccessGuard from './components/Sociais/SociaisAccessGuard';
import PerfilPage from './pages/PerfilPage';
import TermosPage from './pages/TermosPage';
import PrivacidadePage from './pages/PrivacidadePage';
import VelonewsCommentThread from './components/VelonewsCommentThread';
import PilulasModal from './components/PilulasModal';
import { formatArticleContent, formatPreviewText, formatResponseText } from './utils/textFormatter';
import { solicitacoesAPI, errosBugsAPI } from './services/escalacoesApi';
import {
  STORAGE_PROD_READ_SOLICITACOES,
  STORAGE_PROD_READ_ERROS_BUGS,
  listUnreadProdutosDocs,
  produtosUnreadNotifySig,
  hasProdutosNotificationBeenSent,
  markProdutosNotificationSent,
} from './utils/escalacoesModalHelpers';

// Sistema de gerenciamento de estado para modal cr├¡tico
const CriticalModalManager = {
  // Chaves para localStorage
  ACKNOWLEDGED_KEY: 'velohub-critical-acknowledged',
  REMIND_LATER_KEY: 'velohub-remind-later',
  SHOW_REMIND_BUTTON_KEY: 'velohub-show-remind-button',
  LAST_CRITICAL_KEY: 'velohub-last-critical-news',
  
  // Verificar se o usu├írio j├í foi ciente de uma not├¡cia espec├¡fica
  isAcknowledged: (newsTitle = null) => {
    if (newsTitle) {
      // Se tem t├¡tulo espec├¡fico, verificar por t├¡tulo
      const acknowledgedNews = localStorage.getItem(CriticalModalManager.ACKNOWLEDGED_KEY);
      return acknowledgedNews === newsTitle;
    }
    // Fallback para compatibilidade
    return localStorage.getItem(CriticalModalManager.ACKNOWLEDGED_KEY) === 'true';
  },
  
  // Marcar como ciente de uma not├¡cia espec├¡fica
  setAcknowledged: (newsTitle = null) => {
    if (newsTitle) {
      // Salvar o t├¡tulo da not├¡cia como chave de reconhecimento
      localStorage.setItem(CriticalModalManager.ACKNOWLEDGED_KEY, newsTitle);
    } else {
      // Fallback para compatibilidade
      localStorage.setItem(CriticalModalManager.ACKNOWLEDGED_KEY, 'true');
    }
  },
  
  // Verificar se deve lembrar mais tarde
  shouldRemindLater: () => {
    const remindLater = localStorage.getItem(CriticalModalManager.REMIND_LATER_KEY);
    if (!remindLater) return false;
    
    const remindTime = parseInt(remindLater);
    const now = Date.now();
    const threeMinutes = 3 * 60 * 1000; // 3 minutos em millisegundos
    
    return now >= remindTime;
  },
  
  // Definir lembrete para 3 minutos
  setRemindLater: () => {
    const threeMinutesFromNow = Date.now() + (3 * 60 * 1000);
    localStorage.setItem(CriticalModalManager.REMIND_LATER_KEY, threeMinutesFromNow.toString());
    // Marcar que o bot├úo "Me lembre mais tarde" j├í foi usado
    localStorage.setItem(CriticalModalManager.SHOW_REMIND_BUTTON_KEY, 'false');
  },
  
  // Limpar lembrete
  clearRemindLater: () => {
    localStorage.removeItem(CriticalModalManager.REMIND_LATER_KEY);
  },
  
  // Verificar se deve mostrar o bot├úo "Me lembre mais tarde"
  shouldShowRemindButton: () => {
    return localStorage.getItem(CriticalModalManager.SHOW_REMIND_BUTTON_KEY) !== 'false';
  },
  
  // Verificar se deve mostrar o modal
  shouldShowModal: (criticalNews) => {
    if (!criticalNews) return false;
    
    // Se j├í foi ciente desta not├¡cia espec├¡fica, n├úo mostrar
    if (CriticalModalManager.isAcknowledged(criticalNews.title)) {
      return false;
    }
    
    // Se tem lembrete ativo, mostrar
    if (CriticalModalManager.shouldRemindLater()) {
      CriticalModalManager.clearRemindLater(); // Limpar ap├│s verificar
      return true;
    }
    
    // Se n├úo tem lembrete, mostrar normalmente
    return true;
  },
  
  // Gerenciar a ├║ltima not├¡cia cr├¡tica vista
  getLastCriticalNews: () => {
    return localStorage.getItem(CriticalModalManager.LAST_CRITICAL_KEY);
  },
  
  setLastCriticalNews: (criticalKey) => {
    localStorage.setItem(CriticalModalManager.LAST_CRITICAL_KEY, criticalKey);
  },
  
  // Verificar se ├® uma not├¡cia cr├¡tica nova
  isNewCriticalNews: (criticalKey) => {
    const lastCritical = CriticalModalManager.getLastCriticalNews();
    return lastCritical !== criticalKey;
  },
  
  // Resetar o estado para uma nova not├¡cia cr├¡tica
  resetForNewCriticalNews: () => {
    // RESETAR COMPLETAMENTE O ESTADO
    localStorage.removeItem(CriticalModalManager.ACKNOWLEDGED_KEY);
    localStorage.removeItem(CriticalModalManager.REMIND_LATER_KEY);
    localStorage.setItem(CriticalModalManager.SHOW_REMIND_BUTTON_KEY, 'true');
  },
  
  // Fun├º├úo de debug para limpar manualmente o estado (├║til para testes)
  debugClearState: () => {
    console.log('🔧 Limpando estado manualmente para debug...');
    localStorage.removeItem(CriticalModalManager.ACKNOWLEDGED_KEY);
    localStorage.removeItem(CriticalModalManager.REMIND_LATER_KEY);
    localStorage.setItem(CriticalModalManager.SHOW_REMIND_BUTTON_KEY, 'true');
    console.log('✅ Estado limpo manualmente');
  }
};

// ===== FUN├ç├òES AUXILIARES PARA L├ôGICA DE URG├èNCIA =====

/**
 * Verifica se not├¡cia cr├¡tica passou das 12 horas
 * @param {string|Date} createdAt - Data de cria├º├úo da not├¡cia
 * @returns {boolean} true se passou de 12 horas
 */
const isExpired12Hours = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= 12;
};

// Fun├º├úo global para debug (dispon├¡vel no console do navegador)
window.debugCriticalModal = () => {
  console.log('🐛 Debug do Modal Crítico');
  console.log('📊 Estado atual:', {
    acknowledged: localStorage.getItem(CriticalModalManager.ACKNOWLEDGED_KEY),
    remindLater: localStorage.getItem(CriticalModalManager.REMIND_LATER_KEY),
    showRemindButton: localStorage.getItem(CriticalModalManager.SHOW_REMIND_BUTTON_KEY),
    lastCriticalNews: CriticalModalManager.getLastCriticalNews()
  });
  console.log('🔧 Para limpar o estado, execute: CriticalModalManager.debugClearState()');
  console.log('✅ Para forçar nova notícia, execute: CriticalModalManager.setLastCriticalNews("")'  );
};

// Componente do Footer
const Footer = ({ isDarkMode }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="velohub-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <p className="footer-text">
              © {currentYear} VeloHub. Todos os direitos reservados.
            </p>
          </div>
          <div className="footer-section">
            <p className="footer-text">
              v6.0.0
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

/** Lista normalizada de GET escalacoes (solicitações / erros-bugs) */
const pickEscalacoesApiList = (res) => {
  if (!res) return [];
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
};

const getEscalacoesAgentNameForHeader = () => {
  try {
    const sessionData = localStorage.getItem('velohub_user_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (session?.user?.name) return String(session.user.name).trim();
    }
  } catch {
    /* ignore */
  }
  return String(localStorage.getItem('velotax_agent') || '').trim();
};

/**
 * Notificações do navegador: msg Produtos não lida (fora do Req_Prod em foco ou aba do browser em segundo plano).
 * @param {Array<{ id: string, tipo: string, cpf: string, preview: string, lastAt: number }>} items
 * @param {'sol'|'erros'} source
 */
const notifyProdutosUnreadForHeader = (items, source, activePage) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (activePage === 'Req_Prod' && !document.hidden) return;
  for (const it of items) {
    const sig = produtosUnreadNotifySig(source, it.id, it.lastAt);
    if (hasProdutosNotificationBeenSent(sig)) continue;
    try {
      new Notification('VeloHub — Time Produtos', {
        body: `${it.tipo} — CPF ${it.cpf}\n${it.preview || 'Nova mensagem'}`,
      });
      markProdutosNotificationSent(sig);
    } catch (err) {
      console.error('[Header] Notificação Produtos:', err);
    }
  }
};

// Componente do Cabe├ºalho
const Header = ({ activePage, setActivePage, isDarkMode, toggleDarkMode }) => {
  const baseNavItems = ['Home', 'VeloBot', 'Artigos', 'Apoio', 'Req_Prod', 'Reclamações', 'Sociais', 'VeloAcademy'];
  const [moduleAccess, setModuleAccess] = useState({ ouvidoria: false, sociais: false });
  const [unreadTicketsCount, setUnreadTicketsCount] = useState(0);
  const [reqProdUnreadCount, setReqProdUnreadCount] = useState(0);
  const [userName, setUserName] = useState('Usu├írio VeloHub');
  const [userPicture, setUserPicture] = useState(null);

  // Filtrar navItems com base no acesso do usuário
  const navItems = baseNavItems.filter(item => {
    if (item === 'Reclamações') return moduleAccess.ouvidoria;
    if (item === 'Sociais') return moduleAccess.sociais;
    return true;
  });

  // Buscar acessos aos módulos restritos (ouvidoria, sociais)
  useEffect(() => {
    const fetchModuleAccess = async () => {
      try {
        const session = getUserSession();
        const email = session?.user?.email;
        if (!email) {
          return;
        }
        const sessionId = localStorage.getItem('velohub_session_id');
        const headers = {
          'Content-Type': 'application/json',
          ...(sessionId && { 'x-session-id': sessionId }),
          ...(email && { 'x-user-email': email }),
        };
        const [ouvidoriaRes, sociaisRes] = await Promise.all([
          fetch(`${API_BASE_URL}/auth/check-module-access?email=${encodeURIComponent(email)}&module=ouvidoria${sessionId ? `&sessionId=${sessionId}` : ''}`, { headers }),
          fetch(`${API_BASE_URL}/auth/check-module-access?email=${encodeURIComponent(email)}&module=sociais${sessionId ? `&sessionId=${sessionId}` : ''}`, { headers }),
        ]);
        const [ouvidoriaData, sociaisData] = await Promise.all([
          ouvidoriaRes.json(),
          sociaisRes.json(),
        ]);
        setModuleAccess({
          ouvidoria: ouvidoriaData.success && ouvidoriaData.hasAccess === true,
          sociais: sociaisData.success && sociaisData.hasAccess === true,
        });
      } catch (error) {
        console.error('Erro ao verificar acesso aos módulos:', error);
      }
    };
    fetchModuleAccess();
  }, []);

  // Função para buscar contagem de tickets não visualizados
  const fetchUnreadTicketsCount = async () => {
    try {
      const session = getUserSession();
      if (!session?.user?.email) {
        setUnreadTicketsCount(0);
        return;
      }

      // Buscar tickets não visualizados do servidor
      const response = await fetch(`${API_BASE_URL}/support/tickets/unread-count?userEmail=${encodeURIComponent(session.user.email)}`);
      const data = await response.json();
      
      if (data.success) {
        // Obter objeto de tickets visualizados do localStorage (estrutura: { "TKC-000001": "2025-01-30T10:00:00.000Z" })
        const viewedTicketsRaw = localStorage.getItem('velohub-viewed-tickets');
        let viewedTickets = {};
        
        // Migração: se for array antigo, converter para objeto
        if (viewedTicketsRaw) {
          try {
            const parsed = JSON.parse(viewedTicketsRaw);
            if (Array.isArray(parsed)) {
              // Migrar array antigo para objeto (usar timestamp atual como fallback)
              viewedTickets = {};
              parsed.forEach(ticketId => {
                viewedTickets[ticketId] = new Date().toISOString();
              });
              // Salvar estrutura nova
              localStorage.setItem('velohub-viewed-tickets', JSON.stringify(viewedTickets));
            } else {
              viewedTickets = parsed;
            }
          } catch (e) {
            console.error('Erro ao parsear viewedTickets:', e);
            viewedTickets = {};
          }
        }
        
        // Filtrar tickets que têm novas mensagens após a última visualização
        const unviewedTickets = data.tickets.filter(ticket => {
          const lastViewedTimestamp = viewedTickets[ticket._id];
          
          // Se nunca foi visualizado, considerar como não visualizado
          if (!lastViewedTimestamp) {
            return true;
          }
          
          // Se não tem lastMessageTimestamp, considerar como visualizado (ticket antigo)
          if (!ticket.lastMessageTimestamp) {
            return false;
          }
          
          // Comparar timestamps: se última mensagem é mais recente que última visualização, há novas mensagens
          const lastMessageDate = new Date(ticket.lastMessageTimestamp);
          const lastViewedDate = new Date(lastViewedTimestamp);
          
          return lastMessageDate > lastViewedDate;
        });
        
        setUnreadTicketsCount(unviewedTickets.length);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de tickets não visualizados:', error);
    }
  };

  // Listener global de WebSocket para áudios de notificação (executa mesmo quando widget não está visível)
  useEffect(() => {
    // Usar detecção automática de ambiente ao invés de fallback hardcoded
    const VELOCHAT_WS_URL = getVeloChatWsUrl();
    
    const getSessionId = () => {
      try {
        return localStorage.getItem('velohub_session_id');
      } catch (error) {
        console.error('Erro ao obter sessionId:', error);
        return null;
      }
    };

    const sessionId = getSessionId();
    if (!sessionId) {
      return; // Não conectar se não houver sessionId
    }

    // Funções de áudio globais (melhoradas para garantir reprodução)
    const playNotificationSound = () => {
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
              console.log('🔊 [Global Audio Listener] Áudio de notificação reproduzido com sucesso');
            }).catch(error => {
              console.warn('❌ [Global Audio Listener] Erro ao reproduzir som de notificação:', error);
            });
          }
        }
      } catch (error) {
        console.warn('❌ [Global Audio Listener] Erro ao reproduzir som de notificação:', error);
      }
    };

    const playCallerSignSound = () => {
      try {
        // Este áudio sempre executa, ignorando status de som
        const audio = new Audio('/caller sign.mp3');
        // Configurar volume e garantir reprodução
        audio.volume = 0.8;
        audio.preload = 'auto';
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('🔊 [Global Audio Listener] Áudio de chamada de atenção reproduzido com sucesso');
          }).catch(error => {
            console.warn('❌ [Global Audio Listener] Erro ao reproduzir som de chamada:', error);
          });
        }
      } catch (error) {
        console.warn('❌ [Global Audio Listener] Erro ao reproduzir som de chamada:', error);
      }
    };

    // Obter nome do usuário atual (usando mesma lógica do VeloChatWidget)
    const getCurrentUserName = () => {
      try {
        // Tentar obter do localStorage usando a chave correta
        const sessionData = localStorage.getItem('velohub_user_session') || 
                           localStorage.getItem('veloacademy_user_session') || 
                           localStorage.getItem('velohub_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          const name = session.user?.name || session.colaboradorNome || session?.user?.email || '';
          // Normalizar: trim para remover espaços extras
          return name.trim();
        }
        // Fallback para getUserSession
        const session = getUserSession();
        const name = session?.user?.name || '';
        return name.trim();
      } catch (error) {
        console.error('❌ [Global Audio Listener] Erro ao obter nome do usuário:', error);
        return '';
      }
    };

    // Conectar ao WebSocket apenas para escutar mensagens e executar áudios
    const socket = io(VELOCHAT_WS_URL, {
      query: { sessionId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      timeout: 20000
    });

    // Armazenar lista de conversas do usuário para validação
    const userConversationsRef = { list: [] };
    
    // Função para entrar em todas as conversas ativas do usuário
    const joinAllConversations = async () => {
      try {
        // Importar API dinamicamente para evitar dependência circular
        const { getConversations } = await import('./services/velochatApi');
        const data = await getConversations();
        const conversations = data.conversations || [];
        
        // Atualizar lista de conversas do usuário
        userConversationsRef.list = conversations.map(conv => conv.conversationId || conv.Id).filter(Boolean);
        
        // Entrar em todas as conversas para receber mensagens
        conversations.forEach(conv => {
          const conversationId = conv.conversationId || conv.Id;
          if (conversationId) {
            socket.emit('join_conversation', { conversationId });
          }
        });
      } catch (error) {
        console.error('❌ [Global Audio Listener] Erro ao entrar em conversas:', error);
      }
    };

    socket.on('connect', () => {
      // WebSocket conectado para áudios globais
      
      // CRÍTICO: Limpar refs de mensagens processadas ao reconectar
      // Isso evita que eventos antigos sejam ignorados incorretamente após reconexão
      if (lastProcessedMessageRef) {
        lastProcessedMessageRef.key = null;
        lastProcessedMessageRef.timestamp = 0;
      }
      if (lastProcessedSalaMessageRef) {
        lastProcessedSalaMessageRef.key = null;
        lastProcessedSalaMessageRef.timestamp = 0;
      }
      
      // Entrar em todas as conversas quando conectar
      joinAllConversations();
      
      // Atualizar lista de conversas periodicamente (a cada 30 segundos) para entrar em novas conversas
      const updateInterval = setInterval(() => {
        if (socket.connected) {
          joinAllConversations();
        } else {
          clearInterval(updateInterval);
        }
      }, 30000);
      
      // Limpar intervalo quando desconectar
      socket.on('disconnect', () => {
        clearInterval(updateInterval);
      });
    });
    
    // Listener para nova conversa criada - entrar automaticamente
    socket.on('conversation_created', (data) => {
      const conversationId = data.conversation?.conversationId || data.conversation?.Id;
      if (conversationId && socket.connected) {
        socket.emit('join_conversation', { conversationId });
        // Adicionar à lista de conversas do usuário
        if (!userConversationsRef.list.includes(conversationId)) {
          userConversationsRef.list.push(conversationId);
        }
        // Entrou na nova conversa para receber mensagens
      }
    });

    socket.on('connect_error', (error) => {
      // Reduzir verbosidade: apenas logar erros que não sejam relacionados a sessão inválida
      if (!error.message || !error.message.includes('Sessão inválida')) {
        console.error('❌ [Global Audio Listener] Erro ao conectar:', error.message);
      }
    });

    // Refs para rastrear últimas mensagens processadas (evita reprocessar eventos duplicados)
    // Usa userName + timestamp como identificador único (mais confiável que ID)
    const lastProcessedMessageRef = { key: null, timestamp: 0 };
    const lastProcessedSalaMessageRef = { key: null, timestamp: 0 };
    
    // Listener para mensagens P2P
    socket.on('p2p_message_received', (data) => {
      // CRÍTICO: Validar se dados da mensagem existem
      if (!data || !data.message) {
        console.warn('⚠️ [Global Audio Listener] Evento p2p_message_received sem dados válidos, ignorando');
        return;
      }
      
      // CRÍTICO: Verificar se a conversa pertence ao usuário atual
      const conversationId = data.conversationId;
      if (conversationId && userConversationsRef.list.length > 0) {
        const isUserConversation = userConversationsRef.list.includes(conversationId);
        if (!isUserConversation) {
          console.warn('⚠️ [Global Audio Listener] Mensagem de conversa que não pertence ao usuário, ignorando:', conversationId);
          return;
        }
      }
      
      // Normalizar timestamp para comparação (suporta Date, número, ISO string)
      let messageTimestamp = data.message.timestamp || data.message.createdAt;
      if (!messageTimestamp) {
        console.warn('⚠️ [Global Audio Listener] Mensagem sem timestamp válido, ignorando');
        return;
      }
      
      // Converter timestamp para número se necessário
      if (messageTimestamp instanceof Date) {
        messageTimestamp = messageTimestamp.getTime();
      } else if (typeof messageTimestamp === 'string') {
        const date = new Date(messageTimestamp);
        messageTimestamp = isNaN(date.getTime()) ? Number(messageTimestamp) : date.getTime();
      } else {
        messageTimestamp = Number(messageTimestamp);
      }
      
      if (isNaN(messageTimestamp) || messageTimestamp <= 0) {
        console.warn('⚠️ [Global Audio Listener] Timestamp inválido, ignorando:', messageTimestamp);
        return;
      }
      
      // Criar chave única usando userName + timestamp (mais confiável que ID)
      const messageUserName = data.message?.userName || '';
      const messageKey = `${messageUserName}_${messageTimestamp}`;
      
      // CRÍTICO: Evitar reprocessar a mesma mensagem (eventos duplicados ou reconexão)
      if (lastProcessedMessageRef.key === messageKey) {
        console.log('⏸️ [Global Audio Listener] Mensagem já processada, ignorando duplicata:', messageKey);
        return;
      }
      
      // CRÍTICO: Ignorar mensagens muito antigas (> 60 segundos) - podem ser de reconexão
      const now = Date.now();
      const messageAge = now - messageTimestamp;
      if (messageAge > 60000) {
        console.log('⏸️ [Global Audio Listener] Mensagem muito antiga, ignorando:', {
          messageAge: `${Math.round(messageAge / 1000)}s`,
          messageKey
        });
        return;
      }
      
      const currentUserName = getCurrentUserName();
      
      // Comparação mais robusta: normalizar espaços e case
      const normalizedCurrentUserName = String(currentUserName || '').trim().toLowerCase();
      const normalizedMessageUserName = String(messageUserName || '').trim().toLowerCase();
      const isFromCurrentUser = normalizedCurrentUserName && normalizedMessageUserName && 
                                normalizedCurrentUserName === normalizedMessageUserName;
      const isCallerSign = data.message?.mensagem === '[att-caller-sign]' || 
                           data.message?.content === '[att-caller-sign]';
      
      console.log('🔊 [Global Audio Listener] Mensagem P2P recebida:', {
        conversationId,
        messageKey,
        currentUserName: normalizedCurrentUserName,
        messageUserName: normalizedMessageUserName,
        isFromCurrentUser,
        isCallerSign,
        messageAge: `${Math.round(messageAge / 1000)}s`,
        mensagem: data.message?.mensagem?.substring(0, 50)
      });
      
      if (!isFromCurrentUser) {
        // Marcar mensagem como processada ANTES de tocar som
        lastProcessedMessageRef.key = messageKey;
        lastProcessedMessageRef.timestamp = messageTimestamp;
        
        if (isCallerSign) {
          // Áudio de chamada sempre executa, ignorando status de som
          console.log('🔊 [Global Audio Listener] Executando áudio de chamada de atenção');
          playCallerSignSound();
        } else {
          // Áudio normal respeita status de som
          console.log('🔊 [Global Audio Listener] Executando áudio de notificação normal');
          playNotificationSound();
        }
      } else {
        console.log('🔊 [Global Audio Listener] Mensagem do próprio usuário, ignorando áudio');
      }
    });

    // Listener para mensagens de Sala
    socket.on('sala_message_received', (data) => {
      // CRÍTICO: Validar se dados da mensagem existem
      if (!data || !data.message) {
        console.warn('⚠️ [Global Audio Listener] Evento sala_message_received sem dados válidos, ignorando');
        return;
      }
      
      // CRÍTICO: Verificar se a sala pertence ao usuário atual
      const salaId = data.salaId;
      if (salaId && userConversationsRef.list.length > 0) {
        const isUserConversation = userConversationsRef.list.includes(salaId);
        if (!isUserConversation) {
          console.warn('⚠️ [Global Audio Listener] Mensagem de sala que não pertence ao usuário, ignorando:', salaId);
          return;
        }
      }
      
      // Normalizar timestamp para comparação (suporta Date, número, ISO string)
      let messageTimestamp = data.message.timestamp || data.message.createdAt;
      if (!messageTimestamp) {
        console.warn('⚠️ [Global Audio Listener] Mensagem de sala sem timestamp válido, ignorando');
        return;
      }
      
      // Converter timestamp para número se necessário
      if (messageTimestamp instanceof Date) {
        messageTimestamp = messageTimestamp.getTime();
      } else if (typeof messageTimestamp === 'string') {
        const date = new Date(messageTimestamp);
        messageTimestamp = isNaN(date.getTime()) ? Number(messageTimestamp) : date.getTime();
      } else {
        messageTimestamp = Number(messageTimestamp);
      }
      
      if (isNaN(messageTimestamp) || messageTimestamp <= 0) {
        console.warn('⚠️ [Global Audio Listener] Timestamp de sala inválido, ignorando:', messageTimestamp);
        return;
      }
      
      // Criar chave única usando userName + timestamp (mais confiável que ID)
      const messageUserName = data.message?.userName || '';
      const messageKey = `${messageUserName}_${messageTimestamp}`;
      
      // CRÍTICO: Evitar reprocessar a mesma mensagem (eventos duplicados ou reconexão)
      if (lastProcessedSalaMessageRef.key === messageKey) {
        console.log('⏸️ [Global Audio Listener] Mensagem de sala já processada, ignorando duplicata:', messageKey);
        return;
      }
      
      // CRÍTICO: Ignorar mensagens muito antigas (> 60 segundos) - podem ser de reconexão
      const now = Date.now();
      const messageAge = now - messageTimestamp;
      if (messageAge > 60000) {
        console.log('⏸️ [Global Audio Listener] Mensagem de sala muito antiga, ignorando:', {
          messageAge: `${Math.round(messageAge / 1000)}s`,
          messageKey
        });
        return;
      }
      
      const currentUserName = getCurrentUserName();
      
      // Comparação mais robusta: normalizar espaços e case
      const normalizedCurrentUserName = String(currentUserName || '').trim().toLowerCase();
      const normalizedMessageUserName = String(messageUserName || '').trim().toLowerCase();
      const isFromCurrentUser = normalizedCurrentUserName && normalizedMessageUserName && 
                                normalizedCurrentUserName === normalizedMessageUserName;
      const isCallerSign = data.message?.mensagem === '[att-caller-sign]' || 
                           data.message?.content === '[att-caller-sign]';
      
      console.log('🔊 [Global Audio Listener] Mensagem de Sala recebida:', {
        salaId,
        messageKey,
        currentUserName: normalizedCurrentUserName,
        messageUserName: normalizedMessageUserName,
        isFromCurrentUser,
        isCallerSign,
        messageAge: `${Math.round(messageAge / 1000)}s`,
        mensagem: data.message?.mensagem?.substring(0, 50)
      });
      
      if (!isFromCurrentUser) {
        // Marcar mensagem como processada ANTES de tocar som
        lastProcessedSalaMessageRef.key = messageKey;
        lastProcessedSalaMessageRef.timestamp = messageTimestamp;
        
        if (isCallerSign) {
          // Áudio de chamada sempre executa, ignorando status de som
          console.log('🔊 [Global Audio Listener] Executando áudio de chamada de atenção');
          playCallerSignSound();
        } else {
          // Áudio normal respeita status de som
          console.log('🔊 [Global Audio Listener] Executando áudio de notificação normal');
          playNotificationSound();
        }
      } else {
        console.log('🔊 [Global Audio Listener] Mensagem do próprio usuário, ignorando áudio');
      }
    });

    // Listener para last_message_updated (evento global emitido pelo servidor)
    // Este evento é emitido para TODOS os sockets, não apenas para quem está na conversa
    socket.on('last_message_updated', (data) => {
      // Este evento é global, então sempre recebemos mesmo sem estar na conversa
      // Mas só reproduzir áudio se realmente for uma mensagem nova (não apenas atualização)
      // Vamos usar este evento como fallback quando não recebemos p2p_message_received/sala_message_received
      const currentUserName = getCurrentUserName();
      const messageUserName = data.lastMessage?.userName || '';
      const normalizedCurrentUserName = String(currentUserName || '').trim().toLowerCase();
      const normalizedMessageUserName = String(messageUserName || '').trim().toLowerCase();
      const isFromCurrentUser = normalizedCurrentUserName && normalizedMessageUserName && 
                                normalizedCurrentUserName === normalizedMessageUserName;
      
      // Não reproduzir áudio aqui, pois este evento é apenas para atualização de UI
      // O áudio deve ser reproduzido apenas quando recebemos p2p_message_received ou sala_message_received
      console.log('🔊 [Global Audio Listener] Last message updated (não reproduzindo áudio aqui):', {
        conversationId: data.conversationId,
        isFromCurrentUser
      });
    });

    // Cleanup
    return () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    };
  }, []); // Executar apenas uma vez ao montar o componente

  // Buscar dados do usu├írio da sess├úo
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const session = getUserSession();
        if (session?.user) {
          let userName = session.user.name || 'Usu├írio VeloHub';
          let userPicture = session.user.picture || null;
          
          // Se n├úo tem foto na sess├úo, tentar buscar do backend (pode ter sido atualizada)
          if (!userPicture && session.user.email) {
            try {
              const email = session.user.email;
              const cacheKey = `velohub_validate_access_${email}`;
              const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
              
              let cachedResult = null;
              
              // Verificar cache
              try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                  const parsed = JSON.parse(cached);
                  const now = Date.now();
                  // Se cache ├® v├ílido (menos de 5 minutos), usar
                  if (parsed.timestamp && (now - parsed.timestamp) < CACHE_DURATION) {
                    cachedResult = parsed.data;
                  }
                }
              } catch (error) {
                // Se houver erro ao ler cache, continuar com requisi├º├úo
              }
              
              let result;
              if (cachedResult) {
                result = cachedResult;
              } else {
                const response = await fetch(`${API_BASE_URL}/auth/validate-access`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: email })
                });
                result = await response.json();
                
                // Salvar no cache
                try {
                  localStorage.setItem(cacheKey, JSON.stringify({
                    data: result,
                    timestamp: Date.now()
                  }));
                } catch (error) {
                  // Se n├úo conseguir salvar no localStorage, continuar normalmente
                }
              }
              
              if (result.success && result.user?.picture) {
                userPicture = result.user.picture;
                // Atualizar sess├úo com foto do backend
                const updatedSession = {
                  ...session,
                  user: { ...session.user, picture: userPicture }
                };
                localStorage.setItem('velohub_user_session', JSON.stringify(updatedSession));
              }
            } catch (error) {
              // Silenciar erro - n├úo cr├¡tico
            }
          }
          
          setUserName(userName);
          setUserPicture(userPicture);
        } else {
          // Fallback para localStorage (compatibilidade)
          const storedName = localStorage.getItem('userName');
          const storedPicture = localStorage.getItem('userPicture');
          if (storedName) setUserName(storedName);
          if (storedPicture) setUserPicture(storedPicture);
        }
      } catch (error) {
        console.error('❌ [Header] Erro ao carregar dados do usuário:', error);
      }
    };

    // Carregar dados imediatamente
    loadUserData();

    // Escutar mudan├ºas na sess├úo (quando updateUserInfo ├® chamado)
    const handleUserInfoUpdate = (event) => {
      const userData = event.detail;
      if (userData) {
        const userName = userData.name || 'Usu├írio VeloHub';
        const userPicture = userData.picture || null;
        setUserName(userName);
        setUserPicture(userPicture);
      } else {
        loadUserData();
      }
    };

    // Escutar mudan├ºas no localStorage (para detectar quando sess├úo ├® salva)
    const handleStorageChange = (e) => {
      if (e.key === 'velohub_user_session' || e.key === null) {
        setTimeout(loadUserData, 100);
      }
    };

    // Criar evento customizado para atualizar dados do usu├írio
    window.addEventListener('user-info-updated', handleUserInfoUpdate);
    
    // Escutar mudan├ºas no localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Polling para verificar mudan├ºas na sess├úo (fallback) - reduzido para evitar logs excessivos
    const initialSession = getUserSession();
    let lastSessionHash = JSON.stringify(initialSession || {});
    const intervalId = setInterval(() => {
      const currentSession = getUserSession();
      const currentHash = JSON.stringify(currentSession || {});
      // S├│ recarregar se houver mudan├ºa real
      if (currentHash !== lastSessionHash) {
        lastSessionHash = currentHash;
        loadUserData();
      }
    }, 5000); // Aumentado para 5 segundos para reduzir polling

    return () => {
      window.removeEventListener('user-info-updated', handleUserInfoUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  // Buscar contagem quando componente monta e quando p├ígina muda para Apoio
  useEffect(() => {
    fetchUnreadTicketsCount();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUnreadTicketsCount, 30000);
    
    // Escutar evento de tickets visualizados
    const handleTicketsViewed = () => {
      fetchUnreadTicketsCount();
    };
    
    window.addEventListener('tickets-viewed', handleTicketsViewed);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('tickets-viewed', handleTicketsViewed);
    };
  }, [activePage]);

  const fetchReqProdUnreadBadge = useCallback(async () => {
    try {
      const agent = getEscalacoesAgentNameForHeader();
      const [solRes, errosRes] = await Promise.all([
        agent ? solicitacoesAPI.getByColaborador(agent) : solicitacoesAPI.getAll(),
        agent ? errosBugsAPI.getByColaborador(agent) : errosBugsAPI.getAll(),
      ]);
      const solList = pickEscalacoesApiList(solRes);
      const errosList = pickEscalacoesApiList(errosRes);
      const unreadSol = listUnreadProdutosDocs(solList, STORAGE_PROD_READ_SOLICITACOES);
      const unreadEr = listUnreadProdutosDocs(errosList, STORAGE_PROD_READ_ERROS_BUGS);
      setReqProdUnreadCount(unreadSol.length + unreadEr.length);
      notifyProdutosUnreadForHeader(unreadSol, 'sol', activePage);
      notifyProdutosUnreadForHeader(unreadEr, 'erros', activePage);
    } catch (err) {
      console.error('[Header] Req_Prod unread:', err);
    }
  }, [activePage]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        Notification.requestPermission().catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchReqProdUnreadBadge();
    const t = setInterval(fetchReqProdUnreadBadge, 90 * 1000);
    return () => clearInterval(t);
  }, [fetchReqProdUnreadBadge]);

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) {
        fetchReqProdUnreadBadge();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [fetchReqProdUnreadBadge]);

  // Quando usu├írio clica em Apoio, marcar todos os tickets como visualizados
  const handleNavClick = (item) => {
    console.log('Clicou em:', item); // Debug
    
    if (item === 'VeloAcademy') {
      console.log('Redirecionando para VeloAcademy...'); // Debug
      window.open('https://veloacademy.vercel.app', '_blank');
      return; // N├úo muda a p├ígina ativa para VeloAcademy
    }
    
    // Se clicou em Apoio, marcar tickets como visualizados
    if (item === 'Apoio') {
      markTicketsAsViewed();
    }
    
    console.log('Mudando para página:', item); // Debug
    setActivePage(item);
  };

  // Fun├º├úo para marcar tickets como visualizados
  const markTicketsAsViewed = async () => {
    try {
      const session = getUserSession();
      if (!session?.user?.email) return;

      // Buscar tickets n├úo visualizados
      const response = await fetch(`${API_BASE_URL}/support/tickets/unread-count?userEmail=${encodeURIComponent(session.user.email)}`);
      const data = await response.json();
      
      if (data.success && data.tickets.length > 0) {
        // Obter lista atual de tickets visualizados
        const viewedTickets = JSON.parse(localStorage.getItem('velohub-viewed-tickets') || '[]');
        
        // Adicionar IDs dos tickets n├úo visualizados ├á lista
        const ticketIds = data.tickets.map(ticket => ticket._id);
        const updatedViewedTickets = [...new Set([...viewedTickets, ...ticketIds])];
        
        // Salvar no localStorage
        localStorage.setItem('velohub-viewed-tickets', JSON.stringify(updatedViewedTickets));
        
        // Atualizar contagem
        setUnreadTicketsCount(0);
      }
    } catch (error) {
      console.error('Erro ao marcar tickets como visualizados:', error);
    }
  };

  return (
    <header className="velohub-header">
      <div className="header-container">
        <div className="velohub-logo" id="logo-container">
          <img 
            id="logo-image" 
            className="logo-image" 
            src={isDarkMode ? "/VeloHubLogo darktheme.png" : "/VeloHubLogo 2.png"} 
            alt="VeloHub Logo" 
          />
        </div>
        
        <nav className="nav-menu">
          {navItems.map(item => (
            <button
              key={item}
              onClick={() => handleNavClick(item)}
              className={`nav-link ${activePage === item ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
              {item}
              {item === 'Apoio' && unreadTicketsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    backgroundColor: '#ff0000',
                    color: 'white',
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  title={`${unreadTicketsCount} ticket(s) n├úo visualizado(s)`}
                >
                  {unreadTicketsCount > 9 ? '9+' : unreadTicketsCount}
                </span>
              )}
              {item === 'Req_Prod' && activePage !== 'Req_Prod' && reqProdUnreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    backgroundColor: '#ff0000',
                    color: 'white',
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                  title={`${reqProdUnreadCount} mensagem(ns) do time Produtos não lida(s) em Solicitações ou Erros/Bugs`}
                >
                  {reqProdUnreadCount > 9 ? '9+' : reqProdUnreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="user-section">
          <div 
            className="user-info" 
            onClick={() => setActivePage('Perfil')}
            style={{ cursor: 'pointer' }}
            title="Ver perfil"
          >
            <img 
              id="user-avatar" 
              className="user-avatar" 
              src={userPicture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMDdiZmYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNOCA0QzkuNjYgNCAxMSA1LjM0IDExIDdDMTEgOC42NiA5LjY2IDEwIDggMTBDNi4zNCAxMCA1IDguNjYgNSAxN0M1IDUuMzQgNi4zNCA0IDggNFpNOCAxMkM5LjY2IDEyIDExIDEyLjM0IDExIDE0QzExIDE1LjY2IDkuNjYgMTcgOCAxN0M2LjM0IDE3IDUgMTUuNjYgNSAxNEM1IDEyLjM0IDYuMzQgMTIgOCAxMloiLz4KPC9zdmc+Cjwvc3ZnPgo='} 
              alt="Avatar"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer" 
              style={{ 
                display: 'block !important',
                width: '25.6px !important',
                height: '25.6px !important',
                borderRadius: '50% !important',
                objectFit: 'cover !important',
                flexShrink: '0 !important',
                visibility: 'visible !important',
                opacity: '1 !important'
              }}
              ref={(imgEl) => {
                if (imgEl) {
                  setTimeout(() => {
                    const computedStyle = window.getComputedStyle(imgEl);
                    // For├ºar display block se estiver none
                    if (computedStyle.display === 'none') {
                      imgEl.style.setProperty('display', 'block', 'important');
                      imgEl.style.setProperty('visibility', 'visible', 'important');
                      imgEl.style.setProperty('opacity', '1', 'important');
                    }
                  }, 100);
                }
              }}
              onError={(e) => {
                const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMDdiZmYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNOCA0QzkuNjYgNCAxMSA1LjM0IDExIDdDMTEgOC42NiA5LjY2IDEwIDggMTBDNi4zNCAxMCA1IDguNjYgNSAxN0M1IDUuMzQgNi4zNCA0IDggNFpNOCAxMkM5LjY2IDEyIDExIDEyLjM0IDExIDE0QzExIDE1LjY2IDkuNjYgMTcgOCAxN0M2LjM0IDE3IDUgMTUuNjYgNSAxNEM1IDEyLjM0IDYuMzQgMTIgOCAxMloiLz4KPC9zdmc+Cjwvc3ZnPgo=';
                
                // Evitar loop infinito: s├│ logar e trocar se n├úo for o avatar padr├úo
                if (!e.target.src.includes('data:image/svg')) {
                  // Log apenas se for a primeira tentativa (n├úo o fallback)
                  if (userPicture && userPicture !== defaultAvatar) {
                    console.warn('ÔÜá´©Å [Header] Erro ao carregar avatar do Google, usando avatar padr├úo:', userPicture.substring(0, 80) + '...');
                  }
                  e.target.src = defaultAvatar;
                }
              }}
            />
            <span id="user-name" className="user-name">{userName}</span>
            <button 
              id="logout-btn" 
              className="logout-btn"
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              title="Sair"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>

        <div className="theme-switch-wrapper" id="theme-toggle" onClick={toggleDarkMode}>
          <i className='bx bx-sun theme-icon'></i>
          <i className='bx bx-moon theme-icon'></i>
        </div>
      </div>
    </header>
  );
};

// Componente do Modal de Not├¡cia Cr├¡tica - VERS├âO MELHORADA
const CriticalNewsModal = ({ news, onClose, onAcknowledge }) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentNews, setCurrentNews] = useState(news);

  const handleClose = async () => {
    if (isAcknowledged) {
      CriticalModalManager.setAcknowledged(news.title);
      // Enviar confirma├º├úo para o MongoDB
      if (onAcknowledge && news._id) {
        try {
          await onAcknowledge(news._id);
        } catch (error) {
          console.error('❌ Erro ao enviar confirmação de ciência:', error);
        }
      }
    }
    onClose();
  };

  const handleRemindLater = () => {
    CriticalModalManager.setRemindLater();
    onClose();
  };

  // Verificar se deve mostrar o bot├úo "Me lembre mais tarde"
  const shouldShowRemindButton = CriticalModalManager.shouldShowRemindButton();

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2147483647,
    padding: '16px',
    backgroundColor: 'rgba(39, 42, 48, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  };
  const contentHeight = `calc(100vh - 160px)`; // Altura máxima com margens para centralização
  const contentStyle = {
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    maxWidth: showComments ? 'calc(56rem + 400px)' : '56rem',
    width: showComments ? 'calc(100% - 32px)' : 'calc(100% - 32px)',
    height: contentHeight,
    maxHeight: contentHeight,
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    zIndex: 2147483647,
    position: 'relative',
    marginTop: '0px',
    marginLeft: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    padding: '0',
    backgroundColor: 'var(--cor-container)',
    transition: 'max-width 0.3s ease'
  };

  return typeof document !== 'undefined' ? createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div className="rounded-lg shadow-2xl velohub-container flex overflow-hidden" style={contentStyle} onClick={e => e.stopPropagation()}>
        {/* Conteúdo Principal */}
        <div className="flex flex-col overflow-hidden" style={{ width: showComments ? '56rem' : '100%', padding: '2rem', transition: 'width 0.3s ease' }}>
          <div className="flex-shrink-0 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-red-600">{currentNews.title}</h2>
              <button
                onClick={() => setShowComments(!showComments)}
                className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                title={showComments ? 'Ocultar comentários' : 'Mostrar comentários'}
              >
                {showComments ? 'Ocultar' : 'Comentários'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div 
              className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
              dangerouslySetInnerHTML={{ __html: processContentHtml(formatResponseText(currentNews.content || '', 'velonews'), currentNews?.media?.images || []) }}
            />
          </div>
          <div className="mt-8 flex justify-between items-center flex-shrink-0">
            <button
              onClick={handleClose}
              disabled={!isAcknowledged}
              className={`px-6 py-2 rounded-md font-semibold text-white transition-colors duration-300 ${isAcknowledged ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-500 cursor-not-allowed'}`}
            >
              Fechar
            </button>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center">
                <input
                  id="acknowledge"
                  type="checkbox"
                  checked={isAcknowledged}
                  onChange={() => setIsAcknowledged(!isAcknowledged)}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="acknowledge" className="ml-2 text-gray-800 dark:text-gray-200 font-medium">
                  Ciente
                </label>
              </div>
              {shouldShowRemindButton && (
                <button
                  onClick={handleRemindLater}
                  className="text-[#272A30] hover:underline font-medium text-sm -mt-1"
                >
                  Me lembre mais tarde
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Container de Comentários */}
        {showComments && (
          <div style={{ width: '400px', flexShrink: 0, height: '100%' }}>
            <VelonewsCommentThread
              newsId={currentNews._id}
              thread={currentNews.thread || []}
              onCommentAdded={(updatedThread) => {
                setCurrentNews(prev => ({
                  ...prev,
                  thread: updatedThread
                }));
              }}
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  ) : null;
};

// Componente da P├ígina Principal - VERS├âO MELHORADA
export default function App_v2() {
  const [activePage, setActivePage] = useState('Home');
  const [criticalNews, setCriticalNews] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showRemindLater, setShowRemindLater] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLoadingPage, setShowLoadingPage] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);
  const [veloNews, setVeloNews] = useState([]);
  const [acknowledgedNewsIds, setAcknowledgedNewsIds] = useState([]);
  const [publicPage, setPublicPage] = useState(null);

  useEffect(() => {
    // Verificar se é uma página pública (termos ou privacidade)
    const pathname = window.location.pathname;
    if (pathname === '/termos' || pathname === '/termos.html') {
      setPublicPage('termos');
      setIsCheckingAuth(false);
      return;
    }
    if (pathname === '/privacidade' || pathname === '/privacidade.html') {
      setPublicPage('privacidade');
      setIsCheckingAuth(false);
      return;
    }

    // Verificar se há sessão válida antes de mostrar LoadingPage
    // Se não houver sessão (ex: após logout), vai direto para LoginPage sem áudio
    if (isSessionValid()) {
      // Mostrar LoadingPage apenas se houver sessão válida
      // Ela fará a verificação de autenticação internamente
      setShowLoadingPage(true);
    } else {
      // Sem sessão válida, não mostrar LoadingPage (vai direto para LoginPage)
      setIsAuthenticated(false);
    }
    setIsCheckingAuth(false);
    
    // Cleanup: parar heartbeat quando componente desmonta
    return () => {
      if (typeof stopHeartbeat === 'function') {
        stopHeartbeat();
      }
    };
  }, []);

  useEffect(() => {
    // Carregar tema salvo
    const savedTheme = localStorage.getItem('velohub-theme') || 'light';
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('velohub-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('velohub-theme', 'light');
    }
  }, [isDarkMode]);


  // Inicializar funcionalidades do header
  useEffect(() => {
    // Importar e inicializar o header dinamicamente
    const initHeader = async () => {
      try {
        const { VeloHubHeader } = await import('./header-theme.js');
        if (VeloHubHeader && VeloHubHeader.init) {
          VeloHubHeader.init();
        }
      } catch (error) {
        console.log('Header inicializado via DOM');
      }
    };
    
    initHeader();
  }, []);

  const handleLoginSuccess = (userData) => {
    console.log('Login realizado com sucesso:', userData);
    // Salvar dados do usuário e mostrar loading page primeiro
    // handleLoginSuccess será chamado dentro da LoadingPage
    setPendingUserData(userData);
    setShowLoadingPage(true);
  };

  const handleLoadingComplete = (isAuth) => {
    // Após loading page completar, verificar resultado da autenticação
    // A inicialização da sessão já foi feita dentro da LoadingPage
    if (isAuth) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setShowLoadingPage(false);
    setPendingUserData(null);
  };

  const handleAuthCheck = (isAuth) => {
    // Callback para quando LoadingPage verificar autenticação
    // Apenas atualizar estado - LoadingPage continuará rodando até completar
    setIsAuthenticated(isAuth);
  };

  const [refreshAcknowledgedNews, setRefreshAcknowledgedNews] = useState(null);
  const [updateAcknowledgedNewsCallback, setUpdateAcknowledgedNewsCallback] = useState(null);

  const renderContent = () => {
    switch (activePage) {
      case 'Home':
        return <HomePage 
          setCriticalNews={setCriticalNews} 
          setShowHistoryModal={setShowHistoryModal} 
          setVeloNews={setVeloNews} 
          veloNews={veloNews}
          setRefreshAcknowledgedNews={setRefreshAcknowledgedNews}
          setAcknowledgedNewsIds={setAcknowledgedNewsIds}
          setUpdateAcknowledgedNewsCallback={setUpdateAcknowledgedNewsCallback}
        />;
             case 'VeloBot':
        return <ProcessosPage />;
      case 'Artigos':
        return <ArtigosPage />;
      case 'Apoio':
        return <ApoioPage />;
      case 'Req_Prod':
        return <EscalacoesPage />;
      case 'Reclamações':
        return (
          <OuvidoriaAccessGuard>
            <OuvidoriaPage />
          </OuvidoriaAccessGuard>
        );
      case 'Sociais':
        return (
          <SociaisAccessGuard>
            <SociaisPage />
          </SociaisAccessGuard>
        );
      case 'Perfil':
        return <PerfilPage />;
      case 'VeloAcademy':
        return <div className="text-center p-10 text-gray-800 dark:text-gray-200"><h1 className="text-3xl">VeloAcademy</h1><p>Clique no bot├úo VeloAcademy no header para acessar a plataforma.</p></div>;
      default:
        return <HomePage 
          setCriticalNews={setCriticalNews} 
          setShowHistoryModal={setShowHistoryModal} 
          setVeloNews={setVeloNews} 
          veloNews={veloNews}
          setRefreshAcknowledgedNews={setRefreshAcknowledgedNews}
          setAcknowledgedNewsIds={setAcknowledgedNewsIds}
        />;
    }
  };

  // Mostrar páginas públicas (termos e privacidade) sem autenticação
  if (publicPage === 'termos') {
    return <TermosPage />;
  }
  if (publicPage === 'privacidade') {
    return <PrivacidadePage />;
  }

  // Mostrar LoadingPage imediatamente - ela fará verificação de autenticação e carregamento internamente
  // Isso garante que toda autenticação e carregamento acontece durante a LoadingPage
  if (showLoadingPage) {
    return <LoadingPage userData={pendingUserData} onComplete={handleLoadingComplete} onAuthCheck={handleAuthCheck} />;
  }

  // Mostrar tela de login se não estiver autenticado
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Mostrar aplicação principal se estiver autenticado
  return (
    <div className="min-h-screen font-sans velohub-bg flex flex-col">
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--cor-container)',
            color: 'var(--cor-texto-principal)',
            border: '1px solid var(--cor-borda)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Header activePage={activePage} setActivePage={setActivePage} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
      <main className="flex-1">
        {renderContent()}
      </main>
      {criticalNews && (
        <CriticalNewsModal 
          news={criticalNews} 
          onClose={() => setCriticalNews(null)}
          onAcknowledge={async (newsId) => {
            try {
              const session = getUserSession();
              const userEmail = session?.user?.email || 'unknown';
              const userName = session?.user?.name || 'Usu├írio';
              
              const response = await fetch(`${API_BASE_URL}/velo-news/${newsId}/acknowledge`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: userEmail,
                  userName: userName
                })
              });

              const result = await response.json();
              
              if (result.success) {
                console.log('✅ Notícia confirmada no MongoDB:', result.message);
                // Adicionar ID imediatamente ao estado local para remover destaque vermelho
                if (updateAcknowledgedNewsCallback) {
                  updateAcknowledgedNewsCallback(newsId);
                }
                // Recarregar acknowledges do servidor para garantir sincronização
                if (refreshAcknowledgedNews) {
                  await refreshAcknowledgedNews();
                }
              } else {
                console.error('❌ Erro ao confirmar notícia:', result.error);
              }
            } catch (error) {
              console.error('❌ Erro ao confirmar notícia:', error);
            }
          }}
        />
      )}
      
      {/* Modal de Hist├│rico de Not├¡cias */}
      <NewsHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        news={veloNews}
        acknowledgedNewsIds={acknowledgedNewsIds}
        onAcknowledge={async (newsId, userName) => {
          try {
            const session = getUserSession();
            const userEmail = session?.user?.email || 'unknown';
            const finalUserName = userName || session?.user?.name || 'Usu├írio';
            
            const response = await fetch(`${API_BASE_URL}/velo-news/${newsId}/acknowledge`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: userEmail,
                userName: finalUserName
              })
            });

            const result = await response.json();
            
            if (result.success) {
              console.log('✅ Notícia marcada como ciente no MongoDB:', result.message);
              // Recarregar acknowledges após confirmação
              if (refreshAcknowledgedNews) {
                await refreshAcknowledgedNews();
              }
            } else {
              console.error('❌ Erro ao marcar notícia como ciente:', result.error);
            }
          } catch (error) {
            console.error('❌ Erro ao marcar notícia como ciente:', error);
          }
        }}
      />
      <Footer isDarkMode={isDarkMode} />
      {/* Modal de Pílulas - Exibição automática a cada 25 minutos */}
      {isAuthenticated && <PilulasModal />}
      </div>
    );
}

// Componente do Widget de Ponto
const PontoWidget = () => {
  const [status, setStatus] = useState('loading');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePonto = async (tipo) => {
    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch(`${API_BASE_URL}/ponto/${tipo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(data.message);
        // Atualizar status ap├│s bater ponto
        setTimeout(() => fetchStatus(), 1000);
      } else {
        setMessage(`Erro: ${data.error}`);
      }
    } catch (error) {
      setMessage('Erro ao conectar com o sistema');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ponto/status`);
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data.status || 'unknown');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'in': return 'bg-green-500';
      case 'out': return 'bg-gray-400';
      case 'loading': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'in': return 'Dentro';
      case 'out': return 'Fora';
      case 'loading': return 'Carregando...';
      default: return 'Indefinido';
    }
  };

  return (
    <div className="velohub-container rounded-lg p-4" style={{border: '1px solid var(--cor-borda)'}}>
      {/* Status Atual */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className={`h-3 w-3 ${getStatusColor()} rounded-full`}></span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {getStatusText()}
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>

      {/* Bot├Áes de Ponto */}
      <div className="space-y-2">
        <button
          onClick={() => handlePonto('entrada')}
          disabled={loading || status === 'in'}
          className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            status === 'in' 
              ? 'bg-green-100 text-green-800 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Registrando...' : 'Entrada'}
        </button>
        
        <button
          onClick={() => handlePonto('saida')}
          disabled={loading || status === 'out'}
          className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            status === 'out' 
              ? 'bg-gray-100 text-gray-800 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {loading ? 'Registrando...' : 'Sa├¡da'}
        </button>
      </div>

      {/* Mensagem de Status */}
      {message && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
            {message}
          </p>
        </div>
      )}
    </div>
  );
};

// ===== FUN├ç├òES AUXILIARES PARA PROCESSAMENTO DE M├ìDIA =====
// Fun├º├úo para obter URL da imagem (primeira imagem da not├¡cia/artigo)
const getImageUrl = (item) => {
  // Processar item.media.images ou item.images (compatibilidade)
  const images = item?.media?.images || item?.images || [];
  
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }
  
  const firstImage = images[0];
  
  // Se ├® caminho relativo (formato novo: "img_velonews/123.jpg" ou "img_artigos/123.jpg")
  if (typeof firstImage === 'string' && (firstImage.startsWith('img_velonews/') || firstImage.startsWith('img_artigos/') || firstImage.startsWith('/img_velonews/') || firstImage.startsWith('/img_artigos/'))) {
    const cleanPath = firstImage.startsWith('/') ? firstImage.substring(1) : firstImage;
    // Codificar cada parte do caminho separadamente (importante para espa├ºos e caracteres especiais)
    // Mant├®m as barras n├úo codificadas, mas codifica o nome do arquivo
    const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
    // Usar endpoint do backend que redireciona para o GCS
    const imageUrl = `${API_BASE_URL}/images/${encodedPath}`;
    return imageUrl;
  }
  
  // Se ├® objeto com path (compatibilidade tempor├íria)
  if (firstImage && typeof firstImage === 'object' && firstImage.path) {
    const cleanPath = firstImage.path.startsWith('/') ? firstImage.path.substring(1) : firstImage.path;
    // Codificar cada parte do caminho separadamente
    const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
    return `${API_BASE_URL}/images/${encodedPath}`;
  }
  
  // Se ├® URL completa (compatibilidade com dados antigos)
  if (typeof firstImage === 'string' && firstImage.startsWith('http')) {
    return firstImage;
  }
  
  if (firstImage && typeof firstImage === 'object' && firstImage.url && firstImage.url.startsWith('http')) {
    return firstImage.url;
  }
  
  // Se ├® base64 (compatibilidade com dados antigos)
  if (typeof firstImage === 'string') {
    // Verificar se ├® base64 (n├úo come├ºa com http e n├úo ├® caminho relativo)
    if (!firstImage.startsWith('http') && !firstImage.startsWith('img_velonews/') && !firstImage.startsWith('img_artigos/')) {
      return firstImage.includes('data:') ? firstImage : `data:image/jpeg;base64,${firstImage}`;
    }
  }
  
  // Se ├® um objeto com propriedade data (base64 antigo)
  if (firstImage && typeof firstImage === 'object' && firstImage.data) {
    const imageData = firstImage.data;
    if (typeof imageData === 'string' && !imageData.startsWith('http') && !imageData.startsWith('img_velonews/') && !imageData.startsWith('img_artigos/')) {
      return imageData.includes('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
    }
  }
  
  return null;
};

// Fun├º├úo para obter URL do thumbnail do YouTube
const getYouTubeThumbnail = (item) => {
  // Processar item.media.videos ou item.videos
  const videos = item?.media?.videos || item?.videos || [];
  
  if (!Array.isArray(videos) || videos.length === 0) {
    return null;
  }
  
  // Encontrar primeira URL do YouTube (pode ser string ou objeto)
  let youtubeUrl = null;
  for (const v of videos) {
    if (typeof v === 'string') {
      // ├ë uma string de URL
      if (v.includes('youtube.com') || v.includes('youtu.be')) {
        youtubeUrl = v;
        break;
      }
    } else if (v && typeof v === 'object') {
      // ├ë um objeto com propriedades
      if (v.type === 'youtube' || v.embed || v.url) {
        youtubeUrl = v.url || v.embed || '';
        break;
      }
    }
  }
  
  if (!youtubeUrl) return null;
  
  // Extrair ID do YouTube (incluindo Shorts)
  const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (!videoIdMatch || !videoIdMatch[1]) return null;
  
  const videoId = videoIdMatch[1];
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

// Fun├º├úo auxiliar para detectar se ├® um YouTube Shorts
const isYouTubeShorts = (url) => {
  return url && typeof url === 'string' && url.includes('youtube.com/shorts/');
};

// Fun├º├úo auxiliar para converter URL do YouTube para formato embed
const convertYouTubeUrlToEmbed = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Se j├í est├í em formato embed, retornar como est├í
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // Extrair ID do YouTube (incluindo Shorts)
  const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (!videoIdMatch || !videoIdMatch[1]) return null;
  
  const videoId = videoIdMatch[1];
  return `https://www.youtube.com/embed/${videoId}`;
};

// Fun├º├úo para obter URL do embed do YouTube
const getYouTubeEmbedUrl = (item) => {
  // Processar item.media.videos ou item.videos
  const videos = item?.media?.videos || item?.videos || [];
  if (!Array.isArray(videos) || videos.length === 0) {
    return null;
  }
  
  // Encontrar primeira URL do YouTube (pode ser string ou objeto)
  let youtubeUrl = null;
  for (const v of videos) {
    if (typeof v === 'string') {
      if (v.includes('youtube.com') || v.includes('youtu.be')) {
        youtubeUrl = v;
        break;
      }
    } else if (v && typeof v === 'object') {
      if (v.type === 'youtube' || v.embed || v.url) {
        youtubeUrl = v.embed || v.url || '';
        break;
      }
    }
  }
  
  if (!youtubeUrl) return null;
  
  // Se j├í ├® formato embed, retornar
  if (typeof youtubeUrl === 'string' && youtubeUrl.includes('youtube.com/embed/')) {
    return youtubeUrl;
  }
  
  // Converter para formato embed
  return convertYouTubeUrlToEmbed(youtubeUrl);
};

// Fun├º├úo auxiliar para processar todas as imagens de um item (news ou article)
const getAllImages = (item) => {
  // Processar item.media.images ou item.images
  const images = item?.media?.images || item?.images || [];
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }
  
  return images.map(img => {
    // Se ├® caminho relativo
    if (typeof img === 'string' && (img.startsWith('img_velonews/') || img.startsWith('img_artigos/') || img.startsWith('/img_velonews/') || img.startsWith('/img_artigos/'))) {
      const cleanPath = img.startsWith('/') ? img.substring(1) : img;
      // Codificar cada parte do caminho separadamente
      const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
      return `${API_BASE_URL}/images/${encodedPath}`;
    }
    
    // Se ├® objeto com path
    if (img && typeof img === 'object' && img.path) {
      const cleanPath = img.path.startsWith('/') ? img.path.substring(1) : img.path;
      // Codificar cada parte do caminho separadamente
      const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
      return `${API_BASE_URL}/images/${encodedPath}`;
    }
    
    // Se ├® URL completa
    if (typeof img === 'string' && img.startsWith('http')) {
      return img;
    }
    
    if (img && typeof img === 'object' && img.url && img.url.startsWith('http')) {
      return img.url;
    }
    
    // Se ├® base64
    if (typeof img === 'string') {
      if (!img.startsWith('http') && !img.startsWith('img_velonews/') && !img.startsWith('img_artigos/')) {
        return img.includes('data:') ? img : `data:image/jpeg;base64,${img}`;
      }
    }
    
    if (img && typeof img === 'object' && img.data) {
      const imageData = img.data;
      if (typeof imageData === 'string' && !imageData.startsWith('http') && !imageData.startsWith('img_velonews/') && !imageData.startsWith('img_artigos/')) {
        return imageData.includes('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
      }
    }
    
    return null;
  }).filter(url => url !== null);
};

// Fun├º├úo para processar conte├║do HTML e remover URLs do bucket GCS
// Substitui URLs do bucket por endpoint local e remove metadados vis├¡veis
const processContentHtml = (htmlContent, mediaImages = []) => {
  if (!htmlContent || typeof htmlContent !== 'string') return htmlContent || '';
  
  let processedHtml = htmlContent;
  
  // Padr├úo para URLs do bucket GCS
  const bucketUrlPattern = /https:\/\/storage\.googleapis\.com\/[^\/]+\/(img_velonews\/[^"'\s\)]+|img_artigos\/[^"'\s\)]+)/g;
  
  // Padr├úo para URLs do endpoint da API (ex: https://velohub-278491073220.us-east1.run.app/api/images/img_velonews/...)
  const apiImageUrlPattern = /https?:\/\/[^\/]+\/api\/images\/(img_velonews\/[^"'\s\)<>]+|img_artigos\/[^"'\s\)<>]+)/gi;
  
  // 1. Remover URLs do endpoint da API em markdown (![text](url))
  processedHtml = processedHtml.replace(/!\[([^\]]*)\]\((https?:\/\/[^\/]+\/api\/images\/(img_velonews\/[^\)]+|img_artigos\/[^\)]+))\)/gi, (match, altText, apiUrl) => {
    // Remover markdown completamente - a imagem ser├í renderizada separadamente via getAllImages
    return '';
  });
  
  // 2. Remover URLs do endpoint da API em tags <img>
  processedHtml = processedHtml.replace(/<img([^>]*src=["'])(https?:\/\/[^\/]+\/api\/images\/(img_velonews\/[^"']+|img_artigos\/[^"']+))([^>]*)>/gi, (match, beforeSrc, apiUrl, afterAttrs) => {
    // Remover tag img completamente - a imagem ser├í renderizada separadamente via getAllImages
    return '';
  });
  
  // 3. Remover URLs do endpoint da API em links <a>
  processedHtml = processedHtml.replace(/<a([^>]*href=["'])(https?:\/\/[^\/]+\/api\/images\/(img_velonews\/[^"']+|img_artigos\/[^"']+))([^>]*)>([^<]*)<\/a>/gi, (match, beforeHref, apiUrl, afterAttrs, linkText) => {
    // Remover link completamente se contiver apenas nome de arquivo ou URL
    return '';
  });
  
  // 4. Remover URLs do endpoint da API soltas no texto (incluindo com ! no início)
  processedHtml = processedHtml.replace(/!?https?:\/\/[^\/]+\/api\/images\/(img_velonews\/[^\s\)<>"]+|img_artigos\/[^\s\)<>"]+)/gi, '');
  
  // 5. Substituir URLs do bucket em markdown por endpoint local
  processedHtml = processedHtml.replace(/!\[([^\]]*)\]\((https:\/\/storage\.googleapis\.com\/[^\)]+)\)/g, (match, altText, bucketUrl) => {
    const pathMatch = bucketUrl.match(/(img_velonews\/[^"'\s\)]+|img_artigos\/[^"'\s\)]+)/);
    if (pathMatch) {
      const cleanPath = pathMatch[1];
      const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
      const newUrl = `${API_BASE_URL}/images/${encodedPath}`;
      // Remover markdown completamente - a imagem ser├í renderizada separadamente via getAllImages
      return '';
    }
    return match;
  });
  
  // 6. Processar tags <img> existentes que contenham URLs do bucket
  processedHtml = processedHtml.replace(/<img([^>]*src=["'])(https:\/\/storage\.googleapis\.com\/[^\/]+\/(img_velonews\/[^"']+|img_artigos\/[^"']+))([^>]*)>/gi, (match, beforeSrc, bucketUrl, afterAttrs) => {
    const pathMatch = bucketUrl.match(/(img_velonews\/[^"'\s\)]+|img_artigos\/[^"'\s\)]+)/);
    if (pathMatch) {
      const cleanPath = pathMatch[1];
      const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
      const newSrc = `${API_BASE_URL}/images/${encodedPath}`;
      
      // Remover atributo alt se contiver nome do arquivo (preservar se for descritivo)
      let processedAttrs = afterAttrs;
      
      // Remover alt que contenha apenas nome de arquivo (ex: "mascote joia.jpg")
      processedAttrs = processedAttrs.replace(/\s+alt=["']([^"']*\.(jpg|jpeg|png|gif|webp))["']/gi, '');
      
      // Remover title se contiver apenas nome de arquivo
      processedAttrs = processedAttrs.replace(/\s+title=["']([^"']*\.(jpg|jpeg|png|gif|webp))["']/gi, '');
      
      // Preservar width, height e style (dimens├Áes definidas pelo Console)
      return `<img${beforeSrc}${newSrc}${processedAttrs}>`;
    }
    return match;
  });
  
  // 7. Substituir URLs do bucket em texto simples (caso apare├ºam como links)
  processedHtml = processedHtml.replace(bucketUrlPattern, (match, imagePath) => {
    const cleanPath = imagePath;
    const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
    return `${API_BASE_URL}/images/${encodedPath}`;
  });
  
  // 8. Remover texto que contenha apenas URLs do bucket (linhas soltas)
  processedHtml = processedHtml.replace(/https:\/\/storage\.googleapis\.com\/[^\/]+\/(img_velonews\/[^\s\)]+|img_artigos\/[^\s\)]+)/g, '');
  
  return processedHtml;
};

// Função helper reutilizável para renderizar sidebar direito com chat
// VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
const renderRightSidebarChat = ({
    isCollapsed,
    onToggleCollapse,
    activeTab,
    setActiveTab,
    isSearchExpanded,
    setIsSearchExpanded,
    searchQuery,
    setSearchQuery,
    soundEnabled,
    toggleSound,
    chatRefreshTrigger,
    handleChatRefresh,
    isRefreshing
}) => {
    if (isCollapsed) {
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
                onClick={onToggleCollapse}
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
            {/* Botão de retração no canto superior esquerdo */}
            <button
                onClick={onToggleCollapse}
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
                {/* Header com título e busca */}
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
                            {/* Status à esquerda */}
                            <div style={{ marginLeft: '16px', flexShrink: 0 }}>
                                <ChatStatusSelector 
                                    sessionId={localStorage.getItem('velohub_session_id')} 
                                    onStatusChange={(newStatus) => {
                                        // Status atualizado
                                    }}
                                />
                            </div>
                            
                            {/* Chat centralizado */}
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
                            
                            {/* Ícone de som */}
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <button
                                    onClick={toggleSound}
                                    className="flex items-center justify-center p-1 rounded transition-colors"
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title={soundEnabled ? 'Desativar som' : 'Ativar som'}
                                >
                                    {soundEnabled ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={document.documentElement.classList.contains('dark') ? '#006AB9' : 'var(--blue-dark)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            
                            {/* Botão de Refresh */}
                            <div style={{ flexShrink: 0 }}>
                                <button
                                    onClick={handleChatRefresh}
                                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    style={{ 
                                        color: document.documentElement.classList.contains('dark') ? '#006AB9' : 'var(--blue-dark)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    title="Atualizar"
                                    onMouseEnter={(e) => {
                                        e.currentTarget.querySelector('svg').style.transform = 'scale(1.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isRefreshing) {
                                            e.currentTarget.querySelector('svg').style.transform = 'scale(1)';
                                        }
                                    }}
                                >
                                    <RefreshCw 
                                        size={20} 
                                        style={{
                                            transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.6s ease-in-out, scale 0.3s ease',
                                            display: 'inline-block'
                                        }}
                                    />
                                </button>
                            </div>
                            
                            {/* Botão de busca */}
                            <div style={{ flexShrink: 0 }}>
                                <button 
                                    onClick={() => setIsSearchExpanded(true)}
                                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    style={{ color: document.documentElement.classList.contains('dark') ? '#006AB9' : 'var(--blue-dark)' }}
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
                        onClick={() => setActiveTab('conversations')}
                        style={activeTab === 'conversations' ? {
                            color: document.documentElement.classList.contains('dark') ? '#1634FF' : 'var(--blue-dark)',
                            borderBottom: '2px solid var(--blue-opaque)'
                        } : {
                            color: 'var(--cor-texto-secundario)'
                        }}
                    >
                        Conversas
                    </button>
                    <button 
                        className="flex-1 py-2 text-sm font-medium transition-colors"
                        onClick={() => setActiveTab('contacts')}
                        style={activeTab === 'contacts' ? {
                            color: document.documentElement.classList.contains('dark') ? '#1634FF' : 'var(--blue-dark)',
                            borderBottom: '2px solid var(--blue-opaque)'
                        } : {
                            color: 'var(--cor-texto-secundario)'
                        }}
                    >
                        Contatos
                    </button>
                    <button 
                        className="flex-1 py-2 text-sm font-medium transition-colors"
                        onClick={() => setActiveTab('salas')}
                        style={activeTab === 'salas' ? {
                            color: document.documentElement.classList.contains('dark') ? '#1634FF' : 'var(--blue-dark)',
                            borderBottom: '2px solid var(--blue-opaque)'
                        } : {
                            color: 'var(--cor-texto-secundario)'
                        }}
                    >
                        Salas
                    </button>
                </div>
                    
                {/* Container scrollável para conteúdo do chat */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
                    {/* VeloChatWidget com bloqueio em produção */}
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
                        
                        // Removido bypass - todos os usuários têm acesso ao chat
                        return (
                            <VeloChatWidget activeTab={activeTab} searchQuery={searchQuery} refreshTrigger={chatRefreshTrigger} />
                        );
                    })()}
                </div>
            </div>
        </aside>
    );
};

// Conte├║do da P├ígina Home - VERS├âO MELHORADA
const HomePage = ({ setCriticalNews, setShowHistoryModal, setVeloNews, veloNews, setRefreshAcknowledgedNews, setAcknowledgedNewsIds: setParentAcknowledgedNewsIds, setUpdateAcknowledgedNewsCallback }) => {
    const [selectedNews, setSelectedNews] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [showComments, setShowComments] = useState(false);
    // Estado para controle de som do chat
    const [soundEnabled, setSoundEnabled] = useState(() => {
        try {
            return localStorage.getItem('velochat_sound_enabled') !== 'false';
        } catch {
            return true; // Default: som ativado
        }
    });
    
    // Função para alternar som
    const toggleSound = () => {
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        try {
            localStorage.setItem('velochat_sound_enabled', newState.toString());
        } catch (error) {
            console.error('Erro ao salvar preferência de som:', error);
        }
    };
    const [recentItems, setRecentItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(Date.now());
    const [lastCriticalNewsId, setLastCriticalNewsId] = useState(null);
    const [acknowledgedNewsIds, setAcknowledgedNewsIds] = useState([]);
    const [expandedImage, setExpandedImage] = useState(null);
    const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
    const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('conversations');
    const [chatRefreshTrigger, setChatRefreshTrigger] = useState(0);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Função para atualizar o chat (refresh)
    const handleChatRefresh = () => {
        setIsRefreshing(true);
        setChatRefreshTrigger(prev => prev + 1);
        // Resetar animação após 600ms (tempo da rotação)
        setTimeout(() => {
            setIsRefreshing(false);
        }, 600);
    };
    
    // Estados dos m├│dulos - controlados pelo Console VeloHub
    const [moduleStatus, setModuleStatus] = useState({
        'credito-trabalhador': 'on',
        'credito-pessoal': 'on', 
        'antecipacao': 'off',
        'pagamento-antecipado': 'on',
        'modulo-irpf': 'off',
        'seguro-cred': 'on',
        'seguro-cel': 'on',
        'clube-velotax': 'on',
        'divida-zero': 'on',
        'perda-renda': 'on',
        'cupons': 'on',
        'seguro-pessoal': 'on'
    });

    // Função para buscar status dos módulos do Console VeloHub
    const fetchModuleStatus = async () => {
        try {
            const url = `${API_BASE_URL}/module-status`;
            console.log('🔍 HomePage: Buscando status dos módulos em:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                const statusData = await response.json();
                console.log('✅ HomePage: Status dos módulos recebido:', statusData);
                setModuleStatus((prev) => ({ ...prev, ...statusData }));
            } else {
                console.error('❌ HomePage: Erro HTTP:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ HomePage: Erro ao buscar status dos módulos:', error);
        }
    };

    // Fun├º├úo para carregar acknowledges do usu├írio
    const loadAcknowledgedNews = async () => {
        try {
            const session = getUserSession();
            if (!session?.user?.email) {
                console.log('⚠️ Usuário não autenticado, não é possível carregar acknowledges');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/velo-news/acknowledgments/${encodeURIComponent(session.user.email)}`);
            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ Acknowledges carregados: ${data.acknowledgedNewsIds.length} notícias confirmadas`);
                const acknowledgedIds = data.acknowledgedNewsIds || [];
                setAcknowledgedNewsIds(acknowledgedIds);
                // Atualizar tamb├®m no componente pai
                if (setParentAcknowledgedNewsIds) {
                    setParentAcknowledgedNewsIds(acknowledgedIds);
                }
            } else {
                console.error('❌ Erro ao carregar acknowledges:', data.error);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar acknowledges:', error);
        }
    };

    // Fun├º├úo para adicionar ID imediatamente ao estado local
    const addAcknowledgedNewsId = (newsId) => {
        const newsIdString = String(newsId);
        setAcknowledgedNewsIds(prev => {
            if (!prev.includes(newsIdString) && !prev.some(id => String(id) === newsIdString)) {
                const updated = [...prev, newsIdString];
                // Atualizar tamb├®m no componente pai
                if (setParentAcknowledgedNewsIds) {
                    setParentAcknowledgedNewsIds(updated);
                }
                return updated;
            }
            return prev;
        });
    };

    // Passar fun├º├úo de refresh e callback de atualiza├º├úo para o componente pai
    useEffect(() => {
        if (setRefreshAcknowledgedNews) {
            setRefreshAcknowledgedNews(() => loadAcknowledgedNews);
        }
        if (setUpdateAcknowledgedNewsCallback) {
            setUpdateAcknowledgedNewsCallback(() => addAcknowledgedNewsId);
        }
    }, [setRefreshAcknowledgedNews, setUpdateAcknowledgedNewsCallback]);

    // Fun├º├úo para abrir modal de artigo
    const handleArticleClick = (article) => {
        setSelectedArticle(article);
    };

    // Fun├º├úo para renderizar status do m├│dulo como badge
    const renderModuleStatus = (moduleKey, moduleName, title) => {
        const status = moduleStatus[moduleKey];
        let badgeConfig = {};
        
        switch (status) {
            case 'on':
                badgeConfig = {
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800',
                    darkBg: 'dark:bg-green-900',
                    darkText: 'dark:text-green-200',
                    title: 'Servi├ºo Online - Funcionando normalmente'
                };
                break;
            case 'revisao':
                badgeConfig = {
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-800',
                    darkBg: 'dark:bg-yellow-900',
                    darkText: 'dark:text-yellow-200',
                    title: 'Em Revis├úo - Servi├ºo temporariamente indispon├¡vel'
                };
                break;
            case 'off':
                badgeConfig = {
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-800',
                    darkBg: 'dark:bg-red-900',
                    darkText: 'dark:text-red-200',
                    title: 'Servi├ºo Offline - Indispon├¡vel no momento'
                };
                break;
            default:
                badgeConfig = {
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-800',
                    darkBg: 'dark:bg-gray-900',
                    darkText: 'dark:text-gray-200',
                    title: 'Status Desconhecido'
                };
        }
        
        return (
            <span 
                className={`${badgeConfig.bgColor} ${badgeConfig.textColor} ${badgeConfig.darkBg} ${badgeConfig.darkText} text-xs px-2 py-1 rounded-full`}
                title={badgeConfig.title}
            >
                {moduleName}
            </span>
        );
    };

    // ===== FUN├ç├âO PARA ACKNOWLEDGE DE NOT├ìCIAS =====
    const handleAcknowledgeNews = async (newsId, userName) => {
        try {
            const response = await fetch(`${API_BASE_URL}/velo-news/${newsId}/acknowledge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.email || 'unknown',
                    userName: userName || user?.name || 'Usu├írio'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Notícia confirmada:', result.message);
                // Atualizar a not├¡cia local para mostrar como confirmada
                setVeloNews(prevNews => 
                    prevNews.map(news => 
                        news._id === newsId 
                            ? { ...news, acknowledged: true }
                            : news
                    )
                );
            } else {
                console.error('❌ Erro ao confirmar notícia:', result.error);
            }
        } catch (error) {
            console.error('❌ Erro ao confirmar notícia:', error);
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                // ✅ Carregar apenas as 4 notícias mais recentes inicialmente
                console.log('🔍 [fetchAllData] Iniciando carregamento de VeloNews...');
                const velonewsResponse = await veloNewsAPI.getRecent(4);
                console.log('🔍 [fetchAllData] Resposta recebida:', velonewsResponse);
                console.log('🔍 [fetchAllData] velonewsResponse.data:', velonewsResponse?.data);
                console.log('🔍 [fetchAllData] Tipo de data:', Array.isArray(velonewsResponse?.data) ? 'array' : typeof velonewsResponse?.data);
                
                // ✅ Handshake das IAs do VeloBot movido para o componente Chatbot.js
                // O handshake agora é executado apenas quando a aba VeloBot é acessada
                
                // ✅ Usar apenas as 4 notícias recebidas da API (já ordenadas pelo backend)
                const newsData = velonewsResponse?.data || [];
                console.log('🔍 [fetchAllData] Quantidade de notícias recebidas:', newsData.length);
                
                // Ordenar notícias (definir sortedVeloNews no escopo correto)
                let sortedVeloNews = [];
                if (!Array.isArray(newsData)) {
                    console.error('❌ [fetchAllData] Erro: data não é um array:', newsData);
                    setVeloNews([]);
                } else {
                    sortedVeloNews = [...newsData].sort((a, b) => {
                    const da = new Date(a.createdAt || a.updatedAt || 0) || 0;
                    const db = new Date(b.createdAt || b.updatedAt || 0) || 0;
                    return db - da;
                });
                
                    console.log('🔍 [fetchAllData] Notícias ordenadas:', sortedVeloNews.length);
                    console.log('🔍 [fetchAllData] Primeira notícia:', sortedVeloNews[0]);
                    console.log('🔍 [fetchAllData] solved tipo:', typeof sortedVeloNews[0]?.solved);
                    console.log('🔍 [fetchAllData] solved valor:', sortedVeloNews[0]?.solved);
                setVeloNews(sortedVeloNews);
                }
                
                // Carregar acknowledges primeiro
                await loadAcknowledgedNews();
                
                // Aguardar um pouco para garantir que acknowledgedNewsIds foi atualizado
                // (usar uma função auxiliar para verificar após carregar)
                const checkCriticalNews = async () => {
                    // Buscar acknowledges novamente para garantir que temos os dados mais recentes
                    const session = getUserSession();
                    if (session?.user?.email) {
                        try {
                            const ackResponse = await fetch(`${API_BASE_URL}/velo-news/acknowledgments/${encodeURIComponent(session.user.email)}`);
                            const ackData = await ackResponse.json();
                            const currentAcknowledgedIds = ackData.success ? (ackData.acknowledgedNewsIds || []) : [];
                            
                            // Verificar notícias críticas - buscar a MAIS RECENTE
                            const criticalNews = sortedVeloNews.filter(n => n.is_critical === 'Y');
                            const mostRecentCritical = criticalNews.length > 0 ? criticalNews[0] : null;
                            
                            if (mostRecentCritical) {
                                // Verificar se j├í foi confirmada
                                const isAcknowledged = currentAcknowledgedIds.includes(mostRecentCritical._id);
                                
                                if (!isAcknowledged) {
                                    // Criar uma chave ├║nica para a not├¡cia cr├¡tica mais recente (ID + t├¡tulo)
                                    const criticalKey = `${mostRecentCritical._id}-${mostRecentCritical.title}`;
                                    
                                    // Verificar se ├® uma not├¡cia cr├¡tica nova usando localStorage
                                    if (CriticalModalManager.isNewCriticalNews(criticalKey)) {
                                        CriticalModalManager.resetForNewCriticalNews();
                                        CriticalModalManager.setLastCriticalNews(criticalKey);
                                        setLastCriticalNewsId(criticalKey);
                                    }
                                    
                                    if (CriticalModalManager.shouldShowModal(mostRecentCritical)) {
                                        console.log('🔔 Modal crítico exibido para notícia mais recente:', mostRecentCritical.title);
                                        setCriticalNews(mostRecentCritical);
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('❌ Erro ao verificar notícia crítica:', error);
                        }
                    }
                };
                
                await checkCriticalNews();

                // Buscar artigos recentes para o sidebar
                const fetchRecentItems = async () => {
                    try {
                        const articlesResponse = await articlesAPI.getAll();
                        
                        if (articlesResponse.data && articlesResponse.data.length > 0) {
                            const recentArticles = articlesResponse.data
                                .filter(article => article.createdAt)
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .slice(0, 3);

                            setRecentItems(recentArticles);
                        } else {
                            setRecentItems([]);
                        }
                    } catch (error) {
                        console.error('Erro ao buscar artigos recentes:', error);
                        setRecentItems([]);
                    }
                };

                fetchRecentItems();
                
                // Carregar status dos m├│dulos
                fetchModuleStatus();
            } catch (error) {
                console.error('❌ Erro ao carregar dados da API:', error);
                setVeloNews([]);
                setCriticalNews(null);
                setRecentItems([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();
        
        // Carregar status dos m├│dulos imediatamente ao carregar a p├ígina
        fetchModuleStatus();
    }, [setCriticalNews, lastCriticalNewsId]);

    // Refresh inteligente - verifica mudan├ºas antes de atualizar
    // NOTA: getAll() carrega todas as notícias porque é necessário para:
    // 1. Comparar todas as notícias e detectar mudanças (linha 1757)
    // 2. Verificar notícias críticas em todas as notícias (linha 1776)
    // 3. Atualizar o estado completo quando há mudanças (linha 1763)
    // Uma otimização futura poderia usar metadados (contagem/timestamp) para detectar mudanças
    // e carregar todas apenas quando necessário, mas isso requer mudanças no backend.
    useEffect(() => {
        const intelligentRefresh = async () => {
            try {
                // Buscar novos dados
                const [newVeloNewsData, newArticlesData, newModuleStatusData] = await Promise.all([
                    veloNewsAPI.getAll().then(res => res.data || []),
                    articlesAPI.getAll().then(res => res.data || []),
                    fetch(`${API_BASE_URL}/module-status`).then(res => res.ok ? res.json() : {})
                ]);
                
                // Comparar veloNews
                const sortedNewVeloNews = [...newVeloNewsData].sort((a, b) => {
                    const da = new Date(a.createdAt || a.updatedAt || 0) || 0;
                    const db = new Date(b.createdAt || b.updatedAt || 0) || 0;
                    return db - da;
                });
                
                const veloNewsChanged = JSON.stringify(sortedNewVeloNews) !== JSON.stringify(veloNews);
                const mergedModuleStatus = { ...moduleStatus, ...newModuleStatusData };
                const moduleStatusChanged = JSON.stringify(mergedModuleStatus) !== JSON.stringify(moduleStatus);
                
                // Atualizar apenas se houver mudan├ºas
                if (veloNewsChanged) {
                    console.log('✅ Mudanças detectadas em VeloNews, atualizando...');
                    setVeloNews(sortedNewVeloNews);
                    
                    // Recarregar acknowledges antes de verificar not├¡cias cr├¡ticas
                    await loadAcknowledgedNews();
                    
                    // Verificar not├¡cias cr├¡ticas ap├│s carregar acknowledges
                    const session = getUserSession();
                    if (session?.user?.email) {
                        try {
                            const ackResponse = await fetch(`${API_BASE_URL}/velo-news/acknowledgments/${encodeURIComponent(session.user.email)}`);
                            const ackData = await ackResponse.json();
                            const currentAcknowledgedIds = ackData.success ? (ackData.acknowledgedNewsIds || []) : [];
                            
                            const criticalNews = sortedNewVeloNews.filter(n => n.is_critical === 'Y');
                            const mostRecentCritical = criticalNews.length > 0 ? criticalNews[0] : null;
                            
                            if (mostRecentCritical) {
                                // Verificar se j├í foi confirmada
                                const isAcknowledged = currentAcknowledgedIds.includes(mostRecentCritical._id);
                                
                                if (!isAcknowledged) {
                                    const criticalKey = `${mostRecentCritical._id}-${mostRecentCritical.title}`;
                                    if (CriticalModalManager.isNewCriticalNews(criticalKey)) {
                                        CriticalModalManager.resetForNewCriticalNews();
                                        CriticalModalManager.setLastCriticalNews(criticalKey);
                                        setLastCriticalNewsId(criticalKey);
                                    }
                                    if (CriticalModalManager.shouldShowModal(mostRecentCritical)) {
                                        setCriticalNews(mostRecentCritical);
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('❌ Erro ao verificar notícia crítica no refresh:', error);
                        }
                    }
                } else {
                    console.log('✅ Sem mudanças em VeloNews, mantendo dados atuais');
                }
                
                if (moduleStatusChanged) {
                    console.log('✅ Mudanças detectadas em ModuleStatus, atualizando...');
                    setModuleStatus(mergedModuleStatus);
                } else {
                    console.log('✅ Sem mudanças em ModuleStatus, mantendo dados atuais');
                }
                
                // Atualizar recentItems apenas se necess├írio
                const newRecentItems = newArticlesData
                    .filter(article => article.createdAt)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 3);
                
                const recentItemsChanged = JSON.stringify(newRecentItems) !== JSON.stringify(recentItems);
                if (recentItemsChanged) {
                    console.log('✅ Mudanças detectadas em RecentItems, atualizando...');
                    setRecentItems(newRecentItems);
                } else {
                    console.log('✅ Sem mudanças em RecentItems, mantendo dados atuais');
                }
                
            } catch (error) {
                            console.error('❌ Erro no refresh inteligente:', error);
            }
        };
        
        // Refresh inteligente a cada 3 minutos
        const intelligentInterval = setInterval(intelligentRefresh, 3 * 60 * 1000);
        
        return () => clearInterval(intelligentInterval);
    }, [veloNews, moduleStatus, recentItems, setCriticalNews, lastCriticalNewsId]);

    // Fun├º├úo para calcular grid columns dinamicamente
    const getGridColumns = (leftCollapsed, rightCollapsed) => {
        if (leftCollapsed && rightCollapsed) {
            return '10px 1fr 10px';
        } else if (leftCollapsed) {
            return '10px minmax(0, 1fr) minmax(0, 35%)'; // Velonews desliza para esquerda, sidebar direita expande
        } else if (rightCollapsed) {
            return 'minmax(0, 25%) minmax(0, 1fr) 10px';
        } else {
            return 'minmax(0, 25%) minmax(0, 50%) minmax(0, 25%)';
        }
    };


    return (
        <div 
            className="w-full px-4 py-8 grid gap-4" 
            style={{
                gridTemplateColumns: getGridColumns(isLeftSidebarCollapsed, isRightSidebarCollapsed),
                transition: 'grid-template-columns 0.3s ease'
            }}
        >
            {/* Sidebar esquerda */}
            {isLeftSidebarCollapsed ? (
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
                    onClick={() => setIsLeftSidebarCollapsed(false)}
                >
                    <ChevronRight 
                        size={22} 
                        style={{
                            color: 'var(--blue-dark)',
                            transition: 'color 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--blue-opaque)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--blue-dark)'}
                    />
                </div>
            ) : (
                <aside 
                    className="p-4 rounded-lg shadow-sm velohub-container" 
                    style={{
                        borderRadius: '9.6px', 
                        boxShadow: '0 3.2px 16px rgba(0, 0, 0, 0.1)', 
                        padding: '19.0px',
                        position: 'relative',
                        minWidth: 0,
                        height: '700px',
                        maxHeight: '700px',
                        overflow: 'hidden',
                        transition: 'opacity 0.3s ease, transform 0.3s ease'
                    }}
                >
                    {/* Bot├úo de retra├º├úo no canto superior direito - seta aponta para fora */}
                    <button
                        onClick={() => setIsLeftSidebarCollapsed(true)}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
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
                        <ChevronLeft 
                            size={18} 
                            style={{
                                color: 'rgba(128, 128, 128, 0.5)',
                                transition: 'color 0.3s ease'
                            }}
                        />
                    </button>
                {/* Widget Serviços - NOVO NO TOPO */}
                <div className="mb-6">
                    <h3 className="font-bold text-xl mb-4 border-b pb-2 text-center velohub-title" style={{borderColor: 'var(--blue-opaque)'}}>
                        Serviços
                    </h3>
                    {/* Grid de Status dos Serviços - demonstrador 3 colunas (8 serviços) */}
                    <div className="grid grid-cols-3 gap-1">
                        {renderModuleStatus('antecipacao', 'Antecipação')}
                        {renderModuleStatus('credito-pessoal', 'Cr. Pessoal')}
                        {renderModuleStatus('pagamento-antecipado', 'Pgto Antec')}
                        {renderModuleStatus('seguro-cred', 'Prestamista')}
                        {renderModuleStatus('seguro-cel', 'Seguro Cel')}
                        {renderModuleStatus('perda-renda', 'Perda de Renda')}
                        {renderModuleStatus('cupons', 'Cupons')}
                        {renderModuleStatus('seguro-pessoal', 'Seguro Pessoal')}
                    </div>
                </div>

                {/* Widget Recentes - SIMPLIFICADO */}
                <div className="mt-6">
                    <h3 className="font-bold text-xl mb-4 border-b pb-2 text-center velohub-title" style={{borderColor: 'var(--blue-opaque)'}}>Recentes</h3>
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Carregando...</p>
                    </div>
                 ) : recentItems.length > 0 ? (
                    <div className="space-y-3">
                         {recentItems.slice(0, 2).map(item => (
                             <div key={item._id || item.id} className="border-b dark:border-gray-700 pb-3 last:border-b-0">
                                 <div className="flex items-center justify-between gap-2 mb-2">
                                     <div className="flex items-center gap-2">
                                         <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                                             Artigo
                                         </span>
                                         {item.category && (
                                             <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs px-2 py-1 rounded-full">
                                                 {item.category}
                                             </span>
                                         )}
                                     </div>
                                     <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">
                                         {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                     </span>
                                 </div>
                                 <h4 
                                     className="font-semibold text-sm text-gray-800 dark:text-gray-200 line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                                     onClick={() => handleArticleClick(item)}
                                     title="Clique para ler o artigo completo"
                                 >
                                     {item.title}
                                 </h4>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                         <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum item recente</p>
                    </div>
                )}
                </div>

                {/* Widget de Ponto - RESTAURADO NO LOCAL ORIGINAL */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <div style={{
                        background: 'transparent',
                        border: '1.5px solid var(--blue-dark)',
                        borderRadius: '8px',
                        padding: '16px',
                        margin: '8px',
                        marginTop: 'auto',
                        flexGrow: 1,
                        minHeight: '330px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                        position: 'relative'
                    }}>
                        {/* Overlay "Em Breve" */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(128, 128, 128, 0.8)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            backdropFilter: 'blur(2px)'
                        }}>
                            <div style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                padding: '20px 30px',
                                borderRadius: '12px',
                                textAlign: 'center',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                border: '2px solid var(--blue-dark)'
                            }}>
                                <h4 style={{
                                    color: 'var(--blue-dark)',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    margin: 0
                                }}>
                                    Em Breve
                                </h4>
                                <p style={{
                                    color: 'var(--blue-opaque)',
                                    fontSize: '14px',
                                    margin: '8px 0 0 0'
                                }}>
                                    Funcionalidade em desenvolvimento
                                </p>
                            </div>
                        </div>
                        {/* T├¡tulo Ponto */}
                        <h3 className="font-bold text-lg text-center" style={{color: 'var(--blue-dark)'}}>Ponto</h3>
                        
                        {/* Marcador de Status do Agente */}
                        <img 
                            src="/simbolo_velotax_ajustada_cor (1).png" 
                            alt="Status VeloTax" 
                            style={{
                                width: '60px',
                                height: 'auto',
                                opacity: '0.9',
                                filter: 'brightness(0) invert(1)',
                                transition: 'all 0.3s ease'
                            }}
                            className="agent-status-indicator offline"
                        />
                        
                        {/* Rel├│gio */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            marginTop: '32px'
                        }}>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: 'var(--blue-dark)',
                                fontFamily: 'monospace'
                            }}>
                                {new Date().toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}
                            </div>
                            <div style={{
                                fontSize: '14px',
                                color: 'var(--blue-opaque)',
                                fontWeight: '500',
                                whiteSpace: 'nowrap'
                            }}>
                                {new Date().toLocaleDateString('pt-BR', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </div>
                        </div>
                        
                        {/* Bot├Áes de Ponto */}
                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            alignItems: 'center',
                            marginTop: 'auto'
                        }}>
                            {/* Bot├úo de Entrada */}
                            <div style={{
                                position: 'relative',
                                width: '64px',
                                height: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {/* C├¡rculo externo vazio */}
                                <div style={{
                                    position: 'absolute',
                                    width: '67px',
                                    height: '67px',
                                    borderRadius: '50%',
                                    border: '2px solid var(--blue-opaque)',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)'
                                }}></div>
                                {/* C├¡rculo interno s├│lido */}
                                <div 
                                    style={{
                                        position: 'absolute',
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--blue-opaque)',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        const indicator = document.querySelector('.agent-status-indicator');
                                        indicator.classList.remove('offline');
                                        indicator.classList.add('online');
                                    }}
                                >
                                    Entrada
                                </div>
                            </div>
                            
                            {/* Bot├úo de Sa├¡da */}
                            <div style={{
                                position: 'relative',
                                width: '64px',
                                height: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {/* C├¡rculo externo vazio */}
                                <div style={{
                                    position: 'absolute',
                                    width: '67px',
                                    height: '67px',
                                    borderRadius: '50%',
                                    border: '2px solid var(--yellow)',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)'
                                }}></div>
                                {/* C├¡rculo interno s├│lido */}
                                <div 
                                    style={{
                                        position: 'absolute',
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--yellow)',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--blue-dark)',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        const indicator = document.querySelector('.agent-status-indicator');
                                        indicator.classList.remove('online');
                                        indicator.classList.add('offline');
                                    }}
                                >
                                    Sa├¡da
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* CSS para estados do agente */}
                <style>{`
                    .agent-status-indicator.online {
                        opacity: 1 !important;
                        filter: none !important;
                        filter: drop-shadow(0 0 40px var(--green)) !important;
                    }
                    
                    .agent-status-indicator.offline {
                        opacity: 0.3 !important;
                        filter: grayscale(100%) drop-shadow(0 0 40px var(--yellow)) !important;
                    }
                `}</style>
            </aside>
            )}
                            
            <section 
                className="p-4 rounded-lg shadow-sm velohub-container" 
                style={{
                    borderRadius: '9.6px', 
                    boxShadow: '0 3.2px 16px rgba(0, 0, 0, 0.1)', 
                    padding: '19.2px',
                    height: '700px',
                    maxHeight: '700px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'width 0.3s ease'
                }}
            >
                <h2 className="text-center font-bold text-3xl mb-6 flex-shrink-0">
                    <span style={{color: 'var(--blue-medium)'}}>velo</span>
                    <span style={{color: 'var(--blue-dark)'}}>news</span>
                </h2>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2" style={{ minHeight: 0 }}>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Carregando dados do MongoDB...</p>
                        </div>
                    ) : veloNews.length > 0 ? (
                        veloNews.slice(0, 4).map(news => {
                            const isSolved = news.solved === true;
                            // Converter ambos para string para garantir compara├º├úo correta
                            const newsIdString = String(news._id);
                            // Verificar se est├í na lista de acknowledges (comparando como strings)
                            const isAcknowledged = acknowledgedNewsIds.some(id => String(id) === newsIdString);
                            const isCritical = news.is_critical === 'Y';
                            // Remover destaque vermelho se foi confirmada ou se est├í resolvida
                            const shouldRemoveHighlight = isAcknowledged || isSolved;
                            
                            // Handler para "Ler mais"
                            const handleReadMore = () => {
                                if (isCritical && !isAcknowledged) {
                                    // Abrir modal obrigat├│rio para not├¡cia cr├¡tica n├úo confirmada
                                    setCriticalNews(news);
                                } else {
                                    // Abrir modal normal
                                    setSelectedNews(news);
                                }
                            };
                            
                            return (
                                <div key={news._id} className={`${
                                    isSolved ? 'solved-news-frame' : 
                                    (isCritical && !shouldRemoveHighlight ? 'critical-news-frame' : 'border-b dark:border-gray-700 pb-4 last:border-b-0')
                                }`} style={isSolved ? {opacity: 1} : {}}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                                            {news.title}
                                        </h3>
                                        <div className="flex flex-col items-end gap-2">
                                            {isSolved && (
                                                <span className="solved-badge">
                                                    Resolvido
                                                </span>
                                            )}
                                            {isCritical && !isSolved && !shouldRemoveHighlight && (
                                                <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs font-medium">
                                                    Crítica
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Renderizar primeira imagem ou v├¡deo se existir */}
                                    {(() => {
                                        const imageUrl = getImageUrl(news);
                                        
                                        return imageUrl ? (
                                            <div className="mb-3">
                                                <div className="relative inline-block" style={{ 
                                                    maxWidth: '280px', 
                                                    width: '100%',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    border: isCritical && !shouldRemoveHighlight ? '2px solid #ef4444' : '1px solid #e5e7eb'
                                                }}>
                                                    <img 
                                                        src={imageUrl} 
                                                        alt={news.title}
                                                        className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                                        style={{
                                                            maxHeight: '120px',
                                                            width: '100%',
                                                            objectFit: 'cover',
                                                            display: 'block'
                                                        }}
                                                        onClick={() => setExpandedImage(imageUrl)}
                                                        onError={(e) => {
                                                            console.error('❌ Erro ao carregar imagem:', imageUrl, e);
                                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="280" height="120"%3E%3Crect width="280" height="120" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="12"%3EImagem não encontrada%3C/text%3E%3C/svg%3E';
                                                        }}
                                                        onLoad={() => {
                                                            console.log('✅ Imagem carregada com sucesso:', imageUrl);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}
                                    {(() => {
                                        const thumbnailUrl = getYouTubeThumbnail(news);
                                        
                                        return thumbnailUrl ? (
                                            <div className="mb-3 flex justify-center">
                                                <div className="relative" style={{ 
                                                    maxWidth: '280px', 
                                                    width: '100%',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    border: isCritical && !shouldRemoveHighlight ? '2px solid #ef4444' : '1px solid #e5e7eb'
                                                }}>
                                                    <div 
                                                        className="relative cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={handleReadMore}
                                                    >
                                                        <img 
                                                            src={thumbnailUrl} 
                                                            alt={`${news.title} - V├¡deo`}
                                                            className="w-full h-auto"
                                                            style={{
                                                                maxHeight: '120px',
                                                                width: '100%',
                                                                objectFit: 'cover',
                                                                display: 'block'
                                                            }}
                                                        />
                                                        {/* Overlay com ├¡cone de play */}
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-opacity">
                                                            <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
                                                                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M8 5v14l11-7z"/>
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}
                                    
                                    <div 
                                        className={`text-gray-600 dark:text-gray-400 line-clamp-3 mb-2 prose prose-sm dark:prose-invert max-w-none ${isSolved ? 'solved-news-content' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: processContentHtml(formatResponseText(news.content || '', 'velonews'), news?.media?.images || []) }}
                                    />
                                    
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <button onClick={handleReadMore} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                                Ler mais
                                            </button>
                                            
                                        </div>
                                        
                                        {news.createdAt && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(news.createdAt).toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">Nenhuma notícia encontrada</p>
                        </div>
                    )}
                </div>
                
                {/* Botão Ver Notícias Anteriores - sempre visível */}
                <div className="text-center mt-4 flex-shrink-0 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => {
                            console.log('📜 Abrindo modal de histórico de notícias');
                            setShowHistoryModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        style={{
                            background: 'linear-gradient(135deg, var(--blue-dark) 0%, var(--blue-medium) 100%)',
                            border: 'none',
                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                        }}
                    >
                        Ver Notícias Anteriores
                    </button>
                </div>
            </section>
            
            {/* Sidebar direita */}
            {renderRightSidebarChat({
                isCollapsed: isRightSidebarCollapsed,
                onToggleCollapse: () => setIsRightSidebarCollapsed(!isRightSidebarCollapsed),
                activeTab,
                setActiveTab,
                isSearchExpanded,
                setIsSearchExpanded,
                searchQuery,
                setSearchQuery,
                soundEnabled,
                toggleSound,
                chatRefreshTrigger,
                handleChatRefresh,
                isRefreshing
            })}
            {selectedNews && typeof document !== 'undefined' && createPortal(
                <div 
                    onClick={() => setSelectedNews(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 2147483647,
                        padding: '16px',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                >
                    <div 
                        className="rounded-lg shadow-2xl bg-white dark:bg-gray-800 flex overflow-hidden" 
                        onClick={e => e.stopPropagation()} 
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                            maxWidth: showComments ? 'calc(56rem + 400px)' : '56rem',
                            width: showComments ? 'calc(100% - 32px)' : 'calc(100% - 32px)',
                            height: 'calc(100vh - 160px)',
                            maxHeight: 'calc(100vh - 160px)',
                            display: 'flex',
                            flexDirection: 'row',
                            overflow: 'hidden',
                            zIndex: 2147483647,
                            position: 'relative',
                            transition: 'max-width 0.3s ease'
                        }}
                    >
                        {/* Conteúdo Principal */}
                        <div className="flex flex-col overflow-hidden" style={{ width: showComments ? '56rem' : '100%', transition: 'width 0.3s ease' }}>
                            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                               <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 pr-4 flex-1">{selectedNews.title}</h2>
                               <div className="flex items-center gap-2">
                                   <button
                                       onClick={() => setShowComments(!showComments)}
                                       className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                       title={showComments ? 'Ocultar comentários' : 'Mostrar comentários'}
                                   >
                                       {showComments ? 'Ocultar' : 'Comentários'}
                                   </button>
                                   <button onClick={() => {
                                       setSelectedNews(null);
                                       setShowComments(false);
                                   }} className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white text-3xl flex-shrink-0">&times;</button>
                               </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4">
                            {/* Renderizar todas as imagens */}
                            {(() => {
                                const allImages = getAllImages(selectedNews);
                                return allImages.length > 0 && (
                                    <div className="mb-4 space-y-3">
                                        {allImages.map((imgUrl, idx) => {
                                            if (!imgUrl) return null;
                                            return (
                                                <div key={idx} className="relative">
                                                    <img 
                                                        src={imgUrl} 
                                                        alt={`${selectedNews.title || selectedNews.titulo} - Imagem ${idx + 1}`}
                                                        className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                                                        onClick={() => setExpandedImage(imgUrl)}
                                                        onError={(e) => {
                                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect width="400" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="14"%3EImagem n├úo encontrada%3C/text%3E%3C/svg%3E';
                                                        }}
                                                    />
                                                    <div className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                        Clique para expandir
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                            
                            {/* Renderizar v├¡deos do YouTube */}
                            {(() => {
                                const videos = selectedNews?.media?.videos || selectedNews?.videos || [];
                                
                                // Processar v├¡deos (podem ser strings ou objetos)
                                const youtubeVideos = videos
                                    .map(v => {
                                        if (typeof v === 'string') {
                                            // ├ë uma string de URL
                                            if (v.includes('youtube.com') || v.includes('youtu.be')) {
                                                return { url: v, embed: convertYouTubeUrlToEmbed(v) };
                                            }
                                            return null;
                                        } else if (v && typeof v === 'object') {
                                            // ├ë um objeto
                                            if (v.type === 'youtube' || v.embed || v.url) {
                                                return {
                                                    url: v.url || v.embed || '',
                                                    embed: v.embed || convertYouTubeUrlToEmbed(v.url || v.embed || '')
                                                };
                                            }
                                        }
                                        return null;
                                    })
                                    .filter(v => v !== null && v.embed);
                                
                                return youtubeVideos.length > 0 ? (
                                    <div className="mb-4 space-y-3">
                                        {youtubeVideos.map((vid, idx) => {
                                            if (!vid.embed) return null;
                                            // Detectar se ├® Shorts para aplicar propor├º├úo 9:16 com tamanho limitado
                                            const isShorts = isYouTubeShorts(vid.url);
                                            if (isShorts) {
                                                // Para Shorts: propor├º├úo 9:16 (largura:altura = 9:16)
                                                // Definir altura m├íxima e calcular largura, ou vice-versa
                                                // Altura m├íxima de 400px -> largura = 400 ├ù (9/16) = 225px
                                                return (
                                                    <div key={idx} className="flex justify-center">
                                                        <div className="relative rounded-lg overflow-hidden" style={{ width: '225px', maxWidth: '100%', height: '400px', maxHeight: '50vh' }}>
                                                            <iframe
                                                                src={vid.embed}
                                                                className="w-full h-full rounded-lg"
                                                                frameBorder="0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // Para v├¡deos normais: propor├º├úo 16:9 padr├úo
                                                return (
                                                    <div key={idx} className="relative w-full" style={{ paddingBottom: '56.25%', height: 0 }}>
                                                        <iframe
                                                            src={vid.embed}
                                                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    </div>
                                                );
                                            }
                                        })}
                                    </div>
                                ) : null;
                            })()}
                            
                            <div 
                                className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                dangerouslySetInnerHTML={{ __html: processContentHtml(formatResponseText(selectedNews.content || '', 'velonews'), selectedNews?.media?.images || []) }}
                            />
                            </div>
                        </div>

                        {/* Container de Comentários */}
                        {showComments && (
                            <div style={{ width: '400px', flexShrink: 0, height: '100%' }}>
                                <VelonewsCommentThread
                                    newsId={selectedNews._id}
                                    thread={selectedNews.thread || []}
                                    onCommentAdded={(updatedThread) => {
                                        setSelectedNews(prev => ({
                                            ...prev,
                                            thread: updatedThread
                                        }));
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
            
            {/* Modal de imagem expandida */}
            {expandedImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[9999] p-4"
                    onClick={() => setExpandedImage(null)}
                    style={{ zIndex: 9999 }}
                >
                    <button 
                        onClick={() => setExpandedImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl z-10"
                        style={{ fontSize: '2rem' }}
                    >
                        &times;
                    </button>
                    <img 
                        src={expandedImage} 
                        alt="Imagem expandida"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}

            {selectedArticle && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4" onClick={() => setSelectedArticle(null)} style={{ zIndex: 9999 }}>
                    <div className="rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] bg-white dark:bg-gray-800 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)', zIndex: 10000}}>
                        {/* Header fixo */}
                        <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 pr-3 line-clamp-2">{selectedArticle.title}</h2>
                            <button onClick={() => setSelectedArticle(null)} className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white text-xl flex-shrink-0">&times;</button>
                        </div>
                        
                        {/* Metadados fixos */}
                        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <div className="flex flex-wrap items-center gap-1">
                                {selectedArticle.category && (
                                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs px-2 py-0.5 rounded-full">
                                        {selectedArticle.category}
                                    </span>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(selectedArticle.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>
                        
                        {/* Conte├║do com scroll */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Renderizar todas as imagens */}
                            {(() => {
                                const allImages = getAllImages(selectedArticle);
                                return allImages.length > 0 && (
                                    <div className="mb-4 space-y-3">
                                        {allImages.map((imgUrl, idx) => {
                                            if (!imgUrl) return null;
                                            return (
                                                <div key={idx} className="relative">
                                                    <img 
                                                        src={imgUrl} 
                                                        alt={`${selectedArticle.title || selectedArticle.titulo} - Imagem ${idx + 1}`}
                                                        className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                                                        onClick={() => setExpandedImage(imgUrl)}
                                                        onError={(e) => {
                                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect width="400" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="14"%3EImagem n├úo encontrada%3C/text%3E%3C/svg%3E';
                                                        }}
                                                    />
                                                    <div className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                        Clique para expandir
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                            
                            {/* Renderizar v├¡deos do YouTube */}
                            {(() => {
                                const videos = selectedArticle?.media?.videos || selectedArticle?.videos || [];
                                console.log('📹 Modal Artigo - vídeos encontrados:', videos);
                                
                                // Processar v├¡deos (podem ser strings ou objetos)
                                const youtubeVideos = videos
                                    .map(v => {
                                        if (typeof v === 'string') {
                                            // ├ë uma string de URL
                                            if (v.includes('youtube.com') || v.includes('youtu.be')) {
                                                return { url: v, embed: convertYouTubeUrlToEmbed(v) };
                                            }
                                            return null;
                                        } else if (v && typeof v === 'object') {
                                            // ├ë um objeto
                                            if (v.type === 'youtube' || v.embed || v.url) {
                                                return {
                                                    url: v.url || v.embed || '',
                                                    embed: v.embed || convertYouTubeUrlToEmbed(v.url || v.embed || '')
                                                };
                                            }
                                        }
                                        return null;
                                    })
                                    .filter(v => v !== null && v.embed);
                                
                                console.log('📹 Modal Artigo - vídeos processados:', youtubeVideos);
                                
                                return youtubeVideos.length > 0 ? (
                                    <div className="mb-4 space-y-3">
                                        {youtubeVideos.map((vid, idx) => {
                                            if (!vid.embed) return null;
                                            // Detectar se ├® Shorts para aplicar propor├º├úo 9:16 com tamanho limitado
                                            const isShorts = isYouTubeShorts(vid.url);
                                            if (isShorts) {
                                                // Para Shorts: propor├º├úo 9:16 (largura:altura = 9:16)
                                                // Definir altura m├íxima e calcular largura, ou vice-versa
                                                // Altura m├íxima de 400px -> largura = 400 ├ù (9/16) = 225px
                                                return (
                                                    <div key={idx} className="flex justify-center">
                                                        <div className="relative rounded-lg overflow-hidden" style={{ width: '225px', maxWidth: '100%', height: '400px', maxHeight: '50vh' }}>
                                                            <iframe
                                                                src={vid.embed}
                                                                className="w-full h-full rounded-lg"
                                                                frameBorder="0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // Para v├¡deos normais: propor├º├úo 16:9 padr├úo
                                                return (
                                                    <div key={idx} className="relative w-full" style={{ paddingBottom: '56.25%', height: 0 }}>
                                                        <iframe
                                                            src={vid.embed}
                                                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    </div>
                                                );
                                            }
                                        })}
                                    </div>
                                ) : null;
                            })()}
                            
                            <div 
                                className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                dangerouslySetInnerHTML={{ __html: processContentHtml(formatResponseText(selectedArticle.content || '', 'article'), selectedArticle?.media?.images || []) }}
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

// Componente para listagem de tickets do usu├írio
const TicketsListPage = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('date'); // 'date' | 'status'
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fun├º├úo para carregar tickets do usu├írio logado
    const loadTickets = async () => {
        try {
            const session = getUserSession();
            if (!session?.user?.email) {
                setError('Usu├írio n├úo autenticado');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/support/tickets?userEmail=${encodeURIComponent(session.user.email)}`);
            const data = await response.json();
            
            if (data.success) {
                setTickets(data.tickets || []);
            } else {
                setError(data.error || 'Erro ao carregar tickets');
            }
        } catch (err) {
            console.error('Erro ao carregar tickets:', err);
            setError('Erro ao carregar tickets');
        } finally {
            setLoading(false);
        }
    };

    // Fun├º├úo para atualizar tickets
    const handleRefreshTickets = async () => {
        setIsRefreshing(true);
        await loadTickets();
        setIsRefreshing(false);
    };

    // Carregar tickets do usu├írio logado
    useEffect(() => {
        loadTickets();
    }, []);

    // Fun├º├úo para obter cor do status
    const getStatusColor = (status) => {
        switch (status) {
            case 'novo':
                return { background: 'var(--blue-light)', color: 'white' };
            case 'aberto':
                return { background: '#ff0000', color: 'white' };
            case 'em espera':
                return { background: 'var(--yellow)', color: 'white' };
            case 'pendente':
                return { background: 'var(--green)', color: 'white' };
            case 'resolvido':
                return { background: '#e5e7eb', color: '#374151' };
            default:
                return { background: '#e5e7eb', color: '#374151' };
        }
    };

    // Filtrar e ordenar tickets
    const filteredTickets = tickets.filter(ticket => {
        if (filterStatus === 'all') return true;
        return ticket._statusHub === filterStatus;
    }).sort((a, b) => {
        if (sortBy === 'date') {
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        } else if (sortBy === 'status') {
            const statusOrder = { 'novo': 0, 'pendente': 1, 'aberto': 2, 'resolvido': 3 };
            return statusOrder[a._statusHub] - statusOrder[b._statusHub];
        }
        return 0;
    });

    // Separar tickets ativos e resolvidos
    const activeTickets = filteredTickets.filter(ticket => ticket._statusHub !== 'resolvido');
    const resolvedTickets = filteredTickets.filter(ticket => ticket._statusHub === 'resolvido');

    // Fun├º├úo para visualizar ticket
    const handleViewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setOpenModal(true);
        setReplyText('');
    };

    // Fun├º├úo para fechar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedTicket(null);
        setReplyText('');
    };

    // Fun├º├úo para enviar resposta
    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;

        setIsSubmittingReply(true);
        try {
            const session = getUserSession();
            
            // Determinar endpoint baseado no prefixo do ID
            const endpoint = selectedTicket._id.startsWith('TKC-') 
                ? '/support/tk-conteudos' 
                : '/support/tk-gestao';
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _id: selectedTicket._id,
                    _userEmail: selectedTicket._userEmail,
                    _genero: selectedTicket._genero,
                    _tipo: selectedTicket._tipo,
                    _corpo: [
                        ...(selectedTicket._corpo || []),
                        {
                            autor: 'user',
                            userName: session.user.name,
                            mensagem: replyText,
                            timestamp: new Date()
                        }
                    ],
                    _obs: selectedTicket._obs,
                    _direcionamento: selectedTicket._direcionamento,
                    _statusHub: 'pendente',
                    _statusConsole: 'aberto',
                    _lastUpdatedBy: 'user',
                    createdAt: selectedTicket.createdAt,
                    updatedAt: new Date()
                })
            });

            const result = await response.json();
            if (result.success) {
                // Recarregar tickets
                const ticketsResponse = await fetch(`${API_BASE_URL}/support/tickets?userEmail=${encodeURIComponent(session.user.email)}`);
                const ticketsData = await ticketsResponse.json();
                if (ticketsData.success) {
                    setTickets(ticketsData.tickets || []);
                }
                
                // Atualizar ticket selecionado
                const updatedTicket = ticketsData.tickets?.find(t => t._id === selectedTicket._id);
                if (updatedTicket) {
                    setSelectedTicket(updatedTicket);
                }
                
                setReplyText('');
                alert('Resposta enviada com sucesso!');
            } else {
                alert('Erro ao enviar resposta: ' + (result.error || 'Erro desconhecido'));
            }
        } catch (err) {
            console.error('Erro ao enviar resposta:', err);
            alert('Erro ao enviar resposta');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    // Fun├º├úo para formatar data
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Carregando seus tickets...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <div className="bg-red-100 dark:bg-red-900 rounded-lg p-8 max-w-md mx-auto">
                    <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-4">
                        Erro
                    </h3>
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filtros e ordena├º├úo */}
            <div className="flex justify-end items-center gap-3 mb-4" style={{paddingLeft: '20px', paddingRight: '20px'}}>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="velohub-input bg-white dark:bg-transparent border-blue-dark velohub-filter-select text-gray-700 dark:text-gray-300"
                    style={{
                        border: '1.2px solid',
                        borderRadius: '6.4px',
                        padding: '6.6px 12.8px',
                        fontFamily: 'Poppins, sans-serif',
                        transition: 'border-color 0.3s ease',
                        fontSize: '0.875rem'
                    }}
                >
                    <option value="all">Todos os status</option>
                    <option value="novo">Novo</option>
                    <option value="pendente">Pendente</option>
                    <option value="aberto">Aberto</option>
                    <option value="resolvido">Resolvido</option>
                </select>
                
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="velohub-input bg-white dark:bg-transparent border-blue-dark velohub-filter-select text-gray-700 dark:text-gray-300"
                    style={{
                        border: '1.2px solid',
                        borderRadius: '6.4px',
                        padding: '6.6px 12.8px',
                        fontFamily: 'Poppins, sans-serif',
                        transition: 'border-color 0.3s ease',
                        fontSize: '0.875rem'
                    }}
                >
                    <option value="date">Ordenar por data</option>
                    <option value="status">Ordenar por status</option>
                </select>
                
                <div className="text-sm" style={{color: 'var(--blue-opaque)', fontFamily: 'Poppins, sans-serif'}}>
                    {tickets.length} ticket(s) encontrado(s)
                </div>
                <button
                    onClick={handleRefreshTickets}
                    disabled={isRefreshing}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Atualizar tickets"
                >
                    <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Tickets Ativos */}
            {activeTickets.length > 0 && (
                <div style={{marginTop: '-1rem'}}>
                    <h3 className="text-lg font-semibold mb-4 velohub-title" style={{fontFamily: 'Poppins, sans-serif'}}>
                        Tickets Ativos ({activeTickets.length})
                    </h3>
                    <div className="velohub-container" style={{
                        borderRadius: '13.2px',
                        boxShadow: '0 4.4px 22px rgba(0, 0, 0, 0.1)',
                        padding: '26.4px',
                        margin: '17.6px 20px',
                        border: '1px solid rgba(22, 52, 255, 0.1)'
                    }}>
                        {/* Cabe├ºalho da tabela */}
                        <div className="grid grid-cols-5 gap-4 py-3 px-4 font-semibold border-b" style={{
                            borderColor: 'var(--blue-opaque)',
                            fontFamily: 'Poppins, sans-serif',
                            color: 'var(--blue-opaque)'
                        }}>
                            <div>ID</div>
                            <div>Data</div>
                            <div>Motivo</div>
                            <div>Tipo</div>
                            <div>Status</div>
                        </div>
                        
                        {/* Linhas dos tickets */}
                        <div className="space-y-2">
                            {activeTickets.map((ticket) => {
                                const statusColor = getStatusColor(ticket._statusHub);
                                return (
                                    <div
                                        key={ticket._id}
                                        className="grid grid-cols-5 gap-4 py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                                        onClick={() => handleViewTicket(ticket)}
                                    >
                                        <div className="font-mono text-sm text-gray-700 dark:text-gray-300" style={{fontFamily: 'Poppins, sans-serif'}}>
                                            {ticket._id}
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300" style={{fontFamily: 'Poppins, sans-serif'}}>
                                            {formatDate(ticket.createdAt)}
                                        </div>
                                        <div className="text-sm text-blue-dark dark:text-blue-light" style={{fontFamily: 'Poppins, sans-serif'}}>
                                            {ticket._genero}
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300" style={{fontFamily: 'Poppins, sans-serif'}}>
                                            {ticket._tipo}
                                        </div>
                                        <div>
                                            <span
                                                className="px-2 py-1 rounded-full text-xs font-medium"
                                                style={statusColor}
                                            >
                                                {ticket._statusHub}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Tickets Resolvidos - SEMPRE VIS├ìVEL */}
            <div>
                <h3 className="text-lg font-semibold mb-4 velohub-title" style={{fontFamily: 'Poppins, sans-serif'}}>
                    Tickets Resolvidos ({resolvedTickets.length})
                </h3>
                <div className="velohub-container" style={{
                    borderRadius: '13.2px',
                    boxShadow: '0 4.4px 22px rgba(0, 0, 0, 0.1)',
                    padding: '26.4px',
                    margin: '17.6px 20px',
                    border: '1px solid rgba(22, 52, 255, 0.1)'
                }}>
                    {/* Cabe├ºalho da tabela */}
                    <div className="grid grid-cols-5 gap-4 py-3 px-4 font-semibold border-b" style={{
                        borderColor: 'var(--blue-opaque)',
                        fontFamily: 'Poppins, sans-serif',
                        color: 'var(--blue-opaque)'
                    }}>
                        <div>ID</div>
                        <div>Data</div>
                        <div>Motivo</div>
                        <div>Tipo</div>
                        <div>Status</div>
                    </div>
                    
                    {/* Linhas dos tickets */}
                    <div className="space-y-2">
                        {resolvedTickets.length > 0 ? (
                            resolvedTickets.map((ticket) => {
                                const statusColor = getStatusColor(ticket._statusHub);
                                return (
                                    <div
                                        key={ticket._id}
                                        className="grid grid-cols-5 gap-4 py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors opacity-75"
                                        onClick={() => handleViewTicket(ticket)}
                                    >
                                        <div className="font-mono text-sm text-gray-700 dark:text-gray-300" style={{fontFamily: 'Poppins, sans-serif'}}>
                                            {ticket._id}
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300" style={{fontFamily: 'Poppins, sans-serif'}}>
                                            {formatDate(ticket.createdAt)}
                                        </div>
                                        <div className="text-sm text-blue-dark dark:text-blue-light" style={{fontFamily: 'Poppins, sans-serif'}}>
                                            {ticket._genero}
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300" style={{fontFamily: 'Poppins, sans-serif'}}>
                                            {ticket._tipo}
                                        </div>
                                        <div>
                                            <span
                                                className="px-2 py-1 rounded-full text-xs font-medium"
                                                style={statusColor}
                                            >
                                                {ticket._statusHub}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 col-span-5">
                                <p style={{color: 'var(--gray)', fontFamily: 'Poppins, sans-serif'}}>
                                    Nenhum ticket resolvido encontrado.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de visualiza├º├úo e resposta */}
            {openModal && selectedTicket && (
                <div className="fixed bg-black bg-opacity-50" style={{
                    zIndex: 99999,
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    width: '100vw', 
                    height: '100vh',
                    position: 'fixed'
                }}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden" style={{
                        position: 'absolute',
                        top: '22px',
                        left: '22px',
                        right: '22px',
                        bottom: '0px',
                        zIndex: 10000
                    }}>
                        {/* Cabe├ºalho do modal */}
                        <div className="border-b border-gray-200 dark:border-gray-700" style={{padding: '19.8px'}}>
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {selectedTicket._id} - {selectedTicket._genero}
                                    {selectedTicket._assunto && ` - ${selectedTicket._assunto}`}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Container Principal com padding correto */}
                        <div style={{
                            padding: '16.5px 27.5px 0 27.5px',
                            height: 'calc(100% - 132px)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* ├ürea de Mensagens */}
                            <div style={{
                                flex: '1',
                                overflowY: 'auto'
                            }}>
                                <div className="space-y-3">
                                    {Array.isArray(selectedTicket._corpo) ? selectedTicket._corpo.map((mensagem, index) => (
                                        <div
                                            key={index}
                                            className={`container-secondary ${mensagem.autor === 'admin' ? 'admin-message' : 'user-message'}`}
                                            style={{
                                                background: 'transparent',
                                                border: `2.2px solid ${mensagem.autor === 'admin' ? 'var(--blue-medium)' : 'var(--blue-dark)'}`,
                                                borderRadius: '8.8px',
                                                padding: '17.6px',
                                                margin: '8.8px 0',
                                                fontFamily: 'Poppins, sans-serif'
                                            }}
                                        >
                                            {/* Header da mensagem - userName e timestamp */}
                                            <div className="mb-3">
                                                <span className="font-medium text-sm" style={{color: 'var(--gray)', fontFamily: 'Poppins, sans-serif'}}>
                                                    {mensagem.userName}
                                                </span>
                                                <span className="text-xs ml-2" style={{color: 'var(--blue-opaque)', fontFamily: 'Poppins, sans-serif'}}>
                                                    - {new Date(mensagem.timestamp).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            
                                            {/* Conte├║do da mensagem */}
                                            <div className="text-base whitespace-pre-wrap" style={{color: 'var(--gray)', fontFamily: 'Poppins, sans-serif'}}>
                                                {mensagem.mensagem}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8">
                                            <p style={{color: 'var(--gray)', fontFamily: 'Poppins, sans-serif'}}>
                                                Nenhuma mensagem encontrada.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ├ürea de Resposta */}
                            {selectedTicket._statusHub !== 'resolvido' && (
                                <div style={{
                                    flex: '0 0 auto',
                                    marginTop: 'auto'
                                }}>
                                    <div className="relative">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Digite sua resposta..."
                                            className="w-full resize-none pr-12"
                                            style={{
                                                border: '1.5px solid var(--blue-opaque)',
                                                borderRadius: '8px',
                                                padding: '12px 16px',
                                                fontFamily: 'Poppins, sans-serif',
                                                minHeight: '120px',
                                                background: 'transparent'
                                            }}
                                        />
                                        <button
                                            onClick={handleSendReply}
                                            disabled={!replyText.trim() || isSubmittingReply}
                                            className="absolute bottom-2 right-2 transition-all duration-300"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: replyText.trim() && !isSubmittingReply ? 'pointer' : 'not-allowed'
                                            }}
                                        >
                                            {isSubmittingReply ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            ) : (
                                                <Send 
                                                    size={25} 
                                                    style={{
                                                        color: replyText.trim() && !isSubmittingReply ? 'var(--blue-medium)' : 'rgba(59, 130, 246, 0.5)'
                                                    }}
                                                />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Conte├║do da P├ígina de Apoio
function ApoioPage() {
    const [activeModal, setActiveModal] = useState(null);
    const [activeTab, setActiveTab] = useState('solicitar');
    
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
    
    // Estados para refresh do chat
    const [chatRefreshTrigger, setChatRefreshTrigger] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const toggleSound = () => {
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        try {
            localStorage.setItem('velochat_sound_enabled', newState.toString());
        } catch (error) {
            console.error('Erro ao salvar preferência de som:', error);
        }
    };
    
    // Função para refresh do chat
    const handleChatRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setChatRefreshTrigger(prev => prev + 1);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };
    
    // Função para calcular grid columns
    const getGridColumns = (rightCollapsed) => {
        if (rightCollapsed) {
            return '1fr 10px';
        } else {
            return 'minmax(0, 1fr) minmax(0, 35%)';
        }
    };
    
    // Marcar tickets como visualizados quando a p├ígina ├® aberta
    useEffect(() => {
        const markTicketsAsViewed = async () => {
            try {
                const session = getUserSession();
                if (!session?.user?.email) return;

                // Buscar tickets n├úo visualizados
                const response = await fetch(`${API_BASE_URL}/support/tickets/unread-count?userEmail=${encodeURIComponent(session.user.email)}`);
                const data = await response.json();
                
                if (data.success && data.tickets.length > 0) {
                    // Obter objeto atual de tickets visualizados
                    const viewedTicketsRaw = localStorage.getItem('velohub-viewed-tickets');
                    let viewedTickets = {};
                    
                    // Migração: se for array antigo, converter para objeto
                    if (viewedTicketsRaw) {
                        try {
                            const parsed = JSON.parse(viewedTicketsRaw);
                            if (Array.isArray(parsed)) {
                                // Migrar array antigo para objeto
                                parsed.forEach(ticketId => {
                                    viewedTickets[ticketId] = new Date().toISOString();
                                });
                            } else {
                                viewedTickets = parsed;
                            }
                        } catch (e) {
                            console.error('Erro ao parsear viewedTickets:', e);
                            viewedTickets = {};
                        }
                    }
                    
                    // Timestamp atual para marcar visualiza├º├úo (momento em que o usu├írio est├í visualizando)
                    const currentTimestamp = new Date().toISOString();
                    
                    // Atualizar timestamp de visualiza├º├úo para cada ticket vis├¡vel
                    // Usar timestamp atual para garantir que todas as mensagens at├® este momento sejam consideradas visualizadas
                    data.tickets.forEach(ticket => {
                        viewedTickets[ticket._id] = currentTimestamp;
                    });
                    
                    // Salvar no localStorage
                    localStorage.setItem('velohub-viewed-tickets', JSON.stringify(viewedTickets));
                    
                    // Disparar evento customizado para atualizar o header
                    window.dispatchEvent(new CustomEvent('tickets-viewed'));
                }
            } catch (error) {
                console.error('Erro ao marcar tickets como visualizados:', error);
            }
        };

        markTicketsAsViewed();
    }, []);
    
    const supportItems = [
        // Primeira linha
        { 
            name: 'Artigo', 
            icon: <FileText size={32} />, 
            type: 'artigo',
            title: 'Solicitar Artigo',
            description: 'Solicite a criação ou alteração de artigos da central'
        }, 
        { 
            name: 'Processo', 
            icon: <Bot size={32} />, 
            type: 'bot',
            title: 'Solicitar Processo/Informação',
            description: 'Adição ou Correção de respostas do bot'
        },
        { 
            name: 'Roteiro', 
            icon: <Map size={32} />, 
            type: 'roteiro',
            title: 'Solicitar Roteiro',
            description: 'Macros, respostas prontas e roteiros de atendimento'
        },
        // Segunda linha
        { 
            name: 'Treinamento', 
            icon: <GraduationCap size={32} />, 
            type: 'treinamento',
            title: 'Solicitar Treinamento',
            description: 'Solicite treinamentos e capacitações'
        }, 
        { 
            name: 'Funcionalidade', 
            icon: <Puzzle size={32} />, 
            type: 'funcionalidade',
            title: 'Solicitar Funcionalidade',
            description: 'Solicite melhorias ou novas funcionalidades'
        }, 
        { 
            name: 'Recurso Adicional', 
            icon: <PlusSquare size={32} />, 
            type: 'recurso',
            title: 'Solicitar Recurso Adicional',
            description: 'Solicite recursos visuais, ou outros materiais para auxiliar em atendimentos.'
        },
        // Terceira linha
        { 
            name: 'Gestão', 
            icon: <User size={32} />, 
            type: 'gestao',
            title: 'Solicitar Gestão',
            description: 'Solicitações, agendamentos e notificações para gestão'
        },
        { 
            name: 'RH e Financeiro', 
            icon: <BookOpen size={32} />, 
            type: 'rh_financeiro',
            title: 'Solicitar RH e Financeiro',
            description: 'Solicitações para RH ou setor financeiro'
        },
        { 
            name: 'Facilities', 
            icon: <LifeBuoy size={32} />, 
            type: 'facilities',
            title: 'Solicitar Facilities',
            description: 'Solicitações para facilities e infraestrutura'
        },
    ];

    const handleCardClick = (item) => {
        setActiveModal(item);
    };

    const handleCloseModal = () => {
        setActiveModal(null);
    };

    return (
        <div className="w-full py-12" style={{paddingLeft: '20px', paddingRight: '20px'}}>
            <div 
                className="grid gap-4" 
                style={{
                    gridTemplateColumns: getGridColumns(isRightSidebarCollapsed),
                    transition: 'grid-template-columns 0.3s ease'
                }}
            >
                {/* Conteúdo principal */}
                <div style={{ minWidth: 0 }}>
                    {/* Sistema de Abas */}
                    <div className="mb-8" style={{marginTop: '-15px'}}>
                {/* Abas */}
                <div className="flex justify-start mb-2" style={{gap: '2rem'}}>
                    <button
                        onClick={() => setActiveTab('solicitar')}
                        className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'solicitar' ? '' : 'opacity-50'}`}
                        style={{
                            color: activeTab === 'solicitar' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
                        }}
                    >
                        Solicite Apoio
                    </button>
                    <button
                        onClick={() => setActiveTab('acompanhar')}
                        className={`px-6 py-3 text-2xl font-semibold transition-colors duration-200 ${activeTab === 'acompanhar' ? '' : 'opacity-50'}`}
                        style={{
                            color: activeTab === 'acompanhar' ? 'var(--blue-light)' : 'var(--cor-texto-secundario)'
                        }}
                    >
                        Acompanhe seus Tickets
                    </button>
                </div>
                
                {/* Linha divisória */}
                <div className="w-full" style={{ height: '1px', backgroundColor: 'var(--cor-borda)', opacity: 0.5 }}></div>
            </div>

            {/* Conte├║do baseado na aba ativa */}
            {activeTab === 'solicitar' && (
            <div className="space-y-4">
                {/* Primeira linha - Artigo, Processo, Roteiro */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supportItems.slice(0, 3).map(item => (
                    <button 
                        key={item.name} 
                        onClick={() => handleCardClick(item)}
                        className="rounded-lg flex flex-col items-center justify-center velohub-card" 
                        style={{
                            padding: '18.432px',
                            borderRadius: '11.52px',
                            boxShadow: '0 5.76px 23.04px rgba(0, 0, 0, 0.1)',
                            transition: 'box-shadow 0.3s ease, border 0.3s ease, transform 0.3s ease',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            width: '100%',
                            height: 'auto'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 16px 32px rgba(0, 0, 0, 0.15)';
                            e.currentTarget.style.outline = '2px solid var(--blue-medium)';
                            e.currentTarget.style.outlineOffset = '-2px';
                            e.currentTarget.style.transform = 'translateY(-3.2px)';
                            // Barra superior animada
                            e.currentTarget.style.setProperty('--bar-width', '100%');
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 6.4px 25.6px rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.outline = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                            // Barra superior desaparece
                            e.currentTarget.style.setProperty('--bar-width', '0%');
                        }}
                    >
                        {/* Barra Superior Animada */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3.2px',
                            background: 'linear-gradient(90deg, var(--blue-medium), var(--blue-light), var(--blue-medium))',
                            transform: 'scaleX(var(--bar-width, 0%))',
                            transition: 'transform 0.3s ease',
                            zIndex: 1
                        }}></div>
                        <div className="text-blue-500 dark:text-blue-400 mb-3">{item.icon}</div>
                        <span className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{item.name}</span>
                        <p className="text-xs text-center" style={{color: 'var(--cor-texto-secundario)'}}>
                            {item.description}
                        </p>
                    </button>
                ))}
                </div>

                {/* Linha separadora */}
                <div className="w-full h-px" style={{ backgroundColor: 'var(--cor-borda)', opacity: 0.5 }}></div>

                {/* Segunda linha - Treinamento, Funcionalidade, Recurso Adicional */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supportItems.slice(3, 6).map(item => (
                    <button 
                        key={item.name} 
                        onClick={() => handleCardClick(item)}
                        className="rounded-lg flex flex-col items-center justify-center velohub-card" 
                        style={{
                            padding: '18.432px',
                            borderRadius: '11.52px',
                            boxShadow: '0 5.76px 23.04px rgba(0, 0, 0, 0.1)',
                            transition: 'box-shadow 0.3s ease, border 0.3s ease, transform 0.3s ease',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            width: '100%',
                            height: 'auto'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 16px 32px rgba(0, 0, 0, 0.15)';
                            e.currentTarget.style.outline = '2px solid var(--blue-medium)';
                            e.currentTarget.style.outlineOffset = '-2px';
                            e.currentTarget.style.transform = 'translateY(-3.2px)';
                            // Barra superior animada
                            e.currentTarget.style.setProperty('--bar-width', '100%');
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 6.4px 25.6px rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.outline = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                            // Barra superior desaparece
                            e.currentTarget.style.setProperty('--bar-width', '0%');
                        }}
                    >
                        {/* Barra Superior Animada */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3.2px',
                            background: 'linear-gradient(90deg, var(--blue-medium), var(--blue-light), var(--blue-medium))',
                            transform: 'scaleX(var(--bar-width, 0%))',
                            transition: 'transform 0.3s ease',
                            zIndex: 1
                        }}></div>
                        <div className="text-blue-500 dark:text-blue-400 mb-3">{item.icon}</div>
                        <span className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{item.name}</span>
                        <p className="text-xs text-center" style={{color: 'var(--cor-texto-secundario)'}}>
                            {item.description}
                        </p>
                    </button>
                ))}
                </div>

                {/* Linha separadora */}
                <div className="w-full h-px" style={{ backgroundColor: 'var(--cor-borda)', opacity: 0.5 }}></div>

                {/* Terceira linha - Gest├úo, RH e Financeiro, Facilities */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supportItems.slice(6, 9).map(item => {
                    const isDisabled = item.type === 'rh_financeiro' || item.type === 'facilities';
                    return (
                    <button 
                        key={item.name} 
                        onClick={() => !isDisabled && handleCardClick(item)}
                        className="rounded-lg flex flex-col items-center justify-center velohub-card" 
                        style={{
                            padding: '18.432px',
                            borderRadius: '11.52px',
                            boxShadow: '0 5.76px 23.04px rgba(0, 0, 0, 0.1)',
                            transition: 'box-shadow 0.3s ease, border 0.3s ease, transform 0.3s ease',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            width: '100%',
                            height: 'auto',
                            opacity: isDisabled ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!isDisabled) {
                                e.currentTarget.style.boxShadow = '0 16px 32px rgba(0, 0, 0, 0.15)';
                                e.currentTarget.style.outline = '2px solid var(--blue-medium)';
                                e.currentTarget.style.outlineOffset = '-2px';
                                e.currentTarget.style.transform = 'translateY(-3.2px)';
                                // Barra superior animada
                                e.currentTarget.style.setProperty('--bar-width', '100%');
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isDisabled) {
                                e.currentTarget.style.boxShadow = '0 6.4px 25.6px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.outline = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                                // Barra superior desaparece
                                e.currentTarget.style.setProperty('--bar-width', '0%');
                            }
                        }}
                    >
                        {/* Barra Superior Animada */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3.2px',
                            background: 'linear-gradient(90deg, var(--blue-medium), var(--blue-light), var(--blue-medium))',
                            transform: 'scaleX(var(--bar-width, 0%))',
                            transition: 'transform 0.3s ease',
                            zIndex: 1
                        }}></div>
                        <div className="text-blue-500 dark:text-blue-400 mb-3">{item.icon}</div>
                        <span className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{item.name}</span>
                        <p className="text-xs text-center" style={{color: 'var(--cor-texto-secundario)'}}>
                            {item.description}
                        </p>
                        {/* Overlay "EM BREVE" para cards desativados */}
                        {isDisabled && (
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
                                borderRadius: '11.52px',
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
                        )}
                    </button>
                    );
                })}
                </div>
            </div>
            )}

                    {/* Aba Acompanhe seus Tickets */}
                    {activeTab === 'acompanhar' && (
                        <TicketsListPage />
                    )}

                    {/* Modal */}
                    {activeModal && (
                        <SupportModal
                            isOpen={!!activeModal}
                            onClose={handleCloseModal}
                            type={activeModal.type}
                            title={activeModal.title}
                        />
                    )}
                </div>
                
                {/* Sidebar direito com chat */}
                {renderRightSidebarChat({
                    isCollapsed: isRightSidebarCollapsed,
                    onToggleCollapse: () => setIsRightSidebarCollapsed(!isRightSidebarCollapsed),
                    activeTab: chatActiveTab,
                    setActiveTab: setChatActiveTab,
                    isSearchExpanded,
                    setIsSearchExpanded,
                    searchQuery,
                    setSearchQuery,
                    soundEnabled,
                    toggleSound,
                    chatRefreshTrigger,
                    handleChatRefresh,
                    isRefreshing
                })}
            </div>
        </div>
    );
};

// P├ígina de Artigos
function ArtigosPage() {
    const [articles, setArticles] = useState([]);
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [categories, setCategories] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [expandedImage, setExpandedImage] = useState(null);
    
    // Estados do sidebar direito com chat
    const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true); // Recolhido por padrão
    const [activeTab, setActiveTab] = useState('conversations');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [soundEnabled, setSoundEnabled] = useState(() => {
        try {
            return localStorage.getItem('velochat_sound_enabled') !== 'false';
        } catch {
            return true;
        }
    });
    
    // Estados para refresh do chat
    const [chatRefreshTrigger, setChatRefreshTrigger] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const toggleSound = () => {
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        try {
            localStorage.setItem('velochat_sound_enabled', newState.toString());
        } catch (error) {
            console.error('Erro ao salvar preferência de som:', error);
        }
    };
    
    // Função para refresh do chat
    const handleChatRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setChatRefreshTrigger(prev => prev + 1);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };
    
    // Função para calcular grid columns
    const getGridColumns = (rightCollapsed) => {
        if (rightCollapsed) {
            return '1fr 10px';
        } else {
            return 'minmax(0, 1fr) minmax(0, 35%)';
        }
    };

    // Fun├º├úo para renderizar HTML de forma segura
    const renderHTML = (htmlContent) => {
        if (!htmlContent) return '';
        return { __html: htmlContent };
    };

    // Fun├º├úo para buscar artigos por t├¡tulo e palavras-chave
    const searchArticles = (term, articlesList) => {
        if (!term || term.trim() === '') {
            return articlesList;
        }

        const searchTerm = term.toLowerCase().trim();
        
        return articlesList.filter(article => {
            // Buscar no t├¡tulo
            const titleMatch = article.title && article.title.toLowerCase().includes(searchTerm);
            
            // Buscar no conte├║do (removendo tags HTML)
            const contentText = article.content ? article.content.replace(/<[^>]*>/g, '').toLowerCase() : '';
            const contentMatch = contentText.includes(searchTerm);
            
            // Buscar na tag (campo do schema)
            const tagMatch = article.tag && article.tag.toLowerCase().includes(searchTerm);
            
            // Buscar na categoria
            const categoryMatch = article.category && article.category.toLowerCase().includes(searchTerm);
            
            return titleMatch || contentMatch || tagMatch || categoryMatch;
        });
    };

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                setLoading(true);
                const response = await articlesAPI.getAll();
                console.log('Artigos carregados:', response.data);
                
                if (response.data && response.data.length > 0) {
                    setArticles(response.data);
                } else {
                    console.warn('ÔÜá´©Å Dados de artigos n├úo encontrados ou vazios, usando mock...');
                    throw new Error('Dados vazios da API');
                }
            } catch (error) {
                console.error('Erro ao carregar artigos da API:', error);
                console.log('🔄 Usando dados mock como fallback...');
                
                // Em caso de erro, usar arrays vazios
                console.warn('ÔÜá´©Å Usando arrays vazios como fallback');
                setArticles([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchArticles();
    }, []);

    // Extrair categorias ├║nicas dos artigos
    useEffect(() => {
        if (articles.length > 0) {
            const uniqueCategories = ['Todas', ...new Set(articles.map(article => article.category).filter(Boolean))];
            setCategories(uniqueCategories);
        }
    }, [articles]);

    // Debounce para o termo de busca
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Filtrar artigos por categoria e busca
    useEffect(() => {
        let filtered = articles;
        
        // Filtrar por categoria
        if (selectedCategory !== 'Todas') {
            filtered = filtered.filter(article => article.category === selectedCategory);
        }
        
        // Aplicar busca se houver termo de busca
        if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
            filtered = searchArticles(debouncedSearchTerm, filtered);
        }
        
        setFilteredArticles(filtered);
    }, [selectedCategory, articles, debouncedSearchTerm]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    const handleSearchChange = (term) => {
        setSearchTerm(term);
    };

    const handleArticleClick = (article) => {
        setSelectedArticle(article);
    };

    return (
        <div className="w-full py-8" style={{paddingLeft: '20px', paddingRight: '20px'}}>
            <div 
                className="grid gap-4" 
                style={{
                    gridTemplateColumns: getGridColumns(isRightSidebarCollapsed),
                    transition: 'grid-template-columns 0.3s ease'
                }}
            >
                {/* Conteúdo principal com categorias e artigos */}
                <div className="grid grid-cols-1 lg:grid-cols-4" style={{gap: '30px', minWidth: 0}}>
                    {/* Sidebar de Categorias */}
                    <aside className="lg:col-span-1 p-6 rounded-lg shadow-sm h-fit velohub-container" style={{borderRadius: '9.6px', boxShadow: '0 3.2px 16px rgba(0, 0, 0, 0.1)', padding: '19.2px'}}>
                    {/* Campo de Busca */}
                    <div className="mb-6">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Buscar artigos..."
                                className="w-full px-4 pl-12 pr-4 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                style={{
                                    backgroundColor: 'var(--cor-container)',
                                    color: 'var(--cor-texto-principal)',
                                    borderColor: 'var(--cor-borda)',
                                    paddingTop: '8px',
                                    paddingBottom: '8px',
                                    borderRadius: '16px'
                                }}
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            {searchTerm && (
                                <button
                                    onClick={() => handleSearchChange('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        
                        {/* Indicador de resultados */}
                        {debouncedSearchTerm && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {filteredArticles.length > 0 ? (
                                    <span>
                                        {filteredArticles.length} artigo{filteredArticles.length !== 1 ? 's' : ''} encontrado{filteredArticles.length !== 1 ? 's' : ''} para "{debouncedSearchTerm}"
                                    </span>
                                ) : (
                                    <span className="text-red-500 dark:text-red-400">
                                        Nenhum artigo encontrado para "{debouncedSearchTerm}"
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <h3 className="font-bold text-xl mb-4 border-b pb-2 text-center velohub-title" style={{borderColor: 'var(--blue-opaque)'}}>
                        Categorias
                    </h3>
                    
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">Carregando...</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {categories.map((category, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleCategoryChange(category)}
                                    className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 text-sm ${
                                        selectedCategory === category
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {!loading && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {debouncedSearchTerm ? (
                                    <span>
                                        {filteredArticles.length} de {articles.length} artigo{articles.length !== 1 ? 's' : ''}
                                    </span>
                                ) : (
                                    <span>
                                        {filteredArticles.length} artigo{filteredArticles.length !== 1 ? 's' : ''} encontrado{filteredArticles.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </p>
                        </div>
                    )}
                </aside>

                {/* Lista de Artigos */}
                <div className="lg:col-span-3">
                    {loading && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400 mt-4">Carregando artigos...</p>
                        </div>
                    )}
                    
                    {!loading && (
                        <>
                            {filteredArticles.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2" style={{gap: '25px'}}>
                                    {filteredArticles.map(article => (
                                         <div 
                                             key={article._id || article.id} 
                                             className="rounded-lg shadow-md p-6 cursor-pointer velohub-card"
                                             style={{
                                                 borderRadius: '16px',
                                                 boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                                                 transition: 'box-shadow 0.3s ease, border 0.3s ease',
                                                 cursor: 'pointer',
                                                 position: 'relative',
                                                 overflow: 'hidden',
                                                 width: '100%',
                                                 height: 'auto'
                                             }}
                                             onMouseEnter={(e) => {
                                                 e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                                                 e.currentTarget.style.outline = '2px solid var(--blue-medium)';
                                                 e.currentTarget.style.outlineOffset = '-2px';
                                                 // Barra superior animada
                                                 e.currentTarget.style.setProperty('--bar-width', '100%');
                                             }}
                                             onMouseLeave={(e) => {
                                                 e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                                                 e.currentTarget.style.outline = 'none';
                                                 // Barra superior desaparece
                                                 e.currentTarget.style.setProperty('--bar-width', '0%');
                                             }}
                                             onClick={() => handleArticleClick(article)}
                                         >
                                             {/* Barra Superior Animada */}
                                             <div style={{
                                                 position: 'absolute',
                                                 top: 0,
                                                 left: 0,
                                                 right: 0,
                                                 height: '4px',
                                                 background: 'linear-gradient(90deg, var(--blue-medium), var(--blue-light), var(--blue-medium))',
                                                 transform: 'scaleX(var(--bar-width, 0%))',
                                                 transition: 'transform 0.3s ease',
                                                 zIndex: 1
                                             }}></div>
                                            <div className="mb-3 flex justify-between items-start">
                                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                                                    {article.category}
                                                </span>
                                                {article.createdAt && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(article.createdAt).toLocaleDateString('pt-BR')}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">{article.title}</h3>
                                            
                                            {/* Renderizar primeira imagem se existir */}
                                            {getImageUrl(article) && (
                                                <div className="mb-3">
                                                    <div className="relative inline-block" style={{ 
                                                        maxWidth: '280px', 
                                                        width: '100%',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        border: '1px solid #e5e7eb'
                                                    }}>
                                                        <img 
                                                            src={getImageUrl(article)} 
                                                            alt={article.title}
                                                            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                                            style={{
                                                                maxHeight: '120px',
                                                                width: '100%',
                                                                objectFit: 'cover',
                                                                display: 'block'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedArticle(article);
                                                            }}
                                                            onError={(e) => {
                                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="280" height="120"%3E%3Crect width="280" height="120" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="12"%3EImagem n├úo encontrada%3C/text%3E%3C/svg%3E';
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {article.content && (
                                                 <div 
                                                     className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
                                                     dangerouslySetInnerHTML={{ __html: processContentHtml(formatArticleContent(article.content, 200), article?.media?.images || []) }}
                                                 />
                                            )}
                                            {article.tag && (
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                                                        {article.tag}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                                        Nenhum artigo encontrado na categoria "{selectedCategory}"
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
                </div>
                
                {/* Sidebar direito com chat */}
                {renderRightSidebarChat({
                    isCollapsed: isRightSidebarCollapsed,
                    onToggleCollapse: () => setIsRightSidebarCollapsed(!isRightSidebarCollapsed),
                    activeTab,
                    setActiveTab,
                    isSearchExpanded,
                    setIsSearchExpanded,
                    searchQuery,
                    setSearchQuery,
                    soundEnabled,
                    toggleSound,
                    chatRefreshTrigger,
                    handleChatRefresh,
                    isRefreshing
                })}
            </div>

            {/* Modal do Artigo */}
            {selectedArticle && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
                                         <div className="rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden bg-white dark:bg-gray-800" style={{borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)', zIndex: 10000}}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                                    {selectedArticle.category}
                                </span>
                                {selectedArticle.createdAt && (
                                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(selectedArticle.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => setSelectedArticle(null)}
                                className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white text-2xl font-bold"
                            >
                                ├ù
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
                                {selectedArticle.title}
                            </h2>
                            
                            {/* Renderizar todas as imagens */}
                            {(() => {
                                const allImages = getAllImages(selectedArticle);
                                return allImages.length > 0 && (
                                    <div className="mb-6 space-y-3">
                                        {allImages.map((imgUrl, idx) => {
                                            if (!imgUrl) return null;
                                            return (
                                                <div key={idx} className="relative">
                                                    <img 
                                                        src={imgUrl} 
                                                        alt={`${selectedArticle.title || selectedArticle.titulo} - Imagem ${idx + 1}`}
                                                        className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                                                        onClick={() => setExpandedImage(imgUrl)}
                                                        onError={(e) => {
                                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect width="400" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="14"%3EImagem n├úo encontrada%3C/text%3E%3C/svg%3E';
                                                        }}
                                                    />
                                                    <div className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                        Clique para expandir
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                            
                            {/* Renderizar v├¡deos do YouTube */}
                            {(() => {
                                const videos = selectedArticle?.media?.videos || selectedArticle?.videos || [];
                                console.log('📹 Modal Artigo (ArtigosPage) - vídeos encontrados:', videos);
                                
                                // Processar v├¡deos (podem ser strings ou objetos)
                                const youtubeVideos = videos
                                    .map(v => {
                                        if (typeof v === 'string') {
                                            // ├ë uma string de URL
                                            if (v.includes('youtube.com') || v.includes('youtu.be')) {
                                                return { url: v, embed: convertYouTubeUrlToEmbed(v) };
                                            }
                                            return null;
                                        } else if (v && typeof v === 'object') {
                                            // ├ë um objeto
                                            if (v.type === 'youtube' || v.embed || v.url) {
                                                return {
                                                    url: v.url || v.embed || '',
                                                    embed: v.embed || convertYouTubeUrlToEmbed(v.url || v.embed || '')
                                                };
                                            }
                                        }
                                        return null;
                                    })
                                    .filter(v => v !== null && v.embed);
                                
                                console.log('📹 Modal Artigo (ArtigosPage) - vídeos processados:', youtubeVideos);
                                
                                return youtubeVideos.length > 0 ? (
                                    <div className="mb-6 space-y-3">
                                        {youtubeVideos.map((vid, idx) => {
                                            if (!vid.embed) return null;
                                            // Detectar se ├® Shorts para aplicar propor├º├úo 9:16 com tamanho limitado
                                            const isShorts = isYouTubeShorts(vid.url);
                                            if (isShorts) {
                                                // Para Shorts: propor├º├úo 9:16 (largura:altura = 9:16)
                                                // Definir altura m├íxima e calcular largura, ou vice-versa
                                                // Altura m├íxima de 400px -> largura = 400 ├ù (9/16) = 225px
                                                return (
                                                    <div key={idx} className="flex justify-center">
                                                        <div className="relative rounded-lg overflow-hidden" style={{ width: '225px', maxWidth: '100%', height: '400px', maxHeight: '50vh' }}>
                                                            <iframe
                                                                src={vid.embed}
                                                                className="w-full h-full rounded-lg"
                                                                frameBorder="0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // Para v├¡deos normais: propor├º├úo 16:9 padr├úo
                                                return (
                                                    <div key={idx} className="relative w-full" style={{ paddingBottom: '56.25%', height: 0 }}>
                                                        <iframe
                                                            src={vid.embed}
                                                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    </div>
                                                );
                                            }
                                        })}
                                    </div>
                                ) : null;
                            })()}
                            
                            <div 
                                className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                dangerouslySetInnerHTML={{ __html: processContentHtml(formatResponseText(selectedArticle.content, 'article'), selectedArticle?.media?.images || []) }}
                            />
                            
                            {selectedArticle.tag && (
                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Tag:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
                                            {selectedArticle.tag}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de imagem expandida */}
            {expandedImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60] p-4"
                    onClick={() => setExpandedImage(null)}
                >
                    <button 
                        onClick={() => setExpandedImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl z-10"
                        style={{ fontSize: '2rem' }}
                    >
                        &times;
                    </button>
                    <img 
                        src={expandedImage} 
                        alt="Imagem expandida"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
            
        </div>
    );
};

// P├ígina de Processos (Chatbot)
function ProcessosPage() {
    const [promptFromFaq, setPromptFromFaq] = useState(null);
    const [faq, setFaq] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados do sidebar direito com chat
    const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true); // Recolhido por padrão
    const [activeTab, setActiveTab] = useState('conversations');
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
    
    // Estados para refresh do chat
    const [chatRefreshTrigger, setChatRefreshTrigger] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Função para atualizar o chat (refresh)
    const handleChatRefresh = () => {
        setIsRefreshing(true);
        setChatRefreshTrigger(prev => prev + 1);
        // Resetar animação após 600ms (tempo da rotação)
        setTimeout(() => {
            setIsRefreshing(false);
        }, 600);
    };
    
    // Função para calcular grid columns
    const getGridColumns = (rightCollapsed) => {
        if (rightCollapsed) {
            return '1fr 10px';
        } else {
            return 'minmax(0, 1fr) minmax(0, 35%)';
        }
    };

    useEffect(() => {
        const fetchTop10FAQ = async () => {
            try {
                setLoading(true);
                
                // Usar novo endpoint do backend para Top 10 FAQ
                const response = await fetch(`${API_BASE_URL}/faq/top10`);
                const result = await response.json();
                
                console.log('Top 10 FAQ carregado:', result);
                
                if (result.success && result.data && result.data.length > 0) {
                    setFaq(result.data);
                } else {
                    console.warn('ÔÜá´©Å Nenhuma pergunta frequente encontrada');
                    setFaq([]);
                }
            } catch (error) {
                console.error('Erro ao carregar Top 10 FAQ do backend:', error);
                console.log('🔄 Usando fallback para FAQ padrão...');
                
                // Fallback para FAQ padr├úo se Apps Script falhar
                try {
                    const fallbackResponse = await faqAPI.getAll();
                    if (fallbackResponse.data && fallbackResponse.data.length > 0) {
                        setFaq(fallbackResponse.data.slice(0, 10)); // Pegar apenas 10
                    } else {
                        setFaq([]);
                    }
                } catch (fallbackError) {
                    console.error('Erro no fallback FAQ:', fallbackError);
                    setFaq([]);
                }
            } finally {
                setLoading(false);
            }
        };
        
        fetchTop10FAQ();
    }, []);

    const handleFaqClick = (question) => {
        setPromptFromFaq({ text: question, id: Date.now() }); 
    };

    return (
        <div className="w-full py-8" style={{paddingLeft: '20px', paddingRight: '20px'}}>
            <div 
                className="grid gap-4" 
                style={{
                    gridTemplateColumns: getGridColumns(isRightSidebarCollapsed),
                    transition: 'grid-template-columns 0.3s ease'
                }}
            >
                {/* Conteúdo principal com FAQ e Chatbot */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8" style={{ minWidth: 0 }}>
                    <div className="lg:col-span-3">
                        <Chatbot prompt={promptFromFaq} />
                    </div>
                    <aside className="lg:col-span-1 p-6 rounded-lg shadow-sm h-fit velohub-container" style={{borderRadius: '9.6px', boxShadow: '0 3.2px 16px rgba(0, 0, 0, 0.1)', padding: '19.2px'}}>
                        <h3 className="font-bold text-xl mb-4 border-b pb-2 text-center velohub-title" style={{borderColor: 'var(--blue-opaque)'}}>Perguntas Frequentes</h3>
                        
                        {loading && (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">Carregando...</p>
                            </div>
                        )}
                        
                        {!loading && (
                            <>
                                <ul className="space-y-3">
                                    {faq.slice(0, 10).map((item, index) => {
                                        const questionText = item.pergunta || item.question || 'Pergunta não disponível';
                                        return (
                                            <li key={index} onClick={() => handleFaqClick(questionText)} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-sm">
                                                {questionText}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </>
                        )}
                    </aside>
                </div>
                
                {/* Sidebar direito com chat */}
                {renderRightSidebarChat({
                    isCollapsed: isRightSidebarCollapsed,
                    onToggleCollapse: () => setIsRightSidebarCollapsed(!isRightSidebarCollapsed),
                    activeTab,
                    setActiveTab,
                    isSearchExpanded,
                    setIsSearchExpanded,
                    searchQuery,
                    setSearchQuery,
                    soundEnabled,
                    toggleSound,
                    chatRefreshTrigger,
                    handleChatRefresh,
                    isRefreshing
                })}
            </div>
        </div>
    );
};

// Componente FeedbackModal - REMOVIDO (agora no componente Chatbot)

// Componente do Chatbot - REMOVIDO (agora usando componente separado)
