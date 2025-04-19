import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import AnnouncementsList from '../components/AnnouncementsList';
import AnnouncementAdmin from '../components/AnnouncementAdmin';

const Announcements: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { isAdmin } = useAuth();

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} min-h-screen`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Anúncios</h1>
        </div>
        
        {/* Componente de administração de anúncios (apenas para admins) */}
        {isAdmin && <AnnouncementAdmin />}
        
        {/* Lista de anúncios (visível para todos) */}
        <AnnouncementsList />
      </div>
    </div>
  );
};

export default Announcements;
