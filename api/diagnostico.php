<?php
// ============================================================
// diagnostico.php — REMOVA APÓS USAR! (segurança)
// Acesse: https://api.deliverygrill.infornexa.com.br/diagnostico.php
// ============================================================
header('Content-Type: application/json; charset=utf-8');

$result = [];

// 1. Versão do PHP
$result['php_version'] = PHP_VERSION;
$result['php_version_ok'] = version_compare(PHP_VERSION, '8.0', '>=');

// 2. Extensões necessárias
$exts = ['pdo', 'pdo_mysql', 'json', 'mbstring', 'openssl'];
foreach ($exts as $ext) {
    $result['extensions'][$ext] = extension_loaded($ext);
}

// 3. Teste de conexão MySQL
// Usa as mesmas credenciais do config.php da API
require_once __DIR__ . '/config.php';

$host   = DB_HOST;
$dbname = DB_NAME;
$user   = DB_USER;
$pass   = DB_PASS;

$result['db_user_sendo_usado'] = $user;
$result['db_name_sendo_usado'] = $dbname;
$result['db_host_sendo_usado'] = $host;


try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $result['db_connection'] = 'OK';

    // 4. Verificar se tabela admin_users existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'admin_users'");
    $result['table_admin_users_exists'] = $stmt->rowCount() > 0;

    // 5. Verificar se existe algum usuário na tabela
    $stmt2 = $pdo->query("SELECT COUNT(*) as total FROM admin_users");
    $row = $stmt2->fetch(PDO::FETCH_ASSOC);
    $result['admin_users_count'] = (int)$row['total'];

    // 6. Listar usuários (sem senha)
    $stmt3 = $pdo->query("SELECT id, usuario, login_email, created_at FROM admin_users LIMIT 5");
    $result['admin_users_list'] = $stmt3->fetchAll(PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    $result['db_connection'] = 'ERRO: ' . $e->getMessage();
    $result['table_admin_users_exists'] = false;
}

// 7. Verificar JWT_SECRET (variável de ambiente)
$jwtSecret = getenv('JWT_SECRET');
$result['jwt_secret_env'] = $jwtSecret !== false && $jwtSecret !== '' ? 'DEFINIDO' : 'VAZIO/NÃO DEFINIDO';

// 8. Verificar suporte a "never" (PHP 8.1+)
$result['supports_never_return_type'] = version_compare(PHP_VERSION, '8.1', '>=');

// 9. mod_rewrite
$result['mod_rewrite'] = function_exists('apache_get_modules')
    ? in_array('mod_rewrite', apache_get_modules())
    : 'não verificável via PHP';

// 10. Caminho atual
$result['__dir__'] = __DIR__;

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
