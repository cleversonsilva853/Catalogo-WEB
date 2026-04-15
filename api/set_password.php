<?php
// ============================================================
// set_password.php — REMOVA APÓS USAR!
// Acesse: https://api.deliverygrill.infornexa.com.br/set_password.php
// ============================================================
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

$novaSenha = 'admin123'; // Troque aqui se quiser outra senha
$usuario   = 'admin';

$hash = password_hash($novaSenha, PASSWORD_BCRYPT);

try {
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS);
    $pdo->prepare('UPDATE admin_users SET senha = ? WHERE usuario = ?')
        ->execute([$hash, $usuario]);

    echo json_encode([
        'sucesso' => true,
        'mensagem' => "Senha do usuário '$usuario' atualizada para '$novaSenha'",
        'hash_gerado' => $hash,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(['erro' => $e->getMessage()]);
}
