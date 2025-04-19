import React, { useState, useRef } from 'react';
import { usePost } from '../contexts/PostContext';
import { useTheme } from '../contexts/ThemeContext';
import { upload } from '../api';
import { FaImage, FaTimes } from 'react-icons/fa';

const CreatePost: React.FC = () => {
  const { addPost } = usePost();
  const { isDarkMode } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error' | 'info' | null, message: string | null}>({
    type: null,
    message: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setFeedback({
        type: 'error',
        message: 'Apenas imagens são permitidas (jpg, png, gif)'
      });
      return;
    }

    // Verificar tamanho do arquivo (limite de 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        type: 'error',
        message: 'A imagem deve ter menos de 5MB'
      });
      return;
    }

    setSelectedImage(file);
    setFeedback({
      type: 'info',
      message: 'Imagem selecionada com sucesso!'
    });
    
    // Limpar feedback após 3 segundos
    setTimeout(() => {
      setFeedback({type: null, message: null});
    }, 3000);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFeedback({
      type: 'info',
      message: 'Imagem removida'
    });
    
    // Limpar feedback após 3 segundos
    setTimeout(() => {
      setFeedback({type: null, message: null});
    }, 3000);
    
    // Limpar o input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    setFeedback({
      type: 'info',
      message: 'Enviando imagem...'
    });
    
    try {
      const imageUrl = await upload.uploadImage(file);
      setFeedback({
        type: 'success',
        message: 'Imagem enviada com sucesso!'
      });
      return imageUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      let errorMessage = 'Falha ao enviar imagem. Verifique sua conexão e tente novamente.';
      
      if (error.message) {
        if (error.message.includes('tamanho')) {
          errorMessage = 'A imagem excede o tamanho máximo permitido.';
        } else if (error.message.includes('tipo')) {
          errorMessage = 'Formato de imagem não permitido.';
        } else if (error.message.includes('conexão') || error.message.includes('network')) {
          errorMessage = 'Falha na conexão de rede. Verifique sua internet.';
        } else if (error.message.includes('permissão') || error.message.includes('autoriza')) {
          errorMessage = 'Você não tem permissão para fazer upload de imagens.';
        }
      }
      
      setFeedback({
        type: 'error',
        message: errorMessage
      });
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setFeedback({
        type: 'error',
        message: 'O título é obrigatório'
      });
      return;
    }
    
    if (!content.trim()) {
      setFeedback({
        type: 'error',
        message: 'O conteúdo é obrigatório'
      });
      return;
    }
    
    setIsLoading(true);
    setFeedback({
      type: 'info',
      message: 'Enviando publicação...'
    });
    
    try {
      let image_url: string | undefined;
      
      if (selectedImage) {
        try {
          console.log("Iniciando upload da imagem");
          const result = await handleImageUpload(selectedImage);
          console.log("Upload da imagem concluído:", result);
          image_url = result;
        } catch (error) {
          console.error("Erro durante o upload da imagem:", error);
          // Erro já tratado no handleImageUpload
          setIsLoading(false);
          return;
        }
      }
      
      // Dados para a criação do post
      const postData = {
        title: title.trim(),
        content: content.trim(),
        ...(image_url ? { image_url } : {})
      };
      
      console.log("Enviando dados para criação do post:", postData);
      
      // Criar o post
      await addPost(postData);
      console.log("Post criado com sucesso");
      
      // Limpar formulário após postagem bem-sucedida
      setTitle('');
      setContent('');
      setSelectedImage(null);
      setImagePreview(null);
      
      // Reset do input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setFeedback({
        type: 'success',
        message: 'Publicação realizada com sucesso!'
      });
      
      // Limpar o feedback de sucesso após 5 segundos
      setTimeout(() => {
        setFeedback({type: null, message: null});
      }, 5000);
      
    } catch (error: any) {
      console.error('Erro ao criar post:', error);
      let errorMessage = 'Falha ao criar publicação. Tente novamente.';
      
      if (error.message) {
        if (error.message.includes('logado') || error.message.includes('autenticado')) {
          errorMessage = 'Você precisa estar logado para publicar.';
        } else if (error.message.includes('conexão') || error.message.includes('network')) {
          errorMessage = 'Falha na conexão de rede. Verifique sua internet.';
        } else if (error.message.includes('permissão') || error.message.includes('autoriza')) {
          errorMessage = 'Você não tem permissão para criar publicações.';
        } else if (error.message.includes('banco de dados') || error.message.includes('database')) {
          errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
        } else if (error.message.includes('Dados inválidos')) {
          errorMessage = 'Formato de dados inválido. Tente novamente.';
        }
      }
      
      setFeedback({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-md p-4 sm:p-6`}>
      <h2 className="text-xl font-semibold mb-4">Criar nova publicação</h2>
      
      {feedback.message && (
        <div className={`mb-4 p-3 rounded-md ${
          feedback.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' : 
          feedback.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 
          'bg-blue-100 text-blue-700 border border-blue-300'
        }`}>
          {feedback.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Título da publicação"
            className={`w-full p-2 sm:p-3 rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div>
          <textarea
            placeholder="O que você está pensando?"
            className={`w-full p-2 sm:p-3 rounded-md border min-h-[100px] resize-vertical ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        {/* Preview da imagem */}
        {imagePreview && (
          <div className="relative">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full max-h-60 object-contain rounded-md border border-gray-300 dark:border-gray-600"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
              disabled={isLoading}
              aria-label="Remover imagem"
            >
              <FaTimes />
            </button>
          </div>
        )}
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className={`flex items-center cursor-pointer ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} transition-colors`}>
              <FaImage className="mr-2" />
              <span>Adicionar imagem</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                disabled={isLoading}
              />
            </label>
          </div>
          
          <button
            type="submit"
            className={`px-4 py-2 rounded-md transition-colors ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-500 hover:bg-blue-600'
            } text-white font-medium`}
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Publicar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
