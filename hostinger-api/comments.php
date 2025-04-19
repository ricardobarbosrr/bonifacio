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

// Adicionar um comentário
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['post_id']) || !isset($data['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados incompletos']);
        exit;
    }
    
    // Verificar se o post existe
    $stmt = $pdo->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$data['post_id']]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Post não encontrado']);
        exit;
    }
    
    $stmt = $pdo->prepare("INSERT INTO comments (id, post_id, content, author_id, created_at) VALUES (?, ?, ?, ?, ?)");
    $commentId = generateUniqueId();
    $success = $stmt->execute([$commentId, $data['post_id'], $data['content'], $user['uid'], getCurrentTimestamp()]);
    
    if ($success) {
        echo json_encode([
            'id' => $commentId,
            'post_id' => $data['post_id'],
            'content' => $data['content'],
            'author_id' => $user['uid'],
            'author_name' => $user['display_name'],
            'created_at' => getCurrentTimestamp()
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao adicionar comentário']);
    }
    exit;
}

// Excluir um comentário
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['id'])) {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    // Verificar se o comentário existe e se o usuário é o autor ou admin
    $stmt = $pdo->prepare("SELECT * FROM comments WHERE id = ?");
    $stmt->execute([$_GET['id']]);
    $comment = $stmt->fetch();
    
    if (!$comment) {
        http_response_code(404);
        echo json_encode(['error' => 'Comentário não encontrado']);
        exit;
    }
    
    if ($comment['author_id'] !== $user['uid'] && !$user['is_admin']) {
        http_response_code(403);
        echo json_encode(['error' => 'Não autorizado a excluir este comentário']);
        exit;
    }
    
    $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ?");
    $success = $stmt->execute([$_GET['id']]);
    
    if ($success) {
        echo json_encode(['message' => 'Comentário excluído com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao excluir comentário']);
    }
    exit;
}
