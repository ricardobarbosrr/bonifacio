<?php
/**
 * Endpoint direto para acessar arquivos JSON com CORS apropriado
 * Este é um arquivo independente que não depende de nenhum outro arquivo
 */

// Permitir CORS de forma ampla
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Lidar com requisições OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Verificar se um arquivo foi solicitado
$file = isset($_GET['file']) ? $_GET['file'] : null;

// Lista de arquivos permitidos (apenas arquivos JSON)
$allowedFiles = [
    'announcements',
    'posts',
    'users',
    'comments',
    'documents',
    'admin-members',
    'notifications'
];

// Verificar se o arquivo solicitado é permitido
if (!$file || !in_array($file, $allowedFiles)) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo não especificado ou não permitido']);
    exit;
}

// Caminho para o arquivo JSON solicitado
$jsonFile = __DIR__ . '/data/' . $file . '.json';

// Verificar se o arquivo existe
if (!file_exists($jsonFile)) {
    // Se não existe, retornar um array vazio
    echo json_encode([]);
    exit;
}

// Ler e retornar o conteúdo do arquivo
$content = file_get_contents($jsonFile);

// Verificar se o conteúdo é um JSON válido
$data = json_decode($content);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao processar arquivo JSON']);
    exit;
}

// Retornar o conteúdo como está
echo $content;
