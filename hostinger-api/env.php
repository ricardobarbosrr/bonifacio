<?php
/**
 * Carrega as variáveis de ambiente do arquivo .env
 */
function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Ignora comentários
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Processa variáveis de ambiente
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            // Remove aspas se existirem
            if (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            } elseif (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            }
            
            // Remove comentários no final da linha
            if (strpos($value, ' #') !== false) {
                $value = trim(explode(' #', $value, 2)[0]);
            }
            
            // Define a variável de ambiente
            putenv("{$name}={$value}");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
    
    return true;
}

// Tenta carregar o arquivo .env
$rootPath = dirname(__DIR__);
$envFile = $rootPath . '/.env';

// Se não encontrar o .env na raiz, tenta no diretório atual
if (!file_exists($envFile)) {
    $envFile = __DIR__ . '/.env';
}

// Carrega as variáveis de ambiente
loadEnv($envFile);

/**
 * Função auxiliar para obter variáveis de ambiente
 */
function env($key, $default = null) {
    $value = getenv($key);
    
    if ($value === false) {
        return $default;
    }
    
    return $value;
}
