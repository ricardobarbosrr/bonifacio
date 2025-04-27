<?php
/**
 * Controlador de Documentos
 * Gerencia todas as operações relacionadas a documentos
 */

/**
 * Obtém todos os documentos com paginação opcional
 * 
 * @param int $page Número da página
 * @param int $limit Limite por página
 * @return array Documentos e informações de paginação
 */
function getAllDocuments($page = 1, $limit = 20) {
    $jsonStorage = new JsonStorage();
    
    // Obter todos os documentos
    $allDocuments = $jsonStorage->getAll('documents');
    
    // Ordenar por data (mais recentes primeiro)
    usort($allDocuments, function($a, $b) {
        return strtotime($b['created_at'] ?? '0') - strtotime($a['created_at'] ?? '0');
    });
    
    // Paginação manual
    $total = count($allDocuments);
    $offset = ($page - 1) * $limit;
    $pageCount = ceil($total / $limit);
    $paginatedDocuments = array_slice($allDocuments, $offset, $limit);
    
    return [
        'data' => $paginatedDocuments,
        'total' => $total,
        'page' => (int)$page,
        'limit' => (int)$limit,
        'page_count' => $pageCount
    ];
}

/**
 * Obter um documento pelo ID
 * 
 * @param string $id ID do documento
 * @return array|null Documento ou null se não encontrado
 */
function getDocumentById($id) {
    $jsonStorage = new JsonStorage();
    return $jsonStorage->getById('documents', $id);
}

/**
 * Cria um novo documento
 * 
 * @param array $data Dados do documento
 * @param array $user Usuário que está criando o documento
 * @return array Documento criado
 * @throws Exception Em caso de erro
 */
function createDocument($data, $user) {
    $jsonStorage = new JsonStorage();
    
    // Validar dados obrigatórios
    if (empty($data['title']) || empty($data['content']) || empty($data['category'])) {
        throw new Exception('Título, conteúdo e categoria são obrigatórios');
    }
    
    $documentId = generateUniqueId();
    $now = getCurrentTimestamp();
    
    $newDocument = [
        'id' => $documentId,
        'title' => $data['title'],
        'content' => $data['content'],
        'category' => $data['category'],
        'file_url' => $data['file_url'] ?? null,
        'author_id' => $user['id'],
        'created_at' => $now,
        'updated_at' => null
    ];
    
    if (!$jsonStorage->add('documents', $newDocument)) {
        throw new Exception('Erro ao criar documento');
    }
    
    return $newDocument;
}

/**
 * Atualiza um documento existente
 * 
 * @param string $id ID do documento
 * @param array $data Novos dados do documento
 * @param array $user Usuário que está atualizando
 * @return array Documento atualizado
 * @throws Exception Em caso de erro ou falta de permissão
 */
function updateDocument($id, $data, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o documento
    $document = $jsonStorage->getById('documents', $id);
    
    if (!$document) {
        throw new Exception('Documento não encontrado');
    }
    
    // Verificar permissão (apenas autor ou admin podem editar)
    if ($document['author_id'] !== $user['id'] && !($user['is_admin'] ?? false)) {
        throw new Exception('Você não tem permissão para editar este documento');
    }
    
    // Validar dados obrigatórios
    if (empty($data['title']) || empty($data['content']) || empty($data['category'])) {
        throw new Exception('Título, conteúdo e categoria são obrigatórios');
    }
    
    // Atualizar dados
    $document['title'] = $data['title'];
    $document['content'] = $data['content'];
    $document['category'] = $data['category'];
    $document['file_url'] = $data['file_url'] ?? $document['file_url'];
    $document['updated_at'] = getCurrentTimestamp();
    
    // Salvar alterações
    if (!$jsonStorage->update('documents', $id, $document)) {
        throw new Exception('Erro ao atualizar documento');
    }
    
    return $document;
}

/**
 * Exclui um documento
 * 
 * @param string $id ID do documento
 * @param array $user Usuário que está excluindo
 * @return bool true se excluído com sucesso
 * @throws Exception Em caso de erro ou falta de permissão
 */
function deleteDocument($id, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o documento
    $document = $jsonStorage->getById('documents', $id);
    
    if (!$document) {
        throw new Exception('Documento não encontrado');
    }
    
    // Verificar permissão (apenas autor ou admin podem excluir)
    if ($document['author_id'] !== $user['id'] && !($user['is_admin'] ?? false)) {
        throw new Exception('Você não tem permissão para excluir este documento');
    }
    
    // Excluir o documento
    return $jsonStorage->delete('documents', $id);
}
