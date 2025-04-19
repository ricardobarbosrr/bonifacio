import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaCamera, FaEdit, FaSave, FaTimes, FaLock, FaEye, FaEyeSlash, FaLink } from 'react-icons/fa';
import { handleImageError, fileToBase64, resolveProfilePhotoUrl } from '../utils/profilePhotoUtils';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, updateProfilePhoto, updateProfilePhotoURL, updatePassword, logout } = useAuth();
  const { isDarkMode } = useTheme();
  
  // Estados do formulário
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [profilePhotoSrc, setProfilePhotoSrc] = useState<string>('https://via.placeholder.com/128x128');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estados para alteração de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estado para o modal de URL de imagem
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      // Passar o nome do usuário para gerar avatar se necessário
      setProfilePhotoSrc(resolveProfilePhotoUrl(currentUser.photoURL, username, 128));
    }
  }, [currentUser, username]);

  if (!currentUser) {
    navigate('/auth');
    return null;
  }

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.displayName || '');
      setOriginalUsername(currentUser.displayName || '');
    }
  }, [currentUser]);

  // Manipuladores de eventos do formulário
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUsername(originalUsername);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('O nome de usuário não pode estar vazio');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await updateProfile();
      setOriginalUsername(username);
      setIsEditing(false);
      setSuccessMessage('Perfil atualizado com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError('Erro ao atualizar o perfil. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificar se o arquivo é uma imagem
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida.');
      return;
    }
    
    // Verificar tamanho do arquivo (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 2MB.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Preview local da imagem
      const base64Image = await fileToBase64(file);
      const previewImg = document.getElementById('profile-preview') as HTMLImageElement;
      if (previewImg) {
        previewImg.src = base64Image;
      }
      
      // Passar o arquivo para a função de atualização
      await updateProfilePhoto(file);
      setSuccessMessage('Foto de perfil atualizada com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError('Erro ao atualizar a foto de perfil. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de senha
    if (!currentPassword) {
      setPasswordError('A senha atual é obrigatória');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('A nova senha é obrigatória');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    setPasswordError(null);
    
    try {
      await updatePassword();
      setPasswordSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setPasswordSuccess(null);
      }, 3000);
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') {
        setPasswordError('Senha atual incorreta');
      } else {
        setPasswordError('Erro ao alterar a senha. Tente novamente.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Manipuladores de eventos para URL de imagem
  const handleOpenUrlModal = () => {
    setShowUrlModal(true);
    setImageUrl('');
    setUrlError(null);
  };
  
  const handleCloseUrlModal = () => {
    setShowUrlModal(false);
    setImageUrl('');
    setUrlError(null);
  };
  
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl.trim()) {
      setUrlError('Por favor, insira um URL válido.');
      return;
    }

    // Verifica se o URL é válido
    try {
      new URL(imageUrl);
    } catch (err) {
      setUrlError('URL inválido. Certifique-se de incluir http:// ou https://');
      return;
    }

    setLoading(true);
    setUrlError(null);

    try {
      await updateProfilePhotoURL();
      setShowUrlModal(false);
      setImageUrl('');
      // Atualizar a visualização
      if (currentUser) {
        setProfilePhotoSrc(resolveProfilePhotoUrl(imageUrl, username, 128));
      }
      setSuccessMessage('Foto de perfil atualizada com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setUrlError('Erro ao atualizar a foto de perfil. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className={`${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} rounded-lg shadow-md p-6`}>
          <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}
          
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            {/* Foto de perfil */}
            <div className="relative">
              <div className="relative group w-32 h-32">
                <img
                  src={profilePhotoSrc}
                  alt={username || 'Usuário'}
                  className="w-32 h-32 rounded-full border-4 border-green-700 dark:border-green-400 object-cover"
                  id="profile-preview"
                  onError={(e) => handleImageError(e, '128x128', username)}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handlePhotoClick}
                    className="mx-2 text-white text-xl"
                    title="Carregar foto"
                    disabled={loading}
                  >
                    <FaCamera />
                  </button>
                  <button
                    onClick={handleOpenUrlModal}
                    className="mx-2 text-white text-xl"
                    title="Usar URL de imagem"
                    disabled={loading}
                  >
                    <FaLink />
                  </button>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            {/* Informações do perfil */}
            <div className="flex-1">
              {!isEditing ? (
                <div>
                  <h2 className="text-xl font-semibold mb-2">{username || 'Usuário'}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{currentUser.email}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEdit}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                      <FaEdit className="inline mr-1" /> Editar Perfil
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                      } px-4 py-2 rounded`}
                    >
                      Sair
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome de usuário</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full p-2 border rounded ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
                    >
                      {loading ? (
                        <span>Salvando...</span>
                      ) : (
                        <>
                          <FaSave className="mr-1" /> Salvar
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className={`${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                      } px-4 py-2 rounded flex items-center`}
                    >
                      <FaTimes className="mr-1" /> Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
          
          {/* Seção de alteração de senha */}
          <div className="mt-8 border-t pt-6 border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Alterar Senha</h2>
            
            {passwordError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {passwordSuccess}
              </div>
            )}
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Senha atual</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full p-2 border rounded ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-400"
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nova senha</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full p-2 border rounded ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-400"
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Confirmar nova senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full p-2 border rounded ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-400"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
              >
                {loading ? (
                  <span>Atualizando...</span>
                ) : (
                  <>
                    <FaLock className="mr-1" /> Atualizar Senha
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal para URL de imagem */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 max-w-md w-full mx-4`}>
            <h2 className="text-xl font-bold mb-4">Adicionar foto por URL</h2>
            
            <form onSubmit={handleUrlSubmit}>
              {urlError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {urlError}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="image-url" className="block text-sm font-medium mb-1">
                  URL da imagem
                </label>
                <input
                  id="image-url"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className={`w-full p-2 border rounded ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Insira o link direto para uma imagem (deve terminar com .jpg, .png, .gif, etc.)
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseUrlModal}
                  className={`px-4 py-2 rounded ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
