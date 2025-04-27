<?php
/**
 * Controlador de Comentários
 * Gerencia todas as operações relacionadas a comentários
 */

/**
 * Adiciona um novo comentário
 * 
 * @param array $data Dados do comentário
 * @param array $user Dados do usuário autenticado
 * @return array Comentário criado
 * @throws Exception Se houver erro
 */
function addComment($data, $user) {
    $jsonStorage = new JsonStorage();
    
    // Validar dados
    if (empty($data['post_id']) || empty($data['content'])) {
        throw new Exception('ID do post e conteúdo são obrigatórios');
    }
    
    // Verificar se o post existe
    $post = $jsonStorage->getById('posts', $data['post_id']);
    if (!$post) {
        throw new Exception('Post não encontrado');
    }
    
    // Criar o comentário
    $commentId = generateUniqueId();
    $now = getCurrentTimestamp();
    
    $newComment = [
        'id' => $commentId,
        'post_id' => $data['post_id'],
        'content' => $data['content'],
        'author_id' => $user['id'],
        'created_at' => $now
    ];
    
    // Salvar o comentário
    if (!$jsonStorage->add('comments', $newComment)) {
        throw new Exception('Erro ao adicionar comentário');
    }
    
    // Montar a resposta completa
    $response = $newComment;
    $response['author_name'] = $user['display_name'];
    $response['author_photo'] = $user['photo_url'] ?? null;
    
    // Criar notificação para o autor do post (se não for o próprio autor comentando)
    if ($post['author_id'] !== $user['id']) {
        try {
            $notification = [
                'id' => generateUniqueId(),
                'user_id' => $post['author_id'],
                'message' => "{$user['display_name']} comentou em seu post: " . substr($post['title'], 0, 30) . "...",
                'type' => 'comment',
                'link' => "/post/{$post['id']}",
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
    
    return $response;
}

/**
 * Exclui um comentário
 * 
 * @param string $commentId ID do comentário
 * @param array $user Dados do usuário autenticado
 * @return bool true se o comentário foi excluído com sucesso
 * @throws Exception Se o usuário não tiver permissão ou o comentário não existir
 */
function deleteComment($commentId, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o comentário
    $comment = $jsonStorage->getById('comments', $commentId);
    
    if (!$comment) {
        throw new Exception('Comentário não encontrado');
    }
    
    // Verificar permissão
    if ($comment['author_id'] !== $user['id'] && !($user['is_admin'] ?? false)) {
        throw new Exception('Você não tem permissão para excluir este comentário');
    }
    
    // Excluir o comentário
    return $jsonStorage->delete('comments', $commentId);
}

/**
 * Lista todos os comentários de um post
 * 
 * @param string $postId ID do post
 * @return array Lista de comentários
 */
function getCommentsByPostId($postId) {
    $jsonStorage = new JsonStorage();
    
    // Buscar comentários
    $comments = $jsonStorage->findBy('comments', ['post_id' => $postId]);
    
    // Ordenar por data (mais antigos primeiro)
    usort($comments, function($a, $b) {
        return strtotime($a['created_at']) - strtotime($b['created_at']);
    });
    
    // Adicionar informações do autor para cada comentário
    foreach ($comments as &$comment) {
        $author = $jsonStorage->getById('users', $comment['author_id']);
        
        if ($author) {
            $comment['author_name'] = $author['display_name'];
            $comment['author_photo'] = $author['photo_url'] ?? null;
        } else {
            $comment['author_name'] = 'Usuário desconhecido';
            $comment['author_photo'] = null;
        }
    }
    
    return $comments;
}

/**
 * Atualiza um comentário existente
 * 
 * @param string $commentId ID do comentário
 * @param array $data Novos dados do comentário
 * @param array $user Dados do usuário autenticado
 * @return array Comentário atualizado
 * @throws Exception Se o usuário não tiver permissão ou o comentário não existir
 */
function updateComment($commentId, $data, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o comentário
    $comment = $jsonStorage->getById('comments', $commentId);
    
    if (!$comment) {
        throw new Exception('Comentário não encontrado');
    }
    
    // Verificar permissão
    if ($comment['author_id'] !== $user['id'] && !($user['is_admin'] ?? false)) {
        throw new Exception('Você não tem permissão para editar este comentário');
    }
    
    // Validar dados
    if (empty($data['content'])) {
        throw new Exception('Conteúdo é obrigatório');
    }
    
    // Atualizar dados
    $comment['content'] = $data['content'];
    $comment['updated_at'] = getCurrentTimestamp();
    
    // Salvar as alterações
    if (!$jsonStorage->update('comments', $commentId, $comment)) {
        throw new Exception('Erro ao atualizar comentário');
    }
    
    // Adicionar informações do autor
    $author = $jsonStorage->getById('users', $comment['author_id']);
    
    if ($author) {
        $comment['author_name'] = $author['display_name'];
        $comment['author_photo'] = $author['photo_url'] ?? null;
    } else {
        $comment['author_name'] = 'Usuário desconhecido';
        $comment['author_photo'] = null;
    }
    
    return $comment;
}
