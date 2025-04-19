<?php
// Arquivo de deploy automático para Hostinger
// Coloque este arquivo na raiz do seu site

// Carregar variáveis de ambiente
if (file_exists(__DIR__ . '/.env')) {
    $envFile = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($envFile as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            putenv("$name=$value");
            $_ENV[$name] = $value;
        }
    }
}

// Função para obter variáveis de ambiente
function env($key, $default = null) {
    $value = getenv($key);
    return $value !== false ? $value : $default;
}

// Log de atividades
function logMessage($message) {
    $logFile = __DIR__ . '/' . env('DEPLOY_LOG_FILE', 'deploy-log.txt');
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message" . PHP_EOL, FILE_APPEND);
}

// Configurações
$branch = env('DEPLOY_BRANCH', 'main'); // Branch que será usada para deploy
$secret = env('DEPLOY_SECRET_KEY', 'corpbonifacio2025'); // Chave secreta para validar o webhook

// Validação da requisição
$headers = getallheaders();
$hubSignature = isset($headers['X-Hub-Signature-256']) ? $headers['X-Hub-Signature-256'] : '';

// Se não for um POST ou não tiver assinatura, rejeita
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($hubSignature)) {
    http_response_code(403);
    logMessage("Acesso não autorizado: método inválido ou sem assinatura");
    die('Acesso não autorizado');
}

// Obtém o payload
$payload = file_get_contents('php://input');
if (empty($payload)) {
    http_response_code(400);
    logMessage("Payload vazio");
    die('Payload vazio');
}

// Verifica a assinatura (descomente quando configurar o webhook no GitHub)
// $calculatedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);
// if (!hash_equals($hubSignature, $calculatedSignature)) {
//     http_response_code(403);
//     logMessage("Assinatura inválida");
//     die('Assinatura inválida');
// }

// Decodifica o payload
$data = json_decode($payload, true);

// Verifica se é um push para a branch correta
if (!isset($data['ref']) || $data['ref'] !== "refs/heads/$branch") {
    http_response_code(202);
    logMessage("Ignorando evento: não é um push para a branch $branch");
    die("Ignorando evento: não é um push para a branch $branch");
}

// Executa o script de deploy
$output = [];
$return_var = 0;

// Caminho para o script de deploy
$deployScript = __DIR__ . '/' . env('DEPLOY_SCRIPT', 'deploy.sh');

// Verifica se o script existe e é executável
if (!file_exists($deployScript)) {
    http_response_code(500);
    logMessage("Erro: Script de deploy não encontrado em $deployScript");
    die("Erro: Script de deploy não encontrado");
}

// Executa o script
exec("bash $deployScript 2>&1", $output, $return_var);

// Registra a saída
$outputText = implode("\n", $output);
logMessage("Resultado do deploy (código $return_var):\n$outputText");

// Responde com sucesso
http_response_code(200);
echo "🚀 Deploy concluído!\n";
echo "Resultado: $outputText";
