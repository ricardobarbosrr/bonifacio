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

// Função para gerar ID único
function generateId() {
    return uniqid('notif_');
}

// Verificar se a tabela de notificações existe e criá-la se não existir
function ensureNotificationsTableExists() {
    global $pdo;
    
    $tableExists = $pdo->query("SHOW TABLES LIKE 'notifications'")->rowCount() > 0;
    
    if (!$tableExists) {
        $pdo->exec("
            CREATE TABLE notifications (
                id VARCHAR(24) PRIMARY KEY,
                user_id VARCHAR(24) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                related_id VARCHAR(24),
                related_type VARCHAR(50),
                read TINYINT(1) DEFAULT 0,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(uid)
            )
        ");
    }
}

// Garantir que a tabela existe
ensureNotificationsTableExists();

// Obter todas as notificações do usuário
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['id'])) {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    ");
    $stmt->execute([$user['uid']]);
    $notifications = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $notifications
    ]);
    exit;
}

// Marcar notificação como lida
if ($_SERVER['REQUEST_METHOD'] === 'PUT' && isset($_GET['id'])) {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    $notificationId = $_GET['id'];
    
    // Verificar se a notificação pertence ao usuário
    $stmt = $pdo->prepare("
        SELECT * FROM notifications 
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([$notificationId, $user['uid']]);
    $notification = $stmt->fetch();
    
    if (!$notification) {
        http_response_code(404);
        echo json_encode(['error' => 'Notificação não encontrada']);
        exit;
    }
    
    // Atualizar para lida
    $stmt = $pdo->prepare("
        UPDATE notifications 
        SET read = 1 
        WHERE id = ?
    ");
    $stmt->execute([$notificationId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Notificação marcada como lida'
    ]);
    exit;
}

// Criar nova notificação (apenas para administradores)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = getAuthenticatedUser();
    
    if (!$user || $user['is_admin'] != 1) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['title']) || !isset($data['message']) || !isset($data['user_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados incompletos']);
        exit;
    }
    
    $id = generateId();
    $title = $data['title'];
    $message = $data['message'];
    $userId = $data['user_id'];
    $relatedId = isset($data['related_id']) ? $data['related_id'] : null;
    $relatedType = isset($data['related_type']) ? $data['related_type'] : null;
    $createdAt = date('Y-m-d H:i:s');
    
    $stmt = $pdo->prepare("
        INSERT INTO notifications (id, user_id, title, message, related_id, related_type, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$id, $userId, $title, $message, $relatedId, $relatedType, $createdAt]);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $id,
            'title' => $title,
            'message' => $message,
            'user_id' => $userId,
            'related_id' => $relatedId,
            'related_type' => $relatedType,
            'read' => 0,
            'created_at' => $createdAt
        ]
    ]);
    exit;
}

// Método não suportado
http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
