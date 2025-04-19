<?php
// Carregar variáveis de ambiente
require_once __DIR__ . '/../src/utils/env.php';

// Detectar ambiente
$is_production = (strpos($_SERVER['HTTP_HOST'] ?? '', 'corpbonifacio.com.br') !== false);

// Configurações do banco de dados
$db_config = [
    'host' => env('DB_HOST', 'mysql.hostinger.com'),
    'name' => env('DB_NAME', 'u770443625_corpmonar'),
    'user' => env('DB_USER', 'u770443625_coprmonaradmin'),
    'pass' => env('DB_PASSWORD', 'Corpbonifacio!88@Ricardo'),
    'charset' => env('DB_CHARSET', 'utf8mb4')
];

// Configurações de upload
$upload_config = [
    'max_size' => env('UPLOAD_MAX_SIZE', 5242880), // 5MB em bytes
    'allowed_types' => explode(',', env('UPLOAD_ALLOWED_TYPES', 'jpg,jpeg,png,gif')),
    'dir' => env('UPLOAD_DIR', 'documentos')
];

// Configurações de segurança
$security_config = [
    'jwt_secret' => env('JWT_SECRET', 'seu-segredo-aqui'),
    'jwt_expiration' => 3600, // 1 hora
    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:4173',
        'https://corpbonifacio.com.br'
    ]
];

// Conexão com o banco de dados
try {
    $dsn = "mysql:host={$db_config['host']};dbname={$db_config['name']};charset={$db_config['charset']}";
    $pdo = new PDO($dsn, $db_config['user'], $db_config['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro de conexão com o banco de dados']);
    exit;
}
