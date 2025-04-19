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

// Função para verificar se o usuário é fundador
function isFounder($user) {
    return $user && isset($user['is_founder']) && $user['is_founder'] == 1;
}

// Função para gerar ID único
function generateUserId() {
    return bin2hex(random_bytes(8));
}

try {
    // GET - Listar todos os usuários (apenas para administradores)
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['id'])) {
        $user = getAuthenticatedUser();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Não autorizado']);
            exit;
        }
        
        // Verificar se o usuário é administrador
        if ($user['is_admin'] != 1) {
            http_response_code(403);
            echo json_encode(['error' => 'Permissão negada']);
            exit;
        }
        
        // Verificar se estamos buscando usuários específicos por IDs
        if (isset($_GET['ids'])) {
            $ids = explode(',', $_GET['ids']);
            
            if (empty($ids)) {
                echo json_encode([]);
                exit;
            }
            
            // Preparar placeholders para a consulta SQL
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            
            $stmt = $pdo->prepare("
                SELECT uid, email, display_name as displayName, photo_url as photoURL, 
                is_admin as isAdmin, is_founder as isFounder 
                FROM users 
                WHERE uid IN ($placeholders)
            ");
            
            $stmt->execute($ids);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode($users);
            exit;
        }
        
        $stmt = $pdo->query("SELECT uid as id, email, display_name as username, photo_url, is_admin as isAdmin, is_founder as isFounder, created_at, last_login FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll();
        
        echo json_encode($users);
        exit;
    }

    // GET - Obter usuário específico
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
        $user = getAuthenticatedUser();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Não autorizado']);
            exit;
        }
        
        // Verificar se o usuário é administrador ou é o próprio usuário
        if ($user['is_admin'] != 1 && $user['uid'] !== $_GET['id']) {
            http_response_code(403);
            echo json_encode(['error' => 'Permissão negada']);
            exit;
        }
        
        $stmt = $pdo->prepare("SELECT uid as id, email, display_name, photo_url, is_admin, created_at, last_login FROM users WHERE uid = ?");
        $stmt->execute([$_GET['id']]);
        $fetchedUser = $stmt->fetch();
        
        if (!$fetchedUser) {
            http_response_code(404);
            echo json_encode(['error' => 'Usuário não encontrado']);
            exit;
        }
        
        echo json_encode($fetchedUser);
        exit;
    }

    // POST - Criar novo usuário (registro)
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_GET['login'])) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['password']) || !isset($data['displayName'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Dados incompletos']);
            exit;
        }
        
        // Verificar se o email já está em uso
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Email já está em uso']);
            exit;
        }
        
        // Criar o usuário
        $uid = 'user_' . generateUserId();
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $authToken = bin2hex(random_bytes(32)); // Token para autenticação
        $now = date('Y-m-d H:i:s');
        $isAdmin = 0; // Padrão: não é admin
        $isFounder = 0; // Padrão: não é fundador
        
        // Primeiro usuário registrado torna-se admin e fundador
        $countUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        if ($countUsers === 0) {
            $isAdmin = 1;
            $isFounder = 1;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO users (uid, email, password, display_name, photo_url, is_admin, is_founder, auth_token, created_at, last_login) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $success = $stmt->execute([
            $uid, 
            $data['email'], 
            $hashedPassword, 
            $data['displayName'], 
            isset($data['photoURL']) ? $data['photoURL'] : null, 
            $isAdmin,
            $isFounder,
            $authToken,
            $now,
            $now
        ]);
        
        if ($success) {
            echo json_encode([
                'id' => $uid,
                'email' => $data['email'],
                'displayName' => $data['displayName'],
                'photoURL' => isset($data['photoURL']) ? $data['photoURL'] : null,
                'isAdmin' => $isAdmin == 1,
                'token' => $authToken
            ]);
        } else {
            error_log("Erro ao criar usuário: " . json_encode($stmt->errorInfo()));
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao criar usuário']);
        }
        exit;
    }

    // POST - Login
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['login'])) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email e senha são obrigatórios']);
            exit;
        }
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($data['password'], $user['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Email ou senha inválidos']);
            exit;
        }
        
        // Gerar novo token de autenticação
        $authToken = bin2hex(random_bytes(32));
        
        // Atualizar token e último login
        $stmt = $pdo->prepare("UPDATE users SET auth_token = ?, last_login = ? WHERE uid = ?");
        $stmt->execute([$authToken, date('Y-m-d H:i:s'), $user['uid']]);
        
        echo json_encode([
            'id' => $user['uid'],
            'email' => $user['email'],
            'displayName' => $user['display_name'],
            'photoURL' => $user['photo_url'],
            'isAdmin' => $user['is_admin'] == 1,
            'token' => $authToken
        ]);
        exit;
    }

    // PUT - Atualizar usuário
    if ($_SERVER['REQUEST_METHOD'] === 'PUT' && isset($_GET['id'])) {
        $authenticatedUser = getAuthenticatedUser();
        
        if (!$authenticatedUser) {
            http_response_code(401);
            echo json_encode(['error' => 'Não autorizado']);
            exit;
        }
        
        // Verificar se o usuário é administrador ou é o próprio usuário
        if ($authenticatedUser['is_admin'] != 1 && $authenticatedUser['uid'] !== $_GET['id']) {
            http_response_code(403);
            echo json_encode(['error' => 'Permissão negada']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Preparar os campos para atualização
        $updates = [];
        $params = [];
        
        if (isset($data['displayName'])) {
            $updates[] = "display_name = ?";
            $params[] = $data['displayName'];
        }
        
        if (isset($data['photoURL'])) {
            $updates[] = "photo_url = ?";
            $params[] = $data['photoURL'];
        }
        
        // Apenas fundadores podem alterar status de admin
        if (isFounder($authenticatedUser) && isset($data['isAdmin'])) {
            $updates[] = "is_admin = ?";
            $params[] = $data['isAdmin'] ? 1 : 0;
        } else if (isset($data['isAdmin'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Permissão negada para alterar status de admin']);
            exit;
        }
        
        if (isset($data['password'])) {
            $updates[] = "password = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum campo para atualizar']);
            exit;
        }
        
        // Adicionar o ID do usuário ao final dos parâmetros
        $params[] = $_GET['id'];
        
        $stmt = $pdo->prepare("
            UPDATE users 
            SET " . implode(", ", $updates) . " 
            WHERE uid = ?
        ");
        
        $success = $stmt->execute($params);
        
        if ($success) {
            // Retornar usuário atualizado
            $stmt = $pdo->prepare("SELECT uid as id, email, display_name, photo_url, is_admin, created_at, last_login FROM users WHERE uid = ?");
            $stmt->execute([$_GET['id']]);
            $updatedUser = $stmt->fetch();
            
            echo json_encode($updatedUser);
        } else {
            error_log("Erro ao atualizar usuário: " . json_encode($stmt->errorInfo()));
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao atualizar usuário']);
        }
        exit;
    }

    // DELETE - Remover usuário (apenas admin)
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['id'])) {
        $user = getAuthenticatedUser();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Não autorizado']);
            exit;
        }
        
        // Apenas administradores podem excluir usuários
        if ($user['is_admin'] != 1) {
            http_response_code(403);
            echo json_encode(['error' => 'Permissão negada']);
            exit;
        }
        
        // Não permitir que o admin exclua a si mesmo
        if ($user['uid'] === $_GET['id']) {
            http_response_code(400);
            echo json_encode(['error' => 'Não é possível excluir sua própria conta']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM users WHERE uid = ?");
        $success = $stmt->execute([$_GET['id']]);
        
        if ($success) {
            echo json_encode(['success' => true, 'message' => 'Usuário excluído com sucesso']);
        } else {
            error_log("Erro ao excluir usuário: " . json_encode($stmt->errorInfo()));
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao excluir usuário']);
        }
        exit;
    }

    // Método não suportado
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    
} catch (PDOException $e) {
    error_log("Erro de banco de dados em users.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor']);
} catch (Exception $e) {
    error_log("Erro em users.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor']);
}
