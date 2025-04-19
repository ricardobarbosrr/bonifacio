import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaUserShield, FaUser, FaCrown } from 'react-icons/fa';

interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isFounder: boolean;
  created_at: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isFounder } = useAuth();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users.php`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar usuários');
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        setError('Erro ao carregar usuários. Por favor, tente novamente.');
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleAdminStatus = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (!isFounder) {
      setError('Apenas fundadores podem adicionar ou remover administradores.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users.php?id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ isAdmin: !isCurrentlyAdmin }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status de admin');
      }

      // Atualizar o estado local
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, isAdmin: !isCurrentlyAdmin } 
          : user
      ));
    } catch (error) {
      setError('Erro ao atualizar status de admin. Por favor, tente novamente.');
      console.error('Erro ao atualizar status de admin:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Painel de Administração
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className={`rounded-lg shadow p-4 sm:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-xl font-semibold mb-4">Gerenciar Usuários</h3>
        
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-4">
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Nenhum usuário encontrado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                      Email
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                      Data de Registro
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {users.map(user => (
                    <tr key={user.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{user.username}</div>
                        <div className="text-xs text-gray-500 md:hidden mt-1">{user.email}</div>
                        <div className="text-xs text-gray-500 sm:hidden mt-1">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <span className="text-sm">{user.email}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.isFounder ? (
                            <div className="flex items-center text-yellow-500">
                              <FaCrown className="mr-1" size={14} />
                              <span className="text-sm">Fundador</span>
                            </div>
                          ) : user.isAdmin ? (
                            <div className="flex items-center text-blue-500">
                              <FaUserShield className="mr-1" size={14} />
                              <span className="text-sm">Admin</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-500">
                              <FaUser className="mr-1" size={14} />
                              <span className="text-sm">Usuário</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        {isFounder && !user.isFounder && (
                          <button
                            className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors ${
                              user.isAdmin
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                            onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                            aria-label={user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                          >
                            {user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className={`rounded-lg shadow p-4 sm:p-6 mt-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-xl font-semibold mb-4">Estatísticas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm">Total de Usuários</div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
            <div className="text-2xl font-bold">{users.filter(user => user.isAdmin).length}</div>
            <div className="text-sm">Administradores</div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
            <div className="text-2xl font-bold">{users.filter(user => user.isFounder).length}</div>
            <div className="text-sm">Fundadores</div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
            <div className="text-2xl font-bold">
              {users.filter(user => !user.isAdmin && !user.isFounder).length}
            </div>
            <div className="text-sm">Usuários Regulares</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
