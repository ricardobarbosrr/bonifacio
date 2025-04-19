<?php
// Função para buscar todos os artigos
function getAllArticles($userId = null) {
    global $pdo;
    
    $query = "
        SELECT 
            a.*,
            u.display_name as author_name,
            u.photo_url as author_photo,
            COUNT(DISTINCT l.id) as likes_count,
            COUNT(DISTINCT c.id) as comments_count,
            GROUP_CONCAT(DISTINCT t.name) as tag_names,
            cat.name as category_name,
            CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as user_liked
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.uid
        LEFT JOIN likes l ON a.id = l.article_id
        LEFT JOIN comments c ON a.id = c.article_id
        LEFT JOIN article_tags at ON a.id = at.article_id
        LEFT JOIN tags t ON at.tag_id = t.id
        LEFT JOIN article_categories ac ON a.id = ac.article_id
        LEFT JOIN categories cat ON ac.category_id = cat.id
        LEFT JOIN likes ul ON a.id = ul.article_id AND ul.user_id = ?
        GROUP BY a.id
        ORDER BY a.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$userId]);
    $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Processar os resultados
    foreach ($articles as &$article) {
        // Converter tags de string para array
        $article['tags'] = $article['tag_names'] ? explode(',', $article['tag_names']) : [];
        unset($article['tag_names']);
        
        // Buscar comentários
        $stmt = $pdo->prepare("
            SELECT 
                c.*,
                u.display_name as author_name,
                u.photo_url as author_photo
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.uid
            WHERE c.article_id = ?
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$article['id']]);
        $article['comments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Converter user_liked para boolean
        $article['user_liked'] = (bool)$article['user_liked'];
    }
    
    return $articles;
}

// Função para curtir/descurtir artigo
function toggleLike($articleId, $userId) {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Verificar se já curtiu
        $stmt = $pdo->prepare("SELECT id FROM likes WHERE article_id = ? AND user_id = ?");
        $stmt->execute([$articleId, $userId]);
        $like = $stmt->fetch();
        
        if ($like) {
            // Remover curtida
            $stmt = $pdo->prepare("DELETE FROM likes WHERE article_id = ? AND user_id = ?");
            $stmt->execute([$articleId, $userId]);
            $liked = false;
        } else {
            // Adicionar curtida
            $stmt = $pdo->prepare("INSERT INTO likes (article_id, user_id, created_at) VALUES (?, ?, ?)");
            $stmt->execute([$articleId, $userId, getCurrentTimestamp()]);
            $liked = true;
            
            // Criar notificação para o autor
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, type, content, created_at)
                SELECT author_id, 'like', CONCAT(?, ' curtiu seu artigo "', title, '"'), ?
                FROM articles WHERE id = ?
            ");
            $stmt->execute([$userId, getCurrentTimestamp(), $articleId]);
        }
        
        $pdo->commit();
        return ['liked' => $liked];
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// Função para adicionar comentário
function addComment($articleId, $userId, $content) {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Adicionar comentário
        $stmt = $pdo->prepare("
            INSERT INTO comments (article_id, user_id, content, created_at)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$articleId, $userId, $content, getCurrentTimestamp()]);
        $commentId = $pdo->lastInsertId();
        
        // Criar notificação para o autor
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, content, created_at)
            SELECT author_id, 'comment', CONCAT(?, ' comentou em seu artigo "', title, '"'), ?
            FROM articles WHERE id = ?
        ");
        $stmt->execute([$userId, getCurrentTimestamp(), $articleId]);
        
        $pdo->commit();
        return $commentId;
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// Função para remover comentário
function removeComment($commentId, $userId) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        DELETE FROM comments 
        WHERE id = ? AND (user_id = ? OR EXISTS (
            SELECT 1 FROM users WHERE uid = ? AND (is_admin = 1 OR is_founder = 1)
        ))
    ");
    $stmt->execute([$commentId, $userId, $userId]);
    
    return $stmt->rowCount() > 0;
}
