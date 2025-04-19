/**
 * Utilitários para manipulação de fotos de perfil locais
 */
import { generateAvatarSvg } from './avatarUtils';

/**
 * Converte um arquivo de imagem para base64 para exibição local
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Recupera a foto do usuário do localStorage
 */
export const getProfilePhotoFromLocalStorage = (photoURL: string | null): string | null => {
  if (!photoURL) return null;
  
  // Verifica se é uma referência local
  if (photoURL.startsWith('local:')) {
    const storageKey = photoURL.replace('local:', '');
    const photoData = localStorage.getItem(storageKey);
    console.log('Recuperando foto local:', storageKey, photoData ? 'Encontrada' : 'Não encontrada');
    return photoData;
  }
  
  return photoURL;
};

/**
 * Resolve a URL da foto de perfil do usuário
 */
export const resolveProfilePhotoUrl = (photoURL: string | null | undefined, username?: string | null, size: number = 128): string => {
  if (!photoURL) {
    // Se não tiver foto, mas tiver nome, gera avatar com iniciais
    if (username) {
      return generateAvatarSvg(username, size);
    }
    return 'https://via.placeholder.com/128x128';
  }
  
  // Se for uma URL local, recupera do localStorage
  if (photoURL.startsWith('local:')) {
    const base64Image = getProfilePhotoFromLocalStorage(photoURL);
    if (base64Image) {
      console.log('Foto local resolvida com sucesso');
      return base64Image;
    }
    // Se não encontrar no localStorage, gera avatar com iniciais ou usa placeholder
    if (username) {
      return generateAvatarSvg(username, size);
    }
    return 'https://via.placeholder.com/128x128';
  }
  
  // Se for uma URL HTTP, retorna direto
  if (photoURL.startsWith('http')) {
    return photoURL;
  }
  
  // Se for um caminho relativo, adiciona o prefixo de base
  return photoURL || 'https://via.placeholder.com/128x128';
};

/**
 * Tenta carregar uma foto local, com fallback para avatar ou placeholder
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>, 
  size: string = '40x40',
  username?: string | null
): void => {
  const target = e.target as HTMLImageElement;
  target.onerror = null;
  
  // Se tiver nome, gera um avatar com as iniciais
  if (username) {
    const sizeNum = parseInt(size.split('x')[0], 10) || 40;
    target.src = generateAvatarSvg(username, sizeNum);
  } else {
    target.src = `https://via.placeholder.com/${size}`;
  }
};
