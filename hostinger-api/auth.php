<?php
// Carregar dependências
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/src/controllers/auth.php';

// Endpoint para registro
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'register') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['password']) || !isset($data['displayName'])) {
            throw new Exception('Dados incompletos');
        }
        
        $result = createUser($data['email'], $data['password'], $data['displayName']);
        echo json_encode($result);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// Endpoint para login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'login') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['password'])) {
            throw new Exception('Dados incompletos');
        }
        
        $result = loginUser($data['email'], $data['password']);
        echo json_encode($result);
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// Verificar token atual
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'current') {
    try {
        $user = verifyAuthentication();
        echo json_encode($user);
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// Se chegou aqui, endpoint não encontrado
http_response_code(404);
echo json_encode(['error' => 'Endpoint não encontrado']);
exit;
