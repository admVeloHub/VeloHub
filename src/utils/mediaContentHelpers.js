/**
 * VeloHub V3 — Helpers de mídia para feeds e modais
 * VERSION: v1.0.0 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 */

import { API_BASE_URL } from '../config/api-config';

export const getImageUrl = (item) => {
  const images = item?.media?.images || item?.images || [];
  if (!Array.isArray(images) || images.length === 0) return null;

  const firstImage = images[0];

  if (
    typeof firstImage === 'string' &&
    (firstImage.startsWith('img_velonews/') ||
      firstImage.startsWith('img_artigos/') ||
      firstImage.startsWith('/img_velonews/') ||
      firstImage.startsWith('/img_artigos/'))
  ) {
    const cleanPath = firstImage.startsWith('/') ? firstImage.substring(1) : firstImage;
    const encodedPath = cleanPath.split('/').map((part) => encodeURIComponent(part)).join('/');
    return `${API_BASE_URL}/images/${encodedPath}`;
  }

  if (firstImage && typeof firstImage === 'object' && firstImage.path) {
    const cleanPath = firstImage.path.startsWith('/') ? firstImage.path.substring(1) : firstImage.path;
    const encodedPath = cleanPath.split('/').map((part) => encodeURIComponent(part)).join('/');
    return `${API_BASE_URL}/images/${encodedPath}`;
  }

  if (typeof firstImage === 'string' && firstImage.startsWith('http')) return firstImage;
  if (firstImage?.url?.startsWith('http')) return firstImage.url;

  if (typeof firstImage === 'string') {
    if (!firstImage.startsWith('http') && !firstImage.startsWith('img_velonews/') && !firstImage.startsWith('img_artigos/')) {
      return firstImage.includes('data:') ? firstImage : `data:image/jpeg;base64,${firstImage}`;
    }
  }

  if (firstImage?.data) {
    const imageData = firstImage.data;
    if (typeof imageData === 'string' && !imageData.startsWith('http') && !imageData.startsWith('img_velonews/') && !imageData.startsWith('img_artigos/')) {
      return imageData.includes('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
    }
  }

  return null;
};

export const getYouTubeThumbnail = (item) => {
  const videos = item?.media?.videos || item?.videos || [];
  if (!Array.isArray(videos) || videos.length === 0) return null;

  let youtubeUrl = null;
  for (const v of videos) {
    if (typeof v === 'string' && (v.includes('youtube.com') || v.includes('youtu.be'))) {
      youtubeUrl = v;
      break;
    }
    if (v && typeof v === 'object' && (v.type === 'youtube' || v.embed || v.url)) {
      youtubeUrl = v.url || v.embed || '';
      break;
    }
  }

  if (!youtubeUrl) return null;
  const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^"&?/\s]{11})/);
  if (!videoIdMatch?.[1]) return null;
  return `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
};

export const isYouTubeShorts = (url) => url && typeof url === 'string' && url.includes('youtube.com/shorts/');

export const convertYouTubeUrlToEmbed = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.includes('youtube.com/embed/')) return url;
  const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^"&?/\s]{11})/);
  if (!videoIdMatch?.[1]) return null;
  return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
};

export const getYouTubeEmbedUrl = (item) => {
  const videos = item?.media?.videos || item?.videos || [];
  if (!Array.isArray(videos) || videos.length === 0) return null;

  let youtubeUrl = null;
  for (const v of videos) {
    if (typeof v === 'string' && (v.includes('youtube.com') || v.includes('youtu.be'))) {
      youtubeUrl = v;
      break;
    }
    if (v && typeof v === 'object' && (v.type === 'youtube' || v.embed || v.url)) {
      youtubeUrl = v.embed || v.url || '';
      break;
    }
  }
  if (!youtubeUrl) return null;
  if (typeof youtubeUrl === 'string' && youtubeUrl.includes('youtube.com/embed/')) return youtubeUrl;
  return convertYouTubeUrlToEmbed(youtubeUrl);
};

export const getAllImages = (item) => {
  const images = item?.media?.images || item?.images || [];
  if (!Array.isArray(images) || images.length === 0) return [];

  return images
    .map((img) => {
      if (
        typeof img === 'string' &&
        (img.startsWith('img_velonews/') ||
          img.startsWith('img_artigos/') ||
          img.startsWith('/img_velonews/') ||
          img.startsWith('/img_artigos/'))
      ) {
        const cleanPath = img.startsWith('/') ? img.substring(1) : img;
        const encodedPath = cleanPath.split('/').map((part) => encodeURIComponent(part)).join('/');
        return `${API_BASE_URL}/images/${encodedPath}`;
      }
      if (img?.path) {
        const cleanPath = img.path.startsWith('/') ? img.path.substring(1) : img.path;
        const encodedPath = cleanPath.split('/').map((part) => encodeURIComponent(part)).join('/');
        return `${API_BASE_URL}/images/${encodedPath}`;
      }
      if (typeof img === 'string' && img.startsWith('http')) return img;
      if (img?.url?.startsWith('http')) return img.url;
      if (typeof img === 'string' && !img.startsWith('http') && !img.startsWith('img_velonews/') && !img.startsWith('img_artigos/')) {
        return img.includes('data:') ? img : `data:image/jpeg;base64,${img}`;
      }
      if (img?.data) {
        const imageData = img.data;
        if (typeof imageData === 'string' && !imageData.startsWith('http') && !imageData.startsWith('img_velonews/') && !imageData.startsWith('img_artigos/')) {
          return imageData.includes('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
        }
      }
      return null;
    })
    .filter(Boolean);
};
