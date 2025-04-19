// Configuração da API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://corpbonifacio.com.br/api';

// Função para obter o token de autenticação
const getAuthToken = () => localStorage.getItem('authToken');

// Função para criar headers padrão
const createHeaders = (contentType = 'application/json') => {
  const headers: Record<string, string> = {
    'Content-Type': contentType
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Função para fazer requisições à API
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: createHeaders()
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });

    // Verificar se a resposta é HTML (indica erro no servidor)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('O servidor retornou uma página HTML ao invés de JSON. Isso pode indicar um erro no servidor.');
    }

    if (response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login'; // Redirecionar para login
      throw new Error('Não autorizado. Por favor, faça login novamente.');
    }

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`);
      } catch (e) {
        if (e instanceof Error) {
          throw e; // Re-throw se já for um erro formatado
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao fazer requisição à API');
  }
};

// Função auxiliar para tratar erros da API
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro desconhecido');
    } catch (e) {
      if (response.status === 401) {
        throw new Error('Não autorizado. Por favor, faça login novamente.');
      } else if (response.status === 422) {
        throw new Error('Dados inválidos. Verifique as informações enviadas.');
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    }
  }
  return response;
};

// Interfaces
export interface User {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isFounder: boolean;
  photoURL?: string;
}

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
  likes?: string[];
  image_url?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

// Funções de autenticação
export const auth = {
  // Registrar um novo usuário
  async register(email: string, password: string, displayName: string): Promise<User> {
    const response = await fetchApi('/auth.php?action=register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName })
    });
    
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  },
  
  // Login de usuário
  async login(email: string, password: string): Promise<User> {
    const response = await fetchApi('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  },
  
  // Verificar autenticação atual
  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return null;
    }
    
    try {
      const response = await fetchApi('/auth.php?action=current');
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        localStorage.removeItem('authToken');
        return null;
      }
      throw error;
    }
  },
  
  // Logout
  logout(): void {
    localStorage.removeItem('authToken');
  }
};

// Funções para upload de imagens
export const upload = {
  // Fazer upload de uma imagem
  async uploadImage(file: File): Promise<string> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_BASE_URL}/upload.php`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer upload da imagem');
    }
    
    const result = await response.json();
    return result.imageUrl || result.image_url;
  }
};

// Funções para posts
export const posts = {
  // Obter todos os posts
  async getAllPosts(): Promise<Post[]> {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/posts.php`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    if (!response.ok) {
      throw new Error('Erro ao obter posts');
    }
    
    return await response.json();
  },
  
  // Obter um post específico
  async getPost(id: string): Promise<Post> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/posts.php?id=${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Erro ao obter post');
    }
    
    return await response.json();
  },
  
  // Criar um novo post
  async createPost(title: string, content: string, image_url?: string): Promise<Post> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      // Criamos um objeto com tipagem correta
      const postData: {
        title: string;
        content: string;
        image_url?: string;
      } = { 
        title, 
        content 
      };
      
      // Só adicionamos image_url se ele existir
      if (image_url) {
        postData.image_url = image_url;
      }
      
      const response = await fetch(`${API_BASE_URL}/posts.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });
      
      await handleApiError(response);
      
      const responseData = await response.json();
      
      return responseData;
    } catch (error) {
      console.error('Erro na requisição para criar post:', error);
      throw error;
    }
  },
  
  // Atualizar um post
  async updatePost(id: string, title: string, content: string, image_url?: string): Promise<Post> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/posts.php?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content, image_url }),
    });
    
    await handleApiError(response);
    
    return await response.json();
  },
  
  // Excluir um post
  async deletePost(id: string): Promise<{ message: string }> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/posts.php?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    await handleApiError(response);
    
    return await response.json();
  },
  
  // Adicionar um comentário
  async addComment(postId: string, content: string): Promise<Comment> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetchApi('/comments.php?action=create', {
      method: 'POST',
      body: JSON.stringify({ postId, content }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao adicionar comentário');
    }
    
    return await response.json();
  },
  
  // Excluir um comentário
  async deleteComment(id: string): Promise<{ message: string }> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetchApi(`/comments.php?action=delete&id=${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Erro ao excluir comentário');
    }
    
    return await response.json();
  },
  
  // Curtir/descurtir um post
  async toggleLike(postId: string): Promise<{ message: string }> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetchApi(`/posts.php?action=toggleLike&id=${postId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Erro ao curtir/descurtir post');
    }
   
    
    
    return await response.json();
  }
};

// Funções para artigos
export const articles = {
  getAllArticles: async () => {
    const response = await fetch(`${API_BASE_URL}/articles`);
    return response.json();
  },

  getAll: async (category?: string, tag?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (tag) params.append('tag', tag);
    
    const response = await fetch(`${API_BASE_URL}/articles?${params.toString()}`);
    return response.json();
  },

  createArticle: async (title: string, content: string, image_url?: string, 
                       category?: string, tags?: string[]) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title,
        content,
        image_url,
        category,
        tags
      })
    });
    return response.json();
  },

  create: async (articleData: any) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(articleData)
    });
    return response.json();
  },

  updateArticle: async (id: string, title: string, content: string, image_url?: string, 
                       category?: string, tags?: string[]) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/articles?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title,
        content,
        image_url,
        category,
        tags
      })
    });
    return response.json();
  },

  update: async (id: string, articleData: any) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/articles?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(articleData)
    });
    return response.json();
  },

  deleteArticle: async (id: string) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/articles?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.json();
  },

  delete: async (id: string) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/articles?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.json();
  },

  addComment: async (articleId: string, content: string) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ content })
    });
    return response.json();
  },

  deleteComment: async (commentId: string) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.json();
  },

  toggleLike: async (articleId: string) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.json();
  }
};
