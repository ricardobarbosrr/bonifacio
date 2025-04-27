/**
 * Script para interceptar requisições de imagens para domínios indisponíveis
 * e substituir por uma imagem local de placeholder
 */
(function() {
  // Base64 de uma imagem placeholder simples
  const PLACEHOLDER_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  
  // Lista de domínios a interceptar
  const DOMAINS_TO_INTERCEPT = [
    'via.placeholder.com',
    'placeholder.com'
  ];
  
  // Intercepta erros de carregamento de imagens
  document.addEventListener('error', function(e) {
    const target = e.target;
    
    // Verifica se é um elemento de imagem
    if (target.tagName === 'IMG') {
      const src = target.src || '';
      
      // Verifica se a URL da imagem contém algum dos domínios a interceptar
      if (DOMAINS_TO_INTERCEPT.some(domain => src.includes(domain))) {
        console.log('Interceptando imagem de placeholder:', src);
        target.src = PLACEHOLDER_IMAGE_BASE64;
      }
    }
  }, true); // Usar captura para pegar o evento antes que ele chegue ao alvo
})();
