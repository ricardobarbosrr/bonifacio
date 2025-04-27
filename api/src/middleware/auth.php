<?php
/**
 * Middleware de Autenticação
 * 
 * Responsável por controlar login, registro e verificação de tokens
 * Usando apenas armazenamento JSON (sem banco de dados)
 */

/**
 * Verifica se um usuário está autenticado
 * 
 * @return array Dados do usuário autenticado
 * @throws Exception Se o usuário não estiver autenticado
 */
function verifyAuthentication() {
    global $security_config;
    
    // Obter o token dos headers
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    // Verificar formato do header de autorização
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        throw new Exception('Token de autenticação não fornecido');
    }
    
    $token = $matches[1];
    
    try {
        // Verificar o token JWT
        $payload = verifyJwtToken($token, $security_config['jwt_secret']);
        
        if (!isset($payload['sub'])) {
            throw new Exception('Token inválido');
        }
        
        $userId = $payload['sub'];
        
        // Buscar usuário no armazenamento JSON
        $jsonStorage = new JsonStorage();
        $user = $jsonStorage->getById('users', $userId);
        
        if (!$user) {
            throw new Exception('Usuário não encontrado');
        }
        
        // Verificar se o token está armazenado no usuário
        if (!isset($user['auth_token']) || $user['auth_token'] !== $token) {
            throw new Exception('Sessão inválida');
        }
        
        // Remover campos sensíveis
        unset($user['password']);
        
        return $user;
    } catch (Exception $e) {
        // Registrar o erro e lançar exceção
        error_log("Erro de autenticação: " . $e->getMessage());
        throw new Exception('Não autorizado: ' . $e->getMessage());
    }
}

/**
 * Registra um novo usuário
 * 
 * @param string $email Email do usuário
 * @param string $password Senha do usuário
 * @param string $displayName Nome de exibição
 * @param string|null $photoUrl URL da foto de perfil
 * @return array Dados do usuário registrado com token
 * @throws Exception Se houver erro no registro
 */
function registerUser($email, $password, $displayName, $photoUrl = null) {
    global $security_config;
    $jsonStorage = new JsonStorage();
    
    // Validar email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Email inválido');
    }
    
    // Validar senha
    if (strlen($password) < 6) {
        throw new Exception('A senha deve ter pelo menos 6 caracteres');
    }
    
    // Verificar se o email já está em uso
    $existingUsers = $jsonStorage->findBy('users', ['email' => $email]);
    
    if (!empty($existingUsers)) {
        throw new Exception('Este email já está em uso');
    }
    
    // Criar novo usuário
    $userId = generateUniqueId();
    $hashedPassword = password_hash($password, $security_config['password_algo']);
    
    // Gerar token JWT
    $userData = [
        'email' => $email,
        'displayName' => $displayName
    ];
    
    $token = generateJwtToken($userId, $userData, $security_config['jwt_secret'], $security_config['jwt_expiration']);
    
    $user = [
        'id' => $userId,
        'email' => $email,
        'password' => $hashedPassword,
        'display_name' => $displayName,
        'photo_url' => $photoUrl,
        'is_admin' => false,
        'is_founder' => false,
        'auth_token' => $token,
        'created_at' => getCurrentTimestamp()
    ];
    
    // Salvar usuário
    if (!$jsonStorage->add('users', $user)) {
        throw new Exception('Erro ao criar usuário');
    }
    
    // Retornar dados públicos com token
    return [
        'uid' => $user['id'],
        'email' => $user['email'],
        'displayName' => $user['display_name'],
        'photoUrl' => $user['photo_url'],
        'isAdmin' => (bool)$user['is_admin'],
        'isFounder' => (bool)$user['is_founder'],
        'token' => $token
    ];
}

/**
 * Realiza login de um usuário
 * 
 * @param string $email Email do usuário
 * @param string $password Senha do usuário
 * @return array Dados do usuário com token
 * @throws Exception Se as credenciais forem inválidas
 */
function loginUser($email, $password) {
    global $security_config;
    $jsonStorage = new JsonStorage();
    
    // Validar email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Email inválido');
    }
    
    // Buscar usuário pelo email
    $users = $jsonStorage->findBy('users', ['email' => $email]);
    
    if (empty($users)) {
        throw new Exception('Email ou senha inválidos');
    }
    
    $user = $users[0];
    
    // Verificar senha
    if (!password_verify($password, $user['password'])) {
        throw new Exception('Email ou senha inválidos');
    }
    
    // Gerar novo token JWT
    $userData = [
        'email' => $user['email'],
        'displayName' => $user['display_name']
    ];
    
    $token = generateJwtToken($user['id'], $userData, $security_config['jwt_secret'], $security_config['jwt_expiration']);
    
    // Atualizar token no usuário
    $user['auth_token'] = $token;
    $user['last_login'] = getCurrentTimestamp();
    
    if (!$jsonStorage->update('users', $user['id'], $user)) {
        throw new Exception('Erro ao atualizar token de autenticação');
    }
    
    // Retornar dados públicos com token
    return [
        'uid' => $user['id'],
        'email' => $user['email'],
        'displayName' => $user['display_name'],
        'photoUrl' => $user['photo_url'],
        'isAdmin' => (bool)$user['is_admin'],
        'isFounder' => (bool)$user['is_founder'],
        'token' => $token
    ];
}

/**
 * Realiza logout de um usuário
 * 
 * @param string $userId ID do usuário
 * @return bool true se logout bem-sucedido
 * @throws Exception Se houver erro no logout
 */
function logoutUser($userId) {
    $jsonStorage = new JsonStorage();
    
    // Buscar usuário
    $user = $jsonStorage->getById('users', $userId);
    
    if (!$user) {
        throw new Exception('Usuário não encontrado');
    }
    
    // Remover token
    $user['auth_token'] = null;
    
    return $jsonStorage->update('users', $userId, $user);
}

/**
 * Solicita recuperação de senha
 * 
 * @param string $email Email do usuário
 * @return bool true se solicitação enviada com sucesso
 * @throws Exception Se o email não for encontrado
 */
function requestPasswordReset($email) {
    $jsonStorage = new JsonStorage();
    
    // Buscar usuário pelo email
    $users = $jsonStorage->findBy('users', ['email' => $email]);
    
    if (empty($users)) {
        throw new Exception('Email não encontrado');
    }
    
    $user = $users[0];
    
    // Gerar token de redefinição de senha (válido por 24 horas)
    $resetToken = bin2hex(random_bytes(16));
    $user['password_reset_token'] = $resetToken;
    $user['password_reset_expires'] = date('Y-m-d H:i:s', time() + 86400);
    
    if (!$jsonStorage->update('users', $user['id'], $user)) {
        throw new Exception('Erro ao gerar token de redefinição de senha');
    }
    
    // Em um ambiente real, enviaria um email com o link de redefinição
    // Aqui apenas registramos o token
    error_log("Token de redefinição para {$email}: {$resetToken}");
    
    return true;
}

/**
 * Redefine a senha de um usuário
 * 
 * @param string $resetToken Token de redefinição
 * @param string $newPassword Nova senha
 * @return bool true se senha redefinida com sucesso
 * @throws Exception Se o token for inválido ou expirado
 */
function resetPassword($resetToken, $newPassword) {
    global $security_config;
    $jsonStorage = new JsonStorage();
    
    // Buscar usuário pelo token
    $users = $jsonStorage->findBy('users', ['password_reset_token' => $resetToken]);
    
    if (empty($users)) {
        throw new Exception('Token inválido');
    }
    
    $user = $users[0];
    
    // Verificar se o token expirou
    if (strtotime($user['password_reset_expires']) < time()) {
        throw new Exception('Token expirado');
    }
    
    // Validar senha
    if (strlen($newPassword) < 6) {
        throw new Exception('A senha deve ter pelo menos 6 caracteres');
    }
    
    // Atualizar senha
    $user['password'] = password_hash($newPassword, $security_config['password_algo']);
    $user['password_reset_token'] = null;
    $user['password_reset_expires'] = null;
    $user['updated_at'] = getCurrentTimestamp();
    
    return $jsonStorage->update('users', $user['id'], $user);
}

/**
 * Atualiza a senha de um usuário autenticado
 * 
 * @param string $userId ID do usuário
 * @param string $currentPassword Senha atual
 * @param string $newPassword Nova senha
 * @return bool true se senha atualizada com sucesso
 * @throws Exception Se a senha atual for inválida
 */
function updatePassword($userId, $currentPassword, $newPassword) {
    global $security_config;
    $jsonStorage = new JsonStorage();
    
    // Buscar usuário
    $user = $jsonStorage->getById('users', $userId);
    
    if (!$user) {
        throw new Exception('Usuário não encontrado');
    }
    
    // Verificar senha atual
    if (!password_verify($currentPassword, $user['password'])) {
        throw new Exception('Senha atual incorreta');
    }
    
    // Validar nova senha
    if (strlen($newPassword) < 6) {
        throw new Exception('A nova senha deve ter pelo menos 6 caracteres');
    }
    
    // Atualizar senha
    $user['password'] = password_hash($newPassword, $security_config['password_algo']);
    $user['updated_at'] = getCurrentTimestamp();
    
    return $jsonStorage->update('users', $userId, $user);
}
