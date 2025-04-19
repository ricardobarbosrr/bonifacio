// Este é um arquivo de mock para substituir as dependências do Firebase
// enquanto migramos para o MySQL

// Mock do objeto db do Firestore
export const db = {
  // Métodos e propriedades simulados que podem ser usados pelos componentes
  // até que sejam totalmente migrados para o MySQL
};

// Mock para outras funcionalidades do Firebase que possam ser necessárias
export const auth = {
  // Métodos simulados de autenticação
};

// Função auxiliar para simular o comportamento de onSnapshot
export const mockOnSnapshot = (callback: (data: any) => void) => {
  // Retorna uma função vazia como unsubscribe
  callback({ docs: [] });
  return () => {};
};

// Função auxiliar para simular o comportamento de consultas
export const mockQuery = () => {
  return {};
};

// Exportando funções vazias para substituir as importações do firebase/firestore
export const collection = () => ({});
export const query = mockQuery;
export const where = () => ({});
export const orderBy = () => ({});
export const onSnapshot = mockOnSnapshot;
export const addDoc = async () => ({ id: 'mock-id' });
export const deleteDoc = async () => {};
export const doc = () => ({});
export const updateDoc = async () => {};
export const getDocs = async () => ({ 
  docs: [],
  forEach: () => {} 
});
