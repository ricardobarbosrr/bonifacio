import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Função auxiliar para obter o token de autenticação
const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Não autorizado. Por favor, faça login novamente.');
  }
  return token;
};

export const posts = {
  getAllPosts: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts.php`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao carregar posts:', error);
      return [];
    }
  },

  createPost: async (title: string, content: string, image_url?: string) => {
    const token = getAuthToken();
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/posts.php`,
        { title, content, image_url },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar post:', error.response?.data || error);
      throw error;
    }
  },

  updatePost: async (id: string, title: string, content: string, image_url?: string) => {
    const token = getAuthToken();
    
    try {
      const response = await axios.put(
        `${API_BASE_URL}/posts.php?id=${id}`,
        { title, content, image_url },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar post:', error.response?.data || error);
      throw error;
    }
  },

  deletePost: async (id: string) => {
    const token = getAuthToken();
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/posts.php?id=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao excluir post:', error.response?.data || error);
      throw error;
    }
  },

  addComment: async (postId: string, content: string) => {
    const token = getAuthToken();
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/comments.php`,
        { post_id: postId, content },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error.response?.data || error);
      throw error;
    }
  },

  deleteComment: async (commentId: string) => {
    const token = getAuthToken();
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/comments.php?id=${commentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao excluir comentário:', error.response?.data || error);
      throw error;
    }
  },

  toggleLike: async (postId: string) => {
    const token = getAuthToken();
    
    try {
      // Uso do método PUT com parâmetros específicos para a ação de toggleLike
      const response = await axios.put(
        `${API_BASE_URL}/posts.php?id=${postId}&action=toggleLike`,
        {},  // Corpo vazio, a ação é determinada pelos parâmetros da URL
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Verificar se a resposta contém o post atualizado
      if (response.data && response.data.post) {
        return response.data.post;
      }
      
      // Se não houver post na resposta, disparar erro
      throw new Error('Resposta inválida do servidor ao processar curtida');
    } catch (error: any) {
      // Verificar se o erro é de autenticação
      if (error.response?.status === 401) {
        // Limpar token expirado
        localStorage.removeItem('authToken');
        throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
      }
      
      console.error('Erro ao curtir/descurtir post:', error.response?.data || error);
      throw error;
    }
  }
};
