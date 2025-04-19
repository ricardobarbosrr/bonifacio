<?php
// Script para testar o endpoint de anúncios

require_once 'config.php';

// Testar a criação da tabela de anúncios caso ela não exista
try {
    global $pdo;
    
    echo "<h2>Testando criação da tabela de anúncios</h2>";
    
    // Verificar se a tabela existe
    $tables = $pdo->query("SHOW TABLES LIKE 'announcements'")->fetchAll();
    
    if (count($tables) == 0) {
        echo "<p>A tabela 'announcements' não existe, criando...</p>";
        
        // Ler o arquivo SQL
        $sql = file_get_contents(__DIR__ . '/sql/create_announcements_table.sql');
        
        // Executar os comandos SQL
        $pdo->exec($sql);
        
        echo "<p style='color: green;'>Tabela criada com sucesso!</p>";
    } else {
        echo "<p>A tabela 'announcements' já existe.</p>";
    }
    
    // Inserir alguns dados de teste se a tabela estiver vazia
    $count = $pdo->query("SELECT COUNT(*) FROM announcements")->fetchColumn();
    
    if ($count == 0) {
        echo "<p>Inserindo dados de teste na tabela...</p>";
        
        // Obter um usuário administrador do sistema para usar como criador
        $admin = $pdo->query("SELECT uid FROM users WHERE is_admin = 1 LIMIT 1")->fetch();
        
        if (!$admin) {
            echo "<p style='color: orange;'>Aviso: Nenhum administrador encontrado. Usando 'system' como criador.</p>";
            $createdBy = 'system';
        } else {
            $createdBy = $admin['uid'];
        }
        
        // Inserir alguns anúncios de exemplo
        $announcements = [
            [
                'id' => 'annc_' . uniqid(),
                'title' => 'Bem-vindos à Corporação Monárquica',
                'content' => 'Estamos felizes em ter você aqui. Esta é a nova plataforma de comunicação da nossa corporação.',
                'important' => 1,
                'background_color' => '#e3f2fd',
                'text_color' => '#0d47a1',
                'created_at' => date('Y-m-d H:i:s', strtotime('-2 days')),
                'created_by' => $createdBy,
                'read_by' => '[]'
            ],
            [
                'id' => 'annc_' . uniqid(),
                'title' => 'Manutenção Programada',
                'content' => 'Informamos que o sistema estará em manutenção no próximo domingo, das 23h às 5h.',
                'important' => 0,
                'background_color' => '#fff3e0',
                'text_color' => '#e65100',
                'created_at' => date('Y-m-d H:i:s', strtotime('-1 day')),
                'created_by' => $createdBy,
                'read_by' => '[]'
            ],
            [
                'id' => 'annc_' . uniqid(),
                'title' => 'Nova Funcionalidade: Upload de Fotos',
                'content' => 'Agora você pode fazer upload de fotos de perfil diretamente do seu dispositivo local!',
                'important' => 0,
                'background_color' => '#e8f5e9',
                'text_color' => '#2e7d32',
                'created_at' => date('Y-m-d H:i:s'),
                'created_by' => $createdBy,
                'read_by' => '[]'
            ]
        ];
        
        $stmt = $pdo->prepare("
            INSERT INTO announcements (
                id, title, content, important, background_color, 
                text_color, created_at, created_by, read_by
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        ");
        
        foreach ($announcements as $announcement) {
            $stmt->execute([
                $announcement['id'],
                $announcement['title'],
                $announcement['content'],
                $announcement['important'],
                $announcement['background_color'],
                $announcement['text_color'],
                $announcement['created_at'],
                $announcement['created_by'],
                $announcement['read_by']
            ]);
        }
        
        echo "<p style='color: green;'>Dados de teste inseridos com sucesso!</p>";
    } else {
        echo "<p>A tabela 'announcements' já contém {$count} registros.</p>";
    }
    
    // Exibir alguns anúncios
    echo "<h2>Anúncios existentes</h2>";
    
    $announcements = $pdo->query("SELECT * FROM announcements ORDER BY created_at DESC LIMIT 10")->fetchAll();
    
    if (count($announcements) > 0) {
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr>
                <th>ID</th>
                <th>Título</th>
                <th>Conteúdo</th>
                <th>Importante</th>
                <th>Cores</th>
                <th>Criado em</th>
                <th>Criado por</th>
              </tr>";
        
        foreach ($announcements as $announcement) {
            echo "<tr>";
            echo "<td>{$announcement['id']}</td>";
            echo "<td>{$announcement['title']}</td>";
            echo "<td>" . substr($announcement['content'], 0, 50) . (strlen($announcement['content']) > 50 ? '...' : '') . "</td>";
            echo "<td>" . ($announcement['important'] ? 'Sim' : 'Não') . "</td>";
            echo "<td>BG: {$announcement['background_color']}, Text: {$announcement['text_color']}</td>";
            echo "<td>{$announcement['created_at']}</td>";
            echo "<td>{$announcement['created_by']}</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p>Nenhum anúncio encontrado.</p>";
    }
    
    echo "<h2>Links para Testes</h2>";
    
    $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]" . dirname($_SERVER['PHP_SELF']);
    
    echo "<ul>";
    echo "<li><a href='{$baseUrl}/announcements.php' target='_blank'>Listar todos os anúncios (GET)</a></li>";
    echo "<li>Para testar outras operações (POST, PUT, DELETE), use ferramentas como Postman ou curl.</li>";
    echo "</ul>";
    
    echo "<p>Exemplo de comando curl para obter anúncios:</p>";
    echo "<pre>curl -X GET {$baseUrl}/announcements.php</pre>";
    
} catch (PDOException $e) {
    echo "<h3 style='color: red;'>Erro ao testar anúncios:</h3>";
    echo "<p>{$e->getMessage()}</p>";
}
