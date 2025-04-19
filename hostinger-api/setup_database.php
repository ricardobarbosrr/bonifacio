<?php
require_once 'config.php';

// Função para executar um arquivo SQL
function executeSqlFile($pdo, $file) {
    if (!file_exists($file)) {
        echo "Arquivo SQL não encontrado: $file\n";
        return false;
    }
    
    $sql = file_get_contents($file);
    
    // Dividir o SQL em comandos individuais
    $queries = explode(';', $sql);
    
    // Executar cada comando
    foreach ($queries as $query) {
        $query = trim($query);
        if (empty($query)) continue;
        
        try {
            $pdo->exec($query);
            echo "Comando SQL executado com sucesso.\n";
        } catch (PDOException $e) {
            echo "Erro ao executar SQL: " . $e->getMessage() . "\n";
        }
    }
    
    return true;
}

// Verificar se o banco de dados está acessível
try {
    $pdo->query("SELECT 1");
    echo "Conexão com o banco de dados estabelecida com sucesso!\n";
    
    // Executar o arquivo SQL para criar/atualizar as tabelas
    $sqlFile = __DIR__ . '/setup_database.sql';
    if (executeSqlFile($pdo, $sqlFile)) {
        echo "Banco de dados configurado com sucesso!\n";
    } else {
        echo "Erro ao configurar o banco de dados.\n";
    }
    
} catch (PDOException $e) {
    echo "Erro de conexão com o banco de dados: " . $e->getMessage() . "\n";
    exit(1);
}

// Verificar se as tabelas foram criadas corretamente
try {
    $tables = ['users', 'posts', 'comments', 'documents'];
    $allTablesExist = true;
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() == 0) {
            echo "Tabela '$table' não encontrada!\n";
            $allTablesExist = false;
        } else {
            echo "Tabela '$table' encontrada.\n";
            
            // Mostrar estrutura da tabela
            $stmt = $pdo->query("DESCRIBE $table");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo "Estrutura da tabela '$table':\n";
            foreach ($columns as $column) {
                echo "  - {$column['Field']} ({$column['Type']})\n";
            }
            echo "\n";
        }
    }
    
    if ($allTablesExist) {
        echo "Todas as tabelas foram criadas com sucesso!\n";
    } else {
        echo "Algumas tabelas não foram criadas. Verifique os erros acima.\n";
    }
    
} catch (PDOException $e) {
    echo "Erro ao verificar tabelas: " . $e->getMessage() . "\n";
    exit(1);
}

// Verificar se o diretório de uploads existe
if (!file_exists($upload_dir)) {
    if (mkdir($upload_dir, 0755, true)) {
        echo "Diretório de uploads criado: $upload_dir\n";
    } else {
        echo "Erro ao criar diretório de uploads: $upload_dir\n";
    }
} else {
    echo "Diretório de uploads já existe: $upload_dir\n";
}

echo "\nConfigurações do banco de dados:\n";
echo "Host: $host\n";
echo "Banco de dados: $db\n";
echo "Usuário: $user\n";
echo "Charset: $charset\n";

echo "\nConfigurações de upload:\n";
echo "Diretório de uploads: $upload_dir\n";
echo "Tamanho máximo de arquivo: " . ($upload_max_size / 1024 / 1024) . "MB\n";
echo "Tipos de arquivo permitidos: " . implode(', ', $upload_allowed_types) . "\n";

echo "\nSetup concluído!\n";
