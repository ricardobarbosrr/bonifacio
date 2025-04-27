import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../api';

interface Notification {
  id: string;
  title: string;
  read: boolean;
  createdAt: Date;
  announcementId: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    // Usando API em vez do Firebase
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`http://localhost:8000/proxy.php?file=notifications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          // Verifica se data é um array antes de chamar map
          if (Array.isArray(data)) {
            setNotifications(data.map((item: any) => ({
              id: item.id,
              title: item.title,
              read: item.read,
              createdAt: new Date(item.created_at),
              announcementId: item.announcement_id,
            })));
          } else {
            console.error('Dados de notificações não é um array:', data);
            setNotifications([]);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };
    
    fetchNotifications();
    
    // Configurar um intervalo para verificar novas notificações a cada minuto
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  const unreadCount = notifications.filter(notification => !notification.read).length;

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications.php?id=${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ read: true }),
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true } 
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
