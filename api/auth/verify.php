<?php
/**
 * Arquivo de compatibilidade para /api/auth/verify.php
 * Redireciona requisições para a nova estrutura da API
 */

// Configurar CORS para esta requisição específica
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Verificar se é uma requisição OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Definir tipo de requisição e caminho para o roteador
$_SERVER['REQUEST_URI'] = '/auth/verify';

// Manter o método original da requisição
// O frontend está usando GET para verificar o usuário

// Incluir o arquivo principal da API
require_once __DIR__ . '/../index.php';
