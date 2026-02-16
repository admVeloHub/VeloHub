/**
 * VeloHub V3 - PilulasModal Component
 * VERSION: v1.0.2 | DATE: 2025-02-16 | AUTHOR: VeloHub Development Team
 * 
 * Componente que exibe pílulas (imagens) na parte inferior esquerda da tela a cada 20 minutos.
 * - Timer de 20 minutos entre exibições
 * - Animação de subida do rodapé
 * - Exibição por 10 segundos
 * - Animação de descida
 * - Sem overlay e sem interação do usuário
 * - Modal posicionado no canto esquerdo inferior
 */

import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api-config';

const PilulasModal = () => {
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [animationState, setAnimationState] = useState('hidden'); // hidden, sliding-up, visible, sliding-down
  const [imageLoaded, setImageLoaded] = useState(false);
  const timerRef = useRef(null);
  const visibleTimeoutRef = useRef(null);
  const animationTimeoutRef = useRef(null);

  // Carregar lista de imagens disponíveis
  const loadPilulasList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pilulas/list`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.images) && data.images.length > 0) {
        setImages(data.images);
        console.log(`💊 PilulasModal: Carregadas ${data.images.length} imagens de pílulas`);
      } else {
        console.warn('💊 PilulasModal: Nenhuma imagem de pílula disponível');
        setImages([]);
      }
    } catch (error) {
      console.error('❌ PilulasModal: Erro ao carregar lista de imagens:', error);
      setImages([]);
    }
  };

  // Obter URL da imagem
  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    // Codificar nome do arquivo corretamente
    const encodedName = encodeURIComponent(imageName);
    return `${API_BASE_URL}/images/mediabank_velohub/img_pilulas/${encodedName}`;
  };

  // Efeito para carregar lista de imagens ao montar
  useEffect(() => {
    loadPilulasList();
  }, []);

  // Efeito para gerenciar timer de 25 minutos
  useEffect(() => {
    if (images.length === 0) {
      return; // Não iniciar timer se não houver imagens
    }

    // Limpar timers anteriores
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (visibleTimeoutRef.current) {
      clearTimeout(visibleTimeoutRef.current);
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Função para exibir pílula (definida dentro do useEffect para evitar dependências circulares)
    const showPilulaInternal = () => {
      if (images.length === 0) {
        console.warn('💊 PilulasModal: Nenhuma imagem disponível para exibir');
        return;
      }

      const randomIndex = Math.floor(Math.random() * images.length);
      const selectedImage = images[randomIndex];
      
      if (!selectedImage) {
        console.warn('💊 PilulasModal: Não foi possível selecionar imagem');
        return;
      }

      console.log(`💊 PilulasModal: Exibindo pílula: ${selectedImage}`);
      setCurrentImage(selectedImage);
      setImageLoaded(false);

      // Iniciar animação de subida
      setAnimationState('sliding-up');

      // Após animação de subida (500ms), mudar para visível
      animationTimeoutRef.current = setTimeout(() => {
        setAnimationState('visible');

        // Após 10 segundos visível, iniciar animação de descida
        visibleTimeoutRef.current = setTimeout(() => {
          setAnimationState('sliding-down');

          // Após animação de descida (500ms), voltar para hidden
          animationTimeoutRef.current = setTimeout(() => {
            setAnimationState('hidden');
            setCurrentImage(null);
            setImageLoaded(false);
          }, 500);
        }, 10000); // 10 segundos
      }, 500); // Tempo da animação de subida
    };

    // Timer de 20 minutos (1200000ms)
    console.log('💊 PilulasModal: Timer iniciado (20 minutos)');
    timerRef.current = setInterval(() => {
      showPilulaInternal();
    }, 1200000); // 20 minutos

    // Exibir primeira pílula após 25 minutos (não imediatamente)
    // Se quiser exibir imediatamente na primeira vez, descomente a linha abaixo:
    // showPilulaInternal();

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (visibleTimeoutRef.current) {
        clearTimeout(visibleTimeoutRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [images]);

  // Não renderizar se estiver hidden ou se não houver imagem
  if (animationState === 'hidden' || !currentImage) {
    return null;
  }

  const imageUrl = getImageUrl(currentImage);
  if (!imageUrl) {
    return null;
  }

  // Determinar classe CSS baseada no estado da animação
  const getAnimationClass = () => {
    switch (animationState) {
      case 'sliding-up':
        return 'pilulas-modal pilulas-modal-sliding-up';
      case 'visible':
        return 'pilulas-modal pilulas-modal-visible';
      case 'sliding-down':
        return 'pilulas-modal pilulas-modal-sliding-down';
      default:
        return 'pilulas-modal';
    }
  };

  return (
    <div className={getAnimationClass()} style={{ pointerEvents: 'none' }}>
      <div className="pilulas-modal-content">
        <img
          src={imageUrl}
          alt="Pílula VeloHub"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            console.error('❌ PilulasModal: Erro ao carregar imagem:', imageUrl);
            setImageLoaded(false);
            // Se erro ao carregar, ocultar modal
            setAnimationState('hidden');
            setCurrentImage(null);
          }}
          style={{
            width: '100%',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 40px)',
            objectFit: 'contain',
            display: imageLoaded ? 'block' : 'none',
            borderRadius: '8px'
          }}
        />
        {!imageLoaded && (
          <div style={{
            width: '100%',
            minHeight: '200px',
            aspectRatio: '2/3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--cor-container)',
            color: 'var(--cor-texto-principal)',
            borderRadius: '8px'
          }}>
            Carregando...
          </div>
        )}
      </div>
    </div>
  );
};

export default PilulasModal;
