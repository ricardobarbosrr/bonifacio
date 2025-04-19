<?php
// Corrigir o sistema de curtidas
require_once 'config.php';

// 1. Alterar a função de toggleLike para atualizar o contador
$code = file_get_contents('posts.php');

// Localizar o bloco de código que processa likes
$pattern = '/if \(\$like\) \{(.*?)else \{(.*?)\}/s';
$replacement = 'if ($like) {
            // Se já curtiu, remove o like
            $stmt = $pdo->prepare("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?");
            $success = $stmt->execute([$postId, $userId]);
            
            // Atualizar o contador de likes no post
            $stmt = $pdo->prepare("UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?");
            $stmt->execute([$postId]);
            
            $message = \'Like removido com sucesso\';
        } else {
            // Se não curtiu, adiciona o like
            $stmt = $pdo->prepare("INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)");
            $success = $stmt->execute([$postId, $userId, getCurrentTimestamp()]);
            
            // Atualizar o contador de likes no post
            $stmt = $pdo->prepare("UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?");
            $stmt->execute([$postId]);
            
            $message = \'Post curtido com sucesso\';
        }';

$updated_code = preg_replace($pattern, $replacement, $code);

// Salvar o arquivo atualizado
file_put_contents('posts.php', $updated_code);
echo "Arquivo posts.php atualizado com sucesso.\n";

// 2. Corrigir contadores existentes
try {
    // Obter todos os posts
    $stmt = $pdo->query("SELECT id FROM posts");
    $posts = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($posts as $postId) {
        // Contar likes para este post
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM post_likes WHERE post_id = ?");
        $stmt->execute([$postId]);
        $likesCount = $stmt->fetchColumn();
        
        // Atualizar contador no post
        $stmt = $pdo->prepare("UPDATE posts SET likes_count = ? WHERE id = ?");
        $stmt->execute([$likesCount, $postId]);
        
        echo "Post $postId atualizado com $likesCount likes.\n";
    }
    
    echo "Todos os contadores de likes foram sincronizados.\n";
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
