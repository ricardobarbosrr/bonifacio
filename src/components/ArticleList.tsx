import React, { useState } from 'react';
import { useArticle, Article as ArticleType } from '../contexts/ArticleContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaEdit, FaTrash, FaComment, FaHeart } from 'react-icons/fa';
import { formatDate } from '../utils/dateUtils';
import { resolveProfilePhotoUrl, handleImageError } from '../utils/profilePhotoUtils';

interface Comment {
  id: string;
  article_id: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

const ArticleList: React.FC = () => {
  const { articles, addComment, deleteComment, toggleLike, hasUserLiked, deleteArticle } = useArticle();
  const { currentUser, isAdmin, isFounder } = useAuth();
  const { isDarkMode } = useTheme();
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const handleCommentSubmit = async (articleId: string) => {
    const text = commentText[articleId];
    if (!text?.trim() || !currentUser) return;

    try {
      await addComment(articleId, text);
      setCommentText(prev => ({ ...prev, [articleId]: '' }));
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário. Por favor, tente novamente.');
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este comentário?')) {
      try {
        await deleteComment(commentId);
      } catch (error) {
        console.error('Erro ao excluir comentário:', error);
        alert('Erro ao excluir comentário. Por favor, tente novamente.');
      }
    }
  };

  const handleLikeToggle = async (articleId: string) => {
    if (!currentUser) return;

    try {
      await toggleLike(articleId);
    } catch (error) {
      console.error('Erro ao alternar curtida:', error);
      alert('Erro ao alternar curtida. Por favor, tente novamente.');
    }
  };

  const handleEditArticle = (article: ArticleType) => {
    // Implementar edição do artigo
    console.log('Editar artigo:', article);
  };

  const handleCommentChange = (articleId: string, text: string) => {
    setCommentText(prev => ({ ...prev, [articleId]: text }));
  };

  const handleExpandArticle = (articleId: string) => {
    setExpandedArticle(expandedArticle === articleId ? null : articleId);
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este artigo?')) {
      try {
        await deleteArticle(articleId);
      } catch (error) {
        console.error('Erro ao excluir artigo:', error);
        alert('Erro ao excluir artigo. Por favor, tente novamente.');
      }
    }
  };

  if (!articles || articles.length === 0) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-md p-6 text-center`}>
        <p>Nenhum artigo encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {articles.map((article: ArticleType) => (
        <article
          key={article.id}
          className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-md p-6`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">{article.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{article.content}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className={`${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} px-2 py-1 rounded-full text-sm`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {(isAdmin || isFounder || currentUser?.uid === article.author_id) && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditArticle(article)}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <FaEdit size={20} />
                </button>
                <button
                  onClick={() => handleDeleteArticle(article.id)}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                >
                  <FaTrash size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLikeToggle(article.id)}
                className={`flex items-center space-x-1 ${hasUserLiked(article.id) ? 'text-red-500 dark:text-red-400' : ''}`}
              >
                <FaHeart size={16} />
                <span>{article.likes?.length || 0}</span>
              </button>

              <button
                onClick={() => handleExpandArticle(article.id)}
                className="flex items-center space-x-1"
              >
                <FaComment size={16} />
                <span>{article.comments?.length || 0}</span>
              </button>
            </div>

            <span>{formatDate(article.created_at)}</span>
          </div>

          {expandedArticle === article.id && (
            <div className="mt-4 space-y-4">
              {article.comments?.map((comment: Comment) => (
                <div
                  key={comment.id}
                  className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <img
                        src={resolveProfilePhotoUrl(null, comment.author_name)}
                        alt={`${comment.author_name}'s avatar`}
                        className="w-8 h-8 rounded-full"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => handleImageError(e, '32x32', comment.author_name)}
                      />
                      <div>
                        <p className="font-medium">{comment.author_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(comment.created_at)}
                        </p>
                      </div>
                    </div>

                    {(isAdmin || isFounder || currentUser?.uid === comment.author_id) && (
                      <button
                        onClick={() => handleCommentDelete(comment.id)}
                        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FaTrash size={16} />
                      </button>
                    )}
                  </div>
                  <p className="mt-2">{comment.content}</p>
                </div>
              ))}

              {currentUser && (
                <div className="mt-4">
                  <textarea
                    value={commentText[article.id] || ''}
                    onChange={(e) => handleCommentChange(article.id, e.target.value)}
                    placeholder="Escreva um comentário..."
                    className={`w-full p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} border border-gray-300 dark:border-gray-600`}
                    rows={3}
                  />
                  <button
                    onClick={() => handleCommentSubmit(article.id)}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    Comentar
                  </button>
                </div>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
};

export default ArticleList;
