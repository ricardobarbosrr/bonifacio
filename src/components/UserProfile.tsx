import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePost } from '../contexts/PostContext';
import { resolveProfilePhotoUrl, handleImageError } from '../utils/profilePhotoUtils';

interface UserPost {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  likes: string[];
  comments: any[];
  created_at: string;
  updated_at?: string;
}

const UserProfile: React.FC = () => {
  const { currentUser, updateProfile, updateProfilePhoto } = useAuth();
  const { posts } = usePost();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      // Filtrar posts do usuário atual
      const filteredPosts = posts.filter(post => post.author_id === currentUser.uid);
      setUserPosts(filteredPosts as unknown as UserPost[]);
    }
  }, [currentUser, posts]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Atualizar nome de usuário
      await updateProfile();
      
      // Atualizar foto de perfil se uma nova foi selecionada
      if (photoFile) {
        await updateProfilePhoto(photoFile);
      }
      
      setIsEditing(false);
    } catch (error) {
      setError('Erro ao atualizar perfil');
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-6">
          <img
            src={resolveProfilePhotoUrl(currentUser?.photoURL || null, currentUser?.displayName || 'Usuário', 128)}
            alt="Foto de perfil"
            className="w-32 h-32 rounded-full object-cover border-4 border-green-700 dark:border-green-400"
            onError={(e) => handleImageError(e, '128x128', currentUser?.displayName || 'Usuário')}
          />
          <div className="flex-1">
            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome de usuário
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Foto de perfil
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <h2 className="text-2xl font-bold">{currentUser?.displayName || 'Usuário'}</h2>
                <div className="mt-4 flex space-x-6">
                  <div>
                    <span className="font-bold">{userPosts.length}</span> posts
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Editar perfil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid de posts */}
      <div className="grid grid-cols-3 gap-4">
        {userPosts.map((post) => (
          <div key={post.id} className="aspect-square">
            <img
              src={post.imageUrl || ''}
              alt={post.content}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://via.placeholder.com/400';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProfile;
