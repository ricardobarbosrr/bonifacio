<?php
// Função para verificar autenticação
function verifyAuthentication() {
    // Obter o token do header Authorization
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!$authHeader || !preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        throw new Exception('Token não fornecido');
    }
    
    $token = $matches[1];
    
    try {
        $decoded = verifyJwtToken($token);
        if (!$decoded || !isset($decoded['uid'])) {
            throw new Exception('Token inválido');
        }
        
        global $pdo;
        $stmt = $pdo->prepare("SELECT * FROM users WHERE uid = ?");
        $stmt->execute([$decoded['uid']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            throw new Exception('Usuário não encontrado');
        }
        
        return [
            'uid' => $user['uid'],
            'email' => $user['email'],
            'displayName' => $user['display_name'],
            'isAdmin' => (bool)$user['is_admin'],
            'isFounder' => (bool)$user['is_founder']
        ];
    } catch (Exception $e) {
        throw new Exception('Erro ao verificar token: ' . $e->getMessage());
    }
}

// Função para verificar se o usuário é admin
function verifyAdmin() {
    $user = verifyAuthentication();
    
    if (!$user['isAdmin'] && !$user['isFounder']) {
        throw new Exception('Acesso negado. Apenas administradores podem realizar esta ação.');
    }
    
    return $user;
}

// Função para verificar se o usuário é founder
function verifyFounder() {
    $user = verifyAuthentication();
    
    if (!$user['isFounder']) {
        throw new Exception('Acesso negado. Apenas fundadores podem realizar esta ação.');
    }
    
    return $user;
}
