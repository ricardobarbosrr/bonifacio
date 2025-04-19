<?php
// Função para gerar ID único
function generateUniqueId($prefix = '') {
    return uniqid($prefix);
}

// Função para obter timestamp atual
function getCurrentTimestamp() {
    return date('Y-m-d H:i:s');
}

// Função para validar email
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Função para sanitizar string
function sanitizeString($str) {
    return htmlspecialchars(strip_tags($str), ENT_QUOTES, 'UTF-8');
}

// Função para validar upload de arquivo
function validateFileUpload($file, $allowedTypes, $maxSize) {
    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        throw new Exception('Arquivo inválido');
    }
    
    $fileInfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($fileInfo, $file['tmp_name']);
    finfo_close($fileInfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Tipo de arquivo não permitido');
    }
    
    if ($file['size'] > $maxSize) {
        throw new Exception('Arquivo muito grande');
    }
    
    return true;
}

// Função para mover arquivo uploadado
function moveUploadedFile($file, $destination) {
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        throw new Exception('Erro ao mover arquivo');
    }
    return true;
}
