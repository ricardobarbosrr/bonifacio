import React, { useState } from 'react';
import { useAnnouncements } from '../contexts/AnnouncementContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaCheck, FaPalette, FaArrowLeft } from 'react-icons/fa';

// Interface para o formulário de criação/edição
interface AnnouncementForm {
  id?: string;
  title: string;
  content: string;
  important: boolean;
  backgroundColor: string;
  textColor: string;
}

const AnnouncementAdmin: React.FC = () => {
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, loading } = useAnnouncements();
  const { isAdmin, isFounder } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<AnnouncementForm>({
    title: '',
    content: '',
    important: false,
    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
    textColor: isDarkMode ? '#e5e7eb' : '#1f2937'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Se não for admin nem fundador, não mostrar o componente
  if (!isAdmin && !isFounder) {
    return null;
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentAnnouncement(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Se não for fundador, não permitir marcar como importante
    if (e.target.name === 'important' && e.target.checked && !isFounder) {
      return;
    }
    
    const { name, checked } = e.target;
    setCurrentAnnouncement(prev => ({ ...prev, [name]: checked }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentAnnouncement(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAnnouncement = async () => {
    try {
      setError(null);
      
      if (!currentAnnouncement.title.trim() || !currentAnnouncement.content.trim()) {
        setError('Título e conteúdo são obrigatórios');
        return;
      }
      
      await addAnnouncement(currentAnnouncement);
      
      setSuccess('Anúncio criado com sucesso!');
      setCurrentAnnouncement({
        title: '',
        content: '',
        important: false,
        backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
        textColor: isDarkMode ? '#e5e7eb' : '#1f2937'
      });
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao criar anúncio:', error);
      setError('Erro ao criar anúncio. Por favor, tente novamente.');
    }
  };

  const handleUpdateAnnouncement = async () => {
    try {
      setError(null);
      
      if (!currentAnnouncement.id) {
        setError('ID do anúncio é obrigatório');
        return;
      }
      
      if (!currentAnnouncement.title.trim() || !currentAnnouncement.content.trim()) {
        setError('Título e conteúdo são obrigatórios');
        return;
      }
      
      await updateAnnouncement(currentAnnouncement.id, currentAnnouncement);
      
      setSuccess('Anúncio atualizado com sucesso!');
      setIsEditing(false);
      setCurrentAnnouncement({
        title: '',
        content: '',
        important: false,
        backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
        textColor: isDarkMode ? '#e5e7eb' : '#1f2937'
      });
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao atualizar anúncio:', error);
      setError('Erro ao atualizar anúncio. Por favor, tente novamente.');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este anúncio?')) {
      try {
        setError(null);
        await deleteAnnouncement(id);
        setSuccess('Anúncio excluído com sucesso!');
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error('Erro ao excluir anúncio:', error);
        setError('Erro ao excluir anúncio. Por favor, tente novamente.');
      }
    }
  };

  const handleEditAnnouncement = (announcement: any) => {
    setCurrentAnnouncement({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      important: announcement.important,
      backgroundColor: announcement.backgroundColor,
      textColor: announcement.textColor
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentAnnouncement({
      title: '',
      content: '',
      important: false,
      backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
      textColor: isDarkMode ? '#e5e7eb' : '#1f2937'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Gerenciar Anúncios
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className={`rounded-lg shadow-md p-4 sm:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-xl font-semibold mb-4">
          {isEditing ? 'Editar Anúncio' : 'Novo Anúncio'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Título
            </label>
            <input
              type="text"
              name="title"
              value={currentAnnouncement.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Título do anúncio"
            />
          </div>
          
          <div>
            <label className={`block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Conteúdo
            </label>
            <textarea
              name="content"
              value={currentAnnouncement.content}
              onChange={handleInputChange}
              rows={5}
              className={`w-full px-3 py-2 border rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Conteúdo do anúncio"
            ></textarea>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="important"
                id="important"
                checked={currentAnnouncement.important}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                disabled={!isFounder}
              />
              <label 
                htmlFor="important" 
                className={`flex items-center flex-wrap gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${!isFounder ? 'opacity-50' : ''}`}
                title={!isFounder ? 'Apenas fundadores podem marcar anúncios como importantes' : ''}
              >
                <FaExclamationTriangle className={`${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`} />
                <span>Anúncio importante</span>
                {!isFounder && <span className="text-xs text-red-500">(Apenas fundadores)</span>}
              </label>
            </div>
            
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`flex items-center px-3 py-1.5 rounded transition-colors ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <FaPalette className="mr-1.5" />
              {showColorPicker ? 'Ocultar cores' : 'Personalizar cores'}
            </button>
          </div>
          
          {showColorPicker && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-md mt-2">
              <div>
                <label className={`block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cor de fundo
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="backgroundColor"
                    value={currentAnnouncement.backgroundColor}
                    onChange={handleColorChange}
                    className="w-10 h-10 mr-2 border-0 rounded"
                  />
                  <input
                    type="text"
                    name="backgroundColor"
                    value={currentAnnouncement.backgroundColor}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cor do texto
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="textColor"
                    value={currentAnnouncement.textColor}
                    onChange={handleColorChange}
                    className="w-10 h-10 mr-2 border-0 rounded"
                  />
                  <input
                    type="text"
                    name="textColor"
                    value={currentAnnouncement.textColor}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <div 
                  className="p-4 rounded-md border"
                  style={{
                    backgroundColor: currentAnnouncement.backgroundColor,
                    color: currentAnnouncement.textColor
                  }}
                >
                  <h4 className="font-bold mb-2">Prévia</h4>
                  <p>Este é um exemplo de como o anúncio ficará com as cores selecionadas.</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mt-4">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleUpdateAnnouncement}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                  disabled={loading}
                >
                  <FaCheck className="mr-2" />
                  Salvar alterações
                </button>
                
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center"
                >
                  <FaArrowLeft className="mr-2" />
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleCreateAnnouncement}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                disabled={loading}
              >
                <FaPlus className="mr-2" />
                Criar anúncio
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className={`rounded-lg shadow-md p-4 sm:p-6 mt-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-xl font-semibold mb-4">Anúncios existentes</h3>
        
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : announcements.length === 0 ? (
          <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Nenhum anúncio disponível.
          </p>
        ) : (
          <div className="space-y-4">
            {announcements.map(announcement => (
              <div 
                key={announcement.id}
                className={`border rounded-lg p-4 transition-shadow hover:shadow-md ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                style={{
                  backgroundColor: announcement.backgroundColor || (isDarkMode ? '#1f2937' : '#ffffff'),
                  color: announcement.textColor || (isDarkMode ? '#f3f4f6' : '#000000')
                }}
              >
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <h4 className="font-bold text-lg flex items-center flex-wrap gap-1">
                    {announcement.important && (
                      <FaExclamationTriangle className={`flex-shrink-0 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`} />
                    )}
                    <span className="break-words">{announcement.title}</span>
                  </h4>
                  
                  <div className="flex gap-2 mt-1 sm:mt-0">
                    <button
                      onClick={() => handleEditAnnouncement(announcement)}
                      className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Editar anúncio"
                      aria-label="Editar anúncio"
                    >
                      <FaEdit />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Excluir anúncio"
                      aria-label="Excluir anúncio"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                <div className="whitespace-pre-wrap break-words mb-3 max-h-40 overflow-y-auto pr-1">
                  {announcement.content}
                </div>
                
                <div className="text-sm opacity-70 flex flex-wrap justify-between items-center gap-2">
                  <span>Criado em: {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}</span>
                  
                  <span className="text-xs px-2 py-1 rounded-full bg-opacity-20 border" style={{
                    backgroundColor: `${announcement.important ? '#FEF3C7' : '#E0F2FE'}`,
                    borderColor: `${announcement.important ? '#F59E0B' : '#3B82F6'}`,
                    color: announcement.textColor || (isDarkMode ? '#f3f4f6' : '#000000')
                  }}>
                    {announcement.important ? 'Importante' : 'Normal'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementAdmin;
