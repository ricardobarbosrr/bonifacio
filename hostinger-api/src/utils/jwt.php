<?php
// Função para gerar token JWT
function generateJwtToken($uid) {
    global $security_config;
    
    $issuedAt = time();
    $expire = $issuedAt + $security_config['jwt_expiration'];
    
    $payload = [
        'uid' => $uid,
        'iat' => $issuedAt,
        'exp' => $expire
    ];
    
    return jwtEncode($payload, $security_config['jwt_secret']);
}

// Função para verificar token JWT
function verifyJwtToken($token) {
    global $security_config;
    return jwtDecode($token, $security_config['jwt_secret']);
}

// Função para codificar JWT
function jwtEncode($payload, $secret) {
    $header = base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64UrlEncode(json_encode($payload));
    $signature = hash_hmac('sha256', $header . "." . $payload, $secret, true);
    $signature = base64UrlEncode($signature);
    return $header . "." . $payload . "." . $signature;
}

// Função para decodificar JWT
function jwtDecode($token, $secret) {
    list($header, $payload, $signature) = explode(".", $token);
    
    $decodedHeader = json_decode(base64UrlDecode($header), true);
    $decodedPayload = json_decode(base64UrlDecode($payload), true);
    
    if ($decodedHeader['alg'] !== 'HS256') {
        throw new Exception('Algoritmo de assinatura inválido');
    }
    
    $expectedSignature = hash_hmac('sha256', $header . "." . $payload, $secret, true);
    $expectedSignature = base64UrlEncode($expectedSignature);
    
    if ($signature !== $expectedSignature) {
        throw new Exception('Assinatura inválida');
    }
    
    if ($decodedPayload['exp'] < time()) {
        throw new Exception('Token expirado');
    }
    
    return $decodedPayload;
}

// Função auxiliar para codificação URL-safe base64
function base64UrlEncode($data) {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}

// Função auxiliar para decodificação URL-safe base64
function base64UrlDecode($data) {
    return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
}
