import React, { useState, useRef } from 'react';
import { useArticle } from '../contexts/ArticleContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaImage, FaTimes, FaFolderOpen } from 'react-icons/fa';

interface ArticleFormData {
  title: string;
  content: string;
  image_url?: string;
  category: string;
  tags: string[];
  reading_time: number;
  excerpt: string;
  featured_image: File | null;
  featured_image_preview: string | null;
  cover_color: string;
  custom_font: string;
}

const CreateArticle: React.FC = () => {
  const { addArticle } = useArticle();
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    category: '',
    tags: [],
    reading_time: 0,
    excerpt: '',
    featured_image: null,
    featured_image_preview: null,
    cover_color: '#ffffff',
    custom_font: 'system-ui'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{type: string, message: string}>({
    type: '',
    message: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Funções para lidar com categorias e tags
  const addTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tag]
    }));
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Função para calcular tempo de leitura
  const calculateReadingTime = (content: string) => {
    const words = content.split(' ').length;
    return Math.ceil(words / 200);
  };

  // Função para criar o artigo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Verificar se o usuário está autenticado
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Você precisa estar logado para criar um artigo');
      }

      // Preparar os dados para envio
      const articleData = {
        title: formData.title,
        content: formData.content,
        image_url: formData.image_url,
        category: formData.category,
        tags: formData.tags,
        reading_time: formData.reading_time,
        excerpt: formData.excerpt,
        featured_image: formData.featured_image_preview,
        cover_color: formData.cover_color,
        custom_font: formData.custom_font
      };

      // Enviar os dados
      await addArticle(articleData);
      
      setFeedback({
        type: 'success',
        message: 'Artigo criado com sucesso!'
      });
      
      // Limpar o formulário após o sucesso
      setFormData({
        title: '',
        content: '',
        category: '',
        tags: [],
        reading_time: 0,
        excerpt: '',
        featured_image: null,
        featured_image_preview: null,
        cover_color: '#ffffff',
        custom_font: 'system-ui'
      });
    } catch (error) {
      console.error('Erro ao criar artigo:', error);
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao criar o artigo. Por favor, tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <h1 className={`text-3xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Criar Novo Artigo
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Título do Artigo
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Digite o título do seu artigo"
            required
          />
        </div>

        {/* Imagem em Destaque */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Imagem em Destaque
          </label>
          <div className="flex items-center">
            {formData.featured_image_preview ? (
              <div className="relative">
                <img 
                  src={formData.featured_image_preview} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, featured_image: null, featured_image_preview: null }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} hover:opacity-90`}
              >
                <FaImage size={20} />
                <span>Selecionar Imagem</span>
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setFormData(prev => ({
                      ...prev,
                      featured_image: file,
                      featured_image_preview: event.target?.result as string
                    }));
                  };
                  reader.readAsDataURL(file);
                }
              }}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Categorias e Tags */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Categoria
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <FaFolderOpen size={20} />
              <span className="text-gray-600">Selecione uma categoria</span>
            </div>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            >
              <option value="">Selecione uma categoria</option>
              <option value="noticias">Notícias</option>
              <option value="artigos">Artigos</option>
              <option value="opiniao">Opinião</option>
              <option value="entrevistas">Entrevistas</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={14} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Adicionar nova tag..."
                className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    addTag(e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Cor de Fundo e Fonte Personalizada */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Cor de Fundo
            </label>
            <input
              type="color"
              value={formData.cover_color}
              onChange={(e) => setFormData(prev => ({ ...prev, cover_color: e.target.value }))}
              className="w-full h-10 rounded-lg"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Fonte Personalizada
            </label>
            <select
              value={formData.custom_font}
              onChange={(e) => setFormData(prev => ({ ...prev, custom_font: e.target.value }))}
              className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="system-ui">Sistema</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Open Sans', sans-serif">Open Sans</option>
              <option value="'Lato', sans-serif">Lato</option>
              <option value="'Montserrat', sans-serif">Montserrat</option>
            </select>
          </div>
        </div>

        {/* Resumo e Tempo de Leitura */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Resumo
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              rows={3}
              placeholder="Escreva um breve resumo do seu artigo..."
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Tempo de Leitura
            </label>
            <div className="text-gray-600">
              {calculateReadingTime(formData.content)} minuto(s)
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Conteúdo do Artigo
          </label>
          <div className="rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}">
            <div className="p-4">
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className={`w-full h-96 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                placeholder="Escreva o conteúdo do seu artigo..."
                required
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                title: '',
                content: '',
                category: '',
                tags: [],
                reading_time: 0,
                excerpt: '',
                featured_image: null,
                featured_image_preview: null,
                cover_color: '#ffffff',
                custom_font: 'system-ui'
              });
            }}
            className={`px-6 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} hover:opacity-90`}
          >
            Limpar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2 rounded-lg ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Criando...' : 'Criar Artigo'}
          </button>
        </div>

        {/* Feedback */}
        {feedback.message && (
          <div className={`mt-4 p-4 rounded-lg ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {feedback.message}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateArticle;
