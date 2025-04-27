<?php
/**
 * Utilidades para manipulação de JWT (JSON Web Tokens)
 * 
 * Estas funções permitem codificar e decodificar tokens JWT
 * para autenticação sem sessão do lado do servidor
 */

/**
 * Codifica um payload em um token JWT
 * 
 * @param array $payload Dados a serem codificados no token
 * @param string $secret Chave secreta para assinatura
 * @return string Token JWT
 */
function jwtEncode($payload, $secret) {
    // Cabeçalho
    $header = [
        'typ' => 'JWT',
        'alg' => 'HS256'
    ];
    
    // Codificar cabeçalho e payload para Base64Url
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($header)));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
    
    // Criar assinatura
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    // Montar o token
    $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    
    return $jwt;
}

/**
 * Decodifica um token JWT e valida sua assinatura
 * 
 * @param string $token Token JWT
 * @param string $secret Chave secreta usada na assinatura
 * @return array|false Payload decodificado ou false se inválido
 */
function jwtDecode($token, $secret) {
    // Dividir o token em partes
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        return false;
    }
    
    list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
    
    // Decodificar cabeçalho e payload
    $header = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlHeader)), true);
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlPayload)), true);
    $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlSignature));
    
    // Verificar assinatura
    $expectedSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    
    if (!hash_equals($expectedSignature, $signature)) {
        return false;
    }
    
    // Verificar expiração
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false;
    }
    
    return $payload;
}

/**
 * Gera um token JWT para autenticação de usuário
 * 
 * @param string $userId ID do usuário
 * @param array $userData Dados adicionais do usuário (opcional)
 * @param string $secret Chave secreta para assinatura
 * @param int $expiration Tempo de expiração em segundos (default: 7 dias)
 * @return string Token JWT
 */
function generateJwtToken($userId, $userData = [], $secret = null, $expiration = null) {
    // Usar valores padrão se não fornecidos
    $secret = $secret ?: 'bonifacio_super_secure_jwt_secret_key';
    $expiration = $expiration ?: 86400 * 7; // 7 dias em segundos
    
    $issuedAt = time();
    $expire = $issuedAt + $expiration;
    
    // Criar payload com claims padrão
    $payload = [
        'sub' => $userId, // subject (ID do usuário)
        'iat' => $issuedAt, // issued at (quando o token foi emitido)
        'exp' => $expire, // expiration time (quando o token expira)
        'data' => $userData // dados adicionais do usuário
    ];
    
    return jwtEncode($payload, $secret);
}

/**
 * Verifica e decodifica um token JWT
 * 
 * @param string $token Token JWT
 * @param string $secret Chave secreta usada na assinatura
 * @return array Payload decodificado
 * @throws Exception Se o token for inválido
 */
function verifyJwtToken($token, $secret = null) {
    // Usar valor padrão se não fornecido
    $secret = $secret ?: 'bonifacio_super_secure_jwt_secret_key';
    
    $payload = jwtDecode($token, $secret);
    
    if (!$payload) {
        throw new Exception('Token inválido ou expirado');
    }
    
    return $payload;
}
