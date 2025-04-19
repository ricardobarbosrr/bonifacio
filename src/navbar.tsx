import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useUI } from './contexts/UIContext';
import { FaSun, FaMoon, FaCog, FaShieldAlt } from 'react-icons/fa';
import { resolveProfilePhotoUrl } from './utils/profilePhotoUtils';

const Navbar: React.FC = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [profilePhotoSrc, setProfilePhotoSrc] = useState<string>('https://via.placeholder.com/128x128');
  const { isDarkMode, toggleTheme } = useTheme();
  const { isProfileMenuOpen, toggleProfileMenu } = useUI();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      // Passar o nome do usuário para gerar avatar se necessário
      setProfilePhotoSrc(resolveProfilePhotoUrl(currentUser.photoURL || null, currentUser.displayName || '', 128));
    }
  }, [currentUser, currentUser?.photoURL, currentUser?.displayName]);

  // Removendo o redirecionamento automático para permitir que o Navbar seja renderizado
  // mesmo quando não há usuário logado
  
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.displayName || '');
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <header className={`sticky top-0 z-50 shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center relative">
          {/* Logo e nome da aplicação - escondido em mobile/tablet */}
          <div className="hidden md:flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-10 w-10 mr-2" 
                onError={(e) => {
                  // Fallback para texto se a imagem não carregar
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="text-xl font-bold"></span>
            </Link>
          </div>
          
          {/* Logo centralizada em mobile/tablet */}
          <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
            <Link to="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-10 w-10" 
                onError={(e) => {
                  // Fallback para texto se a imagem não carregar
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Link>
          </div>

          {/* Espaço vazio para manter o layout em mobile */}
          <div className="md:hidden w-10"></div>

          {/* Área de ações do usuário */}
          <div className="flex items-center space-x-4">
            {/* Botão de alternar tema */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>

            {/* Exibir botões de login/registro ou perfil do usuário */}
            {currentUser ? (
              <div className="relative">
                <button 
                  onClick={toggleProfileMenu}
                  className={`profile-button flex items-center space-x-2 p-1 rounded-full transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 border-2 border-gray-600' 
                      : 'hover:bg-gray-200 border-2 border-gray-200'
                  }`}
                >
                  <img 
                    src={profilePhotoSrc} 
                    alt="Foto de perfil" 
                    className="h-8 w-8 rounded-full object-cover"
                    onError={(e) => {
                      // Fallback para avatar com iniciais
                      e.currentTarget.src = resolveProfilePhotoUrl(null, username, 32);
                    }}
                  />
                  <span className="hidden md:inline font-medium">{username || 'Usuário'}</span>
                  {isAdmin && (
                    <span className="hidden md:inline text-xs px-2 py-1 rounded-full bg-green-500 text-white">
                      Admin
                    </span>
                  )}
                </button>

                {/* Menu de perfil */}
                {isProfileMenuOpen && (
                  <div className={`profile-menu absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ring-1 ring-opacity-5 focus:outline-none ${
                    isDarkMode 
                      ? 'bg-gray-800 ring-gray-700' 
                      : 'bg-white ring-black'
                  }`}>
                    <div 
                      className={`px-4 py-3 text-sm border-b ${
                        isDarkMode 
                          ? 'bg-gray-900 text-white border-gray-700' 
                          : 'bg-gray-100 text-gray-900 border-gray-200'
                      }`}
                    >
                      <p className="font-medium truncate">{username || 'Usuário'}</p>
                      {currentUser.email && (
                        <p className={`truncate text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {currentUser.email}
                        </p>
                      )}
                    </div>
                    
                    <Link 
                      to="/profile" 
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isDarkMode 
                          ? 'text-gray-200 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <FaCog className={`mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        Editar perfil
                      </div>
                    </Link>
                    
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isDarkMode 
                            ? 'text-gray-200 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <FaShieldAlt className={`mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                          Painel Admin
                        </div>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link 
                        to="/createArticle" 
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isDarkMode 
                            ? 'text-gray-200 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <FaShieldAlt className={`mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                          Criar Artigo
                        </div>
                      </Link>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        isDarkMode 
                          ? 'text-red-400 hover:bg-gray-700' 
                          : 'text-red-500 hover:bg-gray-100'
                      }`}
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link 
                  to="/auth" 
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isDarkMode 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  Entrar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
