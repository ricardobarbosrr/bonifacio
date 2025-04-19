import React, { useState, useRef } from 'react';
import { useArticle, ArticleFormData } from '../contexts/ArticleContext';
import { useTheme } from '../contexts/ThemeContext';
import { upload } from '../api';
import { FaImage, FaTimes } from 'react-icons/fa';

interface ArticleFormProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  initialData?: ArticleFormData;
}

const ArticleForm: React.FC<ArticleFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const { addArticle } = useArticle();
  const { isDarkMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ArticleFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    image_url: initialData?.image_url,
    category: initialData?.category || '',
    tags: initialData?.tags || []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      const imageUrl = await upload.uploadImage(file);
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
    } catch (error) {
      setError('Erro ao fazer upload da imagem. Por favor, tente novamente.');
      console.error('Erro no upload:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags?.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...(prev.tags || []), tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Título e conteúdo são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await addArticle(formData);
      onSubmit?.();
    } catch (error) {
      setError('Erro ao publicar artigo. Por favor, tente novamente.');
      console.error('Erro ao publicar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100">
          {error}
        </div>
      )}

      <div>
        <label 
          htmlFor="title" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Título
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Digite o título do artigo"
          className={`w-full rounded-md shadow-sm ${
            isDarkMode
              ? 'bg-gray-700 text-white placeholder-gray-400'
              : 'bg-white text-gray-900 placeholder-gray-500'
          } border border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500`}
          required
        />
      </div>

      <div>
        <label 
          htmlFor="category" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Categoria
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`w-full rounded-md shadow-sm ${
            isDarkMode
              ? 'bg-gray-700 text-white'
              : 'bg-white text-gray-900'
          } border border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500`}
        >
          <option value="">Selecione uma categoria</option>
          <option value="Notícias">Notícias</option>
          <option value="Eventos">Eventos</option>
          <option value="Artigos">Artigos</option>
          <option value="Tutorial">Tutorial</option>
          <option value="Outros">Outros</option>
        </select>
      </div>

      <div>
        <label 
          htmlFor="tags" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Tags (pressione Enter para adicionar)
        </label>
        <input
          type="text"
          id="tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Digite uma tag e pressione Enter"
          className={`w-full rounded-md shadow-sm ${
            isDarkMode
              ? 'bg-gray-700 text-white placeholder-gray-400'
              : 'bg-white text-gray-900 placeholder-gray-500'
          } border border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500`}
        />
        {formData.tags && formData.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm ${
                  isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FaTimes size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label 
          htmlFor="content" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Conteúdo
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Digite o conteúdo do artigo"
          rows={6}
          className={`w-full rounded-md shadow-sm ${
            isDarkMode
              ? 'bg-gray-700 text-white placeholder-gray-400'
              : 'bg-white text-gray-900 placeholder-gray-500'
          } border border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500`}
          required
        />
      </div>

      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
        
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleImageClick}
            className={`flex items-center px-4 py-2 rounded-md ${
              isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FaImage className="mr-2" />
            {formData.image_url ? 'Trocar imagem' : 'Adicionar imagem'}
          </button>
          
          {formData.image_url && (
            <button
              type="button"
              onClick={removeImage}
              className="text-red-500 hover:text-red-700"
            >
              <FaTimes /> Remover imagem
            </button>
          )}
        </div>

        {formData.image_url && (
          <div className="mt-2">
            <img
              src={formData.image_url}
              alt="Preview"
              className="max-h-48 rounded-md"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-md ${
              isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancelar
          </button>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded-md bg-green-600 text-white ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
          }`}
        >
          {loading ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </form>
  );
};

export default ArticleForm;
