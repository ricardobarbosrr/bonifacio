import React, { useState, useRef } from 'react';
import { useTheme } from './contexts/ThemeContext';
import { usePost, Post as PostType } from './contexts/PostContext';
import { useAuth } from './contexts/AuthContext';
import { FaEdit, FaTrash, FaCommentAlt, FaHeart, FaImage, FaLink, FaTimes, FaRegHeart } from 'react-icons/fa';

interface PostFormData {
  id?: string;
  title: string;
  content: string;
  image_url?: string;
}

const BodyPublic: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { currentUser, isAdmin } = useAuth();
  const { posts, addPost, updatePost, deletePost, addComment, deleteComment, toggleLike, hasUserLiked } = usePost();
  const [editingPost, setEditingPost] = useState<PostFormData>({ title: '', content: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [showFullContent, setShowFullContent] = useState<{ [key: string]: boolean }>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost.content.trim() === '') return;

    try {
      if (isEditing && editingPost.id) {
        await updatePost(editingPost.id, editingPost);
      } else {
        await addPost(editingPost);
      }
      setEditingPost({ title: '', content: '' });
      setIsEditing(false);
      setPreviewImage(null);
      setShowUrlInput(false);
    } catch (error) {
      console.error('Erro ao salvar post:', error);
      alert('Ocorreu um erro ao salvar a publicação. Tente novamente.');
    }
  };

  const handleEdit = (post: PostType) => {
    setEditingPost({ 
      id: post.id, 
      title: post.title, 
      content: post.content, 
      image_url: post.image_url 
    });
    setPreviewImage(post.image_url || null);
    setIsEditing(true);
    setShowUrlInput(!!post.image_url);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta publicação?')) {
      await deletePost(id);
    }
  };

  const handleCommentSubmit = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (newComment[postId]?.trim()) {
      await addComment(postId, newComment[postId]);
      setNewComment(prev => ({ ...prev, [postId]: '' }));
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleFullContent = (postId: string) => {
    setShowFullContent(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar tipo de arquivo
    if (!file.type.match('image.*')) {
      alert('Por favor, selecione apenas imagens.');
      return;
    }

    // Verificar tamanho (limite de 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('image', file);

      // Fazer upload para a API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload.php`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload da imagem');
      }

      const data = await response.json();
      setEditingPost(prev => ({ ...prev, image_url: data.image_url }));
      setPreviewImage(data.image_url);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Ocorreu um erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUrlSubmit = (url: string) => {
    if (url.trim() === '') {
      setPreviewImage(null);
      setEditingPost(prev => ({ ...prev, image_url: undefined }));
    } else {
      setPreviewImage(url);
      setEditingPost(prev => ({ ...prev, image_url: url }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={`p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      {currentUser && (
        <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h2 className="text-xl font-bold mb-4">Criar Nova Publicação</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block mb-2 font-medium">
                Título
              </label>
              <input
                id="title"
                type="text"
                value={editingPost.title || ''}
                onChange={(e) => setEditingPost(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                placeholder="Título da publicação"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="content" className="block mb-2 font-medium">
                Conteúdo
              </label>
              <textarea
                id="content"
                value={editingPost.content || ''}
                onChange={(e) => setEditingPost(prev => ({ ...prev, content: e.target.value }))}
                className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                rows={4}
                placeholder="O que você está pensando?"
                required
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center space-x-4 mb-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center px-3 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  <FaImage className="mr-2" /> Adicionar Imagem
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className={`flex items-center px-3 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  <FaLink className="mr-2" /> URL da Imagem
                </button>
                {(previewImage || editingPost.image_url) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setEditingPost(prev => ({ ...prev, image_url: undefined }));
                    }}
                    className={`flex items-center px-3 py-1 rounded ${isDarkMode ? 'bg-red-700 hover:bg-red-600' : 'bg-red-200 hover:bg-red-300'}`}
                  >
                    <FaTimes className="mr-2" /> Remover Imagem
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*"
              />

              {showUrlInput && (
                <div className="mb-4">
                  <input
                    type="text"
                    value={editingPost.image_url || ''}
                    onChange={(e) => handleImageUrlSubmit(e.target.value)}
                    className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="URL da imagem"
                  />
                </div>
              )}

              {uploadingImage && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {previewImage && (
                <div className="mt-2">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-h-64 rounded"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEditing ? 'Atualizar' : 'Publicar'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{post.title}</h3>
                <p className="text-sm text-gray-500">
                  Por {post.author_name}
                  {isAdmin && currentUser?.uid !== post.author_id && ' (Admin)'}
                </p>
              </div>
              {currentUser && (currentUser.uid === post.author_id || isAdmin) && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(post)}
                    className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700 text-red-500' : 'hover:bg-gray-200 text-red-600'}`}
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-2">
              {post.content.length > 300 && !showFullContent[post.id] ? (
                <>
                  <p>{post.content.substring(0, 300)}...</p>
                  <button
                    onClick={() => toggleFullContent(post.id)}
                    className="text-blue-500 hover:underline mt-1"
                  >
                    Ler mais
                  </button>
                </>
              ) : (
                <>
                  <p>{post.content}</p>
                  {post.content.length > 300 && (
                    <button
                      onClick={() => toggleFullContent(post.id)}
                      className="text-blue-500 hover:underline mt-1"
                    >
                      Mostrar menos
                    </button>
                  )}
                </>
              )}
            </div>

            {post.image_url && (
              <div className="mt-4">
                <img
                  src={post.image_url}
                  alt="Imagem do post"
                  className="max-h-96 rounded"
                />
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
              {formatDate(post.created_at)}
            </div>

            <div className="mt-4 flex items-center space-x-4">
              {currentUser && (
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center space-x-1 ${
                    hasUserLiked(post.id)
                      ? 'text-red-500'
                      : isDarkMode
                      ? 'text-gray-300'
                      : 'text-gray-600'
                  }`}
                >
                  {hasUserLiked(post.id) ? <FaHeart /> : <FaRegHeart />}
                  <span>{post.likes?.length || 0}</span>
                </button>
              )}

              <button
                onClick={() => toggleComments(post.id)}
                className={`flex items-center space-x-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                <FaCommentAlt />
                <span>{post.comments.length}</span>
              </button>
            </div>

            {showComments[post.id] && (
              <div className="mt-4">
                <h4 className="font-bold mb-2">Comentários</h4>
                {post.comments.length > 0 ? (
                  <div className="space-y-3">
                    {post.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}
                      >
                        <div className="flex justify-between">
                          <p className="font-medium">{comment.author_name}</p>
                          {currentUser &&
                            (currentUser.uid === comment.author_id || isAdmin) && (
                              <button
                                onClick={() => deleteComment(comment.id)}
                                className="text-red-500"
                              >
                                <FaTrash size={12} />
                              </button>
                            )}
                        </div>
                        <p className="mt-1">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(comment.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum comentário ainda.</p>
                )}

                {currentUser && (
                  <form
                    onSubmit={(e) => handleCommentSubmit(post.id, e)}
                    className="mt-3"
                  >
                    <div className="flex">
                      <input
                        type="text"
                        value={newComment[post.id] || ''}
                        onChange={(e) =>
                          setNewComment((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        className={`flex-grow p-2 rounded-l border ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-300'
                        }`}
                        placeholder="Escreva um comentário..."
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
                      >
                        Enviar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Nenhuma publicação encontrada. Seja o primeiro a publicar!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BodyPublic;