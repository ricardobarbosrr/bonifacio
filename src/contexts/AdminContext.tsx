import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../api';

interface AdminMember {
  id: string;
  name: string;
  role: string;
  description: string;
  photoUrl?: string;
  order: number;
}

interface AdminContextType {
  members: AdminMember[];
  addMember: (member: Omit<AdminMember, 'id'>) => Promise<void>;
  updateMember: (id: string, member: Partial<AdminMember>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin-members.php`);
        if (response.ok) {
          const data = await response.json();
          setMembers(data);
        } else {
          console.error('Erro ao buscar membros da administração');
        }
      } catch (error) {
        console.error('Erro ao buscar membros da administração:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const addMember = async (member: Omit<AdminMember, 'id'>) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem adicionar membros');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin-members.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(member),
      });

      if (response.ok) {
        const newMember = await response.json();
        setMembers((prevMembers) => [...prevMembers, newMember]);
      } else {
        throw new Error('Erro ao adicionar membro');
      }
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      throw error;
    }
  };

  const updateMember = async (id: string, member: Partial<AdminMember>) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem atualizar membros');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin-members.php?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(member),
      });

      if (response.ok) {
        setMembers((prevMembers) =>
          prevMembers.map((m) => (m.id === id ? { ...m, ...member } : m))
        );
      } else {
        throw new Error('Erro ao atualizar membro');
      }
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      throw error;
    }
  };

  const deleteMember = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem excluir membros');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin-members.php?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMembers((prevMembers) => prevMembers.filter((m) => m.id !== id));
      } else {
        throw new Error('Erro ao excluir membro');
      }
    } catch (error) {
      console.error('Erro ao excluir membro:', error);
      throw error;
    }
  };

  return (
    <AdminContext.Provider
      value={{
        members,
        addMember,
        updateMember,
        deleteMember,
        loading,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
