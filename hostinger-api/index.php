<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Carregar variáveis de ambiente
require_once __DIR__ . '/env.php';

// Inicializar configurações
require_once __DIR__ . '/config.php';

// Autenticação
require_once __DIR__ . '/auth.php';

// Obter o método HTTP e o caminho da URL
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remover /api/ do início da URI
$path = str_replace('/api/', '', $path);

// Verificar qual arquivo incluir baseado na URI
switch ($path) {
    case 'articles':
        require_once __DIR__ . '/articles.php';
        break;
    case 'auth':
        require_once __DIR__ . '/auth.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint não encontrado']);
        break;
}
