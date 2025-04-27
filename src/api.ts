// Configuração da API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://corpbonifacio.com.br/api';
// Versão adaptada para backend JSON

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
    headers: createHeaders()
  };
  
  // Apenas adicionar credentials quando realmente necessitar de cookies
  if (endpoint.includes('/auth/')) {
    defaultOptions.credentials = 'include';
  }

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
    const response = await fetchApi('/auth/register', {
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
    const response = await fetchApi('/auth/login', {
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
      // Usar uma abordagem direta para carregar os dados do usuário autenticado
      const response = await fetch(`http://localhost:8000/proxy.php?file=users`);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      
      const allUsers = await response.json();
      
      // Decodificar o token JWT (parte simples sem verificação de assinatura)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Token inválido');
      }
      
      // Decodificar a parte de payload do token (segunda parte)
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('Payload do token JWT:', payload); // Para depuração
      
      // O ID do usuário está no campo 'sub' do JWT
      const userId = payload.sub;
      
      // Encontrar o usuário correspondente ao ID no token
      const currentUser = allUsers.find((user: any) => user.id === userId);
      
      if (!currentUser) {
        throw new Error('Usuário não encontrado');
      }
      
      // Mapear dados do usuário para o formato esperado
      return {
        uid: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.display_name || currentUser.username || 'Usuário',
        isAdmin: Boolean(currentUser.is_admin),
        isFounder: Boolean(currentUser.is_founder),
        photoURL: currentUser.photo_url || null
      };
    } catch (error) {
      console.error('Erro na autenticação:', error);
      localStorage.removeItem('authToken');
      return null;
    }
  },
  
  // Logout
  async logout(): Promise<void> {
    try {
      await fetchApi('/auth/logout', {
        method: 'POST'
      });
    } catch (e) {
      console.error('Erro ao fazer logout no servidor:', e);
    } finally {
      localStorage.removeItem('authToken');
    }
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
    // Usar o proxy para evitar problemas de CORS
    const response = await fetch(`http://localhost:8000/proxy.php?file=posts`);
    if (!response.ok) {
      throw new Error('Falha ao obter posts');
    }
    return await response.json();
  },
  
  // Obter um post específico
  async getPost(id: string): Promise<Post> {
    const response = await fetchApi(`/posts/${id}`);
    return await response.json();
  },
  
  // Criar um novo post
  async createPost(title: string, content: string, image_url?: string): Promise<Post> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content, image_url })
    });
    
    await handleApiError(response);
    
    return await response.json();
  },
  
  // Atualizar um post
  async updatePost(id: string, title: string, content: string, image_url?: string): Promise<Post> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content, image_url }),
    });
    
    await handleApiError(response);
    
    return await response.json();
  },
  
  // Excluir um post
  async deletePost(id: string): Promise<{ message: string }> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });
    
    await handleApiError(response);
    
    return await response.json();
  },
  
  // Adicionar um comentário
  async addComment(postId: string, content: string): Promise<Comment> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ post_id: postId, content })
    });
    
    await handleApiError(response);
    
    return await response.json();
  },
  
  // Excluir um comentário
  async deleteComment(id: string): Promise<{ message: string }> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/comments/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    await handleApiError(response);
    
    return await response.json();
  },
  
  // Curtir/descurtir um post
  async toggleLike(postId: string): Promise<{ message: string }> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    await handleApiError(response);
    
    return await response.json();
  }
};

// Funções para artigos
export const articles = {
  // Obter todos os artigos (compatibilidade)
  async getAllArticles(): Promise<any[]> {
    return this.getAll();
  },

  // Obter um artigo específico
  async getArticle(id: string): Promise<any> {
    const response = await fetchApi(`/articles/${id}`);
    return await response.json();
  },
  
  // Obter todos os artigos
  async getAll(category?: string, tag?: string): Promise<any[]> {
    let url = '/articles';
    const params = [];
    
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (tag) params.push(`tag=${encodeURIComponent(tag)}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    const response = await fetchApi(url);
    return await response.json();
  },

  async createArticle(title: string, content: string, image_url?: string, category?: string, tags?: string[]): Promise<any> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content, image_url, category, tags })
    });
    
    await handleApiError(response);
    return await response.json();
  },

  async updateArticle(id: string, title: string, content: string, image_url?: string, category?: string, tags?: string[]): Promise<any> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content, image_url, category, tags })
    });
    
    await handleApiError(response);
    return await response.json();
  },

  async deleteArticle(id: string): Promise<any> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    await handleApiError(response);
    return await response.json();
  },

  async addComment(articleId: string, content: string): Promise<any> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });
    return response.json();
  },

  async deleteComment(commentId: string): Promise<any> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/articles/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  async toggleLike(articleId: string): Promise<any> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/like`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
};
