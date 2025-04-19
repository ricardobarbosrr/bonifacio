import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './navbar';
import Sidebar from './components/Sidebar';
import OfficialDocuments from './pages/OfficialDocuments';
import Announcements from './pages/Announcements';
import Administration from './pages/Administration';
import Posts from './pages/Posts';
import Articles from './pages/Articles';
import Admin from './pages/Admin';
import Auth from './components/Auth';
import Profile from './components/Profile';
import AdminPanel from './components/AdminPanel';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import UIProvider from './contexts/UIContext';
import Article from './pages/article';
import CreateArticle from './pages/create';
import { ArticleProvider } from './contexts/ArticleContext';

const App: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { isDarkMode } = useTheme();

  return (
    <Router>
      <UIProvider>
        <ArticleProvider>
          <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <Navbar />
            <div className="flex min-h-[calc(100vh-4rem)]">
              {currentUser && <Sidebar />}
              <main className={`flex-1 ${currentUser ? 'lg:ml-64 ml-0' : ''} transition-all duration-300`}>
                <Routes>
                  <Route path="/" element={<Posts />} />
                  <Route path="/posts" element={<Posts />} />
                  <Route path="/artigos" element={<Articles />} />
                  <Route path="/create" element={<CreateArticle />} />
                  <Route path="/documentos" element={<OfficialDocuments />} />
                  <Route path="/anuncios" element={<Announcements />} />
                  <Route path="/administracao" element={<Administration />} />
                  <Route path="/article" element={<Article />} />
                  <Route path="/auth" element={currentUser ? <Navigate to="/" replace /> : <Auth />} />
                  
                  {/* Rota protegida para edição de perfil */}
                  <Route 
                    path="/profile" 
                    element={currentUser ? <Profile /> : <Navigate to="/auth" replace />} 
                  />
                  
                  {/* Rota protegida para painel administrativo */}
                  <Route 
                    path="/admin" 
                    element={
                      currentUser && isAdmin 
                        ? <AdminPanel /> 
                        : <Navigate to="/" replace />
                    } 
                  />
                  
                  {/* Rota protegida para migração de dados */}
                  <Route 
                    path="/migracao" 
                    element={
                      currentUser && isAdmin 
                        ? <Admin /> 
                        : <Navigate to="/" replace />
                    } 
                  />
                  
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </ArticleProvider>
      </UIProvider>
    </Router>
  );
};

export default App;