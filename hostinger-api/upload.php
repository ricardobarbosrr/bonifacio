<?php
// Carregar dependências
require_once __DIR__ . '/bootstrap.php';

// Processar upload de imagem
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $user = verifyAuthentication();
    
        // Verificar se foi enviado um arquivo
        if (!isset($_FILES['image'])) {
            throw new Exception('Nenhuma imagem enviada');
        }
        
        // Validar upload
        validateFileUpload($_FILES['image'], $upload_config['allowed_types'], $upload_config['max_size']);
        
        $file = $_FILES['image'];
        $fileName = $file['name'];
        $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    // Verificar tamanho do arquivo
    if ($fileSize > $upload_max_size) {
        http_response_code(400);
        echo json_encode(['error' => 'Arquivo muito grande. O tamanho máximo é ' . ($upload_max_size / 1024 / 1024) . 'MB']);
        exit;
    }
    
    // Definir pasta de destino para imagens (tanto posts quanto perfil)
    $upload_images_dir = 'imagenspost';
    
    // Verificar se diretório existe, senão criar
    if (!file_exists($upload_images_dir) && !is_dir($upload_images_dir)) {
        mkdir($upload_images_dir, 0755, true);
    }
    
    // Verificar se é uma foto de perfil
    $isProfilePhoto = isset($_POST['type']) && $_POST['type'] === 'profile';
    
    // Gerar nome único para o arquivo
    $prefix = $isProfilePhoto ? 'profile_' : 'img_';
    $newFileName = $prefix . uniqid() . '_' . time() . '.' . $fileExt;
    $uploadPath = $upload_images_dir . '/' . $newFileName;
    
    // Mover o arquivo para a pasta de uploads
    if (move_uploaded_file($fileTmpName, $uploadPath)) {
        // Gerar URL completa da imagem
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
        $host = $_SERVER['HTTP_HOST'];
        $path = dirname($_SERVER['PHP_SELF']);
        $imageUrl = $protocol . $host . rtrim($path, '/') . '/' . $uploadPath;
        
        // Se for foto de perfil, atualizar o perfil do usuário
        if ($isProfilePhoto) {
            try {
                $stmt = $pdo->prepare("UPDATE users SET photo_url = ? WHERE uid = ?");
                $stmt->execute([$imageUrl, $user['uid']]);
    }
    
    // Mover arquivo
    moveUploadedFile($file, $uploadPath);
    
    // Retornar URL do arquivo
    $fileUrl = 'https://corpbonifacio.com.br/api/' . $upload_config['dir'] . '/' . $uniqueName;
    echo json_encode(['url' => $fileUrl]);
    } catch (Exception $e) {
        http_response_code($e->getCode() ?: 400);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// Se chegou aqui, método não permitido
http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
exit;
