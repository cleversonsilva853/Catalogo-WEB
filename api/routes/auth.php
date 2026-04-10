<?php
// ============================================================
// routes/auth.php — Login e autenticação
// ============================================================

$action = $segments[1] ?? '';

if ($method === 'POST' && $action === 'login') {
    $body     = get_body();
    $usuario  = trim($body['usuario'] ?? '');
    $senha    = $body['senha'] ?? '';

    if (!$usuario || !$senha) {
        respond_error('Usuário e senha são obrigatórios', 422);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM admin_users WHERE usuario = ? LIMIT 1');
    $stmt->execute([$usuario]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($senha, $user['senha'])) {
        respond_error('Usuário ou senha incorretos', 401);
    }

    $token = jwt_generate([
        'sub'     => $user['id'],
        'usuario' => $user['usuario'],
        'role'    => 'admin',
    ]);

    // Remove senha do retorno
    unset($user['senha']);

    respond(['token' => $token, 'user' => $user]);
}

if ($method === 'POST' && ($action === 'register' || $action === 'signup')) {
    $body     = get_body();
    // Suporta tanto o padrão auth antigo do site quanto o novo
    $usuario  = trim($body['email'] ?? $body['usuario'] ?? '');
    $senha    = $body['password'] ?? $body['senha'] ?? '';

    if (!$usuario || !$senha) {
        respond_error('Email/Usuário e senha são obrigatórios', 422);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id FROM admin_users WHERE usuario = ? LIMIT 1');
    $stmt->execute([$usuario]);
    if ($stmt->fetch()) {
        respond_error('Este usuário/email já está cadastrado no sistema.', 409);
    }

    $hash = password_hash($senha, PASSWORD_BCRYPT);
    // UUID v4 helper
    $id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );

    $stmtInsert = $db->prepare('INSERT INTO admin_users (id, usuario, senha) VALUES (?, ?, ?)');
    $stmtInsert->execute([$id, $usuario, $hash]);

    respond(['message' => 'Conta criada com sucesso!'], 201);
}

if ($method === 'GET' && $action === 'me') {
    $payload = require_auth();
    $db      = getDB();
    $stmt    = $db->prepare('SELECT * FROM admin_users WHERE id = ? LIMIT 1');
    $stmt->execute([$payload['sub']]);
    $user = $stmt->fetch();

    if (!$user) respond_error('Usuário não encontrado', 404);

    unset($user['senha']);
    respond($user);
}

// Rota de troca de senha
if ($method === 'POST' && $action === 'change-password') {
    $payload    = require_auth();
    $body       = get_body();
    $novaSenha  = $body['nova_senha'] ?? '';

    if (strlen($novaSenha) < 6) {
        respond_error('A nova senha deve ter no mínimo 6 caracteres', 422);
    }

    $hash = password_hash($novaSenha, PASSWORD_BCRYPT);
    $db   = getDB();
    $db->prepare('UPDATE admin_users SET senha = ? WHERE id = ?')
       ->execute([$hash, $payload['sub']]);

    respond(['message' => 'Senha alterada com sucesso']);
}

respond_error('Rota de autenticação não encontrada', 404);
