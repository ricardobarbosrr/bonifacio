<?php
/**
 * Arquivo de compatibilidade para /api/admin-members.php
 * Redireciona requisições para a nova estrutura da API
 */

// Incluir configuração global de CORS
require_once __DIR__ . '/cors.php';

// Tentar redirecionar para o endpoint correto
$included = @include_once __DIR__ . '/index.php';

// Em caso de erro, garantir uma resposta válida (tratamento de backup)
if (!$included || !headers_sent()) {
    // Se estamos aqui, é porque o script não foi capturado corretamente pela rota
    // Retornar um array de membros vazio como resposta padrão
    echo json_encode([
        'data' => [],
        'meta' => [
            'total' => 0,
            'page' => 1,
            'limit' => 10
        ]
    ]);
}

// Em caso de erro, garantir uma resposta válida (tratamento de backup)
if (!headers_sent()) {
    // Se estamos aqui, é porque o script não foi capturado corretamente pela rota
    $result = getAllAdminMembers();
    // Retornar apenas o array de dados, sem a estrutura de paginação
    echo json_encode($result['data']);
}
