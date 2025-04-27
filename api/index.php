<?php
/**
 * Ponto de entrada principal da API
 * Roteador e configurações globais
 */

// Configurar CORS para todas as requisições
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Tratamento especial para requisições OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Redirecionar diretamente para direct.php se for uma requisição para este endpoint
if (strpos($_SERVER['REQUEST_URI'], '/api/direct.php') !== false) {
    include_once __DIR__ . '/direct.php';
    exit;
}

// Carregar configurações e bibliotecas
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/src/middleware/auth.php';
require_once __DIR__ . '/src/controllers/posts.php';
require_once __DIR__ . '/src/controllers/comments.php';
require_once __DIR__ . '/src/controllers/documents.php';
require_once __DIR__ . '/src/controllers/admin-members.php';
require_once __DIR__ . '/src/controllers/articles.php';
require_once __DIR__ . '/src/controllers/announcements.php';

// Detectar o modo de funcionamento (CLI ou API)
if ($is_cli) {
    echo "API Bonifacio - Modo CLI\n";
    exit;
}

// Obter o caminho da URL e método
$path = strtok($_SERVER['REQUEST_URI'], '?');
$method = $_SERVER['REQUEST_METHOD'];

// Remover o prefixo da base da URL se existir
$basePath = '/api';
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}

// Remover a extensão .php se existir
if (preg_match('/(.+)\.php$/', $path, $matches)) {
    $path = $matches[1];
}

// Garantir que a rota começa com /
if (empty($path) || $path[0] !== '/') {
    $path = '/' . $path;
}

// Roteamento básico
try {
    // Rotas para autenticação
    if (preg_match('/^\/auth\/(.*)$/', $path, $matches)) {
        $action = $matches[1] ?? '';
        
        // Tratar verificação de token via GET
        if ($method === 'GET' && $action === 'verify') {
            try {
                $user = verifyAuthentication();
                jsonResponse($user);
            } catch (Exception $e) {
                jsonResponse(['error' => $e->getMessage()], 401);
            }
        }
        
        switch ($method) {
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if (!$data) {
                    jsonResponse(['error' => 'Dados inválidos'], 400);
                }
                
                if ($action === 'login') {
                    // Login de usuário
                    if (!isset($data['email']) || !isset($data['password'])) {
                        jsonResponse(['error' => 'Email e senha são obrigatórios'], 400);
                    }
                    
                    $result = loginUser($data['email'], $data['password']);
                    jsonResponse($result);
                } 
                else if ($action === 'register') {
                    // Registro de novo usuário
                    if (!isset($data['email']) || !isset($data['password']) || !isset($data['displayName'])) {
                        jsonResponse(['error' => 'Email, senha e nome são obrigatórios'], 400);
                    }
                    
                    $result = registerUser(
                        $data['email'], 
                        $data['password'], 
                        $data['displayName'], 
                        $data['photoUrl'] ?? null
                    );
                    
                    jsonResponse($result, 201);
                } 
                else if ($action === 'verify') {
                    // Verificar token
                    try {
                        $user = verifyAuthentication();
                        jsonResponse($user);
                    } catch (Exception $e) {
                        jsonResponse(['error' => $e->getMessage()], 401);
                    }
                }
                else if ($action === 'logout') {
                    // Logout do usuário
                    try {
                        $user = verifyAuthentication();
                        $result = logoutUser($user['id']);
                        jsonResponse(['success' => $result, 'message' => 'Logout realizado com sucesso']);
                    } catch (Exception $e) {
                        jsonResponse(['error' => $e->getMessage()], 401);
                    }
                }
                else {
                    jsonResponse(['error' => 'Ação não reconhecida'], 400);
                }
                break;
                
            default:
                jsonResponse(['error' => 'Método não permitido'], 405);
        }
    }
    
    // Rotas para posts
    else if (preg_match('/^\/posts\/?(.*)$/', $path, $matches)) {
        $postPath = $matches[1] ?? '';
        $postId = null;
        $action = null;
        
        if (preg_match('/^([a-zA-Z0-9]+)\/(.+)$/', $postPath, $pathParts)) {
            $postId = $pathParts[1];
            $action = $pathParts[2];
        } else if (!empty($postPath)) {
            $postId = $postPath;
        }
        
        switch ($method) {
            case 'GET':
                if ($postId) {
                    // Obter um post específico
                    $post = getPostById($postId);
                    
                    if ($post) {
                        jsonResponse($post);
                    } else {
                        jsonResponse(['error' => 'Post não encontrado'], 404);
                    }
                } else {
                    // Listar todos os posts com paginação
                    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
                    
                    $result = getAllPosts($page, $limit);
                    jsonResponse($result);
                }
                break;
                
            case 'POST':
                // Criar um novo post (requer autenticação)
                try {
                    $user = verifyAuthentication();
                    $data = json_decode(file_get_contents('php://input'), true);
                    
                    if (!$data) {
                        jsonResponse(['error' => 'Dados inválidos'], 400);
                    }
                    
                    $post = createPost($data, $user);
                    jsonResponse($post, 201);
                } catch (Exception $e) {
                    jsonResponse(['error' => $e->getMessage()], 401);
                }
                break;
                
            case 'PUT':
                // Atualizar um post ou realizar ação específica
                try {
                    $user = verifyAuthentication();
                    
                    if (!$postId) {
                        jsonResponse(['error' => 'ID do post é obrigatório'], 400);
                    }
                    
                    // Verificar se é uma ação específica
                    if ($action === 'like') {
                        $result = togglePostLike($postId, $user);
                        jsonResponse($result);
                    } else {
                        // Atualização padrão do post
                        $data = json_decode(file_get_contents('php://input'), true);
                        
                        if (!$data) {
                            jsonResponse(['error' => 'Dados inválidos'], 400);
                        }
                        
                        $updatedPost = updatePost($postId, $data, $user);
                        jsonResponse($updatedPost);
                    }
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            case 'DELETE':
                // Excluir um post
                try {
                    $user = verifyAuthentication();
                    
                    if (!$postId) {
                        jsonResponse(['error' => 'ID do post é obrigatório'], 400);
                    }
                    
                    $success = deletePost($postId, $user);
                    
                    if ($success) {
                        jsonResponse(['message' => 'Post excluído com sucesso']);
                    } else {
                        jsonResponse(['error' => 'Erro ao excluir post'], 500);
                    }
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            default:
                jsonResponse(['error' => 'Método não permitido'], 405);
        }
    }
    
    // Rotas para comentários
    else if (preg_match('/^\/comments\/?(.*)$/', $path, $matches)) {
        $commentPath = $matches[1] ?? '';
        $commentId = null;
        
        if (!empty($commentPath)) {
            $commentId = $commentPath;
        }
        
        switch ($method) {
            case 'GET':
                // Listar comentários de um post específico
                if (isset($_GET['post_id'])) {
                    $comments = getCommentsByPostId($_GET['post_id']);
                    jsonResponse($comments);
                } else {
                    jsonResponse(['error' => 'ID do post é obrigatório'], 400);
                }
                break;
                
            case 'POST':
                // Adicionar um novo comentário (requer autenticação)
                try {
                    $user = verifyAuthentication();
                    $data = json_decode(file_get_contents('php://input'), true);
                    
                    if (!$data) {
                        jsonResponse(['error' => 'Dados inválidos'], 400);
                    }
                    
                    $comment = addComment($data, $user);
                    jsonResponse($comment, 201);
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'obrigatórios') !== false || 
                        strpos($e->getMessage(), 'inválidos') !== false) {
                        $statusCode = 400;
                    } else if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            case 'PUT':
                // Atualizar um comentário
                try {
                    $user = verifyAuthentication();
                    
                    if (!$commentId) {
                        jsonResponse(['error' => 'ID do comentário é obrigatório'], 400);
                    }
                    
                    $data = json_decode(file_get_contents('php://input'), true);
                    
                    if (!$data) {
                        jsonResponse(['error' => 'Dados inválidos'], 400);
                    }
                    
                    $updatedComment = updateComment($commentId, $data, $user);
                    jsonResponse($updatedComment);
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            case 'DELETE':
                // Excluir um comentário
                try {
                    $user = verifyAuthentication();
                    
                    if (!$commentId) {
                        jsonResponse(['error' => 'ID do comentário é obrigatório'], 400);
                    }
                    
                    $success = deleteComment($commentId, $user);
                    
                    if ($success) {
                        jsonResponse(['message' => 'Comentário excluído com sucesso']);
                    } else {
                        jsonResponse(['error' => 'Erro ao excluir comentário'], 500);
                    }
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            default:
                jsonResponse(['error' => 'Método não permitido'], 405);
        }
    }
    
    // Rotas para documentos
    else if (preg_match('/^\/documents\/?(.*)$/', $path, $matches)) {
        $documentPath = $matches[1] ?? '';
        $documentId = null;
        
        if (!empty($documentPath)) {
            $documentId = $documentPath;
        }
        
        switch ($method) {
            case 'GET':
                if ($documentId) {
                    // Obter um documento específico
                    $document = getDocumentById($documentId);
                    
                    if ($document) {
                        jsonResponse($document);
                    } else {
                        jsonResponse(['error' => 'Documento não encontrado'], 404);
                    }
                } else {
                    // Listar todos os documentos com paginação
                    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
                    
                    $result = getAllDocuments($page, $limit);
                    jsonResponse($result);
                }
                break;
                
            case 'POST':
                // Criar um novo documento (requer autenticação)
                try {
                    $user = verifyAuthentication();
                    $data = json_decode(file_get_contents('php://input'), true);
                    
                    if (!$data) {
                        jsonResponse(['error' => 'Dados inválidos'], 400);
                    }
                    
                    $document = createDocument($data, $user);
                    jsonResponse($document, 201);
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'obrigatórios') !== false) {
                        $statusCode = 400;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            case 'PUT':
                // Atualizar um documento
                try {
                    $user = verifyAuthentication();
                    
                    if (!$documentId) {
                        jsonResponse(['error' => 'ID do documento é obrigatório'], 400);
                    }
                    
                    $data = json_decode(file_get_contents('php://input'), true);
                    
                    if (!$data) {
                        jsonResponse(['error' => 'Dados inválidos'], 400);
                    }
                    
                    $updatedDocument = updateDocument($documentId, $data, $user);
                    jsonResponse($updatedDocument);
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            case 'DELETE':
                // Excluir um documento
                try {
                    $user = verifyAuthentication();
                    
                    if (!$documentId) {
                        jsonResponse(['error' => 'ID do documento é obrigatório'], 400);
                    }
                    
                    $success = deleteDocument($documentId, $user);
                    
                    if ($success) {
                        jsonResponse(['message' => 'Documento excluído com sucesso']);
                    } else {
                        jsonResponse(['error' => 'Erro ao excluir documento'], 500);
                    }
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            default:
                jsonResponse(['error' => 'Método não permitido'], 405);
        }
    }
    
    // Rotas para membros administrativos
    else if (preg_match('/^\/admin-members\/?(.*)$/', $path, $matches)) {
        $memberPath = $matches[1] ?? '';
        $memberId = null;
        
        if (!empty($memberPath)) {
            $memberId = $memberPath;
        }
        
        switch ($method) {
            case 'GET':
                // Listar todos os membros administrativos
                $members = getAllAdminMembers();
                jsonResponse($members);
                break;
                
            case 'POST':
                // Adicionar um novo membro administrativo
                try {
                    $user = verifyAuthentication();
                    $data = json_decode(file_get_contents('php://input'), true);
                    
                    if (!$data || !isset($data['user_id'])) {
                        jsonResponse(['error' => 'ID do usuário é obrigatório'], 400);
                    }
                    
                    $member = addAdminMember($data['user_id'], $user);
                    jsonResponse($member, 201);
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            case 'PUT':
                // Atualizar membro administrativo
                try {
                    $user = verifyAuthentication();
                    
                    if (!$memberId) {
                        jsonResponse(['error' => 'ID do membro é obrigatório'], 400);
                    }
                    
                    $data = json_decode(file_get_contents('php://input'), true);
                    
                    if (!$data) {
                        jsonResponse(['error' => 'Dados inválidos'], 400);
                    }
                    
                    $updatedMember = updateAdminMember($memberId, $data, $user);
                    jsonResponse($updatedMember);
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            case 'DELETE':
                // Remover membro administrativo
                try {
                    $user = verifyAuthentication();
                    
                    if (!$memberId) {
                        jsonResponse(['error' => 'ID do membro é obrigatório'], 400);
                    }
                    
                    $success = removeAdminMember($memberId, $user);
                    
                    if ($success) {
                        jsonResponse(['message' => 'Membro removido da administração com sucesso']);
                    } else {
                        jsonResponse(['error' => 'Erro ao remover membro da administração'], 500);
                    }
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            default:
                jsonResponse(['error' => 'Método não permitido'], 405);
        }
    }
    
    // Rotas para artigos
    else if (preg_match('/^\/articles\/?(.*)$/', $path, $matches)) {
        $articlePath = $matches[1] ?? '';
        $articleId = null;
        $action = null;
        
        if (preg_match('/^([a-zA-Z0-9]+)\/(.+)$/', $articlePath, $pathParts)) {
            $articleId = $pathParts[1];
            $action = $pathParts[2];
        } else if (!empty($articlePath)) {
            $articleId = $articlePath;
        }
        
        switch ($method) {
            case 'GET':
                if ($articleId) {
                    // Obter um artigo específico
                    $article = getArticleById($articleId);
                    
                    if ($article) {
                        jsonResponse($article);
                    } else {
                        jsonResponse(['error' => 'Artigo não encontrado'], 404);
                    }
                } else {
                    // Listar todos os artigos com paginação e filtros opcionais
                    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
                    $category = isset($_GET['category']) ? $_GET['category'] : null;
                    $tag = isset($_GET['tag']) ? $_GET['tag'] : null;
                    
                    $result = getAllArticles($page, $limit, $category, $tag);
                    jsonResponse($result);
                }
                break;
                
            case 'POST':
                // Criar um novo artigo (requer autenticação de admin)
                try {
                    $user = verifyAuthentication();
                    $data = json_decode(file_get_contents('php://input'), true);
                    
                    if (!$data) {
                        jsonResponse(['error' => 'Dados inválidos'], 400);
                    }
                    
                    $article = createArticle($data, $user);
                    jsonResponse($article, 201);
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'obrigatórios') !== false) {
                        $statusCode = 400;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            case 'PUT':
                try {
                    $user = verifyAuthentication();
                    
                    if (!$articleId) {
                        jsonResponse(['error' => 'ID do artigo é obrigatório'], 400);
                    }
                    
                    // Verificar se é uma ação específica
                    if ($action === 'like') {
                        $result = toggleArticleLike($articleId, $user);
                        jsonResponse($result);
                    } else {
                        // Atualização padrão do artigo
                        $data = json_decode(file_get_contents('php://input'), true);
                        
                        if (!$data) {
                            jsonResponse(['error' => 'Dados inválidos'], 400);
                        }
                        
                        $updatedArticle = updateArticle($articleId, $data, $user);
                        jsonResponse($updatedArticle);
                    }
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            case 'DELETE':
                // Excluir um artigo
                try {
                    $user = verifyAuthentication();
                    
                    if (!$articleId) {
                        jsonResponse(['error' => 'ID do artigo é obrigatório'], 400);
                    }
                    
                    $success = deleteArticle($articleId, $user);
                    
                    if ($success) {
                        jsonResponse(['message' => 'Artigo excluído com sucesso']);
                    } else {
                        jsonResponse(['error' => 'Erro ao excluir artigo'], 500);
                    }
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            default:
                jsonResponse(['error' => 'Método não permitido'], 405);
        }
    }
    
    // Rotas para anúncios
    else if (preg_match('/^\/announcements\/?(.*)$/', $path, $matches)) {
        $announcementPath = $matches[1] ?? '';
        $announcementId = null;
        
        if (!empty($announcementPath)) {
            $announcementId = $announcementPath;
        }
        
        switch ($method) {
            case 'GET':
                if ($announcementId) {
                    // Obter um anúncio específico
                    $announcement = getAnnouncementById($announcementId);
                    
                    if ($announcement) {
                        jsonResponse($announcement);
                    } else {
                        jsonResponse(['error' => 'Anúncio não encontrado'], 404);
                    }
                } else {
                    // Listar todos os anúncios com paginação
                    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
                    
                    $result = getAllAnnouncements($page, $limit);
                    jsonResponse($result);
                }
                break;
                
            case 'POST':
                // Criar um novo anúncio (requer autenticação de admin)
                try {
                    $user = verifyAuthentication();
                    $data = json_decode(file_get_contents('php://input'), true);
                    
                    if (!$data) {
                        jsonResponse(['error' => 'Dados inválidos'], 400);
                    }
                    
                    $announcement = createAnnouncement($data, $user);
                    jsonResponse($announcement, 201);
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'obrigatórios') !== false) {
                        $statusCode = 400;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            case 'PUT':
                // Atualizar um anúncio
                try {
                    $user = verifyAuthentication();
                    
                    if (!$announcementId) {
                        jsonResponse(['error' => 'ID do anúncio é obrigatório'], 400);
                    }
                    
                    $data = json_decode(file_get_contents('php://input'), true);
                    
                    if (!$data) {
                        jsonResponse(['error' => 'Dados inválidos'], 400);
                    }
                    
                    $updatedAnnouncement = updateAnnouncement($announcementId, $data, $user);
                    jsonResponse($updatedAnnouncement);
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            case 'DELETE':
                // Excluir um anúncio
                try {
                    $user = verifyAuthentication();
                    
                    if (!$announcementId) {
                        jsonResponse(['error' => 'ID do anúncio é obrigatório'], 400);
                    }
                    
                    $success = deleteAnnouncement($announcementId, $user);
                    
                    if ($success) {
                        jsonResponse(['message' => 'Anúncio excluído com sucesso']);
                    } else {
                        jsonResponse(['error' => 'Erro ao excluir anúncio'], 500);
                    }
                } catch (Exception $e) {
                    $statusCode = 401;
                    
                    if (strpos($e->getMessage(), 'não encontrado') !== false) {
                        $statusCode = 404;
                    } else if (strpos($e->getMessage(), 'permissão') !== false) {
                        $statusCode = 403;
                    }
                    
                    jsonResponse(['error' => $e->getMessage()], $statusCode);
                }
                break;
                
            default:
                jsonResponse(['error' => 'Método não permitido'], 405);
        }
    }
    
    // Rota de status da API
    else if ($path === '/status') {
        jsonResponse([
            'status' => 'online',
            'version' => '1.0.0',
            'storage' => 'json',
            'timestamp' => getCurrentTimestamp()
        ]);
    } 
    
    // Rota padrão (não encontrada)
    else {
        jsonResponse([
            'error' => 'Rota não encontrada',
            'path' => $path,
            'method' => $method
        ], 404);
    }
} catch (Exception $e) {
    // Erro global
    error_log("Erro na API: " . $e->getMessage());
    jsonResponse([
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ], 500);
}
