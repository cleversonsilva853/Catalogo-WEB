<?php
// ============================================================
// index.php — Roteador principal da API
// ============================================================

// Carregar configurações ANTES dos headers (ALLOWED_ORIGIN precisa estar definido)
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/jwt.php';

// Headers CORS
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Pre-flight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


// Ativar exibição de erros críticos em JSON no PHP
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    if (defined('ALLOWED_ORIGIN')) {
        header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
    }
    http_response_code(500);
    echo json_encode(["error" => "PHP Error: $errstr in $errfile:$errline"]);
    exit;
});

set_exception_handler(function($e) {
    if (defined('ALLOWED_ORIGIN')) {
        header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
    }
    http_response_code(500);
    echo json_encode(["error" => "Exception: " . $e->getMessage(), "trace" => $e->getTraceAsString()]);
    exit;
});

// Utilitário: resposta JSON padronizada
function respond($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function respond_error(string $msg, int $status = 400): void
{
    respond(['error' => $msg], $status);
}

// Body JSON da requisição
function get_body(): array
{
    static $body = null;
    if ($body === null) {
        $raw = file_get_contents('php://input');
        $body = $raw ? (json_decode($raw, true) ?? []) : [];
    }
    return $body;
}

// Roteamento por URI
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

$scriptName = dirname($_SERVER['SCRIPT_NAME']);
if ($scriptName !== '/' && $scriptName !== '\\' && strpos($uri, $scriptName) === 0) {
    $uri = substr($uri, strlen($scriptName));
}

// Garante que a URI comece com / e limpa o final
$uri = '/' . ltrim($uri, '/');
$uri = rtrim($uri, '/') ?: '/';

// Extrai segmentos
$segments = array_values(array_filter(explode('/', ltrim($uri, '/'))));
$resource = $segments[0] ?? '';

// Remove prefixo /api se existir
$uri = preg_replace('#^/api#', '', $uri);
$uri = rtrim($uri, '/') ?: '/';

// Extrai segmentos: /products/abc123 → ['products', 'abc123']
$segments = array_values(array_filter(explode('/', ltrim($uri, '/'))));
$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;
$sub = $segments[2] ?? null;

switch ($resource) {
    case 'auth':
        require __DIR__ . '/routes/auth.php';
        break;
    case 'dashboard':
        require __DIR__ . '/routes/dashboard.php';
        break;
    case 'products':
        require __DIR__ . '/routes/products.php';
        break;
    case 'categories':
        require __DIR__ . '/routes/categories.php';
        break;
    case 'orders':
        require __DIR__ . '/routes/orders.php';
        break;
    case 'order-items':
        require __DIR__ . '/routes/order_items.php';
        break;
    case 'addons':
        require __DIR__ . '/routes/addons.php';
        break;
    case 'ingredients':
        require __DIR__ . '/routes/ingredients.php';
        break;
    case 'drivers':
        require __DIR__ . '/routes/drivers.php';
        break;
    case 'delivery-zones':
        require __DIR__ . '/routes/delivery_zones.php';
        break;
    case 'business-hours':
        require __DIR__ . '/routes/business_hours.php';
        break;
    case 'coupons':
        require __DIR__ . '/routes/coupons.php';
        break;
    case 'store':
        require __DIR__ . '/routes/store.php';
        break;
    case 'caixa':
        require __DIR__ . '/routes/caixa.php';
        break;
    case 'comandas':
        require __DIR__ . '/routes/comandas.php';
        break;
    case 'admin-users':
        require __DIR__ . '/routes/admin_users.php';
        break;
    case 'customer-addresses':
        require __DIR__ . '/routes/customer_addresses.php';
        break;
    case 'uploads':
        require __DIR__ . '/routes/uploads.php';
        break;
    case 'backup':
        require __DIR__ . '/routes/backup.php';
        break;
    case 'push':
        require __DIR__ . '/routes/push.php';
        break;
    case 'table-orders':
    case 'table_orders':
        require __DIR__ . '/routes/table_orders.php';
        break;
    case 'table-order-items':
    case 'table_order_items':
        require __DIR__ . '/routes/table_order_items.php';
        break;
    case 'tables':
        require __DIR__ . '/routes/tables.php';
        break;

    case '':
    case 'health':
        respond(['status' => 'ok', 'version' => '1.0.0']);
        break; // Adicione isso por segurança
    default:
        respond_error('Rota não encontrada', 404);
}
