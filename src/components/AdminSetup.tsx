import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminSetup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatus('loading');
      if (auth && auth.setFirstAdmin) {
        await auth.setFirstAdmin(email, adminKey);
        setMessage('Administrador definido com sucesso!');
        setStatus('success');
      } else {
        throw new Error('Função de definição de administrador não disponível');
      }
    } catch (error: any) {
      setMessage('Erro: ' + error.message);
      setStatus('error');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Configuração do Primeiro Administrador</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Email do usuário
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="usuario@exemplo.com"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Chave administrativa
          </label>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Chave secreta"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            A chave padrão é "adminSecretKey123" (você deve alterá-la em produção)
          </p>
        </div>
        
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition"
        >
          {status === 'loading' ? 'Processando...' : 'Definir como Administrador'}
        </button>
      </form>
      
      {message && (
        <div className={`mt-4 p-3 rounded-md ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminSetup;
