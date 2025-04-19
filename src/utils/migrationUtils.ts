import * as API_BASE_URL from '../api';

/**
 * Função para importar usuários de um arquivo JSON
 */
export const importUsers = async (jsonData: any[]) => {
  try {
    let successCount = 0;
    let errorCount = 0;
    
    for (const userData of jsonData) {
      try {
        // Criar usuário no MySQL usando a função de registro
        await API_BASE_URL.auth.register(
          userData.email,
          'TempPassword123!', // Senha temporária que o usuário precisará redefinir
          userData.displayName || userData.email.split('@')[0]
        );
        
        successCount++;
      } catch (error) {
        console.error(`Erro ao importar usuário ${userData.email}:`, error);
        errorCount++;
      }
    }
    
    return { success: successCount, errors: errorCount };
  } catch (error) {
    console.error('Erro ao importar usuários:', error);
    throw error;
  }
};

/**
 * Função para importar posts de um arquivo JSON
 */
export const importPosts = async (jsonData: any[]) => {
  try {
    let successCount = 0;
    let errorCount = 0;
    
    for (const postData of jsonData) {
      try {
        // Criar post no MySQL usando a função de criar post
        const createdPost = await API_BASE_URL.posts.createPost(
          postData.title || 'Post importado',
          postData.content
        );
        
        // Se o post tem comentários, importá-los também
        if (postData.comments && postData.comments.length > 0) {
          for (const comment of postData.comments) {
            await API_BASE_URL.posts.addComment(
              createdPost.id,
              comment.content
            );
          }
        }
        
        successCount++;
      } catch (error) {
        console.error(`Erro ao importar post:`, error);
        errorCount++;
      }
    }
    
    return { success: successCount, errors: errorCount };
  } catch (error) {
    console.error('Erro ao importar posts:', error);
    throw error;
  }
};

/**
 * Função principal para importar todos os dados
 */
export const importAllData = async (userData: any[], postData: any[]) => {
  try {
    console.log('Iniciando importação de usuários...');
    const usersResult = await importUsers(userData);
    console.log(`Importação de usuários concluída: ${usersResult.success} com sucesso, ${usersResult.errors} com erro.`);
    
    console.log('Iniciando importação de posts...');
    const postsResult = await importPosts(postData);
    console.log(`Importação de posts concluída: ${postsResult.success} com sucesso, ${postsResult.errors} com erro.`);
    
    return {
      users: usersResult,
      posts: postsResult,
      success: usersResult.success + postsResult.success,
      errors: usersResult.errors + postsResult.errors
    };
  } catch (error) {
    console.error('Erro durante o processo de importação:', error);
    throw error;
  }
};
