// Função para gerar uma cor aleatória consistente baseada no nome do usuário
export const getConsistentColor = (name: string): string => {
  // Usar o nome como seed para gerar uma cor consistente para o mesmo usuário
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Lista de cores vibrantes para o fundo (excluindo cores muito claras)
  const colors = [
    '#3498db', // Azul
    '#2ecc71', // Verde
    '#9b59b6', // Roxo
    '#e74c3c', // Vermelho
    '#f39c12', // Laranja
    '#1abc9c', // Verde água
    '#d35400', // Laranja escuro
    '#8e44ad', // Roxo escuro
    '#27ae60', // Verde escuro
    '#c0392b', // Vermelho escuro
    '#16a085', // Verde água escuro
    '#2980b9', // Azul escuro
    '#f1c40f'  // Amarelo
  ];
  
  // Usar o hash para selecionar uma cor da lista
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Função para obter as iniciais do nome do usuário
export const getInitials = (name: string): string => {
  if (!name) return '?';
  
  // Remover espaços extras e dividir por espaços
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  // Se tiver mais de um nome, pegar primeira letra do primeiro e último nome
  // Se for apenas um nome, pegar só a primeira letra
  return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '')).toUpperCase();
};

// Função para gerar um avatar SVG com iniciais
export const generateAvatarSvg = (name: string, size: number = 40): string => {
  const initials = getInitials(name);
  const bgColor = getConsistentColor(name);
  
  // Definir o tamanho da fonte baseado no tamanho do avatar e na quantidade de letras
  const fontSize = Math.floor(size * 0.4);
  
  // Criar o SVG
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${bgColor}" rx="${size/2}" ry="${size/2}" />
      <text x="50%" y="50%" dy=".1em" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}px" font-weight="bold" text-anchor="middle" dominant-baseline="middle">
        ${initials}
      </text>
    </svg>
  `;
  
  // Converter para data URL
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
