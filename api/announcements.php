<?php
/**
 * Arquivo de compatibilidade para /api/announcements.php
 * Redireciona requisições para a nova estrutura da API
 */

// Incluir configuração global de CORS
require_once __DIR__ . '/cors.php';

// Tentar redirecionar para o endpoint correto
$included = @include_once __DIR__ . '/index.php';

// Em caso de erro, garantir uma resposta válida (tratamento de backup)
if (!$included || !headers_sent()) {
    // Se estamos aqui, é porque o script não foi capturado corretamente pela rota
    // Ler o arquivo de anúncios e retorná-lo como resposta padrão
    $dataPath = __DIR__ . '/data/announcements.json';
    if (file_exists($dataPath)) {
        $announcements = json_decode(file_get_contents($dataPath), true);
        echo json_encode($announcements);
    } else {
        // Se o arquivo não existir, retornar um array vazio
        echo json_encode([]);
    }
}

// Em caso de erro, garantir uma resposta válida (tratamento de backup)
if (!headers_sent()) {
    // Se estamos aqui, é porque o script não foi capturado corretamente pela rota
    $result = getAllAnnouncements();
    // Retornar apenas o array de dados, sem a estrutura de paginação
    echo json_encode($result['data']);
}
