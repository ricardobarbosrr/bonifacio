import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Document {
  id: string;
  title: string;
  content: string;
  category: string;
  url?: string;
  created_at: string;
  author_id: string;
  author_name: string;
}

interface DocumentContextType {
  documents: Document[];
  addDocument: (document: Omit<Document, 'id' | 'created_at' | 'author_id' | 'author_name'>) => Promise<void>;
  updateDocument: (id: string, document: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  loading: boolean;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, isAdmin } = useAuth();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/documents.php`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    
    // Configurar um intervalo para verificar novos documentos a cada 5 minutos
    const interval = setInterval(fetchDocuments, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const addDocument = async (document: Omit<Document, 'id' | 'created_at' | 'author_id' | 'author_name'>) => {
    if (!currentUser) {
      throw new Error('Você precisa estar logado para adicionar um documento');
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/documents.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(document),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao adicionar documento');
      }
      
      await fetchDocuments();
    } catch (error) {
      console.error('Erro ao adicionar documento:', error);
      throw error;
    }
  };

  const updateDocument = async (id: string, document: Partial<Document>) => {
    if (!currentUser) {
      throw new Error('Você precisa estar logado para atualizar um documento');
    }

    const docToUpdate = documents.find(d => d.id === id);
    
    if (!docToUpdate) {
      throw new Error('Documento não encontrado');
    }

    if (!isAdmin && currentUser.uid !== docToUpdate.author_id) {
      throw new Error('Você não tem permissão para editar este documento');
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/documents.php?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(document),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar documento');
      }
      
      await fetchDocuments();
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    if (!currentUser) {
      throw new Error('Você precisa estar logado para excluir um documento');
    }

    const docToDelete = documents.find(d => d.id === id);
    
    if (!docToDelete) {
      throw new Error('Documento não encontrado');
    }

    if (!isAdmin && currentUser.uid !== docToDelete.author_id) {
      throw new Error('Você não tem permissão para excluir este documento');
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/documents.php?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir documento');
      }
      
      await fetchDocuments();
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      throw error;
    }
  };

  return (
    <DocumentContext.Provider value={{ documents, addDocument, updateDocument, deleteDocument, loading }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};
