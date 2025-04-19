<?php
// Definir Content-Type como JSON
header('Content-Type: application/json');

// Configurar CORS
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://corpbonifacio.com.br'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
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

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Habilitar logging de erros para facilitar a depuração
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Log para identificar chamadas à API
error_log("API chamada: " . ($_SERVER['REQUEST_URI'] ?? 'URI desconhecida'));

// Carregar variáveis de ambiente
require_once 'env.php';

// Detectar ambiente (desenvolvimento ou produção)
$is_production = (strpos($_SERVER['HTTP_HOST'] ?? '', 'corpbonifacio.com.br') !== false);

// Log para identificar o ambiente detectado
error_log("Ambiente detectado: " . ($is_production ? "PRODUÇÃO" : "DESENVOLVIMENTO"));
error_log("HTTP_HOST: " . ($_SERVER['HTTP_HOST'] ?? 'não definido'));

// Configurações do banco de dados
if ($is_production) {
    // Configurações para Hostinger (produção)
    $host = env('DB_HOST', 'mysql.hostinger.com');
    $db = env('DB_NAME', 'u770443625_corpmonar');
    $user = env('DB_USER', 'u770443625_coprmonaradmin');
    $pass = env('DB_PASSWORD', 'Corpbonifacio!88@Ricardo');
} else {
    // Configurações para ambiente local
    $host = env('DB_HOST', 'mysql.hostinger.com');
    $db = env('DB_NAME', 'u770443625_corpmonar');
    $user = env('DB_USER', 'u770443625_coprmonaradmin');
    $pass = env('DB_PASSWORD', 'Corpbonifacio!88@Ricardo');
}

// Log das configurações do banco (sem a senha por segurança)
error_log("Configurações de BD: Host=$host, DB=$db, User=$user");

$charset = env('DB_CHARSET', 'utf8mb4');

// Configurações de upload
$upload_max_size = env('UPLOAD_MAX_SIZE', 5242880); // 5MB em bytes
$upload_allowed_types = explode(',', env('UPLOAD_ALLOWED_TYPES', 'jpg,jpeg,png,gif'));
$upload_dir = env('UPLOAD_DIR', 'documentos');
$upload_images_dir = env('UPLOAD_IMAGES_DIR', 'imagenspost');

// Garantir que os diretórios de uploads existam
if (!file_exists($upload_dir) && !is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}
if (!file_exists($upload_images_dir) && !is_dir($upload_images_dir)) {
    mkdir($upload_images_dir, 0755, true);
}

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    // Teste de conexão simples
    $pdo->query("SELECT 1");
    error_log("Conexão com o banco bem-sucedida");
} catch (PDOException $e) {
    error_log("ERRO CRÍTICO: Falha na conexão com o banco de dados: " . $e->getMessage());
    if (!$is_production) {
        // Em ambiente de desenvolvimento, mostre o erro
        echo json_encode(['error' => 'Erro de conexão com o banco de dados: ' . $e->getMessage()]);
    } else {
        // Em produção, mostre uma mensagem genérica
        echo json_encode(['error' => 'Erro interno do servidor. Por favor, tente novamente mais tarde.']);
    }
    http_response_code(500);
    exit;
}

// Criação das tabelas se não existirem
$sql = "
    CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        photo_url VARCHAR(255),
        auth_token VARCHAR(255) UNIQUE,
        created_at DATETIME NOT NULL,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS articles (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author_id VARCHAR(255) NOT NULL,
        image_url VARCHAR(255),
        category VARCHAR(255),
        tags JSON,
        reading_time INT,
        excerpt TEXT,
        featured_image VARCHAR(255),
        cover_color VARCHAR(7),
        custom_font VARCHAR(255),
        created_at DATETIME NOT NULL,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(255) PRIMARY KEY,
        article_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author_id VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (article_id) REFERENCES articles(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
        id VARCHAR(255) PRIMARY KEY,
        article_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (article_id) REFERENCES articles(id),
        UNIQUE KEY unique_like (article_id, user_id)
    );
";

try {
    $pdo->exec($sql);
} catch(PDOException $e) {
    die("Erro ao criar tabelas: " . $e->getMessage());
}

// Função para gerar UUID
function generateUUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// Funções utilitárias
function generateUniqueId($length = 16) {
    return bin2hex(random_bytes($length / 2));
}

function getCurrentTimestamp() {
    return date('Y-m-d H:i:s');
}
?>
