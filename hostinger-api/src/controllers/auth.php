<?php
// Função para criar um novo usuário
function createUser($email, $password, $displayName) {
    global $pdo;
    
    if (!validateEmail($email)) {
        throw new Exception('Email inválido');
    }
    
    // Verificar se o email já existe
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() > 0) {
        throw new Exception('Email já está em uso');
    }
    
    // Hash da senha
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Gerar ID único
    $uid = generateUniqueId();
    
    // Inserir usuário
    $stmt = $pdo->prepare("INSERT INTO users (uid, email, password, display_name, created_at) VALUES (?, ?, ?, ?, ?)");
    $success = $stmt->execute([$uid, $email, $passwordHash, $displayName, getCurrentTimestamp()]);
    
    if (!$success) {
        throw new Exception('Erro ao criar usuário');
    }
    
    return [
        'uid' => $uid,
        'email' => $email,
        'displayName' => $displayName
    ];
}

// Função para autenticar usuário
function loginUser($email, $password) {
    global $pdo;
    
    if (!validateEmail($email)) {
        throw new Exception('Email inválido');
    }
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password'])) {
        throw new Exception('Email ou senha inválidos');
    }
    
    // Gerar token JWT
    $token = generateJwtToken($user['uid']);
    
    return [
        'uid' => $user['uid'],
        'email' => $user['email'],
        'displayName' => $user['display_name'],
        'isAdmin' => (bool)$user['is_admin'],
        'isFounder' => (bool)$user['is_founder'],
        'token' => $token
    ];
}
