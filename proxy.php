<?php
/**
 * CORS Proxy para acessar dados JSON da API
 * Este arquivo deve ficar na raiz do projeto, separado do backend
 */

// Permitir CORS para o frontend
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Lidar com preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Verificar se um arquivo foi solicitado
$file = isset($_GET['file']) ? $_GET['file'] : null;

// Lista de arquivos permitidos
$allowedFiles = [
    'announcements',
    'posts',
    'users',
    'comments',
    'documents',
    'admin-members',
    'notifications',
    'articles',
    'likes'
];

// Verificar se o arquivo solicitado é permitido
if (!$file || !in_array($file, $allowedFiles)) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo não especificado ou não permitido']);
    exit;
}

// Caminho para o arquivo JSON solicitado
$jsonFile = __DIR__ . '/api/data/' . $file . '.json';

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
