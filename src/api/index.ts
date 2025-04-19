import axios from 'axios';
import { posts } from './posts';

// Configuração base do axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('Erro na requisição:', error);
  return Promise.reject(error);
});

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log('Erro na resposta:', error.response?.status, error.message);

    // Se o erro for 401 e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tentar renovar o token
        const response = await api.post('/auth/refresh');
        const { token } = response.data;

        // Atualizar token no localStorage
        localStorage.setItem('authToken', token);

        // Atualizar token no header da requisição original
        originalRequest.headers.Authorization = `Bearer ${token}`;

        // Repetir a requisição original com o novo token
        return api(originalRequest);
      } catch (refreshError) {
        // Se falhar em renovar o token, fazer logout
        localStorage.removeItem('authToken');
        console.log('Token expirado, redirecionando para login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Funções de API

// Auth
export const login = (email: string, password: string) => 
  api.post('/auth/login', { email, password });

export const logout = () => 
  api.post('/auth/logout');

// Exportamos o módulo posts de forma modular
export { posts };

// Articles
export const getArticles = () => 
  api.get('/articles.php');

export const createArticle = (data: any) => 
  api.post('/articles.php', data);

export const updateArticle = (id: string, data: any) => 
  api.put(`/articles.php?id=${id}`, data);

export const deleteArticle = (id: string) => 
  api.delete(`/articles.php?id=${id}`);

// Documents
export const getDocuments = () => 
  api.get('/documents.php');

export const uploadDocument = (formData: FormData) => 
  api.post('/documents.php', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteDocument = (id: string) => 
  api.delete(`/documents.php?id=${id}`);

// Announcements
export const getAnnouncements = () => 
  api.get('/announcements.php');

export const createAnnouncement = (data: any) => 
  api.post('/announcements.php', data);

export const updateAnnouncement = (id: string, data: any) => 
  api.put(`/announcements.php?id=${id}`, data);

export const deleteAnnouncement = (id: string) => 
  api.delete(`/announcements.php?id=${id}`);

export default api;
