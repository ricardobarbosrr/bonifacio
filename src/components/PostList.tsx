import React, { useState } from 'react';
import { usePost } from '../contexts/PostContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { handleImageError, resolveProfilePhotoUrl } from '../utils/profilePhotoUtils';
import { FaTrash, FaEdit, FaComment, FaCheck, FaTimes, FaThumbsUp } from 'react-icons/fa';

const PostList: React.FC = () => {
  const { posts, deletePost, updatePost, addComment, deleteComment, toggleLike, hasUserLiked } = usePost();
  const { currentUser, isAdmin } = useAuth();
  const { isDarkMode } = useTheme();
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const handleEditPost = (postId: string, title: string, content: string, image_url?: string) => {
    setEditingPostId(postId);
    setEditTitle(title);
    setEditContent(content);
    setEditImageUrl(image_url || null);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditTitle('');
    setEditContent('');
    setEditImageUrl(null);
  };

  const handleSaveEdit = async (postId: string) => {
    try {
      await updatePost(postId, {
        title: editTitle,
        content: editContent,
        image_url: editImageUrl || undefined
      });
      setEditingPostId(null);
      setEditTitle('');
      setEditContent('');
      setEditImageUrl(null);
    } catch (error) {
      console.error('Erro ao atualizar post:', error);
      alert('Erro ao atualizar post. Por favor, tente novamente.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este post?')) {
      try {
        await deletePost(postId);
      } catch (error) {
        console.error('Erro ao excluir post:', error);
        alert('Erro ao excluir post. Por favor, tente novamente.');
      }
    }
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentText(prev => ({ ...prev, [postId]: text }));
  };

  const handleAddComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;

    try {
      await addComment(postId, text);
      setCommentText(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário. Por favor, tente novamente.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este comentário?')) {
      try {
        await deleteComment(commentId);
      } catch (error) {
        console.error('Erro ao excluir comentário:', error);
        alert('Erro ao excluir comentário. Por favor, tente novamente.');
      }
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedPost(prevId => prevId === postId ? null : postId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEditPost = (post: any) => {
    return isAdmin || (currentUser && currentUser.uid === post.author_id);
  };

  if (!posts || posts.length === 0) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-md p-6 text-center`}>
        <p>Nenhum post encontrado. Seja o primeiro a publicar algo!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map(post => (
        <div 
          key={post.id} 
          className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-md p-4 sm:p-6`}
        >
          {editingPostId === post.id ? (
            // Modo de edição
            <div className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={`w-full p-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-gray-100 text-gray-900 border-gray-300'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Título"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={`w-full p-2 rounded-lg resize-none ${
                  isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-gray-100 text-gray-900 border-gray-300'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                rows={4}
                placeholder="Conteúdo"
              />
              {editImageUrl && (
                <div className="relative mt-2">
                  <img 
                    src={editImageUrl} 
                    alt="Imagem do post" 
                    className="max-h-60 rounded-lg object-contain mx-auto border border-gray-300 dark:border-gray-600" 
                  />
                  <button
                    type="button"
                    onClick={() => setEditImageUrl(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    aria-label="Remover imagem"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center"
                >
                  <FaTimes className="mr-1" /> Cancelar
                </button>
                <button
                  onClick={() => handleSaveEdit(post.id)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center"
                >
                  <FaCheck className="mr-1" /> Salvar
                </button>
              </div>
            </div>
          ) : (
            // Modo de visualização
            <>
              <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-2">
                <div className="flex items-start space-x-3">
                  <img
                    src={resolveProfilePhotoUrl(post.author_photo, post.author_name, 40)}
                    alt={post.author_name}
                    className="w-10 h-10 rounded-full border-2 border-green-700 dark:border-green-400 object-cover flex-shrink-0"
                    onError={(e) => handleImageError(e, '40x40', post.author_name)}
                  />
                  <div>
                    <h3 className="font-semibold">
                      {post.author_name}
                      {isAdmin && currentUser?.uid !== post.author_id && (
                        <span className="text-xs text-green-500 ml-2">(Admin)</span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(post.created_at)}
                    </p>
                  </div>
                </div>
                
                {canEditPost(post) && (
                  <div className="flex space-x-2 ml-auto">
                    <button
                      onClick={() => handleEditPost(post.id, post.title, post.content, post.image_url)}
                      className={`p-1.5 rounded-full ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      } transition-colors text-blue-500`}
                      aria-label="Editar post"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className={`p-1.5 rounded-full ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      } transition-colors text-red-500`}
                      aria-label="Excluir post"
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <h2 className="text-xl font-bold mb-2 break-words">{post.title}</h2>
                <p className="whitespace-pre-wrap break-words">{post.content}</p>
                
                {/* Exibir a imagem do post se houver */}
                {post.image_url && (
                  <div className="mt-3">
                    <img 
                      src={post.image_url} 
                      alt="Imagem do post" 
                      className="max-h-96 w-full rounded-lg object-contain mx-auto border border-gray-300 dark:border-gray-600" 
                      onError={(e) => {
                        // Esconder a imagem se não carregar
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center text-sm bg-transparent ${
                      isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    } transition-colors`}
                  >
                    <FaComment className="mr-1" />
                    {post.comments?.length || 0} Comentário{(post.comments?.length || 0) !== 1 ? 's' : ''}
                  </button>
                  
                  <button
                    onClick={() => {
                      if (currentUser) {
                        toggleLike(post.id);
                      } else {
                        alert('Você precisa estar logado para curtir um post');
                      }
                    }}
                    className={`flex items-center text-sm bg-transparent ${
                      hasUserLiked(post.id)
                        ? 'text-blue-500 hover:text-blue-700'
                        : isDarkMode
                          ? 'text-gray-300 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    } transition-colors`}
                  >
                    <FaThumbsUp className="mr-1" />
                    {post.likes?.length || 0} Curtida{(post.likes?.length || 0) !== 1 ? 's' : ''}
                  </button>
                </div>

                {expandedPost === post.id && (
                  <div className="mt-3 space-y-3">
                    {post.comments.length > 0 && (
                      <div className="space-y-3">
                        {post.comments.map(comment => (
                          <div 
                            key={comment.id} 
                            className={`${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                            } p-3 rounded-lg`}
                          >
                            <div className="flex flex-wrap justify-between items-start gap-2">
                              <div className="flex items-center space-x-2">
                                <img
                                  src={resolveProfilePhotoUrl(null, comment.author_name, 24)}
                                  alt={comment.author_name}
                                  className="w-6 h-6 rounded-full border border-green-700 dark:border-green-400 flex-shrink-0"
                                  onError={(e) => handleImageError(e, '24x24', comment.author_name)}
                                />
                                <div>
                                  <span className="font-medium text-sm">{comment.author_name}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                    {formatDate(comment.created_at)}
                                  </span>
                                </div>
                              </div>
                              
                              {(isAdmin || (currentUser && currentUser.uid === comment.author_id)) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  aria-label="Excluir comentário"
                                >
                                  <FaTrash size={12} />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {currentUser && (
                      <div className="flex items-start space-x-2 mt-2">
                        <img
                          src={resolveProfilePhotoUrl(currentUser.photoURL || null, currentUser.displayName || 'Usuário', 32)}
                          alt={currentUser.displayName || "Usuário"}
                          className="w-8 h-8 rounded-full border border-green-700 dark:border-green-400 object-cover flex-shrink-0"
                          onError={(e) => handleImageError(e, '32x32', currentUser.displayName || 'Usuário')}
                        />
                        <div className="flex-grow">
                          <textarea
                            value={commentText[post.id] || ''}
                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                            placeholder="Escreva um comentário..."
                            className={`w-full p-2 rounded-lg resize-none ${
                              isDarkMode
                                ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                                : 'bg-gray-100 text-gray-800 placeholder-gray-500 border-gray-300'
                            } border focus:outline-none focus:ring-2 focus:ring-green-500 text-sm`}
                            rows={2}
                          />
                          <div className="flex justify-end mt-1">
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!commentText[post.id]?.trim()}
                              className={`px-3 py-1 rounded text-white text-sm ${
                                !commentText[post.id]?.trim()
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-green-500 hover:bg-green-600'
                              } transition-colors`}
                            >
                              Comentar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostList;
