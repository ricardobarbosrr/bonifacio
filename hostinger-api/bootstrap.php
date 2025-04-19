<?php
// Definir Content-Type como JSON
header('Content-Type: application/json');

// Carregar configurações
require_once __DIR__ . '/config/config.php';

// Configurar CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $security_config['allowed_origins'])) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Verificar se é uma requisição OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Habilitar tratamento de erros personalizado
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erro interno do servidor',
        'details' => $errstr,
        'file' => basename($errfile),
        'line' => $errline
    ]);
    exit;
});

// Habilitar tratamento de exceções personalizado
set_exception_handler(function($e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erro interno do servidor',
        'details' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ]);
    exit;
});

// Carregar utilitários
require_once __DIR__ . '/src/utils/jwt.php';
require_once __DIR__ . '/src/utils/helpers.php';

// Carregar middleware
require_once __DIR__ . '/src/middleware/auth.php';
