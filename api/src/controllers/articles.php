<?php
/**
 * Controlador de Artigos
 * Gerencia todas as operações relacionadas a artigos
 */

/**
 * Obtém todos os artigos com paginação opcional
 * 
 * @param int $page Número da página
 * @param int $limit Limite de artigos por página
 * @param string|null $category Filtrar por categoria (opcional)
 * @param string|null $tag Filtrar por tag (opcional)
 * @return array Artigos paginados
 */
function getAllArticles($page = 1, $limit = 10, $category = null, $tag = null) {
    $jsonStorage = new JsonStorage();
    
    // Obter todos os artigos
    $allArticles = $jsonStorage->getAll('articles');
    
    // Aplicar filtros se necessário
    if ($category || $tag) {
        $allArticles = array_filter($allArticles, function($article) use ($category, $tag) {
            $categoryMatch = !$category || ($article['category'] === $category);
            $tagMatch = !$tag || (isset($article['tags']) && in_array($tag, $article['tags']));
            return $categoryMatch && $tagMatch;
        });
    }
    
    // Ordenar por data (mais recentes primeiro)
    usort($allArticles, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    // Paginação manual
    $total = count($allArticles);
    $offset = ($page - 1) * $limit;
    $pageCount = ceil($total / $limit);
    $paginatedArticles = array_slice($allArticles, $offset, $limit);
    
    // Adicionar informações do autor para cada artigo
    foreach ($paginatedArticles as &$article) {
        // Obter autor do artigo
        $author = $jsonStorage->getById('users', $article['author_id']);
        
        if ($author) {
            $article['author_name'] = $author['display_name'];
            $article['author_photo'] = $author['photo_url'] ?? null;
        } else {
            $article['author_name'] = 'Usuário desconhecido';
            $article['author_photo'] = null;
        }
        
        // Contar comentários
        $comments = $jsonStorage->findBy('comments', ['article_id' => $article['id']]);
        $article['comment_count'] = count($comments);
        
        // Contar curtidas
        $likes = $jsonStorage->findBy('likes', ['article_id' => $article['id']]);
        $article['like_count'] = count($likes);
    }
    
    return [
        'data' => $paginatedArticles,
        'total' => $total,
        'page' => (int)$page,
        'limit' => (int)$limit,
        'page_count' => $pageCount
    ];
}

/**
 * Obtém um artigo específico pelo ID
 * 
 * @param string $articleId ID do artigo
 * @return array|null Artigo encontrado ou null
 */
function getArticleById($articleId) {
    $jsonStorage = new JsonStorage();
    
    $article = $jsonStorage->getById('articles', $articleId);
    
    if (!$article) {
        return null;
    }
    
    // Adicionar informações do autor
    $author = $jsonStorage->getById('users', $article['author_id']);
    
    if ($author) {
        $article['author_name'] = $author['display_name'];
        $article['author_photo'] = $author['photo_url'] ?? null;
    } else {
        $article['author_name'] = 'Usuário desconhecido';
        $article['author_photo'] = null;
    }
    
    // Obter comentários para o artigo
    $comments = $jsonStorage->findBy('comments', ['article_id' => $articleId]);
    
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
    
    $article['comments'] = $comments;
    
    // Obter curtidas para o artigo
    $likes = $jsonStorage->findBy('likes', ['article_id' => $articleId]);
    $article['likes'] = array_column($likes, 'user_id');
    
    return $article;
}

/**
 * Cria um novo artigo
 * 
 * @param array $data Dados do artigo
 * @param array $user Dados do usuário autenticado
 * @return array Artigo criado
 * @throws Exception Se houver erro
 */
function createArticle($data, $user) {
    $jsonStorage = new JsonStorage();
    
    // Validar dados
    if (empty($data['title']) || empty($data['content'])) {
        throw new Exception('Título e conteúdo são obrigatórios');
    }
    
    // Verificar permissão (apenas admin pode criar artigo)
    if (!($user['is_admin'] ?? false)) {
        throw new Exception('Apenas administradores podem criar artigos');
    }
    
    // Criar estrutura do novo artigo
    $articleId = generateUniqueId();
    $now = getCurrentTimestamp();
    
    $newArticle = [
        'id' => $articleId,
        'title' => $data['title'],
        'content' => $data['content'],
        'author_id' => $user['id'],
        'category' => $data['category'] ?? 'Geral',
        'tags' => $data['tags'] ?? [],
        'image_url' => $data['image_url'] ?? null,
        'created_at' => $now,
        'updated_at' => null
    ];
    
    // Salvar o artigo
    if (!$jsonStorage->add('articles', $newArticle)) {
        throw new Exception('Erro ao criar artigo');
    }
    
    // Adicionar informações do autor para retorno
    $newArticle['author_name'] = $user['display_name'];
    $newArticle['author_photo'] = $user['photo_url'] ?? null;
    $newArticle['comments'] = [];
    $newArticle['comment_count'] = 0;
    $newArticle['likes'] = [];
    $newArticle['like_count'] = 0;
    
    return $newArticle;
}

/**
 * Atualiza um artigo existente
 * 
 * @param string $articleId ID do artigo
 * @param array $data Novos dados do artigo
 * @param array $user Dados do usuário autenticado
 * @return array Artigo atualizado
 * @throws Exception Se o usuário não tiver permissão ou o artigo não existir
 */
function updateArticle($articleId, $data, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o artigo
    $article = $jsonStorage->getById('articles', $articleId);
    
    if (!$article) {
        throw new Exception('Artigo não encontrado');
    }
    
    // Verificar permissão (apenas autor ou admin podem editar)
    if ($article['author_id'] !== $user['id'] && !($user['is_admin'] ?? false)) {
        throw new Exception('Você não tem permissão para editar este artigo');
    }
    
    // Validar dados
    if (empty($data['title']) || empty($data['content'])) {
        throw new Exception('Título e conteúdo são obrigatórios');
    }
    
    // Atualizar dados
    $article['title'] = $data['title'];
    $article['content'] = $data['content'];
    $article['category'] = $data['category'] ?? $article['category'] ?? 'Geral';
    $article['tags'] = $data['tags'] ?? $article['tags'] ?? [];
    $article['image_url'] = $data['image_url'] ?? $article['image_url'];
    $article['updated_at'] = getCurrentTimestamp();
    
    // Salvar as alterações
    if (!$jsonStorage->update('articles', $articleId, $article)) {
        throw new Exception('Erro ao atualizar artigo');
    }
    
    // Buscar artigo completo com comentários e curtidas
    return getArticleById($articleId);
}

/**
 * Exclui um artigo
 * 
 * @param string $articleId ID do artigo
 * @param array $user Dados do usuário autenticado
 * @return bool true se o artigo foi excluído com sucesso
 * @throws Exception Se o usuário não tiver permissão ou o artigo não existir
 */
function deleteArticle($articleId, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o artigo
    $article = $jsonStorage->getById('articles', $articleId);
    
    if (!$article) {
        throw new Exception('Artigo não encontrado');
    }
    
    // Verificar permissão (apenas autor ou admin podem excluir)
    if ($article['author_id'] !== $user['id'] && !($user['is_admin'] ?? false)) {
        throw new Exception('Você não tem permissão para excluir este artigo');
    }
    
    // Excluir comentários do artigo
    $comments = $jsonStorage->findBy('comments', ['article_id' => $articleId]);
    foreach ($comments as $comment) {
        $jsonStorage->delete('comments', $comment['id']);
    }
    
    // Excluir curtidas do artigo
    $likes = $jsonStorage->findBy('likes', ['article_id' => $articleId]);
    foreach ($likes as $like) {
        $jsonStorage->delete('likes', $like['id']);
    }
    
    // Excluir o artigo
    return $jsonStorage->delete('articles', $articleId);
}

/**
 * Adiciona um comentário a um artigo
 * 
 * @param string $articleId ID do artigo
 * @param string $content Conteúdo do comentário
 * @param array $user Dados do usuário autenticado
 * @return array Comentário criado
 * @throws Exception Se houver erro
 */
function addArticleComment($articleId, $content, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o artigo
    $article = $jsonStorage->getById('articles', $articleId);
    
    if (!$article) {
        throw new Exception('Artigo não encontrado');
    }
    
    // Validar conteúdo
    if (empty($content)) {
        throw new Exception('O conteúdo do comentário é obrigatório');
    }
    
    // Criar o comentário
    $commentId = generateUniqueId();
    $now = getCurrentTimestamp();
    
    $newComment = [
        'id' => $commentId,
        'article_id' => $articleId,
        'content' => $content,
        'author_id' => $user['id'],
        'created_at' => $now
    ];
    
    // Salvar o comentário
    if (!$jsonStorage->add('comments', $newComment)) {
        throw new Exception('Erro ao adicionar comentário');
    }
    
    // Adicionar informações do autor para retorno
    $newComment['author_name'] = $user['display_name'];
    $newComment['author_photo'] = $user['photo_url'] ?? null;
    
    // Criar notificação para o autor do artigo (se não for o próprio autor comentando)
    if ($article['author_id'] !== $user['id']) {
        try {
            $notification = [
                'id' => generateUniqueId(),
                'user_id' => $article['author_id'],
                'message' => "{$user['display_name']} comentou em seu artigo: " . substr($article['title'], 0, 30) . "...",
                'type' => 'comment',
                'link' => "/article/{$article['id']}",
                'target_id' => $commentId,
                'read' => false,
                'created_at' => $now
            ];
            
            $jsonStorage->add('notifications', $notification);
        } catch (Exception $e) {
            // Apenas log, não impede a operação principal
            error_log("Erro ao criar notificação: " . $e->getMessage());
        }
    }
    
    return $newComment;
}

/**
 * Remove um comentário de um artigo
 * 
 * @param string $commentId ID do comentário
 * @param array $user Dados do usuário autenticado
 * @return bool true se o comentário foi excluído com sucesso
 * @throws Exception Se o usuário não tiver permissão ou o comentário não existir
 */
function deleteArticleComment($commentId, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o comentário
    $comment = $jsonStorage->getById('comments', $commentId);
    
    if (!$comment) {
        throw new Exception('Comentário não encontrado');
    }
    
    // Buscar o artigo
    $article = $jsonStorage->getById('articles', $comment['article_id']);
    
    if (!$article) {
        throw new Exception('Artigo não encontrado');
    }
    
    // Verificar permissão (apenas autor do comentário, autor do artigo ou admin podem excluir)
    if ($comment['author_id'] !== $user['id'] && $article['author_id'] !== $user['id'] && !($user['is_admin'] ?? false)) {
        throw new Exception('Você não tem permissão para excluir este comentário');
    }
    
    // Excluir o comentário
    return $jsonStorage->delete('comments', $commentId);
}

/**
 * Adiciona ou remove uma curtida em um artigo
 * 
 * @param string $articleId ID do artigo
 * @param array $user Dados do usuário autenticado
 * @return array Informações sobre a operação
 * @throws Exception Se houver erro
 */
function toggleArticleLike($articleId, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o artigo
    $article = $jsonStorage->getById('articles', $articleId);
    
    if (!$article) {
        throw new Exception('Artigo não encontrado');
    }
    
    // Buscar se o usuário já curtiu este artigo
    $likes = $jsonStorage->findBy('likes', [
        'article_id' => $articleId,
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
            'article_id' => $articleId,
            'user_id' => $user['id'],
            'created_at' => getCurrentTimestamp()
        ];
        
        $jsonStorage->add('likes', $like);
        $message = 'Artigo curtido com sucesso';
        
        // Criar notificação para o autor do artigo (se não for o próprio autor curtindo)
        if ($article['author_id'] !== $user['id']) {
            try {
                $notification = [
                    'id' => generateUniqueId(),
                    'user_id' => $article['author_id'],
                    'message' => "{$user['display_name']} curtiu seu artigo: " . substr($article['title'], 0, 30) . "...",
                    'type' => 'like',
                    'link' => "/article/{$article['id']}",
                    'target_id' => $like['id'],
                    'read' => false,
                    'created_at' => getCurrentTimestamp()
                ];
                
                $jsonStorage->add('notifications', $notification);
            } catch (Exception $e) {
                // Apenas log, não impede a operação principal
                error_log("Erro ao criar notificação: " . $e->getMessage());
            }
        }
    }
    
    // Contar curtidas atualizadas
    $currentLikes = $jsonStorage->findBy('likes', ['article_id' => $articleId]);
    
    return [
        'success' => true,
        'message' => $message,
        'likes' => count($currentLikes),
        'user_has_liked' => !$hasLiked
    ];
}
