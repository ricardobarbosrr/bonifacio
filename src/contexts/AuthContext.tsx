import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../api'; 

interface User {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isFounder: boolean;
  photoURL?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  isFounder: boolean;
  register: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: () => Promise<void>;
  updateProfilePhoto: (file: File) => Promise<void>;
  updateProfilePhotoURL: () => Promise<void>;
  updatePassword: () => Promise<void>;
  setFirstAdmin?: (email: string, adminKey: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFounder, setIsFounder] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await auth.getCurrentUser();
        setCurrentUser(user);
        setIsAdmin(user?.isAdmin || false);
        setIsFounder(user?.isFounder || false);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        setCurrentUser(null);
        setIsAdmin(false);
        setIsFounder(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const register = async (email: string, password: string, username: string): Promise<void> => {
    try {
      const user = await auth.register(email, password, username);
      setCurrentUser(user);
      setIsAdmin(user.isAdmin || false);
      setIsFounder(user.isFounder || false);
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const user = await auth.login(email, password);
      setCurrentUser(user);
      setIsAdmin(user.isAdmin || false);
      setIsFounder(user.isFounder || false);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await auth.logout();
      setCurrentUser(null);
      setIsAdmin(false);
      setIsFounder(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  const updateProfile = async (): Promise<void> => {
    // Implementar quando criar o endpoint de atualização de perfil
    console.log('Função de atualização de perfil ainda não implementada');
    throw new Error('Função não implementada');
  };

  const updateProfilePhoto = async (file: File): Promise<void> => {
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'profile'); // Indica que é uma foto de perfil
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://seudominio.com/api'}/upload.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar foto de perfil');
      }
      
      const result = await response.json();
      
      // Atualizar o usuário local com a nova foto de perfil
      setCurrentUser(prev => {
        if (!prev) return null;
        return { ...prev, photoURL: result.image_url };
      });
      
      return;
    } catch (error) {
      console.error('Erro ao atualizar foto de perfil:', error);
      throw error;
    }
  };
  
  const updateProfilePhotoURL = async (): Promise<void> => {
    // Implementar quando criar o endpoint de atualização de URL de foto
    console.log('Função de atualização de URL de foto de perfil ainda não implementada');
    throw new Error('Função não implementada');
  };

  const updatePassword = async (): Promise<void> => {
    // Implementar quando criar o endpoint de atualização de senha
    console.log('Função de atualização de senha ainda não implementada');
    throw new Error('Função não implementada');
  };

  const setFirstAdmin = async (email: string, adminKey: string): Promise<void> => {
    // Implementar quando criar o endpoint de definição do primeiro administrador
    console.log('Função de definição do primeiro administrador ainda não implementada', email, adminKey);
    throw new Error('Função não implementada');
  };

  const value = {
    currentUser,
    isAdmin,
    isFounder,
    loading,
    register,
    login,
    logout,
    updateProfile,
    updateProfilePhoto,
    updateProfilePhotoURL,
    updatePassword,
    setFirstAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
