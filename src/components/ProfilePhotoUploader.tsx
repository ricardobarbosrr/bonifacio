import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaCamera, FaLink } from 'react-icons/fa';
import { handleImageError, resolveProfilePhotoUrl } from '../utils/profilePhotoUtils';

const ProfilePhotoUploader: React.FC = () => {
  const { currentUser, updateProfilePhoto, updateProfilePhotoURL } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoSrc, setPhotoSrc] = useState<string>('https://via.placeholder.com/40x40');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Criar uma prévia da imagem para mostrar ao usuário
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotoSrc(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // Enviar o arquivo para o servidor
      await updateProfilePhoto(file);
      
      // Feedback de sucesso
      setError(null);
    } catch (err: any) {
      console.error('Erro ao atualizar a foto de perfil:', err);
      setError(err.message || 'Erro ao atualizar a foto de perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl.trim()) {
      setError('Por favor, insira um URL válido.');
      return;
    }

    // Verifica se o URL é válido
    try {
      new URL(imageUrl);
    } catch (err) {
      setError('URL inválido. Certifique-se de incluir http:// ou https://');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateProfilePhotoURL();
      setShowUrlInput(false);
      setImageUrl('');
    } catch (err) {
      setError('Erro ao atualizar a foto de perfil. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      // Passar o nome do usuário para gerar avatar se necessário
      const username = currentUser.displayName || 'Usuário';
      setPhotoSrc(resolveProfilePhotoUrl(currentUser.photoURL, username, 40));
    }
  }, [currentUser]);
  
  if (!currentUser) return null;

  const username = currentUser.displayName || 'Usuário';

  return (
    <div className="relative">
      <div className="relative group">
        <img
          src={photoSrc}
          alt={username}
          className="w-10 h-10 rounded-full border-2 border-green-700 dark:border-green-400 object-cover"
          onError={(e) => handleImageError(e, '40x40', username)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleButtonClick}
            className="text-white mx-1"
            disabled={loading}
          >
            <FaCamera />
          </button>
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-white mx-1"
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
      
      {showUrlInput && (
        <div className="absolute top-12 right-0 w-64 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg z-10">
          <form onSubmit={handleUrlSubmit}>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUrlInput(false);
                  setImageUrl('');
                  setError(null);
                }}
                className="px-3 py-1 text-sm mr-2 bg-gray-200 dark:bg-gray-700 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
      
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {loading && <p className="text-gray-500 text-xs mt-1">Carregando...</p>}
    </div>
  );
};

export default ProfilePhotoUploader;
