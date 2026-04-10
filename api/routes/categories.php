<?php
// ============================================================
// routes/categories.php — CRUD de categorias
// ============================================================
$db = getDB();

if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare('SELECT * FROM categories WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) respond_error('Categoria não encontrada', 404);
        respond($row);
    }
    $stmt = $db->query('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    require_auth();
    $b = get_body();
    if (empty($b['name'])) respond_error('Nome é obrigatório', 422);

    $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));

    $db->prepare('INSERT INTO categories (id,name,sort_order,image_url) VALUES (?,?,?,?)')
       ->execute([$uuid, $b['name'], $b['sort_order'] ?? 0, $b['image_url'] ?? null]);

    $stmt = $db->prepare('SELECT * FROM categories WHERE id = ?');
    $stmt->execute([$uuid]);
    respond($stmt->fetch(), 201);
}

if ($method === 'PUT' && $id) {
    require_auth();
    $b = get_body();
    $fields = []; $params = [];
    foreach (['name','sort_order','image_url'] as $f) {
        if (array_key_exists($f, $b)) { $fields[] = "$f = ?"; $params[] = $b[$f]; }
    }
    if (!$fields) respond_error('Nenhum campo para atualizar', 422);
    $params[] = $id;
    $db->prepare('UPDATE categories SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    $stmt = $db->prepare('SELECT * FROM categories WHERE id = ?');
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);
    respond(['message' => 'Categoria removida']);
}

respond_error('Método não permitido', 405);
