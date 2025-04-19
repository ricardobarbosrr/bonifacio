<?php
require_once 'config.php';

// Verificar autenticação (reutilizando a função do auth.php)
function getAuthenticatedUser() {
    global $pdo;
    
    $headers = getallheaders();
    $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
    
    if (!$token) {
        return null;
    }
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE auth_token = ?");
    $stmt->execute([$token]);
    return $stmt->fetch();
}

// Função para verificar se o usuário é admin
function isAdmin($user) {
    return $user && isset($user['is_admin']) && $user['is_admin'] == 1;
}

// Função para verificar se o usuário é fundador
function isFounder($user) {
    return $user && isset($user['is_founder']) && $user['is_founder'] == 1;
}

// Obter todos os anúncios
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        global $pdo;
        
        // Verificar se é para obter um anúncio específico
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            $stmt = $pdo->prepare("SELECT * FROM announcements WHERE id = ?");
            $stmt->execute([$id]);
            $announcement = $stmt->fetch();
            
            if (!$announcement) {
                http_response_code(404);
                echo json_encode(['error' => 'Anúncio não encontrado']);
                exit;
            }
            
            echo json_encode($announcement);
            exit;
        }
        
        // Obter todos os anúncios, ordenados por data de criação (mais recentes primeiro)
        $stmt = $pdo->prepare("SELECT * FROM announcements ORDER BY created_at DESC");
        $stmt->execute();
        $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Converter nomes de campos para camelCase para compatibilidade com o frontend
        $formattedAnnouncements = array_map(function($announcement) {
            return [
                'id' => $announcement['id'],
                'title' => $announcement['title'],
                'content' => $announcement['content'],
                'important' => (bool)$announcement['important'],
                'backgroundColor' => $announcement['background_color'],
                'textColor' => $announcement['text_color'],
                'createdAt' => $announcement['created_at'],
                'createdBy' => $announcement['created_by'],
                'readBy' => json_decode($announcement['read_by'] ?? '[]')
            ];
        }, $announcements);
        
        echo json_encode($formattedAnnouncements);
    } catch (PDOException $e) {
        error_log("Erro ao listar anúncios: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao listar anúncios']);
    }
    exit;
}

// Criar novo anúncio
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    if (!isAdmin($user)) {
        http_response_code(403);
        echo json_encode(['error' => 'Apenas administradores podem criar anúncios']);
        exit;
    }
    
    // Obter dados do corpo da requisição
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['title']) || !isset($data['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Título e conteúdo são obrigatórios']);
        exit;
    }
    
    try {
        global $pdo;
        
        // Gerar ID único para o anúncio
        $id = uniqid('annc_');
        
        // Definir valores padrão para campos opcionais
        $important = isset($data['important']) ? (int)$data['important'] : 0;
        
        // Verificar se o usuário está tentando criar um anúncio importante sem ser fundador
        if ($important && !isFounder($user)) {
            http_response_code(403);
            echo json_encode(['error' => 'Apenas fundadores podem criar anúncios importantes']);
            exit;
        }
        
        $backgroundColor = $data['backgroundColor'] ?? null;
        $textColor = $data['textColor'] ?? null;
        $createdAt = getCurrentTimestamp();
        $createdBy = $user['uid'];
        $readBy = '[]'; // Array vazio JSON
        
        $stmt = $pdo->prepare("
            INSERT INTO announcements (
                id, title, content, important, background_color, 
                text_color, created_at, created_by, read_by
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        ");
        
        $result = $stmt->execute([
            $id, $data['title'], $data['content'], $important, 
            $backgroundColor, $textColor, $createdAt, $createdBy, $readBy
        ]);
        
        if ($result) {
            // Retornar o anúncio criado
            echo json_encode([
                'id' => $id,
                'title' => $data['title'],
                'content' => $data['content'],
                'important' => (bool)$important,
                'backgroundColor' => $backgroundColor,
                'textColor' => $textColor,
                'createdAt' => $createdAt,
                'createdBy' => $createdBy,
                'readBy' => []
            ]);
        } else {
            throw new Exception("Falha ao inserir anúncio no banco de dados");
        }
    } catch (Exception $e) {
        error_log("Erro ao criar anúncio: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar anúncio']);
    }
    exit;
}

// Atualizar anúncio existente
if ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $user = getAuthenticatedUser();
    
    // Se for PATCH, estamos apenas marcando como lido
    $isMarkAsRead = $_SERVER['REQUEST_METHOD'] === 'PATCH';
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    // Se não for para marcar como lido, apenas admins podem editar
    if (!$isMarkAsRead && !isAdmin($user)) {
        http_response_code(403);
        echo json_encode(['error' => 'Apenas administradores podem editar anúncios']);
        exit;
    }
    
    // Obter dados do corpo da requisição
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID do anúncio é obrigatório']);
        exit;
    }
    
    try {
        global $pdo;
        
        // Verificar se o anúncio existe
        $stmt = $pdo->prepare("SELECT * FROM announcements WHERE id = ?");
        $stmt->execute([$data['id']]);
        $announcement = $stmt->fetch();
        
        if (!$announcement) {
            http_response_code(404);
            echo json_encode(['error' => 'Anúncio não encontrado']);
            exit;
        }
        
        if ($isMarkAsRead) {
            // Marcar anúncio como lido pelo usuário atual
            $readBy = json_decode($announcement['read_by'] ?? '[]', true);
            
            // Adicionar o ID do usuário se ainda não estiver na lista
            if (!in_array($user['uid'], $readBy)) {
                $readBy[] = $user['uid'];
            }
            
            $stmt = $pdo->prepare("UPDATE announcements SET read_by = ? WHERE id = ?");
            $result = $stmt->execute([json_encode($readBy), $data['id']]);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Anúncio marcado como lido'
                ]);
            } else {
                throw new Exception("Falha ao atualizar status de leitura");
            }
        } else {
            // Atualizar os campos enviados
            $fields = [];
            $params = [];
            
            if (isset($data['title'])) {
                $fields[] = "title = ?";
                $params[] = $data['title'];
            }
            
            if (isset($data['content'])) {
                $fields[] = "content = ?";
                $params[] = $data['content'];
            }
            
            if (isset($data['important'])) {
                // Verificar se o usuário está tentando marcar um anúncio como importante sem ser fundador
                if ((int)$data['important'] && !isFounder($user)) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Apenas fundadores podem marcar anúncios como importantes']);
                    exit;
                }
                $fields[] = "important = ?";
                $params[] = (int)$data['important'];
            }
            
            if (isset($data['backgroundColor'])) {
                $fields[] = "background_color = ?";
                $params[] = $data['backgroundColor'];
            }
            
            if (isset($data['textColor'])) {
                $fields[] = "text_color = ?";
                $params[] = $data['textColor'];
            }
            
            if (!empty($fields)) {
                $query = "UPDATE announcements SET " . implode(", ", $fields) . " WHERE id = ?";
                $params[] = $data['id'];
                
                $stmt = $pdo->prepare($query);
                $result = $stmt->execute($params);
                
                if ($result) {
                    // Obter o anúncio atualizado
                    $stmt = $pdo->prepare("SELECT * FROM announcements WHERE id = ?");
                    $stmt->execute([$data['id']]);
                    $updated = $stmt->fetch();
                    
                    echo json_encode([
                        'id' => $updated['id'],
                        'title' => $updated['title'],
                        'content' => $updated['content'],
                        'important' => (bool)$updated['important'],
                        'backgroundColor' => $updated['background_color'],
                        'textColor' => $updated['text_color'],
                        'createdAt' => $updated['created_at'],
                        'createdBy' => $updated['created_by'],
                        'readBy' => json_decode($updated['read_by'] ?? '[]')
                    ]);
                } else {
                    throw new Exception("Falha ao atualizar anúncio");
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Nenhum campo válido para atualização']);
            }
        }
    } catch (Exception $e) {
        error_log("Erro ao atualizar anúncio: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar anúncio']);
    }
    exit;
}

// Excluir anúncio
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    if (!isAdmin($user)) {
        http_response_code(403);
        echo json_encode(['error' => 'Apenas administradores podem excluir anúncios']);
        exit;
    }
    
    // Obter ID do anúncio da URL
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID do anúncio é obrigatório']);
        exit;
    }
    
    try {
        global $pdo;
        
        // Verificar se o anúncio existe
        $stmt = $pdo->prepare("SELECT * FROM announcements WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Anúncio não encontrado']);
            exit;
        }
        
        // Excluir o anúncio
        $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Anúncio excluído com sucesso'
            ]);
        } else {
            throw new Exception("Falha ao excluir anúncio");
        }
    } catch (Exception $e) {
        error_log("Erro ao excluir anúncio: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao excluir anúncio']);
    }
    exit;
}

// Método não permitido
http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
exit;
