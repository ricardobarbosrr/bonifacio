import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDocuments } from '../contexts/DocumentContext';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

interface DocumentFormData {
  id?: string;
  title: string;
  content: string;
  category: string;
  url?: string;
}

const OfficialDocuments: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { isAdmin } = useAuth();
  const { documents, addDocument, updateDocument, deleteDocument, loading } = useDocuments();
  const [isEditing, setIsEditing] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentFormData>({
    title: '',
    content: '',
    category: '',
    url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && editingDocument.id) {
      await updateDocument(editingDocument.id, editingDocument);
    } else {
      await addDocument(editingDocument);
    }
    setIsEditing(false);
    setEditingDocument({ title: '', content: '', category: '', url: '' });
  };

  const handleEdit = (document: DocumentFormData) => {
    setEditingDocument(document);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      await deleteDocument(id);
    }
  };

  const categories = ['Legislação', 'Regulamentos', 'Formulários', 'Outros'];

  return (
    <div className={`p-4 lg:p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Documentos Oficiais</h1>
          {isAdmin && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaPlus />
              <span>Novo Documento</span>
            </button>
          )}
        </div>

        {isEditing && isAdmin && (
          <div className={`mb-6 rounded-lg shadow p-4 lg:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4">
              {editingDocument.id ? 'Editar Documento' : 'Novo Documento'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  type="text"
                  value={editingDocument.title}
                  onChange={(e) => setEditingDocument({ ...editingDocument, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  value={editingDocument.category}
                  onChange={(e) => setEditingDocument({ ...editingDocument, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL do Documento (opcional)</label>
                <input
                  type="url"
                  value={editingDocument.url}
                  onChange={(e) => setEditingDocument({ ...editingDocument, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600"
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={editingDocument.content}
                  onChange={(e) => setEditingDocument({ ...editingDocument, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600 min-h-[150px]"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingDocument.id ? 'Salvar Alterações' : 'Criar Documento'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingDocument({ title: '', content: '', category: '', url: '' });
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={`rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {loading ? (
            <div className="text-center py-4">Carregando documentos...</div>
          ) : documents.length === 0 ? (
            <div className="p-4 text-gray-500 dark:text-gray-400">
              Nenhum documento oficial publicado ainda.
            </div>
          ) : (
            <div className="grid gap-4 p-4 lg:p-6">
              {categories.map(category => {
                const categoryDocuments = documents.filter(doc => doc.category === category);
                if (categoryDocuments.length === 0) return null;

                return (
                  <div key={category} className="space-y-4">
                    <h2 className="text-xl font-semibold">{category}</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryDocuments.map(document => (
                        <div
                          key={document.id}
                          className={`p-4 rounded-lg border ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold">{document.title}</h3>
                              <p className="mt-2 text-gray-600 dark:text-gray-300">
                                {document.content}
                              </p>
                              {document.url && (
                                <a
                                  href={document.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-block text-green-600 dark:text-green-400 hover:underline"
                                >
                                  Ver documento
                                </a>
                              )}
                            </div>
                            {isAdmin && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(document)}
                                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                  title="Editar"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDelete(document.id)}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                  title="Excluir"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficialDocuments;
