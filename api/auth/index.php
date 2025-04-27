<?php
/**
 * Handler para todas as requisições de autenticação
 */

// Configurar CORS para todas as requisições
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Tratamento especial para requisições OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Identificar o tipo de ação de autenticação a partir da URL
$requestUri = $_SERVER['REQUEST_URI'];
$action = 'login';

if (strpos($requestUri, 'verify') !== false) {
    $action = 'verify';
} else if (strpos($requestUri, 'register') !== false) {
    $action = 'register';
} else if (strpos($requestUri, 'logout') !== false) {
    $action = 'logout';
}

// Definir caminho para o roteador principal
$_SERVER['REQUEST_URI'] = '/auth/' . $action;

// Incluir arquivo principal da API
require_once __DIR__ . '/../index.php';
