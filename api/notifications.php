<?php
/**
 * Arquivo de compatibilidade para /api/notifications.php
 * Redireciona requisições para a nova estrutura da API
 */

// Incluir configuração global de CORS
require_once __DIR__ . '/cors.php';

// Tentar redirecionar para o endpoint correto
$included = @include_once __DIR__ . '/index.php';

// Em caso de erro, garantir uma resposta válida (tratamento de backup)
if (!$included || !headers_sent()) {
    // Se estamos aqui, é porque o script não foi capturado corretamente pela rota
    // Ler o arquivo de notificações e retorná-lo como resposta padrão
    $dataPath = __DIR__ . '/data/notifications.json';
    if (file_exists($dataPath)) {
        $notifications = json_decode(file_get_contents($dataPath), true);
        echo json_encode($notifications);
    } else {
        // Se o arquivo não existir, retornar um array vazio
        echo json_encode([]);
    }
}
