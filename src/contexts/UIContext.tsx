import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface UIContextType {
  isProfileMenuOpen: boolean;
  setProfileMenuOpen: (isOpen: boolean) => void;
  toggleProfileMenu: () => void;
  closeProfileMenu: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();

  // Fechar o menu quando o caminho da URL mudar
  useEffect(() => {
    // Apenas fechamos o menu ao navegar para certas páginas específicas
    // como profile e admin, pois eles já são acessados via menu
    if (location.pathname === '/profile' || location.pathname === '/admin') {
      setProfileMenuOpen(false);
    }
  }, [location.pathname]);

  // Adicionar listener para fechar o menu quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const profileButton = document.querySelector('.profile-button');
      const profileMenu = document.querySelector('.profile-menu');
      
      // Não fechar o menu se clicar no botão de perfil ou no próprio menu
      if (
        profileButton && 
        profileMenu && 
        !profileButton.contains(target) && 
        !profileMenu.contains(target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const toggleProfileMenu = () => {
    setProfileMenuOpen(prev => !prev);
  };

  const closeProfileMenu = () => {
    setProfileMenuOpen(false);
  };

  const value = {
    isProfileMenuOpen,
    setProfileMenuOpen,
    toggleProfileMenu,
    closeProfileMenu
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export default UIProvider;
