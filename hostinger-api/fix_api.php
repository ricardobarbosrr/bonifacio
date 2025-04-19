<?php
// 1. Verificar e criar diretórios necessários
$directories = [
    __DIR__ . '/documentos',
    __DIR__ . '/imagenspost',
    __DIR__ . '/uploads'
];

foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
        echo "Diretório criado: $dir\n";
    }
}

// 2. Verificar permissões
$files = [
    __DIR__ . '/config/config.php',
    __DIR__ . '/src/middleware/auth.php',
    __DIR__ . '/src/utils/jwt.php'
];

foreach ($files as $file) {
    chmod($file, 0644);
    echo "Permissões atualizadas: $file\n";
}

// 3. Verificar conexão com banco
require_once __DIR__ . '/config/config.php';

try {
    $pdo->query('SELECT 1');
    echo "Conexão com banco OK\n";
} catch (PDOException $e) {
    echo "Erro de conexão: " . $e->getMessage() . "\n";
}

// 4. Verificar tabelas
$tables = [
    'users',
    'posts',
    'documents',
    'announcements'
];

foreach ($tables as $table) {
    try {
        $count = $pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
        echo "Tabela $table OK ($count registros)\n";
    } catch (PDOException $e) {
        echo "Erro na tabela $table: " . $e->getMessage() . "\n";
    }
}

// 5. Atualizar origens permitidas
$origins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://corpbonifacio.com.br',
    'https://www.corpbonifacio.com.br',
    'https://admin.corpbonifacio.com.br'
];

$config_file = __DIR__ . '/config/config.php';
$config_content = file_get_contents($config_file);
$pattern = "/('allowed_origins'\s*=>\s*\[)[^\]]*(\])/";
$replacement = "$1\n        '" . implode("',\n        '", $origins) . "'\n    $2";
$config_content = preg_replace($pattern, $replacement, $config_content);
file_put_contents($config_file, $config_content);
echo "Origens CORS atualizadas\n";

// 6. Verificar tokens expirados
$stmt = $pdo->query("SELECT uid, auth_token FROM users WHERE auth_token IS NOT NULL");
$users = $stmt->fetchAll();

foreach ($users as $user) {
    try {
        verifyJwtToken($user['auth_token']);
        echo "Token válido para usuário {$user['uid']}\n";
    } catch (Exception $e) {
        $stmt = $pdo->prepare("UPDATE users SET auth_token = NULL WHERE uid = ?");
        $stmt->execute([$user['uid']]);
        echo "Token expirado removido para usuário {$user['uid']}\n";
    }
}

echo "\nVerificação concluída!\n";
