<?php
/**
 * Controlador de Membros Administrativos
 * Gerencia operações relacionadas aos membros da administração
 */

/**
 * Obtém todos os membros administrativos
 * 
 * @return array Lista de membros com cargo administrativo
 */
function getAllAdminMembers() {
    $jsonStorage = new JsonStorage();
    
    // Obter todos os usuários
    $allUsers = $jsonStorage->getAll('users');
    
    // Filtrar apenas administradores
    $adminUsers = array_filter($allUsers, function($user) {
        return isset($user['is_admin']) && $user['is_admin'] === true;
    });
    
    // Limpar dados sensíveis
    $adminMembers = [];
    foreach ($adminUsers as $admin) {
        $adminMembers[] = [
            'id' => $admin['id'],
            'display_name' => $admin['display_name'],
            'photo_url' => $admin['photo_url'] ?? null,
            'is_founder' => $admin['is_founder'] ?? false,
            'role' => $admin['role'] ?? 'Administrador',
            'description' => $admin['description'] ?? null
        ];
    }
    
    return $adminMembers;
}

/**
 * Atualiza as informações de um membro administrativo
 * 
 * @param string $id ID do membro
 * @param array $data Novos dados do membro
 * @param array $user Usuário autenticado fazendo a alteração
 * @return array Membro atualizado
 * @throws Exception Se houver erro ou falta de permissão
 */
function updateAdminMember($id, $data, $user) {
    // Apenas administrador pode atualizar membro administrativo
    if (!($user['is_admin'] ?? false)) {
        throw new Exception('Apenas administradores podem atualizar membros administrativos');
    }
    
    $jsonStorage = new JsonStorage();
    
    // Buscar o usuário
    $member = $jsonStorage->getById('users', $id);
    
    if (!$member) {
        throw new Exception('Membro não encontrado');
    }
    
    // Verificar se o membro é de fato um administrador
    if (!($member['is_admin'] ?? false)) {
        throw new Exception('Este usuário não é um administrador');
    }
    
    // Atualizar campos permitidos
    if (isset($data['display_name'])) {
        $member['display_name'] = $data['display_name'];
    }
    
    if (isset($data['photo_url'])) {
        $member['photo_url'] = $data['photo_url'];
    }
    
    if (isset($data['role'])) {
        $member['role'] = $data['role'];
    }
    
    if (isset($data['description'])) {
        $member['description'] = $data['description'];
    }
    
    // A flag is_founder só pode ser alterada por um fundador
    if (isset($data['is_founder']) && ($user['is_founder'] ?? false)) {
        $member['is_founder'] = $data['is_founder'];
    }
    
    // Salvar alterações
    if (!$jsonStorage->update('users', $id, $member)) {
        throw new Exception('Erro ao atualizar membro administrativo');
    }
    
    // Retornar versão limpa dos dados
    return [
        'id' => $member['id'],
        'display_name' => $member['display_name'],
        'photo_url' => $member['photo_url'] ?? null,
        'is_founder' => $member['is_founder'] ?? false,
        'role' => $member['role'] ?? 'Administrador',
        'description' => $member['description'] ?? null
    ];
}

/**
 * Adiciona um usuário existente como administrador
 * 
 * @param string $userId ID do usuário
 * @param array $user Usuário autenticado fazendo a alteração
 * @return array Membro administrativo criado
 * @throws Exception Se houver erro ou falta de permissão
 */
function addAdminMember($userId, $user) {
    // Apenas fundadores podem adicionar administradores
    if (!($user['is_founder'] ?? false)) {
        throw new Exception('Apenas fundadores podem adicionar novos administradores');
    }
    
    $jsonStorage = new JsonStorage();
    
    // Buscar o usuário
    $member = $jsonStorage->getById('users', $userId);
    
    if (!$member) {
        throw new Exception('Usuário não encontrado');
    }
    
    // Verificar se já é administrador
    if ($member['is_admin'] ?? false) {
        throw new Exception('Este usuário já é um administrador');
    }
    
    // Promover para administrador
    $member['is_admin'] = true;
    $member['role'] = 'Administrador';
    
    // Salvar alterações
    if (!$jsonStorage->update('users', $userId, $member)) {
        throw new Exception('Erro ao promover usuário para administrador');
    }
    
    // Retornar versão limpa dos dados
    return [
        'id' => $member['id'],
        'display_name' => $member['display_name'],
        'photo_url' => $member['photo_url'] ?? null,
        'is_founder' => false,
        'role' => 'Administrador',
        'description' => $member['description'] ?? null
    ];
}

/**
 * Remove um usuário da equipe administrativa
 * 
 * @param string $userId ID do usuário
 * @param array $user Usuário autenticado fazendo a alteração
 * @return bool true se removido com sucesso
 * @throws Exception Se houver erro ou falta de permissão
 */
function removeAdminMember($userId, $user) {
    // Apenas fundadores podem remover administradores
    if (!($user['is_founder'] ?? false)) {
        throw new Exception('Apenas fundadores podem remover administradores');
    }
    
    $jsonStorage = new JsonStorage();
    
    // Buscar o usuário
    $member = $jsonStorage->getById('users', $userId);
    
    if (!$member) {
        throw new Exception('Usuário não encontrado');
    }
    
    // Verificar se é administrador
    if (!($member['is_admin'] ?? false)) {
        throw new Exception('Este usuário não é um administrador');
    }
    
    // Verificar se é fundador (fundadores não podem ser removidos)
    if ($member['is_founder'] ?? false) {
        throw new Exception('Fundadores não podem ser removidos da administração');
    }
    
    // Remover status de administrador
    $member['is_admin'] = false;
    unset($member['role']);
    
    // Salvar alterações
    return $jsonStorage->update('users', $userId, $member);
}
