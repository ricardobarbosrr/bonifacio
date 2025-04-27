<?php
/**
 * Configuração principal da API
 * 
 * Este arquivo configura todas as opções globais necessárias
 * para o funcionamento da API baseada em JSON
 */

// Verificar se está sendo executado via CLI (linha de comando)
$is_cli = (php_sapi_name() === 'cli');

// Configurar headers apenas em ambiente web
if (!$is_cli) {
    // Definir Content-Type como JSON
    header('Content-Type: application/json');

    // Configurar CORS para desenvolvimento e produção
    // Em desenvolvimento, permitir qualquer origem
    $is_production = getenv('APP_ENV') === 'production' || 
                    (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'corpbonifacio.com.br') !== false);
    
    $allowed_origins = [
        'http://localhost:5173',
        'http://localhost:4173', 
        'http://localhost:8000',
        'http://localhost:3000',
        'https://corpbonifacio.com.br'
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    
    if ($is_production) {
        // Em produção, verificar origens específicas
        if (in_array($origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: $origin");
        }
    } else {
        // Em desenvolvimento, permitir a origem localhost
        if (in_array($origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            header("Access-Control-Allow-Origin: http://localhost:5173");
        }
    }
    
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    // Verificar se é uma requisição OPTIONS (CORS preflight)
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
}

// Habilitar tratamento de erros personalizado
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    global $is_cli;
    
    if (!$is_cli) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Erro interno do servidor',
            'details' => $errstr,
            'file' => basename($errfile),
            'line' => $errline
        ]);
    } else {
        echo "ERRO: $errstr em $errfile:$errline\n";
    }
    exit;
});

// Habilitar tratamento de exceções personalizado
set_exception_handler(function($e) {
    global $is_cli;
    
    if (!$is_cli) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Erro interno do servidor',
            'details' => $e->getMessage(),
            'file' => basename($e->getFile()),
            'line' => $e->getLine()
        ]);
    } else {
        echo "EXCEÇÃO: {$e->getMessage()} em {$e->getFile()}:{$e->getLine()}\n";
    }
    exit;
});

// Habilitar logging de erros para facilitar a depuração
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Carregar variáveis de ambiente
$env_file = __DIR__ . '/.env';
if (file_exists($env_file)) {
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
            putenv(sprintf('%s=%s', trim($key), trim($value)));
        }
    }
}

// Função para obter variáveis de ambiente
function env($key, $default = null) {
    return $_ENV[$key] ?? getenv($key) ?? $default;
}

// Detectar ambiente (desenvolvimento ou produção)
$is_production = env('APP_ENV') === 'production' || 
                (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'corpbonifacio.com.br') !== false);

// Configurações de segurança
$security_config = [
    'jwt_secret' => env('JWT_SECRET', 'bonifacio_super_secure_jwt_secret_key'),
    'jwt_expiration' => env('JWT_EXPIRATION', 86400 * 7), // 7 dias em segundos
    'password_algo' => PASSWORD_DEFAULT
];

// Configurações para upload de arquivos
$upload_config = [
    'max_size' => env('UPLOAD_MAX_SIZE', 5242880), // 5MB em bytes
    'allowed_types' => explode(',', env('UPLOAD_ALLOWED_TYPES', 'jpg,jpeg,png,gif')),
    'images_dir' => __DIR__ . '/uploads/images',
    'documents_dir' => __DIR__ . '/uploads/documents'
];

// Garantir que os diretórios necessários existam
$directories = [
    __DIR__ . '/data',
    $upload_config['images_dir'], 
    $upload_config['documents_dir']
];

foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Definir função para responder com JSON
function jsonResponse($data, $statusCode = 200) {
    global $is_cli;
    
    // Verificar se os dados estão no formato de paginação e converter para array simples
    // Isso é para compatibilidade com o frontend que espera arrays diretos
    if (is_array($data) && isset($data['data']) && is_array($data['data']) && 
        isset($data['page']) && isset($data['limit']) && isset($data['total'])) {
        $data = $data['data']; // Usar apenas o array de dados, ignorando metadata de paginação
    }
    
    if (!$is_cli) {
        http_response_code($statusCode);
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
    exit;
}

/**
 * Gera um ID único para registros
 * 
 * @return string ID único
 */
function generateUniqueId() {
    return bin2hex(random_bytes(8));
}

/**
 * Obtém o timestamp atual no formato ISO 8601
 * 
 * @return string Timestamp atual
 */
function getCurrentTimestamp() {
    return date('Y-m-d H:i:s');
}

// Incluir outros arquivos essenciais
require_once __DIR__ . '/src/utils/JsonStorage.php';
require_once __DIR__ . '/src/utils/jwt.php';

// Inicializar o armazenamento JSON
$jsonStorage = new JsonStorage(__DIR__ . '/data');
$jsonStorage->initializeEntities();
