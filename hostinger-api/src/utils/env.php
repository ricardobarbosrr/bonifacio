<?php
// Função para carregar variáveis de ambiente
function env($key, $default = null) {
    static $env = null;
    
    if ($env === null) {
        $envFile = __DIR__ . '/../../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            $env = [];
            
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                    list($name, $value) = explode('=', $line, 2);
                    $env[trim($name)] = trim($value);
                }
            }
        } else {
            $env = [];
        }
    }
    
    return $env[$key] ?? $default;
}
