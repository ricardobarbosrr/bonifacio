<?php
require_once 'config.php';

try {
    // Criar a tabela post_likes
    $sql = "
    CREATE TABLE IF NOT EXISTS post_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_post_user (post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($sql);
    echo "Tabela post_likes criada com sucesso!\n";
    
} catch (PDOException $e) {
    echo "Erro ao criar tabela post_likes: " . $e->getMessage() . "\n";
}
?>
