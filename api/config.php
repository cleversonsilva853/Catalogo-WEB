<?php
// ============================================================
// config.php — Conexão com MySQL (HostGator)
// NÃO suba este arquivo para um repositório público!
// ============================================================

define('DB_HOST', getenv('DB_HOST') ?: 'localhost:3306');
define('DB_NAME', getenv('DB_NAME') ?: 'clev2092_catalogo_db');
define('DB_USER', getenv('DB_USER') ?: 'catalogcleve');
define('DB_PASS', getenv('DB_PASS') ?: 'Ferreira1998@');
define('DB_CHARSET', 'utf8mb4');

// Chave secreta para assinar os tokens JWT
// TROQUE para uma string longa e aleatória!
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'Cleverson1998@');
define('JWT_EXPIRY', 60 * 60 * 8); // 8 horas

// URL base da API (sem barra final)
define('BASE_URL', getenv('BASE_URL') ?: 'https://api.deliverygrill.infornexa.com.br');

// Diretório absoluto da raiz do servidor para a pasta da API (subdomínio)
define('API_ROOT', __DIR__);

// Origem permitida para o CORS (o seu Frontend em React)
define('ALLOWED_ORIGIN', 'https://deliverygrill.infornexa.com.br');
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('UPLOAD_URL', BASE_URL . '/uploads/');

// CORS — domínio do seu frontend React
define('ALLOWED_ORIGIN', getenv('ALLOWED_ORIGIN') ?: '*');

// ============================================================
// Função de conexão PDO (singleton)
// ============================================================
function getDB(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }
    return $pdo;
}
