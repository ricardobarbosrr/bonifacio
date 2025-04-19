<?php
require_once 'config.php';

// Função para verificar autenticação
function getAuthenticatedUser() {
    global $pdo;
    
    $headers = getallheaders();
    $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
    
    if (!$token) {
        return null;
    }
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE auth_token = ?");
    $stmt->execute([$token]);
    return $stmt->fetch();
}

// Obter todos os posts
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['id'])) {
    $stmt = $pdo->query("SELECT p.*, u.display_name as author_name, u.photo_url as author_photo 
                         FROM posts p 
                         JOIN users u ON p.author_id = u.uid 
                         ORDER BY p.created_at DESC");
    $posts = $stmt->fetchAll();
    
    // Obter comentários e likes para cada post
    foreach ($posts as &$post) {
        // Obter comentários
        $stmt = $pdo->prepare("SELECT c.*, u.display_name as author_name, u.photo_url as comment_author_photo 
                              FROM comments c 
                              JOIN users u ON c.author_id = u.uid 
                              WHERE c.post_id = ? 
                              ORDER BY c.created_at ASC");
        $stmt->execute([$post['id']]);
        $post['comments'] = $stmt->fetchAll();
        
        // Obter likes
        $stmt = $pdo->prepare("SELECT user_id FROM post_likes WHERE post_id = ?");
        $stmt->execute([$post['id']]);
        $post['likes'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    echo json_encode($posts);
    exit;
}

// Obter um post específico
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    $stmt = $pdo->prepare("SELECT p.*, u.display_name as author_name, u.photo_url as author_photo 
                          FROM posts p 
                          JOIN users u ON p.author_id = u.uid 
                          WHERE p.id = ?");
    $stmt->execute([$_GET['id']]);
    $post = $stmt->fetch();
    
    if ($post) {
        // Obter comentários
        $stmt = $pdo->prepare("SELECT c.*, u.display_name as author_name, u.photo_url as comment_author_photo 
                              FROM comments c 
                              JOIN users u ON c.author_id = u.uid 
                              WHERE c.post_id = ? 
                              ORDER BY c.created_at ASC");
        $stmt->execute([$post['id']]);
        $post['comments'] = $stmt->fetchAll();
        
        // Obter likes
        $stmt = $pdo->prepare("SELECT user_id FROM post_likes WHERE post_id = ?");
        $stmt->execute([$post['id']]);
        $post['likes'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo json_encode($post);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Post não encontrado']);
    }
    exit;
}

// Criar um novo post
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    // Log para depuração
    error_log("Recebendo solicitação POST para criar post");
    
    // Capturar o payload bruto
    $rawData = file_get_contents('php://input');
    error_log("Payload recebido: " . $rawData);
    
    // Decodificar o JSON
    $data = json_decode($rawData, true);
    
    // Verificar se houve erro de decodificação JSON
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Erro na decodificação JSON: " . json_last_error_msg());
        http_response_code(400);
        echo json_encode(['error' => 'Dados inválidos: ' . json_last_error_msg()]);
        exit;
    }
    
    // Log dos dados decodificados
    error_log("Dados decodificados: " . print_r($data, true));
    
    if (!isset($data['title']) || !isset($data['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados incompletos']);
        exit;
    }
    
    try {
        // Verificar se há uma imagem para o post
        $imageUrl = isset($data['image_url']) ? $data['image_url'] : null;
        
        $postId = generateUniqueId();
        
        // Verificar se o ID já existe
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM posts WHERE id = ?");
        $checkStmt->execute([$postId]);
        if ($checkStmt->fetchColumn() > 0) {
            // Se existir, gerar um novo ID
            $postId = generateUniqueId();
        }
        
        $stmt = $pdo->prepare("INSERT INTO posts (id, title, content, image_url, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?)");
        $success = $stmt->execute([
            $postId, 
            $data['title'], 
            $data['content'], 
            $imageUrl, 
            $user['uid'], 
            getCurrentTimestamp()
        ]);
        
        if ($success) {
            $stmt = $pdo->prepare("SELECT user_id FROM post_likes WHERE post_id = ?");
            $stmt->execute([$postId]);
            $likes = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $response = [
                'id' => $postId,
                'title' => $data['title'],
                'content' => $data['content'],
                'image_url' => $imageUrl,
                'author_id' => $user['uid'],
                'author_name' => $user['display_name'],
                'author_photo' => $user['photo_url'],
                'created_at' => getCurrentTimestamp(),
                'comments' => [],
                'likes' => $likes
            ];
            
            // Log da resposta
            error_log("Resposta de sucesso: " . json_encode($response));
            echo json_encode($response);
        } else {
            error_log("Erro ao criar post: " . json_encode($stmt->errorInfo()));
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao criar post']);
        }
    } catch (PDOException $e) {
        error_log("Exceção PDO ao criar post: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar post: ' . $e->getMessage()]);
    } catch (Exception $e) {
        error_log("Exceção ao criar post: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar post: ' . $e->getMessage()]);
    }
    
    exit;
}

// Atualizar um post
if ($_SERVER['REQUEST_METHOD'] === 'PUT' && isset($_GET['id'])) {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    // Verificar se o post existe e se o usuário é o autor ou admin
    $stmt = $pdo->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$_GET['id']]);
    $post = $stmt->fetch();
    
    if (!$post) {
        http_response_code(404);
        echo json_encode(['error' => 'Post não encontrado']);
        exit;
    }
    
    if ($post['author_id'] !== $user['uid'] && !$user['is_admin']) {
        http_response_code(403);
        echo json_encode(['error' => 'Não autorizado a editar este post']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['title']) || !isset($data['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados incompletos']);
        exit;
    }
    
    // Verificar se há uma nova imagem para o post
    $imageUrl = isset($data['image_url']) ? $data['image_url'] : $post['image_url'];
    
    $stmt = $pdo->prepare("UPDATE posts SET title = ?, content = ?, image_url = ?, updated_at = ? WHERE id = ?");
    $success = $stmt->execute([$data['title'], $data['content'], $imageUrl, getCurrentTimestamp(), $_GET['id']]);
    
    if ($success) {
        $stmt = $pdo->prepare("SELECT user_id FROM post_likes WHERE post_id = ?");
        $stmt->execute([$_GET['id']]);
        $likes = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo json_encode([
            'id' => $_GET['id'],
            'title' => $data['title'],
            'content' => $data['content'],
            'image_url' => $imageUrl,
            'author_id' => $post['author_id'],
            'author_name' => $user['display_name'],
            'author_photo' => $user['photo_url'],
            'created_at' => $post['created_at'],
            'updated_at' => getCurrentTimestamp(),
            'comments' => [],
            'likes' => $likes
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar post']);
    }
    exit;
}

// Curtir/descurtir um post
if ($_SERVER['REQUEST_METHOD'] === 'PUT' && isset($_GET['id']) && isset($_GET['action']) && $_GET['action'] === 'toggleLike') {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    $postId = $_GET['id'];
    $userId = $user['uid'];
    
    try {
        // Verificar se o post existe
        $stmt = $pdo->prepare("SELECT * FROM posts WHERE id = ?");
        $stmt->execute([$postId]);
        $post = $stmt->fetch();
        
        if (!$post) {
            http_response_code(404);
            echo json_encode(['error' => 'Post não encontrado']);
            exit;
        }
        
        // Verificar se o usuário já curtiu o post
        $stmt = $pdo->prepare("SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?");
        $stmt->execute([$postId, $userId]);
        $like = $stmt->fetch();
        
        if ($like) {
            // Se já curtiu, remove o like
            $stmt = $pdo->prepare("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?");
            $success = $stmt->execute([$postId, $userId]);
            
            // Atualizar o contador de likes no post
            $stmt = $pdo->prepare("UPDATE posts SET likes_count = likes_count - 1, likes = likes - 1 WHERE id = ?");
            $stmt->execute([$postId]);
            
            $message = 'Like removido com sucesso';
        } else {
            // Se não curtiu, adiciona o like
            $stmt = $pdo->prepare("INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)");
            $success = $stmt->execute([$postId, $userId, getCurrentTimestamp()]);
            
            // Atualizar o contador de likes no post
            $stmt = $pdo->prepare("UPDATE posts SET likes_count = likes_count + 1, likes = likes + 1 WHERE id = ?");
            $stmt->execute([$postId]);
            
            $message = 'Post curtido com sucesso';
        }
        
        if ($success) {
            // Obter a lista atualizada de likes
            $stmt = $pdo->prepare("SELECT user_id FROM post_likes WHERE post_id = ?");
            $stmt->execute([$postId]);
            $likes = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Obter dados completos do post
            $stmt = $pdo->prepare("SELECT p.*, u.display_name as author_name, u.photo_url as author_photo 
                          FROM posts p 
                          JOIN users u ON p.author_id = u.uid 
                          WHERE p.id = ?");
            $stmt->execute([$postId]);
            $post = $stmt->fetch();
            
            // Obter comentários
            $stmt = $pdo->prepare("SELECT c.*, u.display_name as author_name, u.photo_url as comment_author_photo 
                          FROM comments c 
                          JOIN users u ON c.author_id = u.uid 
                          WHERE c.post_id = ? 
                          ORDER BY c.created_at ASC");
            $stmt->execute([$postId]);
            $post['comments'] = $stmt->fetchAll();
            
            // Incluir likes
            $post['likes'] = $likes;
            
            echo json_encode([
                'success' => true,
                'message' => $message,
                'post' => $post
            ]);
        } else {
            throw new Exception("Falha ao processar like");
        }
    } catch (Exception $e) {
        error_log("Erro ao processar like: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao processar like']);
    }
    exit;
}

// Excluir um post
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['id'])) {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    // Verificar se o post existe e se o usuário é o autor ou admin
    $stmt = $pdo->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$_GET['id']]);
    $post = $stmt->fetch();
    
    if (!$post) {
        http_response_code(404);
        echo json_encode(['error' => 'Post não encontrado']);
        exit;
    }
    
    if ($post['author_id'] !== $user['uid'] && !$user['is_admin']) {
        http_response_code(403);
        echo json_encode(['error' => 'Não autorizado a excluir este post']);
        exit;
    }
    
    // Excluir comentários do post
    $stmt = $pdo->prepare("DELETE FROM comments WHERE post_id = ?");
    $stmt->execute([$_GET['id']]);
    
    // Excluir o post
    $stmt = $pdo->prepare("DELETE FROM posts WHERE id = ?");
    $success = $stmt->execute([$_GET['id']]);
    
    if ($success) {
        echo json_encode(['message' => 'Post excluído com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao excluir post']);
    }
    exit;
}
