<?php
// Carregar dependências
require_once __DIR__ . '/bootstrap.php';

// Verificar autenticação
try {
    $auth = verifyAuthentication();
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

// Obter todos os documentos
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['id']) && !isset($_GET['test'])) {
    $user = verifyAuthentication();
    
    error_log("[documents.php] Usuário autenticado: " . $user['display_name']);
    
    $stmt = $pdo->prepare("
        SELECT d.*, u.display_name as author_name 
        FROM documents d
        JOIN users u ON d.author_id = u.uid
        ORDER BY d.created_at DESC
    ");
    $stmt->execute();
    $documents = $stmt->fetchAll();
    
    echo json_encode($documents);
    exit;
}

// Endpoint de teste para verificar token
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['test'])) {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
    } else {
        echo json_encode([
            'success' => true,
            'token_valid' => true,
            'user' => [
                'uid' => $user['uid'],
                'displayName' => $user['display_name'],
                'isAdmin' => (bool)$user['is_admin']
            ]
        ]);
    }
    exit;
}

// Obter um documento específico
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    $documentId = $_GET['id'];
    
    $stmt = $pdo->prepare("
        SELECT d.*, u.display_name as author_name 
        FROM documents d
        JOIN users u ON d.author_id = u.uid
        WHERE d.id = ?
    ");
    $stmt->execute([$documentId]);
    $document = $stmt->fetch();
    
    if (!$document) {
        http_response_code(404);
        echo json_encode(['error' => 'Documento não encontrado']);
        exit;
    }
    
    echo json_encode($document);
    exit;
}

// Adicionar novo documento
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    // Verificar se o usuário é admin ou tem permissão para adicionar documentos
    if ($user['is_admin'] != 1) {
        http_response_code(403);
        echo json_encode(['error' => 'Permissão negada']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['title']) || !isset($data['content']) || !isset($data['category'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados incompletos']);
        exit;
    }
    
    $id = generateId();
    $title = $data['title'];
    $content = $data['content'];
    $category = $data['category'];
    $url = isset($data['url']) ? $data['url'] : null;
    $authorId = $user['uid'];
    $createdAt = date('Y-m-d H:i:s');
    
    $stmt = $pdo->prepare("
        INSERT INTO documents (id, title, content, category, url, author_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$id, $title, $content, $category, $url, $authorId, $createdAt]);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $id,
            'title' => $title,
            'content' => $content,
            'category' => $category,
            'url' => $url,
            'author_id' => $authorId,
            'author_name' => $user['display_name'],
            'created_at' => $createdAt
        ]
    ]);
    exit;
}

// Atualizar documento existente
if ($_SERVER['REQUEST_METHOD'] === 'PUT' && isset($_GET['id'])) {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    $documentId = $_GET['id'];
    
    // Verificar se o documento existe e se o usuário tem permissão para editá-lo
    $stmt = $pdo->prepare("SELECT * FROM documents WHERE id = ?");
    $stmt->execute([$documentId]);
    $document = $stmt->fetch();
    
    if (!$document) {
        http_response_code(404);
        echo json_encode(['error' => 'Documento não encontrado']);
        exit;
    }
    
    // Apenas o autor ou administradores podem editar
    if ($document['author_id'] !== $user['uid'] && $user['is_admin'] != 1) {
        http_response_code(403);
        echo json_encode(['error' => 'Permissão negada']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Preparar os campos para atualização
    $updateFields = [];
    $params = [];
    
    if (isset($data['title'])) {
        $updateFields[] = "title = ?";
        $params[] = $data['title'];
    }
    
    if (isset($data['content'])) {
        $updateFields[] = "content = ?";
        $params[] = $data['content'];
    }
    
    if (isset($data['category'])) {
        $updateFields[] = "category = ?";
        $params[] = $data['category'];
    }
    
    if (isset($data['url'])) {
        $updateFields[] = "url = ?";
        $params[] = $data['url'];
    }
    
    if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nenhum campo para atualizar']);
        exit;
    }
    
    // Adicionar o ID do documento ao final dos parâmetros
    $params[] = $documentId;
    
    $stmt = $pdo->prepare("
        UPDATE documents 
        SET " . implode(", ", $updateFields) . " 
        WHERE id = ?
    ");
    $stmt->execute($params);
    
    // Obter o documento atualizado
    $stmt = $pdo->prepare("
        SELECT d.*, u.display_name as author_name 
        FROM documents d
        JOIN users u ON d.author_id = u.uid
        WHERE d.id = ?
    ");
    $stmt->execute([$documentId]);
    $updatedDocument = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'data' => $updatedDocument
    ]);
    exit;
}

// Excluir documento
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['id'])) {
    $user = getAuthenticatedUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }
    
    $documentId = $_GET['id'];
    
    // Verificar se o documento existe e se o usuário tem permissão para excluí-lo
    $stmt = $pdo->prepare("SELECT * FROM documents WHERE id = ?");
    $stmt->execute([$documentId]);
    $document = $stmt->fetch();
    
    if (!$document) {
        http_response_code(404);
        echo json_encode(['error' => 'Documento não encontrado']);
        exit;
    }
    
    // Apenas o autor ou administradores podem excluir
    if ($document['author_id'] !== $user['uid'] && $user['is_admin'] != 1) {
        http_response_code(403);
        echo json_encode(['error' => 'Permissão negada']);
        exit;
    }
    
    $stmt = $pdo->prepare("DELETE FROM documents WHERE id = ?");
    $stmt->execute([$documentId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Documento excluído com sucesso'
    ]);
    exit;
}

// Método não suportado
http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
