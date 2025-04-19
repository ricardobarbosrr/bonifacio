import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  important: boolean;
  backgroundColor?: string;
  textColor?: string;
  createdAt: Date;
  createdBy: string;
  readBy: string[];
}

interface AnnouncementContextType {
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'createdBy' | 'readBy'>) => Promise<void>;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  loading: boolean;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

export const AnnouncementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/announcements.php`);
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const announcementsWithDates = data.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt || item.created_at)
            }));
            setAnnouncements(announcementsWithDates);
          } else {
            console.error('Dados de anúncios não é um array:', data);
            setAnnouncements([]);
          }
        } else {
          console.error('Erro ao buscar anúncios:', response.statusText);
          setAnnouncements([]);
        }
      } catch (error) {
        console.error('Erro ao buscar anúncios:', error);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();

    // Atualizar anúncios a cada 5 minutos
    const intervalId = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const addAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt' | 'createdBy' | 'readBy'>) => {
    if (!currentUser || !isAdmin) {
      throw new Error('Apenas administradores podem adicionar anúncios');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/announcements.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(announcement),
      });

      if (!response.ok) {
        throw new Error('Erro ao adicionar anúncio');
      }

      // Recarregar anúncios após adicionar
      const updatedResponse = await fetch(`${API_BASE_URL}/announcements.php`);
      if (updatedResponse.ok) {
        const data = await updatedResponse.json();
        if (Array.isArray(data)) {
          const announcementsWithDates = data.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt || item.created_at)
          }));
          setAnnouncements(announcementsWithDates);
        } else {
          console.error('Dados de anúncios não é um array:', data);
          setAnnouncements([]);
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar anúncio:', error);
      throw error;
    }
  };

  const updateAnnouncement = async (id: string, announcement: Partial<Announcement>) => {
    if (!currentUser || !isAdmin) {
      throw new Error('Apenas administradores podem atualizar anúncios');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/announcements.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ id, ...announcement }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar anúncio');
      }

      setAnnouncements(prevAnnouncements =>
        prevAnnouncements.map(a => a.id === id ? { ...a, ...announcement } : a)
      );
    } catch (error) {
      console.error('Erro ao atualizar anúncio:', error);
      throw error;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!currentUser || !isAdmin) {
      throw new Error('Apenas administradores podem excluir anúncios');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/announcements.php?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir anúncio');
      }

      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.filter(a => a.id !== id)
      );
    } catch (error) {
      console.error('Erro ao excluir anúncio:', error);
      throw error;
    }
  };

  const markAsRead = async (id: string) => {
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/announcements.php`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Erro ao marcar anúncio como lido');
      }

      // Atualizar estado local
      setAnnouncements(prevAnnouncements =>
        prevAnnouncements.map(a => {
          if (a.id === id) {
            // Adiciona o ID do usuário à lista de leitores, se ainda não estiver lá
            const newReadBy = [...a.readBy];
            if (!newReadBy.includes(currentUser.uid)) {
              newReadBy.push(currentUser.uid);
            }
            return { ...a, readBy: newReadBy };
          }
          return a;
        })
      );
    } catch (error) {
      console.error('Erro ao marcar anúncio como lido:', error);
      throw error;
    }
  };

  return (
    <AnnouncementContext.Provider value={{ 
      announcements, 
      addAnnouncement, 
      updateAnnouncement, 
      deleteAnnouncement, 
      markAsRead, 
      loading 
    }}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncements = () => {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error('useAnnouncements deve ser usado dentro de um AnnouncementProvider');
  }
  return context;
};
