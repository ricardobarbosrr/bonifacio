import React, { createContext, useContext, useState, useEffect } from 'react';
import { posts as postsAPI } from '../api';
import { useAuth } from './AuthContext';

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_photo?: string;
  created_at: string;
  updated_at?: string;
  comments: Comment[];
  likes?: string[]; // Array com IDs dos usuários que curtiram
  image_url?: string; // URL da imagem associada ao post
}

export interface Comment {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

export interface PostFormData {
  id?: string;
  title: string;
  content: string;
  image_url?: string;
}

interface PostContextType {
  posts: Post[];
  addPost: (post: PostFormData) => Promise<void>;
  updatePost: (id: string, post: Partial<PostFormData>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  hasUserLiked: (postId: string) => boolean;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const { currentUser, isAdmin } = useAuth();

  const refreshPosts = async () => {
    try {
      const postsData = await postsAPI.getAllPosts();
      
      // Normalizar os dados para garantir que todas as propriedades esperadas existam
      const normalizedPosts = postsData.map((post: any) => ({
        ...post,
        // Garantir que comments sempre seja um array
        comments: Array.isArray(post.comments) ? post.comments : [],
        // Garantir que likes sempre seja um array
        likes: Array.isArray(post.likes) ? post.likes : []
      }));
      
      setPosts(normalizedPosts);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    }
  };

  useEffect(() => {
    refreshPosts();
  }, []);

  const addPost = async (post: PostFormData) => {
    if (!currentUser) {
      throw new Error('Você precisa estar logado para publicar');
    }

    try {
      await postsAPI.createPost(post.title, post.content, post.image_url);
      await refreshPosts();
    } catch (error) {
      console.error('Erro ao adicionar post:', error);
      throw error;
    }
  };

  const updatePost = async (id: string, post: Partial<PostFormData>) => {
    const postToUpdate = posts.find(p => p.id === id);
    
    if (!postToUpdate) {
      throw new Error('Post não encontrado');
    }

    if (!isAdmin && currentUser?.uid !== postToUpdate.author_id) {
      throw new Error('Você não tem permissão para editar este post');
    }

    try {
      await postsAPI.updatePost(
        id, 
        post.title || postToUpdate.title, 
        post.content || postToUpdate.content,
        post.image_url
      );
      await refreshPosts();
    } catch (error) {
      console.error('Erro ao atualizar post:', error);
      throw error;
    }
  };

  const deletePost = async (id: string) => {
    const postToDelete = posts.find(p => p.id === id);
    
    if (!postToDelete) {
      throw new Error('Post não encontrado');
    }

    if (!isAdmin && currentUser?.uid !== postToDelete.author_id) {
      throw new Error('Você não tem permissão para excluir este post');
    }

    try {
      await postsAPI.deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      console.error('Erro ao excluir post:', error);
      throw error;
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!currentUser) {
      throw new Error('Você precisa estar logado para comentar');
    }

    try {
      const newComment = await postsAPI.addComment(postId, content);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...post.comments, newComment]
            };
          }
          return post;
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
      await postsAPI.deleteComment(commentId);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          return {
            ...post,
            comments: post.comments.filter(c => c.id !== commentId)
          };
        })
      );
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      throw error;
    }
  };

  const toggleLike = async (postId: string) => {
    if (!currentUser) {
      throw new Error('Você precisa estar logado para curtir um post');
    }

    try {
      await postsAPI.toggleLike(postId);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const userLiked = post.likes?.includes(currentUser.uid) || false;
            return {
              ...post,
              likes: userLiked
                ? post.likes?.filter(uid => uid !== currentUser.uid)
                : [...(post.likes || []), currentUser.uid]
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Erro ao curtir/descurtir post:', error);
      throw error;
    }
  };

  const hasUserLiked = (postId: string) => {
    if (!currentUser) return false;
    const post = posts.find(p => p.id === postId);
    return post?.likes?.includes(currentUser.uid) || false;
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        addPost,
        updatePost,
        deletePost,
        addComment,
        deleteComment,
        refreshPosts,
        toggleLike,
        hasUserLiked
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost deve ser usado dentro de um PostProvider');
  }
  return context;
};
