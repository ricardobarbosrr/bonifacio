import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { importUsers, importPosts, importAllData } from '../utils/migrationUtils';
import { Navigate } from 'react-router-dom';

interface ImportResult {
  users?: { success: number; errors: number };
  posts?: { success: number; errors: number };
  success?: number;
  errors?: number;
}

const Admin: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);

  // Redirecionar se não for admin
  if (!currentUser || !isAdmin) {
    return <Navigate to="/" />;
  }

  const handleFileUpload = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(Array.isArray(data) ? data : [data]);
        } catch (error) {
          reject(new Error('Erro ao processar o arquivo JSON'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
      reader.readAsText(file);
    });
  };

  const handleImportUsers = async () => {
    if (!userFileInputRef.current?.files?.length) {
      setError('Por favor, selecione um arquivo JSON com dados de usuários');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const userData = await handleFileUpload(userFileInputRef.current.files[0]);
      const result = await importUsers(userData);
      setResult({ users: result });
    } catch (err) {
      setError('Erro ao importar usuários. Verifique o console para mais detalhes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportPosts = async () => {
    if (!postFileInputRef.current?.files?.length) {
      setError('Por favor, selecione um arquivo JSON com dados de posts');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const postData = await handleFileUpload(postFileInputRef.current.files[0]);
      const result = await importPosts(postData);
      setResult({ posts: result });
    } catch (err) {
      setError('Erro ao importar posts. Verifique o console para mais detalhes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportAll = async () => {
    if (!userFileInputRef.current?.files?.length || !postFileInputRef.current?.files?.length) {
      setError('Por favor, selecione arquivos JSON para usuários e posts');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const userData = await handleFileUpload(userFileInputRef.current.files[0]);
      const postData = await handleFileUpload(postFileInputRef.current.files[0]);
      const result = await importAllData(userData, postData);
      setResult(result);
    } catch (err) {
      setError('Erro ao importar dados. Verifique o console para mais detalhes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Administração
      </h1>

      <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-md p-6`}>
        <h2 className="text-xl font-semibold mb-4">Importação de Dados</h2>
        
        <div className="space-y-4">
          <p className="text-sm">
            Use as opções abaixo para importar dados para o banco de dados MySQL.
            Certifique-se de que o banco de dados MySQL já está configurado com as tabelas corretas.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Arquivo de Usuários (JSON)</label>
              <input
                type="file"
                accept=".json"
                ref={userFileInputRef}
                className={`w-full p-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-gray-100 text-gray-900 border-gray-300'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Arquivo de Posts (JSON)</label>
              <input
                type="file"
                accept=".json"
                ref={postFileInputRef}
                className={`w-full p-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-gray-100 text-gray-900 border-gray-300'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleImportUsers}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isLoading ? 'Processando...' : 'Importar Usuários'}
            </button>
            
            <button
              onClick={handleImportPosts}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isLoading ? 'Processando...' : 'Importar Posts'}
            </button>
            
            <button
              onClick={handleImportAll}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              {isLoading ? 'Processando...' : 'Importar Tudo'}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
              <strong className="font-bold">Erro!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          
          {result && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4">
              <strong className="font-bold">Resultado da Importação:</strong>
              <div className="mt-2">
                {result.users && (
                  <p>Usuários: {result.users.success} com sucesso, {result.users.errors} com erro</p>
                )}
                {result.posts && (
                  <p>Posts: {result.posts.success} com sucesso, {result.posts.errors} com erro</p>
                )}
                {result.success !== undefined && result.errors !== undefined && (
                  <p className="font-semibold mt-1">
                    Total: {result.success} itens importados com sucesso, {result.errors} com erro
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
