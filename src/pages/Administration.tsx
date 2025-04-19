import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FaUserShield, FaEnvelope, FaPhone } from 'react-icons/fa';

interface AdminMember {
  name: string;
  role: string;
  photoUrl?: string;
  description: string;
  email?: string;
  phone?: string;
}

const Administration: React.FC = () => {
  const { isDarkMode } = useTheme();

  const adminMembers: AdminMember[] = [
    {
      name: "Giovanne Wormstall",
      role: "Presidente da Confederação",
      description: "Responsável pela liderança e direção estratégica da confederação.",
      email: "admin@confederacao.com.br",
      phone: "(17) 99654-0284",
      photoUrl: "/profile_photos/giovanne.jpg"
    },
    {
      name: "Gustavo Krutka",
      role: "VP da Confederação",
      description: "Responsável pela gestão operacional da confederação.",
      email: "admin@confederacao.com.br",
      phone: "(41) 99288-2034",
      photoUrl: ""
    },
    {
      name: "Ricardo Barbosa",
      role: "CFO & CTO",
      description: "Responsável pela gestão financeira e tecnológica da confederação.",
      email: "admin@confederacao.com.br",
      phone: "(41) 99288-2034",
      photoUrl: "/profile_photos/ricardo.jpeg"
    },
    {
      name: "Arthur Sarrassini",
      role: "COO & Relacionamento",
      description: "Responsável pela gestão de relacionamento com os membros e promover a integração.",
      email: "admin@confederacao.com.br",
      phone: "(35) 98887-2976",
      photoUrl: "/profile_photos/arthur.jpeg"
    },
    {
      name: "S/N",
      role: "Chefe de Marketing",
      description: "Responsável pela gestão de marketing e promover a integração.",
      email: "admin@confederacao.com.br",
      phone: "S/N",
      photoUrl: ""
    }
  ];

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <FaUserShield className={`mr-3 text-2xl ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          <h1 className="text-xl sm:text-2xl font-bold">Administração</h1>
        </div>
        
        <div className={`rounded-lg shadow-md overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-4 sm:p-6 border-b border-gray-700">
            <h2 className="text-lg sm:text-xl font-medium mb-2">Equipe Administrativa</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Conheça os membros responsáveis pela administração da confederação
            </p>
          </div>
          
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {adminMembers.map((member, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                  } transition-all duration-200 flex flex-col h-full`}
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="flex-shrink-0">
                      <img
                        src={member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=${isDarkMode ? '2d3748' : 'f9fafb'}&color=${isDarkMode ? 'fff' : '111'}&size=128`}
                        alt={member.name}
                        className="h-16 w-16 rounded-full object-cover border-2 border-green-600"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=${isDarkMode ? '2d3748' : 'f9fafb'}&color=${isDarkMode ? 'fff' : '111'}&size=128`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate">{member.name}</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'} mb-1`}>
                        {member.role}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                        {member.description}
                      </p>
                    </div>
                  </div>
                  
                  {(member.email || member.phone) && (
                    <div className={`mt-auto pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {member.email && (
                        <div className="flex items-center text-sm mb-1">
                          <FaEnvelope className={`mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center text-sm">
                          <FaPhone className={`mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Administration;
