import React, { useEffect, useState } from 'react';
import { useAnnouncements } from '../contexts/AnnouncementContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaCheck, FaBell, FaExclamationTriangle, FaCrown } from 'react-icons/fa';

// Interface para armazenar informações do criador do anúncio
interface AnnouncementCreator {
  id: string;
  isFounder: boolean;
  name: string;
}

// Componente para exibir todos os anúncios
const AnnouncementsList: React.FC = () => {
  const { announcements, markAsRead, loading } = useAnnouncements();
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [creators, setCreators] = useState<Record<string, AnnouncementCreator>>({});

  // Buscar informações dos criadores dos anúncios
  useEffect(() => {
    const fetchCreators = async () => {
      const uniqueCreatorIds = [...new Set(announcements.map(a => a.createdBy))];
      
      // Buscar informações dos usuários que criaram anúncios
      if (uniqueCreatorIds.length > 0) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users.php?ids=${uniqueCreatorIds.join(',')}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const creatorsMap: Record<string, AnnouncementCreator> = {};
            
            data.forEach((user: any) => {
              creatorsMap[user.uid] = {
                id: user.uid,
                isFounder: user.isFounder || false,
                name: user.displayName || user.email || 'Usuário'
              };
            });
            
            setCreators(creatorsMap);
          }
        } catch (error) {
          console.error('Erro ao buscar informações dos criadores:', error);
        }
      }
    };
    
    if (announcements.length > 0) {
      fetchCreators();
    }
  }, [announcements]);

  // Ordenar anúncios por data (mais recentes primeiro)
  const sortedAnnouncements = [...announcements].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Marcar anúncio como lido
  const handleMarkAsRead = async (id: string) => {
    try {
      if (currentUser && !announcements.find(a => a.id === id)?.readBy.includes(currentUser.uid)) {
        await markAsRead(id);
      }
    } catch (error) {
      console.error('Erro ao marcar anúncio como lido:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className={`rounded-lg p-6 shadow text-center ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}`}>
        <FaBell className="mx-auto text-4xl mb-2 text-gray-400" />
        <p>Nenhum anúncio disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
        Anúncios
      </h2>
      <div className="space-y-4">
        {sortedAnnouncements.map(announcement => (
          <div
            key={announcement.id}
            className="rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg"
            style={{
              backgroundColor: announcement.backgroundColor || (isDarkMode ? '#1f2937' : '#ffffff'),
              color: announcement.textColor || (isDarkMode ? '#f3f4f6' : '#000000')
            }}
            onClick={() => handleMarkAsRead(announcement.id)}
          >
            <div className="p-4 sm:p-5">
              <h3 className="font-bold text-lg mb-2 flex items-center flex-wrap gap-2">
                {announcement.important && (
                  <FaExclamationTriangle 
                    className={`flex-shrink-0 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`} 
                    aria-label="Anúncio importante"
                    title="Anúncio importante"
                  />
                )}
                <span className="break-words">{announcement.title}</span>
              </h3>
              <div className="whitespace-pre-wrap break-words max-h-60 overflow-y-auto pr-1">
                {announcement.content}
              </div>
              <div className="mt-4 text-sm opacity-70 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="whitespace-nowrap">
                    {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  {creators[announcement.createdBy] && (
                    <span className="flex items-center flex-wrap gap-1">
                      <span>por</span> <span>{creators[announcement.createdBy].name}</span>
                      {creators[announcement.createdBy].isFounder && (
                        <FaCrown 
                          className={`flex-shrink-0 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`} 
                          title="Criado por um Fundador"
                          aria-label="Criado por um Fundador"
                          size={12}
                        />
                      )}
                    </span>
                  )}
                </div>
                {currentUser && announcement.readBy.includes(currentUser.uid) && (
                  <span className="flex items-center whitespace-nowrap ml-auto text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900 bg-opacity-50 dark:bg-opacity-30 px-2 py-1 rounded-full text-xs">
                    <FaCheck className="mr-1 flex-shrink-0" /> Lido
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsList;
