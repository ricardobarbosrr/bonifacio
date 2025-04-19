import React, { createContext, useContext, useState, useEffect } from 'react';
import { articles as articlesAPI } from '../api';
import { useAuth } from './AuthContext';

export interface Article {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_photo?: string;
  created_at: string;
  updated_at?: string;
  comments: Comment[];
  likes?: string[];
  image_url?: string;
  category?: string; // Nova propriedade para categorias
  tags?: string[];  // Nova propriedade para tags
  reading_time?: number; // Nova propriedade para tempo de leitura
}

export interface Comment {
  id: string;
  article_id: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

export interface ArticleFormData {
  id?: string;
  title: string;
  content: string;
  image_url?: string;
  category?: string;
  tags?: string[];
}

interface ArticleContextType {
  articles: Article[];
  addArticle: (article: ArticleFormData) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  addComment: (articleId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  refreshArticles: () => Promise<void>;
  toggleLike: (articleId: string) => Promise<void>;
  hasUserLiked: (articleId: string) => boolean;
  getArticleByCategory: (category: string) => Article[];
  getArticlesByTag: (tag: string) => Article[];
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export const ArticleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const { currentUser, isAdmin } = useAuth();

  const refreshArticles = async () => {
    try {
      const articlesData = await articlesAPI.getAllArticles();
      setArticles(articlesData);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
    }
  };

  useEffect(() => {
    refreshArticles();
  }, []);

  const addArticle = async (article: ArticleFormData) => {
    if (!currentUser) {
      throw new Error('Você precisa estar logado para publicar');
    }

    try {
      await articlesAPI.createArticle(
        article.title,
        article.content,
        article.image_url,
        article.category,
        article.tags
      );
      await refreshArticles();
    } catch (error) {
      console.error('Erro ao adicionar artigo:', error);
      throw error;
    }
  };

  const deleteArticle = async (id: string) => {
    const articleToDelete = articles.find(a => a.id === id);
    
    if (!articleToDelete) {
      throw new Error('Artigo não encontrado');
    }

    if (!isAdmin && currentUser?.uid !== articleToDelete.author_id) {
      throw new Error('Você não tem permissão para excluir este artigo');
    }

    try {
      await articlesAPI.deleteArticle(id);
      setArticles(articles.filter(a => a.id !== id));
    } catch (error) {
      console.error('Erro ao excluir artigo:', error);
      throw error;
    }
  };

  const addComment = async (articleId: string, content: string) => {
    if (!currentUser) {
      throw new Error('Você precisa estar logado para comentar');
    }

    try {
      const newComment = await articlesAPI.addComment(articleId, content);
      
      setArticles(prevArticles => 
        prevArticles.map(article => {
          if (article.id === articleId) {
            return {
              ...article,
              comments: [...article.comments, newComment]
            };
          }
          return article;
        })
      );
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw error;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!currentUser) {
      throw new Error('Você precisa estar logado para excluir um comentário');
    }

    try {
      await articlesAPI.deleteComment(commentId);
      
      setArticles(prevArticles => 
        prevArticles.map(article => {
          return {
            ...article,
            comments: article.comments.filter(c => c.id !== commentId)
          };
        })
      );
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      throw error;
    }
  };

  const toggleLike = async (articleId: string) => {
    if (!currentUser) {
      throw new Error('Você precisa estar logado para curtir um artigo');
    }

    try {
      await articlesAPI.toggleLike(articleId);
      
      setArticles(prevArticles => 
        prevArticles.map(article => {
          if (article.id === articleId) {
            const userLiked = article.likes?.includes(currentUser.uid) || false;
            return {
              ...article,
              likes: userLiked
                ? article.likes?.filter(uid => uid !== currentUser.uid)
                : [...(article.likes || []), currentUser.uid]
            };
          }
          return article;
        })
      );
    } catch (error) {
      console.error('Erro ao curtir/descurtir artigo:', error);
      throw error;
    }
  };

  const hasUserLiked = (articleId: string) => {
    if (!currentUser) return false;
    const article = articles.find(a => a.id === articleId);
    return article?.likes?.includes(currentUser.uid) || false;
  };

  const getArticleByCategory = (category: string) => {
    return articles.filter(article => article.category === category);
  };

  const getArticlesByTag = (tag: string) => {
    return articles.filter(article => article.tags?.includes(tag));
  };

  return (
    <ArticleContext.Provider
      value={{
        articles,
        addArticle,
        deleteArticle,
        addComment,
        deleteComment,
        refreshArticles,
        toggleLike,
        hasUserLiked,
        getArticleByCategory,
        getArticlesByTag
      }}
    >
      {children}
    </ArticleContext.Provider>
  );
};

export const useArticle = () => {
  const context = useContext(ArticleContext);
  if (!context) {
    throw new Error('useArticle deve ser usado dentro do ArticleProvider');
  }
  return context;
};