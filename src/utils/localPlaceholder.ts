/**
 * Utilitário para substituir imagens de placeholder externas por uma solução local
 * Isso resolve problemas de conectividade e evita requisições externas desnecessárias
 */

// Base64 de uma imagem simples cinza de placeholder
const PLACEHOLDER_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

/**
 * Retorna uma URL de imagem placeholder local
 * @returns URL da imagem placeholder
 */
export function getLocalPlaceholder(): string {
  return PLACEHOLDER_IMAGE_BASE64;
}

/**
 * Utilidade para lidar com erros de carregamento de imagens
 * @param event Evento de erro
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>): void {
  const target = event.target as HTMLImageElement;
  target.src = PLACEHOLDER_IMAGE_BASE64;
}

/**
 * Substitui uma URL de imagem placeholder externa por uma local
 * @param url URL da imagem
 * @returns URL local se for placeholder, ou a URL original caso contrário
 */
export function replaceExternalPlaceholder(url: string | null | undefined): string {
  if (!url) return PLACEHOLDER_IMAGE_BASE64;
  
  if (url.includes('placeholder.com')) {
    return PLACEHOLDER_IMAGE_BASE64;
  }
  
  return url;
}
