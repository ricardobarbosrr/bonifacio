<?php
// Cabeçalhos para permitir acesso de qualquer origem
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Informações sobre o ambiente
$environment = [
    'server' => $_SERVER,
    'request' => $_REQUEST,
    'get' => $_GET,
    'post' => $_POST,
    'php_version' => phpversion(),
    'extensions' => get_loaded_extensions(),
    'path' => __FILE__,
    'directory' => __DIR__,
    'time' => date('Y-m-d H:i:s')
];

// Testar conexão com o banco de dados
$db_connection = false;
$db_error = '';

try {
    // Incluir arquivo de configuração
    require_once 'config.php';
    
    // Se chegou até aqui, a conexão foi bem-sucedida
    $db_connection = true;
    
    // Testar uma consulta simples
    $stmt = $pdo->query('SELECT 1');
    $result = $stmt->fetch();
    
    $environment['database'] = [
        'connection' => 'success',
        'test_query' => $result
    ];
} catch (Exception $e) {
    $db_error = $e->getMessage();
    $environment['database'] = [
        'connection' => 'error',
        'message' => $db_error
    ];
}

// Retornar todas as informações como JSON
echo json_encode([
    'status' => 'success',
    'message' => 'API Test',
    'database_connection' => $db_connection ? 'success' : 'error',
    'environment' => $environment
], JSON_PRETTY_PRINT);
?>
