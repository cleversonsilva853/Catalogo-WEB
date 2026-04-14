<?php
// ============================================================
// routes/order_items.php — Itens dos pedidos
// ============================================================

$db = getDB();

if ($method === 'GET') {
    require_auth();

    if ($id) {
        // GET /order-items/{orderId} — itens de um pedido específico
        $stmt = $db->prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC');
        $stmt->execute([$id]);
        respond($stmt->fetchAll());
    }

    // GET /order-items — todos os itens (com paginação básica)
    $limit = min((int)($_GET['limit'] ?? 50), 200);
    $stmt  = $db->query("SELECT * FROM order_items ORDER BY created_at DESC LIMIT $limit");
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    require_auth();
    $b = get_body();

    if (empty($b['order_id']) || empty($b['product_name']) || !isset($b['quantity']) || !isset($b['unit_price'])) {
        respond_error('Campos obrigatórios: order_id, product_name, quantity, unit_price', 422);
    }

    $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000, mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff));

    $db->prepare(
        'INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, observation, addons)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $uuid,
        $b['order_id'],
        $b['product_id'] ?? null,
        $b['product_name'],
        (int)$b['quantity'],
        (float)$b['unit_price'],
        $b['observation'] ?? null,
        isset($b['addons']) ? json_encode($b['addons']) : null,
    ]);

    $stmt = $db->prepare('SELECT * FROM order_items WHERE id = ?');
    $stmt->execute([$uuid]);
    respond($stmt->fetch(), 201);
}

if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM order_items WHERE id = ?')->execute([$id]);
    respond(['message' => 'Item removido']);
}

respond_error('Método não permitido', 405);
