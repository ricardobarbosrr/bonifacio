<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

// Função para verificar autenticação
function verifyAuthentication() {
    // Verificar se é uma requisição OPTIONS
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }

    // Obter o token do header Authorization
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!$authHeader || !preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Token não fornecido']);
        exit;
    }
    
    $token = $matches[1];
    
    try {
        $decoded = verifyJwtToken($token);
        if (!$decoded || !isset($decoded['uid'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Token inválido']);
            exit;
        }
        
        global $pdo;
        $stmt = $pdo->prepare("SELECT * FROM users WHERE uid = ?");
        $stmt->execute([$decoded['uid']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Usuário não encontrado']);
            exit;
        }
        
        return [
            'uid' => $user['uid'],
            'email' => $user['email'],
            'displayName' => $user['display_name'],
            'isAdmin' => (bool)$user['is_admin'],
            'isFounder' => (bool)$user['is_founder']
        ];
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Erro ao verificar token']);
        exit;
    }
}

// Função para verificar se o usuário é admin
function verifyAdmin() {
    $user = verifyAuthentication();
    
    if (!$user['isAdmin'] && !$user['isFounder']) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado. Apenas administradores podem realizar esta ação.']);
        exit;
    }
    
    return $user;
}

// Função para verificar se o usuário é founder
function verifyFounder() {
    $user = verifyAuthentication();
    
    if (!$user['isFounder']) {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado. Apenas fundadores podem realizar esta ação.']);
        exit;
    }
    
    return $user;
}
