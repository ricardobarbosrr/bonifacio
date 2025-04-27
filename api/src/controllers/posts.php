<?php
/**
 * Controlador de Posts
 * Gerencia todas as operações relacionadas a posts
 */

/**
 * Obtém todos os posts com paginação
 * 
 * @param int $page Número da página
 * @param int $limit Limite de posts por página
 * @return array Posts paginados
 */
function getAllPosts($page = 1, $limit = 10) {
    $jsonStorage = new JsonStorage();
    
    // Obter todos os posts
    $allPosts = $jsonStorage->getAll('posts');
    
    // Ordenar por data (mais recentes primeiro)
    usort($allPosts, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    // Paginação manual
    $total = count($allPosts);
    $offset = ($page - 1) * $limit;
    $pageCount = ceil($total / $limit);
    $paginatedPosts = array_slice($allPosts, $offset, $limit);
    
    // Adicionar informações do autor para cada post
    foreach ($paginatedPosts as &$post) {
        // Obter autor do post
        $author = $jsonStorage->getById('users', $post['author_id']);
        
        if ($author) {
            $post['author_name'] = $author['display_name'];
            $post['author_photo'] = $author['photo_url'] ?? null;
        } else {
            $post['author_name'] = 'Usuário desconhecido';
            $post['author_photo'] = null;
        }
        
        // Contar comentários
        $comments = $jsonStorage->findBy('comments', ['post_id' => $post['id']]);
        $post['comment_count'] = count($comments);
        
        // Contar curtidas
        $likes = $jsonStorage->findBy('likes', ['post_id' => $post['id']]);
        $post['like_count'] = count($likes);
    }
    
    return [
        'data' => $paginatedPosts,
        'total' => $total,
        'page' => (int)$page,
        'limit' => (int)$limit,
        'page_count' => $pageCount
    ];
}

/**
 * Obtém um post específico pelo ID
 * 
 * @param string $postId ID do post
 * @return array|null Post encontrado ou null
 */
function getPostById($postId) {
    $jsonStorage = new JsonStorage();
    
    $post = $jsonStorage->getById('posts', $postId);
    
    if (!$post) {
        return null;
    }
    
    // Adicionar informações do autor
    $author = $jsonStorage->getById('users', $post['author_id']);
    
    if ($author) {
        $post['author_name'] = $author['display_name'];
        $post['author_photo'] = $author['photo_url'] ?? null;
    } else {
        $post['author_name'] = 'Usuário desconhecido';
        $post['author_photo'] = null;
    }
    
    // Obter comentários para o post
    $comments = $jsonStorage->findBy('comments', ['post_id' => $postId]);
    
    // Ordenar comentários por data (mais antigos primeiro)
    usort($comments, function($a, $b) {
        return strtotime($a['created_at']) - strtotime($b['created_at']);
    });
    
    // Para cada comentário, adicionar informações do autor
    foreach ($comments as &$comment) {
        $commentAuthor = $jsonStorage->getById('users', $comment['author_id']);
        
        if ($commentAuthor) {
            $comment['author_name'] = $commentAuthor['display_name'];
            $comment['author_photo'] = $commentAuthor['photo_url'] ?? null;
        } else {
            $comment['author_name'] = 'Usuário desconhecido';
            $comment['author_photo'] = null;
        }
    }
    
    $post['comments'] = $comments;
    
    // Obter curtidas para o post
    $likes = $jsonStorage->findBy('likes', ['post_id' => $postId]);
    $post['likes'] = array_column($likes, 'user_id');
    
    return $post;
}

/**
 * Cria um novo post
 * 
 * @param array $data Dados do post
 * @param array $user Dados do usuário autenticado
 * @return array Post criado
 * @throws Exception Se houver erro
 */
function createPost($data, $user) {
    $jsonStorage = new JsonStorage();
    
    // Validar dados necessários
    if (empty($data['title']) || empty($data['content'])) {
        throw new Exception('Título e conteúdo são obrigatórios');
    }
    
    // Criar estrutura do novo post
    $postId = generateUniqueId();
    $now = getCurrentTimestamp();
    
    $newPost = [
        'id' => $postId,
        'title' => $data['title'],
        'content' => $data['content'],
        'author_id' => $user['id'],
        'image_url' => $data['image_url'] ?? null,
        'created_at' => $now
    ];
    
    // Salvar o post
    if (!$jsonStorage->add('posts', $newPost)) {
        throw new Exception('Erro ao criar post');
    }
    
    // Adicionar informações do autor para retorno
    $newPost['author_name'] = $user['display_name'];
    $newPost['author_photo'] = $user['photo_url'] ?? null;
    $newPost['comments'] = [];
    $newPost['likes'] = [];
    $newPost['comment_count'] = 0;
    $newPost['like_count'] = 0;
    
    return $newPost;
}

/**
 * Atualiza um post existente
 * 
 * @param string $postId ID do post
 * @param array $data Novos dados do post
 * @param array $user Dados do usuário autenticado
 * @return array Post atualizado
 * @throws Exception Se o usuário não tiver permissão ou o post não existir
 */
function updatePost($postId, $data, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o post
    $post = $jsonStorage->getById('posts', $postId);
    
    if (!$post) {
        throw new Exception('Post não encontrado');
    }
    
    // Verificar permissão
    if ($post['author_id'] !== $user['id'] && !($user['is_admin'] ?? false)) {
        throw new Exception('Você não tem permissão para editar este post');
    }
    
    // Validar dados necessários
    if (empty($data['title']) || empty($data['content'])) {
        throw new Exception('Título e conteúdo são obrigatórios');
    }
    
    // Atualizar dados do post
    $post['title'] = $data['title'];
    $post['content'] = $data['content'];
    $post['image_url'] = $data['image_url'] ?? $post['image_url'];
    $post['updated_at'] = getCurrentTimestamp();
    
    // Salvar as alterações
    if (!$jsonStorage->update('posts', $postId, $post)) {
        throw new Exception('Erro ao atualizar post');
    }
    
    // Buscar post completo com comentários e curtidas
    return getPostById($postId);
}

/**
 * Exclui um post
 * 
 * @param string $postId ID do post
 * @param array $user Dados do usuário autenticado
 * @return bool true se o post foi excluído com sucesso
 * @throws Exception Se o usuário não tiver permissão ou o post não existir
 */
function deletePost($postId, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o post
    $post = $jsonStorage->getById('posts', $postId);
    
    if (!$post) {
        throw new Exception('Post não encontrado');
    }
    
    // Verificar permissão
    if ($post['author_id'] !== $user['id'] && !($user['is_admin'] ?? false)) {
        throw new Exception('Você não tem permissão para excluir este post');
    }
    
    // Excluir comentários do post
    $comments = $jsonStorage->findBy('comments', ['post_id' => $postId]);
    foreach ($comments as $comment) {
        $jsonStorage->delete('comments', $comment['id']);
    }
    
    // Excluir curtidas do post
    $likes = $jsonStorage->findBy('likes', ['post_id' => $postId]);
    foreach ($likes as $like) {
        $jsonStorage->delete('likes', $like['id']);
    }
    
    // Excluir o post
    return $jsonStorage->delete('posts', $postId);
}

/**
 * Adiciona ou remove uma curtida em um post
 * 
 * @param string $postId ID do post
 * @param array $user Dados do usuário autenticado
 * @return array Informações sobre a operação
 * @throws Exception Se houver erro
 */
function togglePostLike($postId, $user) {
    $jsonStorage = new JsonStorage();
    
    // Verificar se o post existe
    $post = $jsonStorage->getById('posts', $postId);
    
    if (!$post) {
        throw new Exception('Post não encontrado');
    }
    
    // Buscar se o usuário já curtiu este post
    $likes = $jsonStorage->findBy('likes', [
        'post_id' => $postId,
        'user_id' => $user['id']
    ]);
    
    $hasLiked = !empty($likes);
    
    if ($hasLiked) {
        // Se já curtiu, remove a curtida
        foreach ($likes as $like) {
            $jsonStorage->delete('likes', $like['id']);
        }
        $message = 'Curtida removida com sucesso';
    } else {
        // Se não curtiu, adiciona a curtida
        $like = [
            'id' => generateUniqueId(),
            'post_id' => $postId,
            'user_id' => $user['id'],
            'created_at' => getCurrentTimestamp()
        ];
        
        $jsonStorage->add('likes', $like);
        $message = 'Post curtido com sucesso';
    }
    
    // Contar curtidas atualizadas
    $currentLikes = $jsonStorage->findBy('likes', ['post_id' => $postId]);
    
    return [
        'success' => true,
        'message' => $message,
        'likes' => count($currentLikes),
        'user_has_liked' => !$hasLiked
    ];
}
