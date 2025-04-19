import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ArticleList from '../components/ArticleList';
import ArticleForm from '../components/ArticleForm';
import { FaPlus } from 'react-icons/fa';

const Articles: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Artigos
        </h1>
        {currentUser && (
          <button
            onClick={() => setShowForm(true)}
            className={`flex items-center px-4 py-2 rounded-md ${
              isDarkMode
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-green-700 hover:bg-green-800'
            } text-white transition-colors`}
          >
            <FaPlus className="mr-2" />
            Novo Artigo
          </button>
        )}
      </div>

      {showForm ? (
        <div className={`mb-6 p-6 rounded-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-md`}>
          <h2 className={`text-xl font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Novo Artigo
          </h2>
          <ArticleForm
            onSubmit={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <ArticleList />
      )}
    </div>
  );
};

export default Articles;
