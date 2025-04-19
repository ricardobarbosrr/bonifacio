<?php
header('Content-Type: application/json');
http_response_code(404);
echo json_encode([
    'error' => 'Endpoint não encontrado',
    'status' => 404,
    'message' => 'O recurso solicitado não existe na API.'
]);
?>
