<?php
// Carregar dependências
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/src/controllers/articles.php';

// Obter o método HTTP
$method = $_SERVER['REQUEST_METHOD'];

// Verificar autenticação para todos os métodos exceto GET e OPTIONS
if ($method !== 'GET' && $method !== 'OPTIONS') {
    try {
        $auth = verifyAuthentication();
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => $e->getMessage()]);
        exit;
    }
}

switch ($method) {
    case 'GET':
        $path = $_SERVER['PATH_INFO'] ?? '';
        
        if ($path === '/search') {
            // Buscar artigos por título
            $query = "SELECT a.*, u.display_name as author_name, u.photo_url as author_photo 
                      FROM articles a 
                      JOIN users u ON a.author_id = u.uid 
                      WHERE title LIKE ? 
                      ORDER BY created_at DESC";
            
            $stmt = $pdo->prepare($query);
            $searchTerm = '%' . $_GET['q'] . '%';
            $stmt->execute([$searchTerm]);
            $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode($articles);
            break;
        }

        // Obter todos os artigos com paginação
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $offset = ($page - 1) * $limit;
        
        $categoryId = $_GET['category'] ?? null;
        $tag = $_GET['tag'] ?? null;
        
        $query = "SELECT a.*, u.display_name as author_name, u.photo_url as author_photo, 
                  (SELECT COUNT(*) FROM comments WHERE article_id = a.id) as comment_count, 
                  (SELECT COUNT(*) FROM likes WHERE article_id = a.id) as like_count 
                  FROM articles a 
                  JOIN users u ON a.author_id = u.uid 
                  WHERE 1=1 ";
        
        $params = [];
        if ($categoryId) {
            $query .= " AND category = ? ";
            $params[] = $categoryId;
        }
        if ($tag) {
            $query .= " AND JSON_CONTAINS(tags, '" . $tag . "') ";
        }
        
        // Contar total de registros
        $countQuery = "SELECT COUNT(*) FROM articles WHERE 1=1 " . 
                     (isset($categoryId) ? " AND category = ?" : "") . 
                     (isset($tag) ? " AND JSON_CONTAINS(tags, '" . $tag . "')" : "");
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();
        
        // Obter registros paginados
        $query .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'data' => $articles,
            'total' => $total,
            'page' => $page,
            'limit' => $limit
        ]);
        break;

    case 'POST':
        // Criar um novo artigo
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Dados inválidos']);
            exit;
        }

        // Verificar campos obrigatórios
        if (!isset($data['title']) || !isset($data['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Título e conteúdo são obrigatórios']);
            exit;
        }

        // Calcular tempo de leitura
        $content = $data['content'];
        $words = str_word_count(strip_tags($content));
        $readingTime = ceil($words / 200); // Considerando 200 palavras por minuto

        try {
            $stmt = $pdo->prepare("
                INSERT INTO articles (
                    id, title, content, author_id, image_url, category, 
                    tags, reading_time, excerpt, featured_image, 
                    cover_color, custom_font, created_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, 
                    ?, ?, ?, ?, 
                    ?, ?, NOW()
                )
            ");
            
            $success = $stmt->execute([
                uniqid(),
                $data['title'],
                $data['content'],
                $auth['uid'],
                $data['image_url'] ?? null,
                $data['category'] ?? null,
                json_encode($data['tags'] ?? []),
                $readingTime,
                $data['excerpt'] ?? null,
                $data['featured_image'] ?? null,
                $data['cover_color'] ?? '#ffffff',
                $data['custom_font'] ?? 'system-ui'
            ]);

            if ($success) {
                http_response_code(201);
                echo json_encode(['message' => 'Artigo criado com sucesso']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao criar artigo']);
            }
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao criar artigo: ' . $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Atualizar um artigo
        $articleId = $_GET['id'] ?? null;
        if (!$articleId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID do artigo é obrigatório']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $pdo->prepare("
            UPDATE articles SET
                title = ?,
                content = ?,
                image_url = ?,
                category = ?,
                tags = ?,
                reading_time = ?,
                excerpt = ?,
                featured_image = ?,
                cover_color = ?,
                custom_font = ?,
                updated_at = NOW()
            WHERE id = ? AND author_id = ?
        ");
        
        $success = $stmt->execute([
            $data['title'],
            $data['content'],
            $data['image_url'] ?? null,
            $data['category'] ?? null,
            json_encode($data['tags'] ?? []),
            $data['reading_time'] ?? 0,
            $data['excerpt'] ?? null,
            $data['featured_image'] ?? null,
            $data['cover_color'] ?? '#ffffff',
            $data['custom_font'] ?? 'system-ui',
            $articleId,
            $auth['uid']
        ]);
        
        if ($success) {
            echo json_encode(['message' => 'Artigo atualizado com sucesso']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Artigo não encontrado ou não autorizado']);
        }
        break;

    case 'DELETE':
        // Excluir um artigo
        $articleId = $_GET['id'] ?? null;
        if (!$articleId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID do artigo é obrigatório']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM articles WHERE id = ? AND author_id = ?");
        $success = $stmt->execute([$articleId, $auth['uid']]);
        
        if ($success) {
            echo json_encode(['message' => 'Artigo excluído com sucesso']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Artigo não encontrado ou não autorizado']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
}