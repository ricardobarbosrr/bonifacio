<?php
/**
 * Controlador de Anúncios
 * Gerencia todas as operações relacionadas a anúncios
 */

/**
 * Obtém todos os anúncios com paginação opcional
 * 
 * @param int $page Número da página
 * @param int $limit Limite de anúncios por página
 * @return array Anúncios paginados
 */
function getAllAnnouncements($page = 1, $limit = 10) {
    $jsonStorage = new JsonStorage();
    
    // Obter todos os anúncios
    $allAnnouncements = $jsonStorage->getAll('announcements');
    
    // Ordenar por data (mais recentes primeiro)
    usort($allAnnouncements, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    // Paginação manual
    $total = count($allAnnouncements);
    $offset = ($page - 1) * $limit;
    $pageCount = ceil($total / $limit);
    $paginatedAnnouncements = array_slice($allAnnouncements, $offset, $limit);
    
    // Adicionar informações do autor para cada anúncio
    foreach ($paginatedAnnouncements as &$announcement) {
        // Obter autor do anúncio
        $author = $jsonStorage->getById('users', $announcement['author_id']);
        
        if ($author) {
            $announcement['author_name'] = $author['display_name'];
            $announcement['author_photo'] = $author['photo_url'] ?? null;
        } else {
            $announcement['author_name'] = 'Usuário desconhecido';
            $announcement['author_photo'] = null;
        }
    }
    
    return [
        'data' => $paginatedAnnouncements,
        'total' => $total,
        'page' => (int)$page,
        'limit' => (int)$limit,
        'page_count' => $pageCount
    ];
}

/**
 * Obtém um anúncio específico pelo ID
 * 
 * @param string $announcementId ID do anúncio
 * @return array|null Anúncio encontrado ou null
 */
function getAnnouncementById($announcementId) {
    $jsonStorage = new JsonStorage();
    
    $announcement = $jsonStorage->getById('announcements', $announcementId);
    
    if (!$announcement) {
        return null;
    }
    
    // Adicionar informações do autor
    $author = $jsonStorage->getById('users', $announcement['author_id']);
    
    if ($author) {
        $announcement['author_name'] = $author['display_name'];
        $announcement['author_photo'] = $author['photo_url'] ?? null;
    } else {
        $announcement['author_name'] = 'Usuário desconhecido';
        $announcement['author_photo'] = null;
    }
    
    return $announcement;
}

/**
 * Cria um novo anúncio
 * 
 * @param array $data Dados do anúncio
 * @param array $user Dados do usuário autenticado
 * @return array Anúncio criado
 * @throws Exception Se houver erro
 */
function createAnnouncement($data, $user) {
    $jsonStorage = new JsonStorage();
    
    // Validar dados necessários
    if (empty($data['title']) || empty($data['content'])) {
        throw new Exception('Título e conteúdo são obrigatórios');
    }
    
    // Verificar permissão (apenas admin pode criar anúncio)
    if (!($user['is_admin'] ?? false)) {
        throw new Exception('Apenas administradores podem criar anúncios');
    }
    
    // Criar estrutura do novo anúncio
    $announcementId = generateUniqueId();
    $now = getCurrentTimestamp();
    
    $newAnnouncement = [
        'id' => $announcementId,
        'title' => $data['title'],
        'content' => $data['content'],
        'author_id' => $user['id'],
        'type' => $data['type'] ?? 'geral',
        'important' => $data['important'] ?? false,
        'image_url' => $data['image_url'] ?? null,
        'created_at' => $now,
        'updated_at' => null,
        'expires_at' => $data['expires_at'] ?? null
    ];
    
    // Salvar o anúncio
    if (!$jsonStorage->add('announcements', $newAnnouncement)) {
        throw new Exception('Erro ao criar anúncio');
    }
    
    // Adicionar informações do autor para retorno
    $newAnnouncement['author_name'] = $user['display_name'];
    $newAnnouncement['author_photo'] = $user['photo_url'] ?? null;
    
    return $newAnnouncement;
}

/**
 * Atualiza um anúncio existente
 * 
 * @param string $announcementId ID do anúncio
 * @param array $data Novos dados do anúncio
 * @param array $user Dados do usuário autenticado
 * @return array Anúncio atualizado
 * @throws Exception Se o usuário não tiver permissão ou o anúncio não existir
 */
function updateAnnouncement($announcementId, $data, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o anúncio
    $announcement = $jsonStorage->getById('announcements', $announcementId);
    
    if (!$announcement) {
        throw new Exception('Anúncio não encontrado');
    }
    
    // Verificar permissão (apenas autor ou admin podem editar)
    if ($announcement['author_id'] !== $user['id'] && !($user['is_admin'] ?? false)) {
        throw new Exception('Você não tem permissão para editar este anúncio');
    }
    
    // Validar dados necessários
    if (empty($data['title']) || empty($data['content'])) {
        throw new Exception('Título e conteúdo são obrigatórios');
    }
    
    // Atualizar dados do anúncio
    $announcement['title'] = $data['title'];
    $announcement['content'] = $data['content'];
    $announcement['type'] = $data['type'] ?? $announcement['type'] ?? 'geral';
    $announcement['important'] = $data['important'] ?? $announcement['important'] ?? false;
    $announcement['image_url'] = $data['image_url'] ?? $announcement['image_url'];
    $announcement['updated_at'] = getCurrentTimestamp();
    $announcement['expires_at'] = $data['expires_at'] ?? $announcement['expires_at'];
    
    // Salvar as alterações
    if (!$jsonStorage->update('announcements', $announcementId, $announcement)) {
        throw new Exception('Erro ao atualizar anúncio');
    }
    
    // Adicionar informações do autor para retorno
    $author = $jsonStorage->getById('users', $announcement['author_id']);
    
    if ($author) {
        $announcement['author_name'] = $author['display_name'];
        $announcement['author_photo'] = $author['photo_url'] ?? null;
    } else {
        $announcement['author_name'] = 'Usuário desconhecido';
        $announcement['author_photo'] = null;
    }
    
    return $announcement;
}

/**
 * Exclui um anúncio
 * 
 * @param string $announcementId ID do anúncio
 * @param array $user Dados do usuário autenticado
 * @return bool true se o anúncio foi excluído com sucesso
 * @throws Exception Se o usuário não tiver permissão ou o anúncio não existir
 */
function deleteAnnouncement($announcementId, $user) {
    $jsonStorage = new JsonStorage();
    
    // Buscar o anúncio
    $announcement = $jsonStorage->getById('announcements', $announcementId);
    
    if (!$announcement) {
        throw new Exception('Anúncio não encontrado');
    }
    
    // Verificar permissão (apenas autor ou admin podem excluir)
    if ($announcement['author_id'] !== $user['id'] && !($user['is_admin'] ?? false)) {
        throw new Exception('Você não tem permissão para excluir este anúncio');
    }
    
    // Excluir o anúncio
    return $jsonStorage->delete('announcements', $announcementId);
}
