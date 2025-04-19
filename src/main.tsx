import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { PostProvider } from './contexts/PostContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { AdminProvider } from './contexts/AdminContext';
import { AnnouncementProvider } from './contexts/AnnouncementContext';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <DocumentProvider>
            <AdminProvider>
              <AnnouncementProvider>
                <PostProvider>
                  <App />
                </PostProvider>
              </AnnouncementProvider>
            </AdminProvider>
          </DocumentProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
