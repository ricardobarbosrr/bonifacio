import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaFile, FaBell, FaBars, FaTimes, FaShieldAlt, FaComments, FaNewspaper } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { useAnnouncements } from '../contexts/AnnouncementContext';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { currentUser, isAdmin, isFounder } = useAuth();
  const { announcements } = useAnnouncements();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Verificar se a propriedade readBy existe e usar verificação segura para evitar erros
  const unreadCount = announcements.filter(a => {
    // Garantir que readBy existe e é um array
    const readBy = a.readBy || [];
    // Verificar se o usuário atual não leu o anúncio
    return !readBy.includes(currentUser?.uid || '');
  }).length;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    {
      to: '/posts',
      icon: <FaComments />,
      text: 'Publicações',
      badge: null,
      show: true // Visível para todos
    },
    {
      to: '/artigos',
      icon: <FaNewspaper />,
      text: 'Artigos',
      badge: null,
      show: true // Visível para todos
    },
    {
      to: '/documentos',
      icon: <FaFile />,
      text: 'Documentos Oficiais',
      badge: null,
      show: true // Visível para todos
    },
    {
      to: '/anuncios',
      icon: <FaBell />,
      text: 'Anúncios',
      badge: unreadCount > 0 ? unreadCount : null,
      show: true // Visível para todos
    },
    {
      to: '/administracao',
      icon: <FaShieldAlt />,
      text: 'Administração',
      badge: null,
      show: isAdmin || isFounder // Apenas admin ou founder
    },
    {
      to: '/admin',
      icon: <FaShieldAlt />,
      text: 'Painel de Controle',
      badge: null,
      show: isAdmin || isFounder // Apenas admin ou founder
    },
    {
      to: '/migracao',
      icon: <FaShieldAlt />,
      text: 'Migração',
      badge: null,
      show: isFounder // Apenas founder
    }
  ];

  return (
    <>
      {/* Botão do menu mobile */}
      <button
        onClick={toggleSidebar}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg transition-colors duration-200 ${
          isDarkMode 
            ? 'text-white bg-gray-800 hover:bg-gray-700' 
            : 'text-gray-800 bg-white hover:bg-gray-200'
        }`}
        aria-label="Toggle menu"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay para fechar o menu no mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar flutuante */}
      <aside
        className={`fixed top-24 left-4 w-56 transition-all duration-300 ease-in-out z-40 
          ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} 
          lg:translate-x-0 lg:opacity-100
          ${isDarkMode 
            ? 'bg-gray-800 text-white border border-gray-700' 
            : 'bg-white text-gray-800 border border-gray-200'} 
          shadow-xl rounded-xl`}
      >
        {/* Menu Items */}
        <nav className="py-3">
          <ul className="space-y-1 px-2">
            {menuItems.filter(item => item.show).map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ease-in-out
                    ${location.pathname === item.to
                      ? isDarkMode
                        ? 'bg-green-700 text-white'
                        : 'bg-green-500 text-white'
                      : isDarkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                    }`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-md mr-3 transition-colors duration-200 ${
                      location.pathname === item.to
                        ? 'bg-white bg-opacity-20'
                        : isDarkMode 
                          ? 'bg-gray-700 text-green-400' 
                          : 'bg-green-100 text-green-600'
                    }`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
