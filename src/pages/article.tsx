import React from 'react';
import ArticleList from '../components/ArticleList';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Article: React.FC = () => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Artigos
      </h1>
      
      {currentUser ? (
        <div className="space-y-6">
          <ArticleList />
        </div>
      ) : (
        <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-md p-6 text-center`}>
          <p>Faça login para ver e criar artigos.</p>
        </div>
      )}
    </div>
  );
};

export default Article;
