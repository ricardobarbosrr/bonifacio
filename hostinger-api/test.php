<?php
require_once 'config.php';

header('Content-Type: application/json');

// Verificar conexão com o banco de dados
try {
    $stmt = $pdo->query("SELECT 1");
    $dbStatus = "Conectado";
} catch (PDOException $e) {
    $dbStatus = "Erro: " . $e->getMessage();
}

// Verificar tabelas
$tables = [];
try {
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch()) {
        $tables[] = $row[0];
    }
} catch (PDOException $e) {
    $tables = ["Erro ao listar tabelas: " . $e->getMessage()];
}

// Verificar usuários
$users = [];
try {
    $stmt = $pdo->query("SELECT uid, email, display_name, is_admin FROM users LIMIT 5");
    while ($row = $stmt->fetch()) {
        $users[] = [
            'uid' => $row['uid'],
            'email' => $row['email'],
            'displayName' => $row['display_name'],
            'isAdmin' => (bool)$row['is_admin']
        ];
    }
} catch (PDOException $e) {
    $users = ["Erro ao listar usuários: " . $e->getMessage()];
}

// Retornar informações
echo json_encode([
    'status' => 'API funcionando',
    'timestamp' => getCurrentTimestamp(),
    'php_version' => PHP_VERSION,
    'database' => [
        'status' => $dbStatus,
        'tables' => $tables,
        'users' => $users
    ],
    'server' => [
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Desconhecido',
        'host' => $_SERVER['HTTP_HOST'] ?? 'Desconhecido',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Desconhecido'
    ]
], JSON_PRETTY_PRINT);
