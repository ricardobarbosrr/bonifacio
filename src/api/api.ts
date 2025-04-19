import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://corpbonifacio.com.br/api';

export const articles = {
    getAllArticles: async () => {
        const response = await axios.get(`${API_URL}/articles`);
        return response.data;
    },

    getAll: async (category?: string, tag?: string) => {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (tag) params.append('tag', tag);
        
        const response = await axios.get(`${API_URL}/articles`, {
            params: params.toString()
        });
        return response.data;
    },

    createArticle: async (title: string, content: string, image_url?: string, 
                         category?: string, tags?: string[]) => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Não autenticado');
        }

        try {
            const response = await axios.post(`${API_URL}/articles`, {
                title,
                content,
                image_url,
                category,
                tags
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erro ao criar artigo:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error || 'Erro ao criar artigo');
        }
    },

    create: async (articleData: any) => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Não autenticado');
        }

        const response = await axios.post(`${API_URL}/articles`, articleData, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        return response.data;
    },

    updateArticle: async (id: string, title: string, content: string, image_url?: string, 
                         category?: string, tags?: string[]) => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Não autenticado');
        }

        const response = await axios.put(`${API_URL}/articles?id=${id}`, {
            title,
            content,
            image_url,
            category,
            tags
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        return response.data;
    },

    update: async (id: string, articleData: any) => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Não autenticado');
        }

        const response = await axios.put(`${API_URL}/articles?id=${id}`, articleData, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        return response.data;
    },

    deleteArticle: async (id: string) => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Não autenticado');
        }

        const response = await axios.delete(`${API_URL}/articles?id=${id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        return response.data;
    },

    delete: async (id: string) => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Não autenticado');
        }

        const response = await axios.delete(`${API_URL}/articles?id=${id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        return response.data;
    },

    addComment: async (articleId: string, content: string) => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Não autenticado');
        }

        const response = await axios.post(`${API_URL}/articles/${articleId}/comments`, {
            content
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        return response.data;
    },

    deleteComment: async (commentId: string) => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Não autenticado');
        }

        const response = await axios.delete(`${API_URL}/comments/${commentId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        return response.data;
    },

    toggleLike: async (articleId: string) => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Não autenticado');
        }

        const response = await axios.post(`${API_URL}/articles/${articleId}/likes`, null, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        return response.data;
    }
};
