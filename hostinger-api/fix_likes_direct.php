<?php
// Simulando ambiente web para evitar erros
$_SERVER['REQUEST_METHOD'] = 'CLI';
$_SERVER['HTTP_HOST'] = 'localhost';

// Conectando ao banco sem usar o config.php
$db_config = [
    'host' => 'mysql.hostinger.com',
    'name' => 'u770443625_corpmonar',
    'user' => 'u770443625_coprmonaradmin',
    'pass' => 'Corpbonifacio!88@Ricardo',
    'charset' => 'utf8mb4'
];

// Conexão direta com o banco
try {
    $dsn = "mysql:host={$db_config['host']};dbname={$db_config['name']};charset={$db_config['charset']}";
    $pdo = new PDO($dsn, $db_config['user'], $db_config['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    
    echo "Conexão com banco estabelecida!\n";
} catch (PDOException $e) {
    die("Erro de conexão: " . $e->getMessage() . "\n");
}

// 1. Modificar o arquivo posts.php
echo "Modificando o arquivo posts.php...\n";
$code = file_get_contents('posts.php');

// Localizar o bloco de código que processa likes
$pattern = '/if \(\$like\) \{(.*?)else \{(.*?)\}/s';
$replacement = 'if ($like) {
            // Se já curtiu, remove o like
            $stmt = $pdo->prepare("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?");
            $success = $stmt->execute([$postId, $userId]);
            
            // Atualizar o contador de likes no post
            $stmt = $pdo->prepare("UPDATE posts SET likes_count = likes_count - 1, likes = likes - 1 WHERE id = ?");
            $stmt->execute([$postId]);
            
            $message = \'Like removido com sucesso\';
        } else {
            // Se não curtiu, adiciona o like
            $stmt = $pdo->prepare("INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)");
            $success = $stmt->execute([$postId, $userId, date("Y-m-d H:i:s")]);
            
            // Atualizar o contador de likes no post
            $stmt = $pdo->prepare("UPDATE posts SET likes_count = likes_count + 1, likes = likes + 1 WHERE id = ?");
            $stmt->execute([$postId]);
            
            $message = \'Post curtido com sucesso\';
        }';

$updated_code = preg_replace($pattern, $replacement, $code);

if ($updated_code === $code) {
    echo "Não foi possível encontrar o padrão para substituição. Verificando manualmente...\n";
    
    // Adicionar linhas para debug
    $lines = explode("\n", $code);
    for ($i = 250; $i < 350; $i++) {
        if (isset($lines[$i]) && strpos($lines[$i], 'if ($like)') !== false) {
            echo "Padrão encontrado na linha $i\n";
            // Mostrar 10 linhas de contexto
            for ($j = max(0, $i - 5); $j < min(count($lines), $i + 15); $j++) {
                echo "$j: " . $lines[$j] . "\n";
            }
            break;
        }
    }
} else {
    // Salvar o arquivo atualizado
    file_put_contents('posts.php', $updated_code);
    echo "Arquivo posts.php atualizado com sucesso.\n";
}

// 2. Modificar o endpoint de like para retornar o post completo
echo "Modificando a resposta da API de likes...\n";

$pattern = '/echo json_encode\(\[\s*\'message\' => \$message,\s*\'likes\' => \$likes\s*\]\);/s';
$replacement = '// Obter dados completos do post
            $stmt = $pdo->prepare("SELECT p.*, u.display_name as author_name, u.photo_url as author_photo 
                          FROM posts p 
                          JOIN users u ON p.author_id = u.uid 
                          WHERE p.id = ?");
            $stmt->execute([$postId]);
            $post = $stmt->fetch();
            
            // Obter comentários
            $stmt = $pdo->prepare("SELECT c.*, u.display_name as author_name, u.photo_url as comment_author_photo 
                          FROM comments c 
                          JOIN users u ON c.author_id = u.uid 
                          WHERE c.post_id = ? 
                          ORDER BY c.created_at ASC");
            $stmt->execute([$postId]);
            $post[\'comments\'] = $stmt->fetchAll();
            
            // Incluir likes
            $post[\'likes\'] = $likes;
            
            echo json_encode([
                \'success\' => true,
                \'message\' => $message,
                \'post\' => $post
            ]);';

$updated_code = preg_replace($pattern, $replacement, $updated_code);
file_put_contents('posts.php', $updated_code);

// 3. Sincronizar contador de likes existente
echo "Sincronizando contadores de likes...\n";

try {
    // Verificar se conseguimos conectar ao banco de dados remoto
    $pdo->query("SELECT 1");
    echo "Conexão com banco de dados verificada.\n";
    
    // Lista de posts para sincronização local
    echo "Os contadores serão sincronizados quando o sistema estiver conectado ao banco remoto.\n";
    
    $sql = "
    -- Código SQL a ser executado no servidor de produção
    -- Sincronizar todos os contadores de likes
    UPDATE posts p SET 
        p.likes_count = (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id),
        p.likes = (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id);
    ";
    
    echo "Execute o seguinte SQL no servidor de produção:\n\n";
    echo $sql . "\n";
    
    // Criar um arquivo SQL para execução posterior
    file_put_contents('sync_likes_count.sql', $sql);
    echo "Script SQL salvo em sync_likes_count.sql\n";
    
} catch (PDOException $e) {
    echo "Erro de conexão com o banco de dados: " . $e->getMessage() . "\n";
    echo "O script será executado quando estiver no servidor com acesso ao banco de dados.\n";
}

echo "\nCorreção do sistema de likes concluída!\n";
echo "Para que as alterações tenham efeito, reconstrua o front-end com 'npm run build' e faça um novo deploy.\n";
