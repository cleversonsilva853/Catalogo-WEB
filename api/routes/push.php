<?php
// ============================================================
// routes/push.php — Push Notifications (Web Push subscriptions)
// ============================================================
$db = getDB();

function push_uuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));
}

// GET /push — listar subscriptions (admin)
if ($method === 'GET') {
    require_auth();
    $stmt = $db->query('SELECT id, endpoint, created_at FROM push_subscriptions ORDER BY created_at DESC');
    respond($stmt->fetchAll());
}

// POST /push/subscribe — registrar subscription do browser
if ($method === 'POST' && ($id === 'subscribe' || $id === null)) {
    $b = get_body();
    if (empty($b['endpoint']) || empty($b['p256dh']) || empty($b['auth'])) {
        respond_error('Campos obrigatórios: endpoint, p256dh, auth', 422);
    }

    // Verifica se já existe
    $stmt = $db->prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?');
    $stmt->execute([$b['endpoint']]);
    if ($stmt->fetch()) {
        respond(['message' => 'Subscription já registrada']);
    }

    $uuid = push_uuid();
    $db->prepare('INSERT INTO push_subscriptions (id, endpoint, p256dh, auth_key) VALUES (?,?,?,?)')
       ->execute([$uuid, $b['endpoint'], $b['p256dh'], $b['auth']]);

    respond(['message' => 'Subscription registrada com sucesso', 'id' => $uuid], 201);
}

// DELETE /push/{id} — remover subscription
if ($method === 'DELETE' && $id) {
    $db->prepare('DELETE FROM push_subscriptions WHERE id = ?')->execute([$id]);
    respond(['message' => 'Subscription removida']);
}

// POST /push/unsubscribe — remover por endpoint
if ($method === 'POST' && $id === 'unsubscribe') {
    $b = get_body();
    if (empty($b['endpoint'])) respond_error('endpoint é obrigatório', 422);
    $db->prepare('DELETE FROM push_subscriptions WHERE endpoint = ?')->execute([$b['endpoint']]);
    respond(['message' => 'Subscription removida']);
}

respond_error('Rota push não encontrada', 404);
